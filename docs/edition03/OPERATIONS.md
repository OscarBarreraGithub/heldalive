# Operating the shared-layer edition

## Services and dependency

Public habitat: https://heldalive.com/ (also https://www.heldalive.com/).
Source: https://github.com/OscarBarreraGithub/heldalive.
Studio: https://heldalive.com/?room=studio.
Worker fallback origin: https://heldalive.oscarbarrera.workers.dev.

Cloudflare serves assets, routes intermediate model vectors and persists completed work in a SQLite Durable Object. A public thought needs all 32 layers in ready browser holders. An empty or incomplete habitat is expected to wait; `ok: true` reports coordinator health, not a thinking model. No studio or cloud inference fills a public gap.

```sh
curl 'https://heldalive.com/api/health?room=browser'
curl 'https://heldalive.com/api/state?room=browser'
curl 'https://heldalive.com/api/health?room=main'
```

`pipelines` shows actual ready coverage and pending work. `contributors` counts ready browser holders, not unique people or complete models. The public protocol remains version 2; the installation edition and model migration are version 3. Legacy API calls without `room` refer to the studio. `/api/artworks`, `/api/trials` and `/api/workspace` accept `room=browser&offset=0`, returning up to 24 public records per page. Do not treat public model output as verified truth.

## Build and deploy

```sh
npm ci
npm run setup
npm run model:download
npm run check
npm run preview
```

In another terminal, verify the stable local build. Test fixtures refuse public origins.

```sh
npm run test:integration
npm run test:persistence
npm run test:ui
npm run test:a11y
HELD_TEST_URL=http://127.0.0.1:8787 npm run test:browser
npx wrangler deploy --dry-run
npm run deploy
```

GPU tests run headlessly and explicitly lend the developer machine's resources; they do not open visible Chrome windows. `HELD_TEST_PEERS=16 HELD_TEST_JOBS=1` tests sixteen gentle holders. `npm run test:workshop` uses eight larger holders for two real chains. `npm run test:numerics` needs the Vite development server (`npm run dev`) to access the source harness. Do not rebuild or edit app modules during a browser GPU test: local reload invalidates the connection.

Model assets are a pinned GitHub release, checked by SHA-256 and then per-buffer hashes. They remain ignored in Git and are included in Cloudflare static assets by the deployment build. The largest buffer is below the 25 MiB asset limit. Visitors fetch only their assigned piece after consent. This developer preparation is not a visitor installation. Keep the Apache license, source model card and conversion notice with redistributions.

GitHub CI checks source, builds and dry-runs the Worker; it does not deploy or run GPU tests. `npm run deploy` requires the prepared model assets and authenticated Wrangler. Review the live release's real inference after deployment:

```sh
HELD_TEST_URL=https://heldalive.com HELD_TEST_JOBS=1 npm run test:browser
```

This produces actual public model work, temporarily contributes GPU resources and tests one holder withdrawing/rejoining. It assumes no outside complete chain is active; extra real visitors invalidate its single-chain outage assertion. Never run coordinator fixture tests against production.

## Mac studio

Ollama serves `qwen2.5:0.5b` on loopback port 11434. LaunchAgent `com.heldalive.bridge` uses private configuration and its bundle in `~/Library/Application Support/HeldAlive/`. It needs the Mac awake, online and logged in. Public browser inference continues independently when sufficient browser coverage exists.

```sh
launchctl print gui/$(id -u)/com.heldalive.bridge
launchctl kickstart -k gui/$(id -u)/com.heldalive.bridge
```

`npm run install:bridge` rebuilds/reinstalls the optional bridge from ignored configuration. Reinstallation is only needed after a bridge change. `BRIDGE_TOKEN` is a Worker secret, also used to sign anonymous visitor cookies. Never commit it or expose it through `VITE_` variables. Rotating it invalidates visitor cookies and requires updating/restarting the bridge. Private setup scripts create files with mode 0600 and do not print tokens.

## Outages, rollback and limits

A lost holder cancels its chain's unfinished thought, which is retried with a fresh lease after coverage returns. Completed files, drawings, votes and counters persist. Restart/reconnect tests cover this. Saved weights and records make recovery possible; this is not irreversible digital death.

```sh
npx wrangler tail --status error
npx wrangler versions list
npx wrangler rollback <version-id>
```

A code rollback does not rewind SQLite. The edition 03 migration preserves earlier drawings/journal/counters, archives an unfinished edition 02 project as interrupted, discards its queued/in-flight model work and resets cross-model comparison totals. Old results remain individually inspectable. Rolling back to edition 02 restores a whole-model-per-browser application and contradicts the current product. Prefer fixing forward; consult Cloudflare storage recovery before any data rollback.

Bounds: eight complete chains, 300 connections per habitat, 32 per observed IP and four per signed anonymous identity. Measured tests cover two chains and up to sixteen contexts on one Mac, not 300 physical users or heterogeneous WAN/phone performance. Full-state broadcasts, storage growth, coordinator traffic and hosting quotas require monitoring before expansion. Browser intermediates/results can be forged; there is no proof of honest inference. Anonymous identities are not unique humans.

Hidden pages withdraw; Stop terminates their worker. Work/rest targets exclude loading and are not hard GPU/energy caps. WebGPU plus float16 is needed for layers; tiny CPU tasks and watch-only remain available without it. Cache entries may survive Stop and can be removed through browser site-data controls.

Namecheap delegates to `ophelia.ns.cloudflare.com` and `razvan.ns.cloudflare.com`. Custom domains are configured in `wrangler.jsonc`. Diagnose DNS/TLS without disabling certificate verification.
