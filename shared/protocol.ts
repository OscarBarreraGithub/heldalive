export type Mode = "mac" | "browser";
export type Phase = "sleeping" | "waiting" | "thinking" | "resting";
export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};
export type Thought = {
  id: string;
  text: string;
  at: number;
  source: Mode;
  tokens: number;
  durationMs: number;
};
export type Job = { id: string; messages: ChatMessage[]; maxTokens: number };
export type Snapshot = {
  type: "state";
  room: string;
  mode: Mode;
  phase: Phase;
  viewers: number;
  contributors: number;
  readyContributors: number;
  model: string;
  modelAvailable: boolean;
  thoughts: Thought[];
  active: { id: string; text: string; startedAt: number } | null;
  totalTokens: number;
  totalComputeMs: number;
  totalThoughts: number;
  bornAt: number;
  nextThoughtAt: number;
  serverTime: number;
};
export type ServerEvent =
  | Snapshot
  | { type: "job"; job: Job }
  | { type: "cancel"; jobId: string }
  | { type: "hello"; clientId: string }
  | { type: "error"; message: string }
  | { type: "accepted" }
  | { type: "pong" };
export const BROWSER_MODEL = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
export const LOCAL_MODEL = "qwen2.5:0.5b";
export const MAX_THOUGHT_CHARS = 800;
export const MAX_WHISPER_CHARS = 180;
export function dutyLimit(value: unknown): number {
  return value === 0.1 || value === 0.2 ? value : 0.05;
}
export function cooldownMs(computeMs: number, duty: number): number {
  return Math.ceil(Math.max(0, computeMs) * (1 / dutyLimit(duty) - 1));
}
export function cleanThought(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/<\|[^>]+\|>/g, "")
    .replace(/^\s*(?:Held Alive|Assistant)\s*:\s*/i, "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .trim()
    .slice(0, MAX_THOUGHT_CHARS);
}
export function isAllowedOrigin(origin: string | null, url: URL): boolean {
  if (!origin) return false;
  try {
    const from = new URL(origin);
    if (from.origin === url.origin) return true;
    return (
      ["localhost", "127.0.0.1"].includes(url.hostname) &&
      ["localhost", "127.0.0.1"].includes(from.hostname)
    );
  } catch {
    return false;
  }
}
