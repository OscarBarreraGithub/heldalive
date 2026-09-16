import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Image, Palette, Sparkles, X } from "lucide-react";
import type { Snapshot } from "../shared/protocol";
import { LittleHeld } from "./Creature";
import { AsciiCanvas } from "./AsciiCanvas";
type Place = "drawing" | "gallery" | "window";
const labels: Record<Place, string> = {
  drawing: "The drawing desk",
  gallery: "The sketch collection",
  window: "A little orbit",
};
export function HabitatWorld({
  state,
  boosted,
}: {
  state: Snapshot | null;
  boosted: boolean;
}) {
  const [selected, setSelected] = useState<Place | null>(null);
  const [hello, setHello] = useState(false);
  const [idlePlace, setIdlePlace] = useState<Place>("window");
  const [turning, setTurning] = useState(false);
  const agents = (state?.agents || []).filter((a) => a.kind === "art");
  const main = agents[0];
  const helpers = agents.slice(1);
  const asleep = !state?.modelAvailable;
  const place: Place = main ? "drawing" : asleep ? "gallery" : idlePlace;
  const previous = useRef(place);
  useEffect(() => {
    if (asleep) return;
    const timer = setInterval(
      () => setIdlePlace((p) => (p === "window" ? "gallery" : "window")),
      17000,
    );
    return () => clearInterval(timer);
  }, [asleep]);
  useEffect(() => {
    if (previous.current === place) return;
    previous.current = place;
    setTurning(true);
    const timer = setTimeout(() => setTurning(false), 1500);
    return () => clearTimeout(timer);
  }, [place]);
  useEffect(() => {
    if (hello) {
      const t = setTimeout(() => setHello(false), 2000);
      return () => clearTimeout(t);
    }
  }, [hello]);
  const current = main?.draft || state?.artworks[0]?.text || "";
  return (
    <div
      className={`open-world art-world at-${place} ${asleep ? "world-unpowered" : ""} ${main ? "world-working" : "world-resting"} ${boosted ? "world-boosted" : ""}`}
      aria-label="The alien’s drawing space"
    >
      <div className="world-heading">
        <span className="handwritten">held here, by you.</span>
        <span className="world-live">
          <i className={`live-dot ${main ? "" : "rest"}`} />
          {main
            ? "a real sketch, in progress"
            : asleep
              ? "waiting for enough compute"
              : "between drawings"}
        </span>
      </div>
      <div className="orbit-trail" aria-hidden="true" />
      <span className="orbit-star star-a" aria-hidden="true">
        ✧
      </span>
      <span className="orbit-star star-b" aria-hidden="true">
        +
      </span>
      <span className="orbit-star star-c" aria-hidden="true">
        ·
      </span>
      <button
        className="station station-window"
        onClick={() => setSelected(selected === "window" ? null : "window")}
        aria-label="Inspect the orbit"
        aria-pressed={selected === "window"}
      >
        <svg viewBox="0 0 120 90" aria-hidden="true">
          <circle cx="60" cy="42" r="23" fill="#E4D6B8" />
          <path
            d="M30 53C-7 82 129 40 85 29"
            fill="none"
            stroke="#B1BFA7"
            strokeWidth="3"
          />
          <path d="m19 17 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="#ADBEA5" />
          <circle cx="100" cy="64" r="2" fill="#ADBEA5" />
        </svg>
        <span className="station-label">
          <Sparkles size={12} /> a little orbit
        </span>
      </button>
      <button
        className={`station station-drawing ${main ? "occupied" : ""}`}
        onClick={() => setSelected(selected === "drawing" ? null : "drawing")}
        aria-label="Inspect live drawing"
        aria-pressed={selected === "drawing"}
      >
        <span className="station-label">
          <Palette size={12} />
          {main ? "drawing now" : "the drawing desk"}
        </span>
        <div className="drawing-board">
          <span className="board-clip" />
          <AsciiCanvas
            text={current}
            compact
            live={Boolean(main)}
            label="The current sketch"
          />
        </div>
        <div className="drawing-legs" aria-hidden="true" />
      </button>
      <button
        className="station station-gallery"
        onClick={() => setSelected(selected === "gallery" ? null : "gallery")}
        aria-label="Inspect saved sketches"
        aria-pressed={selected === "gallery"}
      >
        <div className="sketch-stack" aria-hidden="true">
          <span />
          <span />
          <span>
            <i>✳</i>
          </span>
        </div>
        <span className="station-label">
          <Image size={12} /> {state?.artworkCount || 0} saved sketches
        </span>
      </button>
      <div
        className={`wandering-held ${asleep ? "held-asleep" : ""} ${hello ? "held-hello" : ""} ${turning ? "ship-turning" : ""}`}
      >
        <span className="held-speech" role="status">
          {hello
            ? "hello, visitor."
            : asleep
              ? "No complete mind. No new drawings."
              : main
                ? "one little mark at a time…"
                : "a pause between pages"}
        </span>
        <button
          onClick={() => setHello(true)}
          aria-label="Wave to the alien"
          title="A local animation. No prompt is sent to the model."
        >
          <LittleHeld sleeping={asleep && !hello} />
        </button>
        <span className="held-ground" />
      </div>
      {!!helpers.length && (
        <div
          className="helper-fleet"
          aria-label={`${helpers.length} extra drawing jobs`}
        >
          {helpers.map((a) => (
            <span
              className="world-helper"
              key={a.id}
              title={`${a.title} · ${a.source === "browser" ? "browser group" : "preview support"}`}
            >
              <LittleHeld mini />
            </span>
          ))}
        </div>
      )}
      <div className="world-caption">
        {helpers.length
          ? `${helpers.length} smaller ${helpers.length === 1 ? "saucer is" : "saucers are"} making extra drawings.`
          : "One little visitor. A sketchbook held open by all of us."}
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
          <p>
            {selected === "drawing"
              ? "Each complete browser group can make one ASCII drawing at a time. Extra groups make more drawings in parallel. The smaller saucers represent those real jobs."
              : selected === "gallery"
                ? "Finished drawings are saved in the collection. Keep a favorite in this browser, or download the original text with every space intact."
                : "The ship’s orbit and spins are animation. The model only makes ASCII drawings; it does not run hidden conversations while resting."}
          </p>
          {selected === "drawing" &&
            (agents.length ? (
              agents.map((a) => (
                <div className="station-job" key={a.id}>
                  <strong>{a.title}</strong>
                  <small>
                    {a.source === "mac"
                      ? "Temporary preview support"
                      : "Across browsers"}{" "}
                    · {a.characters || 0} characters
                  </small>
                  <small>
                    {a.inputWords ?? "—"} input words · up to{" "}
                    {a.maxOutputTokens ?? "—"} output tokens
                  </small>
                </div>
              ))
            ) : (
              <small>No drawing is running right now.</small>
            ))}
          <a href={selected === "gallery" ? "#collection" : "#experiment"}>
            {selected === "gallery" ? "Open the collection" : "How it works"}
            <ArrowUpRight size={12} />
          </a>
        </section>
      )}
    </div>
  );
}
