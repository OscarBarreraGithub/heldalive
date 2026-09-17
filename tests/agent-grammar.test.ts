import { describe, it, expect } from "vitest";
import { OutputGrammar } from "../src/inference/grammar";
const tok = {
  encode: (s: string) => Array.from(s, (c) => c.charCodeAt(0)),
  decode: (ids: number[]) => String.fromCharCode(...ids),
};
function feed(g: OutputGrammar, text: string) {
  for (const c of text) {
    const id = c.charCodeAt(0),
      allowed = g.allowed();
    if (allowed) expect(allowed).toContain(id);
    else
      expect(
        g.filter([
          [id, 10],
          ["x".charCodeAt(0), 0],
        ])[0][0],
      ).toBe(id);
    g.consume(id);
  }
}
describe("agent response grammar", () => {
  it("preserves multi-source choices that share a prefix with a single source", () => {
    const g = new OutputGrammar(tok, "agent", ["S1", "S2"]);
    feed(
      g,
      JSON.stringify({
        summary: "A finding.",
        content: "Both sources support a bounded claim [S1] [S2].",
        decision: "advance",
        search: "none",
        sources: "S1,S2",
        nextTask: "Inspect a counterexample.",
        lesson: "Keep evidence bounded.",
      }),
    );
    expect(g.finished).toBe(true);
  });
  it("does not close a paragraph at an opening title quote or apostrophe", () => {
    const g = new OutputGrammar(tok, "agent");
    feed(g, '{"summary":"A finding.","content":"The agent');
    expect(
      g.filter([
        [34, 10],
        [120, 9],
      ])[0][0],
    ).toBe(120);
    expect(
      g.filter([
        [39, 10],
        [120, 9],
      ])[0][0],
    ).toBe(39);
  });
});
