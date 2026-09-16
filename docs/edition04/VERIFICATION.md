# Edition 04 verification

Test date: 2026-09-16. All browser automation ran headlessly. No visible Chrome windows were opened.

## Behavior verified

- **Untouched visit:** real Chromium/WebGPU loaded its assigned two layers and reported ready without clicks. Downloads were observed; this was not a simulated GPU result.
- **Coffee:** clicking the cup requested four layers at a 10% pacing target; advancing only the browser clock beyond ten minutes returned to two layers/5%. Pause then survived reload with no model weight requests. Local evidence: `.local/qa/edition04/coffee-result.json`.
- **Public Mini:** the actual native SmolLM2 process completed public work with zero complete browser chains. Missing auth, wrong room, bad JSON types and GET could not toggle support. Disabling support stopped active jobs and froze token totals while the Mini stayed connected; enabling it completed new work. Evidence: `launch-result.json`.
- **Cancellation:** native generation was interrupted, followed immediately by a fresh lease; the second request waited for the cancelled Metal work, then returned a valid model-chosen JSON plan. A cancellation/reassignment race found during QA was fixed.
- **Browser handoff:** sixteen fresh, untouched headless contexts held all 32 layers. The Mini was connected with launch support enabled; browser source then completed real model work. Disabling support and removing one holder left zero jobs and no further completed tokens; restoring it completed new model work. Synthetic document visibility withdrawal also removed the required piece. All downloaded layer buffers belonged to their assigned stages. The work/loss/recovery portion took about 37 seconds after all contexts loaded, and recorded two browser completions. Evidence: `shared-result.json`. This timing is not a WAN or cross-device benchmark.
- **Restart persistence:** an isolated Worker process restart preserved the operator’s disabled-support flag, archives, counters, project and in-flight work; the orphaned browser lease was reassigned with a new ID.
- **Coordinator boundaries:** local fixture tests covered authenticated origins/identities, fixed daily votes, rejection of free-form prompts, ownership, two chains, bounded memory comparisons, revisions, disconnect and gap replacement. Fixtures never ran on production.
- **UI:** all four pages fit 320/390/768/1440px without horizontal overflow. Explanation dialog keyboard/focus, station inspector, saved watch-only, daily choices, local hello, downloads/bookmarks, math slider and research files passed. No page errors or model downloads in saved watch-only mode.
- **Accessibility:** automated WCAG A/AA scans passed at desktop and phone widths, including compute explanation, station inspector and studio. Three new low-contrast labels were darkened after the first scan. Automated checks do not establish full accessibility conformance.

## Retained numerical evidence

The browser kernels/checkpoint did not change in this edition. Edition 03 tested three native reference prompts, including Unicode, across sixteen stages: generated token IDs matched and maximum shared top-logit error was 0.02854. Its real two-chain memory workshop also remains evidence for the unchanged task/model engine. Updated workshop scripts use sixteen coffee holders for two chains; that full workshop was not repeated merely for a visual/launch change.

## Limits and honest presentation

These runs use multiple contexts on one Mac. They do not establish mobile compatibility, heterogeneous internet latency, battery percentage, or 300-user capacity. Targets describe measured work/rest pacing and exclude loading. Unsupported/data-saving/watch-only visitors may contribute no inference. Pieces can wait idle for the rest of a chain. The UI exposes actual active helper jobs; idle walks, waves and cup animations are decorative. Public model drafts and results can be wrong, and browser outputs are not cryptographically verified. No arbitrary command execution or visitor message input was added.

Production publication and final live checks are recorded below once complete.
