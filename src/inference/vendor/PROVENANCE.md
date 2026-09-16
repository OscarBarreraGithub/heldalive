# Vendored inference engine

Source: https://github.com/abgnydn/zero-tvm
Revision: 04a1544a342d92beddf75a2b3cfdfc67ff23c119
License: MIT (included). Dependency closure of engine-core, tokenizer-bpe, and MLX tensor conversion copied. Held Alive changes are recorded in Git.

## Held Alive changes

- `tokenizer-bpe.ts`: direct GPT-2 ByteLevel pre-tokenization for SmolLM2.
- `engine-core.ts`: round up non-256-multiple decode dispatch widths; expose last-stage logits; add a bounded resident-dense `pipelineBatch` with queue-ordered per-token submissions and one batch readback. Skip unused output heads for earlier input tokens.
- `shaders/add_norm.wgsl`: include and bounds-check the final partial 256-element block.
- `shaders/rope.wgsl`: guard the final partial token row.

The native reference and split-stage checks in `scripts/test-numerics.mjs` / `scripts/reference-model.py` exercise these paths. Upstream also contains other model families and features; Held Alive enables only its own pinned dense-model specification. The outer loader, assignment protocol, consent UI and coordinator are Held Alive code.
