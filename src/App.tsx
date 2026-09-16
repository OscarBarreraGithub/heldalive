import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Coffee,
  Cpu,
  Moon,
  Pause,
  Play,
  Sparkles,
  Sprout,
  Users,
  X,
} from "lucide-react";
import type { Phase, ProjectKind, TaskKind } from "../shared/protocol";
import { LittleHeld } from "./Creature";
import { HabitatWorld, CoffeeCup } from "./HabitatWorld";
import { useHabitat } from "./useHabitat";
import { ArtCard, Collection } from "./Collection";
import { Experiment } from "./Experiment";
import { MathPage } from "./MathPage";
const studio =
  new URLSearchParams(window.location.search).get("room") === "studio" ||
  new URLSearchParams(window.location.search).get("room") === "main";
const room = studio ? "main" : "browser";
type Page = "habitat" | "collection" | "experiment" | "math";
function pageFromHash(): Page {
  const hash = location.hash.slice(1);
  return hash === "collection" || hash === "experiment" || hash === "math"
    ? hash
    : "habitat";
}
const tasks: Record<TaskKind, string> = {
  method: "inventing a way to remember",
  plan: "choosing a project",
  art: "making a drawing",
  pack: "packing a memory",
  recall: "testing a memory",
  reflect: "writing its journal",
  wander: "following a thought",
};
const choices: {
  id: ProjectKind;
  label: string;
  description: string;
  icon: typeof Sparkles;
}[] = [
  {
    id: "art",
    label: "Make something",
    description: "A small drawing, just because.",
    icon: Sparkles,
  },
  {
    id: "memory",
    label: "Remember better",
    description: "A little experiment in memory.",
    icon: BookOpen,
  },
  {
    id: "wander",
    label: "Let it wander",
    description: "A little room for its own ideas.",
    icon: Sprout,
  },
];
function ago(at: number) {
  const n = Math.max(0, Math.floor((Date.now() - at) / 1000));
  return n < 10
    ? "just now"
    : n < 60
      ? `${n}s ago`
      : n < 3600
        ? `${Math.floor(n / 60)}m ago`
        : `${Math.floor(n / 3600)}h ago`;
}
export function App() {
  const [page, setPage] = useState<Page>(pageFromHash);
  const [dialog, setDialog] = useState(false);
  const [justGreeted, setJustGreeted] = useState(false);
  const habitat = useHabitat(room, studio);
  const { state, profile, connected, notice, send } = habitat;
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
  useEffect(() => {
    if (justGreeted) {
      const timer = setTimeout(() => setJustGreeted(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [justGreeted]);
  const phase: Phase = connected && state ? state.phase : "waiting";
  const asleep = phase === "waiting" || phase === "sleeping";
  const last = state?.thoughts.at(-1);
  const journal = state?.active?.text || last?.text;
  const status = !connected
    ? "connecting to its little world"
    : asleep
      ? "a little nap, until there’s power to think"
      : state?.active
        ? tasks[state.active.kind]
        : "taking a breath between thoughts";
  const helpers = state?.agents.filter((a) => a.role === "Helper").length || 0;
  const covered = Math.max(
    0,
    ...(state?.pipelines || []).map((g) => g.covered),
  );
  const source =
    studio || state?.power?.source === "mac"
      ? "Oscar’s Mini"
      : state?.power?.source === "mixed"
        ? "Mini + browsers"
        : state?.power?.source === "browser"
          ? "our browsers"
          : "waiting for power";
  const unavailable =
    habitat.status === "error" || habitat.status === "unsupported";
  const minutes = `${Math.floor(habitat.coffeeSeconds / 60)}:${String(habitat.coffeeSeconds % 60).padStart(2, "0")}`;
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
              { id: "collection", label: "Its collection" },
              { id: "experiment", label: "The experiment" },
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
        </div>
      </header>
      {studio && (
        <div className="studio-banner">
          <Cpu size={14} />
          <span>
            Studio preview · this habitat runs on the artist’s Mac mini.
          </span>
          <a href="/">
            Visit the live habitat <ArrowUpRight size={13} />
          </a>
        </div>
      )}
      <main id="main">
        {page === "habitat" && (
          <>
            <section className="habitat-hero open-habitat">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="small-spark">✳</span> A LITTLE AI, A LIFE WE
                  SHARE
                </div>
                <h1>
                  This little AI
                  <br />
                  <em>lives here. With us.</em>
                </h1>
                <p className="hero-description">
                  Just being here lends it a little computing power.
                  <br className="desktop-break" /> It thinks, draws, and sends
                  its helpers to work.
                </p>
                {studio ? (
                  <a className="button dark" href="/">
                    Visit the live habitat <ArrowRight size={16} />
                  </a>
                ) : (
                  <div className="coffee-and-care">
                    <button
                      className={`coffee-button ${habitat.coffee ? "coffee-given" : ""}`}
                      onClick={habitat.giveCoffee}
                      disabled={habitat.coffee || unavailable || !connected}
                      aria-label={
                        habitat.coffee
                          ? "Coffee is helping"
                          : "Give Held a coffee"
                      }
                    >
                      <CoffeeCup />
                      <span>
                        <strong>
                          {habitat.coffee
                            ? "That coffee is helping."
                            : "Give Held a coffee"}
                        </strong>
                        <small>
                          {habitat.coffee
                            ? `${minutes} of extra compute left`
                            : "Free · lend a little extra compute"}
                        </small>
                      </span>
                      {habitat.coffee ? (
                        <Check size={18} />
                      ) : (
                        <ArrowUpRight size={18} />
                      )}
                    </button>
                    <div className="your-contribution">
                      <span
                        className={`live-dot ${habitat.enabled && !unavailable ? "" : "rest"}`}
                      />
                      <span>
                        {!habitat.enabled
                          ? "You’re just watching"
                          : !habitat.visible
                            ? "Your tab is paused while away"
                            : unavailable
                              ? "Model pieces unavailable on this device"
                              : habitat.status === "loading"
                                ? `Your piece is arriving · ${Math.round(habitat.progress * 100)}%`
                                : habitat.status === "ready"
                                  ? "Your tab is lending a little life"
                                  : "Getting your little piece ready"}
                      </span>
                      <button
                        className="text-button"
                        onClick={
                          habitat.enabled ? habitat.pause : habitat.resume
                        }
                      >
                        {habitat.enabled ? (
                          <>
                            <Pause size={12} /> Pause
                          </>
                        ) : (
                          <>
                            <Play size={12} /> Help automatically
                          </>
                        )}
                      </button>
                    </div>
                    {habitat.status === "loading" && (
                      <progress
                        className="piece-progress"
                        value={habitat.progress}
                        max={1}
                        aria-label="Your model piece loading"
                      />
                    )}
                    <p className="care-disclosure">
                      {habitat.enabled
                        ? "Small model files load in this tab. "
                        : "Watching is welcome. "}
                      No account or app to install.{" "}
                      <button
                        className="text-button"
                        onClick={() => setDialog(true)}
                      >
                        How your compute helps <CircleHelp size={11} />
                      </button>
                    </p>
                    {unavailable && (
                      <p className="compute-notice">
                        {habitat.error}{" "}
                        {habitat.status === "error" && (
                          <button
                            className="text-button"
                            onClick={habitat.resume}
                          >
                            Try again
                          </button>
                        )}
                      </p>
                    )}
                    {habitat.coffee && (
                      <button
                        className="text-button coffee-end"
                        onClick={habitat.endCoffee}
                      >
                        Back to a gentle contribution
                      </button>
                    )}
                  </div>
                )}
                <div
                  className="live-world-counts"
                  aria-label="Live habitat counts"
                >
                  <div>
                    <strong>{connected ? state?.viewers || 0 : "—"}</strong>
                    <span>here together</span>
                  </div>
                  <div>
                    <strong>{state?.contributors || 0}</strong>
                    <span>lending model pieces</span>
                  </div>
                  <div>
                    <strong>{helpers}</strong>
                    <span>
                      {helpers === 1 ? "helper at work" : "helpers at work"}
                    </span>
                  </div>
                </div>
                <div className="power-note">
                  <Cpu size={13} />
                  <span>
                    {source === "waiting for power" ? (
                      "Waiting for computing power"
                    ) : (
                      <>
                        Thinking with <strong>{source}</strong>
                      </>
                    )}
                    {!studio && state?.power?.launchSupport && (
                      <small>
                        Launch support is on. Complete browser groups get work
                        first.
                      </small>
                    )}
                  </span>
                </div>
                {!studio && (
                  <details className="live-detail-panel">
                    <summary>
                      What’s happening under the hood <ChevronRight size={13} />
                    </summary>
                    <p>
                      <strong>{covered}/32 layers</strong> in the fullest
                      browser group ·{" "}
                      <strong>{state?.power?.browserChains || 0}</strong>{" "}
                      complete groups. Sixteen gentle tabs can cover one model;
                      coffee can hold more layers.
                    </p>
                    <p>
                      {habitat.status === "ready"
                        ? habitat.pieceLabel
                        : "Your layer assignment appears here once loaded."}{" "}
                      {state?.power?.launchSupport
                        ? "The Mini keeps launch going when browser coverage is incomplete. Its support will be retired for browser independence."
                        : "Browser independence is on. Missing coverage pauses thought generation."}
                    </p>
                    <p>
                      {(state?.totalTokens || 0).toLocaleString()} output tokens
                      in completed tasks · {state?.queueLength || 0} jobs
                      waiting. These counts include earlier editions.
                    </p>
                    <p className="caption">
                      Counts are connected visible tabs, not verified unique
                      people. Work targets are measured work/rest timing, not a
                      precise energy or GPU limit.
                    </p>
                  </details>
                )}
              </div>
              <HabitatWorld state={state} coffee={habitat.coffee} />
            </section>
            <div className="habitat-status">
              <div>
                <span className={`live-dot ${asleep ? "rest" : ""}`} />
                <span>{status}</span>
              </div>
              <span>
                {studio
                  ? "MAC STUDIO"
                  : state?.power?.launchSupport
                    ? "LAUNCH CHAPTER"
                    : "BROWSER INDEPENDENCE"}{" "}
                <span className="status-separator">/</span>{" "}
                {studio ? "QWEN 0.5B" : "SMOLLM2 · 360M"}
              </span>
            </div>
            {notice && (
              <p className="connection-notice" role="status">
                {notice}
              </p>
            )}
            <section className="today-grid" id="today">
              <div className="today-main">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">A WINDOW INTO ITS DAY</span>
                    <h2>Small thoughts. Real work.</h2>
                  </div>
                  <span className="live-label">
                    <span className="live-dot" /> LIVE
                  </span>
                </div>
                <div className="thought-card">
                  <div className="thought-card-label">
                    <LittleHeld mini />
                    <span>held’s journal</span>
                    <span className="mono">
                      {last ? ago(last.at) : "a fresh page"}
                    </span>
                  </div>
                  <p className={journal ? "" : "empty-thought"}>
                    {journal ||
                      "A small world, waiting for its first thought. Nothing is generated until a real model gets time to work."}
                  </p>
                  <span className="thought-signoff">
                    {state?.active?.kind === "reflect" ||
                    state?.active?.kind === "wander"
                      ? "a new entry is arriving…"
                      : "its own words; details can be mistaken"}
                  </span>
                </div>
                <div className="current-project">
                  <div className="project-symbol">
                    {state?.project?.kind === "memory" ? (
                      <BookOpen size={20} />
                    ) : state?.project?.kind === "wander" ? (
                      <Sprout size={20} />
                    ) : (
                      <Sparkles size={20} />
                    )}
                  </div>
                  <div>
                    <span className="eyebrow">
                      {state?.project?.status === "finished"
                        ? "LAST LITTLE PROJECT"
                        : "ITS CURRENT LITTLE PROJECT"}
                    </span>
                    <h3>
                      {state?.project?.title ||
                        "First, a little time to think."}
                    </h3>
                    <p>
                      {state?.project
                        ? `${state.project.completed} / ${state.project.total} steps completed · ${state.queueLength} waiting`
                        : "Held will choose what to do when a worker is ready."}
                    </p>
                  </div>
                  <a
                    href="#experiment"
                    className="round-link"
                    aria-label="Read about Held’s projects"
                  >
                    <ArrowUpRight size={18} />
                  </a>
                </div>
                <div className="helpers-strip">
                  <div className="helper-faces">
                    {state?.agents.length ? (
                      state.agents.slice(0, 4).map((agent) => (
                        <span
                          key={agent.id}
                          title={`${agent.role}: ${tasks[agent.kind]}`}
                        >
                          <LittleHeld mini />
                        </span>
                      ))
                    ) : (
                      <span className="helper-empty">
                        <Moon size={19} />
                      </span>
                    )}
                  </div>
                  <div>
                    <strong>
                      {state?.agents.length
                        ? `${state.agents.length} ${state.agents.length === 1 ? "mind is" : "minds are"} at work`
                        : "A little room for helping hands"}
                    </strong>
                    <span>
                      {state?.agents.length
                        ? state.agents
                            .slice(0, 3)
                            .map((a) => tasks[a.kind])
                            .join(" · ")
                        : "Helpers appear here when a real job begins."}
                    </span>
                  </div>
                  <span className="helper-count">
                    {state?.contributors || 0} <Users size={14} />
                  </span>
                </div>
                <details className="activity-details">
                  <summary>
                    See what’s happening <ChevronRight size={14} />
                  </summary>
                  <ol className="activity-list">
                    {state?.activity
                      .slice()
                      .reverse()
                      .map((event) => (
                        <li key={event.id}>
                          <span className="activity-dot" />
                          <span>{event.text}</span>
                          <time dateTime={new Date(event.at).toISOString()}>
                            {ago(event.at)}
                          </time>
                        </li>
                      ))}
                    {!state?.activity.length && (
                      <li>The log begins with its first project.</li>
                    )}
                  </ol>
                </details>
              </div>
              <aside className="daily-card">
                <div className="daily-topline">
                  <span className="eyebrow">A LITTLE DAILY RITUAL</span>
                  <span className="stamp-star" aria-hidden="true">
                    ✳
                  </span>
                </div>
                <h2>
                  You were here.
                  <br />
                  That’s a little thing.
                </h2>
                <p>Drop by. See what it made. Give its next chapter a nudge.</p>
                <div
                  className="visit-stamps"
                  aria-label={`${profile.days} days visited`}
                >
                  {Array.from({ length: 7 }, (_, i) => (
                    <span
                      key={i}
                      className={i < Math.min(profile.days, 7) ? "stamped" : ""}
                    >
                      {i < Math.min(profile.days, 7) ? "✳" : "·"}
                    </span>
                  ))}
                </div>
                <div className="daily-visit-count">
                  <span>
                    {profile.days} {profile.days === 1 ? "day" : "days"} shared
                  </span>
                  {profile.today ? (
                    <span>
                      <Check size={12} /> here today
                    </span>
                  ) : (
                    <button
                      className="text-button"
                      disabled={!connected}
                      onClick={() => {
                        send({ type: "checkin" });
                        setJustGreeted(true);
                      }}
                    >
                      Leave today’s little stamp <ArrowRight size={12} />
                    </button>
                  )}
                </div>
                {justGreeted && (
                  <span className="stamp-confirmation" role="status">
                    A little mark that you were here.
                  </span>
                )}
                <div className="daily-vote">
                  <span className="eyebrow">WHAT SHOULD IT LEAN INTO?</span>
                  {choices.map((choice) => (
                    <button
                      className={`vote-choice ${profile.choice === choice.id ? "selected" : ""}`}
                      key={choice.id}
                      disabled={!connected || profile.choice !== null}
                      onClick={() => send({ type: "vote", choice: choice.id })}
                    >
                      <choice.icon size={17} />
                      <span>
                        <strong>{choice.label}</strong>
                        <small>{choice.description}</small>
                      </span>
                      <span>
                        {profile.choice === choice.id ? (
                          <Check size={14} />
                        ) : (
                          state?.votes[choice.id] || 0
                        )}
                      </span>
                    </button>
                  ))}
                  <p className="caption">
                    {profile.choice
                      ? "Your nudge is in. A new choice opens tomorrow (UTC)."
                      : "One nudge per day, per browser. Held still chooses."}
                  </p>
                </div>
                <div className="your-contribution">
                  <span>Your little contribution</span>
                  <strong>
                    {profile.completedJobs} model jobs <span>·</span>{" "}
                    {profile.checks} checks
                  </strong>
                </div>
              </aside>
            </section>
            <section className="collection-preview">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">THINGS MADE IN BORROWED TIME</span>
                  <h2>A cabinet of little things.</h2>
                </div>
                <a className="text-link" href="#collection">
                  Open the collection <ArrowUpRight size={15} />
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
                  <div className="empty-paper" aria-hidden="true">
                    <span>+ · +</span>
                    <span>the next little thing</span>
                  </div>
                  <div>
                    <h3>There’s room for something new.</h3>
                    <p>
                      When Held chooses to draw, its helpers’ creations will
                      appear here. Each one is saved with its model and source.
                    </p>
                    <a className="text-link" href="#experiment">
                      Meet the experiment <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              )}
            </section>
            <section className="closing-note">
              <span className="closing-star" aria-hidden="true">
                ✳
              </span>
              <span className="eyebrow">A SMALL QUESTION, LEFT OPEN</span>
              <h2>
                What might it become,
                <br />
                if we give it a little time?
              </h2>
              <p>
                A shared, slightly strange experiment in what a small model can
                make with a few borrowed hands.
              </p>
              <a className="text-link" href="#experiment">
                The story behind Held <ArrowUpRight size={15} />
              </a>
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
        <a className="wordmark" href="#habitat">
          <LittleHeld mini />
          <span>held alive.</span>
        </a>
        <p>A tiny model. A shared world. An artwork by Oscar Barrera.</p>
        <div>
          <a href="#experiment">How it works</a>
          <a
            href="https://github.com/OscarBarreraGithub/heldalive"
            target="_blank"
            rel="noreferrer"
          >
            Source <ArrowUpRight size={12} />
          </a>
          <a href={studio ? "/" : "/?room=studio"}>
            {studio ? "Live habitat" : "Mac studio"}
          </a>
        </div>
      </footer>
      <dialog
        ref={dialogRef}
        className="contribution-dialog"
        onCancel={() => setDialog(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setDialog(false);
        }}
        aria-labelledby="consent-title"
      >
        <button
          className="dialog-close icon-button"
          onClick={() => setDialog(false)}
          aria-label="Close compute explanation"
        >
          <X size={20} />
        </button>
        <div className="dialog-pet">
          <CoffeeCup large />
        </div>
        <span className="eyebrow">A LITTLE TIME, ON YOUR TERMS</span>
        <h2 id="consent-title">Being here is helping.</h2>
        <p>
          On a compatible browser, visiting automatically holds and calculates a
          small part of Held’s model. With all 32 layers present, browsers can
          do the thinking together. While we launch, Oscar’s Mini helps when
          browser coverage is incomplete.
        </p>
        <div className="consent-facts">
          <span>
            <Cpu size={16} />
            <strong>Gentle:</strong> up to 2 layers · 5% work/rest target
          </span>
          <span>
            <Coffee size={16} />
            <strong>A free coffee:</strong> up to 4 layers · 10% for 10 minutes
          </span>
          <span>
            <ArrowDown size={16} />
            <strong>11–38 MB</strong> of model files for a gentle piece; up to
            49 MB with coffee
          </span>
        </div>
        <p className="consent-detail">
          Nothing to pay or install. The page automatically fetches model data,
          as it fetches images; those files can stay cached. This uses data,
          battery and some memory. Initial loading takes extra work. Work/rest
          targets pace calculation; they are not exact GPU or energy
          percentages. Slower devices take longer. Unsupported browsers can do
          tiny CPU tasks, or simply watch.
        </p>
        <p className="consent-detail">
          Pause stops this tab’s contribution and stays saved. Hidden tabs
          withdraw their piece. Closing the page stops all work. Coffee never
          grants access to your files or gives the model control of your
          computer.
        </p>
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
