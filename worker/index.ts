import { DurableObject } from "cloudflare:workers";
import { timingSafeEqual } from "node:crypto";
import {
  cleanThought,
  cooldownMs,
  dayKey,
  dutyLimit,
  isAllowedOrigin,
  isProjectKind,
  MAX_HELPERS,
  MAX_THOUGHT_CHARS,
  MEMORY_BUDGET,
  plainArt,
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
} from "../shared/protocol";
import {
  artMessages,
  packMessages,
  planMessages,
  recallMessages,
  reflectionMessages,
  wanderMessages,
} from "../shared/personality";
import {
  makeMemoryCase,
  parseAnswers,
  parsePlan,
  scoreAnswers,
  STRATEGIES,
  validAnswerResponse,
} from "../shared/experiments";
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
};
type Active = {
  task: Task;
  peerId: string;
  text: string;
  startedAt: number;
  deadline: number;
  source: Mode;
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
          "/api/identity",
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
      if (url.pathname === "/api/socket") {
        if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket")
          return new Response("WebSocket required", { status: 426 });
        const bridge = url.searchParams.get("role") === "bridge";
        if (bridge) {
          if (
            room !== "main" ||
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
        };
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
  private votes(): Record<ProjectKind, number> {
    const votes = { art: 0, memory: 0, wander: 0 };
    for (const row of this.ctx.storage.sql.exec<{ choice: string; n: number }>(
      "SELECT choice,COUNT(*) AS n FROM visitors WHERE choice_day=? GROUP BY choice",
      dayKey(Date.now()),
    ))
      if (isProjectKind(row.choice)) votes[row.choice] = row.n;
    return votes;
  }
  private profile(id: string): Profile {
    const p = this.ctx.storage.sql
      .exec<VisitorRow>("SELECT * FROM visitors WHERE id=?", id)
      .toArray()[0];
    const today = dayKey(Date.now());
    return {
      days: p?.days || 0,
      today: p?.last_day === today,
      choice:
        p?.choice_day === today && isProjectKind(p.choice) ? p.choice : null,
      completedJobs: p?.jobs || 0,
      checks: p?.checks || 0,
    };
  }
  private recent<T>(
    table: "artworks" | "trials",
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
    const busy = new Set(this.state.active.map((a) => a.peerId));
    const active =
      this.state.active.find(
        (a) => a.task.kind === "reflect" || a.task.kind === "wander",
      ) || this.state.active[0];
    return {
      type: "state",
      version: 2,
      room: this.state.room,
      mode: this.mode(),
      phase: !visitors.length
        ? "sleeping"
        : this.state.active.length
          ? "thinking"
          : !workers.length
            ? "waiting"
            : "resting",
      viewers: visitors.length,
      contributors: this.mode() === "browser" ? workers.length : 0,
      readyContributors: workers.filter(
        (p) => p.peer.availableAt <= now && !busy.has(p.peer.id),
      ).length,
      model: "Qwen 2.5 · 0.5B",
      modelAvailable: workers.length > 0,
      thoughts: this.state.thoughts.slice(-12),
      active: active
        ? {
            id: active.task.id,
            text: ["reflect", "wander"].includes(active.task.kind)
              ? active.text
              : "",
            startedAt: active.startedAt,
            kind: active.task.kind,
          }
        : null,
      agents: this.state.active.map((a) => ({
        id: a.task.id,
        role:
          a.task.kind === "plan" || a.task.kind === "reflect"
            ? "Held"
            : "Helper",
        kind: a.task.kind,
        startedAt: a.startedAt,
        source: a.source,
      })),
      project: this.state.project,
      projects: this.state.projects.slice(-8),
      queueLength: this.state.queue.length,
      activity: this.state.activity.slice(-12),
      artworks: this.recent<Artwork>("artworks", 6),
      artworkCount: this.ctx.storage.sql
        .exec<{ n: number }>("SELECT COUNT(*) AS n FROM artworks")
        .one().n,
      trials: this.recent<MemoryTrial>("trials", 6),
      memoryScores: this.state.scores,
      journal: this.state.journal,
      votes: this.votes(),
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
    const url = new URL(request.url);
    this.state.room =
      url.searchParams.get("room") === "browser" ? "browser" : "main";
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
        existing.filter((p) => p.peer.ip === ip).length >= 12 ||
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
    if (typeof raw !== "string" || raw.length > 8192) {
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
    if (peer.burst > 180) {
      this.cancelPeer(peer.id);
      ws.close(1008, "Too many messages");
      return;
    }
    peer.seen = now;
    if (data.type === "ping") {
      if (peer.role === "visitor") peer.visible = data.visible !== false;
      this.send(ws, { type: "pong" });
    } else if (data.type === "ready") {
      if (peer.role === "visitor" && this.mode() !== "browser") {
        this.send(ws, {
          type: "error",
          message:
            "The studio uses the artist's Mac. Open the live habitat to lend browser compute.",
        });
        return;
      }
      peer.ready = data.ready === true;
      peer.visible = data.visible !== false;
      peer.duty = dutyLimit(data.duty);
      if (!peer.ready) this.cancelPeer(peer.id);
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
      if (!isProjectKind(data.choice)) {
        this.send(ws, {
          type: "error",
          message: "Choose one of the three daily paths.",
        });
        return;
      }
      const day = dayKey(now);
      this.ctx.storage.sql.exec(
        "UPDATE visitors SET choice=?,choice_day=?,days=days+CASE WHEN last_day<>? THEN 1 ELSE 0 END,last_day=?,last_seen=? WHERE id=? AND choice_day<>?",
        data.choice,
        day,
        day,
        day,
        now,
        peer.identity,
        day,
      );
      this.send(ws, { type: "profile", profile: this.profile(peer.identity) });
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
        this.state.active = this.state.active.filter(
          (a) => a.task.id !== job.task.id,
        );
        const duration = Math.min(120000, Math.max(1, now - job.startedAt));
        const tokens =
          typeof data.tokens === "number" && Number.isFinite(data.tokens)
            ? Math.min(job.task.maxTokens, Math.max(0, Math.floor(data.tokens)))
            : 0;
        this.state.totalComputeMs += duration;
        this.state.totalTokens += tokens;
        this.state.totalThoughts++;
        if (peer.role === "visitor") {
          peer.availableAt = now + cooldownMs(duration, peer.duty);
          this.ctx.storage.sql.exec(
            "UPDATE visitors SET jobs=jobs+1,last_seen=? WHERE id=?",
            now,
            peer.identity,
          );
          this.send(ws, {
            type: "profile",
            profile: this.profile(peer.identity),
          });
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
          "Held accepts fixed choices and assigned work, not visitor messages.",
      });
      return;
    }
    ws.serializeAttachment(peer);
    if (!peer.visible) this.cancelPeer(peer.id);
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
          ? 180
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
    const text = cleanThought(job.text);
    const now = Date.now();
    if (t.kind === "plan") {
      const plan = parsePlan(text);
      if (!plan) {
        this.event(
          "retry",
          "Held's plan was unreadable. Giving it a free-time turn.",
          job.source,
        );
        const p: Project = {
          id: crypto.randomUUID(),
          kind: "wander",
          title: "A little free time",
          focus: "A little free time",
          helpers: 1,
          at: now,
          completed: 0,
          total: 2,
          status: "working",
        };
        this.state.project = p;
        this.state.results = [];
        this.state.queue.push(
          this.task(
            "wander",
            wanderMessages(this.mode(), this.state.journal),
            p.title,
          ),
        );
        return;
      }
      const p: Project = {
        id: crypto.randomUUID(),
        kind: plan.kind,
        title: plan.focus,
        focus: plan.focus,
        helpers:
          plan.kind === "memory"
            ? 3
            : plan.kind === "wander"
              ? 1
              : plan.helpers,
        at: now,
        completed: 0,
        total:
          plan.kind === "memory"
            ? 7
            : plan.kind === "wander"
              ? 2
              : plan.helpers + 1,
        status: "working",
      };
      this.state.project = p;
      this.state.results = [];
      this.event(
        "plan",
        `Held chose ${p.kind === "art" ? "to draw" : p.kind === "memory" ? "a memory experiment" : "some free time"}: ${p.focus}`,
        job.source,
      );
      if (p.kind === "art")
        for (let i = 0; i < p.helpers; i++)
          this.state.queue.push(
            this.task(
              "art",
              artMessages(this.mode(), p, i + 1),
              `Drawing · helper ${i + 1}`,
            ),
          );
      if (p.kind === "wander")
        this.state.queue.push(
          this.task(
            "wander",
            wanderMessages(this.mode(), this.state.journal),
            "Free time",
          ),
        );
      if (p.kind === "memory") {
        const data = makeMemoryCase(
          crypto.getRandomValues(new Uint32Array(1))[0] % 1200,
        );
        for (const strategy of STRATEGIES)
          this.state.queue.push(
            this.task(
              "pack",
              packMessages(this.mode(), data, strategy),
              `Writing ${strategy}`,
              { strategy, memoryCase: data },
            ),
          );
      }
      return;
    }
    if (t.kind === "art" && text) {
      const artwork: Artwork = {
        id: t.id,
        title: this.state.project?.title || "A little drawing",
        text: plainArt(job.text),
        at: now,
        source: job.source,
        projectId: t.projectId,
        model: "Qwen 2.5 · 0.5B",
      };
      this.ctx.storage.sql.exec(
        "INSERT INTO artworks (id,value,at) VALUES (?,?,?)",
        artwork.id,
        JSON.stringify(artwork),
        now,
      );
      this.state.results.push(`A drawing: ${artwork.text}`);
      this.event("art", "A new drawing arrived in the collection.", job.source);
    } else if (t.kind === "pack" && t.memoryCase && t.strategy) {
      const memory = text.slice(0, MEMORY_BUDGET);
      this.state.queue.push(
        this.task(
          "recall",
          recallMessages(this.mode(), memory, t.memoryCase.questions),
          `Recalling from ${t.strategy}`,
          {
            strategy: t.strategy,
            memoryCase: t.memoryCase,
            memory,
            truncated: text.length > MEMORY_BUDGET,
          },
        ),
      );
      this.event(
        "memory",
        `A helper packed ${t.strategy} into ${memory.length} characters.`,
        job.source,
      );
    } else if (t.kind === "recall" && t.memoryCase && t.strategy) {
      const answers = parseAnswers(text);
      const correct = scoreAnswers(answers, t.memoryCase.expected);
      const trial: MemoryTrial = {
        id: t.id,
        strategy: t.strategy,
        memory: t.memory || "",
        answers,
        expected: t.memoryCase.expected,
        correct,
        total: 3,
        at: now,
        source: job.source,
        checked: 0,
        truncated: Boolean(t.truncated),
        responseValid: validAnswerResponse(text),
        response: text,
        questions: t.memoryCase.questions,
        record: t.memoryCase.facts,
        projectId: t.projectId,
      };
      this.ctx.storage.sql.exec(
        "INSERT INTO trials (id,value,at) VALUES (?,?,?)",
        trial.id,
        JSON.stringify(trial),
        now,
      );
      const score = this.state.scores[t.strategy];
      score.correct += correct;
      score.total += 3;
      score.trials++;
      this.state.results.push(
        `${t.strategy}: ${correct}/3 exactly recalled${trial.responseValid ? "" : " (invalid response format)"}, ${trial.memory.length} characters${trial.truncated ? ", truncated to budget" : ""}.`,
      );
      this.event(
        "memory",
        trial.responseValid
          ? `${t.strategy}: ${correct} of 3 objects remembered.`
          : `${t.strategy}: response format failed; scored 0 of 3.`,
        job.source,
      );
    } else if ((t.kind === "reflect" || t.kind === "wander") && text) {
      this.state.thoughts.push({
        id: t.id,
        text,
        at: now,
        source: job.source,
        tokens,
        durationMs,
        kind: t.kind,
      });
      this.state.thoughts = this.state.thoughts.slice(-60);
      this.state.journal = text.slice(0, 600);
      this.state.results.push(text);
      this.event(
        t.kind,
        t.kind === "reflect"
          ? "Held wrote a new journal entry."
          : "Held took a moment to follow its own curiosity.",
        job.source,
      );
    }
    if (this.state.project) this.state.project.completed++;
    if (t.kind === "reflect") this.finishProject();
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
      if (job.task.kind === "reflect") this.finishProject();
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
    if (p) this.cancelPeer(p.id);
    await this.tick();
  }
  async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }
  async alarm(): Promise<void> {
    await this.tick();
  }
  private async tick(): Promise<void> {
    const now = Date.now();
    for (const { ws, peer } of this.peers())
      if (now - peer.seen > 45000) {
        this.cancelPeer(peer.id);
        ws.close(1001, "Connection timed out");
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
      this.state.project.status = "reflecting";
      this.state.queue.push(
        this.task(
          "reflect",
          reflectionMessages(
            this.mode(),
            this.state.project,
            this.state.results,
          ),
          "Writing in the journal",
        ),
      );
    }
    const busy = new Set(this.state.active.map((a) => a.peerId));
    const workers = peers
      .filter(
        (p) =>
          p.peer.ready &&
          p.peer.availableAt <= now &&
          !busy.has(p.peer.id) &&
          (this.mode() === "mac"
            ? p.peer.role === "bridge"
            : p.peer.role === "visitor" && p.peer.visible),
      )
      .sort((a, b) => a.peer.availableAt - b.peer.availableAt);
    if (
      visitors.length &&
      workers.length &&
      !this.state.queue.length &&
      !this.state.active.length &&
      (!this.state.project || this.state.project.status === "finished") &&
      now >= this.state.nextThoughtAt
    )
      this.state.queue.push(
        this.task(
          "plan",
          planMessages(
            this.mode(),
            this.state.journal,
            this.votes(),
            this.state.project?.kind,
          ),
          "Choosing the next project",
          { projectId: "" },
        ),
      );
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
          deadline: now + 90000,
          source: worker.peer.role === "bridge" ? "mac" : "browser",
        });
        this.save();
        this.send(worker.ws, {
          type: "job",
          job: {
            id: task.id,
            kind: task.kind,
            messages: task.messages,
            maxTokens: task.maxTokens,
            temperature:
              task.kind === "recall" ? 0.1 : task.kind === "plan" ? 0.65 : 0.85,
          },
        });
      }
    const trials = this.recent<MemoryTrial>("trials", 6);
    for (const { ws, peer } of visitors)
      if (
        peer.checks &&
        now >= peer.nextAuditAt &&
        (!peer.audit || now > peer.audit.deadline)
      ) {
        const trial = trials.find(
          (t) =>
            t.checked < 3 &&
            !this.ctx.storage.sql
              .exec(
                "SELECT 1 FROM audit_checks WHERE identity=? AND trial=?",
                peer.identity,
                t.id,
              )
              .toArray().length,
        );
        if (trial) {
          peer.audit = {
            id: crypto.randomUUID(),
            trialId: trial.id,
            answers: trial.answers,
            expected: trial.expected,
            deadline: now + 30000,
          };
          peer.nextAuditAt = now + 30000;
          ws.serializeAttachment(peer);
          this.send(ws, {
            type: "audit",
            job: {
              id: peer.audit.id,
              trialId: trial.id,
              answers: trial.answers,
              expected: trial.expected,
            },
          });
        }
      }
    this.save();
    this.broadcast();
    if (peers.length) await this.ctx.storage.setAlarm(now + 5000);
    else await this.ctx.storage.deleteAlarm();
  }
}
