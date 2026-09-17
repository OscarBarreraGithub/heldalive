import { useEffect, useRef, useState } from "react";
import type { Observatory } from "../shared/observatory";
import type { Snapshot } from "../shared/protocol";
import { LittleHeld } from "./Creature";
export function ObservatoryWorld({
  data,
  online,
  state,
  openMural,
}: {
  data: Observatory | null;
  online: boolean;
  state: Snapshot | null;
  openMural: () => void;
}) {
  const status = data?.status;
  const station = online ? status?.station : "rest";
  const working = online && status?.state === "working";
  const place =
    station === "research" || station === "funding"
      ? "computer"
      : station === "mural"
        ? "mural"
        : "window";
  const [turning, setTurning] = useState(false);
  const previous = useRef(place);
  useEffect(() => {
    if (previous.current === place) return;
    previous.current = place;
    setTurning(true);
    const timer = setTimeout(() => setTurning(false), 1600);
    return () => clearTimeout(timer);
  }, [place]);
  return (
    <div
      className={`observatory-world place-${place} ${working ? "is-working" : ""}`}
      aria-label="The alien's observatory"
    >
      <div className="observatory-label">
        <span>OBSERVATORY 001</span>
        <span>
          <i className={`live-dot ${working ? "" : "rest"}`} />
          {!online
            ? "researcher offline"
            : working
              ? "at work"
              : station === "rest"
                ? "resting"
                : "between thoughts"}
        </span>
      </div>
      <div className="starfield" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="moon-window" aria-hidden="true">
        <div className="moon" />
        <span>somewhere, for now.</span>
      </div>
      <a
        href="#research"
        className="research-station"
        aria-label="Visit the research notebook"
      >
        <div className="computer-monitor">
          <div className="monitor-bar">
            <i />
            <i />
            <i />
          </div>
          <div className="terminal-lines">
            <span>memory / experiment</span>
            <span>
              {working ? "processing evidence_" : "waiting for next thought_"}
            </span>
            <b>
              {state?.trials[0]
                ? `${state.trials[0].correct} / 3 recalled`
                : "read · test · remember"}
            </b>
            <span>continuity saved.</span>
          </div>
        </div>
        <div className="computer-neck" />
        <div className="computer-desk" />
        <div className="computer-chair" />
        <span className="station-caption">the work of remembering ↗</span>
      </a>
      <button
        className="mural-station"
        onClick={openMural}
        aria-label="Open the growing ASCII mural"
      >
        <div className="mini-mural">
          <pre aria-hidden="true">
            {data?.mural?.text ||
              "       .      +\n    .     _     .\n       .-(_)-.\n  ____/_______\\____\n      .     .\n   a blank horizon"}
          </pre>
        </div>
        <span className="station-caption">the unfinished mural ↗</span>
      </button>
      <div className={`observatory-alien ${turning ? "ship-turning" : ""}`}>
        <span className="alien-thought">
          {!online
            ? "a little quiet"
            : working
              ? station === "mural"
                ? "a little more detail…"
                : station === "funding"
                  ? "how to pay the rent?"
                  : "what is worth remembering?"
              : station === "rest"
                ? "until tomorrow."
                : "keeping a thought for later."}
        </span>
        <LittleHeld sleeping={station === "rest"} />
        <div className="alien-shadow" />
      </div>
      <div className="world-floor" aria-hidden="true" />
      <p className="world-footnote">
        Its movements illustrate the schedule. The work is in the notebook.
      </p>
    </div>
  );
}
