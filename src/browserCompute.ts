import { CURRENT_MODEL, modelPrompt } from "../shared/model";
import { OutputGrammar } from "./inference/grammar";
import type { Job } from "../shared/protocol";
import { AGENT_PROTOCOL, AGENT_MAX_CHARS } from "../shared/agents";
import {
  MAX_BATCH,
  MAX_CONTEXT,
  sampleToken,
  type Piece,
  type StageResult,
} from "../shared/pipeline";
import { loadTokenizer } from "./inference/runtime";
type Send = (event: unknown) => void;
export type BrowserUsage =
  | { type: "loaded"; layers: number; modelBytes: number }
  | { type: "work"; computeMs: number };
export class BrowserCompute {
  private worker: Worker | null = null;
  private piece: Piece | null = null;
  private epoch = 0;
  private stopped = false;
  private duty = 0.05;
  private send: Send = () => {};
  private progress = (p: number, text: string) => {};
  private reportUsage: (event: BrowserUsage) => void = () => {};
  private readyResolve: ((v: boolean) => void) | null = null;
  private readyReject: ((e: Error) => void) | null = null;
  private pending = new Map<
    string,
    {
      resolve: (v: any) => void;
      reject: (e: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  private tokenizer: Awaited<ReturnType<typeof loadTokenizer>> | null = null;
  async load(
    onProgress: (progress: number, text: string) => void,
    send: Send,
    duty: number,
    reportUsage: (event: BrowserUsage) => void = () => {},
  ) {
    this.progress = onProgress;
    this.send = send;
    this.duty = duty;
    this.reportUsage = reportUsage;
    this.stopped = false;
    const promise = new Promise<boolean>((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });
    this.send({
      type: "pipeline_offer",
      modelId: CURRENT_MODEL.id,
      protocol: AGENT_PROTOCOL,
      duty,
      visible: !document.hidden,
    });
    return promise;
  }
  setBudget(duty: number) {
    this.duty = duty;
    this.suspend();
    this.reconnect();
  }
  reconnect() {
    if (!this.stopped)
      this.send({
        type: "pipeline_offer",
        modelId: CURRENT_MODEL.id,
        protocol: AGENT_PROTOCOL,
        duty: this.duty,
        visible: !document.hidden,
      });
  }
  async accept(data: any) {
    if (this.stopped) return;
    if (data.type === "pipeline_assign") {
      this.pause();
      this.worker?.terminate();
      this.piece = data.piece;
      this.progress(
        0,
        `Holding layers ${data.piece.start + 1}–${data.piece.end}`,
      );
      const worker = new Worker(
        new URL("./inference/stage.worker.ts", import.meta.url),
        { type: "module" },
      );
      this.worker = worker;
      worker.onmessage = ({ data: d }) => {
        if (this.worker !== worker || this.stopped) return;
        if (d.type === "progress") this.progress(d.progress, d.text);
        if (d.type === "loaded") {
          this.reportUsage({
            type: "loaded",
            layers: this.piece!.end - this.piece!.start,
            modelBytes: d.bytes,
          });
          this.progress(
            1,
            `Holding layers ${this.piece!.start + 1}–${this.piece!.end} · ${(d.bytes / 1e6).toFixed(1)} MB`,
          );
          this.send({
            type: "pipeline_ready",
            modelId: CURRENT_MODEL.id,
            key: this.piece?.key,
          });
          this.readyResolve?.(true);
          this.readyResolve = null;
        }
        if (d.type === "result") {
          this.reportUsage({ type: "work", computeMs: d.result.computeMs });
          this.send({ type: "pipeline_result", ...d.result });
        }
        if (d.type === "failure") {
          if (d.rid)
            this.send({
              type: "pipeline_result",
              rid: d.rid,
              jobId: d.jobId,
              error: true,
            });
          this.readyReject?.(Error(d.message));
          this.progress(-1, d.message);
          this.suspend();
        }
      };
      worker.onerror = () => {
        this.readyReject?.(
          Error("The browser could not load its model piece."),
        );
        this.progress(
          -1,
          "The browser could not run its model piece. You can retry or keep watching.",
        );
        this.suspend();
      };
      worker.postMessage({ type: "load", piece: this.piece, duty: this.duty });
      return;
    }
    if (data.type === "pipeline_step") {
      if (document.hidden || !this.worker) {
        this.send({
          type: "pipeline_result",
          rid: data.call.rid,
          jobId: data.call.jobId,
          error: true,
        });
        return;
      }
      this.worker.postMessage({ type: "step", call: data.call });
      return;
    }
    if (data.type === "pipeline_error") {
      this.readyReject?.(Error(data.message));
      return;
    }
    if (data.type === "pipeline_reset") {
      this.pause();
      return;
    }
    const pending = this.pending.get(data.rid);
    if (
      pending &&
      [
        "pipeline_reply",
        "pipeline_sample_reply",
        "pipeline_sample_local",
      ].includes(data.type)
    ) {
      clearTimeout(pending.timer);
      this.pending.delete(data.rid);
      pending.resolve(data);
    }
  }
  private request(
    event: Record<string, unknown>,
    timeout = 60000,
  ): Promise<any> {
    const rid = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(rid);
        reject(Error("A shared piece did not return in time"));
      }, timeout);
      this.pending.set(rid, { resolve, reject, timer });
      this.send({ ...event, rid });
    });
  }
  async run(job: Job, send: Send) {
    const generation = ++this.epoch;
    const check = () => {
      if (generation !== this.epoch || this.stopped || document.hidden)
        throw Error("Cancelled");
    };
    try {
      if (!job.pieces?.length || job.pieces[0].start !== 0)
        throw Error("Incomplete pipeline");
      this.tokenizer ??= await loadTokenizer();
      check();
      const prompt = modelPrompt(job.messages);
      const ids = this.tokenizer.encode(prompt);
      if (ids.length + job.maxTokens > MAX_CONTEXT)
        throw Error("This thought is too long for the shared model");
      const grammar = new OutputGrammar(
        this.tokenizer,
        job.kind === "art" ? undefined : job.kind,
        job.agent?.sourceIds,
      );
      const generated: number[] = [];
      let position = 0;
      let top: [number, number][] = [];
      const forward = async (tokens: number[]) => {
        let payload: Record<string, unknown> = { tokens };
        for (const piece of job.pieces!) {
          check();
          const out = await this.request({
            type: "pipeline_call",
            jobId: job.id,
            start: piece.start,
            position,
            count: tokens.length,
            repetitionIds:
              piece.end === CURRENT_MODEL.layers && job.kind === "art"
                ? generated.slice(-384)
                : undefined,
            allowed:
              piece.end === CURRENT_MODEL.layers
                ? grammar.allowed()
                : undefined,
            ...payload,
          });
          check();
          if (out.top) top = out.top;
          else payload = { data: out.data };
        }
        position += tokens.length;
      };
      while (position < ids.length) {
        await forward(ids.slice(position, position + MAX_BATCH));
      }
      let emitted = "";
      for (let i = 0; i < job.maxTokens; i++) {
        check();
        if (grammar.finished) break;
        top = grammar.filter(top);
        let sampled: any;
        try {
          sampled = await this.request(
            {
              type: "pipeline_sample",
              jobId: job.id,
              top,
              temperature: job.temperature ?? 0.8,
              history: job.kind === "art" ? [] : generated.slice(-40),
            },
            2700,
          );
        } catch {
          check();
        }
        const token =
          typeof sampled?.token === "number"
            ? sampled.token
            : sampleToken(
                top,
                job.temperature ?? 0.8,
                Math.random(),
                job.kind === "art" ? [] : generated,
              );
        if (CURRENT_MODEL.stops.includes(token)) break;
        generated.push(token);
        grammar.consume(token);
        const text = this.tokenizer.decode(generated);
        if (!text.endsWith("\uFFFD") && text.startsWith(emitted)) {
          const delta = text.slice(emitted.length);
          if (delta) send({ type: "chunk", jobId: job.id, text: delta });
          emitted = text;
        }
        if (
          emitted.length >= (job.agent ? AGENT_MAX_CHARS : 1300) ||
          (job.kind === "art" && /^\s*```[^\n]*\n[\s\S]*?\n```/.test(emitted))
        )
          break;
        await forward([token]);
      }
      check();
      send({
        type: "done",
        jobId: job.id,
        tokens: generated.length,
        inputTokens: ids.length,
      });
    } catch (e) {
      if (generation === this.epoch && !this.stopped) {
        console.warn("Shared thought interrupted:", e);
        send({
          type: "failed",
          jobId: job.id,
          reason:
            e instanceof Error && /too long/.test(e.message)
              ? "context_limit"
              : "interrupted",
        });
      }
    }
  }
  pause() {
    this.epoch++;
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(Error("Cancelled"));
    }
    this.pending.clear();
  }
  suspend() {
    this.pause();
    this.worker?.terminate();
    this.worker = null;
    this.send({ type: "pipeline_stop" });
  }
  stop() {
    this.stopped = true;
    this.suspend();
    this.readyResolve?.(false);
    this.readyResolve = null;
    this.piece = null;
  }
}
