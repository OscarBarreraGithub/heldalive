import { cleanThought, isProjectKind, MAX_HELPERS } from "./protocol";
import type { ProjectKind, Strategy } from "./protocol";
export const STRATEGIES: Strategy[] = ["notes", "ledger", "story", "custom"];
export const STRATEGY_NAMES: Record<Strategy, string> = {
  custom: "Held’s own methods",
  notes: "Little notes",
  ledger: "A tidy ledger",
  story: "A small story",
};
export function parsePlan(
  text: string,
): { kind: ProjectKind; focus: string; helpers: number } | null {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const p = JSON.parse(match[0]) as Record<string, unknown>;
    if (
      !isProjectKind(p.project) ||
      typeof p.focus !== "string" ||
      !p.focus.trim()
    )
      return null;
    return {
      kind: p.project,
      focus: cleanThought(p.focus).replace(/\s+/g, " ").slice(0, 100),
      helpers:
        typeof p.helpers === "number" && Number.isFinite(p.helpers)
          ? Math.max(1, Math.min(MAX_HELPERS, Math.floor(p.helpers)))
          : 1,
    };
  } catch {
    return null;
  }
}
export function normalizeAnswer(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}
export function scoreAnswers(answers: string[], expected: string[]): number {
  return expected.reduce(
    (sum, answer, i) =>
      sum +
      Number(normalizeAnswer(answers[i] || "") === normalizeAnswer(answer)),
    0,
  );
}
export function validAnswerResponse(text: string): boolean {
  try {
    const p = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || text);
    return (
      Array.isArray(p.answers) &&
      p.answers.length === 3 &&
      p.answers.every((s: unknown) => typeof s === "string" && s.length <= 80)
    );
  } catch {
    return false;
  }
}
export function parseAnswers(text: string): string[] {
  if (!validAnswerResponse(text)) return [];
  return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || text).answers;
}
export type MemoryCase = {
  facts: string;
  questions: string[];
  expected: string[];
};
export function makeMemoryCase(seed: number): MemoryCase {
  const names = [
    "Mira",
    "Otto",
    "Fern",
    "Lumi",
    "Pip",
    "Cleo",
    "Moss",
    "Ivo",
    "Nell",
    "Rumi",
    "Wren",
    "Kit",
  ];
  const objects = [
    "button",
    "acorn",
    "ribbon",
    "marble",
    "feather",
    "pebble",
    "thimble",
    "shell",
    "bell",
    "key",
    "leaf",
    "coin",
  ];
  const places = [
    "attic",
    "garden",
    "kitchen",
    "library",
    "orchard",
    "station",
    "bakery",
    "harbor",
    "meadow",
    "tower",
    "cellar",
    "studio",
  ];
  // A deterministic shuffle permits replay without reducing every case to seed % 12.
  let state = seed >>> 0 || 1;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const shuffle = <T>(items: T[]) => {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  const assigned = shuffle(objects),
    locations = shuffle(places);
  const facts = names
    .map((name, i) => `${name} keeps a ${assigned[i]} in the ${locations[i]}.`)
    .join("\n");
  const picks = shuffle(names.map((_, i) => i)).slice(0, 3);
  return {
    facts,
    questions: picks.map((i) => `What object does ${names[i]} keep?`),
    expected: picks.map((i) => assigned[i]),
  };
}
