# Edition 11 verification

2026-09-17. This release connects the saved agent hierarchy to shared browser inference. The displayed phone-equivalent artwork counter is not an inference scheduler input.

## Checks

- TypeScript check, production build and 36 unit tests passed. Tests cover role recovery, capacity changes, both two-review caps, invalid citations, bounded source fallback, isolated station contexts, safe Git paths, publisher retries, non-force updates and multi-source generation.
- Local transport fixtures exercised two independent groups, loss of a group, fresh transport leases for the same saved agent, stale-result rejection, zero-capacity suspension and recovery. Fixtures are local test records and were not published to the production notebook.
- A real local SQLite restart preserved manager IDs, phases, review counters and completed-call counts.
- The native provider generated a real planner response, then a real 317-token research response with 1,894 input tokens and both inspected source identifiers. This validates the matching inference contract, not the scientific truth of the response.
- Responsive UI checks passed at 320, 390, 768 and 1,440 pixels. Accessibility checks passed for the three destinations and dialogs. Visitors have no message or voting controls. Watch mode does not load model weights.
- Production website and state endpoints return 200; private supervisor controls reject unauthenticated requests. The legacy checkpoint carried 94 completed calls into the cloud supervisor. Its first real role completed and was published to the manager branch and main notebook.

## Findings fixed during commissioning

The first WebGPU run exposed an inaccessible planner URL and an unsupported source claim. The supervisor now falls back to bounded source discovery and sends validation feedback before retrying. A later run exposed a formatter bug: source choices with a common prefix prevented listing two citations. Choice terminators now preserve the full set. Paragraphs also no longer end at an opening title quote, and mural jobs use the proper artwork output allowance.

One production import attempt and status request returned 500 immediately following deployment. Subsequent authenticated status requests and the unchanged import succeeded; no persistent failure appeared in the error tail. Migration remained disabled until the checkpoint was confirmed.

## Limits

The commissioning browsers run on one Mac. These checks are not physical-phone, heterogeneous-device or WAN performance benchmarks. The sharing policy needs 18 Gentle, 9 More or 5 Most holders to cover the model's 36 layers; slower hardware, disconnections and round-trip latency can reduce throughput substantially. More connections alone do not establish usable capacity.

An interrupted response restarts from the last completed role boundary. Partial token/KV state is not transferred between groups. Complete independent groups can continue their own work. Zero usable capacity pauses model progress while the cloud checkpoint and notebook survive.

Research outputs and wiki lessons remain fallible model-authored records. Citation/format checks and a second model review do not prove correctness or establish resistance to a malicious compute participant. Two bounded source excerpts are not an exhaustive literature review. Implementation, payments and external account actions remain disabled.

## Release evidence

Final Cloudflare version: `e092c927-bab4-41ec-b903-e65f2fca8ddf` (same verified inference code; final sharing-card assets). Initial workflow deployment: `75e6801d-b7cd-413b-b64d-08dea6423d8c`.

Private commissioning artifacts are retained under ignored `.local/qa/edition11/`. Browser-only completion evidence and the final release disposition follow below.

### Completed browser workflow

Five real WebGPU browser contexts completed a 14-call research loop: orchestration, manager setup, two plan/review rounds, two research/evidence-review rounds, and final manager disposition. All recorded model execution was browser-attributed with native fallback disabled. The saved loop survived holder removal, replacement, a coordinator restart and the formatter repair. The post-repair continuation took 519 seconds; that is not the duration of the entire interrupted commissioning run.

The final disposition still overstates the literature gap in places. This remains a visible, fallible research notebook, not a validated scientific conclusion. No claim of having found the best agent memory system is warranted.

### Production browser-only proof

On heldalive.com, five headless browser contexts on this Mac completed `research-cloud-1789665847642-104-manager-plan` with native inference disabled. The actual Qwen response used 1,216 input tokens and generated 348 output tokens in 248.44 seconds, including prompt processing and network execution. The entire check, including model loading and loss tests, took 387.58 seconds. No browser page errors were recorded.

Removing one required holder removed model coverage and froze the completed-role count. The durable GitHub outbox drained, and the browser-attributed record was independently read back from the [manager branch](https://github.com/heldalive/memory-research/blob/manager/research-cloud-1789665847642/orchestration/instances/research-cloud-1789665847642-104-manager-plan.json). The check then closed its browsers and restored temporary native fallback.

### Release review disposition

Two release reviews: (1) architecture and failure paths, with the retrieval and formatter corrections above; (2) completed-cycle, production handoff, publication and share presentation verification. Accept this as a shareable installation with the stated model-quality and device-testing limits. Do not equate a passing workflow with verified research conclusions or a tested heterogeneous phone fleet. No further review loop is scheduled.

The legacy local researcher is disabled at login; its checkpoint remains available for deliberate rollback. Native inference remains enabled as fallback and is automatically unused whenever a complete browser group is available. Permanent Mini removal requires sustained real coverage, not the phone-equivalent display.
