// Actual inference only. This never flips launch support or injects model output.
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.HELD_TEST_URL || "https://heldalive.com";
const count = Number(process.env.HELD_TEST_PEERS || 8);
assert.ok(
  count === 8 || count === 16,
  "Eight coffees or sixteen untouched visits",
);
const state = () =>
  fetch(base + "/api/state?room=browser").then((r) => r.json());
const browser = await chromium.launch({ headless: true, channel: "chromium" });
const pages = [];
const errors = [];
let completed = 0;
const since = Date.now();
try {
  const before = await state();
  for (let i = 0; i < count; i++) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    pages.push(page);
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("websocket", (ws) =>
      ws.on("framesent", (f) => {
        try {
          if (JSON.parse(String(f.payload)).type === "done") completed++;
        } catch {}
      }),
    );
    await page.goto(base);
    if (count === 8)
      await page.getByRole("button", { name: "Give Held a coffee" }).click();
    await page
      .locator('.your-contribution[data-compute-status="ready"]')
      .waitFor({ timeout: 120000 });
    console.log("Real live holder ready", i + 1);
  }
  const ready = await state();
  assert.ok(ready.power.browserChains >= 1);
  const loadedAt = Date.now();
  let after;
  while (Date.now() - loadedAt < 600000) {
    const s = await state();
    if (completed && s.totalThoughts > ready.totalThoughts) {
      after = s;
      break;
    }
    await pages[0].waitForTimeout(1000);
  }
  assert.ok(after, "Public browser group must complete actual inference");
  assert.ok(
    after.activity.some((e) => e.source === "browser" && e.at >= loadedAt),
  );
  assert.deepEqual(errors, []);
  await mkdir(".local/qa/edition05", { recursive: true });
  await pages[0].screenshot({
    path: ".local/qa/edition05/live-working.png",
    fullPage: true,
  });
  await pages[0]
    .getByRole("button", { name: "Inspect computer and agents" })
    .click();
  await pages[0]
    .locator(".open-world")
    .screenshot({ path: ".local/qa/edition05/live-inspector.png" });
  await writeFile(
    ".local/qa/edition05/live-result.json",
    JSON.stringify(
      {
        base,
        count,
        automatic: count === 16,
        elapsedMs: Date.now() - since,
        afterLoadMs: Date.now() - loadedAt,
        completed,
        errors,
        before,
        ready,
        after,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS actual browser inference through public Cloudflare relay:",
    {
      count,
      completed,
      afterLoadMs: Date.now() - loadedAt,
      power: after.power,
    },
  );
} finally {
  await browser.close();
}
