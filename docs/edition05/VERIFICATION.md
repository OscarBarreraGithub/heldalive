# Edition 05 — alien, survival and computation clarity

Date: 2026-09-16. All browser checks are headless; no visible Chrome windows are opened.

## Design and behavior

- Oscar’s `aliens.png` is white line art with transparency, not a blank drawing. It was inspected on a dark browser background. Source SHA-256: `672b99edc8e12b8c3ab018f6aa381a650f6fca395c4a738cee06dc01a09c92cb`.
- A code-native SVG follows its paired curled antennae, rounded dome-shaped head and long vertical eyes. Small feet let the alien move independently. The saucer cutaway keeps the dome, broad rim and paired hull marks.
- Flight console, drawing station, memory library and stargazing window map to existing bounded model tasks. Actual running helper jobs produce smaller aliens. Blinking, floating, greeting and idle travel are decoration, not claimed computation. Stopped state disables idle animation; system reduced-motion preferences disable all motion.
- Main message explains browser sharing and the death premise. A 32-layer meter shows real ready coverage. Active launch support is explicitly labeled as a preview; the page does not claim browser-only dependence while support is on. On phones the alien and premise both fit in the first screen.
- “Death” means generation stops, not irreversible erasure. Surviving complete groups can continue; saved weights and records permit restart.
- Local details distinguish fixed model weight bytes from task inputs and network traffic. Timed successful layer passes exclude loading and pacing rests; they are not energy measurements. They accumulate for this visit even if the tab pauses; held weights reset to zero when withdrawn.
- Read-only `/api/inputs` exposes only explicit public task fields and full prompt messages. Active tasks, or the first queued task, are displayed with whitespace-word counts and model output-token limits. No credentials, connection identities or arbitrary visitor inputs are exposed.
- The character’s system prompt places its existing warm, concise voice in the illustrated spacecraft. No new tools or execution privileges were added. Model kernels, weights, scheduling and contribution budgets are unchanged.

## Checks

- Build, TypeScript and 18 unit tests pass; the stage worker retains its previous build hash.
- Coordinator integration passes locally, including exact task-input messages, word counts, output limits, response field allowlist and GET-only endpoint behavior. Existing origin/identity, fixed-vote, coverage, two-chain, memory-revision, disconnect and reassignment checks also pass. Fixture outputs never reach production.
- UI checks pass on four pages at 320, 390, 768 and 1440 pixels: no horizontal overflow, keyboard/focus behavior, saved watch-only, station inspectors, fixed daily choice, no user message field, archives and research downloads. Saved spectators make no model-weight requests.
- Automated WCAG A/AA scans pass at desktop and phone widths, plus both dialog and station inspector and the separate studio. These do not replace human accessibility review.
- Six local display fixtures verify console, drawing, memory, stargazing, helper and stopped states; helper count follows jobs, stopped/reduced-motion animation is absent, all station controls work, and the alien fits in a 390×844 first screen. These are labeled local visual fixtures, not fabricated model evidence.
- Coffee test passes with actual WebGPU: no-click two-layer load, four-layer coffee, ten-minute expiry, saved Pause with zero subsequent weight fetches. A duplicate test locator found during the first run was corrected; no inference issue was involved.

- Sixteen untouched browser contexts completed actual shared inference. Each reported 40 successful layer passes, 317–353 ms of timed layer execution, and 11.1 MB (interior) / 37.6 MB (endpoints) of held model weights at the first completion. Removing a required holder stopped generation and froze completed token totals; restoring it completed new work. Synthetic visibility withdrawal also removed the piece. Work, loss and recovery took 26.6 seconds after loading, with two browser completions. This is a same-machine test, not a WAN speed claim. Evidence: `.local/qa/edition05/shared-result.json`.

## Operating choice

Launch support stays ON, preserving the user's prior launch setup. The pending choice to retire support was not answered by the alien design request. No production support flag is changed in this edition. Both supported-preview and browser-only UI states are verified independently.

## Limits

Inference checks use isolated Chromium contexts on one Mac, not independent physical internet hosts. They do not establish phone compatibility, WAN speed, energy usage or large-scale capacity. Browser outputs remain untrusted. Native launch support still requires the existing running host. The artwork's 16 gentle / 8 coffee counts come from chosen per-tab budgets, not the minimum hardware needed to run this small model.

## Publication

- Deployed to `heldalive.com`, `www.heldalive.com` and the Workers fallback domain. All returned HTTPS 200 with the new asset build. Cloudflare version: `baffc691-e2c7-4363-a171-302685bcc89a`; Worker startup 5 ms. Deployment verified all 452 model buffers and attribution.
- Eight real coffee-enabled browser contexts formed a complete chain on the public site. The chain completed a real task in about 48.3 seconds after loading, with source `browser` while launch support remained enabled. No production fixtures or operator switches were used. Evidence: `.local/qa/edition05/live-result.json`.
- The live input endpoint returned the actual running planner's two messages, 264 whitespace-separated words, and a 110-token output limit. Preview support remained available throughout.
- Inspected the actual published desktop, mobile and six spacecraft interaction views, plus the regenerated alien favicon and social card. [Desktop](habitat.png), [phone](mobile.png), [six views](workspace-views.png).
- The unchanged browser engine's previous numerical validation remains documented in edition 03; it was not rerun for SVG, copy and telemetry changes.

CI result and repository publication are recorded in the GitHub release. Native launch and studio services remain running; temporary local test services are stopped after verification.
