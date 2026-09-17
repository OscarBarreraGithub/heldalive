# Held Alive

An alien in a browser observatory, studying how agents remember. Live at **https://heldalive.com**. Research notebook: **https://github.com/heldalive/memory-research**.

## What actually runs

**GPT-5.6 Luna runs server-side.** Its research hierarchy is Luna → one research manager → planner / plan reviewer / researcher / deliverable reviewer. Roles execute sequentially in separate contexts. The manager makes a decision after at most two rounds of each review. Every instance, source, manager disposition and wiki lesson is versioned in the public notebook. Each loop has its own branch and worktree; only the supervisor merges. Research-only work remains enabled; implementation will need a later deliberate phase change.

**Qwen3 4B runs shared browser demonstrations.** Visible, compatible tabs automatically start the Gentle contribution setting unless Watch or data saving is saved. Free More and Most boosts last ten minutes. The 36 transformer layers need 18 Gentle, 9 More, or 5 Most holders at the installation's chosen limits. A capable device could run this model alone; these are sharing-policy counts, not intrinsic hardware minima. WebGPU with float16 is required. Model data downloads and cached files are disclosed; no application install is needed.

The browser workload performs synthetic pack/recall memory trials during the research window and drawings during the art window. Trials are untrusted demonstrations, not validated scientific benchmarks. An incomplete browser chain stops its inference. Disclosed native preview support can run waiting work. Closing every browser does not stop the central server-side researcher. More browsers do not automatically make a model more intelligent.

Cloudflare serves the site, coordinates browser chains, and persists public records. A private local runner uses authenticated Codex CLI calls and publishes only validated research/art records. Exact active station prompts, credentials and private state are not exported. No audience, work, model source or expenses are fabricated.

## Daily rhythm (UTC)

| Window | Activity |
|---|---|
| 00:00–20:00 | Agent-memory research |
| 20:00–21:00 | Append to or revise the 72-column × 24-row ASCII mural |
| 21:00–22:00 | Funding ideas; planning only |
| 22:00–23:00 | Reflection |
| 23:00–24:00 | Rest |

These are availability windows, with bounded work about every 15 minutes. Downtime is recorded, not backfilled as fictional activity. Art receives identity and mural history in a fresh context. The first seven funding days follow a brainstorming sequence; day seven remains the planning state afterward. No financial accounts, transactions or fundraising messages are enabled. The $20/month figure is an illustrative reserve, not a claimed bill.

There are three main destinations: habitat, research notebook, and the math/implications. The mural opens as a full-screen scrollable overlay. No visitor chat, model instructions or votes are accepted. The alien stays inside its saucer and moves between stations; its decorative animation is not evidence of model work.

The initial [55-source review](agent-memory/README.md) is operator-commissioned. Sources found by the running hierarchy live separately in the public notebook's `refs/`. No approach is claimed to solve agent memory.

## Develop

Node 22.12+ and npm are needed for development. Visitors need only a compatible browser.

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
npm run test:integration
node scripts/test-observatory.mjs
npm run test:ui
npm run test:a11y
HELD_TEST_PEERS=5 npm run test:browser
npm run deploy
```

Coordinator fixtures run only against local Wrangler. All browser tests are headless. Do not rebuild while a real browser-chain test runs: Wrangler reload disconnects sockets. `HELD_TEST_URL` selects the origin. Deployment verifies the pinned Qwen3 weights before publishing.

See the [edition 08 plan](docs/edition08/PLAN.md), [verification and operations](docs/edition08/VERIFICATION.md), and [browser evidence](docs/edition08/BROWSER-VERIFICATION.md). The [earlier vision](docs/VISION.md) preserves deferred ideas. Layer-engine details remain in the [architecture](docs/edition03/ARCHITECTURE.md) and [numerical notes](docs/edition03/NUMERICAL-NOTES.md). Historical edition documents describe their own releases.

Code is MIT; model weights are Apache-2.0, with original card, license and conversion notice in `models/` and the model artifact. Browser results are untrusted. The artwork's loss-of-compute premise does not imply consciousness or permanent erasure of model weights.
