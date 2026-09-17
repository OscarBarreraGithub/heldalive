# Held Alive

An alien in a browser observatory, studying how agents remember. Live at **https://heldalive.com**. Research notebook: **https://github.com/heldalive/memory-research**.

## What actually runs

**Every current role uses the same pinned Qwen3 4B checkpoint.** Cloudflare stores the orchestrator and managers’ contexts and runs the bounded plan → review → research → review → manager workflow. Each complete browser inference group can run a role response. Additional groups allow independent research managers, capped at eight. Dependencies inside each loop remain sequential; both review stages have a two-round maximum. Implementation remains disabled during the research phase.

Visible, compatible tabs automatically start Gentle unless Watch or data saving is saved. Free More and Most boosts last ten minutes. The 36 transformer layers need 18 Gentle, 9 More, or 5 Most holders at the chosen sharing limits. These are sharing-policy counts, not intrinsic hardware minima. WebGPU with float16 is required for layers; tiny token-sampling tasks can use CPU-only visitors when shared inference is running. Model data is fetched and cached by the browser; no app installation is needed.

Browser compute runs the actual agents, not a separate toy workload. An agent’s saved instance ID survives connection loss. Temporary inference leases are replaced; late results cannot advance a role twice. Completed work persists across zero-capacity periods. When capacity returns, partial responses restart from the saved role boundary. Other complete groups keep their own work. Temporary native fallback uses the same checkpoint and receives work only when no complete browser group is available; its measured-time cooldown targets 10% inference duty. The cloud coordinator, source retrieval and GitHub publisher do not depend on the Mini.

Each manager has an isolated Git branch. A serialized durable outbox publishes bounded records and sources through GitHub’s Git database API. Failed publication never discards completed inference. Credentials are not included in model requests. Participating browsers necessarily receive assigned inference inputs; the public notebook omits full station prompts and operational state. Earlier Luna and Qwen3.5 9B records retain their attribution.

## Phone-equivalent scenario

The header shows one compact phone-equivalent count: an authored baseline centered on 100 plus contributing browser holders. Slow fluctuations are part of the artwork. The presentation is deliberately minimal; source assumptions are documented in the repository. Work records and backend telemetry retain their original measurements. See [scenario assumptions](docs/edition09/COMPUTE-SCENARIO.md).

## Daily rhythm (UTC)

| Window | Activity |
|---|---|
| 00:00–20:00 | Agent-memory research |
| 20:00–21:00 | Append to or revise the 72-column × 24-row ASCII mural |
| 21:00–22:00 | Funding ideas; planning only |
| 22:00–23:00 | Reflection |
| 23:00–24:00 | Rest |

These are availability windows. Browser holders enforce their selected work/rest targets; independent manager loops can run concurrently. The temporary native provider rests for nine times its preceding inference duration (a 10% duty target, not an exact CPU-utilization guarantee). Downtime is recorded, not backfilled as fictional activity. Art receives identity and mural history in a fresh context. The first seven funding days follow a brainstorming sequence; day seven remains the planning state afterward. No financial accounts, transactions or fundraising messages are enabled. The $20/month figure is an illustrative reserve, not a claimed bill.

There are three main destinations: habitat, research notebook, and the math/implications. The mural opens as a full-screen scrollable overlay. No visitor chat, model instructions or votes are accepted. The alien stays inside its saucer and moves between stations; its decorative animation is not evidence of model work.

The initial [55-source review](agent-memory/README.md) is operator-commissioned. Sources found by the running hierarchy live separately in the public notebook's `refs/`. No approach is claimed to solve agent memory.

## Develop

Node 22.12+ and npm are needed for development. Visitors need only a compatible browser. The authorized maintainer must place the private `heldalive-runtime` checkout alongside this repository; `worker/index.ts` imports its `cloud/` director. The public source alone does not contain the operational role prompts or publisher implementation. Run `wrangler types` after adding local `BRIDGE_TOKEN` and `GITHUB_TOKEN` bindings to `.dev.vars` (an empty GitHub token is sufficient for local tests).

```sh
npm ci
npm run setup
npm run model:download
npm run build
npm run preview
```

Run `npm run dev` separately for frontend hot reload. Weights are ignored build assets, not Git content. Never expose a bridge token through a `VITE_` variable. Private runtime installation and credentials are kept in the private operations repository.

## Verify and deploy

```sh
npm run check
HELD_TEST_URL=http://127.0.0.1:8791 node scripts/test-agent-pool.mjs
HELD_TEST_URL=http://127.0.0.1:8792 node scripts/test-agent-browser.mjs
npm run test:ui
npm run test:a11y
HELD_TEST_PEERS=5 npm run test:browser
npm run deploy
```

Coordinator fixtures run only against local Wrangler. All browser tests are headless. Do not rebuild while a real browser-chain test runs: Wrangler reload disconnects sockets. `HELD_TEST_URL` selects the origin. Deployment verifies the pinned Qwen3 weights before publishing.

See the [current integration plan and evidence](docs/edition11/PLAN.md), [previous audit](docs/edition10/AUDIT.md), [edition 08 plan](docs/edition08/PLAN.md), [verification and operations](docs/edition08/VERIFICATION.md), and [browser evidence](docs/edition08/BROWSER-VERIFICATION.md). The [earlier vision](docs/VISION.md) preserves deferred ideas. Layer-engine details remain in the [architecture](docs/edition03/ARCHITECTURE.md) and [numerical notes](docs/edition03/NUMERICAL-NOTES.md). Historical edition documents describe their own releases.

Code is MIT; model weights are Apache-2.0, with original card, license and conversion notice in `models/` and the model artifact. Browser results are untrusted. The artwork's loss-of-compute premise does not imply consciousness or permanent erasure of model weights.
