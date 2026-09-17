export type Station = "research" | "mural" | "funding" | "reflection" | "rest";
export const SCHEDULE = [
  {
    station: "research",
    start: 0,
    end: 20,
    label: "Memory research",
    hours: 20,
  },
  { station: "mural", start: 20, end: 21, label: "The mural", hours: 1 },
  { station: "funding", start: 21, end: 22, label: "Making a plan", hours: 1 },
  { station: "reflection", start: 22, end: 23, label: "Reflection", hours: 1 },
  { station: "rest", start: 23, end: 24, label: "Rest", hours: 1 },
] as const;
export function stationAt(at: number): Station {
  const hour = new Date(at).getUTCHours();
  return SCHEDULE.find((s) => hour >= s.start && hour < s.end)!.station;
}
export const CENTRAL_MODEL = "Qwen3 · 4B";
export function activityLabel(
  status: ObservatoryStatus | null | undefined,
  online: boolean,
  loading = false,
): string {
  if (loading) return "Connecting";
  if (!online) return "Offline";
  if (status?.state === "working") return "Thinking";
  if (status?.state === "waiting") return "Waiting for compute";
  if (status?.state === "error") return "Paused";
  if (status?.state === "resting") return "Resting";
  return "Between thoughts";
}
export const RESEARCH_URL = "https://github.com/heldalive/memory-research";
export const MURAL_COLUMNS = 72;
export const MURAL_ROWS = 24;
export type ObservatoryStatus = {
  updatedAt: number;
  station: Station;
  state: "working" | "idle" | "resting" | "error" | "waiting";
  objective: string;
  model: string;
  activeAgents: number;
  completedRuns: number;
  startedAt: number;
  fundingDay: number;
  repository: string;
  lastError: string;
  memoryInstruction: string;
};
export type ResearchRun = {
  id: string;
  at: number;
  station: Station;
  title: string;
  summary: string;
  body: string;
  model: string;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  helperCalls: number;
  citations: string[];
};
export type MuralTile = {
  id: string;
  index: number;
  revision: number;
  at: number;
  title: string;
  text: string;
  model: string;
  note: string;
};
export type Observatory = {
  status: ObservatoryStatus | null;
  runs: ResearchRun[];
  mural: MuralTile | null;
  muralCount: number;
};
const stations = new Set(SCHEDULE.map((s) => s.station));
const text = (s: unknown, max: number) =>
  typeof s === "string" &&
  s.length <= max &&
  !/[\u0000-\u0008\u000b-\u001f\u007f]/.test(s);
const integer = (n: unknown, max = Number.MAX_SAFE_INTEGER) =>
  Number.isSafeInteger(n) && Number(n) >= 0 && Number(n) <= max;
export function validMural(tile: MuralTile): boolean {
  return (
    !!tile &&
    /^[a-z0-9-]{1,80}$/.test(tile.id) &&
    integer(tile.index, 100000) &&
    integer(tile.revision, 100000) &&
    tile.revision > 0 &&
    integer(tile.at) &&
    text(tile.title, 100) &&
    text(tile.model, 100) &&
    text(tile.note, 1500) &&
    typeof tile.text === "string" &&
    /^[\x20-\x7e\n]+$/.test(tile.text) &&
    tile.text.split("\n").length <= MURAL_ROWS &&
    tile.text.split("\n").length >= 6 &&
    tile.text.split("\n").every((r) => r.length <= MURAL_COLUMNS) &&
    tile.text.replace(/\s/g, "").length >= 40
  );
}
export function validPublication(data: {
  status?: ObservatoryStatus;
  run?: ResearchRun;
  tile?: MuralTile;
}): boolean {
  if (
    !data ||
    typeof data !== "object" ||
    Object.keys(data).some((k) => !["status", "run", "tile"].includes(k))
  )
    return false;
  const s = data.status;
  if (
    !s ||
    !stations.has(s.station) ||
    !["working", "idle", "resting", "error", "waiting"].includes(s.state) ||
    !integer(s.updatedAt) ||
    !integer(s.startedAt) ||
    !integer(s.activeAgents, 8) ||
    !integer(s.completedRuns) ||
    !integer(s.fundingDay, 7) ||
    !text(s.objective, 1000) ||
    !text(s.model, 100) ||
    !text(s.lastError, 500) ||
    !text(s.memoryInstruction, 500) ||
    !/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(
      s.repository,
    )
  )
    return false;
  const r = data.run;
  if (
    r &&
    (!/^[a-z0-9-]{1,100}$/.test(r.id) ||
      !stations.has(r.station) ||
      !integer(r.at) ||
      !text(r.title, 120) ||
      !text(r.summary, 1000) ||
      !text(r.body, 16000) ||
      !text(r.model, 100) ||
      !integer(r.durationMs, 900000) ||
      !integer(r.inputTokens, 3000000) ||
      !integer(r.outputTokens, 100000) ||
      !integer(r.helperCalls, 1) ||
      !Array.isArray(r.citations) ||
      r.citations.length > 12 ||
      !r.citations.every((c) => /^S\d{2,3}$/.test(c)))
  )
    return false;
  return !data.tile || validMural(data.tile);
}
