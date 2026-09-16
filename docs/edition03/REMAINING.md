# Active completion ledger — edition 03

## Verified

- Actual sharded SmolLM2-360M, 2/4/8 layers per holder, 32-layer physical coverage, up to 8 chains; only assigned weights fetched.
- Four and sixteen independent browser contexts completed real site tasks. Missing piece halted generation, rejoining restored coverage. Enhanced four-context test also completed work after replacement and verified synthetic hidden-tab withdrawal.
- Two real chains / eight generous browser contexts completed a full twelve-task memory-method workshop, including proposal, baseline/current/candidate recall, paired keep decision and journal. First experiment performed poorly and is documented honestly.
- Bounded batched prefill implemented and numerically checked; fixes the initial several-minute per-token readback problem. 16-context integrated observation: 28.099s for planner + withdrawal checks. Eight-context workshop:45.125s. These are same-Mac observations, not internet/physical-phone benchmarks.
- Coordinator fixture tests (local-only) and separate process-restart persistence tests passed.
- Units/typecheck/build pass (17 tests); Wrangler dry run passes, 475 static assets. UI responsive and A/AA checks passed; mobile creature moved above CTA and UI rerun passed. Last small prompt/grammar status changes justify final build/UI checks.
- Model assets packed with Apache license/card/NOTICE. Archive .local/smollm2-360m-q4-v1.tar.gz (185681557 bytes), SHA-256 in models/.../artifact.json. Every prepared buffer verified; asset helper/deploy preflight implemented. Model artifact is NOT uploaded yet.
- README/VISION/new architecture/numerical/verification docs updated; old edition02 architecture/verification/operations clearly marked historical.

## Still required

1. Finish 16-context numerical regression now running (`scripts/test-numerics.mjs`): exact tokenizer/native MLX logits for 27-,425-,49-token prompts. Keep results; correct any failure before publishing.
2. Refresh final ops/verification docs, implementation checklist and vendor-change notes. Remove or turn superseded `scripts/test-browser-inference.mjs` into a redirect to new shared test so it cannot accidentally exercise the old full-model flow. Add current numerical test commands. Replace stale remaining ledger at completion with accurate final audit.
3. Consider final short real memory test for recently tightened prompts / seeded case shuffle; first run proves architecture but was prior to prompt changes. No need to chase a good score; keep failures visible. Ensure genuine generated artwork is exercised in live final check (existing archive already has edition02 model art; do not fake new output).
4. Final source diff/security/lifecycle review, no secrets/untracked binary blobs. Commit and push. No subagents unless explicitly authorized (currently none).
5. Create GitHub release `model-smollm2-v1` with the already prepared model archive, checksum, source attribution. The URL is already pinned in artifact.json. Verify download and checksum.
6. Run final check/build, UI+Axe against built app, Cloudflare dry run and deploy. Do not build or modify imported app files while a browser GPU test is connected (HMR/reload invalidates it).
7. Verify live heldalive.com/www assets, manifests/partial downloads, source metadata and actual shared browser inference using new script. It tests stage loss/no fallback/recompleted task/visibility. Never run coordinator fixture tests on production. The production Mac studio remains a separate existing LaunchAgent; regression-check without changing inference mode.
8. Record actual deployed Worker version, source commit/CI, live result and limits. Stop temporary local servers at end. Mark active goal complete only then. Final response: links + central real shared-compute behavior + resource/scale caveat, concise.
