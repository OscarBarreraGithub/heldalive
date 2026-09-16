// Current workspace views. Earlier analog-device passes remain in docs/design/.
import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
const base = process.env.HELD_TEST_URL || "http://127.0.0.1:8787";
const out = "docs/edition04";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const c = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await c.addInitScript(() =>
    localStorage.setItem("held-participation", "watch"),
  );
  const page = await c.newPage();
  await page.goto(base);
  await page.locator(".open-world").waitFor();
  const panels = [];
  const states = [
    ["A place to live", null],
    ["A little hello", "Say hello to Held"],
    ["The computer", "Inspect computer and agents"],
    ["The drawing table", "Inspect drawing area"],
    ["The reading corner", "Inspect reading and memory"],
    ["A phone-sized room", null],
  ];
  for (let i = 0; i < states.length; i++) {
    if (
      await page.getByRole("button", { name: "Close station details" }).count()
    )
      await page.getByRole("button", { name: "Close station details" }).click();
    if (i === 5) await page.setViewportSize({ width: 390, height: 844 });
    if (states[i][1])
      await page
        .getByRole("button", { name: states[i][1], exact: true })
        .click();
    const file = `${out}/view-${i + 1}.png`;
    await page.locator(".open-world").screenshot({ path: file });
    panels.push({ label: states[i][0], image: await readFile(file, "base64") });
  }
  await page.setViewportSize({ width: 1260, height: 980 });
  await page.setContent(
    `<html><body style="margin:0;background:#faf8f1;color:#37362f;font-family:Arial,sans-serif"><h1 style="font-size:26px;margin:24px 30px 4px">Held · a little world on the page</h1><p style="margin:0 30px 12px;color:#6b675b">Six views of the live workspace. Interactions inspect real work; the hello is a local animation.</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:12px 28px">${panels.map((p) => `<section style="border:1px solid #deddd1;border-radius:14px;padding:12px"><h2 style="font-size:14px">${p.label}</h2><img style="width:100%;height:330px;object-fit:contain" src="data:image/png;base64,${p.image}"/></section>`).join("")}</div></body></html>`,
  );
  await page.screenshot({ path: `${out}/workspace-views.png`, fullPage: true });
  console.log("Saved six inspected views of the current workspace.");
} finally {
  await browser.close();
}
