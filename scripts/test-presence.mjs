import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const base = process.env.HELD_TEST_URL || "http://127.0.0.1:8787";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname), "Fixtures stay local");
const browser = await chromium.launch({ headless: true });
const output = ".local/qa/edition13";
await mkdir(output, { recursive: true });
try {
  // Real room connections: the displayed count follows arrivals and departures.
  const context = await browser.newContext();
  await context.addInitScript(() => localStorage.setItem("held-participation", "watch"));
  const first = await context.newPage();
  await first.goto(base);
  await expect(first.locator("[data-live-sessions]")).toHaveText("1");
  const second = await context.newPage();
  await second.goto(base);
  await expect(first.locator("[data-live-sessions]")).toHaveText("2");
  await second.close();
  await expect(first.locator("[data-live-sessions]")).toHaveText("1");
  await context.close();

  // An untouched CPU-only visit offers its tiny tasks. Settings stops them.
  const cpu = await browser.newContext();
  await cpu.addInitScript(() => Object.defineProperty(navigator, "gpu", { value: undefined }));
  const page = await cpu.newPage();
  const events = [], requests = [];
  page.on("websocket", (socket) => socket.on("framesent", (frame) => {
    try { events.push(JSON.parse(String(frame.payload))); } catch {}
  }));
  page.on("request", (request) => {
    if (/huggingface|mlc-ai|\.wasm|\/api\/model\/|\/weights\//.test(request.url())) requests.push(request.url());
  });
  await page.goto(base);
  await expect.poll(() => events.some((e) => e.type === "checks" && e.enabled)).toBe(true);
  await page.getByRole("button", { name: "Contribution settings" }).click();
  const control = page.getByRole("switch", { name: "Browser compute" });
  await expect(control).toHaveAttribute("aria-checked", "true");
  await control.click();
  await expect(control).toHaveAttribute("aria-checked", "false");
  await expect.poll(() => events.filter((e) => e.type === "checks").at(-1)?.enabled).toBe(false);
  await page.getByRole("button", { name: "Got it" }).click();
  await expect(page.getByRole("button", { name: "Contribution settings" })).toBeFocused();
  events.length = 0;
  await page.reload();
  await page.getByText("You’re just watching", { exact: true }).waitFor();
  await expect.poll(() => events.filter((e) => e.type === "checks").at(-1)?.enabled).toBe(false);
  assert.equal(events.some((e) => e.type === "checks" && e.enabled), false);
  assert.equal(requests.length, 0);
  await page.getByRole("button", { name: "Contribution settings" }).click();
  await page.getByRole("switch", { name: "Browser compute" }).click();
  await expect.poll(() => events.filter((e) => e.type === "checks").at(-1)?.enabled).toBe(true);
  await cpu.close();

  // Display-only snapshots; intercepted in this browser, never posted to a room.
  const snapshot = await (await fetch(base + "/api/state?room=browser")).json();
  let fixture = { ...snapshot, viewers: 128, contributors: 2, agents: [], pipelines: [{ group: 0, ready: false, covered: 4, pieces: [
    { start: 0, end: 2, ready: true, busy: false },
    { start: 2, end: 4, ready: true, busy: false },
    { start: 4, end: 8, ready: false, busy: false },
  ] }] };
  const display = await browser.newContext({ viewport: { width: 390, height: 740 }, reducedMotion: "reduce" });
  await display.addInitScript(() => localStorage.setItem("held-participation", "watch"));
  let socket;
  await display.routeWebSocket("**/api/socket?**", (route) => {
    socket = route;
    route.send(JSON.stringify(fixture));
    route.onMessage(() => route.send(JSON.stringify(fixture)));
  });
  const view = await display.newPage();
  await view.goto(base);
  await expect(view.locator("[data-live-sessions]")).toHaveText("128");
  await expect(view.locator("[data-ready-browsers]")).toHaveText("2");
  await expect(view.locator("[data-loading-browsers]")).toHaveText("1");
  await expect(view.locator(".shared-layers .ready")).toHaveCount(4);
  await expect(view.locator(".shared-layers .loading")).toHaveCount(4);
  await expect(view.locator(".presence-work")).toContainText("4 of 36");
  await view.screenshot({ path: `${output}/presence-loading-fixture.png` });
  fixture = { ...fixture, contributors: 5, agents: [{ source: "browser" }], pipelines: [{ group: 0, ready: true, covered: 36, pieces: [{ start: 0, end: 36, ready: true, busy: true }] }] };
  socket.send(JSON.stringify(fixture));
  await expect(view.locator(".shared-layers .busy")).toHaveCount(36);
  await expect(view.locator(".presence-work")).toContainText("1 agent response is running across browsers");
  fixture = { ...fixture, agents: [], pipelines: [...fixture.pipelines, { group: 1, ready: false, covered: 2, pieces: [{ start: 0, end: 2, ready: true, busy: false }] }] };
  socket.send(JSON.stringify(fixture));
  await expect(view.locator(".shared-layers .ready")).toHaveCount(2);
  await expect(view.locator(".presence-work")).toContainText("1 complete browser group");
  socket.close({ code: 1011, reason: "local disconnect test" });
  await expect(view.locator("[data-live-sessions]")).toHaveText("—");
  await expect(view.locator("[data-ready-browsers]")).toHaveText("—");
  console.log("PASS: real session join/leave counts; Settings stops and resumes CPU tasks; off preference survives reload with no model requests; loading/working/multiple-group views; disconnect hides stale counts. Fixtures remained local.");
} finally {
  await browser.close();
}
