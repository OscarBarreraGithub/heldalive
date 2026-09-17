import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ headless: true });
const base = process.env.HELD_TEST_URL || "http://127.0.0.1:8787";
const failures = [];
async function check(page, name) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  for (const violation of result.violations) {
    failures.push({
      page: name,
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.map((node) => ({
        target: node.target,
        summary: node.failureSummary,
      })),
    });
  }
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
    for (const section of ["habitat", "research", "math"]) {
      await page.goto(base + "#" + section);
      await page.locator("h1").waitFor();
      await page.waitForTimeout(300);
      await check(page, `${section} at ${width}px`);
    }
    await page.goto(base);
    await page.getByRole("button", { name: "How your compute helps" }).click();
    await check(page, `Contribution dialog at ${width}px`);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Open the growing ASCII mural" }).click();
    await page.getByRole("dialog", { name: "The unfinished mural." }).waitFor();
    await check(page, `Mural at ${width}px`);
    await page.keyboard.press("Escape");
  }
  assert.deepEqual(failures, [], "Automated accessibility findings");
  console.log(
    "PASS: automated WCAG A/AA scans on all three destinations, contribution dialog and mural at desktop and mobile sizes. This does not replace human accessibility testing.",
  );
} finally {
  await browser.close();
}
