import config from "../shared/model-config.json";
/** Offline deterministic repacking; never runs in production. */
import { readFile, writeFile, mkdir, copyFile, open } from "node:fs/promises";
import { createHash } from "node:crypto";
import { MODEL } from "../src/inference/spec";
import {
  planModel,
  buildPlan,
  planKey,
} from "../src/inference/vendor/zero-tvm/weight-loader-mlx";
import { parseSafetensorsHeader } from "../src/inference/vendor/zero-tvm/mlx-weights";
const dir = process.argv[2] || ".local/edition03/model-q4";
const out = `public/weights/${config.id}`;
await mkdir(out, { recursive: true });
const file = await open(`${dir}/model.safetensors`, "r");
const prefix = Buffer.alloc(8);
await file.read(prefix, 0, 8, 0);
const headerSize = Number(prefix.readBigUInt64LE());
if (headerSize > 16 * 1024 * 1024) throw Error("Unexpected checkpoint header");
const header = Buffer.alloc(8 + headerSize);
await file.read(header, 0, header.length, 0);
const { tensors, dataStart } = parseSafetensorsHeader(
  header.buffer.slice(header.byteOffset, header.byteOffset + header.byteLength),
);
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
  range: async (_: string, b: number, e: number) => {
    const data = Buffer.alloc(e - b);
    let offset = 0;
    while (offset < data.length) {
      const result = await file.read(
        data,
        offset,
        data.length - offset,
        b + offset,
      );
      if (!result.bytesRead) throw Error("Truncated checkpoint");
      offset += result.bytesRead;
    }
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  },
  whole: async () => {
    throw Error("No whole-file reads");
  },
};
const buffers: Record<
  string,
  {
    bytes: number;
    sha256: string;
    parts: { file: string; bytes: number; sha256: string }[];
  }
> = {};
for (const { plan, layer } of planModel(MODEL)) {
  const data = await buildPlan(plan, locate, src);
  const key = planKey(plan, layer);
  const parts = [];
  const chunkSize = 16 * 1024 * 1024;
  for (
    let offset = 0, n = 0;
    offset < data.byteLength;
    offset += chunkSize, n++
  ) {
    const part = data.subarray(
      offset,
      Math.min(offset + chunkSize, data.byteLength),
    );
    const name = `${key}.${n}.bin`;
    parts.push({
      file: name,
      bytes: part.byteLength,
      sha256: createHash("sha256").update(part).digest("hex"),
    });
    await writeFile(`${out}/${name}`, part);
  }
  buffers[key] = {
    bytes: data.byteLength,
    sha256: createHash("sha256").update(data).digest("hex"),
    parts,
  };
}
const tokenizer = await readFile(`${dir}/tokenizer.json`);
const manifest = {
  tokenizer: {
    bytes: tokenizer.byteLength,
    sha256: createHash("sha256").update(tokenizer).digest("hex"),
  },
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

await file.close();
