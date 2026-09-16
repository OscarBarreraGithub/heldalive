import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";
import type { Job } from "../shared/protocol";
export class NativeModel {
  private child: ChildProcessWithoutNullStreams;
  readonly ready: Promise<void>;
  private pending: {
    id: string;
    send: (event: unknown) => void;
    resolve: () => void;
    reject: (e: Error) => void;
  } | null = null;
  private closing = false;
  private completion: Promise<void> = Promise.resolve();
  constructor(python: string, script: string, model: string) {
    this.child = spawn(python, ["-u", script, model], {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        HF_HUB_OFFLINE: "1",
        TOKENIZERS_PARALLELISM: "false",
      },
    });
    this.child.stderr.on("data", (data) => process.stderr.write(data));
    this.ready = new Promise((resolve, reject) => {
      createInterface({ input: this.child.stdout }).on("line", (line) => {
        try {
          const event = JSON.parse(line);
          if (event.type === "ready") {
            resolve();
            return;
          }
          const pending = this.pending;
          if (!pending || event.jobId !== pending.id) return;
          if (["chunk", "done", "failed"].includes(event.type))
            pending.send(event);
          if (event.type === "cancelled")
            pending.send({ type: "failed", jobId: pending.id });
          if (["done", "failed", "cancelled"].includes(event.type)) {
            this.pending = null;
            pending.resolve();
          }
        } catch {
          console.error("Invalid native model response");
        }
      });
      this.child.once("error", reject);
      this.child.once("exit", () => {
        reject(new Error("Native model exited"));
        this.pending?.reject(new Error("Native model exited"));
        this.pending = null;
        if (!this.closing) {
          console.error("Native model stopped; bridge will restart.");
          setTimeout(() => process.exit(1), 100);
        }
      });
    });
  }
  async generate(
    job: Job,
    send: (event: unknown) => void,
    signal: AbortSignal,
  ) {
    await this.ready;
    // A cancelled Metal command may still be finishing when a new lease arrives.
    await this.completion;
    if (signal.aborted) return;
    if (this.pending) throw new Error("Native model is already working");
    this.completion = new Promise<void>((resolve, reject) => {
      const cancel = () =>
        this.child.stdin.write(
          JSON.stringify({ type: "cancel", jobId: job.id }) + "\n",
        );
      const finish = () => {
        signal.removeEventListener("abort", cancel);
        resolve();
      };
      this.pending = {
        id: job.id,
        send,
        resolve: finish,
        reject: (e) => {
          signal.removeEventListener("abort", cancel);
          reject(e);
        },
      };
      signal.addEventListener("abort", cancel, { once: true });
      this.child.stdin.write(JSON.stringify({ type: "job", job }) + "\n");
    });
    await this.completion;
  }
  close() {
    this.closing = true;
    this.child.kill("SIGTERM");
  }
}
