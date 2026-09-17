# Edition 10 bounded review

Two reviewer-agent rounds were used, as requested. No third round.

## Round 1

Found and fixed:

1. A second failed model call could exceed its retry cap if publication failed before terminal status was saved. The supervisor now persists terminal status before publication and checks the cap on entry.
2. An unpublished failed/interrupted role could be lost when a new loop replaced it. Terminal publication debt is drained first.
3. Inline citation URLs could bypass validation through an empty sources array. All output citation URLs are checked against the retrieved packet.
4. Reflection saw only previous reflections. It now receives a bounded digest of saved outcomes and manager reports. Its continuity informs the next orchestration decision; art remains isolated.

## Round 2

Reviewer confirmed installed Qwen inference, cooldown persistence, the four fixes above, and live-pointer publication ordering. It found one remaining citation edge: inline citations could lack source records for the next evidence reviewer. Fixed by requiring every inline citation to have a retrieved source record; a researcher with available evidence must record an inspected source, even if judged irrelevant. Added regression coverage. No third review was requested.

## Final judgment

The new model passed structured research-output validation, source provenance checks and canvas-dimension validation. This does not prove its research conclusions or artistic quality. Bounded excerpts and abstract screening are an intentionally limited initial research pipeline. A full Qwen-only multi-role loop has not yet been observed to completion; the migrated loop preserves the actual model for each historical role. Full browser orchestration offload and the later context-change animation remain future work, not completed functionality.
