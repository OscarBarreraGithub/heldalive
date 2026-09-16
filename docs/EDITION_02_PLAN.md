# Edition 02 — execution ledger

Goal: ship the visitor-powered Tamagotchi artwork on heldalive.com, preserving the Mac studio and existing research.

## Milestones

- [x] Preserve all user ideas and choose an implementable direction (`VISION.md`).
- [x] Verify the existing custom domains via public Cloudflare IPv4 with normal TLS validation; local DNS still has a propagation issue.
- [x] Build shared project/agent protocol, persistent journal, delegation queue and bounded parallel leases.
- [x] Add actual memory compression/recall experiments and lightweight independent browser checks.
- [x] Remove visitor prompt input end to end; add anonymous daily visits and fixed-choice voting.
- [x] Build the creature-centered habitat, collection, experiment and mathematics pages.
- [x] Refine and document 6 visual iterations of the creature and first-screen composition.
- [x] Verify real model planning, helper output, art, memory scores and compute withdrawal.
- [x] Verify concurrency/ownership, identity, persistence, cancellation and hostile protocol boundaries.
- [x] Verify desktop/mobile layout, keyboard controls, reduced motion and accessibility.
- [x] Publish source, deploy, verify both custom domains and document capacity/limitations.

## Implementation decisions

- Reuse Cloudflare Worker + SQLite Durable Object, one per habitat, and the existing same-origin pinned WebLLM assets.
- Public UI uses the browser habitat by default; `?room=studio` opens the Mac-backed development habitat. No automatic cloud/Mac inference fallback in the public habitat.
- Planner emits a validated project selection and bounded helper count. Helpers do artwork or memory packing/recall; a reflection turn integrates results into a bounded journal. All tasks are data, never executable tools.
- A durable task queue and independently owned leases allow parallel helper work. Limits are explicit and observed behavior is documented; 10k visitors is a future scaling target.
- Separate persisted archive from compact live snapshots. Throttle broadcasts. Preserve legacy data without importing visitor notes into new model prompts.
- Anonymous signed HttpOnly cookie, one vote and visit stamp per UTC day per browser; no login/email collection.
- Watchers can do tiny deterministic checks and disable them. Inference requires explicit consent, ~300 MB initial files, compatible WebGPU and device memory.
- Do not call duty targets exact GPU/CPU percentages. Duty is work time followed by measured rest; weight loading is outside that estimate.
- No model control over real infrastructure or arbitrary code. Browser outputs are displayed as text and cannot execute.

## Verification evidence / iterations

Record concrete commands, measured results, screenshots and unresolved limits here as work proceeds. Do not replace observations with fabricated activity or sample production data.

### Observations before deployment

- Real Chromium WebGPU runs completed planner, drawing, pack/recall and reflection jobs. First art run made two actual drawings; Stop left zero contributors, leases and new tokens.
- The first memory run copied an answer example. Removed the example, shortened compression instructions and added JSON schemas, raw replies, original records, questions and format-failure labels. Retain weak/failed results; do not manufacture a successful benchmark.
- Eleven focused unit tests, typecheck and production build pass. The large WebLLM chunks are lazy and opt-in. Spectator tests verify zero model/runtime requests.
- Six progressive creature design states were rendered and visually inspected, including a corrected shell highlight, rotation origins and 320px overflow. Native SVG and PNG sharing artwork now match the creature.
- Four pages at 320/390/768/1440px pass layout/interaction checks. Desktop/mobile/studio/dialog automated WCAG A/AA scans pass. A scrollable ASCII block was made keyboard-focusable.
- Separate process-restart test preserves the archive, counters, project and an interrupted lease, then reassigns the task with a new ID.
- Live natural tab switching could not be induced by this Chromium automation setup. The browser test instead labels and exercises a synthetic visibility event through the actual app handler; physical-device suspension remains unmeasured.
- Do not rebuild assets concurrently with connected local integration tests: Wrangler reloads can close their sockets. Release tests run after a stable build.

- Final stable-build checks passed: browser run completed nine real jobs including a fresh scored recall, synthetic visibility withdrawal, Stop and no new tokens afterwards. Mac run completed eight real delegated jobs with persisted memory trials.

### Release completion

Application source published to GitHub; CI passed. Cloudflare deployed version `c3674a86-2dbf-4471-91b6-01a61f8d9dc3`. Both custom domains, valid TLS, research assets and actual rendered interfaces passed. Live browser execution completed 12 jobs, one drawing and three trials, then stopped with zero workers, active jobs or further tokens. The updated Mac bridge completed eight real jobs in the separate studio.

All selected edition requirements are implemented. Deliberate future paths remain in `VISION.md`: arbitrary-code agents, stronger model selection, actual memory-method discovery, physics-paper processing, a staged escape story, and scaling to thousands of helpers. This edition has bounded text tools, a toy memory comparison and a maximum of eight concurrent jobs, without pretending otherwise.
