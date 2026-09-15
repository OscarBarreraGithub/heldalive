// Immutable upstream revisions. Bump the public /v1/ path when changing either revision.
const MODEL_REVISION = "32ff081fe7e4dfe4ffb167b94c66fdf11e02b8ad";
const LIBRARY_REVISION = "025bcaf3780fa8254f5e5efd3bfea0a5397248f4";
export const MODEL_ASSET_PREFIX = "/api/model/v1/resolve/main/";
const FILES = new Set([
  "mlc-chat-config.json",
  "ndarray-cache.json",
  "tensor-cache.json",
  "tokenizer.json",
  "tokenizer_config.json",
  "vocab.json",
  "merges.txt",
  ...Array.from({ length: 8 }, (_, i) => `params_shard_${i}.bin`),
]);
export function modelAssetUrl(path: string): string | null {
  if (!path.startsWith(MODEL_ASSET_PREFIX)) return null;
  const file = path.slice(MODEL_ASSET_PREFIX.length);
  if (file === "model.wasm")
    return `https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/${LIBRARY_REVISION}/web-llm-models/v0_2_84/base/Qwen2-0.5B-Instruct-q4f16_1_cs1k-webgpu.wasm`;
  if (!FILES.has(file)) return null;
  return `https://huggingface.co/mlc-ai/Qwen2.5-0.5B-Instruct-q4f16_1-MLC/resolve/${MODEL_REVISION}/${file}`;
}
