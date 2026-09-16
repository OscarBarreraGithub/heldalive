import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    reducedMotion: "reduce",
  });
  await page.addInitScript(() =>
    localStorage.setItem("held-participation", "watch"),
  );
  await page.goto(process.env.HELD_TEST_URL || "http://127.0.0.1:8787");
  await page.locator(".open-world").waitFor();
  async function asset(selector, width, height) {
    return page
      .locator(selector)
      .first()
      .evaluate(
        (el, [w, h]) => {
          const svg = el.cloneNode(true);
          svg.setAttribute("width", String(w));
          svg.setAttribute("height", String(h));
          return svg.outerHTML;
        },
        [width, height],
      );
  }
  const desk = await asset(".station-desk > svg", 310, 216);
  const book = await asset(".station-reading > svg", 185, 122);
  const pet = await asset(".wandering-held .little-held", 150, 150);
  const cup = await asset(".coffee-button > svg", 52, 52);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#faf8f1"/><ellipse cx="922" cy="461" rx="206" ry="28" fill="#ebe8d9"/><text x="65" y="85" fill="#37362f" font-family="Arial,sans-serif" font-size="30" font-weight="700">held alive.</text><text x="65" y="239" fill="#37362f" font-family="Arial,sans-serif" font-size="70" font-weight="700" letter-spacing="-3">This little AI</text><text x="65" y="326" fill="#54694e" font-family="Georgia,serif" font-size="74" font-style="italic" letter-spacing="-3">lives here. With us.</text><text x="70" y="406" fill="#625e53" font-family="Arial,sans-serif" font-size="23">Your browser lends it a little computing power.</text><text x="70" y="443" fill="#625e53" font-family="Arial,sans-serif" font-size="23">It thinks, draws, and asks its helpers to play.</text><text x="70" y="561" fill="#4d654b" font-family="Arial,sans-serif" font-size="19">heldalive.com · an artwork by Oscar Barrera</text><g transform="translate(784 169)">${desk}</g><g transform="translate(964 353)">${book}</g><g transform="translate(835 316)">${pet}</g><g transform="translate(782 412)">${cup}</g></svg>`;
  await writeFile("public/social.svg", svg);
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await page.screenshot({ path: "public/social.png" });
  console.log("Updated sharing card with the open workspace, Held and coffee.");
} finally {
  await browser.close();
}
