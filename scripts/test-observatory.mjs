import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const base = "http://127.0.0.1:8787";
const vars = await readFile(".dev.vars", "utf8");
const token = vars.match(/^BRIDGE_TOKEN=(.*)$/m)[1].replace(/^['"]|['"]$/g, "");
const now = Date.now();
const status = {
  updatedAt: now,
  station: "research",
  state: "idle",
  objective: "Local contract test",
  model: "test-fixture",
  activeAgents: 0,
  completedRuns: 0,
  startedAt: now,
  fundingDay: 1,
  repository: "https://github.com/heldalive/memory-research",
  lastError: "",
  memoryInstruction: "Keep name=object pairs.",
};
const post = (body, auth = token) =>
  fetch(base + "/api/observatory?room=browser", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + auth,
    },
    body: JSON.stringify(body),
  });
assert.equal((await post({ status }, "wrong")).status, 401);
assert.equal(
  (await post({ status: { ...status, activeAgents: 948 } })).status,
  400,
);
assert.equal(
  (await post({ status: { ...status, updatedAt: now - 300000 } })).status,
  409,
);
const run = {
  id: "local-contract-fixture",
  at: now,
  station: "research",
  title: "Contract fixture",
  summary: "Local only",
  body: "Validation fixture, never published live.",
  model: "test-fixture",
  durationMs: 10,
  inputTokens: 0,
  outputTokens: 0,
  helperCalls: 0,
  citations: [],
};
const tile = {
  id: "local-tile-fixture",
  index: 999,
  revision: 1,
  at: now,
  title: "Local fixture",
  text: Array(12).fill("  . /\\ .  ").join("\n"),
  note: "Local only",
  model: "test-fixture",
};
assert.equal((await post({ status, run, tile })).status, 200);
assert.equal((await post({ status, run, tile })).status, 200);
const data = await (await fetch(base + "/api/observatory?room=browser")).json();
assert.equal(data.runs.filter((r) => r.id === run.id).length, 1);
assert.equal(
  (
    await post({
      status,
      tile: { ...tile, text: "x".repeat(73) + "\n" + tile.text },
    })
  ).status,
  400,
);
assert.equal((await post({ status, extra: "unexpected" })).status, 400);
const tooBig = await fetch(base + "/api/observatory?room=browser", {
  method: "POST",
  headers: { Authorization: "Bearer " + token },
  body: "x".repeat(33000),
});
assert.equal(tooBig.status, 413);
const chunkedTooBig = await fetch(base + "/api/observatory?room=browser", {
  method: "POST",
  headers: { Authorization: "Bearer " + token },
  body: new ReadableStream({
    start(controller) {
      for (let i = 0; i < 34; i++) controller.enqueue(new Uint8Array(1000));
      controller.close();
    },
  }),
  duplex: "half",
});
assert.equal(chunkedTooBig.status, 413);

const mural = await (
  await fetch(base + "/api/mural?room=browser&offset=0")
).json();
assert.equal(mural.tiles.filter((t) => t.id === tile.id).length, 1);
assert.equal(
  (await fetch(base + "/api/mural?room=browser", { method: "POST" })).status,
  405,
);
console.log(
  "PASS: observatory auth, validation, request cap, stale heartbeat, idempotent publication, mural sizing and read-only public endpoints (local fixtures only).",
);
