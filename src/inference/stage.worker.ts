import config from "../../shared/model-config.json";
/// <reference lib="webworker" />
import { loadStage, topLogits, type Stage } from "./runtime";
import {
  fromBase64,
  toBase64,
  validStageCall,
  type StageCall,
  type Piece,
} from "../../shared/pipeline";
let stage: Stage | null = null;
let duty = 0.05;
let nextAt = 0;
let activeJob = "";
let position = 0;
let serial = Promise.resolve();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
self.onmessage = (event) => {
  const input = event.data;
  serial = serial
    .then(async () => {
      if (input.type === "load") {
        stage?.destroy();
        stage = await loadStage(input.piece as Piece, (progress, text) =>
          postMessage({ type: "progress", progress, text }),
        );
        duty = input.duty;
        activeJob = "";
        position = 0;
        nextAt = 0;
        postMessage({
          type: "loaded",
          bytes: stage.bytes,
          transferred: stage.transferred,
        });
        return;
      }
      if (input.type !== "step" || !stage) throw Error("No model piece loaded");
      const call = input.call as StageCall;
      if (!validStageCall(call) || call.start !== stage.range.start)
        throw Error("Invalid inference assignment");
      if (call.position === 0) {
        activeJob = call.jobId;
        position = 0;
        stage.engine.resetKVTracking();
      }
      if (activeJob !== call.jobId || position !== call.position)
        throw Error("Inference sequence was interrupted");
      const bytes = call.data ? fromBase64(call.data) : null;
      await sleep(Math.max(0, nextAt - performance.now()));
      const start = performance.now();
      const out = await stage.engine.pipelineBatch(
        call.tokens ? { tokens: call.tokens } : { residuals: bytes!.buffer },
        position,
        call.count,
      );
      position += call.count;
      stage.assertHealthy();
      const computeMs = performance.now() - start;
      nextAt = performance.now() + computeMs * (1 / duty - 1);
      if ("logits" in out && call.repetitionIds) {
        for (const id of new Set(call.repetitionIds)) {
          const value = out.logits[id];
          out.logits[id] =
            value < 0
              ? value * config.artRepetitionPenalty
              : value / config.artRepetitionPenalty;
        }
      }
      const top =
        "logits" in out ? topLogits(out.logits, 64, call.allowed) : undefined;
      const residuals =
        "residuals" in out ? new Uint8Array(out.residuals) : new Uint8Array();
      postMessage({
        type: "result",
        result: {
          jobId: call.jobId,
          rid: call.rid,
          computeMs,
          ...(top ? { top } : { data: toBase64(residuals) }),
        },
      });
    })
    .catch((e) =>
      postMessage({
        type: "failure",
        rid: input.call?.rid,
        jobId: input.call?.jobId,
        message: e instanceof Error ? e.message : "Model computation failed",
      }),
    );
};
