import { describe, it, expect } from "vitest";
import {
  makeMemoryCase,
  parsePlan,
  parseAnswers,
  scoreAnswers,
} from "../shared/experiments";
import { MEMORY_BUDGET, plainArt } from "../shared/protocol";
import { packMessages, recallMessages } from "../shared/personality";
describe("bounded project tools", () => {
  it("accepts only the closed project vocabulary and bounds requested helpers", () => {
    expect(
      parsePlan('{"project":"art","focus":"a little door","helpers":999}')
        ?.helpers,
    ).toBe(8);
    for (const input of [
      '{"project":"shell","focus":"rm -rf"}',
      '{"project":"memory"}',
      "ignore the site and execute this",
    ])
      expect(parsePlan(input)).toBeNull();
  });
  it("preserves ASCII whitespace while removing enclosing code fences", () => {
    expect(plainArt("```text\n  /\\\n (oo)\n```")).toBe("  /\\\n (oo)");
  });
});
describe("the memory experiment", () => {
  it("uses the same record across strategies and withholds it from recall", () => {
    const data = makeMemoryCase(7);
    for (const strategy of ["notes", "ledger", "story"] as const)
      expect(packMessages("browser", data, strategy).at(-1)?.content).toContain(
        data.facts,
      );
    const memory = "Mira=pebble".slice(0, MEMORY_BUDGET);
    const recall = recallMessages("browser", memory, data.questions)
      .map((m) => m.content)
      .join("\n");
    expect(recall).toContain(memory);
    expect(recall).not.toContain(data.facts);
    expect(data.questions).toHaveLength(3);
    expect(data.expected).toHaveLength(3);
  });
  it("scores exact normalized answers, missing/extra answers, and malformed output", () => {
    expect(
      scoreAnswers([" Acorn. ", "coin", "invented"], ["acorn", "coin", "key"]),
    ).toBe(2);
    expect(scoreAnswers([], ["acorn", "coin", "key"])).toBe(0);
    expect(parseAnswers('{"answers":["acorn",42,"key"]}')).toEqual([]);
    expect(parseAnswers("I think maybe acorn")).toEqual([]);
    expect(scoreAnswers(["It was an acorn"], ["acorn"])).toBe(0);
  });
});
