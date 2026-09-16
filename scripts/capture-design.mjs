import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
const base = process.env.HELD_TEST_URL || "http://127.0.0.1:5173";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname))
  throw new Error("Design flags are local-only");
await mkdir("docs/design", { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const labels = [
    "01 · silhouette",
    "02 · sprout & cheeks",
    "03 · awake expression",
    "04 · a little world",
    "05 · shell & light",
    "06 · a local hello",
  ];
  const panels = [];
  for (let i = 1; i <= 6; i++) {
    await page.goto(base + "?design=" + i);
    await page.locator(".pet-device").waitFor();
    await page.waitForTimeout(250);
    if (i === 3 || i === 4 || i === 6)
      await page.getByRole("button", { name: "Say hello to Held" }).click();
    const file = `docs/design/creature-${i}.png`;
    await page.locator(".hero-creature").screenshot({ path: file });
    panels.push({
      label: labels[i - 1],
      image: await readFile(file, "base64"),
    });
  }
  await page.setViewportSize({ width: 1260, height: 1030 });
  await page.setContent(
    `<html><body style="margin:0;background:#faf8f1;color:#37362f;font-family:system-ui"><h1 style="font-size:26px;margin:24px 30px 4px">Held · six design passes</h1><p style="margin:0 30px 12px;color:#6b675b">Silhouette, character, expression, setting, finish and interaction.</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:12px 28px">${panels.map((p) => `<div style="border:1px solid #deddd1;border-radius:16px;overflow:hidden;padding:12px"><strong style="font-size:14px">${p.label}</strong><img style="width:100%;display:block" src="data:image/png;base64,${p.image}"></div>`).join("")}</div></body></html>`,
  );
  await page.screenshot({ path: "docs/design/six-passes.png", fullPage: true });
  console.log("Saved six inspected design states and contact sheet");
} finally {
  await browser.close();
}
