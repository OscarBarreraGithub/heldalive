/** Offline deterministic repacking; never runs in production. */
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { MODEL } from "../src/inference/spec";
import {
  planModel,
  buildPlan,
  planKey,
} from "../src/inference/vendor/zero-tvm/weight-loader-mlx";
import { parseSafetensorsHeader } from "../src/inference/vendor/zero-tvm/mlx-weights";
const dir = process.argv[2] || ".local/edition03/model-q4";
const out = "public/weights/smollm2-360m-q4-v1";
await mkdir(out, { recursive: true });
const file = await readFile(`${dir}/model.safetensors`);
const array = file.buffer.slice(
  file.byteOffset,
  file.byteOffset + file.byteLength,
);
const { tensors, dataStart } = parseSafetensorsHeader(array);
const locate = (record: string) => {
  const info = tensors[record];
  if (!info) throw Error(`Missing ${record}`);
  return {
    file: "model.safetensors",
    begin: dataStart + info.begin,
    end: dataStart + info.end,
    info,
  };
};
const src = {
  range: async (_: string, b: number, e: number) =>
    new Uint8Array(array.slice(b, e)),
  whole: async () => {
    throw Error("No whole-file reads");
  },
};
const buffers: Record<string, { bytes: number; sha256: string }> = {};
for (const { plan, layer } of planModel(MODEL)) {
  const data = await buildPlan(plan, locate, src);
  const key = planKey(plan, layer);
  buffers[key] = {
    bytes: data.byteLength,
    sha256: createHash("sha256").update(data).digest("hex"),
  };
  await writeFile(`${out}/${key}.bin`, data);
}
const manifest = {
  model: MODEL.id,
  revision: MODEL.weightsRevision,
  source: MODEL.hfRepo,
  quantization: { bits: 4, groupSize: 64, dtype: "float16" },
  buffers,
  tensors,
  dataStart,
};
await writeFile(`${out}/manifest.json`, JSON.stringify(manifest));
await copyFile(`${dir}/tokenizer.json`, `${out}/tokenizer.json`);
const total = Object.values(buffers).reduce((a, b) => a + b.bytes, 0);
console.log(
  JSON.stringify({
    buffers: Object.keys(buffers).length,
    totalBytes: total,
    largestBytes: Math.max(...Object.values(buffers).map((b) => b.bytes)),
  }),
);
