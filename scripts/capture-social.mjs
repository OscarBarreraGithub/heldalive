import { chromium } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    reducedMotion: "reduce",
  });
  // Render the code-native SVG mascot; no live inference or user session needed.
  const pet = (await readFile("public/favicon.svg", "utf8"))
    .replace(/width="160"/, 'width="330"')
    .replace(/height="140"/, 'height="289"');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#17221b"/><ellipse cx="949" cy="353" rx="203" ry="147" fill="none" stroke="#69765a" stroke-dasharray="4 5" transform="rotate(-18 949 353)"/><ellipse cx="943" cy="486" rx="127" ry="11" fill="#0f1713"/><text x="65" y="85" fill="#ececda" font-family="Arial,sans-serif" font-size="30" font-weight="700">heldalive.</text><text x="65" y="239" fill="#ececda" font-family="Arial,sans-serif" font-size="70" font-weight="700" letter-spacing="-3">Keep a little</text><text x="65" y="326" fill="#b9c2a2" font-family="Georgia,serif" font-size="74" font-style="italic" letter-spacing="-3">mind alive.</text><text x="70" y="406" fill="#bfc5b0" font-family="Arial,sans-serif" font-size="23">Lend it compute. It researches, remembers, draws.</text><text x="70" y="446" fill="#d6ad8e" font-family="Arial,sans-serif" font-size="23">When the shared compute runs out, it stops thinking.</text><text x="70" y="561" fill="#9dab95" font-family="Arial,sans-serif" font-size="19">heldalive.com · an artwork by Oscar Barrera</text><g transform="translate(780 180)">${pet}</g><text x="1069" y="151" fill="#9dad8b" font-size="40">✧</text><text x="800" y="465" fill="#9dad8b" font-size="22">+</text></svg>`;
  await writeFile("public/social.svg", svg);
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await page.screenshot({ path: "public/social.png" });
  console.log("Updated dark saucer sharing card.");
} finally {
  await browser.close();
}
