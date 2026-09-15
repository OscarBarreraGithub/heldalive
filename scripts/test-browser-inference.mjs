import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const base = process.env.HELD_TEST_URL || "http://127.0.0.1:8787";
const browser = await chromium.launch({ headless: false });
try {
  const page = await browser.newPage({
    viewport: { width: 1100, height: 900 },
  });
  page.on("pageerror", (error) => console.error("Page error:", error.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      console.error("Browser:", message.text().slice(0, 350));
  });
  await page.goto(`${base}/?room=browser`);
  const capability = await page.evaluate(async () => ({
    available: Boolean(navigator.gpu),
    adapter: navigator.gpu
      ? Boolean(await navigator.gpu.requestAdapter())
      : false,
  }));
  console.log("WebGPU capability", capability);
  assert.equal(
    capability.adapter,
    true,
    "A real WebGPU adapter is required for this hardware test",
  );
  const before = await page.request
    .get(`${base}/api/state?room=browser`)
    .then((r) => r.json());
  await page.getByRole("button", { name: "Lend a little compute" }).click();
  await page
    .getByRole("button", { name: "I understand — start contributing" })
    .click();
  await Promise.race([
    page
      .getByRole("heading", { name: "You’re giving it time to think." })
      .waitFor({ timeout: 240000 }),
    page
      .locator(".compute-error")
      .waitFor({ timeout: 240000 })
      .then(async () => {
        throw new Error(await page.locator(".compute-error").innerText());
      }),
  ]);
  console.log("Real browser model loaded.");
  const deadline = Date.now() + 90000;
  let finished;
  while (Date.now() < deadline) {
    const state = await page.request
      .get(`${base}/api/state?room=browser`)
      .then((r) => r.json());
    if (state.totalThoughts > before.totalThoughts) {
      finished = state;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  assert.ok(finished, "Browser must complete a real inference job");
  console.log(
    JSON.stringify({
      text: finished.thoughts.at(-1).text,
      tokens: finished.thoughts.at(-1).tokens,
      durationMs: finished.thoughts.at(-1).durationMs,
    }),
  );
  await page.getByRole("button", { name: "Stop contributing" }).click();
  await page.getByRole("button", { name: "Lend a little compute" }).waitFor();
  await page.screenshot({
    path: ".local/qa/browser-real-inference.png",
    fullPage: true,
  });
  console.log(
    "PASS: real WebGPU inference after consent, then immediate withdrawal.",
  );
} finally {
  await browser.close();
}
