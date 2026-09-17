# Edition 11 — one browser-powered agent system

## Request and scope

2026-09-17: finish the integration described in the conversation. The alien delegates to managers; managers run bounded plan/review/research/review loops. Browser connections supply interchangeable inference capacity, not separate toy exercises. Scale concurrent manager loops with complete browser model groups. Preserve agents and completed work when a connection leaves. Retain temporary local fallback, but prove the full workflow can run with it disabled. Deploy a share-ready site. Existing artistic phone-equivalent display is outside scheduler capacity calculations.

## Implementation decisions

- Cloudflare owns durable agent contexts, role transitions, job leases, publication outbox and station schedule. No local supervisor dependency after migration.
- Use the existing pinned Qwen3 4B checkpoint for all roles on browsers and the matching temporary native provider. Historical Qwen3.5 9B/Luna records retain provenance.
- One independent manager loop per usable inference group, capped at eight for this installation. Dependencies inside a loop remain sequential. Spare groups retry work lost elsewhere. An idle/cooling fallback must not count as extra browser capacity.
- Browser loss invalidates the inference lease, not the saved agent. Retry from the last completed role, with a new lease ID so delayed responses cannot commit. No promise of zero interruption below sufficient capacity.
- First research phase remains read-only research. No arbitrary model-generated code, payments, account actions or visitor prompts.
- Fresh station prompts; retain mural, funding planning, reflection, rest schedule. Never put credentials into browser jobs.
- GitHub API publisher writes bounded notebook paths and manager branches; publish retries are independent of model work. No force pushes or rewriting historical records.

## Checklist

- [x] Durable cloud director and compact role contracts; two-review limits and repetition protection.
- [x] Real browser/native role inference, larger bounded context, matching generation protocol.
- [x] Browser-first dispatch, capacity scaling, loss recovery, stale-result rejection, stop/resume.
- [x] Planner-directed sources, reviewer evidence, shared wiki and isolated branch publication.
- [x] Station isolation and artwork/funding/reflection continuity.
- [x] Site live roles, workflow explanation and removed toy-work claims.
- [x] Meaningful state-machine, transport, restart, publication and device-budget tests.
- [x] Actual WebGPU role generation and browser-only workflow validation; no visible Chrome windows.
- [x] Deploy, migrate saved continuity, retire local research supervisor, verify GitHub/live site.
- [x] Record measured limits and release evidence. Maximum two review rounds.

## Constraints / evidence to preserve

Physical phones and WAN conditions have not been benchmarked. Browser output is untrusted; roles are bounded and publication paths are supervisor-controlled. The displayed artwork counter is never used for scheduling. More clients do not imply more complete, capable model groups. At zero inference capacity no role completes; saved work remains.
