/** Local-only SQL/write-budget and restart fixtures; never publishes research. */
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { execFileSync } from "node:child_process";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { build } from "esbuild";

const baseline = process.argv.includes("--baseline");
const baselineRef = "7302523"; // Deployed app before the quota fix.
const model = JSON.parse(await readFile("shared/model-config.json", "utf8"));
const bundled = await build({
  entryPoints: ["worker/index.ts"],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  target: "node26",
  plugins: [
    {
      name: "local-do-harness",
      setup(b) {
        b.onResolve({ filter: /^cloudflare:workers$/ }, () => ({
          path: "do",
          namespace: "fixture",
        }));
        b.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          contents:
            "export class DurableObject { constructor(ctx, env) { this.ctx = ctx; this.env = env; } }",
        }));
        if (baseline)
          b.onLoad(
            { filter: /worker\/(index|director-store)\.ts$/ },
            ({ path }) => ({
              contents: execFileSync(
                "git",
                ["show", `${baselineRef}:worker/${path.split("/").at(-1)}`],
                { encoding: "utf8" },
              ),
              loader: "ts",
              resolveDir: path.slice(0, path.lastIndexOf("/")),
            }),
          );
      },
    },
  ],
});
const { LivingRoom } = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`
);
let now = Date.parse("2026-09-24T00:00:00Z"),
  timerId = 0;
const timers = new Map();
const real = {
  now: Date.now,
  setInterval,
  clearInterval,
  setTimeout,
  clearTimeout,
};
Date.now = () => now;
globalThis.setInterval = (fn, ms) => {
  const id = ++timerId;
  timers.set(id, { fn, ms, next: now + ms, repeat: true });
  return id;
};
globalThis.setTimeout = (fn, ms) => {
  const id = ++timerId;
  timers.set(id, { fn, ms, next: now + ms });
  return id;
};
globalThis.clearTimeout = globalThis.clearInterval = (id) => timers.delete(id);
globalThis.WebSocket = { OPEN: 1 };

function harness() {
  const db = new DatabaseSync(":memory:");
  let sqlWrites = 0,
    alarms = 0,
    nextAlarm = null,
    reads = 0;
  const waits = [],
    sockets = [];
  const sql = {
    exec(query, ...args) {
      const statement = db.prepare(query);
      const before = db.prepare("SELECT total_changes() AS n").get().n;
      const rows = statement.all(...args);
      sqlWrites += db.prepare("SELECT total_changes() AS n").get().n - before;
      if (/^SELECT/i.test(query)) reads++;
      return {
        toArray: () => rows,
        one() {
          assert.equal(rows.length, 1);
          return rows[0];
        },
      };
    },
  };
  const ctx = {
    storage: {
      sql,
      async setAlarm(at) {
        alarms++;
        nextAlarm = Number(at);
      },
      async getAlarm() {
        return nextAlarm;
      },
      async deleteAlarm() {
        nextAlarm = null;
      },
      transactionSync(fn) {
        db.exec("BEGIN");
        try {
          const result = fn();
          db.exec("COMMIT");
          return result;
        } catch (e) {
          db.exec("ROLLBACK");
          throw e;
        }
      },
    },
    getWebSockets: () => sockets,
    waitUntil: (p) => waits.push(p),
  };
  const env = { GITHUB_TOKEN: "", BRIDGE_TOKEN: "local-fixture-only" };
  let room = new LivingRoom(ctx, env);
  room.state.room = "browser";
  const stats = () => ({
    sqlWrites,
    alarmWrites: alarms,
    totalWrites: sqlWrites + alarms,
    selectQueries: reads,
  });
  return {
    db,
    sql,
    ctx,
    sockets,
    get room() {
      return room;
    },
    stats,
    reset() {
      sqlWrites = alarms = reads = 0;
    },
    socket(role = "visitor", ready = false) {
      let attachment = {
        id: crypto.randomUUID(),
        identity: crypto.randomUUID(),
        role,
        ip: "fixture",
        seen: now,
        visible: true,
        ready,
        protocol: 2,
        duty: 0.2,
        availableAt: 0,
        lastMessage: 0,
        burst: 0,
        checks: false,
        nextAuditAt: 0,
        audit: null,
      };
      const messages = [];
      const ws = {
        readyState: 1,
        messages,
        serializeAttachment(p) {
          attachment = structuredClone(p);
        },
        deserializeAttachment() {
          return structuredClone(attachment);
        },
        send(raw) {
          const d = JSON.parse(raw);
          if (
            d.type !== "state" &&
            d.type !== "pong" &&
            d.type !== "pipeline_reply"
          )
            messages.push(d);
        },
        close() {
          this.readyState = 3;
        },
      };
      sockets.push(ws);
      if (role === "visitor")
        sql.exec(
          "INSERT INTO visitors(id,last_seen) VALUES(?,?)",
          attachment.identity,
          now,
        );
      return ws;
    },
    async advance(to) {
      while (true) {
        const nextTimer = Math.min(...[...timers.values()].map((t) => t.next));
        const next = Math.min(nextAlarm ?? Infinity, nextTimer);
        if (next > to) break;
        now = next;
        if (nextAlarm !== null && nextAlarm <= now) {
          nextAlarm = null;
          await room.alarm();
        }
        for (const [id, t] of [...timers])
          if (t.next <= now) {
            if (t.repeat) t.next = now + t.ms;
            else timers.delete(id);
            await t.fn();
          }
        await Promise.all(waits.splice(0));
      }
      now = to;
    },
    restart() {
      timers.clear();
      room = new LivingRoom(ctx, env);
      return room;
    },
    close() {
      timers.clear();
      db.close();
    },
  };
}
const send = (h, ws, data) => h.room.webSocketMessage(ws, JSON.stringify(data));
const answer = JSON.stringify({
  summary: "Local storage fixture",
  content: "Compare correction handling using a fixed memory budget.",
  decision: "advance",
  search: "agent memory corrections",
  sources: "none",
  nextTask: "Compare correction handling under a fixed memory budget.",
  lesson: "Keep the test workload fixed.",
});
const report = { mode: baseline ? `baseline ${baselineRef}` : "working tree" };
try {
  // Replay a full day of an idle connected bridge, including every heartbeat.
  const h = harness();
  h.room.director.setEnabled(true);
  const bridge = h.socket("bridge");
  await h.room.tick();
  const start = now;
  h.reset();
  for (let t = 15000; t <= 86400000; t += 15000) {
    await h.advance(start + t);
    await send(h, bridge, { type: "ping" });
  }
  report.idleBridge24h = h.stats();
  if (!baseline) assert.ok(report.idleBridge24h.totalWrites <= 2900);
  h.close();
  if (!baseline) {
    // Audience size must not turn heartbeats into persistent writes.
    const many = harness();
    many.room.director.setEnabled(true);
    const visitors = Array.from({ length: 100 }, () => many.socket());
    await many.room.tick();
    many.reset();
    const start = now;
    for (let t = 15000; t <= 86400000; t += 15000) {
      await many.advance(start + t);
      for (const ws of visitors)
        await send(many, ws, { type: "ping", visible: true });
    }
    report.idle100Browsers24h = many.stats();
    assert.ok(many.stats().totalWrites <= 2900);
    for (const ws of visitors) ws.close();
    await many.room.tick();
    many.reset();
    await many.advance(now + 86400000);
    report.emptyRoom24h = many.stats();
    assert.equal(many.stats().totalWrites, 0);
    many.close();

    // Real role dispatch and acceptance, with a large stream of layer results.
    const work = harness();
    work.room.director.setEnabled(true);
    const b = work.socket("bridge", true);
    await work.room.director.prepare(1, now);
    await work.room.tick();
    let job = b.messages.find((m) => m.type === "job").job;
    const originalInstance = job.agent.instanceId;
    work.reset();
    for (let i = 0; i < answer.length; i++) {
      now++;
      await send(work, b, { type: "chunk", jobId: job.id, text: answer[i] });
    }
    report.draftCharacters = answer.length;
    assert.equal(work.stats().sqlWrites, 0, "Draft tokens must not write SQL");
    assert.ok(
      work.room.activeTimer,
      "In-flight text must not be discarded by normal hibernation",
    );
    assert.equal(work.room.state.active[0].text, answer);
    const stored = JSON.parse(
      work.sql.exec("SELECT value FROM creature WHERE id=1").one().value,
    );
    assert.equal(stored.active[0].text, "");
    const staleHolder = work.socket();
    const stalePeer = staleHolder.deserializeAttachment();
    stalePeer.stageJob = job.id;
    stalePeer.stagePosition = 12;
    stalePeer.pending = { jobId: job.id, leader: b.deserializeAttachment().id };
    staleHolder.serializeAttachment(stalePeer);
    work.restart();
    assert.equal(staleHolder.deserializeAttachment().pending, undefined);
    assert.equal(staleHolder.deserializeAttachment().stageJob, undefined);
    assert.ok(staleHolder.messages.some((m) => m.type === "pipeline_reset"));
    assert.equal(
      work.room.state.active.length,
      0,
      "Restart invalidates unfinished transport lease",
    );
    assert.equal(work.room.director.find(originalInstance).interruptions, 1);
    await send(work, b, { type: "done", jobId: job.id, tokens: 70 });
    assert.equal(
      work.room.director.state.completed,
      0,
      "Old lease cannot commit missing draft text",
    );
    now = work.room.state.launchAvailableAt + 1;
    const peer = b.deserializeAttachment();
    peer.seen = now;
    b.serializeAttachment(peer);
    await work.room.tick();
    job = b.messages.filter((m) => m.type === "job").at(-1).job;
    assert.equal(job.agent.instanceId, originalInstance);
    assert.notEqual(job.id, stored.active[0].task.id);
    // Exercise the actual pipeline_result branch without running an LLM.
    const holder = work.socket();
    const holderPeer = holder.deserializeAttachment();
    holderPeer.ready = true;
    holderPeer.piece = {
      group: 0,
      start: model.layers - 1,
      end: model.layers,
      key: "fixture",
    };
    holder.serializeAttachment(holderPeer);
    work.reset();
    for (let i = 0; i < 10000; i++) {
      now += 2;
      const p = holder.deserializeAttachment();
      p.pending = {
        leader: peer.id,
        jobId: job.id,
        rid: `r${i}`,
        count: 1,
        deadline: now + 60000,
      };
      holder.serializeAttachment(p);
      await send(work, holder, {
        type: "pipeline_result",
        jobId: job.id,
        rid: `r${i}`,
        top: [[1, 1]],
        computeMs: 2,
      });
    }
    assert.equal(work.stats().sqlWrites, 0, "Layer results must not write SQL");
    assert.equal(work.room.state.active[0].computeMs, 20000);
    report.layerResultsWithoutWrites = 10000;
    await send(work, b, { type: "chunk", jobId: job.id, text: answer });
    await send(work, b, {
      type: "done",
      jobId: job.id,
      tokens: 70,
      inputTokens: 200,
    });
    assert.equal(work.room.director.state.completed, 1);
    assert.equal(work.room.activeTimer, undefined);
    work.restart();
    assert.equal(work.room.director.state.completed, 1);
    assert.equal(
      work.sql.exec("SELECT COUNT(*) AS n FROM agent_instances").one().n,
      1,
    );
    assert.equal(
      work.room.directorStore.publicationCount(),
      1,
      "Publication remains durable",
    );
    report.restartRecovery =
      "same role, fresh lease, stale completion rejected; completed result and outbox survive";
    work.close();

    const paused = harness();
    paused.room.director.setEnabled(true);
    paused.socket("bridge", true);
    await paused.room.director.prepare(1, now);
    await paused.room.tick();
    assert.equal(paused.room.state.active.length, 1);
    now += 3 * 86400000;
    paused.restart();
    assert.ok(
      paused.room.state.launchAvailableAt < now,
      "A long deployment pause must not be billed as inference duty time",
    );
    assert.equal(paused.room.director.pending().length, 1);
    paused.close();

    // Frequent sampling updates get one visitor credit batch, not per-token SQL.
    const checks = harness();
    const visitor = checks.socket(),
      leader = checks.socket();
    const v = visitor.deserializeAttachment(),
      l = leader.deserializeAttachment();
    checks.room.save();
    checks.reset();
    for (let i = 0; i < 1000; i++) {
      now += 10;
      v.lastMessage = 0;
      v.samplePending = {
        leader: l.id,
        jobId: "fixture",
        rid: String(i),
        tokens: [1],
        deadline: now + 2500,
      };
      visitor.serializeAttachment(v);
      await send(checks, visitor, {
        type: "pipeline_sampled",
        rid: String(i),
        token: 1,
      });
    }
    assert.equal(checks.stats().sqlWrites, 0);
    assert.equal(checks.room.profile(v.identity).checks, 1000);
    await checks.advance(now + 60000);
    assert.equal(
      checks.stats().sqlWrites,
      2,
      "One visitor row and one global state checkpoint",
    );
    checks.restart();
    assert.equal(checks.room.profile(v.identity).checks, 1000);
    assert.equal(checks.room.state.totalChecks, 1000);
    await send(checks, visitor, { type: "checkin" });
    checks.reset();
    await send(checks, visitor, { type: "checkin" });
    assert.equal(
      checks.stats().sqlWrites,
      0,
      "Repeated check-in must not rewrite the same day",
    );
    checks.close();
    report.samplingCredits =
      "1000 checks batched into 2 SQL row writes; counters survive restart";
  }
  await mkdir(".local/qa/storage-budget", { recursive: true });
  await writeFile(
    `.local/qa/storage-budget/${baseline ? "baseline" : "fixed"}.json`,
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  Date.now = real.now;
  Object.assign(globalThis, {
    setInterval: real.setInterval,
    clearInterval: real.clearInterval,
    setTimeout: real.setTimeout,
    clearTimeout: real.clearTimeout,
  });
  timers.clear();
}
