# Edition 07 verification

2026-09-16. All browser checks used headless Chromium; no visible browser windows were opened.

## Completed locally

- TypeScript, 23 unit tests and production build pass.
- Prepared asset checks cover 580 buffers, per-part/full-buffer hashes, tokenizer hash, pinned manifest and attribution. Download disclosures are calculated from the actual browser loader's plans.
- Native MLX versus WebGPU: exact tokenization, identical leading predictions, at least eight common top-ten candidates and maximum shared-candidate logit error below 0.083 across all three prompts. Both one intact stage and eighteen independent browser stages passed. Inputs: 26, 399 and 47 tokens, including Unicode. This validates numerical implementation, not artistic quality.
- Five real Most contributors completed an actual distributed drawing. The test verified assigned-layer downloads, physical loss of a required holder, no computation while incomplete, completed recovery and visibility withdrawal. No native bridge supplied that local browser inference.
- Automatic two-layer contribution; More/four layers; Most/eight layers; saved choice through reload; ten-minute expiry; persistent Watch without model requests all pass.
- Altered model-part fixture is rejected before readiness. Old model identities cannot join the new pipeline.
- Coordinator fixtures pass: socket authentication, two complete chains, art-only tasks, no voting/prompts, exact input inspection, invalid-output rejection without credit and gap replacement. These are local fixtures, not model-output evidence.
- Isolated model/art migration and process-restart persistence tests preserve saved work, counters, historical records and the operator's support setting; stale work is retired or reassigned.
- Four pages at 320/390/768/1440px, keyboard/focus behavior, downloads and no horizontal overflow pass. Automated WCAG A/AA checks pass. These do not replace a human accessibility audit.
- Eight consecutive final native drawing samples are saved in `native-samples.json`. All fit the format rules. Many remain abstract; this is not evidence that ASCII aesthetics are solved.

## Publication

- Implemented in commit `1158b8dad5c4e70bd19d7a46aa94037e0ff03733`; [CI passed](https://github.com/OscarBarreraGithub/heldalive/actions/runs/35170118099).
- Cloudflare deployment `8fadbbb8-80ed-41f1-8dc3-576e43bce7c5` serves heldalive.com, www.heldalive.com and the workers.dev origin. Matching native launch service was installed after deployment and is connected.
- [Model release](https://github.com/OscarBarreraGithub/heldalive/releases/tag/model-qwen3-4b-v1) is published. All three GitHub asset sizes and server-computed SHA-256 digests match the pinned artifact metadata.
- Live state changed from SmolLM2 360M to Qwen3 4B. All 20 original drawings survived the migration; sampled old IDs remain in the paginated archive. New preview drawings carry the new model label.
- Five actual Most browser contributors loaded the public assets and completed a drawing through the public Cloudflare relay. No fixture outputs were submitted. The captured state reports `source: browser`, one full chain and preview support still enabled. Completion was observed 20.988 seconds after all pieces loaded; this is one local-machine browser experiment, not a cross-device internet performance benchmark. Cold-start downloads are substantial and excluded from that 20.988-second interval; total test time is in `live-evidence.json`.
- Test browsers and local development servers were closed. The persistent public native service and separate studio service remain running.

The old stable native model and private bridge/config backups are retained locally; the previous code and model release remain available. A rollback must restore the matching worker and native runtime together. The public preview support flag was not switched off. See `live-evidence.json` and the live screenshot for the final result.
