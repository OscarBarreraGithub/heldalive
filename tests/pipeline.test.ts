import model from "../shared/model-config.json";
import { MODEL_LAYERS, HIDDEN_BYTES, MAX_BATCH } from "../shared/pipeline";
import { describe, it, expect } from "vitest";
import {
  nextPiece,
  completeCoverage,
  validStageCall,
  sampleToken,
  contributionLayers,
  toBase64,
  fromBase64,
} from "../shared/pipeline";
import { OutputGrammar } from "../src/inference/grammar";
describe("Physical model coverage", () => {
  it("needs one gentle holder for each pair of layers, and allocates a lost gap before a helper chain", () => {
    const pieces: { group: number; start: number; end: number; key: string }[] =
      [];
    for (let i = 0; i < MODEL_LAYERS / 2; i++) {
      const p = nextPiece(pieces, 2)!;
      expect(p.group).toBe(0);
      pieces.push({ ...p, key: String(i) });
      expect(completeCoverage(pieces)).toBe(i === MODEL_LAYERS / 2 - 1);
    }
    expect(nextPiece(pieces, 2)?.group).toBe(1);
    pieces.splice(7, 1);
    expect(completeCoverage(pieces)).toBe(false);
    expect(nextPiece(pieces, 8)).toEqual({ group: 0, start: 14, end: 16 });
  });
  it("combines unequal budgets without overlap", () => {
    let pieces: { group: number; start: number; end: number; key: string }[] =
      [];
    for (const duty of [0.2, 0.1, 0.05, 0.05, 0.2, 0.2, 0.1])
      pieces.push({
        ...nextPiece(pieces, contributionLayers(duty))!,
        key: "x",
      });
    expect(completeCoverage(pieces)).toBe(true);
    expect(pieces.map((p) => p.end - p.start)).toEqual([8, 4, 2, 2, 8, 8, 4]);
  });
  it("rejects gaps and overlapping coverage", () => {
    expect(
      completeCoverage([
        { start: 0, end: 16 },
        { start: 15, end: 32 },
      ]),
    ).toBe(false);
    expect(
      completeCoverage([
        { start: 0, end: 8 },
        { start: 10, end: 32 },
      ]),
    ).toBe(false);
  });
});
describe("Bounded inference messages", () => {
  it("checks exact hidden-vector shape, context limits and candidate IDs", () => {
    const call = {
      jobId: "j",
      rid: "r",
      start: 2,
      position: 0,
      count: MAX_BATCH,
      data: toBase64(new Uint8Array(HIDDEN_BYTES * MAX_BATCH)),
    };
    expect(validStageCall(call)).toBe(true);
    expect(validStageCall({ ...call, count: MAX_BATCH + 1 })).toBe(false);
    expect(validStageCall({ ...call, position: 1023 })).toBe(false);
    expect(validStageCall({ ...call, data: call.data.slice(1) })).toBe(false);
    expect(validStageCall({ ...call, allowed: [model.vocab] })).toBe(false);
    expect(validStageCall({...call,repetitionIds:[model.vocab]})).toBe(false);
    expect(validStageCall({...call,repetitionIds:Array(385).fill(1)})).toBe(false);
    expect(validStageCall({...call,repetitionIds:[151645]})).toBe(true);
    expect(fromBase64(call.data).byteLength).toBe(HIDDEN_BYTES * MAX_BATCH);
  });
  it("samples only the model candidates, with stable softmax and repetition penalty", () => {
    expect(
      sampleToken(
        [
          [5, 1000],
          [6, 999],
        ],
        0,
        0.5,
      ),
    ).toBe(5);
    expect(
      sampleToken(
        [
          [5, 1000],
          [6, 999],
        ],
        1,
        0.99,
      ),
    ).toBe(6);
    expect(() => sampleToken([[5, NaN]], 1, 0.5)).toThrow();
  });
});
// A character tokenizer isolates grammar semantics from model vocabulary.
const tok = {
  encode: (s: string) => Array.from(s, (c) => c.charCodeAt(0)),
  decode: (ids: number[]) => String.fromCharCode(...ids),
};
it("constrains syntax while retaining a model choice of project and subject", () => {
  const grammar = new OutputGrammar(tok, "plan");
  let text = "";
  let steps = 0;
  while (!grammar.finished && steps++ < 300) {
    const allowed = grammar.allowed();
    let id = allowed?.[0] ?? "x".charCodeAt(0);
    grammar.consume(id);
    text += tok.decode([id]);
  }
  const result = JSON.parse(text);
  expect(result.project).toBe("art");
  expect(result.focus).toBe("x".repeat(24));
  expect(result.helpers).toBe(1);
});
it("lets the model end a short subject without filling the focus budget", () => {
  const grammar = new OutputGrammar(tok, "plan");
  let text = "";
  let proposed = 0;
  const subject = 'a seed"';
  for (let step = 0; !grammar.finished && step < 300; step++) {
    const allowed = grammar.allowed();
    const id =
      allowed?.[0] ??
      grammar.filter([[subject.charCodeAt(proposed++), 1]])[0][0];
    grammar.consume(id);
    text += tok.decode([id]);
  }
  expect(JSON.parse(text)).toEqual({
    project: "art",
    focus: "a seed",
    helpers: 1,
  });
});
