import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.HELD_TEST_URL || "http://127.0.0.1:8787";
const browser = await chromium.launch({ headless: true, channel: "chromium" });
const events = [];
const errors = [];
let transfers = 0;
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.url().includes("/weights/") && r.url().endsWith(".bin")) transfers++;
  });
  page.on("websocket", (ws) => {
    ws.on("framesent", (f) => {
      try {
        events.push(JSON.parse(String(f.payload)));
      } catch {}
    });
    ws.on("framereceived", (f) => {
      try {
        const d = JSON.parse(String(f.payload));
        if (d.type === "pipeline_assign") events.push(d);
      } catch {}
    });
  });
  await page.goto(base);
  await page
    .locator('.your-contribution[data-compute-status="ready"]')
    .waitFor({ timeout: 120000 });
  assert.ok(transfers > 0, "Fresh untouched visit loads actual weights");
  assert.equal(events.find((e) => e.type === "pipeline_offer").duty, 0.05);
  assert.equal(
    events.find((e) => e.type === "pipeline_assign").piece.end -
      events.find((e) => e.type === "pipeline_assign").piece.start,
    2,
  );
  await page.getByRole("button", { name: "More compute" }).click();
  await page.getByRole("button", { name: "More compute" }).waitFor();
  await page
    .locator('.your-contribution[data-compute-status="ready"]')
    .waitFor({ timeout: 120000 });
  await expect
    .poll(() => events.filter((e) => e.type === "pipeline_offer").at(-1).duty)
    .toBe(0.1);
  await page
    .locator('.your-contribution[data-compute-status="ready"]')
    .waitFor({ timeout: 120000 });
  const more = events.filter((e) => e.type === "pipeline_assign").at(-1).piece;
  assert.equal(more.end - more.start, 4);
  await page.getByRole("button", { name: "Most compute" }).click();
  await page
    .locator('.your-contribution[data-compute-status="ready"]')
    .waitFor({ timeout: 120000 });
  assert.equal(
    events.filter((e) => e.type === "pipeline_offer").at(-1).duty,
    0.2,
  );
  const most = events.filter((e) => e.type === "pipeline_assign").at(-1).piece;
  assert.equal(most.end - most.start, 8);
  await page.reload();
  await page
    .locator('.your-contribution[data-compute-status="ready"]')
    .waitFor({ timeout: 120000 });
  await expect(
    page.getByRole("button", { name: "Most compute" }),
  ).toHaveAttribute("aria-pressed", "true");
  await mkdir(".local/qa/edition07", { recursive: true });
  await page.screenshot({
    path: ".local/qa/edition07/contribution.png",
    fullPage: true,
  });
  const now = Date.now();
  await page.clock.setFixedTime(now + 600001);
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "More compute" }).waitFor();
  await page
    .locator('.your-contribution[data-compute-status="ready"]')
    .waitFor({ timeout: 120000 });
  assert.equal(
    events.filter((e) => e.type === "pipeline_offer").at(-1).duty,
    0.05,
    "Expiry returns to gentle automatically",
  );
  await page.getByRole("button", { name: "Watch only", exact: true }).click();
  await page.getByText("You’re just watching", { exact: true }).waitFor();
  const before = transfers;
  await page.reload();
  await page.getByText("You’re just watching", { exact: true }).waitFor();
  await page.waitForTimeout(1500);
  assert.equal(transfers, before, "Saved Pause makes no weight requests");
  assert.equal(
    await page.evaluate(() => localStorage.getItem("held-participation")),
    "watch",
  );
  assert.deepEqual(errors, []);
  await writeFile(
    ".local/qa/edition07/contribution-result.json",
    JSON.stringify(
      {
        transfers,
        offers: events.filter((e) => e.type === "pipeline_offer"),
        assignments: events.filter((e) => e.type === "pipeline_assign"),
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: untouched visit loads two real layers; More loads four at 10%, Most loads eight at 20% and survives reload; ten-minute expiry returns to 5%; Pause persists without fetching weights.",
  );
} finally {
  await browser.close();
}
