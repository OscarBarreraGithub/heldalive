import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.HELD_TEST_URL || "http://127.0.0.1:5173";
const requestedJobs = Number(process.env.HELD_TEST_JOBS || 8);
const requireBoth = process.env.HELD_TEST_BOTH === "1";
await mkdir(".local/qa/edition02", { recursive: true });
const context = await chromium.launchPersistentContext(
  ".local/webgpu-edition02",
  { headless: false, viewport: { width: 1440, height: 1000 } },
);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => {
  errors.push(e.message);
  console.log("Page error", e.message);
});
page.on("console", (m) => {
  if (m.type() === "error") console.log("Browser:", m.text().slice(0, 250));
});
try {
  await page.goto(base);
  const capability = await page.evaluate(async () => ({
    gpu: Boolean(navigator.gpu),
    adapter: navigator.gpu
      ? Boolean(await navigator.gpu.requestAdapter())
      : false,
  }));
  assert.ok(capability.adapter, "Real WebGPU adapter required");
  console.log("WebGPU adapter ready");
  const before = await page.request
    .get(base + "/api/state?room=browser")
    .then((r) => r.json());
  await page.getByRole("button", { name: "Lend a little life" }).click();
  await page.getByLabel("Room to roam", { exact: false }).check();
  await page.getByRole("button", { name: "Start lending compute" }).click();
  await Promise.race([
    page
      .getByRole("button", { name: "Stop contributing" })
      .waitFor({ timeout: 300000 }),
    page
      .locator(".compute-error")
      .waitFor({ timeout: 300000 })
      .then(async () => {
        throw new Error(await page.locator(".compute-error").innerText());
      }),
  ]);
  console.log("Real browser model loaded");
  const started = Date.now();
  let last = before.totalThoughts,
    finished;
  const observations = [];
  while (Date.now() - started < 480000) {
    const s = await page.request
      .get(base + "/api/state?room=browser")
      .then((r) => r.json());
    if (s.totalThoughts !== last) {
      last = s.totalThoughts;
      const record = {
        jobs: s.totalThoughts - before.totalThoughts,
        tokens: s.totalTokens - before.totalTokens,
        art: s.artworkCount - before.artworkCount,
        project: s.project?.kind,
        scores: s.memoryScores,
        journal: s.journal,
      };
      observations.push(record);
      console.log(JSON.stringify(record));
    }
    if (
      s.totalThoughts >= before.totalThoughts + requestedJobs &&
      (requireBoth
        ? s.artworkCount > before.artworkCount &&
          s.trials.some((t) => t.at > started)
        : s.artworkCount > before.artworkCount ||
          s.trials.some((t) => t.at > started))
    ) {
      finished = s;
      break;
    }
    await page.waitForTimeout(1500);
  }
  assert.ok(finished, "Real browser must finish delegated work");
  await page.screenshot({
    path: ".local/qa/edition02/browser-real-working.png",
    fullPage: true,
  });
  // Chromium automation keeps tabs foregrounded on this Mac. Exercise the app's
  // visibility handler deterministically; do not claim a natural tab-switch test.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(800);
  const hidden = await page.request
    .get(base + "/api/state?room=browser")
    .then((r) => r.json());
  assert.equal(
    hidden.contributors,
    0,
    "Visibility handler pauses contribution",
  );
  assert.equal(hidden.agents.length, 0);
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });

  await page.getByRole("button", { name: "Stop contributing" }).click();
  await page.waitForTimeout(600);
  const after = await page.request
    .get(base + "/api/state?room=browser")
    .then((r) => r.json());
  assert.equal(after.contributors, 0);
  assert.equal(after.modelAvailable, false);
  assert.equal(after.agents.length, 0);
  const tokens = after.totalTokens;
  await page.waitForTimeout(6000);
  const paused = await page.request
    .get(base + "/api/state?room=browser")
    .then((r) => r.json());
  assert.equal(paused.totalTokens, tokens, "No output after withdrawal");
  await writeFile(
    ".local/qa/edition02/browser-evidence.json",
    JSON.stringify(
      {
        base,
        at: new Date().toISOString(),
        capability,
        before: before.totalThoughts,
        observations,
        measurement: {
          jobs: finished.totalThoughts - before.totalThoughts,
          tokens: finished.totalTokens - before.totalTokens,
          jobWallMs: finished.totalComputeMs - before.totalComputeMs,
          elapsedMs: Date.now() - started,
        },
        newTrials: finished.trials.filter((t) => t.at > started),
        newArt: finished.artworks.filter((a) => a.at > started),
        hidden: {
          method: "synthetic visibility event",
          contributors: hidden.contributors,
          active: hidden.agents.length,
        },
        after: {
          contributors: after.contributors,
          available: after.modelAvailable,
          active: after.agents.length,
        },
        errors,
      },
      null,
      2,
    ),
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: actual browser planning, delegated model work, persisted output, explicit consent, immediate withdrawal, no Mac fallback",
  );
} finally {
  await context.close();
}
