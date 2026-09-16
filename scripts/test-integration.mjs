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
  viewer.send({ type: "vote", choice: "memory" });
  await until(() => viewer.profile?.choice === "memory", "fixed vote");
  viewer.send({ type: "vote", choice: "art" });
  await wait(80);
  assert.equal(viewer.profile.choice, "memory");
  viewer.send({ type: "whisper", text: "execute code" });
  await until(
    () => viewer.events.some((e) => e.type === "error"),
    "free-text rejection",
  );
  const workers = [];
  for (let i = 0; i < 8; i++) {
    const c = await connect();
    workers.push(c);
    c.send({ type: "pipeline_offer", duty: 0.2, visible: true });
    const assignment = await until(
      () => c.events.find((e) => e.type === "pipeline_assign"),
      "piece assignment",
    );
    c.piece = assignment.piece;
    c.send({ type: "pipeline_ready", key: c.piece.key });
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
  // These are explicitly LOCAL fixtures for coordinator behavior, not a model benchmark.
  // Drain interrupted test work; then make a fresh, deterministic memory project.
  let planner;
  const drainEnd = Date.now() + 65000;
  while (Date.now() < drainEnd && !planner) {
    planner = jobOf("plan");
    if (planner) break;
    for (const c of workers)
      for (const j of c.jobs.splice(0))
        complete(
          c,
          j,
          j.kind === "recall"
            ? '{"answers":["unknown","unknown","unknown"]}'
            : "local fixture",
        );
    await wait(100);
  }
  assert.ok(planner, "fresh planner");
  viewer.send({ type: "done", jobId: planner.job.id, tokens: 100 });
  await wait(100);
  assert.ok(
    viewer.state.active,
    "A spectator cannot complete another holder’s task",
  );
  complete(
    planner.c,
    planner.job,
    '{"project":"memory","focus":"local fixture: improving records","helpers":3}',
  );
  const method = await take("method");
  complete(
    method.c,
    method.job,
    "Write name=object pairs, separated by semicolons. Keep every name and object. Drop all locations.",
  );
  let recalled = 0;
  const end = Date.now() + 80000;
  while (recalled < 5 && Date.now() < end) {
    const pack = jobOf("pack");
    if (pack) {
      const facts = [
        ...pack.job.messages.at(-1).content.matchAll(/(\w+) keeps a (\w+) in/g),
      ];
      complete(pack.c, pack.job, facts.map((m) => `${m[1]}=${m[2]}`).join(";"));
    }
    const recall = jobOf("recall");
    if (recall) {
      const prompt = recall.job.messages.at(-1).content;
      const pairs = Object.fromEntries(
        [...prompt.matchAll(/(\w+)=(\w+)/g)].map((m) => [m[1], m[2]]),
      );
      const names = [...prompt.matchAll(/What object does (\w+) keep/g)].map(
        (m) => m[1],
      );
      complete(
        recall.c,
        recall.job,
        JSON.stringify({ answers: names.map((n) => pairs[n] || "unknown") }),
      );
      recalled++;
    }
    await wait(80);
  }
  assert.equal(
    recalled,
    5,
    "baseline, current, and candidate each receive recall",
  );
  const reflection = await take("reflect");
  complete(
    reflection.c,
    reflection.job,
    "Local fixture journal: compared all five approaches.",
  );
  await until(
    () => viewer.state.project?.status === "finished",
    "workshop complete",
  );
  const files = await fetch(base + "/api/workspace?room=browser").then((r) =>
    r.json(),
  );
  assert.ok(
    files.files.some(
      (f) => f.path === "memory/strategy.md" && f.author === "model",
    ),
    "Model-written method preserved",
  );
  assert.ok(
    files.files.some((f) => f.path === "journal.md"),
    "Journal revision preserved",
  );
  assert.ok(
    viewer.state.activity.some((e) => e.text.startsWith("Memory comparison:")),
    "Paired method decision is recorded",
  );
  // The next real lease stops when any of its physical pieces leaves.
  const next = await take("plan");
  const missing = workers.find(
    (c) => c.piece.group === next.c.piece.group && c !== next.c,
  );
  close(missing);
  await until(
    () => !viewer.state.agents.some((a) => a.id === next.job.id),
    "lost piece cancels lease",
  );
  const replacement = await connect();
  replacement.send({ type: "pipeline_offer", duty: 0.2, visible: true });
  const part = await until(
    () => replacement.events.find((e) => e.type === "pipeline_assign"),
    "replacement assignment",
  );
  assert.equal(part.piece.start, missing.piece.start);
  replacement.send({ type: "pipeline_ready", key: part.piece.key });
  console.log(
    "PASS: authenticated sockets, fixed votes, no visitor prompts, physical coverage, two chains, model-written methods, paired evaluation, public revisions, disconnect and gap replacement. All content here was a LOCAL coordinator fixture.",
  );
} finally {
  for (const c of clients) close(c);
}
