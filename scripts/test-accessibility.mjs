import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const base = process.env.HELD_TEST_URL || "http://127.0.0.1:8787";
try {
  const page = await context.newPage();
  for (const route of ["/", "/?room=browser"]) {
    await page.goto(base + route);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        targets: v.nodes.map((n) => n.target),
      })),
      [],
      `Accessibility violations on ${route}`,
    );
  }
  await page.getByRole("button", { name: "Lend a little compute" }).click();
  const modal = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    modal.violations.map((v) => v.id),
    [],
  );
  console.log(
    "PASS: automated WCAG A/AA checks on both studies and contribution consent.",
  );
} finally {
  await browser.close();
}
