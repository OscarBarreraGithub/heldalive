# Creature design record

Six progressive implementation passes are preserved in `creature-1.png` through `creature-6.png`; `six-passes.png` shows the inspected comparison. These are design states, not six independent user studies. The local development query `?design=1` through `?design=6` reconstructs them. Production always uses the sixth design.

1. **Silhouette:** a compact mint pixel body in a coral handheld shell. Keep the outline legible at phone size and the face centered.
2. **Character:** a sprout, soft cheeks, darker feet/body edge. The sprout distinguishes Held without needing a label.
3. **Expression:** open eyes with highlights, blinking, sleeping lines, small smile and local greeting. Work/rest expressions correspond to availability; they make no claim of feelings.
4. **Setting:** feet, an arm, small clouds, a gridded LCD and quiet ground. Keep scenery faint so the face remains the focus.
5. **Finish:** shell gradient, inset bezel, shadow and thin highlight. Visual inspection caught an unintended black triangle from an unfilled SVG path; explicitly setting `fill="none"` fixed it. The screen gradient now uses correct SVG coordinates.
6. **Interaction and responsive finish:** a local hello/bounce/wave, real-job helper badge, status tag and reduced-motion support. Corrected the sprout and arm rotation origins, and reduced the device at 320px after an overflow test found two extra pixels.

The contact sheet uses reduced motion. The open-eyed examples use the real local greeting control; no model work or visitor counts were fabricated for these pictures. Live inference screenshots remain in ignored `.local/qa/edition02/` because the local test habitat also contains clearly marked protocol fixtures.

The first screen pairs “This little AI runs on us” with a short explanation and opt-in button. Desktop presents the creature beside the message; phones show the purpose and button first, then the creature. Spectators can disable tiny checks. The studio has its own truthful headline and source label.

Recreate the comparison with the local Vite/Worker servers running:

```sh
node scripts/capture-design.mjs
node scripts/capture-social.mjs
```
