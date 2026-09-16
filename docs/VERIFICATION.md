# Edition 02 verification

Date: 16 September 2026. Development machine: Apple Silicon Mac, 24 GiB RAM. This is a record of exercised behavior, not a security or performance certification.

## Build and focused checks

- TypeScript, 11 unit tests and production build pass (`npm run check`).
- Deployment dry run passes. Approximately 43 KiB Worker bundle before compression; frontend entry approximately 278 KiB JS plus 40 KiB CSS, before compression.
- The WebLLM runtime is a large lazy chunk and triggers Vite’s size warning. Its roughly 6 MB runtime modules and model assets load only after inference consent. Watching/declining consent produces zero model/MLC/WASM requests in the UI test.
- Existing research sources, figures, numerical inputs/outputs and the prior two-round audit/review are packaged alongside the public PDFs. The website adds an illustrative throughput calculator; it does not refit the earlier research or claim real AI propagation rates.

## Protocol and persistence

`npm run test:integration` uses marked fixtures on localhost only. It passed signed-cookie authentication, foreign-origin/forged-cookie rejection, daily vote/visit deduplication, no free-text protocol, parallel helper assignments, assigned-owner completion, disconnect reassignment, persisted drawings, memory packing/recall/exact scoring, audit credit deduplication, all-worker withdrawal, no Mac fallback and public/private field separation.

`node scripts/test-persistence.mjs` launches a separate local Worker, completes one drawing, interrupts a second lease with a full process restart, and checks retained archive/counters/project. The remaining drawing is reassigned with a new lease ID and saved. This passed.

Tests must run after the frontend build completes. One concurrent build invalidated connected local test sockets through Wrangler’s asset reload; the protocol suite passed when rerun against the stable build.

## Actual model execution

Real headed Chromium WebGPU sessions loaded Qwen after explicit consent and performed planning, delegated drawings, compression, recall and reflection. The first art session created two drawings and stopped with zero contributors, active jobs or new tokens. Local test state also contains protocol fixtures, so cumulative local scores are not reported as model benchmark results. Actual model evidence uses only newly generated records and per-run counter differences.

Early recall replies copied the example answers. Removing that example and using structured JSON reduced this interface failure; weak or incorrect answers remain visible. Raw replies, response-format status, questions, original records and truncation flags make failures auditable. The model sometimes invents claims in its journal. The site explains that recorded results, not narration, are evidence.

The automated browser could not naturally become hidden when switching tabs on this Mac. The final browser test therefore explicitly labels a synthetic visibility event through the app’s real handler. It verifies withdrawal/interrupt behavior, but does not establish how every real device suspends tabs. Explicit Stop and later absence of new generation are tested without that override.

Live release observations are appended below after deployment.

## Interface and creature

- All four pages at 320, 390, 768 and 1440 pixels: no horizontal overflow.
- Consent dismissal, Escape and focus return; no model download while inspecting or declining consent.
- Tiny-check opt-out and daily vote persist after reload. Greeting animates locally without a model prompt. No visitor text input.
- Gallery bookmark and plain-text download; corrupt local bookmarks do not crash it.
- Calculator changes with its inputs; both research PDFs and source audit return successfully.
- Six progressive creature states rendered and visually inspected; corrected a shell highlight, screen gradient, limb rotation origin and 320px overflow. See `design/README.md` and `design/six-passes.png`.
- Desktop and mobile WCAG A/AA automated scans pass on all pages, the consent dialog and Mac studio. Fixed contrast failures and made overflowing ASCII blocks keyboard-focusable.
- No page JavaScript errors in the checked UI paths. Reduced-motion layout is exercised; production always uses the finished creature design.

## Remaining limits

- One Mac’s GPU observations are not representative device benchmarks. Physical phones, Safari/Firefox inference and constrained-device memory were not exhaustively tested.
- Eight concurrent job slots and 300 room connections are configured limits, not tested public capacity. Independent helpers were tested; no 10k-user load or thousand-agent demonstration is claimed.
- Browser outputs are untrusted. Score checks do not verify genuine inference. Anonymous cookie identities are not people and do not prevent Sybil voting.
- The memory task is a tiny synthetic demonstration with repeated case patterns; it does not establish improved general memory or intelligence. Model weights remain fixed.
- The public habitat runs complete copies and pauses when workers leave. It does not shard a thought, impose a fake critical mass, or erase saved state on departure.
- Automated accessibility scans do not replace screen-reader and human usability review. Generated public text can still be wrong or unsuitable.
