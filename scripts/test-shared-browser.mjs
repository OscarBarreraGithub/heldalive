import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.HELD_TEST_URL || "http://127.0.0.1:5173";
const count = Number(process.env.HELD_TEST_PEERS || 4);
const requestedJobs = Number(process.env.HELD_TEST_JOBS || 3);
const browser = await chromium.launch({ headless: true, channel: "chromium" });
const contexts = [];
const pages = [];
const events = [];
const assignments = [];
const downloads = [];
await mkdir(".local/qa/edition03", { recursive: true });
const state = async () =>
  fetch(base + "/api/state?room=browser").then((r) => r.json());
try {
  const before = await state();
  for (let i = 0; i < count; i++) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    contexts.push(context);
    const page = await context.newPage();
    pages.push(page);
    downloads[i] = [];
    page.on("request", (r) => {
      const match = new URL(r.url()).pathname.match(
        /\/weights\/[^/]+\/(.+)\.bin$/,
      );
      if (match) downloads[i].push(match[1]);
    });
    page.on("websocket", (ws) =>
      ws.on("framereceived", (frame) => {
        try {
          const d = JSON.parse(String(frame.payload));
          if (d.type === "pipeline_assign") assignments[i] = d.piece;
        } catch {}
      }),
    );
    page.on("console", (m) => {
      if (m.type() === "warning" || m.type() === "error")
        console.log("browser", i, m.text().slice(0, 500));
    });
    page.on("pageerror", (e) => console.log("ERROR", i, e.message));
    await page.goto(base);
    await page.getByRole("button", { name: "Lend a little life" }).click();
    if (count === 4)
      await page.getByLabel("Room to roam", { exact: false }).check();
    await page.getByRole("button", { name: "Start lending compute" }).click();
    await page
      .getByRole("button", { name: "Stop contributing" })
      .waitFor({ timeout: 120000 });
    console.log("READY", i, (await state()).pipelines);
  }
  for (let i = 0; i < count; i++) {
    const piece = assignments[i];
    assert.ok(piece, "Server assigned each holder a piece");
    assert.ok(downloads[i].length > 0, "Fresh context fetches its weights");
    for (const key of downloads[i]) {
      const layer = key.match(/^l(\d+)\./);
      if (layer)
        assert.ok(
          Number(layer[1]) >= piece.start && Number(layer[1]) < piece.end,
          "Only owned layers are fetched",
        );
      else
        assert.ok(
          piece.start === 0 || piece.end === 32,
          "Interior holder does not fetch vocabulary weights",
        );
    }
  }
  const started = Date.now();
  let last = -1;
  let worked;
  while (Date.now() - started < 600000) {
    const s = await state();
    if (s.totalThoughts !== last) {
      last = s.totalThoughts;
      console.log(
        JSON.stringify({
          completed: s.totalThoughts - before.totalThoughts,
          project: s.project,
          activity: s.activity.slice(-3),
        }),
      );
      events.push(s);
    }
    if (s.totalThoughts >= before.totalThoughts + requestedJobs) {
      worked = s;
      break;
    }
    await pages[0].waitForTimeout(1500);
  }
  assert.ok(worked, "The shared model must complete real assigned work");
  assert.ok(worked.pipelines.some((p) => p.ready));
  await pages.at(-1).getByRole("button", { name: "Stop contributing" }).click();
  await pages[0].waitForTimeout(1200);
  const lost = await state();
  assert.equal(
    lost.modelAvailable,
    false,
    "Loss of required layers stops the model",
  );
  assert.equal(lost.active, null);
  const tokens = lost.totalTokens;
  await pages[0].waitForTimeout(6500);
  assert.equal(
    (await state()).totalTokens,
    tokens,
    "No server fallback or hidden continued inference",
  );
  await pages
    .at(-1)
    .getByRole("button", { name: "Lend a little life" })
    .click();
  await pages
    .at(-1)
    .getByRole("button", { name: "Start lending compute" })
    .click();
  await pages
    .at(-1)
    .getByRole("button", { name: "Stop contributing" })
    .waitFor({ timeout: 120000 });
  let recovered = await state();
  assert.ok(recovered.modelAvailable, "Replacement restores full coverage");
  const resumeDeadline = Date.now() + 180000;
  while (Date.now() < resumeDeadline) {
    recovered = await state();
    if (recovered.totalThoughts > lost.totalThoughts) break;
    await pages[0].waitForTimeout(1000);
  }
  assert.ok(
    recovered.totalThoughts > lost.totalThoughts,
    "A restored pipeline completes new model work",
  );
  // Automation keeps contexts foregrounded; exercise the hidden-page handler explicitly.
  await pages.at(-1).evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await pages[0].waitForTimeout(600);
  assert.equal(
    (await state()).modelAvailable,
    false,
    "Hidden holder withdraws its physical piece",
  );
  await pages[0].screenshot({
    path: ".local/qa/edition03/shared-working.png",
    fullPage: true,
  });
  await writeFile(
    ".local/qa/edition03/shared-result.json",
    JSON.stringify(
      {
        contexts: count,
        assignments,
        downloads,
        elapsedMs: Date.now() - started,
        before,
        worked,
        lost,
        recovered,
        events,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS assigned-piece downloads, shared work, physical loss, no fallback, completed recovery, synthetic visibility withdrawal",
  );
} finally {
  await browser.close();
}
