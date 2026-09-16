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
  await page.getByRole("button", { name: "Say hello to Held" }).click();
  const icon = await asset(".wandering-held .little-held", 120, 120);
  await writeFile(
    "public/favicon.svg",
    icon.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '),
  );
  const home = await asset(".saucer-home", 480, 416);
  const desk = await asset(".station-desk > svg", 200, 139);
  const book = await asset(".station-reading > svg", 145, 109);
  const pet = await asset(".wandering-held .little-held", 150, 150);
  const cup = await asset(".coffee-button > svg", 52, 52);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#faf8f1"/><ellipse cx="922" cy="461" rx="206" ry="28" fill="#ebe8d9"/><text x="65" y="85" fill="#37362f" font-family="Arial,sans-serif" font-size="30" font-weight="700">held alive.</text><text x="65" y="239" fill="#37362f" font-family="Arial,sans-serif" font-size="70" font-weight="700" letter-spacing="-3">An AI that lives</text><text x="65" y="326" fill="#54694e" font-family="Georgia,serif" font-size="74" font-style="italic" letter-spacing="-3">in our browsers.</text><text x="70" y="406" fill="#625e53" font-family="Arial,sans-serif" font-size="23">Your tab runs a small piece of its mind.</text><text x="70" y="443" fill="#625e53" font-family="Arial,sans-serif" font-size="23">When too many tabs close, browser thinking stops.</text><text x="70" y="561" fill="#4d654b" font-family="Arial,sans-serif" font-size="19">heldalive.com · an artwork by Oscar Barrera</text><g transform="translate(704 116)">${home}</g><g transform="translate(734 230)">${desk}</g><g transform="translate(990 333)">${book}</g><g transform="translate(886 300)">${pet}</g><g transform="translate(849 396)">${cup}</g></svg>`;
  await writeFile("public/social.svg", svg);
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await page.screenshot({ path: "public/social.png" });
  console.log("Updated alien favicon and saucer sharing card.");
} finally {
  await browser.close();
}
