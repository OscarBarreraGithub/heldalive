import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    reducedMotion: "reduce",
  });
  await page.goto("http://127.0.0.1:5173");
  await page.locator(".pet-device").waitFor();
  const pet = await page.locator(".pet-device").evaluate((el) => el.outerHTML);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#faf8f1"/><ellipse cx="895" cy="335" rx="250" ry="240" fill="#eee8f1"/><text x="65" y="85" fill="#37362f" font-family="Arial,sans-serif" font-size="30" font-weight="700">held alive.</text><text x="65" y="245" fill="#37362f" font-family="Arial,sans-serif" font-size="74" font-weight="700" letter-spacing="-3">This little AI</text><text x="65" y="325" fill="#54694e" font-family="Georgia,serif" font-size="82" font-style="italic" letter-spacing="-3">runs on us.</text><text x="70" y="402" fill="#6b675b" font-family="Arial,sans-serif" font-size="23">Lend it a little browser power.</text><text x="70" y="438" fill="#6b675b" font-family="Arial,sans-serif" font-size="23">See what it makes with borrowed time.</text><text x="70" y="561" fill="#4d654b" font-family="Arial,sans-serif" font-size="19">heldalive.com · an artwork by Oscar Barrera</text><style>.device-label{font:italic 600 23px Georgia;fill:#875349}.screen-caption{font:8px monospace;fill:#5d7057}.screen-state{font:8.5px monospace;fill:#4b6244}</style><g transform="translate(663 65) rotate(-7 235 235)">${pet.replace("<svg ", '<svg x="0" y="0" width="480" height="480" ')}</g></svg>`;
  await writeFile("public/social.svg", svg);
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await page.screenshot({ path: "public/social.png" });
  console.log("Updated native SVG social artwork and PNG sharing card");
} finally {
  await browser.close();
}
