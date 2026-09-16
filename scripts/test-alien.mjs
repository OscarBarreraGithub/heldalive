import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const base = process.env.HELD_TEST_URL || "http://127.0.0.1:8787";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
const initial = await fetch(base + "/api/state?room=browser").then((r) =>
  r.json(),
);
const browser = await chromium.launch({ headless: true });
const folder = ".local/qa/edition05";
await mkdir(folder, { recursive: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await context.addInitScript(() =>
    localStorage.setItem("held-participation", "watch"),
  );
  const page = await context.newPage();
  let sendState;
  // Local display fixtures only: no synthetic inference is sent to the coordinator.
  await page.routeWebSocket(/\/api\/socket/, (socket) => {
    sendState = (state) =>
      socket.send(JSON.stringify({ ...state, type: "state" }));
    sendState(initial);
  });
  await page.goto(base);
  await page.locator(".saucer-home").waitFor();
  const task = (kind, role = "Held") => ({
    id: "design-fixture",
    role,
    kind,
    title: "Local display fixture",
    source: "browser",
    inputWords: 48,
    maxOutputTokens: 96,
    characters: 0,
  });
  for (const [name, kind, role, place] of [
    ["console", "plan", "Held", "desk"],
    ["drawing", "art", "Held", "drawing"],
    ["memory", "pack", "Held", "reading"],
    ["stargazing", "wander", "Held", "window"],
    ["helper", "art", "Helper", "desk"],
  ]) {
    sendState({
      ...initial,
      modelAvailable: true,
      agents: [task(kind, role)],
      power: {
        ...initial.power,
        launchSupport: false,
        browserChains: 1,
        source: "browser",
      },
    });
    await page.locator(`.open-world.at-${place}`).waitFor();
    await page
      .locator(".open-world")
      .screenshot({ path: `${folder}/alien-${name}.png` });
    assert.equal(
      await page.locator(".world-helper").count(),
      role === "Helper" ? 1 : 0,
    );
  }
  sendState({
    ...initial,
    agents: [],
    modelAvailable: false,
    pipelines: [],
    power: {
      ...initial.power,
      launchSupport: false,
      browserChains: 0,
      source: "none",
    },
  });
  await page.locator(".world-unpowered").waitFor();
  await page.getByText("Its mind is incomplete. It cannot think.").waitFor();
  assert.equal(
    await page.getByRole("meter").getAttribute("aria-valuenow"),
    "0",
  );
  assert.equal(await page.locator(".preview-truth").count(), 0);
  await page
    .locator(".open-world")
    .screenshot({ path: `${folder}/alien-stopped.png` });
  assert.equal(
    await page
      .locator(".wandering-held .little-held")
      .evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  sendState({
    ...initial,
    agents: [],
    modelAvailable: true,
    power: { ...initial.power, launchSupport: true, browserChains: 0 },
  });
  await page.getByText("The preview is on life support.").waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".mobile-preview-note").waitFor({ state: "visible" });
  await page.screenshot({ path: `${folder}/alien-mobile-first-screen.png` });
  const alien = await page.locator(".wandering-held").boundingBox();
  assert.ok(
    alien.y + alien.height < 844,
    "The alien fits in the first mobile screen",
  );
  // Also check normal motion can greet and each inspector remains usable.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Say hello to Held" }).click();
  await page.locator(".held-hello").waitFor();
  for (const name of [
    "Inspect computer and agents",
    "Inspect drawing area",
    "Inspect reading and memory",
    "Inspect free time",
  ]) {
    await page.getByRole("button", { name }).click();
    assert.equal(await page.locator(".station-inspector").isVisible(), true);
    await page.getByRole("button", { name: "Close station details" }).click();
  }
  console.log(
    "PASS: six alien states, job-based helpers, stopped motion, honest preview/death states, first-screen mobile alien, greeting and all spacecraft stations.",
  );
} finally {
  await browser.close();
}
