import config from "../../shared/model-config.json";
import { makeModelSpec, mlxParamNaming } from "./vendor/compiler/model-spec";
export const MODEL = makeModelSpec({
  id: "held-" + config.id,
  d: config.hiddenSize,
  layers: config.layers,
  heads: config.heads,
  kvHeads: config.kvHeads,
  headDim: config.headDim,
  ffn: config.ffn,
  vocab: config.vocab,
  pageSize: 16,
  maxPages: 64,
  maxSeq: config.maxSeq,
  ropeTheta: config.ropeTheta,
  rmsEps: config.rmsEps,
  tiedEmbeddings: config.tiedEmbeddings,
  qkNorm: config.qkNorm,
  stops: config.stops,
  chatTemplateId: "chatml",
  tokenizerKind: "byteLevel",
  hfRepo: config.hfRepo,
  weightsRevision: config.weightsRevision,
  manifestName: "model.safetensors.index.json",
  weightFormat: "mlx-safetensors",
  paramNaming: mlxParamNaming(""),
});
export const WEIGHT_BASE = `/weights/${config.id}/`;
