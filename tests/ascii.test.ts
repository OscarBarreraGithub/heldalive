import { describe, expect, it } from "vitest";
import { inspectArt, unwrapArt } from "../shared/ascii";
import { OutputGrammar } from "../src/inference/grammar";
import { boostDeadline, BOOST_MS } from "../src/useHabitat";
const picture = "    /\\\n   /  \\\n  /____\\\n  | [] |\n  |____|";
describe("one drawing contract", () => {
  it("preserves indentation, unwraps a fence, and never crops", () => {
    expect(inspectArt(picture)).toMatchObject({
      ok: true,
      text: picture,
      width: 8,
      height: 5,
    });
    expect(unwrapArt("```text\n" + picture + "\n```\n")).toBe(picture);
    const wide = picture + "\n" + "_".repeat(41);
    expect(inspectArt(wide)).toMatchObject({
      ok: false,
      text: wide,
      width: 41,
    });
    expect(inspectArt(Array(21).fill("/\\").join("\n")).ok).toBe(false);
  });
  it("rejects prose, control characters, non-ASCII and incomplete pictures", () => {
    for (const s of [
      "Here is your drawing:\n" + picture,
      picture + "\n\t|",
      picture + "\n🛸",
      "---\n---",
      "\n\n\n",
    ])
      expect(inspectArt(s).ok).toBe(false);
  });
  it("keeps multi-character BPE strokes and enforces the canvas before sampling", () => {
    const tokens = new Map([
      [10, "\n"],
      [11, " "],
      [12, "--"],
      [13, "/\\"],
      [14, "\n    "],
      [15, "Hello"],
      [16, "猫"],
      [17, "|"],
      [18, "__"],
      [19, " ".repeat(41)],
    ]);
    const tok = {
      encode: (s: string) =>
        [...tokens].filter(([, v]) => v === s).map(([i]) => i),
      decode: (ids: number[]) => ids.map((i) => tokens.get(i) || "").join(""),
    };
    const g = new OutputGrammar(tok, "art");
    expect(g.allowed()).toContain(14);
    expect(g.allowed()).not.toContain(15);
    expect(g.allowed()).not.toContain(16);
    expect(g.allowed()).not.toContain(19);
    for (let i = 0; i < 20; i++) g.consume(12);
    expect(g.allowed()).not.toContain(11);
    g.consume(10);
    for (let row = 1; row < 20; row++) {
      g.consume(12);
      if (row < 19) g.consume(10);
    }
    expect(g.allowed()).not.toContain(10);
    expect(g.allowed()).toContain(2);
  });
});
it("accepts only a bounded future boost deadline", () => {
  const now = 123456789;
  for (const s of [
    null,
    "broken",
    "Infinity",
    String(now),
    String(now + BOOST_MS + 1),
  ])
    expect(boostDeadline(s, now)).toBe(0);
  expect(boostDeadline(String(now + 100), now)).toBe(now + 100);
});
