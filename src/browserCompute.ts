import type { WebWorkerMLCEngine } from '@mlc-ai/web-llm';
import { BROWSER_MODEL } from '../shared/protocol';
import type { Job } from '../shared/protocol';

export class BrowserCompute {
  private worker: Worker | null = null;
  private engine: WebWorkerMLCEngine | null = null;
  private epoch = 0;
  private cancelled = false;
  async load(onProgress: (progress: number, text: string) => void) {
    const epoch = ++this.epoch;
    const { CreateWebWorkerMLCEngine } = await import('@mlc-ai/web-llm');
    if (epoch !== this.epoch) return false;
    this.worker = new Worker(new URL('./compute.worker.ts', import.meta.url), { type: 'module' });
    const engine = await CreateWebWorkerMLCEngine(this.worker, BROWSER_MODEL, {
      initProgressCallback: report => { if (epoch === this.epoch) onProgress(report.progress, report.text); },
    }, { context_window_size: 2048 });
    if (epoch !== this.epoch) { await engine.unload(); return false; }
    this.engine = engine;
    return true;
  }
  async run(job: Job, send: (event: unknown) => void) {
    if (!this.engine) { send({ type: 'failed', jobId: job.id }); return; }
    this.cancelled = false;
    const epoch = this.epoch;
    try {
      const stream = await this.engine.chat.completions.create({ messages: job.messages, max_tokens: job.maxTokens, temperature: 0.8, top_p: 0.9, stream: true, stream_options: { include_usage: true } });
      let tokens = 0;
      for await (const part of stream) {
        if (this.cancelled || epoch !== this.epoch) break;
        const text = part.choices[0]?.delta.content;
        if (text) send({ type: 'chunk', jobId: job.id, text });
        if (part.usage) tokens = part.usage.completion_tokens;
      }
      if (!this.cancelled && epoch === this.epoch) send({ type: 'done', jobId: job.id, tokens });
    } catch { if (epoch === this.epoch) send({ type: 'failed', jobId: job.id }); }
  }
  pause() { this.cancelled = true; this.engine?.interruptGenerate(); }
  stop() { this.pause(); this.epoch += 1; this.worker?.terminate(); this.worker = null; this.engine = null; }
}
