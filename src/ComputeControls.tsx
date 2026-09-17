import { CURRENT_MODEL as model } from "../shared/model";
import budgets from "../shared/model-budgets.json";
import { CircleHelp, Pause, Zap } from "lucide-react";
import type { useHabitat } from "./useHabitat";
export function ComputeControls({
  habitat: h,
  explain,
}: {
  habitat: ReturnType<typeof useHabitat>;
  explain: () => void;
}) {
  const unavailable = h.status === "error" || h.status === "unsupported";
  const minutes = `${Math.floor(h.boostSeconds / 60)}:${String(h.boostSeconds % 60).padStart(2, "0")}`;
  return (
    <div className="compute-care">
      <div className="compute-care-heading">
        <Zap size={17} />
        <strong>Lend a little compute</strong>
        <span>NO PAYMENT</span>
      </div>
      <p>Your browser does the work. Choose how much.</p>
      <div
        className="compute-levels"
        role="group"
        aria-label="Browser compute level"
      >
        <button
          aria-label="Watch only"
          aria-pressed={!h.enabled}
          onClick={h.pause}
        >
          <Pause size={13} />
          <strong>Watch</strong>
          <small>no compute</small>
        </button>
        {(
          [
            { name: "Gentle", duty: 0.05, layers: 2 },
            { name: "More", duty: 0.1, layers: 4 },
            { name: "Most", duty: 0.2, layers: 8 },
          ] as const
        ).map((level) => (
          <button
            key={level.name}
            aria-label={`${level.name} compute`}
            aria-pressed={h.enabled && h.duty === level.duty}
            disabled={unavailable || !h.connected}
            onClick={() =>
              level.duty === 0.05 ? h.gentle() : h.boost(level.duty)
            }
          >
            <strong>{level.name}</strong>
            <small>{level.duty * 100}% target</small>
          </button>
        ))}
      </div>
      <div className="your-contribution" data-compute-status={h.status}>
        <i className={`live-dot ${h.enabled && !unavailable ? "" : "rest"}`} />
        <span>
          {!h.enabled
            ? "You’re just watching"
            : !h.visible
              ? "Paused while this tab is away"
              : unavailable
                ? "Model layers unavailable on this device"
                : h.status === "loading"
                  ? `Loading your piece · ${Math.round(h.progress * 100)}%`
                  : h.status === "ready"
                    ? `Holding ${h.usage.layers} of ${model.layers} layers · ${h.usage.passes ? "has done real work" : "ready for work"}`
                    : "Getting your piece ready"}
        </span>
      </div>
      {h.status === "loading" && (
        <progress
          className="piece-progress"
          value={h.progress}
          max={1}
          aria-label="Your model piece loading"
        />
      )}
      <p className="boost-status" role="status">
        {h.boosted
          ? `${h.duty === 0.2 ? "Most" : "More"} compute for ${minutes}, then back to Gentle.`
          : "More and Most last 10 minutes, then return to Gentle."}
      </p>
      <p className="care-disclosure">
        {h.enabled
          ? `Up to ${budgets[h.duty === 0.2 ? "8" : h.duty === 0.1 ? "4" : "2"].maxMB} MB of model data. `
          : "Watching is welcome. "}
        No app to install.{" "}
        <button className="text-button" onClick={explain}>
          How your compute helps <CircleHelp size={11} />
        </button>
      </p>
      {unavailable && (
        <p className="compute-notice">
          {h.error}{" "}
          {h.status === "error" && (
            <button className="text-button" onClick={h.resume}>
              Try again
            </button>
          )}
        </p>
      )}
    </div>
  );
}
