# Art and model assessment — edition 06

## Decision

Keep the existing shared **SmolLM2-360M q4** checkpoint. Do not claim the artwork is running a larger model. Art quality remains limited; these format fixes make it readable and bounded, not reliably beautiful or original.

## Small local comparison, not a general benchmark

The trials used the same subjects within each prompt family. They are exploratory, tiny samples; they cannot establish a model ranking. All generations were local MLX inference, not browser-speed measurements. Output text is preserved in the adjacent JSON files.

| Candidate | Actual tested weights | Observation |
|---|---|---|
| SmolLM2-360M-Instruct | existing pinned affine q4, group size 64 | Often prose, repeated strokes or malformed shapes without decoding constraints. The final bounded sampler produces fitted sketches but still repetitive or abstract ones. |
| Qwen3-0.6B | community q4, group size 64; thinking disabled | Often copied the example, used prose or emoji, or repeated a row. No convincing improvement on these prompts. |
| SmolLM2-1.7B-Instruct | **bfloat16, not q4** | One recognizable four-line cat with a simple prompt; other samples were repetitive boxes, lines or oversized output. Earlier few-shot output was also inconsistent. |

The 1.7B trial was initially labeled q4 in a scratch script. Its checkpoint configuration was subsequently checked: no quantization field, bfloat16 weights, 24 layers and hidden size 2048. The checked-in results correct that label. No four-bit 1.7B browser quality or speed claim follows from this trial.

Prompt families: (1) direct canvas instructions, three subjects for 360M and Qwen; (2) boat/house examples, three subjects for all three; (3) direct cat/flower/rocket/alien requests, four subjects for all three. Generation settings and runtime observations live with the reproducible scripts in `scripts/art-evaluation/`. These small trials varied prompt structure and temperature and are not an exhaustive optimization.

## Why a swap is more than a setting

The current browser pipeline is pinned to 32 layers, hidden size 960, vocabulary 49,152, q4 group size 64, and 203,614,080 bytes of unique prepared model buffers. Qwen3-0.6B has different layer/hidden dimensions and attention details; the 1.7B model also has different dimensions. Either change requires new prepared weights, allocation budgets, numerical checks, and real browser measurements. Parameter-count ratios are not measured browser transfer or performance ratios. Swapping only the preview server would make browser and preview outputs come from different models.

The next useful model project is a held-out drawing set with human ratings for recognizable subject, spacing, repetition and novelty, followed by a small art-tuned checkpoint or a demonstrably better small model. Only then prepare browser weights and test heterogeneous devices. A larger download should earn its cost.

## Changes actually shipped

The generation and display contract is 40 columns by 20 rows, at most 512 output tokens. Prompts ask for 5–12 rows and show one boat example. Subjects are chosen by the coordinator; the model predicts drawing marks.

Both native and browser samplers select from the same printable drawing alphabet. Whole tokenizer pieces are retained, including newline-plus-indentation combinations. A first attempted single-character palette caused severe repeated-stroke failures and was replaced. Removing all repetition penalty did not solve them either. The final sampler keeps the existing 0.65 presence penalty over the last 40 tokens, temperature 0.55, and the 64 highest-scoring eligible candidates. The archived native stress samples used temperature 0.65 and the earlier broader subject list; the public coordinator uses 0.55 and simpler subjects. The broad drawing-token allowlist is bounded to 2,048 IDs at the protocol boundary; the actual vocabulary subset is smaller.

Canvas checks happen before choosing a token; completed output is checked again before archival. The checks reject non-ASCII, oversize replies, ordinary prose and drawings with fewer than four visible rows or twelve non-space characters. They do **not** prove visual quality, subject fidelity or originality. Existing archived drawings keep their full text and adapt to their actual dimensions. New output is never wrapped, stretched or cropped to pass the check. Whitespace cleanup only removes outer blank space or an enclosing text fence.

## Sources

- [SmolLM2-360M-Instruct model card](https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct).
- [Qwen3-0.6B model card](https://huggingface.co/Qwen/Qwen3-0.6B); tested [MLX checkpoint at revision 73e3e38](https://huggingface.co/mlx-community/Qwen3-0.6B-4bit/tree/73e3e38d981303bc594367cd910ea6eb48349da8).
- [SmolLM2-1.7B-Instruct model card](https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct); tested [MLX checkpoint at revision 464b438](https://huggingface.co/mlx-community/SmolLM2-1.7B-Instruct/tree/464b438b25894353a54836ec5d5a09157e62aa71).

These sources establish model/checkpoint identity, not the quality conclusions; those are observations from the attached samples.
