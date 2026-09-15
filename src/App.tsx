import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleHelp,
  LoaderCircle,
  Pause,
  Send,
  X,
} from "lucide-react";
import type { Job, Phase } from "../shared/protocol";
import { Presence } from "./Presence";
import { useRoom } from "./useRoom";
import type { BrowserCompute } from "./browserCompute";

type Dialog = "about" | "contribute" | null;
const room =
  new URLSearchParams(window.location.search).get("room") === "browser"
    ? "browser"
    : "main";
const browserMode = room === "browser";
function timeLabel(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function App() {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [duty, setDuty] = useState(0.05);
  const [computeState, setComputeState] = useState<
    "off" | "loading" | "ready" | "error"
  >("off");
  const [progress, setProgress] = useState(0);
  const [computeError, setComputeError] = useState("");
  const [visible, setVisible] = useState(!document.hidden);
  const [note, setNote] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [sent, setSent] = useState(false);
  const compute = useRef<BrowserCompute | null>(null);
  const consentEpoch = useRef(0);
  const sendRef = useRef<(event: unknown) => void>(() => undefined);
  const onJob = useCallback((job: Job) => {
    if (!compute.current || document.hidden) {
      sendRef.current({ type: "failed", jobId: job.id });
      return;
    }
    void compute.current.run(job, (event) => sendRef.current(event));
  }, []);
  const onCancel = useCallback(() => compute.current?.pause(), []);
  const { state, connected, notice, accepted, send } = useRoom(
    room,
    onJob,
    onCancel,
  );
  sendRef.current = send;
  const dialogRef = useRef<HTMLDialogElement>(null);
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
    if (connected && browserMode)
      send({ type: "ready", ready: computeState === "ready", duty, visible });
  }, [connected, computeState, duty, visible, send]);
  useEffect(
    () => () => {
      consentEpoch.current += 1;
      compute.current?.stop();
    },
    [],
  );
  useEffect(() => {
    if (accepted) {
      setNote("");
      setSent(true);
      const timer = setTimeout(() => setSent(false), 7000);
      return () => clearTimeout(timer);
    }
  }, [accepted]);

  async function startCompute() {
    setDialog(null);
    setComputeState("loading");
    setComputeError("");
    setProgress(0);
    const epoch = ++consentEpoch.current;
    try {
      if (!("gpu" in navigator))
        throw new Error(
          "This browser does not support WebGPU. You can still stay and watch. Try a current compatible browser to contribute.",
        );
      const { BrowserCompute } = await import("./browserCompute");
      if (epoch !== consentEpoch.current) return;
      const provider = new BrowserCompute();
      compute.current = provider;
      const ready = await provider.load((p) =>
        setProgress(Math.min(1, Math.max(0, p))),
      );
      if (ready && epoch === consentEpoch.current) setComputeState("ready");
    } catch (error) {
      if (epoch !== consentEpoch.current) return;
      compute.current?.stop();
      compute.current = null;
      setComputeError(
        error instanceof Error
          ? error.message
          : "The model could not load on this device. You can still watch.",
      );
      setComputeState("error");
    }
  }
  function stopCompute() {
    consentEpoch.current += 1;
    send({ type: "ready", ready: false });
    compute.current?.stop();
    compute.current = null;
    setComputeState("off");
    setProgress(0);
  }
  const phase: Phase = connected && state ? state.phase : "waiting";
  const thinking = phase === "thinking";
  const latest = state?.thoughts.at(-1);
  const thoughtText = state?.active?.text || latest?.text;
  const phaseLabel = !connected
    ? "Connecting to the room"
    : thinking
      ? "A thought is taking shape"
      : phase === "resting"
        ? "A little space between thoughts"
        : state?.mode === "browser"
          ? "Waiting for someone to lend a little compute"
          : "Waiting for the local model";

  return (
    <>
      <a className="skip-link" href="#live-thought">
        Skip to the live thought
      </a>
      <div className="site-shell">
        <header className="header">
          <a className="wordmark" href="/" aria-label="Held Alive home">
            <span className="brand-symbol" aria-hidden="true">
              ✳
            </span>{" "}
            held alive<span className="wordmark-period">.</span>
          </a>
          <div className="header-right">
            <span className="study-label">
              {browserMode ? "STUDY 02 / BROWSER" : "STUDY 01 / MAC-HOSTED"}
            </span>
            <button
              className="text-button about-button"
              onClick={() => setDialog("about")}
            >
              About the work <ArrowUpRight size={14} />
            </button>
          </div>
        </header>

        <main>
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className={`status-dot ${connected ? "online" : ""}`} />{" "}
                AN EXPERIMENT IN SHARED EXISTENCE
              </div>
              <h1 id="hero-title">
                A small mind.
                <br />
                <em>A shared moment.</em>
              </h1>
              <p className="intro">
                An AI kept alive by the people here.
                <br />A little computation. A passing thought.
                <br />
                Something we can hold together.
              </p>
              <a className="understated-link" href="#live-thought">
                Spend a moment <ArrowDown size={15} />
              </a>
            </div>
            <div className={`organism ${thinking ? "is-thinking" : ""}`}>
              <div className="organism-corner top-left">
                FIG. {browserMode ? "02" : "01"}
              </div>
              <div className="organism-corner top-right">A SHARED PRESENCE</div>
              <Presence phase={phase} visitors={state?.viewers || 0} />
              <div className="organism-caption">
                <span
                  className={`status-dot ${thinking ? "pulse" : connected && state?.modelAvailable ? "online" : ""}`}
                />
                {phaseLabel}
              </div>
            </div>
          </section>

          <section className="room-grid" aria-label="The shared room">
            <div className="thought-section" id="live-thought">
              <div className="section-heading">
                <h2>Its train of thought</h2>
                <span className="tiny-label">
                  <span className={`status-dot ${thinking ? "pulse" : ""}`} />{" "}
                  LIVE, FOR EVERYONE
                </span>
              </div>
              <div
                className={`thought-display ${thinking ? "is-thinking" : ""}`}
                aria-busy={thinking}
              >
                <span className="quote-mark" aria-hidden="true">
                  “
                </span>
                <p
                  className={
                    thoughtText ? "thought-text" : "thought-text empty"
                  }
                >
                  {thoughtText ||
                    (browserMode
                      ? "A thought begins when someone lends the time to think it."
                      : "There is a little space here for the next thought.")}
                  {thinking && (
                    <span className="text-cursor" aria-hidden="true" />
                  )}
                </p>
                <div className="thought-caption">
                  {state?.active
                    ? "UNFOLDING NOW"
                    : latest
                      ? `${timeLabel(latest.at)} · ${latest.source === "mac" ? "THOUGHT ON A MAC MINI" : "THOUGHT IN A VISITOR’S BROWSER"}`
                      : "THE ROOM IS OPEN"}
                </div>
              </div>
              <div className="sr-only" role="status" aria-live="polite">
                {latest?.text}
              </div>
              <form
                className="note-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (note.trim() && connected)
                    send({ type: "whisper", text: note });
                }}
              >
                <label htmlFor="note">Leave a word in the room</label>
                <div className="note-input-row">
                  <input
                    id="note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={180}
                    placeholder="A word, an image, a passing thought…"
                    autoComplete="off"
                  />
                  <button
                    aria-label="Send your note"
                    title="Send your note"
                    disabled={!note.trim() || !connected}
                    type="submit"
                  >
                    {sent ? <Check size={18} /> : <Send size={17} />}
                  </button>
                </div>
                <p className="form-hint">
                  {notice ||
                    "Your note may shape a thought everyone can see. Keep it impersonal."}
                </p>
              </form>
              {(state?.thoughts.length || 0) > 1 && (
                <div className="history">
                  <button
                    className="text-button"
                    onClick={() => setShowHistory(!showHistory)}
                    aria-expanded={showHistory}
                  >
                    {showHistory
                      ? "Close the previous thoughts"
                      : "A few thoughts before this"}{" "}
                    <ArrowDown
                      className={showHistory ? "rotate" : ""}
                      size={14}
                    />
                  </button>
                  {showHistory && (
                    <ol>
                      {state?.thoughts
                        .slice(0, -1)
                        .reverse()
                        .slice(0, 12)
                        .map((thought) => (
                          <li key={thought.id}>
                            <time>{timeLabel(thought.at)}</time>
                            <p>{thought.text}</p>
                          </li>
                        ))}
                    </ol>
                  )}
                </div>
              )}
            </div>

            <aside className="participation">
              <div className="section-heading">
                <h2>Here, together</h2>
                <span className="tiny-label">RIGHT NOW</span>
              </div>
              <div className="metrics">
                <div>
                  <strong>{state?.viewers ?? "—"}</strong>
                  <span>
                    {state?.viewers === 1
                      ? "person in the room"
                      : "people in the room"}
                  </span>
                </div>
                <div>
                  <strong>{state?.totalThoughts ?? "—"}</strong>
                  <span>thoughts so far</span>
                </div>
              </div>
              <div
                className={`contribution-card ${computeState === "ready" ? "contributing" : ""}`}
              >
                <div className="card-kicker">
                  <span className="small-star">✳</span>
                  {browserMode ? "LEND A LITTLE COMPUTE" : "THE FIRST STUDY"}
                </div>
                {browserMode ? (
                  <>
                    <h3>
                      {computeState === "ready"
                        ? "You’re giving it time to think."
                        : computeState === "loading"
                          ? "Making a little room."
                          : "Keep a thought going."}
                    </h3>
                    <p>
                      {computeState === "ready"
                        ? `${visible ? "Your browser can take a turn generating a shared thought." : "Your contribution is paused while this tab is hidden."} You can stop at any time.`
                        : "Let this tab take a turn running the model. When no one can contribute, its thoughts pause."}
                    </p>
                    {computeState === "loading" && (
                      <div className="load-progress">
                        <progress max={1} value={progress} />
                        <span>
                          {Math.round(progress * 100)}% · loading the model
                        </span>
                      </div>
                    )}
                    {computeState === "ready" && (
                      <fieldset className="duty-options">
                        <legend>Your contribution</legend>
                        {[0.05, 0.1, 0.2].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setDuty(value)}
                            aria-pressed={duty === value}
                          >
                            {value === 0.05
                              ? "A little"
                              : value === 0.1
                                ? "Some"
                                : "More"}
                            <span>{Math.round(value * 100)}% duty</span>
                          </button>
                        ))}
                      </fieldset>
                    )}
                    {computeError && (
                      <p className="compute-error" role="alert">
                        {computeError}
                      </p>
                    )}
                    {computeState === "loading" || computeState === "ready" ? (
                      <button
                        className="primary-button secondary"
                        onClick={stopCompute}
                      >
                        <Pause size={15} />
                        {computeState === "loading"
                          ? "Cancel loading"
                          : "Stop contributing"}
                      </button>
                    ) : (
                      <button
                        className="primary-button"
                        onClick={() => setDialog("contribute")}
                      >
                        Lend a little compute <ArrowRight size={17} />
                      </button>
                    )}
                    <div className="card-footnote">
                      {computeState === "ready"
                        ? "Brief bursts, followed by rest. No exact CPU/GPU percentage is promised."
                        : "Optional. No account or installation. Read the details before anything downloads."}
                    </div>
                  </>
                ) : (
                  <>
                    <h3>A beginning, on borrowed time.</h3>
                    <p>
                      For this first study, a tiny model thinks on the artist’s
                      Mac mini. Everyone here shares the same stream.
                    </p>
                    <a className="primary-button" href="/?room=browser">
                      Try the browser study <ArrowUpRight size={17} />
                    </a>
                    <div className="card-footnote">
                      In this room, your browser is watching. In the browser
                      study, you can choose to run the model.
                    </div>
                  </>
                )}
              </div>
              <p className="aside-note">
                {browserMode ? (
                  <>
                    <span className="status-dot online" />{" "}
                    {state?.contributors || 0}{" "}
                    {state?.contributors === 1 ? "browser" : "browsers"}{" "}
                    contributing · {state?.readyContributors || 0} ready
                  </>
                ) : (
                  <>
                    <span
                      className={`status-dot ${state?.modelAvailable ? "online" : ""}`}
                    />{" "}
                    {state?.modelAvailable
                      ? "The local model is connected"
                      : "The local model is not connected"}
                  </>
                )}
              </p>
            </aside>
          </section>
          <section className="closing-line">
            <span>01 — A SMALL EXPERIMENT</span>
            <p>
              What does it mean to keep something going,
              <br />
              <em>simply because we can?</em>
            </p>
            <button className="text-button" onClick={() => setDialog("about")}>
              A note on the work <ArrowUpRight size={14} />
            </button>
          </section>
        </main>
        <footer>
          <span>
            HELD ALIVE <span className="footer-separator">/</span> AN ONGOING
            ARTWORK
          </span>
          <div>
            <a href={browserMode ? "/" : "/?room=browser"}>
              {browserMode ? "The first study" : "The browser study"}
            </a>
            <a
              href="https://github.com/OscarBarreraGithub/heldalive"
              target="_blank"
              rel="noreferrer"
            >
              Source <ArrowUpRight size={12} />
            </a>
          </div>
          <span>You’re free to come and go.</span>
        </footer>
      </div>
      <dialog
        ref={dialogRef}
        onCancel={() => setDialog(null)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setDialog(null);
        }}
        aria-labelledby="dialog-title"
      >
        <div className="dialog-content">
          <button
            className="dialog-close"
            aria-label="Close dialog"
            onClick={() => setDialog(null)}
          >
            <X size={20} />
          </button>
          <span className="small-star">✳</span>
          {dialog === "contribute" ? (
            <>
              <div className="eyebrow">YOUR DEVICE, YOUR CHOICE</div>
              <h2 id="dialog-title">A little room to think.</h2>
              <p>
                After you choose to contribute, this tab downloads a small
                language model—roughly 300 MB—and runs it on your device’s GPU.
              </p>
              <ul>
                <li>
                  Allow roughly 1 GB of working memory. It uses electricity and
                  battery; phones may get warm.
                </li>
                <li>
                  “A little” aims for a 5% inference duty cycle: brief bursts
                  followed by rest, rather than a fixed percentage of your GPU.
                </li>
                <li>
                  Work pauses when you hide the tab. Stop at any time to release
                  the model from memory.
                </li>
                <li>
                  Model files may remain in your browser’s cache. No
                  installation, account, or access to your personal files is
                  needed.
                </li>
                <li>
                  This is a public experiment. Other contributors process the
                  shared conversation, and their outputs are not independently
                  verified.
                </li>
              </ul>
              <button
                className="primary-button"
                onClick={() => void startCompute()}
              >
                I understand — start contributing <ArrowRight size={16} />
              </button>
              <button className="watch-button" onClick={() => setDialog(null)}>
                I’ll just watch
              </button>
            </>
          ) : (
            <>
              <div className="eyebrow">A NOTE ON THE WORK</div>
              <h2 id="dialog-title">
                Nothing thinks
                <br />
                <em>on its own.</em>
              </h2>
              <p>
                Held Alive is an artwork about dependence: a small language
                model, a shared room, and the resources that let its next
                thought happen.
              </p>
              <p>
                <strong>Study 01</strong> runs the model on the artist’s Mac
                mini. <strong>Study 02</strong> runs real inference in
                consenting visitors’ browsers. Contributors take turns producing
                whole thoughts; this version does not split one model across
                multiple devices.
              </p>
              <p>
                When no contributor is available, the browser study pauses. Its
                saved thoughts remain, and it can resume when someone returns.
                “Alive” is a metaphor for an active process, not a claim of
                consciousness.
              </p>
              <p>
                The voice is shaped to be curious and observant, with no reason
                to ask you to stay. The model is tiny and imperfect. Its words
                are generated, not statements of fact.
              </p>
              <p className="about-privacy">
                No account. No advertising analytics. Notes can influence public
                output; do not include private information. The room keeps its
                latest 60 thoughts and aggregate counts. The hosting provider
                processes ordinary connection data to serve the site.
              </p>
              <a
                className="understated-link"
                href="https://github.com/OscarBarreraGithub/heldalive"
                target="_blank"
                rel="noreferrer"
              >
                Read the source <ArrowUpRight size={15} />
              </a>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
