# Edition 06 — art only, unnamed alien in its saucer

Date: 2026-09-16. All browser checks use headless Chromium; no visible browser windows were opened.

## Delivered behavior

- “Held Alive” is the artwork's title. The character is unnamed in copy, prompts and active roles. Oscar's curled antennae and vertical eyes sit inside a single movable saucer, with paired rim marks from the original drawing. There is no giant saucer backdrop or walking body.
- The ship floats, turns and greets locally; these are decorative animations. Real additional drawing jobs produce smaller saucers. Drawing desk, saved-sketch station and orbit have inspectors. Reduced-motion preferences and the stopped state suppress motion.
- The coordinator issues only ASCII drawing jobs. Voting is rejected at the service; no planning, memory, reflection or journal jobs run. Old active/queued work is retired on first load of the new edition; old artwork, counters and historical records survive.
- A 40×20 shared canvas keeps original spacing. The generation alphabet retains whole BPE pieces, rather than forcing single-character tokens. Native and browser allowlists agree. Output cap: 512 tokens. Invalid format gets no archive entry or completion credit and has at most three attempts. Format validity is not aesthetic quality or originality.
- Watch / Gentle / More / Most replace the donation-like coffee action. The targets are 0/5/10/20 percent work/rest pacing, not exact device utilization. More/Most hold up to 4/8 layers and expire after ten minutes. Gentle holds up to 2. Watch is persistent, including after reload.
- The visible source, 32-layer meter, counts, actual held weight bytes, successful layer-pass time and exact task inputs remain inspectable. Extra model data costs are disclosed. No payment or installation is involved, but model bytes still load and can be cached.

## Verification

- TypeScript, production build and 22 unit tests pass. New checks cover whitespace preservation, rejection without cropping, invalid text, bounded drawing vocabulary/geometry and boost deadlines. Existing allocation, message validation, sampling and historical-memory tests still pass.
- Local coordinator integration: authenticated sockets; rejected voting and free-text input; no readiness without a piece; two complete chains; art-only dispatch; exact public inputs; invalid output rejected without credit; valid artwork preserved; spectator cannot complete another holder's task; missing layer cancels and replacement fills its gap. Synthetic fixtures stay local.
- Isolated durable-state migration: first read retires legacy planner/memory leases, clears the queue, archives the interrupted project and preserves drawings, counters, journal history and the disabled-support setting.
- Process restart: artwork/counters/project survive, support retirement stays saved, an orphaned drawing lease is reassigned with a new ID and completes.
- UI checks: four pages at 320/390/768/1440 pixels without horizontal overflow; dialog Escape/focus restoration; saved Watch; station inspectors; no voting or visitor message field; local greeting sends no prompt; sketch downloads/bookmarks; math controls and research downloads. Saved spectators make no model-weight requests.
- Visual fixtures: primary drawing, two additional real-count helper sprites, stopped/no-support state, supported preview, first-screen phone alien, greeting and all three stations. These fixtures test display logic, not inference.
- Actual WebGPU contribution test: untouched visit loads two layers; More loads four and Most eight; Most survives reload; ten-minute expiry returns to Gentle; Watch persists and subsequent reload makes no model-weight requests.
- Sixteen untouched browser contexts completed a real drawing. Every context reported 114 layer passes at first completion, approximately 267–390 ms of timed useful execution, and 11.1 MB (interior) or 37.6 MB (endpoint) of held weights. Removing a required holder stopped generation; counters remained frozen with no fallback. Returning restored coverage and completed another drawing. Synthetic hidden-tab withdrawal removed the piece. Work, loss and recovery took 41.3 seconds after loading, with two browser completions. These are one-Mac measurements, not WAN or phone benchmarks.
- Native/browser tokenizers and drawing allowlists agree for empty, full-width, maximum-height and actual-picture prefixes. Native final-format sample outputs are archived; larger candidate trials and their limitations are in [MODEL-ASSESSMENT.md](MODEL-ASSESSMENT.md).

## Remaining work and explicit limits

1. Better drawing quality. A stronger model is not yet justified by the small trials. The current model makes fitted but often repetitive/abstract sketches. Next use a held-out human-rated drawing set, then evaluate a small art-tuned checkpoint or an alternative model before paying its browser cost.
2. Physical-device/WAN measurements: older laptops, phones, heterogeneous networks, sustained battery/thermal behavior and churn. Isolated contexts on one Mac do not establish these.
3. End the preview when ready. Launch support remains ON under the existing launch decision; the site says so. Browser-only survival is implemented and tested locally, but is not falsely advertised as already active in production.

Browser outputs remain untrusted; there is no proof of honest GPU execution. Saved weights and drawings survive stopping, and returning compute can restart generation. This is an artwork about dependence, not literal consciousness or irreversible death. The eight-chain and 300-connection limits are not large-scale performance claims.

## Publication

- Automated WCAG A/AA scans pass for all four pages at desktop and mobile widths, contribution dialog, station inspector and separate studio. These do not replace human accessibility testing. Low-contrast paper captions found during QA were darkened.
- Deployed to `heldalive.com`, `www.heldalive.com` and the Workers domain; all returned HTTPS 200 with the current asset build. Cloudflare version: `67aa66e7-daa3-4908-be49-2c71cf594410`; Worker startup 6 ms. Deployment verified every prepared model buffer.
- Reinstalled both native services with the updated output budget; the launch service also includes the shared drawing specification. The public preview completed genuine new art from the pinned 360M q4 checkpoint. Its live task inspector reported 82 input words and a 512-token output cap. Launch support remains enabled.
- Inspected the actual published [desktop](habitat.png), [phone](mobile.png) and regenerated sharing card. Screenshots show actual public output, not inserted demonstration art.

- Four real browser contexts at Most formed a complete chain on the public site and archived a genuine browser-sourced drawing in about 36.0 seconds after loading. Launch support stayed enabled and was not used for that drawing. No fixture output or production support-switch changes were involved. These contexts shared one Mac; this measures the public relay path, not four independent computers.
- Summarized actual output/measurement evidence is in [inference-evidence.json](inference-evidence.json). Raw local QA logs remain in `.local/qa/edition06/`.
- Repository publication and CI status are attached to the `edition-06` GitHub release. Temporary test workers are shut down; persistent launch/studio services remain running.


