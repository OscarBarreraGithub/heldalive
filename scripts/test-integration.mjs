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
const hour = new Date().getUTCHours();
const station = hour < 20 ? "research" : hour === 20 ? "mural" : "rest";
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
  const initialKind = station === "research" ? "pack" : "art";
  let next;
  if (station === "rest") {
    await wait(3500);
    assert.equal(
      viewer.state.agents.length,
      0,
      "No new browser work outside research/art windows",
    );
    assert.equal(clients.flatMap((c) => c.jobs).length, 0);
  } else {
    const first = await take(initialKind);
    assert.equal(first.job.maxTokens, initialKind === "pack" ? 140 : 384);
    assert.ok(
      clients
        .flatMap((c) => c.jobs)
        .every((j) => [initialKind, "recall"].includes(j.kind)),
    );
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
    assert.equal(inspected.maxOutputTokens, first.job.maxTokens);
    assert.equal(
      (await fetch(base + "/api/inputs?room=browser", { method: "POST" }))
        .status,
      405,
    );
    const before = viewer.state.artworkCount;
    const credits = first.c.profile.completedJobs;
    complete(
      first.c,
      first.job,
      initialKind === "pack" ? "" : "Here is a drawing with explanatory prose.",
    );
    await until(
      () => !viewer.state.agents.some((a) => a.id === first.job.id),
      "Invalid output rejected",
    );
    assert.equal(viewer.state.artworkCount, before);
    assert.equal(
      first.c.profile.completedJobs,
      credits,
      "Invalid output earns no credit",
    );
    const valid = await take(initialKind);
    if (initialKind === "art") {
      complete(valid.c, valid.job, art);
      await until(
        () => viewer.state.artworkCount > before,
        "Valid drawing archived",
      );
      assert.equal(viewer.state.artworks[0].text, art);
    } else {
      const record = valid.job.messages.at(-1).content.split("RECORD:\n")[1];
      assert.equal(record.split("\n").length, 12);
      const pairs = [
        ...record.matchAll(/(\w+) keeps a (\w+) in the \w+\./g),
      ].map((m) => [m[1], m[2]]);
      assert.equal(pairs.length, 12);
      const memory = pairs
        .map(([name, object]) => `${name}=${object}`)
        .join(";");
      assert.ok(memory.length <= 240);
      complete(valid.c, valid.job, memory);
      const recall = await take("recall");
      assert.equal(recall.job.maxTokens, 60);
      assert.equal(
        recall.job.messages.length,
        2,
        "Recall gets a new short context",
      );
      const prompt = recall.job.messages.at(-1).content;
      assert.ok(
        !prompt.includes("RECORD:\n"),
        "Full source record is not carried to recall",
      );
      assert.ok(
        prompt.includes(JSON.stringify(memory)),
        "Only compressed memory is carried forward",
      );
      const names = [...prompt.matchAll(/What object does (\w+) keep\?/g)].map(
        (m) => m[1],
      );
      const answers = names.map((name) => new Map(pairs).get(name));
      assert.equal(answers.length, 3);
      assert.ok(answers.every(Boolean));
      complete(recall.c, recall.job, JSON.stringify({ answers }));
      await until(
        () => viewer.state.trials.find((t) => t.id === recall.job.id),
        "Recall trial archived",
      );
      const { trials } = await fetch(base + "/api/trials?room=browser").then(
        (r) => r.json(),
      );
      const trial = trials.find((t) => t.id === recall.job.id);
      assert.ok(trial, "Stored trial API contains the completed fixture");
      assert.equal(trial.source, "browser");
      assert.equal(trial.record, record);
      assert.equal(trial.questions.length, 3);
      assert.deepEqual(trial.answers, answers);
      assert.deepEqual(trial.expected, answers);
      assert.equal(trial.correct, 3);
      assert.equal(trial.total, 3);
      assert.equal(trial.responseValid, true);
      assert.equal(trial.memory, memory);
      assert.equal(trial.model, model.label);
    }
    next = await until(() => {
      for (const c of clients) {
        const index = c.jobs.findIndex((j) =>
          viewer.state.agents.some((a) => a.id === j.id),
        );
        if (index >= 0) return { c, job: c.jobs.splice(index, 1)[0] };
      }
      return null;
    }, "Next scheduled job");
  }
  const missing = next
    ? workers.find((c) => c.piece.group === next.c.piece.group && c !== next.c)
    : workers[0];
  close(missing);
  if (next)
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
  await until(
    () => viewer.state.pipelines.filter((p) => p.ready).length === 2,
    "Two complete chains restored",
  );
  console.log(
    `PASS: authenticated sockets, votes rejected, no prompts, old-model refusal, physical coverage, two chains, ${station} schedule, ${station === "research" ? "pack/recall context boundary and persisted scored trial" : station === "mural" ? "valid artwork and invalid output rejection" : "rest-window inactivity"}, disconnect and gap replacement. LOCAL coordinator fixtures only, not inference evidence.`,
  );
} finally {
  for (const c of clients) close(c);
}
