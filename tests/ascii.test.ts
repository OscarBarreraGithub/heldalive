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
  it("does not force drawings through a restricted token alphabet", () => {
    const tok = { encode: () => [], decode: () => "" };
    const g = new OutputGrammar(tok, "art");
    expect(g.enabled).toBe(false);
    expect(g.allowed()).toBeUndefined();
  });
  it("rejects degenerate repeated rows", () => {
    expect(inspectArt(Array(18).fill(" | |").join("\n")).ok).toBe(false);
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
