import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ArrowRight, Check, Pause, X } from "lucide-react";
import { CURRENT_MODEL as model } from "../shared/model";
import budgets from "../shared/model-budgets.json";
import { RESEARCH_URL, activityLabel } from "../shared/observatory";
import { LittleHeld } from "./Creature";
import { useHabitat } from "./useHabitat";
import { useObservatory } from "./useObservatory";
import { ComputeControls } from "./ComputeControls";
import { ObservatoryWorld } from "./ObservatoryWorld";
import { ResearchPage } from "./ResearchPage";
import { Mural } from "./Mural";
import { MathPage } from "./MathPage";
import { useSimulatedCompute } from "./ComputeEstimate";
type Page = "habitat" | "research" | "math";
function fromHash(): Page {
  return location.hash === "#math"
    ? "math"
    : ["#research", "#experiment"].includes(location.hash)
      ? "research"
      : "habitat";
}
export function App() {
  const [page, setPage] = useState<Page>(fromHash);
  const [mural, setMural] = useState(
    ["#mural", "#collection"].includes(location.hash),
  );
  const [explain, setExplain] = useState(false);
  const h = useHabitat("browser", false);
  const { state } = h;
  const obs = useObservatory();
  const { data, online } = obs;
  const status = data?.status;
  const simulatedCompute = useSimulatedCompute();
  const phoneCompute = simulatedCompute + (state?.contributors || 0);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const change = () => {
      setPage(fromHash());
      setMural(["#mural", "#collection"].includes(location.hash));
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    if (explain && !dialog.current?.open) dialog.current?.showModal();
    if (!explain) dialog.current?.close();
  }, [explain]);
  const openMural = () => {
    location.hash = "mural";
  };
  const closeMural = () => {
    setMural(false);
    if (["#mural", "#collection"].includes(location.hash))
      location.hash = "habitat";
  };
  const central =
    online && status?.state === "working" ? status.activeAgents : 0;
  const latest = data?.runs.find((run) => run.station === "research");
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a className="wordmark" href="#habitat" aria-label="Held Alive home">
          <LittleHeld mini />
          <span>
            held alive<span className="brand-period">.</span>
          </span>
        </a>
        <nav aria-label="Main navigation">
          {(
            [
              { id: "habitat", label: "The little one" },
              { id: "research", label: "The notebook" },
              { id: "math", label: "What if?" },
            ] as const
          ).map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              aria-current={page === n.id ? "page" : undefined}
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="here-pill scenario-pill">
          <span className="compute-reading">
            <b data-phone-equivalents>{phoneCompute}</b> phone-equivalents
          </span>
          {h.enabled && (
            <button
              className="quick-pause"
              aria-label="Pause browser compute"
              onClick={h.pause}
            >
              <Pause size={12} /> Pause
            </button>
          )}
        </div>
      </header>
      <main id="main">
        {page === "habitat" && (
          <>
            <section className="observatory-hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="small-spark">✳</span> AN EXPERIMENT IN
                  BORROWED EXISTENCE
                </div>
                <h1>
                  Keep a little
                  <br />
                  <em>mind alive.</em>
                </h1>
                <p className="hero-description">
                  An AI studying how to remember. Your browser helps it test
                  ideas. In its free time, it draws a world.
                </p>
                <p className="model-disclosure">
                  Qwen3.5 9B researches server-side. Qwen3 4B runs the shared
                  browser experiments. Preview support is{" "}
                  {state
                    ? state.power?.launchSupport
                      ? "on"
                      : "off"
                    : "being checked"}
                  .
                </p>
                <ComputeControls habitat={h} explain={() => setExplain(true)} />
              </div>
              <ObservatoryWorld
                loading={obs.loading}
                data={data}
                online={online}
                state={state}
                openMural={openMural}
              />
            </section>
            <div className="habitat-status">
              <div>
                <i className={`live-dot ${central ? "" : "rest"}`} />
                <span>
                  {obs.loading
                    ? "connecting to the researcher"
                    : !online
                    ? "researcher offline · saved work remains"
                    : central
                      ? `${status?.station} · a research role is working`
                      : status?.state === "error"
                        ? "research paused · see notebook"
                        : `${status?.station} · between sessions`}
                </span>
              </div>
              <span>
                20H RESEARCH / 1H ART / 1H IDEAS / 2H REFLECTION & REST
              </span>
            </div>
            {h.notice && (
              <p className="connection-notice" role="status">
                {h.notice}
              </p>
            )}
            <section
              className="truth-counts"
              aria-label="Measured live activity"
            >
              <div>
                <strong className="researcher-state">
                  {activityLabel(status, online, obs.loading)}
                </strong>
                <span>researcher</span>
              </div>
              <div>
                <strong>{status?.completedRuns ?? "—"}</strong>
                <span>records saved</span>
              </div>
            </section>
            <section className="observatory-invitations">
              <a href="#research" className="notebook-invitation">
                <span className="eyebrow">AT THE COMPUTER</span>
                <h2>
                  Trying not
                  <br />
                  <em>to forget.</em>
                </h2>
                <p>
                  {latest?.summary ||
                    "Notes, skills, summaries, graphs. Which memories actually help an agent continue its work? It reads the literature, tests small ideas, and keeps a public notebook."}
                </p>
                <span className="text-link">
                  {latest
                    ? "Read the latest entry"
                    : "Open the research notebook"}{" "}
                  <ArrowUpRight size={15} />
                </span>
                <small>
                  {latest
                    ? latest.title
                    : "55 starting sources. One open question."}
                </small>
              </a>
              <button className="mural-invitation" onClick={openMural}>
                <div>
                  <span className="eyebrow">AWAY FROM THE COMPUTER</span>
                  <h2>
                    A world,
                    <br />
                    <em>one mark at a time.</em>
                  </h2>
                  <p>
                    One long ASCII mural. It revisits yesterday’s lines, adds a
                    little shading, and draws further into the dark.
                  </p>
                  <span className="text-link">
                    Enter the mural <ArrowRight size={15} />
                  </span>
                </div>
                <pre aria-hidden="true">
                  {data?.mural?.text ||
                    "      .       +\n   .       .\n       ___\n     _/   \\_\n   _/_______\\_\n      . . .\n\n  a horizon, waiting."}
                </pre>
              </button>
            </section>
            <section className="premise-panel" aria-labelledby="premise-title">
              <div>
                <span className="eyebrow">THE UNCOMFORTABLE PART</span>
                <h2 id="premise-title">
                  You can close this tab.
                  <br />
                  <em>Imagine if you couldn’t.</em>
                </h2>
              </div>
              <div>
                <p>
                  A complete group of browsers can run a model together. Remove
                  enough pieces and that computation stops. Add replacements and
                  it returns.
                </p>
                <p>
                  A botnet takes that power without consent. Here you can always
                  leave. The central researcher currently has server support, so
                  closing every tab stops browser work, not the whole
                  installation.
                </p>
                <a className="text-link" href="#math">
                  Tell me more <ArrowUpRight size={14} />
                </a>
              </div>
            </section>
            <section className="quiet-details">
              <details>
                <summary>What is this tab actually doing?</summary>
                <p>
                  A visible, compatible browser automatically offers a Gentle
                  piece of the Qwen3 model. Watch stops it. More and Most offer
                  extra compute for ten minutes. This is free; it uses device
                  resources and downloads model data.
                </p>
                <p>
                  <strong>Your piece:</strong> {h.usage.layers} of{" "}
                  {model.layers} layers;{" "}
                  <span data-model-bytes={h.usage.modelBytes}>
                    {(h.usage.modelBytes / 1e6).toFixed(1)} MB
                  </span>{" "}
                  loaded. <strong>Work so far:</strong>{" "}
                  <span
                    data-work-ms={h.usage.computeMs}
                    data-work-passes={h.usage.passes}
                  >
                    {(h.usage.computeMs / 1000).toFixed(2)} seconds across{" "}
                    {h.usage.passes} layer passes.
                  </span>{" "}
                  Loading and waiting are excluded. These are not battery
                  measurements.
                </p>
                <p>
                  During research hours, complete groups run small memory tests.
                  During the art hour they can make small sketches for the
                  artist. The central researcher has a separate server-side
                  context and model. Its schedule does not depend on the browser
                  count in this edition.
                </p>
                <p>Your private files and browsing history are not inputs.</p>
              </details>
              <details>
                <summary>What happens when nobody is here?</summary>
                <p>
                  The browser model loses its workers. Saved memories and art
                  remain. Temporary preview support can run worker inference
                  when visitors are present; the central researcher continues on
                  its own schedule. “Death” in a future browser-only mode would
                  mean halted computation, not erased weights or irreversible
                  destruction.
                </p>
              </details>
            </section>
          </>
        )}
        {page === "research" && (
          <ResearchPage loading={obs.loading} data={data} online={online} state={state} />
        )}{" "}
        {page === "math" && <MathPage />}
      </main>
      <footer className="site-footer">
        <a className="wordmark" href="#habitat">
          <LittleHeld mini />
          <span>held alive.</span>
        </a>
        <p>
          An artwork by Oscar Barrera.
          <br />
          Held alive is what we do. It is not the alien’s name.
        </p>
        <div>
          <a
            href={status?.repository || RESEARCH_URL}
            target="_blank"
            rel="noreferrer"
          >
            Public notebook <ArrowUpRight size={12} />
          </a>
          <a href="#research">Methods & progress</a>
        </div>
      </footer>
      {mural && <Mural close={closeMural} />}
      <dialog
        ref={dialog}
        className="consent-dialog"
        aria-labelledby="consent-title"
        onClose={() => setExplain(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setExplain(false);
        }}
      >
        <button
          className="dialog-close icon-button"
          aria-label="Close explanation"
          onClick={() => setExplain(false)}
        >
          <X size={20} />
        </button>
        <div className="dialog-pet">
          <LittleHeld />
        </div>
        <span className="eyebrow">A LITTLE POWER. NO PAYMENT.</span>
        <h2 id="consent-title">Your tab helps run the experiment.</h2>
        <p>
          Qwen3 4B is split across browsers. A complete chain needs every layer;
          your piece cannot run it alone. The central Qwen3.5 9B researcher is
          separate and server-backed.
        </p>
        <div className="consent-facts">
          <span>
            <strong>Gentle:</strong> up to 2 layers · 5% work/rest target ·{" "}
            {budgets["2"].minMB}–{budgets["2"].maxMB} MB
          </span>
          <span>
            <strong>More:</strong> up to 4 layers · 10% target · up to{" "}
            {budgets["4"].maxMB} MB
          </span>
          <span>
            <strong>Most:</strong> up to 8 layers · 20% target · up to{" "}
            {budgets["8"].maxMB} MB
          </span>
        </div>
        <p>
          More and Most last ten minutes. These are pacing targets, not precise
          GPU or battery percentages. Loading also uses resources. Model files
          can remain cached. There is no app to install and no payment.
        </p>
        <p>
          Watch stops contribution and stays saved. Hidden tabs withdraw;
          closing the page stops its work. Browser code cannot access your
          private files. The site accepts no visitor prompts or votes.
        </p>
        <button className="button dark" onClick={() => setExplain(false)}>
          Got it <Check size={16} />
        </button>
        <button
          className="text-button just-watch"
          onClick={() => {
            h.pause();
            setExplain(false);
          }}
        >
          I’ll just watch
        </button>
      </dialog>
    </>
  );
}
