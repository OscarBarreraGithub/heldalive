import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { WebSocket } from "ws";
const base = "http://127.0.0.1:8793";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
let server;
let client;
let heartbeat;
async function until(fn, label, ms = 45000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      const v = await fn();
      if (v) return v;
    } catch {}
    await delay(100);
  }
  throw new Error(label);
}
async function start() {
  server = spawn(
    process.execPath,
    [
      "node_modules/wrangler/bin/wrangler.js",
      "dev",
      "--port",
      "8793",
      "--persist-to",
      ".local/persistence-test",
      "--log-level",
      "error",
    ],
    { detached: true, stdio: "ignore" },
  );
  await until(async () => {
    const r = await fetch(base + "/api/health?room=browser");
    return r.ok;
  }, "Worker start");
}
async function stop() {
  clearInterval(heartbeat);
  if (server) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {}
    await new Promise((resolve) => {
      if (server.exitCode !== null) resolve();
      else server.once("exit", resolve);
    });
    server = null;
  }
  await delay(400);
}
async function connect() {
  const cookie = (await fetch(base + "/api/identity")).headers
    .get("set-cookie")
    .split(";")[0];
  const ws = new WebSocket(
    base.replace("http", "ws") + "/api/socket?room=browser",
    { headers: { Origin: base, Cookie: cookie } },
  );
  const c = {
    ws,
    jobs: [],
    state: null,
    send: (d) => ws.send(JSON.stringify(d)),
  };
  client = c;
  ws.on("message", (raw) => {
    const d = JSON.parse(String(raw));
    if (d.type === "job") c.jobs.push(d.job);
    if (d.type === "state") c.state = d;
  });
  ws.on("error", () => {});
  await new Promise((resolve) => ws.once("open", resolve));
  heartbeat = setInterval(() => {
    if (ws.readyState === 1) c.send({ type: "ping", visible: true });
  }, 10000);
  c.send({ type: "ready", ready: true, duty: 0.2, visible: true });
  return c;
}
function complete(c, job, text) {
  c.send({ type: "chunk", jobId: job.id, text });
  c.send({ type: "done", jobId: job.id, tokens: 10 });
}
try {
  await start();
  let c = await connect();
  // Drain an interrupted run until a fresh planner appears.
  let plan;
  await until(
    () => {
      for (const j of c.jobs.splice(0)) {
        if (j.kind === "plan") {
          plan = j;
          return true;
        }
        complete(c, j, "fixture persistence cleanup");
      }
      return false;
    },
    "planner",
    65000,
  );
  complete(
    c,
    plan,
    '{"project":"art","focus":"persistence test fixture","helpers":2}',
  );
  const art = await until(() => c.jobs.shift(), "first drawing");
  assert.equal(art.kind, "art");
  complete(c, art, " /\\\n(oo)\n --");
  const active = await until(() => c.jobs.shift(), "second drawing");
  assert.equal(active.kind, "art");
  const before = await fetch(base + "/api/state?room=browser").then((r) =>
    r.json(),
  );
  assert.equal(before.agents.length, 1);
  assert.ok(before.artworkCount > 0);
  await stop();
  await start();
  const after = await fetch(base + "/api/state?room=browser").then((r) =>
    r.json(),
  );
  assert.equal(after.artworkCount, before.artworkCount);
  assert.equal(after.totalThoughts, before.totalThoughts);
  assert.deepEqual(after.artworks, before.artworks);
  assert.equal(after.project.id, before.project.id);
  c = await connect();
  const resumed = await until(() => c.jobs.shift(), "reassigned durable lease");
  assert.equal(resumed.kind, "art");
  assert.notEqual(resumed.id, active.id);
  complete(c, resumed, "  *\n /|\\\n ---");
  await until(
    () => c.state?.artworkCount === before.artworkCount + 1,
    "resumed drawing persisted",
  );
  c.send({ type: "ready", ready: false });
  console.log(
    "PASS: process restart preserves archive, counters, project and in-flight work; orphaned lease is reassigned with a new ID",
  );
} finally {
  clearInterval(heartbeat);
  client?.ws.close();
  await stop();
}
