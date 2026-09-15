# Operating Held Alive

## Services

- Cloudflare Worker: `heldalive`; public fallback origin `https://heldalive.oscarbarrera.workers.dev`.
- Intended domain: `heldalive.com`.
- Mac model: `qwen2.5:0.5b`, approximately 398 MB of quantized weights, via Ollama.
- Native bridge: `com.heldalive.bridge` macOS LaunchAgent. Development config is in ignored `.local/` files. The installed runtime, private config, and logs are in `~/Library/Application Support/HeldAlive/`, so macOS background services do not need access to Documents.

The Mac-hosted study requires the Mac to be awake, online, and logged in for its LaunchAgent. This setup does not change system-wide sleep settings or expose the model port. The browser study is independent of the Mac, but requires an eligible consenting browser.

## Health

`GET /api/health` reports whether the main room has a connected model provider. `GET /api/health?room=browser` reports availability for the browser room. HTTP success alone means the coordinator works, not that model inference is possible. `GET /api/state` returns public room state without bridge credentials, IPs, or private connection metadata.

```sh
curl https://heldalive.oscarbarrera.workers.dev/api/health
launchctl print gui/$(id -u)/com.heldalive.bridge
tail -n 30 "$HOME/Library/Application Support/HeldAlive/logs/bridge.log"
tail -n 30 "$HOME/Library/Application Support/HeldAlive/logs/bridge-error.log"
```

## Restart or stop

```sh
launchctl kickstart -k gui/$(id -u)/com.heldalive.bridge
launchctl bootout gui/$(id -u)/com.heldalive.bridge
```

To rebuild/reinstall after code or private config changes, or restart after a deliberate stop, run `npm run install:bridge`. This copies a self-contained bridge bundle and its config into Application Support. To stop Ollama separately, run `brew services stop ollama`. The site stays available while the main model is disconnected and shows that status.

## Deploy changes

```sh
npm run check
npm run deploy
```

Secrets are set separately using `npx wrangler secret bulk .local/secrets.json`; never print or commit those files. The same bridge token must be in Cloudflare and the Mac's config. A token rotation requires updating both and restarting the bridge. For GitHub Actions deployment, configure a scoped Cloudflare API token as a GitHub secret before enabling any deploy workflow; the committed CI workflow only checks/builds.

## Domain

Cloudflare nameservers assigned to heldalive.com:

- `ophelia.ns.cloudflare.com`
- `razvan.ns.cloudflare.com`

At Namecheap, set these in Domain List → Manage → Nameservers → Custom DNS. Worker custom domains for `heldalive.com` and `www.heldalive.com` are already attached and recorded in wrangler.jsonc. DNS/certificate activation can lag the registrar save. The Workers hostname remains usable while that completes.

## Limits and data

The site has no app accounts or advertising analytics. Visitors' notes can shape public generated text and should contain nothing confidential. Browser contributions are untrusted. The latest 60 thoughts and cumulative counts are retained; pending notes are removed when assigned. Hosting connection metadata is processed by Cloudflare. No inference prompt text is deliberately written to bridge logs.

Resource use is bounded to one simultaneous job per room, 90 generated tokens per job, 2048-token model context, and ordinarily at least 30 seconds between completed thoughts. Notes can shorten that gap. Cloudflare hosting still has ordinary provider usage limits and possible charges; browser inference does not make the website cost-free.
