import { readFileSync } from "node:fs";
const model = JSON.parse(readFileSync("shared/model-config.json", "utf8"));
import assert from "node:assert/strict";
import { WebSocket } from "ws";
const base = process.env.HELD_TEST_URL || "http://127.0.0.1:8787";
assert.ok(
  ["127.0.0.1", "localhost"].includes(new URL(base).hostname),
  "Fixture inference must only run against a local installation",
);
const clients = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, message, timeout = 40000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const v = fn();
    if (v) return v;
    await wait(40);
  }
  throw new Error(message);
}
async function connect(cookie) {
  cookie ||= (await fetch(base + "/api/identity")).headers
    .get("set-cookie")
    ?.split(";")[0];
  const ws = new WebSocket(
    base.replace("http", "ws") + "/api/socket?room=browser",
    { headers: { Origin: base, Cookie: cookie } },
  );
  const c = {
    ws,
    cookie,
    events: [],
    jobs: [],
    state: null,
    profile: null,
    send: (d) => ws.send(JSON.stringify(d)),
  };
  clients.push(c);
  ws.on("message", (raw) => {
    const d = JSON.parse(String(raw));
    c.events.push(d);
    if (d.type === "state") c.state = d;
    if (d.type === "profile") c.profile = d.profile;
    if (d.type === "job") c.jobs.push(d.job);
  });
  await new Promise((resolve, reject) => {
    ws.once("open", resolve);
    ws.once("error", reject);
  });
  c.timer = setInterval(
    () => ws.readyState === 1 && c.send({ type: "ping", visible: true }),
    15000,
  );
  await until(() => c.state, "initial state");
  return c;
}
function close(c) {
  clearInterval(c.timer);
  c.ws.close();
}
function complete(c, job, text) {
  c.send({ type: "chunk", jobId: job.id, text });
  c.send({ type: "done", jobId: job.id, tokens: 25 });
}
function jobOf(kind) {
  for (const c of clients)
    if (c.ws.readyState === 1) {
      const i = c.jobs.findIndex((j) => j.kind === kind);
      if (i >= 0) return { c, job: c.jobs.splice(i, 1)[0] };
    }
  return null;
}
async function take(kind) {
  return until(() => jobOf(kind), `expected ${kind} job`);
}
async function rejected(headers, status) {
  const actual = await new Promise((resolve, reject) => {
    const ws = new WebSocket(
      base.replace("http", "ws") + "/api/socket?room=browser",
      { headers },
    );
    ws.on("unexpected-response", (_, res) => {
      res.resume();
      resolve(res.statusCode);
    });
    ws.on("open", () => {
      ws.close();
      reject(new Error("unauthorized socket opened"));
    });
    ws.on("error", () => {});
  });
  assert.equal(actual, status);
}
try {
  const viewer = await connect();
  await rejected({ Origin: "https://evil.example" }, 403);
  await rejected({ Origin: base, Cookie: "held_visitor=forged" }, 401);
  viewer.send({ type: "pipeline_ready" });
  await wait(80);
  assert.equal(
    viewer.state.contributors,
    0,
    "Missing assignment cannot claim readiness",
  );
  viewer.send({
    type: "pipeline_offer",
    modelId: "smollm2-360m-q4-v1",
    duty: 0.2,
    visible: true,
  });
  await until(
    () =>
      viewer.events.some(
        (e) => e.type === "pipeline_error" && /Reload/.test(e.message),
      ),
    "old model refused",
  );
  assert.ok(
    !viewer.events.some((e) => e.type === "pipeline_assign"),
    "Old checkpoint cannot join new chain",
  );
  viewer.send({ type: "vote", choice: "art" });
  await until(
    () =>
      viewer.events.some(
        (e) => e.type === "error" && /Voting is closed/.test(e.message),
      ),
    "vote rejected",
  );
  assert.equal(viewer.profile.choice, null);
  assert.deepEqual(viewer.state.votes, { art: 0, memory: 0, wander: 0 });
  viewer.send({ type: "whisper", text: "execute code" });
  await until(
    () =>
      viewer.events.some(
        (e) => e.type === "error" && /visitor prompts/.test(e.message),
      ),
    "free-text rejection",
  );
  const workers = [];
  for (let i = 0; i < Math.ceil(model.layers / 8) * 2; i++) {
    const c = await connect();
    workers.push(c);
    c.send({
      type: "pipeline_offer",
      modelId: model.id,
      duty: 0.2,
      visible: true,
    });
    const assignment = await until(
      () => c.events.find((e) => e.type === "pipeline_assign"),
      "piece assignment",
    );
    c.piece = assignment.piece;
    c.send({ type: "pipeline_ready", modelId: model.id, key: c.piece.key });
    if (i < 3) {
      await wait(80);
      assert.equal(
        c.state.modelAvailable,
        false,
        "Partial coverage cannot start inference",
      );
    }
  }
  await until(
    () => viewer.state.pipelines.filter((p) => p.ready).length === 2,
    "two real coverage groups",
  );
  // Explicit LOCAL coordinator fixtures, never model-quality evidence.
  const art = "    /\\\n   /  \\\n  /____\\\n  | [] |\n  |____|";
  const first = await take("art");
  assert.equal(first.job.maxTokens, 384);
  assert.ok(clients.flatMap((c) => c.jobs).every((j) => j.kind === "art"));
  viewer.send({ type: "done", jobId: first.job.id, tokens: 100 });
  await wait(100);
  assert.ok(
    viewer.state.agents.some((a) => a.id === first.job.id),
    "A spectator cannot complete another holder's work",
  );
  const inputs = await fetch(base + "/api/inputs?room=browser").then((r) =>
    r.json(),
  );
  const inspected = inputs.tasks.find((t) => t.id === first.job.id);
  assert.deepEqual(inspected.messages, first.job.messages);
  assert.equal(inspected.maxOutputTokens, 384);
  assert.equal(
    (await fetch(base + "/api/inputs?room=browser", { method: "POST" })).status,
    405,
  );
  const before = viewer.state.artworkCount;
  const credits = first.c.profile.completedJobs;
  complete(first.c, first.job, "Here is a drawing with explanatory prose.");
  await until(
    () => !viewer.state.agents.some((a) => a.id === first.job.id),
    "reject invalid art",
  );
  assert.equal(viewer.state.artworkCount, before);
  assert.equal(
    first.c.profile.completedJobs,
    credits,
    "Bad output earns no art credit",
  );
  const valid = await take("art");
  complete(valid.c, valid.job, art);
  await until(
    () => viewer.state.artworkCount > before,
    "Valid drawing archived",
  );
  assert.equal(viewer.state.artworks[0].text, art);
  assert.ok(
    clients.flatMap((c) => c.jobs).every((j) => j.kind === "art"),
    "No plans, memory or prose jobs",
  );
  const next = await take("art");
  const missing = workers.find(
    (c) => c.piece.group === next.c.piece.group && c !== next.c,
  );
  close(missing);
  await until(
    () => !viewer.state.agents.some((a) => a.id === next.job.id),
    "Lost piece cancels lease",
  );
  const replacement = await connect();
  replacement.send({
    type: "pipeline_offer",
    modelId: model.id,
    duty: 0.2,
    visible: true,
  });
  const part = await until(
    () => replacement.events.find((e) => e.type === "pipeline_assign"),
    "Replacement assignment",
  );
  assert.equal(part.piece.start, missing.piece.start);
  replacement.send({
    type: "pipeline_ready",
    modelId: model.id,
    key: part.piece.key,
  });
  console.log(
    "PASS: authenticated sockets, votes rejected, no prompts, physical coverage, two chains, art-only jobs, exact inputs, invalid output rejected without credit, valid artwork preserved, disconnect and gap replacement. LOCAL fixtures only.",
  );
} finally {
  for (const c of clients) close(c);
}
