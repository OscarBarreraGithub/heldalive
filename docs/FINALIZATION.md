# Held Alive: finalization audit

Checked September 24, 2026, after the owner approved deploying the storage fix.
This is the remaining work, not a claim that the complete original vision is
implemented. Today’s product change was the tested storage/runtime fix and service
restart. No counter, lifecycle, prompt, model or contribution-control redesign was
introduced during this audit.

## Working and verified

- Both domains serve the restored application over HTTPS.
- The existing Qwen3 4B native inference service is back; saved research resumed
  from 418 completed roles to 420. A new result reached the public notebook and
  the publication queue drained.
- The deployed storage fix removes duplicate state writes, heartbeat writes and
  per-layer/per-chunk persistence. Local idle-day replay fell from 86,400 to 2,881
  writes. Restart, dropout, stale-result and concurrent-manager checks passed.
- Production responsive UI tests passed at 320/390/768/1440 pixels. The premise,
  participation panel and alien are visible on the first mobile screen. The three
  destinations and mural open correctly; there were no page errors or spectator
  model downloads. This is viewport testing on a Mac, not physical-phone testing.

## Before broad sharing

### 1. Remove per-tab HTTP polling and verify all free quotas

`src/useObservatory.ts` fetches `/api/observatory?room=browser` five seconds after
every response, including while hidden. Ignoring response latency, that is
17,280 requests per continuously open tab per day. Roughly six continuous tabs
can consume the account's 100,000 free Worker HTTP requests/day even before other
traffic. The write fix does not solve this separate request limit.

Send research state updates through the existing WebSocket; fetch large archives
only when requested. Use explicit revisions and reconnect refreshes so data stays
fresh without repeated full-history broadcasts. Stop nonessential hidden-tab work.
Measure HTTP requests, billable WebSocket traffic, database reads/writes, and
duration during an active 24-hour run. Add a free-tier budget guard that degrades
work gracefully before hard platform limits interrupt service. Do not claim that
a single idle replay establishes a supported production audience.

### 2. Make the research useful and focused on agent memory

The resumed manager's actual question concerns linguistic recurrence in arXiv
abstracts, not a controlled comparison of agent-memory systems. The latest output
is cautious but generic. A running plan/review loop is insufficient evidence of
useful research.

Add a task-relevance check at the orchestrator/manager handoff. Define a small
initial research agenda and compare alternatives under equal token/storage budgets.
Keep explicit evidence quality and duplication checks. The current fetcher offers
at most two short excerpts and does not read PDFs; it cannot support an exhaustive
literature review claim. Broader source discovery, full-text/PDF ingestion, research
coverage tracking and a stronger quality benchmark remain needed. Evaluate any
model change against real task outputs and browser feasibility.

The runtime is still research-only, capped at eight manager loops. An autonomous
implementation/code-review workflow is not implemented. Passing the initial week
does not unlock it. GitHub is an exported notebook; the agents do not have an
unrestricted repository filesystem or access to the entire wiki in every context.

### 3. Repair reproducible GitHub checks

The current [Check run](https://github.com/OscarBarreraGithub/heldalive/actions/runs/36048134609)
fails because the public checkout imports `../../heldalive-runtime/cloud/*`, but
the workflow never checks out that private repository. Earlier runs fail too.

Set up an authorized private-runtime checkout for trusted CI runs, or separate
public checks from the private integration build. Pin the runtime revision used
for a release. Do not expose private checkout credentials to untrusted pull
requests. Local successful checks and deployment do not make remote CI green.

### 4. Verify ordinary phones and true browser-only operation

Run real iPhone/Android/laptop cohorts on different networks, recording compatible
devices, time and bytes to become useful, throughput, heat/battery behavior,
backgrounding and recovery. Current sharing limits require 18 Gentle, 9 More or
5 Most holders, and Gentle pieces download roughly 113–345 MB. Those counts are
policy allocations, not universal hardware requirements. WebGPU with float16 is
required for model layers. Unsupported browsers can perform sampling only when
shared browser inference is already running; not every visitor contributes useful
inference at every moment.

Before removing native support, demonstrate sustained complete browser groups,
replacement on dropout, and automatic progress without the Mac. Prior browser-only
tests used multiple contexts on one Mac, which does not establish phone/WAN capacity.

## Needed for the complete artwork

### 5. Implement the one-life rule

Zero capacity currently pauses generation and preserves completed work; returning
capacity resumes it. There is no grace countdown, durable terminal incarnation,
memorial transition or memory-erasure workflow. Define the incarnation and erasure
scope, test without deletion, distinguish scheduled rest/cooldown from lost usable
compute, and reject late results after a terminal transition. Public Qwen weights
remain downloadable; deleting a local copy cannot erase the model everywhere.

### 6. Give returning visitors a clear change to see

The mural currently contains one historical commissioning panel, attributed to
Luna. Keep that provenance; verify the current Qwen workflow revises and extends
it with useful drawings. Make daily progress and additions easy to find without
visitor prompts or votes. Station context changes are real, but the distinct
requested context-change animation is still deferred. The coffee-as-compute
interaction was replaced by Gentle/More/Most controls; restoring that metaphor
with selectable amounts and an unmistakable free-compute explanation remains a
product decision. The schedule gives activity windows, not 20 measured inference
hours, and funding remains brainstorming with no financial execution.

### 7. Resolve remaining specification differences explicitly

- The live counter shows actual visible sessions. It does not include the authored
  fluctuating support-equivalent number requested in earlier prompts.
- A saved compute-off switch remains in Settings.
- The footer credits Oscar Barrera and the app repository belongs to that account;
  the installation is not anonymous under the earlier request.
- The selected checkpoint is Qwen3 4B, not the earlier native 9B checkpoint.
- The README's stale counter description was corrected during this audit. Dated
  edition documents and historical model outputs retain their original context.

These were not silently altered while deploying the quota fix. Any final version
needs a single accepted specification for the display, lifecycle and controls.

## Suggested order

First address request traffic, research focus and CI; then commission real devices
and observe a full active day. Finalize the one-life mechanism and presentation
after those prerequisites. Native support remains necessary during commissioning.

Cloudflare's current [Worker limits](https://developers.cloudflare.com/workers/platform/limits/)
and [Durable Object pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)
were checked September 24. The HTTP, SQL, WebSocket and duration allowances are
separate budgets; optimizing one does not remove the others.
