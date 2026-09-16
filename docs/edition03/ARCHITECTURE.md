# Collective inference architecture

Cloudflare serves static assets and one SQLite Durable Object per habitat. It signs anonymous visitor cookies, coordinates WebSockets, persists the artwork's records, assigns model pieces and bounded work, and routes intermediate vectors. It performs no transformer inference for the public habitat. The separately authenticated Mac bridge may only enter the studio habitat.

## Physical work

SmolLM2-360M-Instruct has 32 consecutive transformer layers. Each opt-in holder receives a contiguous range of 2, 4, or 8 layers according to its contribution setting (a short gap may receive fewer). Assignment fills holes before opening another chain. Only a chain whose ready pieces cover every layer without overlap receives jobs. Eight simultaneous chains are supported by the scheduler. Capacity limits are not load-test claims.

The holder of layer zero tokenizes the coordinator's prompt and drives the sequence; it cannot assign work outside its active lease. Every stage receives authenticated, bounded requests through the coordinator. Intermediate values are 960 float16 numbers per input token, encoded in bounded frames. Inputs travel in batches of at most sixteen. Autoregressive output tokens follow one at a time. Each worker keeps only its own attention cache and computes its assigned layers in a dedicated Web Worker.

The final stage returns the highest 64 candidate token scores (or explicitly requested grammar candidates). A small browser CPU task applies a stable softmax, temperature and recent-token penalty to choose a token. This work can be assigned to an otherwise watching browser that permits tiny contributions. A slow/missing tiny worker times out; the driver browser finishes that small operation. A missing transformer stage has no such fallback.

## Consent and pacing

GPU work requires a click and resource disclosure. Work and rest are measured per bounded batch; slower devices consequently work less often. Targets are 5%, 10%, or 20% of measured work-plus-rest wall time, not exact GPU utilization or electrical limits. Loading, shader compilation and network traffic are additional. Stop terminates the worker. A hidden page withdraws its piece and terminates its worker; returning re-offers capacity. No idle fake work is issued to boost contribution counts.

## Lifecycle

Each stage owns a server-issued assignment key. Work carries a task ID, request ID, expected position and exact batch shape. The server routes a reply only to the corresponding active driver. Late/stale/unowned replies do not complete another task. Losing any stage cancels the affected chain's unfinished job and queues a new lease. Completed drawings and workspace files survive. Restarting a job replays its prompt into fresh stage caches; private intermediate activations are not an archival memory mechanism.

## Model autonomy

The scheduler grants a planning turn. Output grammar fixes JSON structure while the model chooses activity, subject and helper count. It can draw, wander, or conduct a memory project. Memory projects include a model-written proposed instruction, three fixed format baselines, and a paired comparison of proposed and currently kept instructions on a newly drawn synthetic record. A strict improvement keeps the proposal; ties retain the incumbent. The model receives previous instructions and results to inform the next proposal. Plans, journal pages and memory revisions are public text files in a bounded virtual workspace.

This is a small task/tool space. The model cannot execute shell commands, read a visitor's files or change hosting. There is no visitor free-text channel. Browser results are still untrusted; connection ownership, bounds and weight hashes do not prove honest GPU execution. Toy recall results are not a general claim of improved memory or intelligence.

## Numerical implementation

The browser uses the MIT Zero-TVM WGSL engine at the recorded vendor revision, with Held Alive changes for SmolLM2's dimensions, tokenizer, bounded batch stage execution and logits readback. Model source is Apache-2.0; quantization is four-bit affine, groups of 64 with float16 metadata. Individual prepared buffers are content-hashed. The browser fetches only buffers named by its assigned layer plan. Endpoints both need the tied vocabulary table. The native MLX development comparison is not a public inference path.
