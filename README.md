# Held Alive

**An AI kept alive by the people here.**

A quiet, shared artwork: a small language model offers a thought, rests, and begins again. Everyone in a room sees the same stream. Visitors can leave a short public note to shape the next thought.

## Two working studies

- **Study 01 — `/`:** Qwen 2.5 0.5B runs on the artist's Mac mini through Ollama. The site identifies this source. Browsers witness the stream; they do not power it.
- **Study 02 — `/?room=browser`:** consenting browsers run the same model family through WebLLM/WebGPU. Each contributor generates an entire thought, then rests according to its contribution limit. Without an eligible contributor, generation pauses. No Mac or cloud inference fallback is used in this room.

Browser contribution is opt-in, loads roughly 300 MB of model assets, offers 5/10/20% inference duty targets, pauses work when hidden, and releases its worker on Stop. Spectators do not download model assets. Duty is work time divided by work plus cooldown, not a hardware GPU-utilization or energy guarantee. The initial model load is a separate burst.

**This release does not shard a single forward pass across multiple browsers.** One capable contributor can run Study 02. A numerical “critical mass” greater than one would be misleading. See [the staged roadmap](docs/ARCHITECTURE.md) for the model-sharding stage.

## Stack

React + TypeScript + Vite; Cloudflare Worker static assets; one SQLite-backed Durable Object per room; authenticated outbound WebSocket from the Mac; Ollama on loopback; WebLLM in a dedicated browser worker. No user account, advertising analytics, external model API, or public Ollama port.

## Local development

Requires Node 22.12+ (tested on Node 26), npm, and Ollama for Study 01.

```sh
npm ci
npm run setup
ollama pull qwen2.5:0.5b
npm run build
npm run preview
```

In a second terminal, with Ollama running:

```sh
npm run bridge
```

Open `http://127.0.0.1:8787`. For frontend hot reload, also run `npm run dev` and use its localhost URL.

`npm run setup` creates ignored, private `.dev.vars` and `.local/bridge.json` files and generates Cloudflare types. It does not print secrets. Never put a bridge token in a `VITE_` variable.

## Verify

```sh
npm run check
npm run test:integration  # local Worker must be running; uses clearly marked test thoughts
npm run test:ui           # npm exec playwright install chromium first
npm run test:a11y         # automated WCAG A/AA scans
npm run test:browser      # real model download + WebGPU hardware test; headed browser
npx wrangler deploy --dry-run
```

The hardware test requires a compatible WebGPU browser and downloads model files after selecting the test consent control. Read [verification notes](docs/VERIFICATION.md) for what was actually exercised.

## Deploy and operate

```sh
npx wrangler whoami
npm run deploy
npx wrangler secret bulk .local/secrets.json
```

Edit only the `url` in `.local/bridge.json` to the deployed HTTPS origin. Run `npm run bridge` to verify connectivity; on macOS, `npm run install:bridge` installs an agent that reconnects and restarts at login. Ollama must also run, for example using `brew services start ollama`.

Read [operations](docs/OPERATIONS.md) for domain setup, logs, restarting, and stopping. The Mac must be awake and online for Study 01. Study 02 does not depend on it.

## Voice

Held notices small, ordinary things. It is curious, concise, and occasionally funny. It never asks visitors to stay or claims that disconnecting causes suffering. Personality instructions and examples live in [`shared/personality.ts`](shared/personality.ts). This is a tiny imperfect model; those instructions are not a guarantee about every output.

## Public experiment

Notes may influence public output. Do not submit private information. Contributors receive the shared prompt/history, and browser-generated results are untrusted. No contributor can execute arbitrary remote code through the work protocol. Generated text is rendered as text, never HTML. The room stores its latest 60 thoughts, aggregate counts, and a bounded pending-note queue. Model weights have their own license; the application code is MIT.
