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
  it("needs 16 gentle holders, and allocates a lost gap before a helper chain", () => {
    const pieces: { group: number; start: number; end: number; key: string }[] =
      [];
    for (let i = 0; i < 16; i++) {
      const p = nextPiece(pieces, 2)!;
      expect(p.group).toBe(0);
      pieces.push({ ...p, key: String(i) });
      expect(completeCoverage(pieces)).toBe(i === 15);
    }
    expect(nextPiece(pieces, 2)?.group).toBe(1);
    pieces.splice(7, 1);
    expect(completeCoverage(pieces)).toBe(false);
    expect(nextPiece(pieces, 8)).toEqual({ group: 0, start: 14, end: 16 });
  });
  it("combines unequal budgets without overlap", () => {
    let pieces: { group: number; start: number; end: number; key: string }[] =
      [];
    for (const duty of [0.2, 0.1, 0.05, 0.05, 0.2, 0.2])
      pieces.push({
        ...nextPiece(pieces, contributionLayers(duty))!,
        key: "x",
      });
    expect(completeCoverage(pieces)).toBe(true);
    expect(pieces.map((p) => p.end - p.start)).toEqual([8, 4, 2, 2, 8, 8]);
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
      count: 16,
      data: toBase64(new Uint8Array(1920 * 16)),
    };
    expect(validStageCall(call)).toBe(true);
    expect(validStageCall({ ...call, count: 17 })).toBe(false);
    expect(validStageCall({ ...call, position: 1023 })).toBe(false);
    expect(validStageCall({ ...call, data: call.data.slice(1) })).toBe(false);
    expect(validStageCall({ ...call, allowed: [49152] })).toBe(false);
    expect(fromBase64(call.data).byteLength).toBe(1920 * 16);
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
