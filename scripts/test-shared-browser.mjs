import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.HELD_TEST_URL || "http://127.0.0.1:8787";
assert.ok(
  ["127.0.0.1", "localhost"].includes(new URL(base).hostname),
  "Browser chain checks are local only",
);
const count = Number(process.env.HELD_TEST_PEERS || 5);
const hour = new Date().getUTCHours();
const station = hour < 20 ? "research" : hour === 20 ? "mural" : "rest";
assert.notEqual(
  station,
  "rest",
  "Run actual model work during 00–20 UTC research or 20–21 UTC art; rest windows intentionally schedule no new jobs",
);
const output = ".local/qa/edition08";
const startedAll = Date.now();
const requestedJobs = Number(process.env.HELD_TEST_JOBS || 1);
const browser = await chromium.launch({ headless: true, channel: "chromium" });
const contexts = [];
const pages = [];
const events = [];
const assignments = [];
const downloads = [];
let browserDone = 0;
const modelJobs = new Map();
const completedJobs = new Set();
const pageErrors = [];
const browserTrials = async () => {
  const { trials } = await fetch(base + "/api/trials?room=browser").then((r) =>
    r.json(),
  );
  return trials.filter(
    (t) =>
      t.source === "browser" &&
      completedJobs.has(t.id) &&
      [...modelJobs.values()].some(
        (job) =>
          job.kind === "pack" &&
          completedJobs.has(job.id) &&
          job.messages.at(-1).content.split("RECORD:\n")[1] === t.record,
      ),
  );
};
function verifyTrial(trial) {
  assert.equal(trial.source, "browser");
  assert.equal(
    modelJobs.get(trial.id)?.kind,
    "recall",
    "Stored result came from a browser recall job",
  );
  assert.equal(trial.record.split("\n").length, 12);
  assert.equal(trial.questions.length, 3);
  assert.equal(trial.expected.length, 3);
  assert.equal(trial.answers.length, 3);
  assert.equal(trial.responseValid, true);
  assert.ok(trial.memory.length > 0 && trial.memory.length <= 240);
  assert.equal(trial.total, 3);
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  assert.equal(
    trial.correct,
    trial.expected.reduce(
      (score, answer, i) =>
        score + Number(normalize(answer) === normalize(trial.answers[i] || "")),
      0,
    ),
    "Published score is reproducible from stored answers",
  );
  assert.match(trial.model, /Qwen3/);
  const prompt = modelJobs.get(trial.id).messages;
  assert.equal(prompt.length, 2, "Recall starts from a separate short context");
  assert.ok(!prompt.at(-1).content.includes("RECORD:\n"));
}
const nativeDuringLaunch = process.env.HELD_TEST_LAUNCH === "1";
let config;
if (nativeDuringLaunch) {
  const { readFile } = await import("node:fs/promises");
  config = JSON.parse(
    await readFile(
      process.env.HELD_CONFIG || ".local/launch-bridge-local.json",
      "utf8",
    ),
  );
}
async function support(enabled) {
  if (!config) return;
  assert.equal(new URL(config.url).origin, new URL(base).origin);
  const r = await fetch(base + "/api/launch-support?room=browser", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ enabled }),
  });
  assert.equal(r.status, 200);
}
await mkdir(output, { recursive: true });
const state = async () =>
  fetch(base + "/api/state?room=browser").then((r) => r.json());
try {
  await support(true);
  const before = await state();
  for (let i = 0; i < count; i++) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    contexts.push(context);
    const page = await context.newPage();
    await page.addInitScript(() => {
      const NativeSocket = window.WebSocket;
      window.WebSocket = class extends NativeSocket {
        constructor(...args) {
          super(...args);
          this.addEventListener("close", (event) => {
            if (event.code !== 1000)
              console.warn("Test socket closed", event.code, event.reason);
          });
        }
      };
    });
    pages.push(page);
    downloads[i] = [];
    page.on("request", (r) => {
      const match = new URL(r.url()).pathname.match(
        /\/weights\/[^/]+\/(.+)\.bin$/,
      );
      if (match) downloads[i].push(match[1]);
    });
    page.on("websocket", (ws) =>
      ws.on("framereceived", (frame) => {
        try {
          const d = JSON.parse(String(frame.payload));
          if (d.type === "pipeline_assign") assignments[i] = d.piece;
          if (d.type === "job") modelJobs.set(d.job.id, d.job);
        } catch {}
      }),
    );
    page.on("console", (m) => {
      if (m.type() === "warning" || m.type() === "error")
        console.log("browser", i, m.text().slice(0, 500));
    });
    page.on("pageerror", (e) => {
      pageErrors.push(e.message);
      console.log("ERROR", i, e.message);
    });
    page.on("websocket", (ws) =>
      ws.on("framesent", (frame) => {
        try {
          const message = JSON.parse(String(frame.payload));
          if (message.type === "done") {
            browserDone++;
            completedJobs.add(message.jobId);
          }
        } catch {}
      }),
    );
    await page.goto(base);
    if (count !== 18)
      await page
        .getByRole("button", {
          name: count === 5 ? "Most compute" : "More compute",
        })
        .click();
    assert.ok([5, 9, 18].includes(count), "Use 18 Gentle, 9 More or 5 Most");
    await page
      .locator('.your-contribution[data-compute-status="ready"]')
      .waitFor({ timeout: 120000 });
    console.log("READY", i, (await state()).pipelines);
  }
  for (let i = 0; i < count; i++) {
    const piece = assignments[i];
    assert.ok(piece, "Server assigned each holder a piece");
    assert.ok(downloads[i].length > 0, "Fresh context fetches its weights");
    for (const key of downloads[i]) {
      const layer = key.match(/^l(\d+)\./);
      if (layer)
        assert.ok(
          Number(layer[1]) >= piece.start && Number(layer[1]) < piece.end,
          "Only owned layers are fetched",
        );
      else
        assert.ok(
          piece.start === 0 || piece.end === 36,
          "Interior holder does not fetch vocabulary weights",
        );
    }
  }
  const started = Date.now();
  let last = -1;
  let worked;
  while (Date.now() - started < 600000) {
    const s = await state();
    if (s.totalThoughts !== last) {
      last = s.totalThoughts;
      console.log(
        JSON.stringify({
          completed: s.totalThoughts - before.totalThoughts,
          project: s.project,
          activity: s.activity.slice(-3),
        }),
      );
      events.push(s);
    }
    if (
      browserDone >= requestedJobs &&
      (station === "research"
        ? (await browserTrials()).length >= requestedJobs
        : s.artworkCount >= before.artworkCount + requestedJobs)
    ) {
      worked = s;
      break;
    }
    await pages[0].waitForTimeout(1500);
  }
  assert.ok(worked, "The shared model must complete real assigned work");
  assert.ok(worked.pipelines.some((p) => p.ready));
  const initialTrials = station === "research" ? await browserTrials() : [];
  for (const trial of initialTrials) verifyTrial(trial);
  if (station === "research")
    assert.ok(
      [...modelJobs.values()].some(
        (j) => j.kind === "pack" && completedJobs.has(j.id),
      ),
      "The browser completed the preceding pack stage too",
    );
  const usage = await Promise.all(
    pages.map((p) =>
      p.locator("[data-work-ms]").evaluate((el) => ({
        ms: Number(el.dataset.workMs),
        passes: Number(el.dataset.workPasses),
        modelBytes: Number(
          document.querySelector("[data-model-bytes]").dataset.modelBytes,
        ),
      })),
    ),
  );
  assert.ok(
    usage.every((u) => u.ms > 0 && u.passes > 0 && u.modelBytes > 0),
    "Every contributing tab displays measured real work and held weight bytes",
  );
  await support(false);
  await pages
    .at(-1)
    .getByRole("button", { name: "Contribution settings" })
    .click();
  await pages.at(-1).getByRole("switch", { name: "Browser compute" }).click();
  await pages.at(-1).getByRole("button", { name: "Got it" }).click();
  await pages[0].waitForTimeout(1200);
  const lost = await state();
  const lostTrialIds = new Set((await browserTrials()).map((t) => t.id));
  assert.equal(
    lost.modelAvailable,
    false,
    "Loss of required layers stops the model",
  );
  assert.equal(lost.active, null);
  const tokens = lost.totalTokens;
  await pages[0].waitForTimeout(6500);
  assert.equal(
    (await state()).totalTokens,
    tokens,
    "No server fallback or hidden continued inference",
  );
  await pages
    .at(-1)
    .getByRole("button", {
      name:
        count === 5
          ? "Most compute"
          : count === 9
            ? "More compute"
            : "Gentle compute",
    })
    .click();
  await pages
    .at(-1)
    .locator('.your-contribution[data-compute-status="ready"]')
    .waitFor({ timeout: 120000 });
  let recovered = await state();
  assert.ok(recovered.modelAvailable, "Replacement restores full coverage");
  const resumeDeadline = Date.now() + 300000;
  while (Date.now() < resumeDeadline) {
    recovered = await state();
    if (
      station === "research"
        ? (await browserTrials()).some((t) => !lostTrialIds.has(t.id))
        : recovered.artworkCount > lost.artworkCount
    )
      break;
    await pages[0].waitForTimeout(1000);
  }
  const recoveredTrials =
    station === "research"
      ? (await browserTrials()).filter((t) => !lostTrialIds.has(t.id))
      : [];
  assert.ok(
    station === "research"
      ? recoveredTrials.length > 0
      : recovered.artworkCount > lost.artworkCount,
    "A restored pipeline completes new model work",
  );
  for (const trial of recoveredTrials) verifyTrial(trial);
  assert.deepEqual(pageErrors, [], "No uncaught browser errors");
  // Automation keeps contexts foregrounded; exercise the hidden-page handler explicitly.
  await pages.at(-1).evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await pages[0].waitForTimeout(600);
  assert.equal(
    (await state()).modelAvailable,
    false,
    "Hidden holder withdraws its physical piece",
  );
  await pages[0].screenshot({
    path: `${output}/shared-working.png`,
    fullPage: true,
  });
  await writeFile(
    `${output}/shared-result.json`,
    JSON.stringify(
      {
        contexts: count,
        station,
        browserDone,
        initialTrials,
        recoveredTrials,
        modelJobs: [...modelJobs.values()],
        pageErrors,
        totalElapsedMs: Date.now() - startedAll,
        automatic: count === 18,
        usage,
        assignments,
        downloads,
        elapsedMs: Date.now() - started,
        before,
        worked,
        lost,
        recovered,
        events,
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS ${count} actual browser holders: owned-layer downloads, ${station === "research" ? "real pack+recall inference and persisted/recomputed trial scores" : "real ASCII work"}, physical loss, frozen tokens without fallback, completed recovery, synthetic visibility withdrawal`,
  );
} finally {
  await browser.close();
  await support(true);
}
