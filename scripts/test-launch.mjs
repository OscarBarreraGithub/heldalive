import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { WebSocket } from "ws";
const base = process.env.HELD_TEST_URL || "http://127.0.0.1:8787";
assert.ok(
  ["localhost", "127.0.0.1"].includes(new URL(base).hostname),
  "Operator switch test is local only",
);
const config = JSON.parse(
  await readFile(".local/launch-bridge-local.json", "utf8"),
);
const state = () =>
  fetch(base + "/api/state?room=browser").then((r) => r.json());
const support = (enabled, auth = true, room = "browser") =>
  fetch(base + `/api/launch-support?room=${room}`, {
    method: "POST",
    headers: auth ? { Authorization: `Bearer ${config.token}` } : {},
    body: JSON.stringify({ enabled }),
  });
async function until(fn, message, timeout = 90000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const r = await fn();
    if (r) return r;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(message);
}
let ws, timer;
try {
  assert.equal((await support(false, false)).status, 401);
  assert.equal((await support(false, true, "main")).status, 401);
  assert.equal((await support("yes")).status, 400);
  assert.equal(
    (await fetch(base + "/api/launch-support?room=browser")).status,
    405,
  );
  assert.equal((await support(true)).status, 200);
  const cookie = (await fetch(base + "/api/identity")).headers
    .get("set-cookie")
    .split(";")[0];
  ws = new WebSocket(base.replace("http", "ws") + "/api/socket?room=browser", {
    headers: { Origin: base, Cookie: cookie },
  });
  await new Promise((resolve, reject) => {
    ws.once("open", resolve);
    ws.once("error", reject);
  });
  timer = setInterval(
    () =>
      ws.readyState === 1 &&
      ws.send(JSON.stringify({ type: "ping", visible: true })),
    15000,
  );
  const before = await state();
  assert.equal(before.power.macAvailable, true);
  assert.equal(before.power.browserChains, 0);
  const active = await until(async () => {
    const s = await state();
    return s.agents.some((a) => a.source === "mac") && s;
  }, "Mac begins actual public task");
  const done = await until(async () => {
    const s = await state();
    return s.totalThoughts > before.totalThoughts && s;
  }, "Native public job completes");
  assert.equal((await support(false)).status, 200);
  const stopped = await state();
  assert.equal(stopped.modelAvailable, false);
  assert.equal(stopped.agents.length, 0);
  assert.equal(stopped.power.macAvailable, true);
  assert.equal(stopped.power.launchSupport, false);
  await new Promise((r) => setTimeout(r, 6500));
  assert.equal(
    (await state()).totalTokens,
    stopped.totalTokens,
    "Connected Mini must not generate in independence mode",
  );
  assert.equal((await support(true)).status, 200);
  const resumed = await until(async () => {
    const s = await state();
    return s.totalThoughts > stopped.totalThoughts && s;
  }, "Restored Mini completes a new thought");
  await mkdir(".local/qa/edition04", { recursive: true });
  await writeFile(
    ".local/qa/edition04/launch-result.json",
    JSON.stringify({ before, active, done, stopped, resumed }, null, 2),
  );
  console.log(
    "PASS: authenticated operator-only switch; actual Mini public inference with no browser chain; disabled support cancels work and freezes tokens despite connected Mini; enabling resumes inference.",
  );
} finally {
  clearInterval(timer);
  ws?.close();
  await support(true);
}
