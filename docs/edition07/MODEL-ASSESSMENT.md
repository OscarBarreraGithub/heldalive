# Edition 07 — stronger model, honest limits

## Decision

Replace SmolLM2-360M-Instruct with Qwen3-4B-Instruct-2507, four-bit affine quantization (group size 64). The public native preview and distributed browser model use the same converted checkpoint. This is a much larger model—roughly eleven times the nominal parameter count—not a free quality improvement.

The original model is [Qwen/Qwen3-4B-Instruct-2507](https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507), revision `cdbee75f17c01a7cc42f958dc650907174af0554`, Apache-2.0. Its model card describes 4B parameters, 36 layers, 32 query heads, 8 KV heads, and non-thinking-only operation. The quantized source is [mlx-community/Qwen3-4B-Instruct-2507-4bit](https://huggingface.co/mlx-community/Qwen3-4B-Instruct-2507-4bit/tree/50d427756c6b1b2fe0c0a10f67fbda1fc8e82c1b). Floating-point norms, scales and affine biases are converted to float16 without requantizing the integer weights. Pinned metadata, source card and license are in `models/qwen3-4b-2507-q4-v1/`.

## What the trials actually showed

Small LLMs are poor spatial artists. Direct subject prompts produced distorted pictures and runaway repetitions in Qwen2.5 1.5B/3B, Qwen3 1.7B/4B, Qwen2.5-Coder 3B and SmolLM2 1.7B trials. Two drawing examples induced copying or further loops. A geometry-command experiment also failed and is **not used**. Increasing parameter count alone did not establish better-looking drawings.

The selected model answered ordinary factual, arithmetic and basic coding sanity checks coherently. It is a stronger general model, but those checks do not measure art quality. There is no claim that a blinded aesthetic benchmark was passed.

The final prompt gives it freedom to choose a simple subject. There is no drawing to copy, no character-vocabulary mask, no generated-code execution and no replacement picture. The full model vocabulary is available. A sign-aware multiplicative repetition penalty of 1.1 is applied to generated tokens before top-64 selection; sampling temperature is 0.8. Both runtimes stop at the first completed Markdown fence. A 384-token cap and a 40-column × 20-row validator reject malformed, non-ASCII, prose and strongly repeated-row output. Validation retries are bounded. These checks do not recognize the subject.

In eight consecutive runs through the actual native bridge with the final prompt, all eight outputs passed the format validator. Many remain abstract, uneven or hard to recognize. This is a convenience sample, not a statistical quality estimate, and it is not evidence that the user’s aesthetic concern is fully solved. Complete raw results are saved alongside this document; no unfavorable samples were dropped.

## Costs

Prepared buffers total 2,262,920,192 bytes. The tokenizer is 11,422,650 bytes. Each network asset is at most 16 MiB, with per-part and reconstructed-buffer SHA-256 checks. The largest GPU buffer is 194,478,080 bytes; a device whose limits cannot fit an assigned buffer falls back to watching/tiny CPU sampling rather than silently substituting another model.

| Level | Maximum layers | Identical holders for all 36 layers | Download disclosure |
|---|---:|---:|---:|
| Gentle, automatic 5% pacing | 2 | 18 | about 113–345 MB |
| More, 10% pacing | 4 | 9 | up to 458 MB |
| Most, 20% pacing | 8 | 5 | up to 685 MB |

These are model-file amounts, including allowance for the tokenizer and manifest, not total RAM or GPU memory. Endpoint holders carry vocabulary tables; the last Most holder can have only four layers. These counts are the installation's chosen allocation, not a hardware law that 4B requires eighteen computers. Internet throughput, GPU capability and slow holders affect performance. Preview support remains enabled and disclosed.

## Reproduction

Use the pinned Python requirements, `scripts/prepare-model.py`, then `npx tsx scripts/pack-model.ts .local/edition07/model-q4`. Run `scripts/reference-model.py` on that directory and `npm run test:numerics` against Vite. The source harness compares tokenizer IDs, leading predictions and top-candidate logits with native MLX, including a 399-token input and Unicode text. `scripts/art-evaluation/edition07-native.ts` runs the final prompt through the real native bridge; results vary with sampling.
