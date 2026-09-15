# Verification

Initial verification on September 15, 2026, Apple Silicon Mac with 24 GiB RAM.

## Passed locally

- Strict TypeScript check, seven focused unit tests, production frontend build.
- Worker deployment dry run; local startup profiling.
- Real Ollama Qwen 2.5 0.5B inference, streamed through the authenticated bridge to the room.
- Real WebGPU model load in Chromium after explicit consent, followed by a completed 22-token browser inference (observed job wall time 1.65 seconds) and explicit withdrawal. This is one hardware observation, not a population benchmark or a guarantee.
- Unauthorized bridge rejection, foreign-origin rejection, assigned-worker-only completion, shared broadcast, persisted counters, withdrawal without fallback, note rate limiting, and public-state field boundaries.
- Desktop and 320/390/768-pixel layouts, no horizontal overflow, dialog open/close and Escape, reduced-motion layout, and no browser runtime errors.
- Spectator visits and declining the contribution dialog make no model/MLC/WASM download requests.
- Desktop and phone screenshots visually inspected. Screenshot artifacts live in ignored `.local/qa/`.

## Boundaries

- The integrated in-app browser failed during runtime setup; a separate local Playwright Chromium harness performed visual and interaction testing.
- Browser performance has not been validated on physical phones or a representative cross-browser/device matrix.
- The browser study distributes complete inference jobs, not model shards. No claim of a multi-host critical threshold is made.
- Public browser results are not cryptographically verified. Notes are rate-limited but the tiny model's personality and output are not perfectly controllable.
- Domain/live deployment verification is recorded in the build ledger as it completes.

## Live deployment checks

- Production Cloudflare site successfully streamed the same Mac-generated thought to two independent browsers. One observed warm 28-token task took 297 ms end-to-end.
- The first production browser-model download exposed missing CORS headers at the upstream model host. This was fixed using a same-origin streaming endpoint restricted to pinned, allowlisted model files. Known manifest path returned 200; unapproved filename returned 404.
- After the fix, a fresh real browser loaded the model from the deployed site and completed a 20-token thought in 1.688 seconds. After Stop and disconnect, the browser room reported zero contributors and `modelAvailable=false`; the independent Mac room remained available.
- The installed Mac bridge was deliberately restarted through launchctl and reconnected successfully.
- GitHub Actions initial check/build/dry-run passed. Subsequent final commit checks are recorded in the ledger.

- Automated WCAG A/AA scans found four low-contrast small labels; colors were corrected. Both study pages and the consent dialog then passed with zero reported violations. This automated result is not a complete accessibility certification.
