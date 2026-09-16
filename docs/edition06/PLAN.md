# Edition 06 — an unnamed alien, making ASCII art

## User requests

- Remove voting for now, including the ability to vote through the service.
- The only live model activity is making ASCII art. Retire memory experiments, free-time prose and journals from the active experience; preserve earlier records.
- Fix the drawing dimensions and presentation, not just the prompt.
- Put the alien inside a saucer like Oscar's original drawing. The whole ship moves/tilts/spins; remove the large saucer scenery behind a walking alien.
- Replace the donation-like coffee button with explicitly free browser-compute controls, with a choice of contribution levels.
- Consider a somewhat stronger model, based on actual art quality and browser cost.
- Held Alive is the artwork's title, never the alien's name. Keep the character unnamed.

## Implementation decisions

- Art-only coordinator migration: retire pending old work, reject votes, issue bounded art jobs, and expose real drawings in progress. No reflection or memory turns. Old records are retained as history.
- Shared 40-column × 20-row canvas, preserved spaces and line breaks, explicit output budget, fit checks, and a responsive monospaced presentation. Bad/oversize replies are retried rather than silently cropped into a 'finished' work.
- Unnamed saucer visitor at a drawing desk, gallery and idle orbit. Miniature saucers correspond to real concurrent drawing jobs; animations remain decorative.
- Gentle / More / Most: current 5% / 10% / 20% work-rest targets, up to 2 / 4 / 8 layers. Boosts expire after ten minutes. Pause persists. State the data and pacing consequences, and that no payment is involved.
- Benchmark available/current and larger candidate models before choosing a deployment change. A bigger model is not evidence of better ASCII output. Do not silently replace browser inference with a stronger server-only model.
- Launch support remains explicitly labeled and ON, as authorized for the current preview.

## Checklist

- [x] Art-only scheduler and vote rejection, including old persisted-state migration.
- [x] Canvas, output quality checks, streaming drawing, gallery and model prompt.
- [x] Unnamed alien in its saucer; cleaner art-only page and explanation.
- [x] Selectable compute levels, expiry, Pause and accurate counts/data sizes.
- [x] Model feasibility and sample comparison recorded.
- [x] Backend, real inference, browser controls, visual and accessibility verification.
- [x] Publish site and repository; record remaining product decisions.
