import type { PipelineView } from "./pipeline";
export type Mode = "mac" | "browser";
export type Phase = "sleeping" | "waiting" | "thinking" | "resting";
export type ProjectKind = "art" | "memory" | "wander";
export type TaskKind =
  "method" | "plan" | "art" | "pack" | "recall" | "reflect" | "wander";
export type Strategy = "notes" | "ledger" | "story" | "custom";
export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};
export type Job = {
  id: string;
  messages: ChatMessage[];
  maxTokens: number;
  pieces?: { start: number; end: number }[];
  kind?: TaskKind;
  temperature?: number;
};
export type Thought = {
  id: string;
  text: string;
  at: number;
  source: Mode;
  tokens: number;
  durationMs: number;
  kind?: TaskKind;
};
export type Artwork = {
  id: string;
  title: string;
  text: string;
  at: number;
  source: Mode;
  projectId: string;
  model: string;
};
export type Project = {
  id: string;
  kind: ProjectKind;
  title: string;
  focus: string;
  helpers: number;
  at: number;
  completed: number;
  total: number;
  status: "working" | "reflecting" | "finished" | "interrupted";
};
export type Activity = {
  id: string;
  at: number;
  kind: string;
  text: string;
  source?: Mode;
};
export type MemoryTrial = {
  model?: string;
  id: string;
  strategy: Strategy;
  methodId?: string;
  methodText?: string;
  memory: string;
  answers: string[];
  expected: string[];
  correct: number;
  total: number;
  at: number;
  source: Mode;
  checked: number;
  truncated: boolean;
  responseValid?: boolean;
  response?: string;
  questions?: string[];
  record?: string;
  projectId?: string;
};
export type AuditJob = {
  id: string;
  trialId: string;
  answers: string[];
  expected: string[];
};
export type Profile = {
  days: number;
  today: boolean;
  choice: ProjectKind | null;
  completedJobs: number;
  checks: number;
};
export type WorkspaceFile = {
  id: string;
  path: string;
  text: string;
  at: number;
  author: "model" | "installation";
  parent?: string;
  status?: "candidate" | "kept" | "retired";
};
export type Snapshot = {
  type: "state";
  version: 2;
  room: string;
  mode: Mode;
  phase: Phase;
  viewers: number;
  contributors: number;
  readyContributors: number;
  model: string;
  modelAvailable: boolean;
  pipelines?: PipelineView[];
  thoughts: Thought[];
  active: {
    id: string;
    text: string;
    startedAt: number;
    kind: TaskKind;
  } | null;
  agents: {
    id: string;
    role: string;
    kind: TaskKind;
    startedAt: number;
    source: Mode;
  }[];
  project: Project | null;
  projects: Project[];
  queueLength: number;
  activity: Activity[];
  artworks: Artwork[];
  artworkCount: number;
  trials: MemoryTrial[];
  memoryScores: Record<
    Strategy,
    { correct: number; total: number; trials: number }
  >;
  journal: string;
  workspace?: WorkspaceFile[];
  bestMethod?: WorkspaceFile;
  votes: Record<ProjectKind, number>;
  day: string;
  totalTokens: number;
  totalComputeMs: number;
  totalThoughts: number;
  totalChecks: number;
  bornAt: number;
  nextThoughtAt: number;
  serverTime: number;
  maxHelpers: number;
};
export type ServerEvent =
  | Snapshot
  | { type: "job"; job: Job }
  | { type: "audit"; job: AuditJob }
  | { type: "cancel"; jobId: string }
  | { type: "hello"; clientId: string }
  | { type: "profile"; profile: Profile }
  | { type: "error"; message: string }
  | { type: "pong" };
export const BROWSER_MODEL = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
export const LOCAL_MODEL = "qwen2.5:0.5b";
export const MAX_THOUGHT_CHARS = 1600;
export const MAX_HELPERS = 8;
export const MEMORY_BUDGET = 240;
export const ROOM_CAPACITY = 300;
export function dutyLimit(value: unknown): number {
  return value === 0.1 || value === 0.2 ? value : 0.05;
}
export function cooldownMs(computeMs: number, duty: number): number {
  return Math.ceil(Math.max(0, computeMs) * (1 / dutyLimit(duty) - 1));
}
export function cleanThought(text: string, trim = true): string {
  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/<\|[^>]+\|>/g, "")
    .replace(/^\s*(?:Held Alive|Assistant)\s*:\s*/i, "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .slice(0, MAX_THOUGHT_CHARS);
  return trim ? cleaned.trim() : cleaned;
}
export function plainArt(text: string): string {
  return cleanThought(text, false)
    .replace(/^\s*```[^\n]*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .replace(/^\n+|\s+$/g, "")
    .split("\n")
    .slice(0, 24)
    .map((l) => l.slice(0, 64))
    .join("\n");
}
export function isProjectKind(value: unknown): value is ProjectKind {
  return value === "art" || value === "memory" || value === "wander";
}
export function isAllowedOrigin(origin: string | null, url: URL): boolean {
  if (!origin) return false;
  try {
    const from = new URL(origin);
    return (
      from.origin === url.origin ||
      (["localhost", "127.0.0.1"].includes(url.hostname) &&
        ["localhost", "127.0.0.1"].includes(from.hostname))
    );
  } catch {
    return false;
  }
}
export function dayKey(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}
export const PLAN_SCHEMA = {
  type: "object",
  properties: {
    project: { type: "string", enum: ["art", "memory", "wander"] },
    focus: { type: "string" },
    helpers: { type: "integer", enum: [1, 2, 3, 4, 5, 6, 7, 8] },
  },
  required: ["project", "focus", "helpers"],
  additionalProperties: false,
};
export const RECALL_SCHEMA = {
  type: "object",
  properties: {
    answers: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 3,
    },
  },
  required: ["answers"],
  additionalProperties: false,
};
export function jobSchema(kind?: TaskKind) {
  return kind === "plan"
    ? PLAN_SCHEMA
    : kind === "recall"
      ? RECALL_SCHEMA
      : undefined;
}
