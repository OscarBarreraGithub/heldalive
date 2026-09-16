import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Cpu,
  Heart,
  LoaderCircle,
  Moon,
  Pause,
  Sparkles,
  Sprout,
  Users,
  X,
} from "lucide-react";
import type {
  AuditJob,
  Job,
  Phase,
  ProjectKind,
  TaskKind,
} from "../shared/protocol";
import type { BrowserCompute } from "./browserCompute";
import { Creature, LittleHeld } from "./Creature";
import { ArtCard, Collection } from "./Collection";
import { Experiment } from "./Experiment";
import { MathPage } from "./MathPage";
import { useRoom } from "./useRoom";
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
function stored(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function storePreference(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage can be unavailable */
  }
}
const tasks: Record<TaskKind, string> = {
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
  const [duty, setDuty] = useState(() => {
    const v = Number(stored("held-duty", "0.05"));
    return v === 0.1 || v === 0.2 ? v : 0.05;
  });
  const [computeState, setComputeState] = useState<
    "off" | "loading" | "ready" | "error"
  >("off");
  const [progress, setProgress] = useState(0);
  const [computeError, setComputeError] = useState("");
  const [visible, setVisible] = useState(!document.hidden);
  const [checks, setChecks] = useState(
    () => stored("held-checks", "on") !== "off",
  );
  const [justGreeted, setJustGreeted] = useState(false);
  const compute = useRef<BrowserCompute | null>(null);
  const checkWorker = useRef<Worker | null>(null);
  const checksRef = useRef(checks);
  checksRef.current = checks;
  const epoch = useRef(0);
  const sendRef = useRef<(data: unknown) => void>(() => undefined);
  const onJob = useCallback((job: Job) => {
    if (!compute.current || document.hidden) {
      sendRef.current({ type: "failed", jobId: job.id });
      return;
    }
    void compute.current.run(job, (data) => sendRef.current(data));
  }, []);
  const onCancel = useCallback(() => compute.current?.pause(), []);
  const onAudit = useCallback((job: AuditJob) => {
    if (!checksRef.current || document.hidden) return;
    if (!checkWorker.current) {
      const worker = new Worker(new URL("./check.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.onmessage = (e) => {
        if (checksRef.current && !document.hidden) sendRef.current(e.data);
      };
      checkWorker.current = worker;
    }
    checkWorker.current.postMessage(job);
  }, []);
  const { state, profile, connected, notice, send } = useRoom(
    room,
    onJob,
    onCancel,
    onAudit,
  );
  sendRef.current = send;
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
    const update = () => {
      setVisible(!document.hidden);
      if (document.hidden) compute.current?.pause();
    };
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => {
    if (connected && !studio)
      send({ type: "ready", ready: computeState === "ready", duty, visible });
  }, [connected, computeState, duty, visible, send]);
  useEffect(() => {
    storePreference("held-checks", checks ? "on" : "off");
    if (connected) send({ type: "checks", enabled: checks });
    if (!checks) {
      checkWorker.current?.terminate();
      checkWorker.current = null;
    }
  }, [connected, checks, send]);
  useEffect(() => {
    storePreference("held-duty", String(duty));
  }, [duty]);
  useEffect(
    () => () => {
      epoch.current++;
      compute.current?.stop();
      checkWorker.current?.terminate();
    },
    [],
  );
  useEffect(() => {
    if (justGreeted) {
      const timer = setTimeout(() => setJustGreeted(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [justGreeted]);
  async function startCompute() {
    setDialog(false);
    setComputeState("loading");
    setComputeError("");
    setProgress(0);
    const generation = ++epoch.current;
    try {
      if (!("gpu" in navigator))
        throw new Error(
          "This browser doesn’t support WebGPU. You can still visit, vote, and do tiny checks. A current WebGPU-compatible browser is needed for model work.",
        );
      const { BrowserCompute } = await import("./browserCompute");
      if (generation !== epoch.current) return;
      const provider = new BrowserCompute();
      compute.current = provider;
      const ready = await provider.load((p) =>
        setProgress(Math.max(0, Math.min(1, p))),
      );
      if (ready && generation === epoch.current) setComputeState("ready");
    } catch (error) {
      if (generation !== epoch.current) return;
      compute.current?.stop();
      compute.current = null;
      setComputeError(
        error instanceof Error
          ? error.message
          : "The model couldn’t load on this device. You’re welcome to keep watching.",
      );
      setComputeState("error");
    }
  }
  function stopCompute() {
    epoch.current++;
    send({ type: "ready", ready: false });
    compute.current?.stop();
    compute.current = null;
    setComputeState("off");
    setProgress(0);
  }
  const phase: Phase = connected && state ? state.phase : "waiting";
  const asleep = phase === "waiting" || phase === "sleeping";
  const last = state?.thoughts.at(-1);
  const journal = state?.active?.text || last?.text;
  const status = !connected
    ? "connecting to its little world"
    : asleep
      ? "a little nap, until someone lends a hand"
      : state?.active
        ? tasks[state.active.kind]
        : "taking a breath between thoughts";
  const edition = import.meta.env.DEV
    ? Math.max(
        1,
        Math.min(
          6,
          Number(new URLSearchParams(location.search).get("design")) || 6,
        ),
      )
    : 6;
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
            Visit the browser-powered habitat <ArrowUpRight size={13} />
          </a>
        </div>
      )}
      <main id="main">
        {page === "habitat" && (
          <>
            <section className="habitat-hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="small-spark">✳</span> A LITTLE LIFE, HELD
                  TOGETHER
                </div>
                <h1>
                  This little AI
                  <br />
                  <em>{studio ? "has a studio." : "runs on us."}</em>
                </h1>
                <p className="hero-description">
                  {studio
                    ? "The artist’s Mac powers this rehearsal. Visit the live habitat to lend browser power and help Held make little things."
                    : "Lend it a little browser power. It makes art, explores its memory, and puts little copies of itself to work."}
                </p>
                <div className="hero-cta">
                  {studio ? (
                    <a className="button dark primary-cta" href="/">
                      Visit the live habitat <ArrowRight size={17} />
                    </a>
                  ) : computeState === "loading" ? (
                    <div className="loading-compute">
                      <span>
                        <LoaderCircle className="spin" size={17} /> Making a
                        little room… {Math.round(progress * 100)}%
                      </span>
                      <progress
                        aria-label="Model download progress"
                        value={progress}
                        max="1"
                      />
                      <button className="text-button" onClick={stopCompute}>
                        Cancel download
                      </button>
                    </div>
                  ) : computeState === "ready" ? (
                    <div className="contributing-state">
                      <span>
                        <span className="live-dot" />
                        {visible
                          ? "You’re giving Held time to think."
                          : "Your model is paused while this tab is hidden."}
                      </span>
                      <div className="contributing-controls">
                        <label>
                          Work / rest{" "}
                          <select
                            aria-label="Contribution duty target"
                            value={duty}
                            onChange={(e) => setDuty(Number(e.target.value))}
                          >
                            <option value="0.05">Gentle · 5%</option>
                            <option value="0.1">A little more · 10%</option>
                            <option value="0.2">Room to roam · 20%</option>
                          </select>
                        </label>
                        <button className="text-button" onClick={stopCompute}>
                          <Pause size={14} /> Stop contributing
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="button dark primary-cta"
                      onClick={() => setDialog(true)}
                    >
                      <Heart size={17} /> Lend a little life{" "}
                      <ArrowUpRight size={16} />
                    </button>
                  )}
                  {computeState !== "ready" && computeState !== "loading" && (
                    <span className="cta-note">
                      No account. No install. Always your choice.
                    </span>
                  )}
                  {computeError && (
                    <p className="compute-error" role="alert">
                      {computeError}
                    </p>
                  )}
                </div>
                <div className="tiny-check-control">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={checks}
                      onChange={(e) => setChecks(e.target.checked)}
                    />
                    <span className="toggle" aria-hidden="true" />
                    <span>Tiny checks {checks ? "on" : "off"}</span>
                  </label>
                  <span className="tiny-explainer">
                    No model download.{" "}
                    <a
                      href="#experiment"
                      aria-label="How tiny browser checks work"
                    >
                      <CircleHelp size={13} />
                    </a>
                  </span>
                </div>
                <p className="watch-note">Just watching is welcome, too.</p>
                <a
                  className="scroll-cue"
                  href="#today"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("today")?.scrollIntoView({
                      behavior: window.matchMedia(
                        "(prefers-reduced-motion: reduce)",
                      ).matches
                        ? "instant"
                        : "smooth",
                    });
                  }}
                >
                  A peek inside its day <ArrowDown size={14} />
                </a>
              </div>
              <div className="hero-creature">
                <Creature
                  phase={phase}
                  helpers={state?.agents.length || 0}
                  workers={state?.contributors || 0}
                  studio={studio}
                  edition={edition}
                />
              </div>
            </section>
            <div className="habitat-status">
              <div>
                <span className={`live-dot ${asleep ? "rest" : ""}`} />
                <span>{status}</span>
              </div>
              <span>
                {studio ? "MAC STUDIO" : "POWERED BY VISITORS"}{" "}
                <span className="status-separator">/</span> QWEN 0.5B
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
                Not a chatbot. Not an intelligence score. A shared, slightly
                strange experiment in what a small model can make with a few
                borrowed hands.
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
          aria-label="Close contribution options"
        >
          <X size={20} />
        </button>
        <div className="dialog-pet">
          <LittleHeld />
        </div>
        <span className="eyebrow">A LITTLE TIME, ON YOUR TERMS</span>
        <h2 id="consent-title">Give it room to think.</h2>
        <p>
          Your browser will run a complete copy of the tiny model and take real
          jobs from Held. You can stop whenever you like.
        </p>
        <div className="consent-facts">
          <span>
            <DownloadIcon /> About <strong>300 MB</strong> to download once
          </span>
          <span>
            <Cpu size={16} /> Around <strong>1 GB</strong> of working memory
          </span>
          <span>
            <Heart size={16} /> Uses power; may warm your device
          </span>
        </div>
        <fieldset className="duty-options">
          <legend>How much room would you like to lend?</legend>
          {[
            { value: 0.05, label: "Gentle", hint: "5% duty" },
            { value: 0.1, label: "A little more", hint: "10% duty" },
            { value: 0.2, label: "Room to roam", hint: "20% duty" },
          ].map((option) => (
            <label
              key={option.value}
              className={duty === option.value ? "chosen" : ""}
            >
              <input
                type="radio"
                name="duty"
                value={option.value}
                checked={duty === option.value}
                onChange={() => setDuty(option.value)}
              />
              <strong>{option.label}</strong>
              <span>{option.hint}</span>
            </label>
          ))}
        </fieldset>
        <p className="consent-detail">
          Short bursts of work, then measured rest. These are work/rest targets,
          not exact GPU percentages. Downloading and loading take extra work.
          Hidden tabs pause generation; closing this page stops it. Model files
          may stay cached.
        </p>
        <button className="button dark" onClick={() => void startCompute()}>
          Start lending compute <ArrowRight size={16} />
        </button>
        <button
          className="text-button just-watch"
          onClick={() => {
            setDialog(false);
          }}
        >
          I’ll just watch
        </button>
      </dialog>
    </>
  );
}
function DownloadIcon() {
  return <ArrowDown size={16} />;
}
