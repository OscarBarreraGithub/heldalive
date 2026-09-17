import model from "./model-config.json";
/** The model's physical topology, independent of UI and inference kernels. */
export const MODEL_LAYERS = model.layers;
export const HIDDEN_BYTES = model.hiddenSize * 2;
export const MAX_BATCH = model.batchSize;
export const MAX_CONTEXT = 4096;
export const MAX_PIPELINES = 8;
export type Piece = { group: number; start: number; end: number; key: string };
export type PipelineView = {
  group: number;
  covered: number;
  ready: boolean;
  pieces: { start: number; end: number; ready: boolean; busy: boolean }[];
};
export type StageCall = {
  jobId: string;
  rid: string;
  start: number;
  position: number;
  count: number;
  tokens?: number[];
  data?: string;
  allowed?: number[];
  repetitionIds?: number[];
};
export type StageResult = {
  jobId: string;
  rid: string;
  data?: string;
  top?: [number, number][];
  computeMs: number;
  error?: string;
};
export function contributionLayers(duty: number) {
  return duty === 0.2 ? 8 : duty === 0.1 ? 4 : 2;
}
export function nextPiece(
  existing: Piece[],
  capacity: number,
): Omit<Piece, "key"> | null {
  for (let group = 0; group < MAX_PIPELINES; group++) {
    const used = new Set(
      existing
        .filter((p) => p.group === group)
        .flatMap((p) =>
          Array.from({ length: p.end - p.start }, (_, i) => i + p.start),
        ),
    );
    for (let start = 0; start < MODEL_LAYERS; start += 2) {
      if (used.has(start)) continue;
      let end = start;
      while (end < Math.min(MODEL_LAYERS, start + capacity) && !used.has(end))
        end++;
      if (end > start) return { group, start, end };
    }
  }
  return null;
}
export function completeCoverage(
  pieces: Pick<Piece, "start" | "end">[],
): boolean {
  const sorted = [...pieces].sort((a, b) => a.start - b.start);
  let end = 0;
  for (const p of sorted) {
    if (p.start !== end || p.end <= p.start) return false;
    end = p.end;
  }
  return end === MODEL_LAYERS;
}
export function validStageCall(v: StageCall): boolean {
  if (
    v.repetitionIds !== undefined &&
    (!Array.isArray(v.repetitionIds) ||
      v.repetitionIds.length > 384 ||
      !v.repetitionIds.every(
        (n) => Number.isInteger(n) && n >= 0 && n < model.vocab,
      ))
  )
    return false;
  if (
    v.allowed !== undefined &&
    (!Array.isArray(v.allowed) ||
      v.allowed.length < 1 ||
      v.allowed.length > 2048 ||
      !v.allowed.every((n) => Number.isInteger(n) && n >= 0 && n < model.vocab))
  )
    return false;
  if (
    typeof v.rid !== "string" ||
    v.rid.length > 64 ||
    typeof v.jobId !== "string" ||
    !Number.isInteger(v.start) ||
    v.start < 0 ||
    v.start >= MODEL_LAYERS ||
    !Number.isInteger(v.position) ||
    !Number.isInteger(v.count) ||
    v.position < 0 ||
    v.count < 1 ||
    v.count > MAX_BATCH ||
    v.position + v.count > MAX_CONTEXT
  )
    return false;
  return v.start === 0
    ? Array.isArray(v.tokens) &&
        v.tokens.length === v.count &&
        v.tokens.every((n) => Number.isInteger(n) && n >= 0 && n < model.vocab)
    : typeof v.data === "string" &&
        v.data.length === Math.ceil((v.count * HIDDEN_BYTES) / 3) * 4 &&
        /^[A-Za-z0-9+/]*={0,2}$/.test(v.data);
}
export function validTop(value: unknown): value is [number, number][] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= 64 &&
    value.every(
      (p) =>
        Array.isArray(p) &&
        p.length === 2 &&
        Number.isInteger(p[0]) &&
        p[0] >= 0 &&
        p[0] < model.vocab &&
        typeof p[1] === "number" &&
        Number.isFinite(p[1]) &&
        Math.abs(p[1]) < 10000,
    )
  );
}
/** Actual next-token sampling, small enough for a phone's CPU. */
export function sampleToken(
  top: [number, number][],
  temperature: number,
  random: number,
  history: number[] = [],
): number {
  if (!validTop(top) || !Number.isFinite(random) || random < 0 || random >= 1)
    throw Error("Invalid sampling task");
  const recent = new Set(history.slice(-40));
  const values = top
    .map(([id, v]) => [id, v - (recent.has(id) ? 0.65 : 0)] as const)
    .sort((a, b) => b[1] - a[1]);
  if (temperature <= 0) return values[0][0];
  const temp = Math.max(0.1, Math.min(1, temperature));
  const max = values[0][1];
  const weights = values.map(([, v]) => Math.exp((v - max) / temp));
  const sum = weights.reduce((a, b) => a + b, 0);
  let c = 0;
  for (let i = 0; i < weights.length; i++) {
    c += weights[i] / sum;
    if (random < c) return values[i][0];
  }
  return values[values.length - 1][0];
}
export function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 8192)
    s += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(s);
}
export function fromBase64(data: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
}
