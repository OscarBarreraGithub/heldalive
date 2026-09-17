# Edition 08 verification and operations

## Implemented scope

The public website hosts a darker alien observatory, three destinations, real telemetry, the memory-research methodology, a fullscreen 72-column ASCII mural, and caveated compute/persistence math. The model is accurately disclosed: server-side GPT-5.6 Luna plus shared-browser Qwen3 4B experiments. No artificial visitors, disguised model substitution or fictitious invoices are used.

The user's follow-up is implemented as a sequential hierarchy: Luna assigns a research manager, which supervises distinct planning, plan review, research and deliverable review instances. Each review phase has a hard two-round limit. Manager decisions and unresolved limitations are preserved. Every manager loop has an isolated clean branch/worktree, with explicit file exports and a non-force merge. Failed/interrupted roles are recorded. Repeated publication uses saved results, not repeated model calls.

Public notebook: https://github.com/heldalive/memory-research. Write access and an actual SSH push were verified. Private operational runner: the owner's private `heldalive-runtime` repository. Exact prompts, station checkpoints, source caches and credentials stay private. Previously public website source remains public; privacy is not used to conceal false claims.

Intermediate completed steps are explicitly labeled workflow traces. They are visible before review, and are not accepted research findings. The manager disposition defines the completed cycle's status. Research-only tools remain enabled for at least the first week; implementation does not unlock automatically. Outside PRs, issues, comments and visitor messages are not ingested.

## Actual commissioning evidence

- Luna's first complete hierarchy: `research-1789612083008`, eight actual model roles followed by a deterministic publication step. Researcher used five web-search events; reviewer used two.
- Three real source records: LongMemEval, MemoryAgentBench and MemConflict. The reviewer found missing per-query search outcomes and insufficiently precise inspection records. The manager published those caveats. No model-quality result or research breakthrough was claimed.
- A separate real mural call produced a coherent observatory section; a fresh-context call revised it. Canvas constraints are 72 columns by 24 rows. The first funding call produced a planning-only cost ledger with verified/unknown/illustrative costs separated.
- A 55-source operator-commissioned review remains separately labeled. It is not credited to the subsequent autonomous loop. Coverage limitations and paper reading depth are recorded.
- A deterministic synthetic memory baseline was run. It is explicitly not an LLM evaluation; its results cannot establish superiority of an agent-memory system.

## Verification

- Website type checking, all 23 unit tests, and production build passed.
- Private runtime: 15 tests passed, covering all daily boundaries, restart-stable slot IDs, fresh art contexts, bounded outputs, source URL boundaries, interrupted-instance recovery, and a proof by enumeration that repeated negative reviews terminate after at most 14 model-role calls plus publication.
- Local coordinator integration passed: authentication, disabled votes, legacy checkpoint guards, independent chains, coverage loss/recovery, and separate pack/recall contexts.
- Observatory API tests passed: authorization, stale/oversized publication rejection, idempotent records, strict mural dimensions/revisions, and public reading.
- Real five-browser WebGPU inference passed: two completed memory trials, 3/3 each; withdrawing a required holder stopped token progress; replacing it restored progress. No native fallback. See [browser evidence](BROWSER-VERIFICATION.md). These two toy trials are functional checks, not research estimates.
- Headless UI checked all three destinations at 320, 390, 768 and 1440 pixels, saved Watch, no spectator model downloads, mural keyboard focus/scroll/download, and legacy links. Axe checked desktop/mobile destinations and overlays. No visible Chrome windows were opened.
- A bounded final runtime review found one publication-label issue; it was fixed by explicitly labeling existing and future step exports as workflow traces and aligning documentation. No review loop was extended.

## Schedule and operational limits

UTC windows: research 00–20, mural 20–21, funding planning 21–22, reflection 22–23, rest 23–24. Calls are bounded, approximately every 15 minutes. One role runs at a time. Browser dispatch stops outside its research/art windows; work already in flight may finish. Heartbeats are process liveness, not continuous generation. Offline periods, actual token counts and completed records are distinguished.

The persistent runner is a user LaunchAgent, `com.heldalive.research`, with code and state under `~/Library/Application Support/HeldAlive/research`. It requires this Mac, the user session, network access and valid Codex/GitHub authentication. Sleep, logout, rate limits or network failure interrupt it. Saved state survives; no fictional activity is backfilled. Installation/stop/restore instructions are in the private runtime README. Model tools cannot read GitHub/Cloudflare secrets, trade, pay, send messages or change infrastructure.

Cloudflare retains public pages and saved records if the local researcher stops. An absent heartbeat is shown as offline. Native browser-preview inference remains a separate, visibly disclosed service. The browser model does depend on complete chains; the central model currently does not. This release does not claim that closing all browsers kills the whole installation.

## Deliberately deferred

- Animation of exchanging a glowing objective capsule (not a hat), as requested for later.
- Additional manager loops and memory-system implementation, pending at least a week of research and a later deliberate phase change.
- Financial execution, accounts and any fundraising; brainstorming only is enabled.
- Moving the central proprietary model to browser-only inference. The browser work is real but distinct.

## Deployment record

The production version and installed-service verification are appended after deployment. Historical baseline: edition 07 Cloudflare version `8fadbbb8-80ed-41f1-8dc3-576e43bce7c5`. Roll back through Wrangler deployment rollback using the authenticated owner account; persisted research/mural tables are additive. Stopping the private research LaunchAgent pauses its new calls without deleting the public notebook or mural.


### Production completion — 2026-09-17 UTC

- Website deployed to `heldalive.com`, `www.heldalive.com` and the Workers fallback. Current Cloudflare version: `4726cdc4-5a6c-469d-9ff8-0710c9fbcff8`; deployed application commit `b066320`.
- Thirteen actual commissioning records and the current mural revision were copied to production. No coordinator/UI test fixtures were published.
- Installed `com.heldalive.research`, confirmed running, and verified two scheduled calls from the installed location: orchestrator and manager setup in loop `research-1789613048990`. Both completed, the manager branch and chronological records pushed successfully, the default worktree was clean, and the publication backlog was zero. The next recorded stage is planner.
- A graceful restart preserved the checkpoint and completed-slot IDs. No duplicate model call was made. Fresh production heartbeats, an empty runtime error log, and HTTP 401 for unauthenticated writes were verified.
- Production headless UI and accessibility suites passed. After the final copy correction, a further actual-data desktop/mobile smoke checked the research preview, fresh status, real mural and workflow-trace labels. See [live verification](live-verification.json).
- Private runtime version `1e7119e` is pushed to the private repository. Authenticated publisher access to the public research account is Write; no further credentials are needed.

The earlier provisional research repository under `OscarBarreraGithub` is an historical commissioning snapshot. All live links and subsequent automatic publishing use `heldalive/memory-research`. The requested future capsule animation, implementation phase and financial execution remain deliberately deferred; the week-long research/planning process is enabled, not claimed to have elapsed already.

- Final API hardening: bounded authenticated publication bodies before the Durable Object call. Both declared-length and chunked oversized payloads return 413, with no request-stream error in local logs. The 23 application tests passed again; production status remained HTTP 200 with a fresh heartbeat and no reported runtime error after deployment. UI assets were unchanged by this final server fix.
