import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const base = process.env.HELD_TEST_URL || "http://127.0.0.1:8787";
const browser = await chromium.launch({ headless: true });
const output = ".local/qa/edition08";
await mkdir(output, { recursive: true });
const errors = [];
const modelRequests = [];
const outgoing = [];
async function noOverflow(page, label) {
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
    `Body overflow: ${label}`,
  );
}
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    acceptDownloads: true,
  });
  await context.addInitScript(() => {
    if (!localStorage.getItem("held-participation"))
      localStorage.setItem("held-participation", "watch");
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (/huggingface|mlc-ai|\.wasm|\/api\/model\/|\/weights\//.test(request.url()))
      modelRequests.push(request.url());
  });
  page.on("websocket", (socket) => socket.on("framesent", (frame) => {
    try { outgoing.push(JSON.parse(String(frame.payload))); } catch {}
  }));
  await page.goto(base);
  await page.getByRole("heading", { name: "Keep a little mind alive." }).waitFor();
  assert.equal(await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link").count(), 3);
  await page.getByLabel("Simulated phone-equivalent compute").waitFor();
  const scenario = Number((await page.locator("[data-simulated-phone-equivalents]").innerText()).replace("≈", ""));
  assert.ok(scenario >= 86 && scenario <= 114, "Authored estimate remains in its stated bounds");
  assert.equal(await page.getByText("SIMULATED ESTIMATE", { exact: true }).isVisible(), true);
  assert.equal(await page.getByText("SIMULATED COMPUTE", { exact: true }).isVisible(), true);
  assert.equal(await page.getByText("real connected tabs", { exact: true }).isVisible(), true);

  await page.getByRole("button", { name: "How your compute helps" }).click();
  await page.getByRole("dialog").waitFor({ state: "visible" });
  assert.match(await page.getByRole("dialog").innerText(), /113–345/);
  assert.match(await page.getByRole("dialog").innerText(), /central .* separate and server-backed/);
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal(await page.getByRole("button", { name: "How your compute helps" }).evaluate((el) => document.activeElement === el), true, "Explanation restores keyboard focus");
  await page.getByRole("button", { name: "How your compute helps" }).click();
  await page.getByRole("button", { name: "I’ll just watch" }).click();
  await page.reload();
  await page.getByText("You’re just watching", { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem("held-participation")), "watch");
  assert.equal(await page.getByRole("button", { name: /Make something|vote|Wave to/i }).count(), 0, "No model interactions or votes");
  assert.equal(await page.locator("textarea,input[type=text]").count(), 0, "No visitor prompt input");
  await page.getByText("What is this tab actually doing?", { exact: true }).click();
  await page.locator("[data-model-bytes]").waitFor({ state: "visible" });
  assert.equal(await page.locator("[data-model-bytes]").getAttribute("data-model-bytes"), "0", "A watcher has loaded no model weights");
  await page.getByText("What is this tab actually doing?", { exact: true }).click();

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    for (const section of ["habitat", "research", "math"]) {
      await page.goto(base + "#" + section);
      await page.locator("h1").waitFor();
      await noOverflow(page, `${section} at ${width}px`);
      assert.equal(await page.getByRole("navigation", { name: "Main navigation" }).locator('[aria-current="page"]').count(), 1);
      if (section === "habitat") {
        const headline = await page.locator("h1").boundingBox();
        const controls = await page.locator(".compute-care").boundingBox();
        assert.ok(headline && controls && headline.y < controls.y, "The explanation comes before compute controls");
        assert.ok(headline.y + headline.height < 650, "The main purpose is visible without scrolling");
        assert.equal(await page.getByText("SIMULATED COMPUTE", { exact: true }).isVisible(), true, "Simulation disclosure remains visible at every viewport");
      }
      if (width === 390 || width === 1440) await page.screenshot({ path: `${output}/${width}-${section}.png`, fullPage: true });
    }
    await page.goto(base);
    await page.getByRole("button", { name: "How your compute helps" }).click();
    assert.equal(await page.getByRole("button", { name: "Got it" }).isVisible(), true);
    await page.keyboard.press("Escape");
    const opener = page.getByRole("button", { name: "Open the growing ASCII mural" });
    await opener.click();
    await page.getByRole("dialog", { name: "The unfinished mural." }).waitFor();
    await noOverflow(page, `mural at ${width}px`);
    assert.equal(await page.getByRole("button", { name: "Close mural" }).evaluate((el) => document.activeElement === el), true, "Mural starts with a focused close control");
    await page.keyboard.press("Escape");
    await page.getByRole("dialog", { name: "The unfinished mural." }).waitFor({ state: "hidden" });
    await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Open the growing ASCII mural");
  }
  await page.goto(base + "#math");
  await page.getByRole("slider", { name: /Contributing browsers/ }).fill("10");
  assert.match(await page.locator(".calculation-result").innerText(), /0 complete chains/);
  for (const path of ["/research/short-paper.pdf", "/research/full-analysis.pdf", "/research/source-audit.md"]) {
    const response = await page.request.get(base + path);
    assert.equal(response.status(), 200);
    assert.ok((await response.body()).byteLength > 100);
  }
  // Fixture is served only inside this headless browser, never saved or published.
  const muralFixture = {
    id: "ui-fixture", index: 0, revision: 1, at: Date.now(),
    title: "UI test horizon", model: "test fixture", note: "test-only",
    text: Array.from({ length: 24 }, (_, row) => `${" ".repeat(row)}.${" ".repeat(70 - row)}.`).join("\n"),
  };
  await page.route("**/api/mural?**", (route) => route.fulfill({ json: { tiles: [muralFixture], total: 1 } }));
  await page.goto(base + "#mural");
  await page.getByRole("dialog", { name: "The unfinished mural." }).waitFor();
  await page.locator(".mural-strip pre").waitFor();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save loaded sections as text" }).click();
  assert.equal((await download).suggestedFilename(), "held-alive-mural.txt");
  await page.setViewportSize({ width: 320, height: 844 });
  await noOverflow(page, "populated mural at 320px");
  assert.ok(await page.locator(".mural-scroll").evaluate((el) => el.scrollWidth > el.clientWidth), "ASCII spacing is preserved with local horizontal scrolling");
  await page.keyboard.press("Escape");
  for (const [oldHash, target] of [["collection", ".mural-dialog"], ["experiment", ".research-page"]]) {
    await page.goto(base + "#" + oldHash);
    await page.locator(target).waitFor({ state: "visible" });
  }
  assert.equal(outgoing.some((event) => event.type === "vote" || event.type === "whisper"), false);
  assert.equal(modelRequests.length, 0, "Watch-only visitors never download model assets");
  assert.deepEqual(errors, []);
  console.log("PASS: three destinations at 320/390/768/1440px; headline order; no body overflow; compute explanation; persistent opt-out; mural focus, direct links, download and local scrolling; legacy links; math assets; no prompt/vote controls; no spectator model downloads or page errors.");
} finally {
  await browser.close();
}
