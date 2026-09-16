import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const base = process.env.HELD_TEST_URL || "http://127.0.0.1:8787";
const browser = await chromium.launch({ headless: true });
await mkdir(".local/qa/edition03", { recursive: true });
const errors = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    acceptDownloads: true,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  const modelRequests = [];
  const outgoing = [];
  page.on("request", (r) => {
    if (/huggingface|mlc-ai|\.wasm|\/api\/model\/|\/weights\//.test(r.url()))
      modelRequests.push(r.url());
  });
  page.on("websocket", (ws) =>
    ws.on("framesent", (f) => {
      try {
        outgoing.push(JSON.parse(String(f.payload)));
      } catch {}
    }),
  );
  await page.goto(base);
  await page
    .getByRole("heading", { name: "This little AI lives between us." })
    .waitFor();
  await page.getByRole("button", { name: "Lend a little life" }).click();
  await page.getByRole("dialog").waitFor({ state: "visible" });
  assert.match(await page.getByRole("dialog").innerText(), /11–38/);
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal(
    await page
      .getByRole("button", { name: "Lend a little life" })
      .evaluate((el) => document.activeElement === el),
    true,
    "Focus returns to opener",
  );
  await page.getByRole("button", { name: "Lend a little life" }).click();
  await page.getByRole("button", { name: "I’ll just watch" }).click();
  const checks = page.getByRole("checkbox", { name: /Tiny contributions/ });
  await checks.uncheck();
  await page.reload();
  await page
    .getByRole("heading", { name: "This little AI lives between us." })
    .waitFor();
  assert.equal(await checks.isChecked(), false, "Tiny check opt out persists");
  await page.getByRole("button", { name: "Say hello to Held" }).click();
  await page.getByText("oh, hello you!", { exact: true }).waitFor();
  assert.equal(
    outgoing.some((e) => e.type === "whisper"),
    false,
    "Creature interaction sends no model prompt",
  );
  await page.getByRole("button", { name: /Make something/ }).click();
  await page
    .getByText("Your nudge is in. A new choice opens tomorrow (UTC).")
    .waitFor();
  await page.reload();
  await page
    .getByText("Your nudge is in. A new choice opens tomorrow (UTC).")
    .waitFor();
  assert.equal(
    await page.getByRole("button", { name: /Make something/ }).isDisabled(),
    true,
    "Daily choice persists",
  );
  assert.equal(
    await page.locator("textarea,input[type=text]").count(),
    0,
    "No visitor message input",
  );
  await page.screenshot({
    path: ".local/qa/edition03/desktop.png",
    fullPage: true,
  });
  for (const section of ["collection", "experiment", "math"]) {
    await page.goto(base + "#" + section);
    await page.locator(".inner-page h1").waitFor();
    if (
      section === "collection" &&
      (await page.getByRole("button", { name: "Download drawing" }).count())
    ) {
      // Corrupted local preferences cannot break the collection.
      await page.evaluate(() => localStorage.setItem("held-keepsakes", "{}"));
      await page.reload();
      await page.locator(".art-card").first().waitFor();
      const download = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Download drawing" })
        .first()
        .click();
      assert.ok((await download).suggestedFilename().endsWith(".txt"));
      await page
        .getByRole("button", { name: "Keep this drawing" })
        .first()
        .click();
      assert.ok(
        await page.getByRole("button", { name: "Remove keepsake" }).count(),
      );
    }
    if (section === "math") {
      await page
        .getByRole("slider", { name: /Contributing browsers/ })
        .fill("10");
      assert.match(
        await page.locator(".calculation-result").innerText(),
        /0 complete chains/,
      );
      for (const path of [
        "/research/short-paper.pdf",
        "/research/full-analysis.pdf",
        "/research/source-audit.md",
      ]) {
        const r = await page.request.get(base + path);
        assert.equal(r.status(), 200);
        assert.ok((await r.body()).byteLength > 100);
      }
    }
    await page.screenshot({
      path: `.local/qa/edition03/${section}.png`,
      fullPage: true,
    });
  }
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const section of ["habitat", "collection", "experiment", "math"]) {
      await page.goto(base + "#" + section);
      await page.locator("h1").waitFor();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `Overflow at ${width}px on ${section}`,
      );
      if (width === 390)
        await page.screenshot({
          path: `.local/qa/edition03/mobile-${section}.png`,
          fullPage: true,
        });
    }
    await page.goto(base);
    await page.getByRole("button", { name: "Lend a little life" }).click();
    assert.equal(
      await page
        .getByRole("button", { name: "Start lending compute" })
        .isVisible(),
      true,
    );
    await page.keyboard.press("Escape");
  }
  assert.equal(
    modelRequests.length,
    0,
    "Watching and inspecting consent must never download a model",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: four pages at 320/390/768/1440px, no overflow, consent, keyboard/focus, persistent choices and opt out, local greeting, no prompt input, archive download, math slider, research assets, no spectator model downloads, no page errors",
  );
} finally {
  await browser.close();
}
