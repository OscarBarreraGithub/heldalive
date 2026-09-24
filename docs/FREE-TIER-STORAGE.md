# Free-tier storage fix — 2026-09-24

## Problem and cause

The running installation exhausted Cloudflare Durable Objects' free allowance
of 100,000 rows written per UTC day. This was confirmed by the production error
`Exceeded allowed rows written in Durable Objects free tier.` on September 18.
The September 21 deployment deliberately paused the site and stopped background
work. The initial fix was prepared without changing that pause. On September 24,
the owner requested deployment and restart; see the release record below.

The old Worker repeatedly saved the same JSON state: on every five-second alarm,
inside queue synchronization, at the end of each scheduler pass, and on each
heartbeat. It also saved every streamed chunk and model-layer result. Sampling
credited an indexed visitor record for every sampled token. This made internal
bookkeeping consume the allowance even with very few visitors.

## Changes

- Unchanged creature and director records perform zero SQL row writes. The
  comparison runs in SQL, so a rolled-back transaction cannot leave a JavaScript
  cache incorrectly claiming that a value was committed.
- Routine heartbeats update the WebSocket attachment and return a pong; they do
  not save state or run the scheduler. Visibility changes still cancel or resume
  participation through the normal scheduler path.
- Durable maintenance alarms run every 30 seconds while there are connections.
  New role preparation gets an earlier wake-up, generally one second, to preserve
  prompt dispatch and concurrent manager progress. An empty room with no pending
  publications has no recurring alarm.
- In-flight draft text and layer timings stay in memory. The assignment, logical
  role, lease and deadline remain durable before dispatch. A five-second local
  timer keeps the object awake only while it is generating and checks deadlines;
  it does not itself write a durable alarm. Completed results still save
  immediately. A process restart cancels unfinished transport leases and retries
  the same saved logical role, with a fresh lease. It cannot accept a truncated
  continuation. Completed roles and publication debt remain durable.
- Sampling credits batch for one minute; repeated daily check-ins do not rewrite
  the same record. Live profile counts include pending credits. A sudden process
  loss can lose uncheckpointed sampling telemetry, at most the last minute;
  completed research is not buffered this way.
- No archive/profile queries are made for broadcasts with no visitor recipients.
- Recovery cooldown excludes time after an expired inference deadline. Resuming
  after several days offline must not create several more days of cooldown.

## Verification

`npm run test:storage` executes the actual Worker handlers against an in-memory
SQLite database with controlled time and WebSocket fixtures. It counts changed
SQL rows and calls to `setAlarm`. The baseline uses app commit `7302523`:

```sh
node scripts/test-storage-budget.mjs --baseline
npm run test:storage
```

24-hour replay, excluding initial connection/setup writes:

| Scenario | Changed SQL rows | Alarm writes | Total |
| --- | ---: | ---: | ---: |
| Old code, one idle bridge | 69,120 | 17,280 | 86,400 |
| Fixed code, one idle bridge | 1 | 2,880 | 2,881 |
| Fixed code, 100 idle browser connections | 1 | 2,880 | 2,881 |
| Fixed code, empty room | 0 | 0 | 0 |

The comparable idle reduction is 96.67%. The one SQL write in the fixed replay
records the UTC day change. The figures are fixture measurements, not a claim
about a full day of production inference. SQLite's local change counter does not
account for all Cloudflare index billing; the steady idle cases above update only
the integer-primary-key state row. A separate test using the actual local
Cloudflare runtime confirmed the conditional state UPSERT reports `rowsWritten`
of 1 for insertion, 0 for unchanged data, and 1 for a changed value.

The same storage regression test verifies:

- 10,000 valid layer results and a 289-character draft make zero SQL writes.
- A process restart retries the same role under a new lease and rejects an old
  completion; completed output and its publication outbox survive another restart.
- A three-day deployment pause does not inflate native inference cooldown.
- 1,000 sampling checks batch into one visitor update and one state checkpoint;
  counts survive restart.
- Repeating a check-in on the same day produces zero row writes.

Also passed: 37 unit tests; TypeScript; frontend build; Wrangler deployment dry
run; real local Worker/WebSocket transport test with two concurrent groups,
browser loss, reassignment, stale-response rejection, zero-capacity pause and
subsequent progress. Transport fixtures ran locally without a GitHub publication
credential and did not run or publish fabricated model research.

## Operating limits and restart

No upgrade, DNS change, or schema migration is required. On September 24 the
owner authorized resuming the installation. The fixed app and native inference
service are now running; billing and DNS were not changed.

Deployments require the adjacent runtime containing `Director.nextPreparationAt`.
Monitor actual Cloudflare write usage during the first active day. Do not roll
back to the pre-fix active deployment to resume service.

### Deployment and restart receipt

- App source: `26dd8f5`; private runtime source: `2894c19`.
- Cloudflare version: `f6340fa3-369f-41f0-b28d-bf607100c420`.
- Verified all 580 model buffers and attribution before deployment.
- Restored the existing `com.heldalive.launch` LaunchAgent; did not reinstall the
  retired local research supervisor or change the Qwen3 4B checkpoint.
- Both HTTPS domains, health, room state and research endpoints returned 200.
- Saved completed-role count progressed from 418 to 420 after restart. The new
  researcher result was [published to the public notebook](https://github.com/heldalive/memory-research/commit/7b105e9c75198cde2dd1f9cd1ddc7e83ce01a318).
  Publication backlog reached zero with no publication error.
- Production UI checks passed at 320, 390, 768 and 1440 pixels, including all
  three destinations, mural navigation, keyboard focus and spectator behavior.
  Inspected mobile and desktop screenshots. No visible Chrome windows were used.
- Cloudflare analytics queried at 19:35:30 UTC reported 57 writes and 2,982 reads
  in the requested post-restart interval (19:28 onward), with no Worker request,
  CPU-limit or memory-limit errors. Analytics lag; this is a short observed window.
  The 97% figure remains a local idle replay measurement, not a measured
  production-day reduction.
- The audit found a separate HTTP request risk: five-second per-tab observatory
  polling. That is tracked in [finalization](FINALIZATION.md).

Useful completed work, new visitors, publication retries and indexed records
still consume writes. Browser inference also consumes WebSocket request quota.
This removes the observed waste; it does not make the finite free plan unlimited
or establish a maximum sustainable audience from an idle-only replay.

## Cloudflare references checked September 24

- [Pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/):
  100,000 free written rows/day; each `setAlarm` counts as one row written.
- [SQLite storage API](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/):
  `rowsWritten` reports the rows used for SQL billing; `transactionSync` provides
  atomic synchronous changes.
- [Object lifecycle](https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/):
  active timers prevent hibernation; in-memory state does not survive eviction.
- [Alarms](https://developers.cloudflare.com/durable-objects/api/alarms/):
  one alarm per object, with at-least-once execution and retries.
