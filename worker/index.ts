import { CURRENT_MODEL } from "../shared/model";
import {
  HIDDEN_BYTES,
  completeCoverage,
  contributionLayers,
  nextPiece,
  validStageCall,
  validTop,
  type Piece,
  type StageCall,
} from "../shared/pipeline";
import { DurableObject } from "cloudflare:workers";
import { timingSafeEqual } from "node:crypto";
import {
  cleanThought,
  cooldownMs,
  dayKey,
  dutyLimit,
  isAllowedOrigin,
  MAX_HELPERS,
  MAX_THOUGHT_CHARS,
  ROOM_CAPACITY,
} from "../shared/protocol";
import type {
  Activity,
  Artwork,
  AuditJob,
  ChatMessage,
  MemoryTrial,
  Mode,
  Profile,
  Project,
  ProjectKind,
  Snapshot,
  Strategy,
  TaskKind,
  Thought,
  WorkspaceFile,
} from "../shared/protocol";
import { artMessages } from "../shared/personality";
import { ART_MAX_TOKENS, inspectArt } from "../shared/ascii";
import { scoreAnswers } from "../shared/experiments";
import type { MemoryCase } from "../shared/experiments";
import { modelAssetUrl } from "../shared/modelAssets";

type Task = {
  id: string;
  kind: TaskKind;
  messages: ChatMessage[];
  maxTokens: number;
  title: string;
  projectId: string;
  attempts: number;
  strategy?: Strategy;
  memoryCase?: MemoryCase;
  memory?: string;
  truncated?: boolean;
  methodId?: string;
  methodText?: string;
};
type Active = {
  task: Task;
  peerId: string;
  text: string;
  startedAt: number;
  deadline: number;
  source: Mode;
  computeMs?: number;
};
type Peer = {
  id: string;
  identity: string;
  role: "visitor" | "bridge";
  ip: string;
  seen: number;
  visible: boolean;
  ready: boolean;
  duty: number;
  availableAt: number;
  lastMessage: number;
  burst: number;
  checks: boolean;
  nextAuditAt: number;
  audit: (AuditJob & { deadline: number }) | null;
  piece?: Piece;
  stageJob?: string;
  stagePosition?: number;
  pending?: {
    leader: string;
    jobId: string;
    rid: string;
    count: number;
    deadline: number;
  };
  samplePending?: {
    leader: string;
    jobId: string;
    rid: string;
    tokens: number[];
    deadline: number;
  };
};
type Stored = {
  room: string;
  bornAt: number;
  thoughts: Thought[];
  totalTokens: number;
  totalComputeMs: number;
  totalThoughts: number;
  totalChecks: number;
  nextThoughtAt: number;
  active: Active[];
  queue: Task[];
  project: Project | null;
  projects: Project[];
  results: string[];
  journal: string;
  activity: Activity[];
  scores: Snapshot["memoryScores"];
  cleanedDay: string;
  modelVersion?: number;
  artEdition?: number;
  bestMethod?: WorkspaceFile;
  memoryCandidate?: WorkspaceFile;
  launchSupport?: boolean;
};
type VisitorRow = {
  id: string;
  days: number;
  last_day: string;
  choice_day: string;
  choice: string;
  jobs: number;
  checks: number;
  last_seen: number;
};
const emptyScores = (): Snapshot["memoryScores"] => ({
  custom: { correct: 0, total: 0, trials: 0 },
  notes: { correct: 0, total: 0, trials: 0 },
  ledger: { correct: 0, total: 0, trials: 0 },
  story: { correct: 0, total: 0, trials: 0 },
});
const encoder = new TextEncoder();
async function equalSecrets(a: string, b: string) {
  const [x, y] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(a)),
    crypto.subtle.digest("SHA-256", encoder.encode(b)),
  ]);
  return timingSafeEqual(new Uint8Array(x), new Uint8Array(y));
}
async function signature(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return Array.from(
    new Uint8Array(
      await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(`held-visitor-v1:${value}`),
      ),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}
async function identity(
  request: Request,
  secret: string,
): Promise<string | null> {
  const token = request.headers
    .get("Cookie")
    ?.match(/(?:^|;\s*)held_visitor=([^;]+)/)?.[1];
  if (!token || token.length > 180) return null;
  const [id, at, sig] = token.split(".");
  if (
    !/^[a-f0-9-]{36}$/.test(id || "") ||
    !/^\d{13}$/.test(at || "") ||
    !/^[a-f0-9]{64}$/.test(sig || "")
  )
    return null;
  if (
    Number(at) > Date.now() + 60_000 ||
    Date.now() - Number(at) > 180 * 86400_000
  )
    return null;
  return (await equalSecrets(sig, await signature(`${id}.${at}`, secret)))
    ? id
    : null;
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/model/")) {
      const upstreamUrl = modelAssetUrl(url.pathname);
      if (!upstreamUrl) return new Response("Not found", { status: 404 });
      if (!["GET", "HEAD"].includes(request.method))
        return new Response("Method not allowed", { status: 405 });
      const upstream = await fetch(upstreamUrl, {
        method: request.method,
        cf: { cacheEverything: true, cacheTtl: 86400 },
        signal: AbortSignal.timeout(60_000),
      });
      if (!upstream.ok)
        return new Response(
          "Model file temporarily unavailable. Please try again.",
          {
            status: 502,
            headers: { "Cache-Control": "no-store", "Retry-After": "15" },
          },
        );
      const contentType = url.pathname.endsWith(".wasm")
        ? "application/wasm"
        : url.pathname.endsWith(".json")
          ? "application/json"
          : url.pathname.endsWith(".bin")
            ? "application/octet-stream"
            : "text/plain";
      return new Response(upstream.body, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    if (url.pathname.startsWith("/api/")) {
      if (
        ![
          "/api/socket",
          "/api/state",
          "/api/health",
          "/api/artworks",
          "/api/trials",
          "/api/workspace",
          "/api/inputs",
          "/api/identity",
          "/api/launch-support",
        ].includes(url.pathname)
      )
        return new Response("Not found", { status: 404 });
      if (!env.BRIDGE_TOKEN)
        return new Response("Installation is not configured", { status: 503 });
      if (url.pathname === "/api/identity") {
        if (request.method !== "GET")
          return new Response("Method not allowed", { status: 405 });
        const existing = await identity(request, env.BRIDGE_TOKEN);
        const headers = new Headers({ "Cache-Control": "no-store" });
        if (!existing) {
          const value = `${crypto.randomUUID()}.${Date.now()}`;
          headers.set(
            "Set-Cookie",
            `held_visitor=${value}.${await signature(value, env.BRIDGE_TOKEN)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=15552000${url.protocol === "https:" ? "; Secure" : ""}`,
          );
        }
        return Response.json({ ok: true }, { headers });
      }
      const room =
        url.searchParams.get("room") === "browser" ? "browser" : "main";
      let visitor = "";
      if (url.pathname === "/api/launch-support") {
        if (request.method !== "POST")
          return new Response("Method not allowed", { status: 405 });
        if (
          room !== "browser" ||
          !(await equalSecrets(
            request.headers.get("Authorization") || "",
            `Bearer ${env.BRIDGE_TOKEN}`,
          ))
        )
          return new Response("Unauthorized", { status: 401 });
      } else if (url.pathname === "/api/socket") {
        if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket")
          return new Response("WebSocket required", { status: 426 });
        const bridge = url.searchParams.get("role") === "bridge";
        if (bridge) {
          if (
            !(await equalSecrets(
              request.headers.get("Authorization") || "",
              `Bearer ${env.BRIDGE_TOKEN}`,
            ))
          )
            return new Response("Unauthorized", { status: 401 });
        } else {
          if (!isAllowedOrigin(request.headers.get("Origin"), url))
            return new Response("Origin not allowed", { status: 403 });
          visitor = (await identity(request, env.BRIDGE_TOKEN)) || "";
          if (!visitor)
            return new Response("Please refresh to connect", { status: 401 });
        }
      } else if (request.method !== "GET")
        return new Response("Method not allowed", { status: 405 });
      const forwarded = new Request(request);
      forwarded.headers.set("X-Held-Identity", visitor);
      return env.ROOMS.getByName(room).fetch(forwarded);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

export class LivingRoom extends DurableObject<Env> {
  private state: Stored;
  private lastBroadcast = 0;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS workspace (id TEXT PRIMARY KEY, value TEXT NOT NULL, at INTEGER NOT NULL)",
    );
    this.ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS creature (id INTEGER PRIMARY KEY, value TEXT NOT NULL)",
    );
    this.ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS artworks (id TEXT PRIMARY KEY, value TEXT NOT NULL, at INTEGER NOT NULL)",
    );
    this.ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS trials (id TEXT PRIMARY KEY, value TEXT NOT NULL, at INTEGER NOT NULL)",
    );
    this.ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS visitors (id TEXT PRIMARY KEY, days INTEGER NOT NULL DEFAULT 0, last_day TEXT NOT NULL DEFAULT '', choice_day TEXT NOT NULL DEFAULT '', choice TEXT NOT NULL DEFAULT '', jobs INTEGER NOT NULL DEFAULT 0, checks INTEGER NOT NULL DEFAULT 0, last_seen INTEGER NOT NULL)",
    );
    this.ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS audit_checks (identity TEXT NOT NULL, trial TEXT NOT NULL, at INTEGER NOT NULL, PRIMARY KEY(identity,trial))",
    );
    this.ctx.storage.sql.exec(
      "CREATE INDEX IF NOT EXISTS artworks_at ON artworks(at DESC)",
    );
    this.ctx.storage.sql.exec(
      "CREATE INDEX IF NOT EXISTS trials_at ON trials(at DESC)",
    );
    this.ctx.storage.sql.exec(
      "CREATE INDEX IF NOT EXISTS visitors_choice ON visitors(choice_day,choice)",
    );
    this.ctx.storage.sql.exec(
      "CREATE INDEX IF NOT EXISTS visitors_seen ON visitors(last_seen)",
    );
    this.ctx.storage.sql.exec(
      "CREATE INDEX IF NOT EXISTS checks_at ON audit_checks(at)",
    );
    const row = this.ctx.storage.sql
      .exec<{ value: string }>("SELECT value FROM creature WHERE id=1")
      .toArray()[0];
    this.state = row
      ? (JSON.parse(row.value) as Stored)
      : {
          room: "main",
          bornAt: Date.now(),
          thoughts: [],
          totalTokens: 0,
          totalComputeMs: 0,
          totalThoughts: 0,
          totalChecks: 0,
          nextThoughtAt: 0,
          active: [],
          queue: [],
          project: null,
          projects: [],
          results: [],
          journal: "",
          activity: [],
          scores: emptyScores(),
          cleanedDay: "",
          modelVersion: CURRENT_MODEL.modelVersion,
        };
    this.state.scores.custom ??= { correct: 0, total: 0, trials: 0 };
    if (
      this.state.room === "browser" &&
      this.state.modelVersion !== CURRENT_MODEL.modelVersion
    ) {
      if (this.state.project)
        this.state.projects.push({
          ...this.state.project,
          status: "interrupted",
        });
      for (const p of this.peers()) {
        for (const job of this.state.active)
          this.send(p.ws, { type: "cancel", jobId: job.task.id });
        p.peer.ready = false;
        delete p.peer.piece;
        delete p.peer.pending;
        delete p.peer.stageJob;
        delete p.peer.stagePosition;
        p.ws.serializeAttachment(p.peer);
        this.send(p.ws, {
          type: "pipeline_error",
          message: "The model was upgraded. Reload this page to lend compute.",
        });
        this.send(p.ws, {
          type: "error",
          message: "The model was upgraded. Reload this page to lend compute.",
        });
      }
      this.state.project = null;
      this.state.queue = [];
      this.state.active = [];
      this.state.scores = emptyScores();
      this.state.modelVersion = CURRENT_MODEL.modelVersion;
      this.state.nextThoughtAt = 0;
      this.event(
        "edition",
        "A more capable drawing model arrives. Earlier drawings remain in the archive.",
      );
      this.save();
    }
    this.enterArtEdition();
  }
  private enterArtEdition() {
    if (this.state.artEdition === 6) return;
    for (const a of this.state.active) {
      const owner = this.peers().find((p) => p.peer.id === a.peerId);
      if (owner) this.send(owner.ws, { type: "cancel", jobId: a.task.id });
    }
    if (this.state.project && this.state.project.status !== "finished")
      this.state.projects.push({
        ...this.state.project,
        status: "interrupted",
      });
    this.state.active = [];
    this.state.queue = [];
    this.state.project = null;
    this.state.results = [];
    this.state.nextThoughtAt = 0;
    this.state.artEdition = 6;
    for (const { ws, peer } of this.peers()) {
      peer.audit = null;
      ws.serializeAttachment(peer);
    }
    this.event(
      "edition",
      "The art-only edition begins. Earlier drawings and research records stay in the archive.",
    );
    this.save();
  }
  private writeFile(file: WorkspaceFile) {
    this.ctx.storage.sql.exec(
      "INSERT INTO workspace (id,value,at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value",
      file.id,
      JSON.stringify(file),
      file.at,
    );
  }
  private save() {
    this.ctx.storage.sql.exec(
      "INSERT INTO creature (id,value) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value",
      JSON.stringify(this.state),
    );
  }
  private mode(): Mode {
    return this.state.room === "browser" ? "browser" : "mac";
  }
  private peers() {
    return this.ctx
      .getWebSockets()
      .map((ws) => ({ ws, peer: ws.deserializeAttachment() as Peer }))
      .filter((p) => p.peer && p.ws.readyState === WebSocket.OPEN);
  }
  private pipelines() {
    const peers = this.peers().filter(
      (p) => p.peer.piece && p.peer.visible && Date.now() - p.peer.seen < 45000,
    );
    return Array.from({ length: 8 }, (_, group) => {
      const members = peers
        .filter((p) => p.peer.piece!.group === group)
        .sort((a, b) => a.peer.piece!.start - b.peer.piece!.start);
      const ready = members.filter((p) => p.peer.ready);
      return {
        group,
        members,
        ready: completeCoverage(ready.map((p) => p.peer.piece!)),
      };
    }).filter((g) => g.members.length);
  }
  private releasePiece(peer: Peer) {
    if (peer.piece) {
      const group = peer.piece.group;
      const leader = this.peers().find(
        (p) => p.peer.piece?.group === group && p.peer.piece.start === 0,
      );
      if (leader) this.cancelPeer(leader.peer.id);
      for (const p of this.peers().filter(
        (p) => p.peer.piece?.group === group,
      )) {
        delete p.peer.pending;
        delete p.peer.stageJob;
        delete p.peer.stagePosition;
        this.send(p.ws, { type: "pipeline_reset" });
        p.ws.serializeAttachment(p.peer);
      }
    }
    peer.ready = false;
    delete peer.piece;
    delete peer.pending;
  }
  private async pipelineMessage(
    ws: WebSocket,
    peer: Peer,
    data: Record<string, unknown>,
  ): Promise<boolean> {
    if (!String(data.type).startsWith("pipeline_")) return false;
    if (this.mode() !== "browser" || peer.role !== "visitor") return true;
    const now = Date.now();
    if (
      (data.type === "pipeline_offer" || data.type === "pipeline_ready") &&
      data.modelId !== CURRENT_MODEL.id
    ) {
      this.releasePiece(peer);
      ws.serializeAttachment(peer);
      this.send(ws, {
        type: "pipeline_error",
        message: "The model was upgraded. Reload this page to lend compute.",
      });
      this.send(ws, {
        type: "error",
        message: "The model was upgraded. Reload this page to lend compute.",
      });
      return true;
    }
    if (data.type === "pipeline_offer") {
      this.releasePiece(peer);
      peer.visible = data.visible !== false;
      peer.duty = dutyLimit(data.duty);
      if (peer.visible) {
        const existing = this.peers()
          .filter(
            (p) =>
              p.peer.id !== peer.id &&
              p.peer.visible &&
              p.peer.piece &&
              now - p.peer.seen < 45000,
          )
          .map((p) => p.peer.piece!);
        const part = nextPiece(existing, contributionLayers(peer.duty));
        if (part) {
          peer.piece = { ...part, key: crypto.randomUUID() };
          this.send(ws, { type: "pipeline_assign", piece: peer.piece });
        } else
          this.send(ws, {
            type: "pipeline_error",
            message:
              "All eight shared pipelines have holders. You can keep doing tiny work or return later.",
          });
      }
    } else if (data.type === "pipeline_ready") {
      if (peer.piece && peer.piece.key === data.key) peer.ready = true;
    } else if (data.type === "pipeline_stop") {
      this.releasePiece(peer);
    } else if (data.type === "pipeline_call") {
      const call = data as unknown as StageCall;
      const job = this.state.active.find(
        (a) => a.peerId === peer.id && a.task.id === call.jobId,
      );
      const group = this.pipelines().find(
        (g) => g.group === peer.piece?.group && g.ready,
      );
      if (!job || !group || !validStageCall(call) || job.deadline < now)
        return true;
      const target = group.members.find(
        (p) => p.peer.piece!.start === call.start,
      );
      if (!target || target.peer.pending) return true;
      if (
        call.position !== 0 &&
        (target.peer.stageJob !== call.jobId ||
          target.peer.stagePosition !== call.position)
      )
        return true;
      target.peer.stageJob = call.jobId;
      target.peer.stagePosition = call.position + call.count;
      target.peer.pending = {
        leader: peer.id,
        jobId: call.jobId,
        rid: call.rid,
        count: call.count,
        deadline: now + 60000,
      };
      target.ws.serializeAttachment(target.peer);
      this.send(target.ws, {
        type: "pipeline_step",
        call: {
          jobId: call.jobId,
          rid: call.rid,
          start: call.start,
          position: call.position,
          count: call.count,
          allowed: call.allowed,
          repetitionIds:
            job.task.kind === "art" ? call.repetitionIds : undefined,
          ...(call.tokens ? { tokens: call.tokens } : { data: call.data }),
        },
      });
      return true;
    } else if (data.type === "pipeline_result") {
      const pending = peer.pending;
      const job = this.state.active.find(
        (a) => a.peerId === pending?.leader && a.task.id === pending.jobId,
      );
      if (
        !pending ||
        !job ||
        pending.rid !== data.rid ||
        pending.jobId !== data.jobId ||
        now > pending.deadline
      )
        return true;
      const leader = this.peers().find((p) => p.peer.id === pending.leader);
      if (!leader) return true;
      const bytes = pending.count * HIDDEN_BYTES;
      const valid =
        peer.piece?.end === CURRENT_MODEL.layers
          ? validTop(data.top)
          : typeof data.data === "string" &&
            data.data.length === Math.ceil(bytes / 3) * 4 &&
            /^[A-Za-z0-9+/]*={0,2}$/.test(data.data);
      const compute =
        typeof data.computeMs === "number" && Number.isFinite(data.computeMs)
          ? Math.max(0, Math.min(60000, data.computeMs))
          : 0;
      if (!valid || data.error) {
        this.fail(job, "A shared piece failed. Its thought will restart.");
        this.send(leader.ws, { type: "cancel", jobId: job.task.id });
      } else {
        job.computeMs = (job.computeMs || 0) + compute;
        this.send(leader.ws, {
          type: "pipeline_reply",
          rid: data.rid,
          jobId: data.jobId,
          ...(peer.piece?.end === CURRENT_MODEL.layers
            ? { top: data.top }
            : { data: data.data }),
        });
      }
      delete peer.pending;
      ws.serializeAttachment(peer);
      this.save();
      return true;
    } else if (data.type === "pipeline_sample") {
      const job = this.state.active.find(
        (a) => a.peerId === peer.id && a.task.id === data.jobId,
      );
      if (
        !job ||
        !validTop(data.top) ||
        typeof data.rid !== "string" ||
        data.rid.length > 64
      )
        return true;
      const target = this.peers()
        .filter(
          (p) =>
            p.peer.visible &&
            p.peer.checks &&
            p.peer.id !== peer.id &&
            !p.peer.samplePending &&
            now - p.peer.seen < 45000,
        )
        .sort((a, b) => a.peer.nextAuditAt - b.peer.nextAuditAt)[0];
      if (!target) {
        this.send(ws, { type: "pipeline_sample_local", rid: data.rid });
        return true;
      }
      target.peer.samplePending = {
        leader: peer.id,
        jobId: job.task.id,
        rid: data.rid,
        tokens: data.top.map(([id]) => id),
        deadline: now + 2500,
      };
      target.peer.nextAuditAt = now + 1000;
      target.ws.serializeAttachment(target.peer);
      this.send(target.ws, {
        type: "pipeline_tiny",
        rid: data.rid,
        jobId: job.task.id,
        top: data.top,
        temperature:
          typeof data.temperature === "number"
            ? Math.min(1, Math.max(0, data.temperature))
            : 0.8,
        random: crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296,
        history: Array.isArray(data.history)
          ? data.history.filter((n) => Number.isInteger(n)).slice(-40)
          : [],
      });
      return true;
    } else if (data.type === "pipeline_sampled") {
      const pending = peer.samplePending;
      if (
        pending &&
        pending.rid === data.rid &&
        pending.deadline >= now &&
        pending.tokens.includes(data.token as number)
      ) {
        const leader = this.peers().find((p) => p.peer.id === pending.leader);
        if (leader)
          this.send(leader.ws, {
            type: "pipeline_sample_reply",
            rid: data.rid,
            token: data.token,
          });
        this.state.totalChecks++;
        this.ctx.storage.sql.exec(
          "UPDATE visitors SET checks=checks+1,last_seen=? WHERE id=?",
          now,
          peer.identity,
        );
        this.send(ws, {
          type: "profile",
          profile: this.profile(peer.identity),
        });
      }
      delete peer.samplePending;
    }
    peer.seen = now;
    ws.serializeAttachment(peer);
    this.save();
    await this.tick();
    return true;
  }
  private send(ws: WebSocket, data: unknown) {
    try {
      ws.send(JSON.stringify(data));
    } catch {
      try {
        ws.close(1011, "Connection lost");
      } catch {
        /* already closed */
      }
    }
  }
  private event(kind: string, text: string, source?: Mode) {
    this.state.activity.push({
      id: crypto.randomUUID(),
      at: Date.now(),
      kind,
      text,
      source,
    });
    this.state.activity = this.state.activity.slice(-32);
  }
  private profile(id: string): Profile {
    const p = this.ctx.storage.sql
      .exec<VisitorRow>("SELECT * FROM visitors WHERE id=?", id)
      .toArray()[0];
    const today = dayKey(Date.now());
    return {
      days: p?.days || 0,
      today: p?.last_day === today,
      choice: null,
      completedJobs: p?.jobs || 0,
      checks: p?.checks || 0,
    };
  }
  private recent<T>(
    table: "artworks" | "trials" | "workspace",
    limit: number,
    offset = 0,
  ): T[] {
    return this.ctx.storage.sql
      .exec<{ value: string }>(
        `SELECT value FROM ${table} ORDER BY at DESC LIMIT ? OFFSET ?`,
        limit,
        offset,
      )
      .toArray()
      .map((r) => JSON.parse(r.value) as T);
  }
  private snapshot(): Snapshot {
    const now = Date.now();
    const peers = this.peers().filter((p) => now - p.peer.seen < 45000);
    const visitors = peers.filter(
      (p) => p.peer.role === "visitor" && p.peer.visible,
    );
    const workers = peers.filter(
      (p) =>
        p.peer.ready &&
        (this.mode() === "mac"
          ? p.peer.role === "bridge"
          : p.peer.role === "visitor" && p.peer.visible),
    );
    const browserChains = this.pipelines().filter((g) => g.ready).length;
    const macAvailable = peers.some(
      (p) => p.peer.role === "bridge" && p.peer.ready,
    );
    const launchSupport =
      this.mode() === "browser" && this.state.launchSupport !== false;
    const modelAvailable =
      this.mode() === "mac"
        ? macAvailable
        : browserChains > 0 || (launchSupport && macAvailable);
    const sources = new Set(this.state.active.map((a) => a.source));
    const source =
      sources.size > 1
        ? "mixed"
        : sources.size
          ? [...sources][0]
          : browserChains > 0
            ? "browser"
            : modelAvailable && macAvailable
              ? "mac"
              : "waiting";
    const busy = new Set(this.state.active.map((a) => a.peerId));
    const active = this.state.active[0];
    return {
      type: "state",
      version: 2,
      room: this.state.room,
      mode: this.mode(),
      phase: !visitors.length
        ? "sleeping"
        : this.state.active.length
          ? "thinking"
          : !modelAvailable
            ? "waiting"
            : "resting",
      viewers: visitors.length,
      contributors: this.mode() === "browser" ? workers.length : 0,
      readyContributors: workers.filter(
        (p) => p.peer.availableAt <= now && !busy.has(p.peer.id),
      ).length,
      model:
        this.mode() === "browser"
          ? `${CURRENT_MODEL.label} · shared`
          : "Qwen 2.5 · 0.5B",
      modelAvailable,
      power: { launchSupport, macAvailable, browserChains, source },
      pipelines: this.pipelines().map((g) => ({
        group: g.group,
        ready: g.ready,
        covered: g.members
          .filter((p) => p.peer.ready)
          .reduce((a, p) => a + p.peer.piece!.end - p.peer.piece!.start, 0),
        pieces: g.members.map((p) => ({
          start: p.peer.piece!.start,
          end: p.peer.piece!.end,
          ready: p.peer.ready,
          busy: Boolean(p.peer.pending),
        })),
      })),
      thoughts: this.state.thoughts.slice(-12),
      active: active
        ? {
            id: active.task.id,
            text: active.text,
            startedAt: active.startedAt,
            kind: active.task.kind,
          }
        : null,
      agents: this.state.active.map((a, i) => ({
        id: a.task.id,
        role: i === 0 ? "Artist" : "Helper",
        kind: a.task.kind,
        startedAt: a.startedAt,
        source: a.source,
        title: a.task.title,
        draft: cleanThought(a.text, false),
        characters: a.text.length,
        inputWords: a.task.messages
          .map((m) => m.content)
          .join(" ")
          .trim()
          .split(/\s+/u).length,
        maxOutputTokens: a.task.maxTokens,
      })),
      project: this.state.project,
      projects: this.state.projects.slice(-8),
      queueLength: this.state.queue.length,
      activity: this.state.activity
        .filter((e) => {
          const edition = [...this.state.activity]
            .reverse()
            .find((a) => a.kind === "edition");
          return !edition || e.at >= edition.at;
        })
        .slice(-12),
      artworks: this.recent<Artwork>("artworks", 6),
      artworkCount: this.ctx.storage.sql
        .exec<{ n: number }>("SELECT COUNT(*) AS n FROM artworks")
        .one().n,
      trials: this.recent<MemoryTrial>("trials", 6),
      memoryScores: this.state.scores,
      journal: this.state.journal,
      workspace: this.recent<WorkspaceFile>("workspace", 12),
      bestMethod: this.state.bestMethod,
      votes: { art: 0, memory: 0, wander: 0 },
      day: dayKey(now),
      totalTokens: this.state.totalTokens,
      totalComputeMs: this.state.totalComputeMs,
      totalThoughts: this.state.totalThoughts,
      totalChecks: this.state.totalChecks,
      bornAt: this.state.bornAt,
      nextThoughtAt: this.state.nextThoughtAt,
      serverTime: now,
      maxHelpers: MAX_HELPERS,
    };
  }
  private broadcast(force = true) {
    if (!force && Date.now() - this.lastBroadcast < 1000) return;
    this.lastBroadcast = Date.now();
    const state = this.snapshot();
    for (const { ws, peer } of this.peers())
      if (peer.role === "visitor") this.send(ws, state);
  }
  async fetch(request: Request): Promise<Response> {
    if (new URL(request.url).pathname === "/api/workspace")
      return Response.json(
        {
          files: this.recent<WorkspaceFile>(
            "workspace",
            24,
            Math.min(
              10000,
              Math.max(
                0,
                Number(new URL(request.url).searchParams.get("offset")) || 0,
              ),
            ),
          ),
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    const url = new URL(request.url);
    this.state.room =
      url.searchParams.get("room") === "browser" ? "browser" : "main";
    if (url.pathname === "/api/launch-support") {
      const body = await request.text();
      if (body.length > 128) return new Response("Too large", { status: 413 });
      let data: { enabled?: unknown };
      try {
        data = JSON.parse(body);
      } catch {
        return new Response("Invalid setting", { status: 400 });
      }
      if (!data || typeof data.enabled !== "boolean")
        return new Response("Expected enabled boolean", { status: 400 });
      this.state.launchSupport = data.enabled;
      if (!data.enabled)
        for (const p of this.peers())
          if (p.peer.role === "bridge") this.cancelPeer(p.peer.id);
      this.event(
        "power",
        data.enabled
          ? "Temporary preview support is available. Complete browser groups get work first."
          : "Browser independence is enabled. Missing browser coverage now pauses all thought generation.",
      );
      this.save();
      await this.tick();
      return Response.json(
        { launchSupport: data.enabled },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (url.pathname === "/api/health")
      return Response.json(
        {
          ok: true,
          version: 2,
          mode: this.mode(),
          modelAvailable: this.snapshot().modelAvailable,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    if (url.pathname === "/api/state")
      return Response.json(this.snapshot(), {
        headers: { "Cache-Control": "no-store" },
      });
    if (url.pathname === "/api/inputs") {
      const tasks = this.state.active.length
        ? this.state.active.map((a) => ({
            task: a.task,
            status: "running",
            source: a.source,
          }))
        : this.state.queue
            .slice(0, 1)
            .map((task) => ({ task, status: "waiting", source: null }));
      return Response.json(
        {
          at: Date.now(),
          tasks: tasks.map(({ task, status, source }) => ({
            id: task.id,
            kind: task.kind,
            title: task.title,
            status,
            source,
            messages: task.messages,
            maxOutputTokens: task.maxTokens,
            inputWords: task.messages
              .map((m) => m.content)
              .join(" ")
              .trim()
              .split(/\s+/u).length,
          })),
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (url.pathname === "/api/artworks") {
      const n = Number(url.searchParams.get("offset") || 0);
      return Response.json(
        {
          artworks: this.recent<Artwork>(
            "artworks",
            24,
            Number.isFinite(n)
              ? Math.min(100000, Math.max(0, Math.floor(n)))
              : 0,
          ),
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (url.pathname === "/api/trials") {
      const n = Number(url.searchParams.get("offset") || 0);
      return Response.json(
        {
          trials: this.recent<MemoryTrial>(
            "trials",
            24,
            Number.isFinite(n)
              ? Math.min(100000, Math.max(0, Math.floor(n)))
              : 0,
          ),
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const role =
      url.searchParams.get("role") === "bridge" ? "bridge" : "visitor";
    const id = request.headers.get("X-Held-Identity") || "";
    const ip = request.headers.get("CF-Connecting-IP") || "local";
    const existing = this.peers();
    if (
      role === "visitor" &&
      (existing.length >= ROOM_CAPACITY ||
        existing.filter((p) => p.peer.ip === ip).length >= 32 ||
        existing.filter((p) => p.peer.identity === id).length >= 4)
    )
      return new Response("The habitat is full. Please try again shortly.", {
        status: 429,
      });
    if (role === "bridge")
      for (const p of existing)
        if (p.peer.role === "bridge") {
          this.cancelPeer(p.peer.id);
          p.ws.close(1000, "Bridge replaced");
        }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    const peer: Peer = {
      id: crypto.randomUUID(),
      identity: id,
      role,
      ip,
      seen: Date.now(),
      visible: true,
      ready: false,
      duty: 0.05,
      availableAt: 0,
      lastMessage: 0,
      burst: 0,
      checks: false,
      nextAuditAt: 0,
      audit: null,
    };
    server.serializeAttachment(peer);
    if (role === "visitor") {
      this.ctx.storage.sql.exec(
        "INSERT INTO visitors (id,last_seen) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET last_seen=excluded.last_seen",
        id,
        Date.now(),
      );
      this.send(server, { type: "profile", profile: this.profile(id) });
    }
    this.send(server, { type: "hello", clientId: peer.id });
    this.save();
    await this.tick();
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(
    ws: WebSocket,
    raw: string | ArrayBuffer,
  ): Promise<void> {
    if (typeof raw !== "string" || raw.length > 96 * 1024) {
      ws.close(1009, "Message too large");
      return;
    }
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw);
      if (!data || typeof data !== "object" || Array.isArray(data))
        throw new Error();
    } catch {
      this.send(ws, {
        type: "error",
        message: "That message could not be read.",
      });
      return;
    }
    const peer = ws.deserializeAttachment() as Peer;
    const now = Date.now();
    if (now - peer.lastMessage < 1000) peer.burst++;
    else {
      peer.lastMessage = now;
      peer.burst = 1;
    }
    // A driver sends several stage RPCs per token. Fast local chains can exceed
    // the spectator limit during useful work; ownership/shape/lease checks still apply.
    if (
      peer.burst >
      (peer.ready && (peer.piece || peer.role === "bridge") ? 600 : 180)
    ) {
      this.cancelPeer(peer.id);
      ws.close(1008, "Too many messages");
      return;
    }
    peer.seen = now;
    ws.serializeAttachment(peer);
    if (await this.pipelineMessage(ws, peer, data)) return;
    if (data.type === "ping") {
      if (peer.role === "visitor") peer.visible = data.visible !== false;
      this.send(ws, { type: "pong" });
    } else if (data.type === "ready") {
      if (peer.role === "visitor" && this.mode() !== "browser") {
        this.send(ws, {
          type: "error",
          message:
            "The studio uses preview support. Open the live habitat to lend browser compute.",
        });
        return;
      }
      peer.ready =
        data.ready === true &&
        (peer.role === "bridge"
          ? this.mode() === "mac" || data.modelId === CURRENT_MODEL.id
          : Boolean(peer.piece));
      peer.visible = data.visible !== false;
      peer.duty = dutyLimit(data.duty);
      if (!peer.ready) {
        if (this.mode() === "browser" && peer.role === "visitor")
          this.releasePiece(peer);
        else this.cancelPeer(peer.id);
      }
    } else if (data.type === "checks" && peer.role === "visitor") {
      peer.checks = data.enabled === true;
      if (!peer.checks) peer.audit = null;
    } else if (data.type === "checkin" && peer.role === "visitor") {
      const day = dayKey(now);
      this.ctx.storage.sql.exec(
        "UPDATE visitors SET days=days+CASE WHEN last_day<>? THEN 1 ELSE 0 END,last_day=?,last_seen=? WHERE id=?",
        day,
        day,
        now,
        peer.identity,
      );
      this.send(ws, { type: "profile", profile: this.profile(peer.identity) });
    } else if (data.type === "vote" && peer.role === "visitor") {
      this.send(ws, {
        type: "error",
        message: "Voting is closed. This edition only makes ASCII art.",
      });
      return;
    } else if (data.type === "audit_done" && peer.role === "visitor") {
      const a = peer.audit;
      if (
        a &&
        a.id === data.id &&
        now <= a.deadline &&
        data.correct === scoreAnswers(a.answers, a.expected)
      ) {
        const seen = this.ctx.storage.sql
          .exec(
            "SELECT 1 FROM audit_checks WHERE identity=? AND trial=?",
            peer.identity,
            a.trialId,
          )
          .toArray().length;
        if (!seen) {
          this.ctx.storage.sql.exec(
            "INSERT INTO audit_checks (identity,trial,at) VALUES (?,?,?)",
            peer.identity,
            a.trialId,
            now,
          );
          const row = this.ctx.storage.sql
            .exec<{
              value: string;
            }>("SELECT value FROM trials WHERE id=?", a.trialId)
            .toArray()[0];
          if (row) {
            const trial = JSON.parse(row.value) as MemoryTrial;
            trial.checked++;
            this.ctx.storage.sql.exec(
              "UPDATE trials SET value=? WHERE id=?",
              JSON.stringify(trial),
              trial.id,
            );
          }
          this.state.totalChecks++;
          this.ctx.storage.sql.exec(
            "UPDATE visitors SET checks=checks+1,last_seen=? WHERE id=?",
            now,
            peer.identity,
          );
          this.send(ws, {
            type: "profile",
            profile: this.profile(peer.identity),
          });
        }
      }
      peer.audit = null;
    } else if (["chunk", "done", "failed"].includes(String(data.type))) {
      const job = this.state.active.find(
        (a) => a.peerId === peer.id && a.task.id === data.jobId,
      );
      if (!job || now > job.deadline) return;
      if (data.type === "chunk") {
        if (typeof data.text !== "string" || data.text.length > 1000) return;
        if (job.text.length + data.text.length > MAX_THOUGHT_CHARS) {
          this.fail(job, "Output limit reached");
          this.send(ws, { type: "cancel", jobId: job.task.id });
          peer.availableAt = now + 15000;
        } else job.text += data.text;
      } else if (data.type === "done") {
        const art = inspectArt(job.text);
        if (job.task.kind !== "art" || !art.ok) {
          this.fail(
            job,
            "The sketch did not fit the canvas rules; trying another drawing.",
          );
          peer.availableAt = now + 1000;
          ws.serializeAttachment(peer);
          this.save();
          await this.tick();
          return;
        }
        this.state.active = this.state.active.filter(
          (a) => a.task.id !== job.task.id,
        );
        const duration = Math.min(120000, Math.max(1, now - job.startedAt));
        const tokens =
          typeof data.tokens === "number" && Number.isFinite(data.tokens)
            ? Math.min(job.task.maxTokens, Math.max(0, Math.floor(data.tokens)))
            : 0;
        this.state.totalComputeMs +=
          job.source === "browser" ? job.computeMs || 0 : duration;
        this.state.totalTokens += tokens;
        this.state.totalThoughts++;
        if (peer.role === "visitor") {
          peer.availableAt = now + 1000;
          const holders = this.pipelines().find(
            (g) => g.group === peer.piece?.group,
          )?.members || [{ ws, peer }];
          const credited = new Set<string>();
          for (const holder of holders) {
            if (!credited.has(holder.peer.identity)) {
              this.ctx.storage.sql.exec(
                "UPDATE visitors SET jobs=jobs+1,last_seen=? WHERE id=?",
                now,
                holder.peer.identity,
              );
              credited.add(holder.peer.identity);
            }
            this.send(holder.ws, {
              type: "profile",
              profile: this.profile(holder.peer.identity),
            });
          }
        }
        this.complete(job, tokens, duration);
      } else {
        this.fail(job, "A helper couldn't finish; the work will be retried.");
        peer.availableAt = now + 15000;
      }
    } else {
      this.send(ws, {
        type: "error",
        message:
          "This installation accepts assigned work, not visitor prompts or votes.",
      });
      return;
    }
    ws.serializeAttachment(peer);
    if (!peer.visible) {
      if (this.mode() === "browser") this.releasePiece(peer);
      else this.cancelPeer(peer.id);
      ws.serializeAttachment(peer);
    }
    this.save();
    if (data.type === "chunk") this.broadcast(false);
    else await this.tick();
  }
  private task(
    kind: TaskKind,
    messages: ChatMessage[],
    title: string,
    extra: Partial<Task> = {},
  ): Task {
    return {
      id: crypto.randomUUID(),
      kind,
      messages,
      title,
      maxTokens:
        kind === "art"
          ? ART_MAX_TOKENS
          : kind === "pack"
            ? 140
            : kind === "recall"
              ? 60
              : 110,
      projectId: this.state.project?.id || "",
      attempts: 0,
      ...extra,
    };
  }
  private complete(job: Active, tokens: number, durationMs: number) {
    const t = job.task;
    if (t.kind !== "art") return;
    const checked = inspectArt(job.text);
    if (!checked.ok) return;
    const now = Date.now();
    const artwork: Artwork = {
      id: t.id,
      title: t.title,
      text: checked.text,
      at: now,
      source: job.source,
      projectId: t.projectId,
      model:
        this.mode() === "browser"
          ? `${CURRENT_MODEL.label} · q4`
          : "Qwen 2.5 · 0.5B",
    };
    this.ctx.storage.sql.exec(
      "INSERT INTO artworks (id,value,at) VALUES (?,?,?)",
      artwork.id,
      JSON.stringify(artwork),
      now,
    );
    if (this.state.project) this.state.project.completed++;
    this.event(
      "art",
      "A new ASCII drawing arrived in the collection.",
      job.source,
    );
  }
  private finishProject() {
    if (this.state.project) {
      this.state.project.status = "finished";
      this.state.projects.push({ ...this.state.project });
      this.state.projects = this.state.projects.slice(-20);
    }
    this.state.nextThoughtAt = Date.now() + 20000;
  }
  private fail(job: Active, reason: string) {
    this.state.active = this.state.active.filter(
      (a) => a.task.id !== job.task.id,
    );
    if (job.task.attempts < 2)
      this.state.queue.unshift({
        ...job.task,
        attempts: job.task.attempts + 1,
        id: crypto.randomUUID(),
      });
    else {
      this.event(
        "pause",
        "A task was set aside after three unsuccessful attempts.",
      );
    }
    this.event("pause", reason);
    this.state.nextThoughtAt = Date.now() + 3000;
    this.save();
  }
  private cancelPeer(id: string) {
    for (const a of this.state.active.filter((a) => a.peerId === id)) {
      const owner = this.peers().find((p) => p.peer.id === id);
      if (owner) this.send(owner.ws, { type: "cancel", jobId: a.task.id });
      this.state.active = this.state.active.filter(
        (j) => j.task.id !== a.task.id,
      );
      this.state.queue.unshift({ ...a.task, id: crypto.randomUUID() });
      this.event(
        "pause",
        "A helper left. Its unfinished task is waiting for another browser.",
      );
    }
    this.save();
  }
  async webSocketClose(ws: WebSocket): Promise<void> {
    const p = ws.deserializeAttachment() as Peer | null;
    try {
      ws.close(1000, "Goodbye");
    } catch {
      /*closed*/
    }
    if (p) {
      if (this.mode() === "browser") this.releasePiece(p);
      this.cancelPeer(p.id);
    }
    await this.tick();
  }
  async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }
  async alarm(): Promise<void> {
    await this.tick();
  }
  private async tick(): Promise<void> {
    this.enterArtEdition();
    const now = Date.now();
    for (const { ws, peer } of this.peers())
      if (now - peer.seen > 45000) {
        if (this.mode() === "browser") this.releasePiece(peer);
        this.cancelPeer(peer.id);
        ws.close(1001, "Connection timed out");
      }
    for (const p of this.peers())
      if (p.peer.samplePending && now > p.peer.samplePending.deadline) {
        delete p.peer.samplePending;
        p.ws.serializeAttachment(p.peer);
      }
    const peers = this.peers().filter((p) => now - p.peer.seen <= 45000);
    const visitors = peers.filter(
      (p) => p.peer.role === "visitor" && p.peer.visible,
    );
    for (const a of [...this.state.active])
      if (now > a.deadline) {
        const p = peers.find((p) => p.peer.id === a.peerId);
        if (p) this.send(p.ws, { type: "cancel", jobId: a.task.id });
        this.fail(a, "A helper timed out. Its task is waiting.");
      }
    for (const a of [...this.state.active])
      if (!visitors.length || !peers.some((p) => p.peer.id === a.peerId))
        this.cancelPeer(a.peerId);
    const day = dayKey(now);
    if (this.state.cleanedDay !== day) {
      this.ctx.storage.sql.exec(
        "DELETE FROM visitors WHERE last_seen<?",
        now - 90 * 86400_000,
      );
      this.ctx.storage.sql.exec(
        "DELETE FROM audit_checks WHERE at<?",
        now - 30 * 86400_000,
      );
      this.state.cleanedDay = day;
    }
    if (
      visitors.length &&
      !this.state.active.length &&
      !this.state.queue.length &&
      this.state.project?.status === "working"
    ) {
      this.finishProject();
    }

    const busy = new Set(this.state.active.map((a) => a.peerId));
    const leaders = new Set(
      this.pipelines()
        .filter((g) => g.ready)
        .map((g) => g.members[0].peer.id),
    );
    const workers = peers
      .filter(
        (p) =>
          p.peer.ready &&
          p.peer.availableAt <= now &&
          !busy.has(p.peer.id) &&
          (this.mode() === "mac"
            ? p.peer.role === "bridge"
            : (p.peer.role === "visitor" &&
                p.peer.visible &&
                leaders.has(p.peer.id)) ||
              (p.peer.role === "bridge" &&
                this.state.launchSupport !== false &&
                leaders.size === 0)),
      )
      .sort((a, b) => a.peer.availableAt - b.peer.availableAt);
    if (
      visitors.length &&
      workers.length &&
      !this.state.queue.length &&
      !this.state.active.length &&
      (!this.state.project || this.state.project.status === "finished") &&
      now >= this.state.nextThoughtAt
    ) {
      const focus = "a free drawing";
      const number = this.ctx.storage.sql
        .exec<{ n: number }>("SELECT COUNT(*) AS n FROM artworks")
        .one().n;
      const count = Math.max(1, Math.min(MAX_HELPERS, workers.length));
      this.state.project = {
        id: crypto.randomUUID(),
        kind: "art",
        title: focus,
        focus,
        helpers: count,
        at: now,
        completed: 0,
        total: count,
        status: "working",
      };
      for (let i = 0; i < count; i++)
        this.state.queue.push(
          this.task(
            "art",
            artMessages(this.mode(), this.state.project, i + 1),
            `Sketch ${number + i + 1} · ${focus}`,
          ),
        );
    }
    if (visitors.length && now >= this.state.nextThoughtAt)
      for (const worker of workers) {
        if (this.state.active.length >= MAX_HELPERS) break;
        const task = this.state.queue.shift();
        if (!task) break;
        this.state.active.push({
          task,
          peerId: worker.peer.id,
          text: "",
          startedAt: now,
          deadline: now + (worker.peer.role === "bridge" ? 90000 : 600000),
          source: worker.peer.role === "bridge" ? "mac" : "browser",
        });
        this.save();
        this.send(worker.ws, {
          type: "job",
          job: {
            id: task.id,
            pieces:
              worker.peer.role === "visitor"
                ? this.pipelines()
                    .find((g) => g.group === worker.peer.piece?.group)
                    ?.members.map((p) => ({
                      start: p.peer.piece!.start,
                      end: p.peer.piece!.end,
                    }))
                : undefined,
            kind: task.kind,
            messages: task.messages,
            maxTokens: task.maxTokens,
            temperature: 0.8,
          },
        });
      }
    this.save();
    this.broadcast();
    if (peers.length) await this.ctx.storage.setAlarm(now + 5000);
    else await this.ctx.storage.deleteAlarm();
  }
}
