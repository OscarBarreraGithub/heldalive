import { DurableObject } from "cloudflare:workers";
import { timingSafeEqual } from "node:crypto";
import {
  cleanThought,
  cooldownMs,
  dutyLimit,
  isAllowedOrigin,
  LOCAL_MODEL,
  MAX_THOUGHT_CHARS,
  MAX_WHISPER_CHARS,
} from "../shared/protocol";
import type { Mode, Snapshot, Thought } from "../shared/protocol";
import { makeMessages } from "../shared/personality";
import { modelAssetUrl } from "../shared/modelAssets";

type Peer = {
  id: string;
  role: "visitor" | "bridge";
  ip: string;
  seen: number;
  visible: boolean;
  ready: boolean;
  duty: number;
  availableAt: number;
  lastWhisper: number;
  lastMessage: number;
  burst: number;
};
type Active = {
  id: string;
  peerId: string;
  text: string;
  startedAt: number;
  deadline: number;
};
type Stored = {
  room: string;
  bornAt: number;
  thoughts: Thought[];
  totalTokens: number;
  totalComputeMs: number;
  totalThoughts: number;
  nextThoughtAt: number;
  active: Active | null;
  notes: string[];
};

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
      if (!["/api/socket", "/api/state", "/api/health"].includes(url.pathname))
        return new Response("Not found", { status: 404 });
      const room =
        url.searchParams.get("room") === "browser" ? "browser" : "main";
      if (url.pathname === "/api/socket") {
        if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket")
          return new Response("WebSocket required", { status: 426 });
        const bridge = url.searchParams.get("role") === "bridge";
        if (bridge) {
          if (
            room !== "main" ||
            !(await validSecret(
              request.headers.get("Authorization"),
              env.BRIDGE_TOKEN,
            ))
          )
            return new Response("Unauthorized", { status: 401 });
        } else if (!isAllowedOrigin(request.headers.get("Origin"), url))
          return new Response("Origin not allowed", { status: 403 });
      } else if (request.method !== "GET")
        return new Response("Method not allowed", { status: 405 });
      return env.ROOMS.getByName(room).fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

async function validSecret(
  header: string | null,
  secret: string | undefined,
): Promise<boolean> {
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(header.slice(7))),
    crypto.subtle.digest("SHA-256", encoder.encode(secret)),
  ]);
  return timingSafeEqual(new Uint8Array(a), new Uint8Array(b));
}

export class LivingRoom extends DurableObject<Env> {
  private state: Stored;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS installation (id INTEGER PRIMARY KEY, value TEXT NOT NULL)",
    );
    const row = this.ctx.storage.sql
      .exec<{ value: string }>("SELECT value FROM installation WHERE id=1")
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
          nextThoughtAt: 0,
          active: null,
          notes: [],
        };
  }
  private save() {
    this.ctx.storage.sql.exec(
      "INSERT INTO installation (id,value) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value",
      JSON.stringify(this.state),
    );
  }
  private mode(): Mode {
    return this.state.room === "browser" ? "browser" : "mac";
  }
  private peers(): { ws: WebSocket; peer: Peer }[] {
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
        /* Already closed. */
      }
    }
  }
  private snapshot(): Snapshot {
    const now = Date.now();
    const peers = this.peers().filter((p) => now - p.peer.seen < 45_000);
    const visitors = peers.filter((p) => p.peer.role === "visitor");
    const workers = peers.filter((p) =>
      this.mode() === "mac"
        ? p.peer.role === "bridge" && p.peer.ready
        : p.peer.role === "visitor" && p.peer.ready && p.peer.visible,
    );
    const ready = workers.filter((p) => p.peer.availableAt <= now);
    return {
      type: "state",
      room: this.state.room,
      mode: this.mode(),
      phase:
        visitors.length === 0
          ? "sleeping"
          : this.state.active
            ? "thinking"
            : workers.length === 0
              ? "waiting"
              : "resting",
      viewers: visitors.length,
      contributors: this.mode() === "browser" ? workers.length : 0,
      readyContributors: ready.length,
      model: "Qwen 2.5 · 0.5B",
      modelAvailable: workers.length > 0,
      thoughts: this.state.thoughts,
      active: this.state.active && {
        id: this.state.active.id,
        text: this.state.active.text,
        startedAt: this.state.active.startedAt,
      },
      totalTokens: this.state.totalTokens,
      totalComputeMs: this.state.totalComputeMs,
      totalThoughts: this.state.totalThoughts,
      bornAt: this.state.bornAt,
      nextThoughtAt: this.state.nextThoughtAt,
      serverTime: now,
    };
  }
  private broadcast() {
    const snapshot = this.snapshot();
    for (const { ws, peer } of this.peers())
      if (peer.role === "visitor") this.send(ws, snapshot);
  }
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    this.state.room =
      url.searchParams.get("room") === "browser" ? "browser" : "main";
    if (url.pathname === "/api/health")
      return Response.json(
        {
          ok: true,
          mode: this.mode(),
          modelAvailable: this.snapshot().modelAvailable,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    if (url.pathname === "/api/state")
      return Response.json(this.snapshot(), {
        headers: { "Cache-Control": "no-store" },
      });
    const role =
      url.searchParams.get("role") === "bridge" ? "bridge" : "visitor";
    const ip = request.headers.get("CF-Connecting-IP") || "local";
    const existing = this.peers();
    if (
      role === "visitor" &&
      (existing.length >= 250 ||
        existing.filter((p) => p.peer.ip === ip).length >= 12)
    )
      return new Response("The room is full. Please try again shortly.", {
        status: 429,
      });
    if (role === "bridge")
      for (const { ws, peer } of existing)
        if (peer.role === "bridge") ws.close(1000, "Bridge replaced");
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    const peer: Peer = {
      id: crypto.randomUUID(),
      role,
      ip,
      seen: Date.now(),
      visible: true,
      ready: false,
      duty: 0.05,
      availableAt: 0,
      lastWhisper: 0,
      lastMessage: 0,
      burst: 0,
    };
    server.serializeAttachment(peer);
    this.send(server, { type: "hello", clientId: peer.id });
    if (role === "visitor") this.send(server, this.snapshot());
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
      data = JSON.parse(raw) as Record<string, unknown>;
      if (!data || typeof data !== "object") throw new Error("bad message");
    } catch {
      this.send(ws, {
        type: "error",
        message: "That message could not be read.",
      });
      return;
    }
    const peer = ws.deserializeAttachment() as Peer;
    const now = Date.now();
    if (now - peer.lastMessage < 1000) peer.burst += 1;
    else {
      peer.lastMessage = now;
      peer.burst = 1;
    }
    if (peer.burst > 120) {
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
          message: "Browser compute belongs in the browser study.",
        });
        return;
      }
      peer.ready = data.ready === true;
      peer.visible = data.visible !== false;
      peer.duty = dutyLimit(data.duty);
      if (!peer.ready && this.state.active?.peerId === peer.id) this.cancel();
    } else if (data.type === "whisper") {
      if (peer.role !== "visitor" || typeof data.text !== "string") return;
      const text = data.text.trim();
      if (!text || text.length > MAX_WHISPER_CHARS) {
        this.send(ws, {
          type: "error",
          message: "Leave a note of 180 characters or fewer.",
        });
        return;
      }
      if (now - peer.lastWhisper < 30_000 || this.state.notes.length >= 3) {
        this.send(ws, {
          type: "error",
          message: "Give this thought a little room. Try again in a moment.",
        });
        return;
      }
      peer.lastWhisper = now;
      this.state.notes.push(text);
      this.state.nextThoughtAt = Math.min(this.state.nextThoughtAt, now + 1500);
      this.save();
      this.send(ws, { type: "accepted" });
    } else if (["chunk", "done", "failed"].includes(String(data.type))) {
      const job = this.state.active;
      if (!job || job.peerId !== peer.id || data.jobId !== job.id) return;
      if (data.type === "chunk") {
        if (typeof data.text !== "string" || data.text.length > 500) return;
        job.text = (job.text + data.text).slice(0, MAX_THOUGHT_CHARS);
        this.save();
        this.broadcast();
        if (job.text.length >= MAX_THOUGHT_CHARS)
          this.send(ws, { type: "cancel", jobId: job.id });
      } else if (data.type === "done") {
        const text = cleanThought(job.text);
        const durationMs = Math.min(120_000, Math.max(1, now - job.startedAt));
        const tokens =
          typeof data.tokens === "number" && Number.isFinite(data.tokens)
            ? Math.min(160, Math.max(0, Math.floor(data.tokens)))
            : 0;
        if (text) {
          this.state.thoughts.push({
            id: job.id,
            text,
            at: now,
            source: this.mode(),
            tokens,
            durationMs,
          });
          this.state.thoughts = this.state.thoughts.slice(-60);
          this.state.totalThoughts += 1;
          this.state.totalTokens += tokens;
          this.state.totalComputeMs += durationMs;
        }
        if (peer.role === "visitor")
          peer.availableAt = now + cooldownMs(durationMs, peer.duty);
        this.state.active = null;
        this.state.nextThoughtAt =
          now + (this.state.notes.length ? 5000 : 30_000);
        this.save();
      } else {
        peer.availableAt = now + 15_000;
        this.state.active = null;
        this.state.nextThoughtAt = now + 3000;
        this.save();
      }
    }
    ws.serializeAttachment(peer);
    if (!peer.visible && this.state.active?.peerId === peer.id) this.cancel();
    if (data.type !== "chunk") await this.tick();
  }
  private cancel() {
    const job = this.state.active;
    if (!job) return;
    const owner = this.peers().find((p) => p.peer.id === job.peerId);
    if (owner) this.send(owner.ws, { type: "cancel", jobId: job.id });
    this.state.active = null;
    this.state.nextThoughtAt = Date.now() + 3000;
    this.save();
  }
  async webSocketClose(ws: WebSocket): Promise<void> {
    const peer = ws.deserializeAttachment() as Peer | null;
    try {
      ws.close(1000, "Goodbye");
    } catch {
      /* Closed by browser. */
    }
    if (peer && this.state.active?.peerId === peer.id) this.cancel();
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
      if (now - peer.seen > 45_000) ws.close(1001, "Connection timed out");
    const peers = this.peers().filter((p) => now - p.peer.seen <= 45_000);
    const visitors = peers.filter(
      (p) => p.peer.role === "visitor" && p.peer.visible,
    );
    if (
      this.state.active &&
      (!visitors.length ||
        this.state.active.deadline < now ||
        !peers.some((p) => p.peer.id === this.state.active?.peerId))
    )
      this.cancel();
    if (
      !this.state.active &&
      visitors.length &&
      now >= this.state.nextThoughtAt
    ) {
      const worker = peers
        .filter(
          (p) =>
            p.peer.ready &&
            p.peer.availableAt <= now &&
            (this.mode() === "mac"
              ? p.peer.role === "bridge"
              : p.peer.role === "visitor" && p.peer.visible),
        )
        .sort((a, b) => a.peer.availableAt - b.peer.availableAt)[0];
      if (worker) {
        const id = crypto.randomUUID();
        const messages = makeMessages(
          this.mode(),
          visitors.length,
          this.state.thoughts,
          this.state.notes.shift(),
          this.state.totalThoughts,
        );
        this.state.active = {
          id,
          peerId: worker.peer.id,
          text: "",
          startedAt: now,
          deadline: now + 90_000,
        };
        this.save();
        this.send(worker.ws, {
          type: "job",
          job: { id, messages, maxTokens: 90 },
        });
      }
    }
    this.broadcast();
    if (peers.length) await this.ctx.storage.setAlarm(now + 5000);
    else await this.ctx.storage.deleteAlarm();
  }
}
