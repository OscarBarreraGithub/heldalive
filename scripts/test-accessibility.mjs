import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ headless: true });
const base = process.env.HELD_TEST_URL || "http://127.0.0.1:8787";
async function check(page, name) {
  const r = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
    [],
    name,
  );
}
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await context.addInitScript(() =>
    localStorage.setItem("held-participation", "watch"),
  );
  const page = await context.newPage();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const section of ["habitat", "collection", "experiment", "math"]) {
      await page.goto(base + "#" + section);
      await page.locator("h1").waitFor();
      await page.waitForTimeout(300);
      await check(page, `${section} at ${width}px`);
    }
    await page.goto(base);
    await page.getByRole("button", { name: "How your compute helps" }).click();
    await check(page, `Contribution dialog at ${width}px`);
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Inspect computer and agents" })
      .click();
    await check(page, `Station inspector at ${width}px`);
  }
  await page.goto(base + "?room=studio");
  await page
    .getByRole("heading", { name: "An AI that lives in our browsers." })
    .waitFor();
  await check(page, "Mac studio");
  console.log(
    "PASS: automated WCAG A/AA scans on all four pages, explanation, mobile and Mac studio. This does not replace human accessibility testing.",
  );
} finally {
  await browser.close();
}
