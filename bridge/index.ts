import modelConfig from "../shared/model-config.json";
import { WebSocket } from "ws";
import { NativeModel } from "./native-model";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { LOCAL_MODEL, jobSchema } from "../shared/protocol";
import type { Job, ServerEvent } from "../shared/protocol";

type Config = {
  url: string;
  token: string;
  ollamaUrl?: string;
  model?: string;
  room?: "main" | "browser";
  engine?: "ollama" | "mlx";
  python?: string;
  modelPath?: string;
};
const configPath = process.env.HELD_CONFIG || ".local/bridge.json";
const config: Config = JSON.parse(await readFile(configPath, "utf8"));
const endpoint = new URL(config.ollamaUrl || "http://127.0.0.1:11434");
if (!["127.0.0.1", "localhost", "[::1]"].includes(endpoint.hostname))
  throw new Error("Ollama must be a loopback service.");
if (!config.token || !config.url)
  throw new Error("Bridge configuration requires a URL and token.");
const native =
  config.engine === "mlx"
    ? new NativeModel(
        config.python || "python3",
        fileURLToPath(new URL("./native_model.py", import.meta.url)),
        config.modelPath || "",
      )
    : null;
if (config.room === "browser" && !native)
  throw new Error("The public launch bridge must use the pinned native model.");
let active: AbortController | null = null;
let socket: WebSocket | null = null;
let stopping = false;
let retry = 1000;

async function generate(ws: WebSocket, job: Job) {
  active?.abort();
  const controller = new AbortController();
  active = controller;
  const send = (data: unknown) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
  };
  const timeout = setTimeout(() => controller.abort(), 85_000);
  try {
    if (native) {
      await native.generate(job, send, controller.signal);
      return;
    }
    const response = await fetch(new URL("/api/chat", endpoint), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model || LOCAL_MODEL,
        messages: job.messages,
        format: jobSchema(job.kind),
        stream: true,
        keep_alive: "10m",
        options: {
          num_predict: Math.min(job.maxTokens, 512),
          num_ctx: 2048,
          temperature: job.temperature ?? 0.8,
          top_p: 0.9,
          repeat_penalty: job.kind === "art" ? 1 : 1.12,
        },
      }),
    });
    if (!response.ok || !response.body)
      throw new Error(`Local inference returned ${response.status}`);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let completed = false;
    while (!controller.signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      if (buffer.length > 65_536) throw new Error("Invalid local response");
      let newline: number;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        if (!line.trim()) continue;
        const chunk = JSON.parse(line) as {
          message?: { content?: string };
          done?: boolean;
          eval_count?: number;
          error?: string;
        };
        if (chunk.error) throw new Error("Local model unavailable");
        if (chunk.message?.content)
          send({ type: "chunk", jobId: job.id, text: chunk.message.content });
        if (chunk.done) {
          send({ type: "done", jobId: job.id, tokens: chunk.eval_count || 0 });
          completed = true;
        }
      }
    }
    if (!completed && !controller.signal.aborted)
      send({ type: "failed", jobId: job.id });
  } catch (error) {
    if (!controller.signal.aborted)
      console.error(
        "Inference failed:",
        error instanceof Error ? error.message : "unknown error",
      );
    send({ type: "failed", jobId: job.id });
  } finally {
    clearTimeout(timeout);
    if (active === controller) active = null;
  }
}

function connect() {
  if (stopping) return;
  const url = new URL(
    `/api/socket?room=${config.room || "main"}&role=bridge`,
    config.url,
  );
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(url, {
    headers: { Authorization: `Bearer ${config.token}` },
    maxPayload: 65_536,
  });
  socket = ws;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  ws.on("open", async () => {
    retry = 1000;
    console.log(
      `Connected to ${new URL(config.url).host}; local model ${config.model || LOCAL_MODEL}.`,
    );
    try {
      if (native) {
        await native.ready;
        if (ws.readyState === WebSocket.OPEN)
          ws.send(
            JSON.stringify({
              type: "ready",
              ready: true,
              modelId: modelConfig.id,
            }),
          );
      } else {
        const check = await fetch(new URL("/api/tags", endpoint), {
          signal: AbortSignal.timeout(5000),
        });
        const tags = (await check.json()) as { models: { name: string }[] };
        const ready = tags.models?.some(
          (m) => m.name === (config.model || LOCAL_MODEL),
        );
        ws.send(JSON.stringify({ type: "ready", ready: Boolean(ready) }));
        if (!ready) console.error("Required local model is not installed.");
      }
    } catch {
      console.error("Local model is not available.");
      ws.close();
      return;
    }
    if (ws.readyState !== WebSocket.OPEN) return;
    heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN)
        ws.send(JSON.stringify({ type: "ping" }));
    }, 15_000);
  });
  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString()) as ServerEvent;
      if (data.type === "job") void generate(ws, data.job);
      if (data.type === "cancel") active?.abort();
    } catch {
      console.error("Unrecognized coordinator message.");
    }
  });
  ws.on("error", (error) => console.error("Bridge connection:", error.message));
  ws.on("close", () => {
    clearInterval(heartbeat);
    active?.abort();
    if (!stopping) {
      console.log(`Reconnecting in ${retry / 1000}s.`);
      setTimeout(connect, retry);
      retry = Math.min(30_000, retry * 2);
    }
  });
}
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    stopping = true;
    active?.abort();
    native?.close();
    socket?.close();
    setTimeout(() => process.exit(0), 250);
  });
connect();
