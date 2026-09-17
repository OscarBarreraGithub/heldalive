/** Public inference contract. Secrets and orchestration state never enter a job. */
export const AGENT_PROTOCOL = 2;
export const AGENT_MAX_TOKENS = 820;
export const AGENT_MAX_CHARS = 6500;
export const AGENT_FIELDS = [
  { name: "summary", tokens: 55, chars: 260 },
  { name: "content", tokens: 320, chars: 1750 },
  { name: "decision", choices: ["advance", "revise", "complete"] },
  { name: "search", tokens: 65, chars: 260 },
  { name: "sources", sources: true },
  { name: "nextTask", tokens: 95, chars: 460 },
  { name: "lesson", tokens: 70, chars: 340 },
] as const;
export type AgentJob = {
  instanceId: string;
  loopId: string;
  role: string;
  sourceIds: string[];
};
export function sourceChoices(ids: string[]): string[] {
  const result = ["none"];
  for (let mask = 1; mask < 1 << Math.min(4, ids.length); mask++)
    result.push(ids.filter((_, i) => mask & (1 << i)).join(","));
  return result;
}
