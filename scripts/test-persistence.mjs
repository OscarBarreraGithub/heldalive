import { readFileSync } from "node:fs";
const model = JSON.parse(readFileSync("shared/model-config.json", "utf8"));
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { WebSocket } from "ws";
const base = "http://127.0.0.1:8793";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
let server;
let client;
const heartbeats = [];
const clients = [];
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
      ".local/art-persistence-test",
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
  heartbeats.splice(0).forEach(clearInterval);
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
async function oneHolder() {
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
  clients.push(c);
  ws.on("message", (raw) => {
    const d = JSON.parse(String(raw));
    if (d.type === "pipeline_assign") {
      c.piece = d.piece;
      c.send({ type: "pipeline_ready", modelId: model.id, key: d.piece.key });
    }
    if (d.type === "job") c.jobs.push(d.job);
    if (d.type === "state") c.state = d;
  });
  ws.on("error", () => {});
  await new Promise((resolve) => ws.once("open", resolve));
  heartbeats.push(
    setInterval(() => {
      if (ws.readyState === 1) c.send({ type: "ping", visible: true });
    }, 10000),
  );
  c.send({
    type: "pipeline_offer",
    modelId: model.id,
    duty: 0.2,
    visible: true,
  });
  await until(() => c.piece, "assigned piece");
  return c;
}
async function connect() {
  const holders = [];
  for (let i = 0; i < Math.ceil(model.layers / 8); i++)
    holders.push(await oneHolder());
  return holders[0];
}
function complete(c, job, text) {
  c.send({ type: "chunk", jobId: job.id, text });
  c.send({ type: "done", jobId: job.id, tokens: 10 });
}
try {
  await start();
  let c = await connect();
  const art = await until(() => c.jobs.shift(), "first drawing");
  assert.equal(art.kind, "art");
  complete(c, art, "    /\\\n   /  \\\n  /____\\\n  | [] |\n  |____|");
  const active = await until(() => c.jobs.shift(), "second drawing");
  assert.equal(active.kind, "art");
  const before = await fetch(base + "/api/state?room=browser").then((r) =>
    r.json(),
  );
  assert.equal(before.agents.length, 1);
  assert.ok(before.artworkCount > 0);
  const config = JSON.parse(await readFile(".local/bridge-local.json", "utf8"));
  const response = await fetch(base + "/api/launch-support?room=browser", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}` },
    body: JSON.stringify({ enabled: false }),
  });
  assert.equal(response.status, 200);
  await stop();
  await start();
  assert.equal(
    (await fetch(base + "/api/state?room=browser").then((r) => r.json())).power
      .launchSupport,
    false,
    "Independence choice persists through process restart",
  );
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
  complete(c, resumed, "    /\\\n   /  \\\n  /____\\\n  | [] |\n  |____|");
  await until(
    () => c.state?.artworkCount === before.artworkCount + 1,
    "resumed drawing persisted",
  );
  c.send({ type: "pipeline_stop" });
  console.log(
    "PASS: process restart preserves archive, counters, project and in-flight work; orphaned lease is reassigned with a new ID",
  );
} finally {
  heartbeats.splice(0).forEach(clearInterval);
  for (const c of clients) c.ws.close();
  await stop();
}
