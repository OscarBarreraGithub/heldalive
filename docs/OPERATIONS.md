# Operating Held Alive

## Live services

- Public browser habitat: `https://heldalive.com/` (also `www.heldalive.com`).
- Studio: `https://heldalive.com/?room=studio`.
- Worker fallback origin: `https://heldalive.oscarbarrera.workers.dev`.
- Worker: `heldalive`; one SQLite Durable Object per habitat.
- Optional Mac model: `qwen2.5:0.5b` via Ollama on `127.0.0.1:11434`.
- Mac LaunchAgent: `com.heldalive.bridge`. Private runtime/config/logs: `~/Library/Application Support/HeldAlive/`.

The public habitat depends on opted-in browsers. The Mac is only used by the studio and must be awake, online and logged in for its LaunchAgent. Its model port is not exposed. No new model job runs in either habitat without a visible audience. Saved drawings remain accessible without a worker.

## Health and data

```sh
curl 'https://heldalive.com/api/health?room=browser'
curl 'https://heldalive.com/api/health?room=main'
curl 'https://heldalive.com/api/state?room=browser'
```

`ok` means the coordinator is available; `modelAvailable` means it has a connected eligible source, not that every generation will succeed. Legacy API calls without `room` address the studio/main room, while the homepage explicitly selects browser mode.

`/api/artworks?room=browser&offset=0` and `/api/trials?room=browser&offset=0` return 24 archive records at a time. Advance offset by 24. These are public records. Archive growth and provider quotas need operational monitoring; no indefinite-storage guarantee is made.

```sh
launchctl print gui/$(id -u)/com.heldalive.bridge
tail -n 30 "$HOME/Library/Application Support/HeldAlive/logs/bridge.log"
tail -n 30 "$HOME/Library/Application Support/HeldAlive/logs/bridge-error.log"
npx wrangler tail --status error
```

The bridge logs connection/failure information, not prompt text or tokens. Cloudflare sees ordinary request and network metadata. Public state excludes signed identities, connection IPs and lease-owner IDs.

## Restart or stop the studio

```sh
launchctl kickstart -k gui/$(id -u)/com.heldalive.bridge
launchctl bootout gui/$(id -u)/com.heldalive.bridge
```

`npm run install:bridge` rebuilds and reinstalls the bundle after code/config changes or after a deliberate stop. It copies ignored `.local/bridge.json` into Application Support with mode 0600. To stop Ollama separately, use `brew services stop ollama`. These actions do not power or stop the public browser habitat.

## Deploy

```sh
npm run check
npm run test:integration
npm run test:ui
npm run test:a11y
npx wrangler deploy --dry-run
npm run deploy
npm run install:bridge
```

Run integration/UI tests against a stable local Worker after the build finishes: rebuilding assets while a local test is connected can cause Wrangler to reload and invalidate the test connection. `npm run test:browser` uses actual model inference and GPU resources. The fixture integration test refuses non-local origins.

The GitHub workflow checks, builds and dry-runs; it does not automatically deploy. Live deployment uses authenticated Wrangler. `BRIDGE_TOKEN` is configured separately with `npx wrangler secret bulk .local/secrets.json`; never print or commit it. The same secret authenticates the bridge and signs anonymous visitor cookies. Rotating it requires updating the Mac configuration and restarting the bridge, and invalidates existing visitor cookies. Old visitor rows expire normally.

Use `npx wrangler versions list` and `npx wrangler rollback <version-id>` for a code rollback. Edition 02 stores data in new tables and preserves the earlier `installation` table, but a rollback to edition 01 restores the old UI and visitor-note behavior. Code rollback does not rewind SQLite data. Consult Cloudflare’s storage recovery tools before a data rollback.

## Domain and DNS

Namecheap delegation is complete:

- `ophelia.ns.cloudflare.com`
- `razvan.ns.cloudflare.com`

Cloudflare activation, public delegation and valid HTTPS on both custom domains were verified. Custom-domain routes are in `wrangler.jsonc`. This Mac initially retained stale DNS; a request resolved through a current public address, with normal hostname and certificate validation, distinguished local resolver trouble from a deployment failure. Do not disable TLS verification to diagnose this. The Workers hostname remains a separate access path.

## Release limits

At most eight concurrent jobs and 300 connections per habitat; one worker job per connection; 12 connections per observed IP and four per signed identity. No 10k-visitor load test or physical-phone inference matrix has been performed. Full-state broadcasts and a single coordinator will need measurement before raising limits.

One inference worker is sufficient. More people can improve availability and parallelism, but the planner and task graph can leave workers idle. Each browser loads complete weights. Duty settings account for completed assignment wall time, not energy, and are not hard hardware budgets.

Visitors have a fixed-choice daily vote and voluntary visit stamp, not an account. Clearing cookies can bypass browser-level deduplication. Inactive profiles expire after 90 days; short audit-deduplication rows expire after 30 days. Drawings and trials persist separately. Tiny checks verify scoring only; public inference results and generated prose remain untrusted.

For research/design decisions and unimplemented alternatives, read `VISION.md`, `ARCHITECTURE.md`, `VERIFICATION.md` and `EDITION_02_PLAN.md`.
