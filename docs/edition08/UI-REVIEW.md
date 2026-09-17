# Edition 08 UI review

## Scope and review limit

Two review rounds covered the dark observatory, three main destinations (habitat,
research and math), and the immersive mural. All browser checks were headless.
No production data, Worker code, model weights or deployment settings were changed.

## Round 1

The initial desktop and mobile screenshots exposed two inherited styles:

- The old mobile hero's `display: contents` moved the headline below the scene and
  compute controls. The observatory now keeps its headline and explanation first.
- The old habitat floor's bright gradient and top position produced a diagonal
  stripe through the scene. The new room now has a faint floor beneath its objects.

The compute selector, hover state, supporting text and footer were adjusted for
its dark palette. The hand-drawn alien and saucer were preserved.

An axe scan found one remaining contrast failure: the calculator timing footnote.
Its foreground color was corrected.

## Round 2

Updated UI tests exercise all three destinations at 320, 390, 768 and 1440 pixels.
They verify headline order, absence of page-level horizontal overflow, persistent
Watch mode, no spectator model downloads, no visitor prompts or votes, the math
controls and downloadable research assets.

The mural tests cover direct links, Escape, initial close-button focus, restored
opener focus, a text download and local horizontal scrolling that preserves ASCII
spacing. A populated mural fixture exists only in the headless test browser; it is
never published as artwork. Old collection and experiment links remain supported.

The final UI pass exposed focus restoration after opening the mural immediately
after closing the compute explanation. React Strict Mode's repeated effect setup
could replace the saved opener with a control inside the modal. The opener now
persists in a ref. This was a bounded correctness fix within the second round; the
same UI suite then passed. No additional design review cycle was started.

## Verification

- `HELD_TEST_URL=http://127.0.0.1:5173 node scripts/test-ui.mjs` — passed.
- `HELD_TEST_URL=http://127.0.0.1:5173 node scripts/test-accessibility.mjs` — passed:
  WCAG A/AA automated checks for all three destinations, contribution dialog and
  mural at 1440 and 390 pixels.
- `npm run typecheck` — passed.

Local evidence: `.local/qa/edition08/ui-review2.log`, `axe-review2.log`, and
`390-{habitat,research,math}.png` / `1440-{habitat,research,math}.png`.

No blocking UI finding remains in this reviewed version. Automated scans are not
an exhaustive assistive-technology assessment. Any later copy or layout changes
should receive the normal release smoke check, without reopening a design loop.
