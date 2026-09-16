import { useEffect, useState } from "react";
import { ArrowUpRight, BookOpen, Cpu, Palette, Sprout, X } from "lucide-react";
import type { Snapshot, TaskKind } from "../shared/protocol";
import { LittleHeld } from "./Creature";
type Place = "desk" | "drawing" | "reading" | "window";
const placeFor = (kind: TaskKind): Place =>
  kind === "art"
    ? "drawing"
    : ["pack", "recall", "method", "reflect"].includes(kind)
      ? "reading"
      : kind === "wander"
        ? "window"
        : "desk";
const labels: Record<Place, string> = {
  desk: "The little computer",
  drawing: "The drawing table",
  reading: "The reading corner",
  window: "A little free time",
};
const descriptions: Record<Place, string> = {
  desk: "Held chooses a project and asks copies of its own model for help. Each extra complete browser group can run another job.",
  drawing:
    "Helpers turn Held’s ideas into small ASCII drawings. Finished pieces go into the collection, exactly as the model made them.",
  reading:
    "Held writes memory instructions; helpers try them, test what they remember, and bring back the results.",
  window:
    "A turn with no assignment to solve: Held writes a small observation. Wandering animations are decorative; the work log records real computation.",
};
export function CoffeeCup({ large = false }: { large?: boolean }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={large ? "coffee-illustration large" : "coffee-illustration"}
    >
      <path
        className="cup-steam"
        d="M23 20c-7-8 7-8 0-16M35 19c-7-8 7-8 0-16"
        fill="none"
        stroke="#BD947C"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <ellipse cx="30" cy="55" rx="25" ry="5" fill="#DCCAB4" />
      <path
        d="M45 29h7c12 0 9 17-3 17h-6"
        stroke="#A86D53"
        strokeWidth="6"
        fill="none"
      />
      <path
        d="M10 25h38v15c0 12-8 17-19 17s-19-5-19-17Z"
        fill="#E8A381"
        stroke="#A86D53"
        strokeWidth="1.7"
      />
      <ellipse
        cx="29"
        cy="25"
        rx="19"
        ry="5"
        fill="#B57B57"
        stroke="#A86D53"
        strokeWidth="1.7"
      />
      <ellipse cx="29" cy="25" rx="14" ry="2.5" fill="#6B483B" />
      <path
        d="M23 40c0-7 7-6 7-2 1-4 8-4 7 2-1 4-7 7-7 7s-6-3-7-7"
        fill="#FFF4DF"
      />
    </svg>
  );
}
function Desk() {
  return (
    <svg viewBox="0 0 230 160" aria-hidden="true">
      <ellipse cx="115" cy="145" rx="103" ry="8" fill="#E5DFCF" />
      <path
        d="M29 101v44m163-44v44"
        stroke="#A88762"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <rect
        x="15"
        y="89"
        width="196"
        height="15"
        rx="6"
        fill="#D6B58C"
        stroke="#AB8C64"
        strokeWidth="2"
      />
      <rect
        x="52"
        y="14"
        width="115"
        height="75"
        rx="9"
        fill="#D4DDC5"
        stroke="#7A8C73"
        strokeWidth="2.5"
      />
      <rect x="60" y="22" width="99" height="56" rx="4" fill="#374B40" />
      <path
        d="m71 37 7 5-7 5m17 0h18M73 58h30m8 0h18"
        stroke="#C5E4AD"
        strokeWidth="3"
        fill="none"
      />
      <rect
        className="terminal-cursor"
        x="136"
        y="55"
        width="7"
        height="8"
        fill="#C5E4AD"
      />
      <path d="M96 86v6h31v-6" fill="#7A8C73" />
      <rect x="70" y="98" width="78" height="7" rx="3" fill="#EEECDD" />
      <path d="M22 65v23h21V65" fill="#E7C59D" />
      <path
        d="M33 67V42m0 15c-17 1-22-17-11-15l11 8m0 5c19 0 23-18 13-16L33 48"
        stroke="#77987B"
        strokeWidth="4"
        fill="#9DBAA0"
      />
    </svg>
  );
}
function Easel({ drawing }: { drawing?: string }) {
  return (
    <div className="easel-art">
      <svg viewBox="0 0 160 174" aria-hidden="true">
        <path
          d="m32 161 25-139m66 139L94 22M70 146h35"
          stroke="#A68B67"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <rect
          x="26"
          y="34"
          width="108"
          height="96"
          rx="3"
          fill="#E0CBA4"
          transform="rotate(3 80 80)"
        />
        <rect
          x="28"
          y="31"
          width="102"
          height="93"
          rx="3"
          fill="#FFFDF4"
          stroke="#D8CCB5"
          transform="rotate(-3 80 80)"
        />
        <path
          d="M22 128h113"
          stroke="#A68B67"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {!drawing && (
          <>
            <path
              d="M81 99V66m0 13C56 79 57 56 72 63l9 11m0 10c29-2 27-24 12-17l-12 9"
              fill="#B3C9A1"
              stroke="#91A480"
              strokeWidth="2"
            />
            <path d="M66 97h29l-6 20H73Z" fill="#E7B69A" />
          </>
        )}
        <path d="m139 114 9-40" stroke="#C59565" strokeWidth="4" />
        <path d="m146 81 4-15 5 3-5 13" fill="#AA7972" />
      </svg>
      {drawing && (
        <pre className="canvas-draft" aria-hidden="true">
          {drawing
            .split("\n")
            .slice(0, 7)
            .map((l) => l.slice(0, 18))
            .join("\n")}
        </pre>
      )}
    </div>
  );
}
function Books() {
  return (
    <svg viewBox="0 0 185 140" aria-hidden="true">
      <ellipse cx="94" cy="127" rx="76" ry="9" fill="#E5DFCF" />
      <rect
        x="22"
        y="92"
        width="138"
        height="23"
        rx="4"
        fill="#BAACA9"
        stroke="#8D818B"
        strokeWidth="2"
      />
      <path d="M33 100h115m-114 6h114" stroke="#ECE6D6" strokeWidth="3" />
      <rect
        x="43"
        y="71"
        width="124"
        height="20"
        rx="4"
        fill="#B2C0A3"
        stroke="#7A8E70"
        strokeWidth="2"
      />
      <path d="M55 79h101" stroke="#F7F1DD" strokeWidth="6" />
      <path
        d="M15 36c34-6 62 0 80 11 18-11 42-15 71-10v39c-29-6-52-3-71 9-24-11-49-13-80-7Z"
        fill="#F8F0D9"
        stroke="#A99C7B"
        strokeWidth="2"
      />
      <path
        d="M95 47v37M29 48c23-2 38 1 52 7m-52 5c22-1 37 2 52 8m29-13 38-6m-38 16 38-6"
        fill="none"
        stroke="#C1B795"
        strokeWidth="2"
      />
      <path d="M122 39v20l7-5 6 4V37" fill="#DCA795" />
    </svg>
  );
}
export function HabitatWorld({
  state,
  coffee,
}: {
  state: Snapshot | null;
  coffee: boolean;
}) {
  const [selected, setSelected] = useState<Place | null>(null);
  const [hello, setHello] = useState(false);
  const [idlePlace, setIdlePlace] = useState<Place>("window");
  const agents = state?.agents || [];
  const original = agents.find((a) => a.role === "Held");
  const helpers = agents.filter((a) => a.role === "Helper");
  const asleep = !state?.modelAvailable;
  const place = original
    ? placeFor(original.kind)
    : helpers.length
      ? "desk"
      : asleep
        ? "reading"
        : idlePlace;
  useEffect(() => {
    const timer = setInterval(
      () => setIdlePlace((p) => (p === "window" ? "reading" : "window")),
      17000,
    );
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (hello) {
      const t = setTimeout(() => setHello(false), 2600);
      return () => clearTimeout(t);
    }
  }, [hello]);
  const workingAt = (p: Place) => agents.filter((a) => placeFor(a.kind) === p);
  const selectedJobs = selected ? workingAt(selected) : [];
  const newestArt = state?.artworks[0]?.text;
  const status = hello
    ? "oh, hello you!"
    : asleep
      ? "a little nap, for now"
      : original
        ? original.title || "a thought is growing"
        : helpers.length
          ? `waiting for ${helpers.length === 1 ? "a helper" : "its helpers"}`
          : "a moment between thoughts";
  return (
    <div
      className={`open-world at-${place} ${agents.length ? "world-working" : "world-resting"} ${coffee ? "world-coffee" : ""}`}
      aria-label="Held’s living workspace"
    >
      <div className="world-heading">
        <span className="handwritten">a little place to be.</span>
        <span className="world-live">
          <i className={`live-dot ${agents.length ? "" : "rest"}`} />{" "}
          {agents.length ? "real work, happening now" : "between little things"}
        </span>
      </div>
      <div className="world-floor" aria-hidden="true" />
      <div className="window-scene" aria-hidden="true">
        <div className="window-sun" />
        <div className="window-cloud" />
        <div className="window-hill" />
        <span />
      </div>
      <button
        className={`station station-window ${selected === "window" ? "selected" : ""}`}
        onClick={() => setSelected(selected === "window" ? null : "window")}
        aria-label="Inspect free time"
        aria-pressed={selected === "window"}
      >
        <span className="station-label">
          <Sprout size={12} /> daydreams
        </span>
      </button>
      <button
        className={`station station-desk ${workingAt("desk").length ? "occupied" : ""}`}
        onClick={() => setSelected(selected === "desk" ? null : "desk")}
        aria-label="Inspect computer and agents"
        aria-pressed={selected === "desk"}
      >
        <Desk />
        <span className="station-label">
          <Cpu size={12} /> plans & helping hands
        </span>
      </button>
      <button
        className={`station station-drawing ${workingAt("drawing").length ? "occupied" : ""}`}
        onClick={() => setSelected(selected === "drawing" ? null : "drawing")}
        aria-label="Inspect drawing area"
        aria-pressed={selected === "drawing"}
      >
        <Easel drawing={newestArt} />
        <span className="station-label">
          <Palette size={12} /> little creations
        </span>
      </button>
      <button
        className={`station station-reading ${workingAt("reading").length ? "occupied" : ""}`}
        onClick={() => setSelected(selected === "reading" ? null : "reading")}
        aria-label="Inspect reading and memory"
        aria-pressed={selected === "reading"}
      >
        <Books />
        <span className="station-label">
          <BookOpen size={12} /> things worth keeping
        </span>
      </button>
      <div className="world-trail trail-a" aria-hidden="true">
        · · · · ·
      </div>
      <div className="world-trail trail-b" aria-hidden="true">
        · · · · ·
      </div>
      <div
        className={`wandering-held ${asleep ? "held-asleep" : ""} ${hello ? "held-hello" : ""}`}
      >
        <span className="held-speech" role="status">
          {status}
        </span>
        <button
          onClick={() => setHello(true)}
          aria-label="Say hello to Held"
          title="A little hello. No message is sent to the model."
        >
          <LittleHeld sleeping={asleep && !hello} />
        </button>
        <span className="held-ground" />
      </div>
      {helpers.map((agent, index) => (
        <div
          className={`world-helper helper-at-${placeFor(agent.kind)}`}
          key={agent.id}
          style={{ "--helper-index": index } as React.CSSProperties}
          title={`${agent.title} · ${agent.source === "mac" ? "Mini" : "browser group"}`}
        >
          <LittleHeld mini />
          <span>
            {agent.kind === "art"
              ? "drawing"
              : agent.kind === "pack"
                ? "noting"
                : "recalling"}
          </span>
        </div>
      ))}
      {coffee && (
        <div className="world-cup">
          <CoffeeCup />
          <span>a little extra warmth</span>
        </div>
      )}
      <div className="world-caption">
        {helpers.length
          ? `${helpers.length} ${helpers.length === 1 ? "helper is" : "helpers are"} working on real model jobs.`
          : "Tap a corner to see what happens there."}
      </div>
      {selected && (
        <section className="station-inspector" aria-label={labels[selected]}>
          <button
            className="icon-button"
            aria-label="Close station details"
            onClick={() => setSelected(null)}
          >
            <X size={16} />
          </button>
          <h3>{labels[selected]}</h3>
          <p>{descriptions[selected]}</p>
          {selectedJobs.length ? (
            selectedJobs.map((job) => (
              <div className="station-job" key={job.id}>
                <strong>
                  <i className="live-dot" /> {job.role}: {job.title}
                </strong>
                <small>
                  {job.source === "mac"
                    ? "Running on the Mini"
                    : "Running across browsers"}{" "}
                  · {job.characters || 0} characters written
                </small>
                {job.draft && <pre>{job.draft}</pre>}
              </div>
            ))
          ) : (
            <small>No job at this corner right now.</small>
          )}
          <a href={selected === "drawing" ? "#collection" : "#experiment"}>
            Open {selected === "drawing" ? "the collection" : "the notebook"}{" "}
            <ArrowUpRight size={12} />
          </a>
        </section>
      )}
    </div>
  );
}
