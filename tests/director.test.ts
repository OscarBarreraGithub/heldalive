import { describe, it, expect, vi, afterEach } from "vitest";
import {
  Director,
  type DirectorStore,
  type DirectorState,
  type Publication,
} from "../../heldalive-runtime/cloud/director";
import {
  nextRole,
  parseAnswer,
  type Instance,
  type Answer,
} from "../../heldalive-runtime/cloud/roles";
import { validateFiles } from "../../heldalive-runtime/cloud/github";
import { collect } from "../../heldalive-runtime/cloud/evidence";
import type { MuralTile, ResearchRun } from "../shared/observatory";
class MemoryStore implements DirectorStore {
  state?: DirectorState;
  records: Instance[] = [];
  runs: ResearchRun[] = [];
  queue: Publication[] = [];
  tiles: MuralTile[] = [];
  load() {
    return this.state && structuredClone(this.state);
  }
  save(s: DirectorState) {
    this.state = structuredClone(s);
  }
  record(i: Instance) {
    this.records.push(i);
  }
  run(r: ResearchRun) {
    this.runs.push(r);
  }
  enqueue(p: Publication) {
    if (!this.queue.some((x) => x.id === p.id)) this.queue.push(p);
  }
  nextPublication(now: number) {
    return this.queue[0]?.notBefore <= now ? this.queue[0] : undefined;
  }
  published(id: string) {
    this.queue = this.queue.filter((p) => p.id !== id);
  }
  defer(p: Publication) {
    this.queue[this.queue.findIndex((x) => x.id === p.id)] = p;
  }
  publicationCount() {
    return this.queue.length;
  }
  mural() {
    return this.tiles.at(-1);
  }
  muralCount() {
    return this.tiles.length;
  }
  putMural(t: MuralTile) {
    const i = this.tiles.findIndex((x) => x.id === t.id);
    if (i < 0) this.tiles.push(t);
    else this.tiles[i] = t;
  }
}
const at = Date.parse("2026-09-17T12:00:00Z");
const answer: Answer = {
  summary: "A bounded question",
  content: "Assess how versioned facts handle corrections.",
  decision: "advance",
  search: "agent memory corrections",
  sources: "none",
  nextTask: "Compare versioned facts with plain append-only notes.",
  lesson: "Keep correction handling separate from retrieval quality.",
};
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("durable agent workflow", () => {
  it("wakes for new work and expired preparation leases, not idle polling", async () => {
    const d = new Director(new MemoryStore(), "", true);
    expect(d.nextPreparationAt(0, at)).toBeNull();
    expect(d.nextPreparationAt(1, at)).toBe(at);
    await d.prepare(1, at);
    expect(d.nextPreparationAt(1, at)).toBeNull();
    d.accept(d.pending()[0].id, JSON.stringify(answer), "browser", 1, 1, 1, at);
    expect(d.nextPreparationAt(1, at)).toBe(at);
    d.state.loops[0].preparingUntil = at + 90000;
    expect(d.nextPreparationAt(1, at)).toBe(at + 90001);
    expect(d.nextPreparationAt(2, at)).toBe(at + 10000);
    expect(
      d.nextPreparationAt(1, Date.parse("2026-09-17T23:00:00Z")),
    ).toBeNull();
    d.setEnabled(false);
    expect(d.nextPreparationAt(1, at)).toBeNull();
  });
  it("stays dormant at zero capacity and restores the same agent after a restart", async () => {
    const store = new MemoryStore();
    let d = new Director(store, "", true);
    await d.prepare(0, at);
    expect(d.pending()).toHaveLength(0);
    await d.prepare(1, at);
    const p = d.pending()[0];
    expect(p.role).toBe("orchestrator");
    d.interrupted(p.id);
    d = new Director(store, "", true);
    await d.prepare(0, at + 1000);
    expect(d.pending()[0].id).toBe(p.id);
    expect(d.pending()[0].interruptions).toBe(1);
    d.accept(p.id, JSON.stringify(answer), "browser", 50, 300, 2000, at + 3000);
    expect(d.state.completed).toBe(1);
    expect(d.state.loops[0].stage).toBe("manager_setup");
    expect(
      d.accept(p.id, JSON.stringify(answer), "browser", 50, 300, 2000),
    ).toBeNull();
    expect(d.state.completed).toBe(1);
  });
  it("adds independent managers with capacity without destroying them when capacity falls", async () => {
    const d = new Director(new MemoryStore(), "", true);
    await d.prepare(1, at);
    d.accept(d.pending()[0].id, JSON.stringify(answer), "browser", 1, 1, 1, at);
    await d.prepare(2, at + 20000);
    await d.prepare(2, at + 20001);
    expect(d.state.loops).toHaveLength(2);
    expect(d.pending()).toHaveLength(2);
    const ids = d.pending().map((p) => p.id);
    await d.prepare(0, at + 40000);
    expect(d.pending().map((p) => p.id)).toEqual(ids);
    expect(d.pending()[0].messages[1].content).toContain(answer.nextTask);
  });
  it("enforces both two-round limits even if a manager asks for another revision", () => {
    expect(
      nextRole(
        "manager_plan",
        { ...answer, decision: "revise" },
        { planReviews: 2, deliverableReviews: 0 },
      ),
    ).toBe("researcher");
    expect(
      nextRole(
        "manager_final",
        { ...answer, decision: "revise" },
        { planReviews: 0, deliverableReviews: 2 },
      ),
    ).toBe("complete");
  });
  it("rejects invented citations and records invalid calls without losing publication debt", async () => {
    const store = new MemoryStore(),
      d = new Director(store, "", true);
    await d.prepare(1, at);
    const p = d.pending()[0];
    expect(() =>
      parseAnswer(
        JSON.stringify({ ...answer, content: "Evidence [S9]", sources: "S9" }),
        p,
      ),
    ).toThrow();
    d.reject(p.id, "bad JSON", "Invalid record", "browser");
    d.reject(p.id, "bad again", "Invalid record", "browser");
    expect(store.records).toHaveLength(2);
    expect(store.queue).toHaveLength(2);
    expect(d.pending()).toHaveLength(0);
    expect(d.state.loops[0].stage).toBe("failed");
    const restored = new Director(store, "", true);
    expect(restored.state.reports.at(-1)?.summary).toContain("invalid");
  });
  it("keeps station contexts separate and preserves an unfinished mural across station changes", async () => {
    const store = new MemoryStore(),
      d = new Director(store, "", true);
    d.state.reports = [
      {
        id: "r",
        goal: "PRIVATE_RESEARCH_MARKER",
        summary: "Review a failed memory claim",
        nextTask: "Read counterevidence",
        caveats: "Limited reading",
      },
    ];
    await d.prepare(1, Date.parse("2026-09-17T20:01:00Z"));
    const art = d.pending()[0];
    expect(JSON.stringify(art.messages)).not.toContain(
      "PRIVATE_RESEARCH_MARKER",
    );
    await d.prepare(1, Date.parse("2026-09-17T21:01:00Z"));
    expect(d.pending().map((p) => p.station)).toEqual(["mural", "funding"]);
    await d.prepare(1, Date.parse("2026-09-17T22:01:00Z"));
    const reflection = d.pending().find((p) => p.station === "reflection")!;
    expect(JSON.stringify(reflection.messages)).toContain(
      "PRIVATE_RESEARCH_MARKER",
    );
  });
  it("keeps publication paths inside the notebook", () => {
    expect(() =>
      validateFiles({ ".github/workflows/run.yml": "bad" }),
    ).toThrow();
    expect(() =>
      validateFiles({ "orchestration/runs/../../README.md": "bad" }),
    ).toThrow();
    expect(() =>
      validateFiles({ "orchestration/instances/valid.json": "{}" }),
    ).not.toThrow();
  });
  it("retries a failed publisher separately from model completion", async () => {
    const store = new MemoryStore(),
      d = new Director(store, "", true);
    await d.prepare(1, at);
    d.accept(
      d.pending()[0].id,
      JSON.stringify(answer),
      "browser",
      50,
      300,
      2000,
      at,
    );
    await d.publishOne(at + 1000);
    expect(d.state.completed).toBe(1);
    expect(store.queue).toHaveLength(1);
    expect(store.queue[0].attempts).toBe(1);
    expect(d.state.publishingUntil).toBe(0);
  });
  it("falls back from an inaccessible planner URL and does not turn its failure into evidence", async () => {
    const d = new Director(new MemoryStore(), "", true);
    await d.prepare(1, at);
    const loop = d.state.loops[0];
    loop.stage = "researcher";
    loop.instances.push({
      id: "planner",
      role: "planner",
      status: "completed",
      at,
      answer: {
        ...answer,
        search: "https://huggingface.co/spaces/missing/source",
      },
      model: "fixture",
      source: "fixture",
      tokens: 1,
      inputTokens: 1,
      durationMs: 1,
      attempts: 1,
      sources: [],
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("huggingface")
          ? new Response("unauthorized", { status: 401 })
          : url.includes("export.arxiv")
            ? new Response("<feed></feed>")
            : url.includes("api.github")
              ? Response.json({
                  items: [
                    { full_name: "example/memory", default_branch: "main" },
                  ],
                })
              : url.includes("sitemap")
                ? new Response("<urlset/>")
                : new Response(
                    "# Memory\nA maintained retrieval implementation.",
                  ),
      ),
    );
    const sources = await collect(loop);
    expect(sources.find((s) => s.status === "retrieved")?.url).toContain(
      "raw.githubusercontent.com",
    );
    expect(sources.find((s) => s.id === "F1")?.excerpt).toContain("401");
  });
  it("supplies a rejected role with correction feedback without advancing the review count", async () => {
    const d = new Director(new MemoryStore(), "", true);
    await d.prepare(1, at);
    const p = d.pending()[0];
    d.reject(p.id, "bad", "Use inspected IDs only", "browser");
    expect(d.pending()[0].messages.at(-1)?.content).toContain(
      "CORRECTION FOR RETRY",
    );
    expect(d.state.loops[0].planReviews).toBe(0);
  });
});
