# Edition 04 operations

Public habitat: https://heldalive.com · source: https://github.com/OscarBarreraGithub/heldalive.

## One public creature, two sources of inference

The public room (`room=browser`) runs the pinned SmolLM2-360M four-bit checkpoint in either complete browser chains or a private native MLX process on the artist’s Mini. During launch, **complete browser chains receive work first**. With no complete chain, the Mini may take jobs. A native job already underway can finish during handoff. Source is attached to every active job and saved result; UI distinguishes mixed work. Nothing runs without a visible visitor.

`GET /api/state?room=browser` exposes `power.launchSupport`, `power.macAvailable`, `power.browserChains`, `power.source`, actual layer coverage, public job drafts and aggregate counts. Visitors are visible connections, not verified people; helpers are currently running helper jobs, not a theoretical number of copies. Layer holders can wait idle for missing pieces. No work is invented to keep tabs busy.

## Automatic contributions and coffee

A new compatible visible visit requests up to two layers at a 5% work/rest target. Coffee requests up to four at 10% for ten minutes. A gap may be smaller than the target. These are pacing targets, not exact GPU or electricity limits; loading is additional. Default transfers are about 11–38 MB; coffee about 22–49 MB, plus runtime/tokenizer. Sixteen identical gentle holders or eight coffee holders complete the 32 layers. Mixed contributions also work.

Pause immediately stops the worker and useful CPU checks, clears coffee and saves `held-participation=watch`. Returning remains watch-only. Initial `saveData` and the previous tiny-check opt-out are respected. Hidden pages withdraw; expired coffee returns to gentle automatically. No app/account/install is needed. WebGPU/float16 is required for actual layers; unsupported devices may perform useful bounded CPU jobs when assigned, or simply watch. Model data can remain in the browser cache.

## Native launch service

`com.heldalive.launch` is a separate LaunchAgent from the legacy `com.heldalive.bridge` studio. The launch bundle, Python runner, private configuration and logs live in `~/Library/Application Support/HeldAlive/launch/`. The installer preserves the studio. The native runner exposes no listening port or code-execution tool: it accepts bounded JSON jobs from the authenticated outbound WebSocket bridge and streams model tokens over private stdio. It requires the prepared MLX checkpoint and Python packages in `scripts/model-requirements.txt`.

Private `.local/launch-bridge.json` fields: `url`, `token`, `room: "browser"`, `engine: "mlx"`, absolute `python`, absolute `modelPath`, and descriptive `model`. The model path must be the same checkpoint used to prepare the browser artifact, not another model. Production uses stable copies at `~/Library/Application Support/HeldAlive/launch/python/bin/python` and `~/Library/Application Support/HeldAlive/launch/model`, so the working checkout can move without breaking inference. Local tests use `.local/edition03/venv/bin/python` and `.local/edition03/model-q4`. Native dependency versions remain pinned by `scripts/model-requirements.txt`. `BRIDGE_TOKEN` must match the Worker secret and must never be published. Configurations are mode 0600.

```sh
HELD_CONFIG=.local/launch-bridge.json npm run install:bridge
launchctl print gui/$(id -u)/com.heldalive.launch
launchctl kickstart -k gui/$(id -u)/com.heldalive.launch
```

The Mini must be awake, logged in and online. No cloud service secretly replaces it. The original Qwen studio at `/?room=studio` remains available separately.

## Retiring launch support

This is deliberately operator-controlled so QA visitors cannot accidentally end the launch chapter. It is persisted in the room’s SQLite state. Retirement cancels/requeues native work and makes it ineligible even while its bridge remains connected. Browser chains continue; if all become incomplete, tokens stop until coverage returns. Completed records and model files survive.

```sh
# Current release keeps support ON.
HELD_CONFIG=.local/launch-bridge.json node scripts/launch-support.mjs off
# Explicit operator reversal is possible; never automatic after retirement.
HELD_CONFIG=.local/launch-bridge.json node scripts/launch-support.mjs on
```

Endpoint: authenticated `POST /api/launch-support?room=browser`, JSON `{ "enabled": false }`. No visitor UI may change it. HTTP reads, missing credentials, invalid payloads and other rooms are rejected.

## Test and deploy

```sh
npm run check
npm run preview
# Against the stable local build, without editing app/build files during tests:
npm run test:integration # coordinator fixtures; no native bridge connected
npm run test:ui
npm run test:a11y
node scripts/test-coffee.mjs
npx tsx scripts/test-native.ts
# With a private local native bridge connected:
HELD_CONFIG=.local/launch-bridge-local.json npm run bridge
node scripts/test-launch.mjs
HELD_TEST_URL=http://127.0.0.1:8787 HELD_TEST_LAUNCH=1 npm run test:browser
npm run deploy
```

All browser tests are headless. The GPU test opens sixteen untouched contexts (or eight coffees), verifies real inference, then withdraws/restores a required piece. With `HELD_TEST_LAUNCH=1`, it first allows native launch support and then switches it off for the independence assertion, restoring it in cleanup. Use local test configuration matching the base URL. Do not combine fixture and actual-inference tests on one room. Do not mistake sixteen contexts on one Mac for sixteen heterogeneous physical devices or a WAN scalability measurement.

Deployment requires authenticated Wrangler and hash-checked model assets (`npm run model:download`). GitHub CI performs source checks/build/Worker dry-run, not GPU tests or automatic deployment. Reinstall the launch service after bridge changes. Do not expose secrets in command arguments or logs.

## Limits

Configured bounds remain eight model chains, 300 connections per habitat, 32 per IP and four per anonymous identity. These are limits, not load-test results. Full-state broadcasts, growing records and bandwidth need monitoring before larger traffic. Browser results can be forged. Tiny-model art and memory quality are weak. More helpers do not train or enlarge the model. “Life” means ongoing computation; idle animation is decorative. Cloudflare’s optional analytics beacon can be blocked by the site CSP without affecting inference; the policy was not weakened to allow it.

For DNS, artifact provenance, source licensing and rollback commands, see the edition 03 operations/numerical notes; its opt-in and separate-public-from-Mini behavior is superseded here. Rolling back to edition 03 also removes the public Mini handoff and new participation behavior.
