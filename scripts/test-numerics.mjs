import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
const base = process.env.HELD_TEST_URL || "http://127.0.0.1:5173";
assert.ok(
  ["localhost", "127.0.0.1"].includes(new URL(base).hostname),
  "Numerical source harness is development-only",
);
const fixtures = JSON.parse(
  await readFile("models/smollm2-360m-q4-v1/reference.json", "utf8"),
).cases;
const count = Number(process.env.HELD_TEST_STAGES || 16);
assert.ok([1, 4, 16].includes(count));
const browser = await chromium.launch({ headless: true, channel: "chromium" });
const pages = [];
const results = [];
try {
  for (let i = 0; i < count; i++) {
    const page = await browser.newPage();
    pages.push(page);
    await page.goto(base);
    await page.evaluate(
      async (range) => {
        const r = await import("/src/inference/runtime.ts");
        window.heldRuntime = r;
        window.heldStage = await r.loadStage(range);
        window.heldTokenizer = await r.loadTokenizer();
      },
      { start: (i * 32) / count, end: ((i + 1) * 32) / count },
    );
  }
  for (const fixture of fixtures) {
    const ids = await pages[0].evaluate(
      (prompt) => window.heldTokenizer.encode(prompt),
      fixture.prompt,
    );
    assert.deepEqual(ids, fixture.ids, "Exact reference tokenizer IDs");
    let top;
    const start = Date.now();
    for (let pos = 0; pos < ids.length; pos += 16) {
      let step = { tokens: ids.slice(pos, pos + 16) };
      const length = step.tokens.length;
      for (const page of pages) {
        step = await page.evaluate(
          async ({ step, pos, length }) => {
            const { fromBase64, toBase64 } =
              await import("/shared/pipeline.ts");
            const out = await window.heldStage.engine.pipelineBatch(
              "tokens" in step
                ? step
                : { residuals: fromBase64(step.data).buffer },
              pos,
              length,
            );
            window.heldStage.assertHealthy();
            return "logits" in out
              ? { top: window.heldRuntime.topLogits(out.logits, 10) }
              : { data: toBase64(new Uint8Array(out.residuals)) };
          },
          { step, pos, length },
        );
      }
      top = step.top;
    }
    const byId = new Map(top);
    const errors = fixture.top
      .filter(([id]) => byId.has(id))
      .map(([id, v]) => Math.abs(v - byId.get(id)));
    assert.ok(
      errors.length >= 8,
      "At least eight reference top-ten candidates retained",
    );
    assert.ok(Math.max(...errors) < 0.2, "Reference logit tolerance");
    assert.equal(
      top[0][0],
      fixture.top[0][0],
      "Leading prediction matches native model",
    );
    results.push({
      stages: count,
      tokens: ids.length,
      top,
      maxSharedTopLogitError: Math.max(...errors),
      ms: Date.now() - start,
    });
    console.log(results.at(-1));
  }
  await mkdir(".local/qa/edition03", { recursive: true });
  await writeFile(
    `.local/qa/edition03/numerics-${count}.json`,
    JSON.stringify(results, null, 2),
  );
  console.log(
    "PASS native reference, exact tokenization, bounded batched inference over independent browser contexts",
  );
} finally {
  await browser.close();
}
