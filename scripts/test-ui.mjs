import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const base = process.env.HELD_TEST_URL || "http://127.0.0.1:8787";
const browser = await chromium.launch({ headless: true });
await mkdir(".local/qa", { recursive: true });
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.on("pageerror", (error) => errors.push(error.message));
  const modelRequests = [];
  page.on("request", (request) => {
    if (/huggingface|mlc-ai|\.wasm|\/api\/model\//.test(request.url()))
      modelRequests.push(request.url());
  });
  await page.goto(base);
  await page
    .getByRole("heading", { name: "A small mind. A shared moment." })
    .waitFor();
  await page.getByRole("button", { name: "About the work" }).click();
  await page.getByRole("dialog").waitFor({ state: "visible" });
  assert.match(
    await page.getByRole("dialog").innerText(),
    /not a claim of consciousness/,
  );
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.screenshot({ path: ".local/qa/desktop.png", fullPage: true });
  await page.getByRole("link", { name: "Try the browser study" }).click();
  await page.getByRole("button", { name: "Lend a little compute" }).click();
  await page
    .getByRole("heading", { name: "A little room to think." })
    .waitFor();
  assert.match(await page.getByRole("dialog").innerText(), /300 MB/);
  await page.getByRole("button", { name: "I’ll just watch" }).click();
  assert.equal(
    modelRequests.length,
    0,
    "Spectators must never download a model",
  );
  await page.screenshot({
    path: ".local/qa/browser-study.png",
    fullPage: true,
  });
  for (const width of [320, 390, 768]) {
    const mobile = await browser.newPage({
      viewport: { width, height: 844 },
      reducedMotion: "reduce",
    });
    await mobile.goto(base);
    await mobile
      .getByRole("heading", { name: "A small mind. A shared moment." })
      .waitFor();
    assert.equal(
      await mobile.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `Horizontal overflow at ${width}px`,
    );
    if (width === 390)
      await mobile.screenshot({ path: ".local/qa/mobile.png", fullPage: true });
    await mobile.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: desktop/mobile layout, dialogs, keyboard dismissal, consent, spectator downloads, reduced-motion layout, browser errors",
  );
} finally {
  await browser.close();
}
