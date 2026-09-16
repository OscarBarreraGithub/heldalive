import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
const base = process.env.HELD_TEST_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true, channel: "chromium" });
const pages = [];
const state = () =>
  fetch(base + "/api/state?room=browser").then((r) => r.json());
await mkdir(".local/qa/edition03", { recursive: true });
try {
  const before = await state();
  const since = Date.now();
  for (let i = 0; i < 8; i++) {
    const context = await browser.newContext();
    const page = await context.newPage();
    pages.push(page);
    page.on("pageerror", (e) => console.log("ERROR", e.message));
    page.on("console", (m) => {
      if (m.type() === "warning" || m.type() === "error")
        console.log("browser", i, m.text().slice(0, 200));
    });
    await page.goto(base);
    await page.getByRole("button", { name: "Lend a little life" }).click();
    await page.getByLabel("Room to roam", { exact: false }).check();
    await page.getByRole("button", { name: "Start lending compute" }).click();
    await page
      .getByRole("button", { name: "Stop contributing" })
      .waitFor({ timeout: 120000 });
  }
  let finished;
  let last = -1;
  let parallel = false;
  for (let end = Date.now() + 600000; Date.now() < end;) {
    const s = await state();
    parallel ||= s.agents.length >= 2;
    if (s.totalThoughts !== last) {
      last = s.totalThoughts;
      console.log(
        JSON.stringify({
          jobs: s.totalThoughts - before.totalThoughts,
          project: s.project?.kind,
          completed: s.project?.completed,
          activity: s.activity.slice(-2),
        }),
      );
    }
    if (
      s.project?.kind === "memory" &&
      s.project.status === "finished" &&
      s.trials.filter((t) => t.projectId === s.project.id).length >= 5 &&
      s.workspace?.some(
        (f) =>
          f.path === "memory/strategy.md" &&
          f.author === "model" &&
          f.at > since,
      )
    ) {
      finished = s;
      break;
    }
    await pages[0].waitForTimeout(1000);
  }
  assert.ok(finished, "A real memory-method project must finish");
  assert.ok(parallel, "At least two actual model tasks run on complete chains");
  const trials = finished.trials.filter(
    (t) => t.projectId === finished.project.id,
  );
  assert.equal(trials.filter((t) => t.strategy === "custom").length, 2);
  assert.ok(
    trials.every((t) => t.responseValid),
    "Constrained recall produces valid responses",
  );
  assert.ok(
    finished.activity.some((e) => e.text.startsWith("Memory comparison:")),
  );
  console.log(
    "PASS actual model proposal, five recall approaches, paired decision, two shared inference chains",
  );
  await writeFile(
    ".local/qa/edition03/workshop-result.json",
    JSON.stringify(
      { elapsedMs: Date.now() - since, parallel, before, finished },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
