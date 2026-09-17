import { MODEL, WEIGHT_BASE } from "./spec";
import {
  assembleMlx,
  planKey,
  planModel,
} from "./vendor/zero-tvm/weight-loader-mlx";
import {
  buildDecodeEngine,
  type DecodeEngine,
} from "./vendor/zero-tvm/engine-core";
import type { LoadedWeights } from "./vendor/zero-tvm/weight-loader";
import { SCALAR_VARIANTS } from "./vendor/zero-tvm/variants";
import { createByteLevelTokenizer } from "./vendor/zero-tvm/tokenizer-bpe";
import type { TensorInfo } from "./vendor/zero-tvm/mlx-weights";
export type LayerRange = { start: number; end: number };
const digest = async (bytes: ArrayBuffer) =>
  Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
export async function loadTokenizer() {
  const [response, manifestResponse] = await Promise.all([
    fetch(WEIGHT_BASE + "tokenizer.json"),
    fetch(WEIGHT_BASE + "manifest.json"),
  ]);
  if (!response.ok || !manifestResponse.ok)
    throw Error("Tokenizer unavailable");
  const manifest = (await manifestResponse.json()) as {
    model: string;
    revision: string;
    tokenizer: { bytes: number; sha256: string };
  };
  if (
    manifest.model !== MODEL.id ||
    manifest.revision !== MODEL.weightsRevision
  )
    throw Error("Unexpected tokenizer model version");
  const bytes = await response.arrayBuffer();
  if (
    bytes.byteLength !== manifest.tokenizer.bytes ||
    (await digest(bytes)) !== manifest.tokenizer.sha256
  )
    throw Error("Tokenizer failed its integrity check");
  return createByteLevelTokenizer(JSON.parse(new TextDecoder().decode(bytes)));
}
export async function loadStage(
  range: LayerRange,
  onProgress = (n: number, text: string) => {},
) {
  if (
    !Number.isInteger(range.start) ||
    !Number.isInteger(range.end) ||
    range.start < 0 ||
    range.end > MODEL.layers ||
    range.start >= range.end
  )
    throw Error("Invalid model piece");
  const adapter = await navigator.gpu?.requestAdapter({
    powerPreference: "low-power",
  });
  if (!adapter?.features.has("shader-f16"))
    throw Error(
      "This browser needs WebGPU with float16 support. You can still help with tiny checks or watch.",
    );
  const device = await adapter.requestDevice({
    requiredFeatures: ["shader-f16"],
    requiredLimits: {
      maxStorageBuffersPerShaderStage: Math.min(
        16,
        adapter.limits.maxStorageBuffersPerShaderStage,
      ),
      maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
      maxBufferSize: adapter.limits.maxBufferSize,
    },
  });
  try {
    let failure: Error | null = null;
    device.addEventListener("uncapturederror", (e) => {
      failure = Error(e.error.message);
      console.error("Held GPU:", e.error.message);
    });
    const response = await fetch(WEIGHT_BASE + "manifest.json");
    if (!response.ok) throw Error("Model manifest unavailable");
    const manifest = (await response.json()) as {
      model: string;
      revision: string;
      dataStart: number;
      tensors: Record<string, TensorInfo>;
      buffers: Record<
        string,
        {
          bytes: number;
          sha256: string;
          parts: { file: string; bytes: number; sha256: string }[];
        }
      >;
    };
    if (
      manifest.model !== MODEL.id ||
      manifest.revision !== MODEL.weightsRevision
    )
      throw Error("Unexpected model version");
    const cache = await caches.open(MODEL.id);
    const planned = planModel(MODEL, range);
    let received = 0;
    let transferred = 0;
    const expectedBytes = planned.reduce(
      (sum, { plan, layer }) =>
        sum + manifest.buffers[planKey(plan, layer)].bytes,
      0,
    );
    const unavailable = async (): Promise<never> => {
      throw Error("Prepared model buffer failed validation");
    };
    const weights = (await assembleMlx(
      device,
      MODEL,
      { range: unavailable, whole: unavailable },
      (record) => {
        const info = manifest.tensors[record];
        if (!info) throw Error("Unknown tensor");
        return {
          file: "prepared",
          begin: manifest.dataStart + info.begin,
          end: manifest.dataStart + info.end,
          info,
        };
      },
      GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
      {
        cacheRead: async (key) => {
          const expected = manifest.buffers[key];
          if (!expected) throw Error("Unknown buffer");
          if (
            expected.bytes > device.limits.maxStorageBufferBindingSize ||
            expected.bytes > device.limits.maxBufferSize
          )
            throw Error(
              "This model piece needs a larger graphics buffer than this device supports. You can keep watching.",
            );
          const data = new Uint8Array(expected.bytes);
          let offset = 0;
          for (const part of expected.parts) {
            if (
              !/^[a-zA-Z0-9_.-]+\.bin$/.test(part.file) ||
              part.bytes > 16 * 1024 * 1024 ||
              part.bytes <= 0 ||
              offset + part.bytes > expected.bytes
            )
              throw Error("Invalid model part");
            const url = WEIGHT_BASE + part.file;
            let r = await cache.match(url);
            if (!r) {
              r = await fetch(url);
              if (!r.ok)
                throw Error("Could not fetch this piece. Please try again.");
              transferred += part.bytes;
            }
            const bytes = await r.arrayBuffer();
            const digest = Array.from(
              new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
              (b) => b.toString(16).padStart(2, "0"),
            ).join("");
            if (bytes.byteLength !== part.bytes || digest !== part.sha256) {
              await cache.delete(url);
              throw Error("Model piece failed its integrity check");
            }
            data.set(new Uint8Array(bytes), offset);
            offset += bytes.byteLength;
            try {
              await cache.put(url, new Response(bytes));
            } catch {}
            onProgress(
              (received + offset) / expectedBytes,
              `Loading your piece · ${((received + offset) / 1e6).toFixed(1)} / ${(expectedBytes / 1e6).toFixed(1)} MB`,
            );
          }
          const fullDigest = Array.from(
            new Uint8Array(await crypto.subtle.digest("SHA-256", data)),
            (b) => b.toString(16).padStart(2, "0"),
          ).join("");
          if (offset !== expected.bytes || fullDigest !== expected.sha256)
            throw Error("Model buffer failed its integrity check");

          received += data.byteLength;
          onProgress(
            received / expectedBytes,
            `Loading your piece · ${(received / 1e6).toFixed(1)} / ${(expectedBytes / 1e6).toFixed(1)} MB`,
          );
          return data.buffer;
        },
      },
      range,
    )) as unknown as LoadedWeights;
    // The engine indexes KV by global layer number; unowned entries are tiny unused buffers.
    const kv = Array.from({ length: MODEL.layers }, (_, i) =>
      device.createBuffer({
        size:
          i >= range.start && i < range.end
            ? MODEL.maxPages * MODEL.kvPageStride * 2
            : 4,
        usage:
          GPUBufferUsage.STORAGE |
          GPUBufferUsage.COPY_DST |
          GPUBufferUsage.COPY_SRC,
        label: `held-kv-${i}`,
      }),
    );
    const engine = buildDecodeEngine(device, weights, kv, {
      spec: MODEL,
      layerRange: range,
      variants: SCALAR_VARIANTS,
      fused: false,
    });
    await device.queue.onSubmittedWorkDone();
    if (failure) {
      device.destroy();
      throw failure;
    }
    return {
      engine,
      device,
      range,
      bytes: expectedBytes,
      transferred,
      assertHealthy() {
        if (failure) throw failure;
      },
      destroy() {
        engine.destroy();
        device.destroy();
      },
    };
  } catch (error) {
    device.destroy();
    throw error;
  }
}
export type Stage = Awaited<ReturnType<typeof loadStage>>;
export function topLogits(
  logits: Float32Array,
  k = 64,
  allowed?: number[],
): [number, number][] {
  const top: [number, number][] = [];
  for (const i of allowed ??
    Array.from({ length: logits.length }, (_, i) => i)) {
    const v = logits[i];
    if (!Number.isFinite(v)) throw Error("Non-finite model output");
    if (top.length === k && v <= top[top.length - 1][1]) continue;
    top.push([i, v]);
    top.sort((a, b) => b[1] - a[1]);
    if (top.length > k) top.pop();
  }
  return top;
}
