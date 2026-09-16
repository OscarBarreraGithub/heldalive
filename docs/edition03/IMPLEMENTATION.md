# Edition 03 — collective inference

## Acceptance contract

The previous edition used a complete model in each contributor browser. It did not fulfill the central idea. This edition is complete only after one real model forward pass is executed across independent browser contexts, stopping on loss of required coverage and recovering without a server inference fallback.

## Requirements and work ledger

- [x] Preserve all ideas in ../VISION.md; retain alternative concepts separately from the chosen product.
- [x] Validate a 32-layer SmolLM2-360M model, quantized to four bits, with native-reference and split/unified numerical checks.
- [x] Fetch only assigned model layers and the appropriate input/output weights; no manual installation.
- [x] Schedule contiguous pieces across consenting browsers: gentle 2 layers, medium 4, generous 8. Display actual layer coverage. Minimum contributors depends on capacity, not an invented critical count.
- [x] Enforce contribution budgets, immediate Stop, visibility pause, watch-only and unsupported-device fallback.
- [x] Use a tiny browser contribution for real inference work, with opt-out and accurate explanation.
- [x] Run the original and its delegated helper jobs through complete shared pipelines. More complete pipelines enable concurrent helpers.
- [x] Allow bounded, inspectable model-authored memory methods and persistent workspace revisions, comparative tests, free time and saved art.
- [x] Preserve daily participation, fixed votes, community activity and no visitor text input.
- [x] Update the Tamagotchi, first-screen explanation, pipeline visualization, collection, experiment and mathematics.
- [x] Verify disconnects, missing coverage, malicious/stale messages, local persistence and model-output failure handling.
- [x] Verify responsive layouts/accessibility and real multi-browser inference; publish measured limits.
- [ ] Publish source, deploy Cloudflare, verify heldalive.com. Keep Mac studio separate.

## Engineering choices

A pipeline applies consecutive transformer layers, passing the hidden vector to the next browser. It is real distributed inference, but internet round trips make it slower than running the same model on one device. Gentle contributions intentionally trade speed for smaller per-device resource use. Saved weights and memories survive an empty room; ongoing cognition does not. This artwork therefore uses “alive” metaphorically, not as a claim that a process or its information can never be restarted.

Model: official HuggingFaceTB/SmolLM2-360M-Instruct, revision a10cc1512eabd3dde888204e902eca88bddb4951. 32 layers, hidden width 960, 15 attention heads, 5 KV heads, head dimension 64, FFN width 2560, vocabulary 49152, tied embedding/output weights, no attention bias. Any published resource numbers must come from the prepared artifact and browser measurements.

Inference engine: MIT-licensed zero-tvm WGSL engine, vendored at a pinned revision and restricted to the needed model path. No upstream deployment scripts or arbitrary model-generated code are executed. Reference calculations run locally only during development, never as a production fallback.

## Current verified progress

- Native MLX comparison caught and corrected a silent width-divisibility bug in the engine before integration.
- Actual 4-stage and 16-stage browser-context inference completed the reference prompt with identical generated token IDs to the intact engine. These are same-Mac tests, not WAN benchmarks.
- Four independent site visitors with eight layers each completed the public scheduler's real model tasks. Removing one produced incomplete coverage, no active job and no further tokens; rejoining restored coverage. Evidence: `.local/qa/edition03/shared-result.json`.
- Public tiny contributions now perform real next-token sampling, not only score checks. They are bounded, optional, and cannot substitute for missing transformer layers.
- Planner grammar, model-written method revisions, a full two-chain workshop, responsive layouts and automated accessibility checks are implemented and tested. Final publication and live checks remain.
