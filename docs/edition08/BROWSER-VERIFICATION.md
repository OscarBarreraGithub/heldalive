# Edition 08 browser verification

## Actual inference

`HELD_TEST_PEERS=5 npm run test:browser` passed against the local Worker on
2026-09-17 during the UTC research window. Five isolated headless Chromium
contexts loaded their assigned Qwen3 4B layers, covering all 36 layers. Native
preview inference was not connected.

The model completed four browser jobs: two memory-writing tasks and two recall
tasks. Each recall used a fresh two-message context containing only the compressed
memory and questions. The test matched each persisted trial to an actual pack job
and an actual recall completion observed on the browser sockets.

| Stage | Method | Result | Persisted trial |
| --- | --- | --- | --- |
| Before withdrawal | Notes | 3/3 | `97a88c13-e6bb-45fe-bed0-d86388fae87b` |
| After restoring coverage | Ledger | 3/3 | `b6ecf771-3c1e-40ea-9332-f739f537d53d` |

Both stored trials include all twelve original facts, three questions, compressed
memory, actual answers, expected answers, model and source. The test recomputed
the scores from the stored answers rather than trusting the displayed count.

Withdrawing the last holder removed required layers, left no active job and kept
the completed-token count fixed at 5,971 for 6.5 seconds. Restoring its contribution
re-established coverage and produced the second recall result; the count reached
5,983. The hidden-page handler subsequently withdrew its piece as expected.

Total test time was 87.9 seconds, including initial model loading, both trials,
withdrawal and restoration. The section after initial full coverage lasted 69.0
seconds. These are test durations, not standalone inference-latency benchmarks.
Every holder reported nonzero model bytes and measured work; all five had
completed 231 layer passes at the first measurement. There were no uncaught
browser errors.

Compact evidence: [browser-verification.json](browser-verification.json).
Full local trace and screenshot: `.local/qa/edition08/shared-result.json`,
`shared-browser.log` and `shared-working.png`.

## Coordinator checks

`npm run test:integration` also passed. This suite uses explicitly local fixture
outputs and therefore does not establish model quality. It checks authenticated
sockets, origin/cookie refusal, old-checkpoint refusal, rejected votes and prompts,
partial coverage, two independent chains, exact disclosed inputs, invalid-output
rejection without credit, the pack/recall context boundary, persisted scoring,
disconnection and replacement of the missing piece.

The fixture suite follows the current UTC station: research before 20:00, drawing
from 20:00 to 21:00, and inactivity outside those windows. Only the research branch
was exercised in this run. The real-browser suite refuses to start in a rest
window and defaults to five Most holders; 9 More and 18 Gentle remain selectable.
The nine-holder restoration button now correctly returns to More.

## What this demonstrates

The experiment verifies that the browser pipeline can perform an actual small
memory task, persist enough evidence to reproduce its score, stop after losing a
required holder and resume when coverage returns. Two 3/3 results do not establish
which memory method is better. All five contexts ran on the same Mac, so this run
does not characterize internet latency, independent device failures or browser
heterogeneity. The visibility check invokes the actual handler synthetically.
