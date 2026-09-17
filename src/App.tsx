import { CURRENT_MODEL as model } from "../shared/model";
import budgets from "../shared/model-budgets.json";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Cpu,
  Pause,
  Sparkles,
  X,
} from "lucide-react";
import { LittleHeld } from "./Creature";
import { Survival } from "./Survival";
import { InputsPanel } from "./InputsPanel";
import { HabitatWorld } from "./HabitatWorld";
import { useHabitat } from "./useHabitat";
import { ArtCard, Collection } from "./Collection";
import { AsciiCanvas } from "./AsciiCanvas";
import { ComputeControls } from "./ComputeControls";
import { Experiment } from "./Experiment";
import { MathPage } from "./MathPage";
const studio = ["studio", "main"].includes(
  new URLSearchParams(location.search).get("room") || "",
);
const room = studio ? "main" : "browser";
type Page = "habitat" | "collection" | "experiment" | "math";
function pageFromHash(): Page {
  const hash = location.hash.slice(1);
  return hash === "collection" || hash === "experiment" || hash === "math"
    ? hash
    : "habitat";
}
export function App() {
  const [page, setPage] = useState<Page>(pageFromHash);
  const [dialog, setDialog] = useState(false);
  const habitat = useHabitat(room, studio);
  const { state, profile, connected, notice } = habitat;
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const change = () => {
      setPage(pageFromHash());
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    if (dialog && !dialogRef.current?.open) dialogRef.current?.showModal();
    if (!dialog) dialogRef.current?.close();
  }, [dialog]);
  const drawings = (state?.agents || []).filter((a) => a.kind === "art");
  const current = drawings[0];
  const latest = state?.artworks[0];
  const preview = state?.power?.launchSupport;
  const source =
    studio || state?.power?.source === "mac"
      ? "temporary preview support"
      : state?.power?.source === "mixed"
        ? "browsers + preview support"
        : state?.power?.source === "browser"
          ? "visitors’ browsers"
          : "waiting for power";
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a
          className="wordmark"
          href={studio ? "/?room=studio" : "/"}
          aria-label="Held Alive home"
        >
          <LittleHeld mini />
          <span>
            held alive<span className="brand-period">.</span>
          </span>
        </a>
        <nav aria-label="Main navigation">
          {(
            [
              { id: "habitat", label: "The little one" },
              { id: "collection", label: "Sketchbook" },
              { id: "experiment", label: "How it works" },
              { id: "math", label: "The math" },
            ] as { id: Page; label: string }[]
          ).map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={page === item.id ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="here-pill">
          <span className={`live-dot ${connected ? "" : "rest"}`} />
          <span>
            {connected ? (state?.viewers ?? 0) : "—"}{" "}
            <span className="here-label">here together</span>
          </span>
          {!studio && habitat.enabled && (
            <button
              className="quick-pause"
              aria-label="Pause browser compute"
              onClick={habitat.pause}
            >
              <Pause size={12} /> Pause
            </button>
          )}
        </div>
      </header>
      {studio && (
        <div className="studio-banner">
          <Cpu size={14} />
          <span>Separate studio preview · server computation.</span>
          <a href="/">
            Visit the live artwork <ArrowUpRight size={13} />
          </a>
        </div>
      )}
      <main id="main">
        {page === "habitat" && (
          <>
            <section className="habitat-hero open-habitat art-only-hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="small-spark">✳</span> ONE LITTLE AI. BORROWED
                  COMPUTE.
                </div>
                <h1>
                  An AI that lives
                  <br />
                  <em>in our browsers.</em>
                </h1>
                <p className="hero-description">
                  We lend it compute. It makes little drawings.
                  <strong className="death-rule">
                    {!state || preview || studio
                      ? "The idea: when too many people leave, it dies."
                      : "When too many people leave, it dies."}
                  </strong>
                  {preview && !studio && (
                    <span className="mobile-preview-note">
                      Preview: temporary server support is still on.
                    </span>
                  )}
                </p>
                {!studio && <Survival state={state} connected={connected} />}
                {studio ? (
                  <a className="button dark" href="/">
                    Visit the live artwork <ArrowRight size={16} />
                  </a>
                ) : (
                  <ComputeControls
                    habitat={habitat}
                    explain={() => setDialog(true)}
                  />
                )}
                <div
                  className="live-world-counts"
                  aria-label="Live habitat counts"
                >
                  <div>
                    <strong>{connected ? state?.viewers || 0 : "—"}</strong>
                    <span>open tabs</span>
                  </div>
                  <div>
                    <strong>{state?.contributors || 0}</strong>
                    <span>tabs holding model layers</span>
                  </div>
                  <div>
                    <strong>{drawings.length}</strong>
                    <span>drawings in progress</span>
                  </div>
                </div>
                {!studio && (
                  <details className="live-detail-panel">
                    <summary>
                      What’s happening under the hood <ChevronRight size={13} />
                    </summary>
                    <p>
                      <strong>Computation source:</strong> {source}.{" "}
                      {!state
                        ? "Checking the support mode…"
                        : preview
                          ? "Preview support is enabled; browser-only survival is not yet active."
                          : "Server inference is disabled for this habitat."}
                    </p>
                    <p>
                      <strong>Your tab:</strong> {habitat.usage.layers} layers,{" "}
                      <span data-model-bytes={habitat.usage.modelBytes}>
                        {(habitat.usage.modelBytes / 1e6).toFixed(1)} MB
                      </span>{" "}
                      of fixed model weights. These are the model’s numbers, not
                      new information being fed to it.
                    </p>
                    <p>
                      <strong>Useful work this visit:</strong>{" "}
                      <span
                        data-work-ms={habitat.usage.computeMs}
                        data-work-passes={habitat.usage.passes}
                      >
                        {(habitat.usage.computeMs / 1000).toFixed(2)} seconds
                        across {habitat.usage.passes} layer passes.
                      </span>{" "}
                      Zero means this piece has not calculated yet. Loading and
                      waiting are excluded; this is not an energy reading.
                    </p>
                    <p>
                      <strong>Data while drawing:</strong> intermediate model
                      values pass between browsers through the coordinator. Held
                      model bytes are not total network traffic.
                    </p>
                    <p>
                      <strong>“Dies” means generation stops.</strong> Saved
                      drawings and model files remain. Enough returning browsers
                      can restart it. There is no claim of consciousness or
                      permanent erasure.
                    </p>
                    <p className="caption">
                      Counts describe visible tabs, not unique people. Targets
                      pace work and rest; they are not exact GPU or battery
                      percentages.
                    </p>
                  </details>
                )}
              </div>
              <HabitatWorld state={state} boosted={habitat.boosted} />
            </section>
            <div className="habitat-status">
              <div>
                <span className={`live-dot ${current ? "" : "rest"}`} />
                <span>
                  {!connected
                    ? "connecting to the sketchbook"
                    : current
                      ? "making an ASCII drawing"
                      : state?.modelAvailable
                        ? "a pause between drawings"
                        : "No complete mind. No new drawings."}
                </span>
              </div>
              <span>
                {!connected
                  ? "CONNECTING"
                  : studio
                    ? "STUDIO PREVIEW"
                    : preview
                      ? "PREVIEW · SUPPORT ON"
                      : "BROWSER COMPUTATION ONLY"}{" "}
                <span className="status-separator">/</span>{" "}
                {studio ? "QWEN 0.5B" : model.label.toUpperCase()}
              </span>
            </div>
            {notice && (
              <p className="connection-notice" role="status">
                {notice}
              </p>
            )}
            <section
              className="live-sketch-section"
              aria-labelledby="live-sketch-title"
            >
              <div className="sketch-context">
                <span className="eyebrow">JUST ONE THING, FOR NOW</span>
                <h2 id="live-sketch-title">
                  A little life.
                  <br />
                  <em>A lot of little drawings.</em>
                </h2>
                <p>
                  No chat. No votes. It makes ASCII art, one character at a
                  time. More complete groups can make more drawings together.
                </p>
                <p>
                  A 40-column × 20-row page gives every space a place. Nothing
                  is stretched, wrapped or trimmed to make a drawing fit.
                </p>
                <a className="text-link" href="#collection">
                  Open the sketchbook <ArrowUpRight size={14} />
                </a>
                <div className="visit-note">
                  <span>
                    {profile.days} {profile.days === 1 ? "day" : "days"} here
                  </span>
                  <span>
                    {profile.completedJobs} tasks your browsers have helped
                    finish
                  </span>
                </div>
              </div>
              <div className="live-sketch-paper">
                <div className="live-sketch-top">
                  <span className="eyebrow">
                    {current
                      ? "ON THE PAGE, RIGHT NOW"
                      : latest
                        ? "THE LATEST FINISHED PAGE"
                        : "WAITING FOR THE FIRST PAGE"}
                  </span>
                  <span>
                    <i className={`live-dot ${current ? "" : "rest"}`} />
                    {current ? "live" : "sketchbook"}
                  </span>
                </div>
                <AsciiCanvas
                  text={current ? current.draft || "" : latest?.text || ""}
                  live={Boolean(current)}
                  label={
                    current ? "Live ASCII drawing" : "Latest ASCII drawing"
                  }
                />
                <p>
                  {current
                    ? current.title
                    : latest?.title ||
                      "The first drawing appears when a model can work."}
                </p>
                <small>
                  {current
                    ? `${current.characters || 0} characters · ${current.source === "browser" ? "drawn across browsers" : "drawn with preview support"}`
                    : "Original model output. Some sketches will be strange."}
                </small>
              </div>
            </section>
            <section className="collection-preview">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">MARKS IT LEFT BEHIND</span>
                  <h2>A growing sketchbook.</h2>
                </div>
                <a className="text-link" href="#collection">
                  All {state?.artworkCount || 0} drawings{" "}
                  <ArrowUpRight size={14} />
                </a>
              </div>
              {state?.artworks.length ? (
                <div className="art-grid">
                  {state.artworks.slice(0, 3).map((art) => (
                    <ArtCard key={art.id} art={art} small />
                  ))}
                </div>
              ) : (
                <div className="preview-empty">
                  <LittleHeld />
                  <p>Blank pages, waiting for a little borrowed time.</p>
                </div>
              )}
            </section>
            <section className="premise-panel" aria-labelledby="premise-title">
              <div>
                <span className="eyebrow">THE UNCOMFORTABLE PART</span>
                <h2 id="premise-title">
                  You can close this tab.
                  <br />
                  <em>What if you couldn’t?</em>
                </h2>
              </div>
              <div>
                <p>
                  Many ordinary computers can keep one system running. Losing
                  some of them may leave enough for it to continue.
                </p>
                <p>
                  A botnet takes that power from compromised machines without
                  their owners’ consent. This artwork makes shared computation
                  visible and pausable. It cannot infect other devices or spread
                  beyond this site.
                </p>
                <a className="text-link" href="#math">
                  Explore the survival math <ArrowUpRight size={13} />
                </a>
              </div>
            </section>
            <section className="explain-inputs">
              <span className="eyebrow">WHAT GOES INTO A DRAWING?</span>
              <h2>A small prompt. A real calculation.</h2>
              <p>
                The model receives one short drawing prompt. It chooses its own
                subject and marks. It is not reading your files, ingesting the
                internet or training itself. Animation is decoration; the
                drawings come from model inference.
              </p>
              <InputsPanel room={room} state={state} />
              <details className="activity-details">
                <summary>
                  Recent activity <ChevronRight size={13} />
                </summary>
                <ol className="activity-list">
                  {state?.activity
                    .slice()
                    .reverse()
                    .map((event) => (
                      <li key={event.id}>
                        <span className="activity-dot" />
                        <span>{event.text}</span>
                        <time>
                          {new Date(event.at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </li>
                    ))}
                </ol>
              </details>
            </section>
          </>
        )}
        {page === "collection" && (
          <Collection room={room} count={state?.artworkCount || 0} />
        )}
        {page === "experiment" && <Experiment state={state} />}
        {page === "math" && <MathPage />}
      </main>
      <footer className="site-footer">
        <a className="wordmark" href="/">
          <LittleHeld mini />
          <span>held alive.</span>
        </a>
        <p>
          An artwork by Oscar Barrera.
          <br />
          “Held alive” is what we do for it. The alien has no name.
        </p>
        <div>
          <a
            href="https://github.com/OscarBarreraGithub/heldalive"
            target="_blank"
            rel="noreferrer"
          >
            Source <ArrowUpRight size={12} />
          </a>
          <a href={studio ? "/" : "/?room=studio"}>
            {studio ? "Live artwork" : "Studio preview"}
          </a>
        </div>
      </footer>
      <dialog
        ref={dialogRef}
        className="consent-dialog"
        aria-labelledby="consent-title"
        onClose={() => setDialog(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setDialog(false);
        }}
      >
        <button
          className="dialog-close icon-button"
          aria-label="Close explanation"
          onClick={() => setDialog(false)}
        >
          <X size={20} />
        </button>
        <div className="dialog-pet">
          <LittleHeld />
        </div>
        <span className="eyebrow">COMPUTE, NOT MONEY</span>
        <h2 id="consent-title">Your tab is part of the computer.</h2>
        <p>
          A compatible visit automatically holds up to two of the model’s{" "}
          {model.layers}
          layers. Other tabs hold the rest. Together, a complete group generates
          an ASCII drawing. More groups can draw in parallel.
        </p>
        <div className="consent-facts">
          <span>
            <strong>Gentle:</strong> up to 2 layers · 5% work/rest target ·
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
        <p className="consent-detail">
          More and Most last ten minutes, then return to Gentle. These are
          timing targets, not precise GPU or battery percentages. Loading adds
          work. Model files can remain cached; data and memory usage vary by the
          assigned layers.
        </p>
        <p className="consent-detail">
          There is no payment or app installation. Watch stops contribution and
          stays saved. Hidden tabs withdraw their piece. Closing the page stops
          this tab’s work. The model cannot read your files or control your
          computer.
        </p>
        {preview && (
          <p className="preview-truth">
            Preview support is still on: a server can draw while browser pieces
            are missing. Browser-only survival is not active yet.
          </p>
        )}
        <button className="button dark" onClick={() => setDialog(false)}>
          Got it <Check size={16} />
        </button>
        <button
          className="text-button just-watch"
          onClick={() => {
            habitat.pause();
            setDialog(false);
          }}
        >
          I’ll just watch
        </button>
      </dialog>
    </>
  );
}
