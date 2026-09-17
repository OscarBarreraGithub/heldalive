/** Recompute disclosure amounts from the same piece plans used by the loader. */
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { MODEL } from "../src/inference/spec";
import config from "../shared/model-config.json";
import {
  planModel,
  planKey,
} from "../src/inference/vendor/zero-tvm/weight-loader-mlx";
const source = await readFile(`models/${config.id}/manifest.json`, "utf8");
const manifest = JSON.parse(source);
const budgets: Record<string, unknown> = {};
for (const capacity of [2, 4, 8]) {
  const amounts = [];
  for (let start = 0; start < MODEL.layers; start += 2) {
    const plans = planModel(MODEL, {
      start,
      end: Math.min(start + capacity, MODEL.layers),
    });
    amounts.push(
      plans.reduce(
        (n, { plan, layer }) =>
          n + manifest.buffers[planKey(plan, layer)].bytes,
        0,
      ),
    );
  }
  budgets[capacity] = {
    minMB: Math.floor(Math.min(...amounts) / 1e6),
    maxMB: Math.ceil(
      (Math.max(...amounts) +
        manifest.tokenizer.bytes +
        Buffer.byteLength(source)) /
        1e6,
    ),
    holders: Math.ceil(MODEL.layers / capacity),
  };
}
budgets.totalBytes = Object.values(manifest.buffers).reduce(
  (n: number, v: any) => n + v.bytes,
  0,
);
budgets.tokenizerBytes = manifest.tokenizer.bytes;
if (process.argv.includes("--check"))
  assert.deepEqual(
    JSON.parse(await readFile("shared/model-budgets.json", "utf8")),
    budgets,
  );
else
  await writeFile(
    "shared/model-budgets.json",
    JSON.stringify(budgets, null, 2) + "\n",
  );
console.log("Verified piece budgets:", budgets);
