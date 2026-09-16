# Held Alive — build ledger

## Authorized outcome

Build a complete, tested art platform at heldalive.com, publish its GitHub repository, and run the initial LLM on this Mac mini. Browser-hosted compute is the intended production destination. Never imply that presence alone performs inference or that an idle model is permanently dead.

## Stages

- [x] 1. Inspect Cloudflare/GitHub/domain access and local model capability.
- [x] 2. Define the artwork, personality, protocol, and local/browser provider separation.
- [x] 3. Build the website, shared room coordinator, and authenticated Mac inference bridge.
- [x] 4. Add explicit contribution controls, spectator mode, failure/reconnect handling, and browser provider support.
- [x] 5. Test real inference, multi-visitor state, withdrawal, security boundaries, accessibility, and responsive layout.
- [x] 6. Publish GitHub, deploy Cloudflare, attach domain where access permits, and verify live installation.

## Decisions

- Keep the preceding research untouched; the platform is an independent repository in heldalive/.
- Personality: quiet, attentive, curious, concise. No guilt for leaving; no claims of sentience or suffering.
- Initial inference runs locally; the public experience must identify that fact.
- All visitor compute must require explicit consent and an immediate stop control.

## Progress

- Goal created. GitHub CLI authenticated as OscarBarreraGithub; Cloudflare MCP connector configured.
- Mac: Apple Silicon, 24 GiB RAM, Node 26.7. No Ollama installed yet.

## Verified deployment

- Cloudflare Worker deployed at https://heldalive.oscarbarrera.workers.dev.
- Cloudflare zone f63f94986a327b24a3dd71af77073e99 created for heldalive.com. Both apex and www custom domains attached; zone remains pending registrar nameserver change. User was given ophelia.ns.cloudflare.com and razvan.ns.cloudflare.com.
- GitHub repository created: https://github.com/OscarBarreraGithub/heldalive. Source pushed; initial GitHub Actions check/build/deployment dry-run passed.
- Native bridge installed as com.heldalive.bridge; self-contained runtime in ~/Library/Application Support/HeldAlive avoids macOS Documents restrictions. Health reports modelAvailable=true.
- Real public-site inference reached two simultaneous browsers with identical output; 28 tokens completed in 297 ms in one observed warm job. This is a hardware observation, not a general benchmark.
- Real local browser/WebGPU inference completed after consent; spectator and withdrawal tests passed.
- No separate Mac GPU server port is publicly exposed. Bridge connections are outbound and authenticated.

## Scope decision

The requested first stage is a working Mac-hosted test. This is implemented, with an additional working browser whole-thought provider. Multi-browser model sharding is explicitly documented as the later production stage and is not represented as already implemented. The user-facing About text explains this distinction.

## Final checks and pending external action

- The deployed browser study also passed real WebGPU inference: 20 tokens in 1.688 seconds in one observed job; zero contributors after withdrawal; no Mac fallback.
- Model CORS issue resolved with a bounded same-origin asset endpoint and immutable upstream revisions. Seven focused unit tests pass.
- Automated accessibility checks pass on both rooms and the consent dialog after improving small-label contrast. Layout/interaction checks pass at desktop and 320/390/768-pixel widths.
- Mac LaunchAgent restart/reconnect verified; the actual native provider remains connected.
- Custom domains are configured, but registrar DNS still points at Namecheap as of final inspection. The user must save the two provided Cloudflare nameservers; no further code/deploy change is required for activation.
- Public fallback: https://heldalive.oscarbarrera.workers.dev. Repository: https://github.com/OscarBarreraGithub/heldalive.

- Final public-site layout and automated accessibility checks passed after deployment.
- Reinstall testing exposed a brief launchd unload/reload race; the installer now retries that transition. Two successive reinstalls passed and the bridge reconnected.
