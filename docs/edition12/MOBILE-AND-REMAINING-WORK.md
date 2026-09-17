# Mobile first encounter and remaining work

## Request

> ok so what is missing?
>
> for one, on mobile, the first screen doesn't make it clear what we're looking at. I thnk we need to reorganize mobile view

## Diagnosis

At a 390×740 viewport, the old headline began at y177, the compute panel occupied y430–671, and the living scene started at y691. The visitor met settings before seeing the alien. The title alone did not explain browser computation. The third activity metric also wrapped into an orphaned row.

## This change

The mobile reading order is now: literal browser-compute premise → alien and its workspace → Watch/Gentle/More/Most. Keep the contribution choices and immediate opt-out visible without hiding data-use details. Show the character's purpose near the scene; detailed schedule and methodology belong below. The same controls and inference behavior remain in use. Desktop keeps its two-column composition. The three activity metrics share one row.

## Remaining gaps, in order

1. **Physical mobile devices.** Measure supported browsers, model-loading bytes, time to first useful result, heat/battery impact and screen-lock/tab-background behavior on real iPhones and Android phones. Responsive screenshots are not device inference tests. This is the main evidence missing before permanent Mini retirement.
2. **Recovery during a response.** Completed roles survive a departure, but an unfinished response starts again. Transferring partial generation safely would reduce wasted work when visitors leave frequently. Other complete groups can keep working today.
3. **Research quality.** The research workflow runs and publishes, but the small model can repeat itself and overstate what a narrow source packet establishes. Add outcome-based evaluation, better source coverage and stricter claim review before calling this useful autonomous science. The system has not established a superior memory method.
4. **A reason to return.** The mural and public notebook exist. A concise, reliable account of what changed since yesterday, tied to actual new artifacts, would make daily visits rewarding. Avoid presenting repeated role calls as new discoveries.

The Mini currently supplies temporary fallback. Real usable model coverage—not the authored phone-equivalent visual counter—determines when browsers can carry the work.

## Verification

- Checked the living scene in research, art and rest states using local browser-only fixtures; no fixture data was saved to the site.
- On a 390×740 screen the scene now begins around y271, compared with y691 before. The alien and all four contribution choices fit in the first screen.
- Checked portrait widths320/375/390/430, the 768px tablet layout, and desktop1440. The smallest320×568 default CPU-only view keeps the contribution choices above y566.
- Short landscape uses a compact two-column arrangement so the alien remains visible alongside the premise.
- Existing UI checks passed on all three destinations, contribution and mural dialogs, persistent opt-out, no model downloads in Watch, and no page overflow. Automated accessibility checks passed. Typecheck and production build passed.
- Unsupported devices now see CPU-only wording instead of an inapplicable large model-download allowance. No inference or orchestration behavior changed.

Screenshots and measurements: ignored `.local/qa/edition12/`.

## Release

Deployed to heldalive.com as Cloudflare version `110b4a61-f3b6-4b33-9b48-6b28ca622387`. Live browser checks passed at 390×740, 320×568 and 844×390, with the alien and contribution choices visible, no horizontal overflow and no page errors. A landscape auto-width issue found during verification was corrected before these final live checks.
