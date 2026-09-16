import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Cpu,
  Palette,
  Sparkles,
  X,
} from "lucide-react";
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
  desk: "The flight console",
  drawing: "The drawing station",
  reading: "The memory library",
  window: "A little stargazing",
};
const descriptions: Record<Place, string> = {
  desk: "Held chooses a project. A smaller figure means a temporary job using this same model, not a separate AI installed in your tab. Each complete browser group can run one job at a time.",
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
      <ellipse cx="115" cy="145" rx="103" ry="8" fill="#CCD3C8" opacity=".4" />
      <path
        d="M29 101v44m163-44v44"
        stroke="#82978F"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <rect
        x="15"
        y="89"
        width="196"
        height="15"
        rx="6"
        fill="#BBCDC2"
        stroke="#82978F"
        strokeWidth="2"
      />
      <rect
        x="52"
        y="14"
        width="115"
        height="75"
        rx="9"
        fill="#E3E8D7"
        stroke="#82978F"
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
      <path
        d="M24 87V70H42V87M33 69V54"
        fill="#C4D0C2"
        stroke="#82978F"
        strokeWidth="2"
      />
      <circle cx="33" cy="52" r="4" fill="#E5AC84" />
      <path
        d="M179 83H197M182 75H194"
        stroke="#82978F"
        strokeWidth="3"
        strokeLinecap="round"
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
          stroke="#8E9F9A"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <rect
          x="26"
          y="34"
          width="108"
          height="96"
          rx="3"
          fill="#B5C6BE"
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
          stroke="#8E9F9A"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {!drawing && (
          <>
            <path
              d="m77 57 5 16 16 5-16 5-5 16-5-16-16-5 16-5Z"
              fill="#D6CBB0"
              stroke="#B8A889"
              strokeWidth="1.5"
            />
            <circle cx="102" cy="105" r="3" fill="#ADBBA5" />
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
/** Open cutaway of Oscar's saucer: dome, broad rim, and paired hull marks. */
function SaucerHome() {
  return (
    <svg
      className="saucer-home"
      viewBox="0 0 600 520"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M83 342C129 237 193 94 299 94C406 94 474 233 520 342"
        fill="#EDF0E7"
        fillOpacity=".65"
        stroke="#C9D3C8"
        strokeWidth="2"
      />
      <path
        d="M296 94V81H303V73H298V61H305V50"
        stroke="#A6B6A9"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M82 331C182 391 419 391 520 331L574 383C505 468 117 470 28 384Z"
        fill="#DFE7DB"
        stroke="#ABBDAF"
        strokeWidth="2"
      />
      <path
        d="M28 384C129 457 473 461 574 383L586 398C491 496 114 493 15 399Z"
        fill="#B7C8BB"
        stroke="#8CA397"
        strokeWidth="2"
      />
      <path
        d="M83 344C197 405 410 402 520 344"
        stroke="#F8F9ED"
        strokeWidth="5"
      />
      <path
        d="m77 383 14 7m-10-15 14 7m35 14 17 5m-12-14 17 5m40 9 18 3m-15-13 18 3m43 5 18 1m-15-11 18 1m43 0 18-1m-15-9 18-1m42-4 18-3m-15-7 18-3m41-7 17-5m-13-5 17-5m34-11 14-7m-11-3 14-7"
        stroke="#718E80"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M76 465C219 497 407 496 529 465"
        stroke="#D9DDCF"
        strokeWidth="2"
        strokeDasharray="2 9"
      />
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
      ? "No complete mind. No new thoughts."
      : original
        ? original.title || "a thought is growing"
        : helpers.length
          ? `waiting for ${helpers.length === 1 ? "a helper" : "its helpers"}`
          : "a moment between thoughts";
  return (
    <div
      className={`open-world at-${place} ${agents.length ? "world-working" : "world-resting"} ${coffee ? "world-coffee" : ""} ${asleep ? "world-unpowered" : ""}`}
      aria-label="Held’s spacecraft workspace"
    >
      <div className="world-heading">
        <span className="handwritten">a visitor, held by visitors.</span>
        <span className="world-live">
          <i className={`live-dot ${agents.length ? "" : "rest"}`} />{" "}
          {agents.length
            ? "real work, happening now"
            : asleep
              ? "waiting for a complete mind"
              : "between little things"}
        </span>
      </div>
      <SaucerHome />
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
          <Sparkles size={12} /> stargazing
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
          <Cpu size={12} /> console & helpers
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
          <Palette size={12} /> drawing station
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
          <BookOpen size={12} /> memory library
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
          title={`${agent.title} · ${agent.source === "mac" ? "preview support" : "browser group"}`}
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
          ? `${helpers.length} temporary helper ${helpers.length === 1 ? "job" : "jobs"} · the same model.`
          : "Small figures are temporary tasks using this same model."}
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
                    ? "Running on temporary preview support"
                    : "Running across browsers"}{" "}
                  · {job.characters || 0} characters written
                </small>
                <small>
                  {job.inputWords ?? "—"} input words · up to{" "}
                  {job.maxOutputTokens ?? "—"} output tokens
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
