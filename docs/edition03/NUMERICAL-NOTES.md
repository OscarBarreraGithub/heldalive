# Numerical validation notes

Date: 2026-09-16. Platform: this Mac, headed Playwright Chromium WebGPU; independent browser contexts, one physical machine. These are not internet latency or heterogeneous-device benchmarks.

Pinned source and model identities are in IMPLEMENTATION.md and the vendor PROVENANCE.md.

## Bug found before integration

Zero-TVM's sequential engine and residual normalization assumed hidden/KV widths divisible by 256. SmolLM2-360M has hidden width 960 and KV width 320. Fractional dispatch counts were truncated; the add+norm kernel omitted a tail. The output looked like language but disagreed drastically with the MLX reference. Corrections: ceil dispatch counts; guard the final RoPE row; ceil and bounds-check add+norm's element loops. The tokenizer also needs the direct GPT-2 ByteLevel regex, not a Qwen fallback.

After correction, the reference prompt 'What is the capital of France?' produces 'The capital of France is Paris.' Both the native MLX reference and browser engine rank token 504 first. Top-ten token identities and ordering match. Native first logit 17.765625; intact browser 17.7590523; four stages 17.7730846; sixteen stages 17.7619534. Differences arise from float16 arithmetic and stage-boundary normalization; equality of all floating-point values is not claimed.

The 16-stage test used 16 independent browser contexts, two layers each. It produced the identical eight generated token IDs as the intact model: 504,3575,282,4649,314,7042,30,2. The prompt plus answer took 2291 ms through the test's local orchestration. This excludes production duty rests and internet hops; it is a correctness demonstration, not a user-facing speed promise.

Prepared unique GPU weight buffers total 203,614,080 bytes. Tied vocabulary weights are duplicated at the first and final stage when distributed, so summed downloads across stages exceed the unique-model total. Measured per-stage allocation is recorded below.

## Actual GPU buffer allocations

Intercepted `GPUDevice.createBuffer` in a development-only probe and summed allocation sizes during stage loading (same Chromium/Mac, 1024-token KV limit):

| Piece | Prepared weight bytes | Total allocated GPU buffer bytes |
|---|---:|---:|
| Layers 0–1 (input endpoint) | 37,608,960 | 40,461,092 |
| Layers 2–3 (interior) | 11,066,880 | 13,919,012 |
| Layers 24–31 (eight-layer output endpoint) | 70,811,520 | 81,526,572 |

This is buffer allocation accounting, not whole-process resident memory. Shader pipelines, JavaScript, download/cache buffers and browser overhead are extra. Browser/device implementations may allocate internal resources differently.

## Integrated gentle-contribution performance finding

The initial live scheduler test with sixteen 2-layer contexts remained in prompt processing for several minutes. The direct correctness test did not include per-stage duty rests. `mapAsync` readback and host scheduling overhead, followed by conservative 5% work/rest pacing, dominate the naive per-token prefill path. This invalidates treating the earlier direct test's ~2 seconds as application response time. The bounded multi-token stage operation below fixed this prefill problem and was revalidated. The naive timing is not completed-product performance.

## Batched stage validation

The bounded batch implementation is now in use. Sixteen two-layer stages, receiving the reference input in batches of up to sixteen, returned the exact same top-ten logits as their sequential stage counterparts, including first logit 17.761953353881836. The local development probe took 154.2 ms for the prompt; it excludes deliberate duty rests and network coordination. The integrated sixteen-context application subsequently completed its planning turn and withdrawal/recovery check in a 28.099-second observation interval. These different measurements must not be conflated.

## Final native-reference regression

The final 16-context bounded-batch test compared three prompts (27 tokens, 425 tokens, and a 49-token Unicode case) with the pinned native MLX oracle. All tokenizer IDs matched exactly; all three leading predictions matched. Maximum absolute differences among shared top-ten logits were 0.020804, 0.024067 and 0.028542 respectively (test tolerance 0.2; at least eight common top-ten candidates required). Local orchestration times were 496, 7214 and 698 ms, excluding production pacing and internet transport. This samples numerical correctness; it does not prove bitwise equivalence for every possible input.

The exact reference prompts, token IDs and native logits are committed in `models/smollm2-360m-q4-v1/reference.json`; observed split outputs are in `docs/edition03/evidence/numerics-16.json`. Run `npm run test:numerics` against the local Vite development server to reproduce.
