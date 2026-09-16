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
  await page.getByRole("button", { name: "Wave to the alien" }).click();
  const icon = await asset(".wandering-held .little-held", 160, 140);
  await writeFile(
    "public/favicon.svg",
    icon.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '),
  );
  const pet = await asset(".wandering-held .little-held", 330, 289);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#faf8f1"/><ellipse cx="949" cy="353" rx="203" ry="147" fill="none" stroke="#b8c9a8" stroke-dasharray="4 5" transform="rotate(-18 949 353)"/><ellipse cx="943" cy="486" rx="127" ry="11" fill="#eae8db"/><text x="65" y="85" fill="#37362f" font-family="Arial,sans-serif" font-size="30" font-weight="700">held alive.</text><text x="65" y="239" fill="#37362f" font-family="Arial,sans-serif" font-size="70" font-weight="700" letter-spacing="-3">An AI that lives</text><text x="65" y="326" fill="#54694e" font-family="Georgia,serif" font-size="74" font-style="italic" letter-spacing="-3">in our browsers.</text><text x="70" y="406" fill="#625e53" font-family="Arial,sans-serif" font-size="23">We lend it compute. It makes little drawings.</text><text x="70" y="446" fill="#833f32" font-family="Arial,sans-serif" font-size="23">The idea: when too many people leave, it dies.</text><text x="70" y="561" fill="#4d654b" font-family="Arial,sans-serif" font-size="19">heldalive.com · an artwork by Oscar Barrera</text><g transform="translate(780 180)">${pet}</g><text x="1069" y="151" fill="#9dad8b" font-size="40">✧</text><text x="800" y="465" fill="#9dad8b" font-size="22">+</text></svg>`;
  await writeFile("public/social.svg", svg);
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await page.screenshot({ path: "public/social.png" });
  console.log("Updated alien favicon and saucer sharing card.");
} finally {
  await browser.close();
}
