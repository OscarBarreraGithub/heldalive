# Edition 10 — full consistency audit

Requested 2026-09-17: check every prior product decision, fix stale Luna references and the zero active-role display, and verify the running installation, public notebook and site together.

## Current decisions (later prompts supersede earlier ones)

- Unnamed alien inside the user's saucer; dark browser habitat; research desk and art station; clear purpose above the fold.
- No visitor prompts, votes or daily decisions. Automatic gentle contribution, persistent Watch opt-out, selectable extra compute. No payments attached to compute controls.
- Three destinations: habitat, research methodology/progress/GitHub, high-level compute/persistence math. Fullscreen growing ASCII mural; 72 columns × at most 24 rows per section, revisions retained.
- One research manager loop. Orchestrator only delegates; manager supervises separate planner, reviewer, research worker and deliverable reviewer. At most two reviews per phase, then an explicit manager disposition. Every invocation recorded; isolated branch/worktree; shared lessons wiki.
- First week research only; refs discovered/rechecked through actual workflow. Earlier operator seed is clearly separate. Public research repository, private runtime and station prompts.
- UTC schedule: research 00–20, art 20–21, funding planning 21–22, reflection 22–23, rest 23–24. Fresh station context, persisted current activity and handoff. Funding stays planning-only.
- All-Qwen decision supersedes Luna. Actual provider migration must precede new model claims. Historical Luna records retain their provenance.
- Low host load: bounded serial inference with a measured-time cooldown, targeting 10% inference duty rather than claiming exact CPU utilization.
- Compact fluctuating phone-equivalent artwork counter stays as requested. Raw activity remains factual. A zero instantaneous role count must not misleadingly suggest the research installation has disappeared.
- Existing shared-browser Qwen3 4B engine must keep working; it is distinct from central orchestration until full offload is implemented and proven.

## Work checklist

- [x] Inspect actual running service, checkpoints, publication backlog, logs, public GitHub state.
- [x] Select and test suitable local Qwen; migrate actual provider and bounded evidence retrieval.
- [x] Enforce serial calls and persistent cooldown including failed calls; preserve restart recovery.
- [x] Verify structured research roles, evidence provenance, review caps, station isolation and mural dimensions.
- [x] Update current website, notebook instructions, runtime docs and default model names together. Preserve dated historical evidence.
- [x] Replace confusing zero-role presentation with meaningful current status.
- [x] Check schedules, funding limits, opt-out, counter behavior, links, mobile layouts and accessibility.
- [x] Verify real Qwen output reaches the live site and public notebook.
- [x] Run appropriate regression tests, publish code and deploy.
- [x] Final bounded review (at most two rounds); record residual limitations and completion evidence here.

## Known gaps at audit start

Central runner still actually uses GPT-5.6 Luna through Codex CLI. Fifteen-minute scheduling is not a measured compute budget. Current GitHub instructions and site refer to Luna. The landing page shows zero active roles during pauses despite a healthy researcher; a local status-label fix exists but has not been deployed. Browser engines remain Qwen3 4B. Full research-orchestrator offload to browsers is not implemented. A non-hat context-change animation remains a requested later visual TODO.

## Findings and corrections

- Replaced the actual hosted Luna provider with local Qwen3.5 9B, 4-bit MLX, pinned conversion revision `8b2b98c00a6b4d291155e4890773ca8f769aee53`. Browser workers remain the verified Qwen3 4B checkpoint.
- Added persisted inference-time cooldown: one bounded call, then nine times its duration at rest. Failed calls and crashes incur budget debt; this does not promise 10% aggregate CPU utilization across unrelated software or the preview bridge.
- Replaced Codex web search with planner-directed bounded retrieval from arXiv, GitHub, provider indexes and explicitly requested allowlisted sources. New refs preserve HTTP status, content hash, inspection depth, discovery queries and source annotations. Inline citations require corresponding inspected refs.
- Repaired failed-role publication/restart cases found in review, and supplied reflection with actual saved outcomes.
- Added a main-branch current-loop pointer linking to live manager-branch records; completed historical records keep their actual model provenance.
- Changed role-zero counters to Connecting / Thinking / Between thoughts / Resting / Paused / Offline. A pending first fetch no longer flashes an offline verdict or invented zero saved records.
- Retired the unused old 0.5B studio LaunchAgent; the Qwen3 4B browser-preview bridge remains available.
- Art now uses a bounded ASCII sampler. Qwen chooses the marks; the supervisor supplies record metadata. The first unconstrained JSON art test failed and was not published as a successful mural.

## Explicit remaining scope

- The central research orchestrator is server-backed. Its complete automatic offload to visitor browsers is not implemented in this release. Browser workers perform real separate Qwen3 4B experiments, and incomplete chains stop.
- No physical-phone throughput benchmark was performed. The authored phone-equivalent counter remains an artistic estimate as requested.
- The non-hat context-change animation is the user's earlier deferred visual TODO.
- Research-only gating remains enabled, funding remains planning-only, and no universal agent-memory winner has been established.
- Dated Edition 01–09 documents and earlier Luna run records are historical evidence, not current configuration.


## Release verification

- Website: Cloudflare version `c933dcac-56e7-4c38-9629-e0523885ab8b`.
- Private runtime source: commit `5904838`; installed executable files match that source.
- Actual production Qwen invocation: `research-1789613048990-08-manager-final`, completed in 62,482 ms. Its manager loop was published. API records `2026-09-17-research-268` and deterministic publication step `2026-09-17-research-269` are live.
- Runtime regression suite: 22 passing tests, including persistent budget debt, source boundaries/citation provenance, bounded review loops, restart handling, station isolation and current-loop publication.
- Site: typecheck, 23 unit tests and build passed; local observatory and coordinator integration tests passed.
- UI: all three destinations at 320/390/768/1440 pixels, persistent Watch opt-out, no spectator weight downloads, no visitor prompts/votes, keyboard dialogs and mural layout passed. Automated accessibility checks passed at mobile and desktop widths.
- Production checks: both HTTPS domains expose Qwen status and published Qwen records; no page errors. The cooldown displays Between thoughts. Evidence is in `live-verification.json` and `www-verification.json`.
- Unchanged browser inference engine retains Edition08's real five-browser WebGPU verification; this audit did not redo a physical-device/WAN benchmark.
- Exactly two reviewer rounds; dispositions and remaining limits are in [REVIEW.md](REVIEW.md).

## Model references

Model choice and architecture were checked against the [official Qwen3.5 9B card](https://huggingface.co/Qwen/Qwen3.5-9B). The installed artifact is the [MLX community 4-bit conversion](https://huggingface.co/mlx-community/Qwen3.5-9B-4bit/tree/8b2b98c00a6b4d291155e4890773ca8f769aee53), running with [MLX LM](https://github.com/ml-explore/mlx-lm). Local measurements, rather than card benchmarks, establish the commissioning results in [MODEL-VERIFICATION.json](MODEL-VERIFICATION.json).
