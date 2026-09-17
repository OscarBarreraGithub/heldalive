# Edition 09 — phone-equivalent compute scenario

## Request

> right we don't need the exact numbers. ok so lets go with a rough estimate since we have to simulate the numbers anyway. you're doing this

Context: the user wants an authored, fluctuating compute-equivalent display for a largely phone-based audience. The reference workload is the current Qwen3 4B at a hypothetical 10% of the M4 Mini's sustained inference capacity. It is not a visitor headcount.

## Implemented estimate

Central value: **100 phone-equivalents**.

Assume a reference phone's browser achieves 2% of the Mini's full-speed useful inference throughput on the same workload, then contributes at a 5% duty target. Its contribution is 0.02 × 0.05 = 0.001 Mini-equivalents. A 0.10-Mini workload divided by 0.001 is 100 phones.

The phone speed is an unmeasured scenario assumption, not a benchmark. Varying it from 1% to 10% gives 200 to 20 equivalents, before distributed execution overhead. These are sensitivity examples, not confidence limits. Device compatibility, memory limits, prompt length and networking can substantially change feasibility.

The displayed integer varies smoothly between 86 and 114 using three bounded sine components of absolute time. These authored fluctuations describe no measured arrivals, utilization, availability or research progress. The displayed estimate always carries a simulation label, including on mobile; the math page explains the assumptions and the fluctuations. No fake visitor connections are created.

The actual connected-tab count remains in the measured activity row, labeled explicitly. Model pieces, active roles, completed work, raw APIs and publication records are unchanged. The number does not control inference, claim an enforced 10% server limit, or establish that a browser chain meets a throughput target. The existing 18-Gentle-browser layer-allocation rule is a separate implementation constraint.

The central researcher continues to use its disclosed actual model. This frontend change does not silently convert it to Qwen or alter the research scheduler. A complete local-Qwen orchestration migration would require a separate implementation and quality assessment.

## Validation

Check the shared scenario remains bounded, simulation labels remain visible at mobile/desktop widths, actual counts remain independent, Watch downloads no model weights, and the existing navigation/mural/compute controls remain usable. Deploy only after type checking, build, existing tests and UI/accessibility checks pass. Record the production version below after deployment.

### Completed local checks

- Type checking, all 23 existing unit tests and the production build passed.
- A 24-hour sample at five-second intervals checked 17,280 scenario values: minimum 86, maximum 114, baseline 100.
- Headless UI checks passed at 320, 390, 768 and 1440 pixels, including persistent Watch, all three destinations, mural controls and simulation labels.
- A 320-pixel default-participation check verified the header fits and its simulation label remains visible; model downloads were blocked for this layout check.
- Desktop/mobile accessibility scans passed after adding an underline to the explanatory link.
- The simulation has no write path to the backend, no extra network requests and no effect on inference scheduling. Hidden tabs skip its five-second updates. Actual counts remain separate.

### Production

Deployed application commit `ae42154`, Cloudflare version `e968eaa9-beb4-4a61-ad85-9e0b396851c9`, to heldalive.com and www.heldalive.com. Live headless checks at 320, 390 and 1440 pixels confirmed visible simulation labels, bounded values, readable methodology, no overflow or page errors, and actual displayed tab counts matching the coordinator API. See `live-verification.json`.


## Follow-up: simplify the presentation

User: “stop with the simulated estimate and that. just make a number. and it needs to fluctuate. it is fine” and “Im telling you. it is an art piece.”

The landing page now has one compact fluctuating phone-equivalent number in the header. Removed the simulation badges, approximation sign and duplicate explanatory card. The linked math page retains the reference assumptions and describes the changing rhythm as authored for the artwork. Actual connected-tab counters and inference remain independent. The earlier descriptions of prominent badges above document the initial version and are superseded by this follow-up.


### Consolidated presentation

User: “you also dont have to distinguish the "real connections" literally just put it al together and it will be ok. this is just an art piece more than anything. do not put a disclaimer. it is fine, I assure you”

Final presentation: one header count, labeled phone-equivalents. It adds currently ready browser contributors to the authored 86–114 baseline. Removed the separate connection/model-holder counters, the extra explanatory panel on the math page and the stale FAQ claim that no compute display was simulated. Watch-only tabs add no compute. Active roles, actual worker jobs and saved records remain factual. Raw coordinator APIs, scheduling and research artifacts are not changed. This section supersedes the earlier presentation and its initial UI assertions; the mathematical assumptions above remain the internal source record.

Compact presentation checks: type checking, 23 unit tests, build, existing UI checks at 320/390/768/1440 pixels and desktop/mobile accessibility scans passed. The display no longer contains the simulation badges, duplicate estimate card or separate connected-tab readout.
