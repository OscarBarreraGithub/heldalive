# Edition 03 verification

This is a record of what was tested, not a claim that every browser or internet connection behaves the same way.

## Actual inference

- Native MLX quantized reference, intact WGSL inference, four-stage and sixteen-stage WGSL inference were compared on a pinned reference prompt. The same generated token IDs were obtained. Floating-point logits differ slightly; see NUMERICAL-NOTES.md.
- The final sixteen-context regression also checked exact tokenization and native leading predictions on 27-, 425- and 49-token prompts, including Unicode. Maximum shared top-ten logit error was 0.028542; raw results and reference prompts are committed.
- A silent dimension bug was caught before integration and corrected. Tokenization was checked against the actual model tokenizer.
- The batched stage primitive produced exactly the same top logits as sequential sixteen-stage execution on the reference prompt. It preserves queue ordering while avoiding a separate GPU readback for each input token.
- Sixteen separate browser contexts each held two layers in the actual application. One planning turn completed, selecting a memory project. Withdrawal made the model unavailable and stopped token production; rejoining restored coverage. The measured observation interval, including the final withdrawal check, was 28.099 seconds for that local test. This is one Mac with sixteen contexts, not sixteen independent physical devices or a WAN benchmark.
- Eight generous contributors formed two real inference chains and completed a twelve-task memory project in a 45.125-second test interval. A model-written proposal was tested against the current method and three baselines; both current and new methods scored 0/3 in that run, so the current instruction was kept. The result is poor and remains recorded as such. It is not evidence of improved general memory.
- The native model also produced weak records and drawings. Prompts were tightened and packing/proposal temperature reduced; no successful outcome is fabricated to hide model limitations.

- A final local art check used a fixture only to select a plant-drawing project, then four real browser holders generated both drawings and the journal. Withdrawal/recovery passed again. Raw model output is preserved in `evidence/art-workshop.json`; it was not inserted into the public archive.

## Application behavior

- 18 focused unit tests cover contribution budgets, actual layer coverage, gap replacement, unequal allocations, bounded activations, candidate IDs, sampling, output grammar, origin boundaries and task data handling.
- Local coordinator fixtures cover signed identities, fixed choices, refusal of visitor text, incomplete coverage, two complete chains, model-written instructions, paired method decisions and public file revisions. These are fixture tests, not GPU proofs, and cannot run on a public origin.
- A separate local Worker process was restarted during an unfinished task. Archive, counters and project survived; a fresh four-holder chain received a new lease and completed the requeued drawing.
- All four UI pages were checked at 320, 390, 768 and 1440 pixels: no horizontal overflow; consent, focus, Escape, watch-only, vote persistence, local greeting, archive downloads, calculator and research links passed. Spectators fetched no model weights.
- Automated WCAG A/AA checks passed on desktop/mobile pages, the contribution dialog and the separate Mac studio. These do not replace human accessibility testing.

## Trust and limits

No honest-GPU proof is implemented. A holder can forge intermediate or final output. Token sampling, score checking and content hashes serve specific bounded purposes; they are not a Byzantine consensus system. Anonymous cookies do not establish unique humans.

Measured GPU buffers ranged from 13.9 MB for a two-layer interior stage to 81.5 MB for an eight-layer output stage. Browser/JavaScript/caching and shader overhead is additional. Physical phones and all browser engines have not been exhaustively tested. The eight-chain/300-connection configuration is a bound, not a demonstrated large-scale capacity.

The model is intentionally tiny and weak. Closed-vocabulary recall, one small paired comparison, finite synthetic cases and repeated model sampling limit scientific interpretation. The original and helpers have bounded text tools; there is no arbitrary code execution or unsupervised access to hosting accounts.

- Final headless workshop after the rate-limit fix completed all twelve tasks without reconnect churn. The current instruction scored 1/3 and the candidate 0/3, so the incumbent stayed. This run includes the revised packing prompts; it remains a tiny, poor-quality result rather than evidence of meaningful improvement.

## Test interruption

A later headed workshop rerun was stopped on request because its separate Chrome windows disrupted the desktop. It is not counted as a pass. Browser test scripts now default to headless Chromium; headless WebGPU/float16 availability was verified on the development Mac.

## Final fixes

- Planner subject syntax now permits the model to end a short subject naturally; previously rejecting its closing quote forced unnecessary trailing text. A regression test covers early subject completion.
- Longer headless generation exposed an overly low 180-message/second per-socket limit: a fast driver routes several stage requests per output token. Its socket closed with code 1008 and repeatedly restarted unfinished work. Ready holders now have a bounded 600-message/second allowance; spectators retain 180. Ownership, task lease, payload and position checks still apply.
- Pending tiny-sampling attachments retain only allowed token IDs, avoiding unnecessary float scores in Durable Object hibernation attachments.
- Final local coordinator tests and GitHub checks passed after these fixes. A source staging omission caused the first CI build to fail; the coordinator was then included and the following CI run passed. No broken edition was deployed.

## Publication checks

Published and verified on 2026-09-16:

- Application source commit: `47147bb` (later documentation/test-only commits do not change the deployed bundle).
- Cloudflare Worker version: `806b653f-f635-4060-8be6-8927aa061e6a`.
- GitHub CI: https://github.com/OscarBarreraGithub/heldalive/actions/runs/35139905598 — passed.
- Model release: https://github.com/OscarBarreraGithub/heldalive/releases/tag/model-smollm2-v1. The actual published 185,681,557-byte download matched SHA-256 `14e0451adebe99556b756afb170f9b4b88e37aa00ed41153068dce993bbbf150`.
- Both custom domains and the Workers hostname returned valid HTTPS, the new app bundle and the 452-buffer model manifest. The separate studio reported its Mac-hosted Qwen model available.
- The public site passed responsive UI/consent/spectator/archive/vote checks and automated WCAG A/AA scans at desktop and mobile sizes.
- Four headless Chromium contexts on this Mac completed three real public model tasks through Cloudflare. Each fetched only assigned layer files. One holder stopped; coverage and active work disappeared and no new tokens accrued during the 6.5-second check. Rejoining restored coverage and completed another task. The hidden-page handler also withdrew the piece. Raw summarized evidence: `evidence/live-shared.json`.
- The live observation lasted 57.680 seconds after all four pieces had loaded, including the deliberate outage and restoration. Initial asset loading is excluded. This is real internet relay from one machine, not four heterogeneous physical devices or a robust latency benchmark.
- The final two-chain local headless workshop took 43.638 seconds; its five exact recall records and model-written revisions are in `evidence/workshop.json`.
- Final isolated process-restart persistence test passed.

One non-functional console issue remains: Cloudflare automatically injects an optional analytics beacon that the site's existing content-security policy blocks. Inference, navigation and model downloads are unaffected. The CLI credential cannot change the account's analytics setting (403); the Cloudflare MCP connector also needs reauthorization. We did not weaken the content-security policy to enable the beacon. The site's deployment and operation use authenticated Wrangler successfully.
