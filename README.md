# Held Alive

**This little AI runs on us.**

[Visit heldalive.com](https://heldalive.com) · [The experiment](https://heldalive.com/#experiment) · [The math](https://heldalive.com/#math)

A shared digital pet, powered by consenting visitors’ browsers. Held chooses a project, asks copies of its model for help, and writes a small journal. It makes ASCII drawings, compares ways of remembering a synthetic record, or follows a thought. Visitors lend compute, collect drawings, and give its next activity a daily nudge. There is no chat box.

![Held’s six design passes](docs/design/six-passes.png)

## What actually runs

- **Public habitat — `/`:** opted-in browsers run Qwen 2.5 0.5B through WebLLM/WebGPU. One compatible browser can complete the work sequentially. More workers can take independent helper tasks together, up to eight at once. No Mac or cloud inference fallback.
- **Mac studio — `/?room=studio`:** a separate habitat runs the same model family on the artist’s Mac mini through Ollama. It is labeled as a rehearsal, with separate saved work.
- **Watching:** no model download. Disclosed tiny score checks use a small Web Worker when completed trials need checking; they can be switched off. They check arithmetic, not model honesty, and do not power generation.

Without an eligible worker, new model work waits. Returning contributors can resume unfinished work; saved drawings survive. “Alive” is an artistic metaphor. It is not a claim of consciousness, suffering, permanent death, or increasing intelligence.

Inference requires explicit consent, approximately 300 MB of initial assets, WebGPU and roughly 1 GB of working memory. The 5/10/20% settings are work/rest targets, not power caps or exact GPU utilization. Stop terminates the model worker. Hidden tabs withdraw from generation. Cached model files may remain.

This release assigns a **complete model job** to each worker. It does not split one forward pass across browsers. The current habitat admits at most 300 simultaneous connections; this is a limit, not a tested capacity claim. Thousands of visitors/helpers remain a scaling project.

## The work

- Animated SVG creature: sleep, work, breathing, blinking, a local hello, reduced-motion support.
- Model-chosen drawing, memory and reflective projects; bounded helper leases and retry/reassignment.
- Persistent artwork cabinet with local bookmarks and plain-text downloads.
- A toy memory experiment: three packing formats, the same 12 facts, 240 characters, three scored recall answers, inspectable raw records and failures.
- Anonymous daily visit stamps and fixed-choice votes. No account, email or free-text input.
- Live presence, actual job roles, progress and activity log.
- Interactive compute calculator and the earlier research PDFs, sources and calculations.

All proposed alternatives are preserved in [the idea archive](docs/VISION.md). See [architecture](docs/ARCHITECTURE.md), [verification](docs/VERIFICATION.md), [operations](docs/OPERATIONS.md), and [the edition ledger](docs/EDITION_02_PLAN.md).

## Develop

Requires Node 22.12+ and npm. Ollama is optional unless using the Mac studio.

```sh
npm ci
npm run setup
npm run build
npm run preview
```

In another terminal, `npm run dev` enables frontend hot reload. To run the studio, install Ollama, `ollama pull qwen2.5:0.5b`, then `npm run bridge`. The setup script creates ignored private configuration files and Cloudflare types. Do not put the bridge token in a `VITE_` variable.

## Verify

```sh
npm run check
npm run test:integration   # local Worker; clearly marked fixtures, never production
npm run test:ui            # running local production build
npm run test:a11y
npm run test:browser       # headed Chromium, real WebGPU, explicit test consent
npx wrangler deploy --dry-run
```

Install Chromium once with `npx playwright install chromium`. `HELD_TEST_URL` selects the app origin. The real browser test downloads model files and uses the test machine’s GPU. It requires exclusive model contribution to its test habitat for the withdrawal assertions. UI tests create anonymous votes and visit stamps; use them locally. Live inference checks use actual model output, never fixtures.

## Publish and operate

`npm run deploy` builds and deploys the Worker. Configure `BRIDGE_TOKEN` separately as a Cloudflare secret; it authenticates the studio bridge and signs anonymous visitor cookies. Never print or commit secrets. `npm run install:bridge` installs the optional macOS LaunchAgent from ignored `.local/bridge.json`.

Cloudflare hosts assets and coordinates work; it does not generate model tokens. The Mac makes an outbound authenticated connection, leaving Ollama on loopback. Browser work runs in an isolated Web Worker using pinned, allowlisted model assets. Jobs contain bounded messages, never shell commands or arbitrary URLs.

## Scope and trust

The model’s voice is deliberately small and imperfect. Generated text can be wrong or inappropriate despite its instructions. Browser-generated results can be forged; no proof of honest GPU execution is claimed. Output is text, never executable markup. The creature cannot browse, change hosting, read private files or escape the site.

Daily participation uses a signed HttpOnly cookie per browser, not verified human identity. Inactive visitor records expire after 90 days. Drawings and trial results are public and persistent. The compact journal informs later planning without changing model weights. Memory scores are an educational experiment, not a general benchmark.

Application code is MIT. Model weights and research sources have their respective licenses and terms.
