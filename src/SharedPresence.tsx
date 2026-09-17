import type { Snapshot } from "../shared/protocol";
import { MODEL_LAYERS } from "../shared/pipeline";

/** Presence and model coverage come only from the room's live snapshot. */
export function SharedPresence({
  state,
  connected,
}: {
  state: Snapshot | null;
  connected: boolean;
}) {
  const live = connected && state !== null;
  const groups = live ? state.pipelines || [] : [];
  const complete = groups.filter((group) => group.ready).length;
  const group = groups.find((group) => !group.ready) || groups[0];
  const loading = groups
    .flatMap((g) => g.pieces)
    .filter((p) => !p.ready).length;
  const browserRoles = live
    ? state.agents.filter((agent) => agent.source === "browser").length
    : 0;
  const viewers = live ? state.viewers : null;
  return (
    <section
      className="shared-presence"
      aria-label="Live browser participation"
    >
      <div className="presence-topline">
        <div className="presence-count">
          <strong data-live-sessions>
            {viewers === null ? "—" : viewers.toLocaleString()}
          </strong>
          <span>
            <b>{viewers === 1 ? "browser here" : "browsers here"}</b>
            <small>
              {!live
                ? "connecting to the room"
                : viewers === 0
                  ? "waiting for a little company"
                  : "sharing this moment, including you"}
            </small>
          </span>
        </div>
        <span className="presence-live">
          <i className={`live-dot ${live ? "" : "rest"}`} />
          {live ? "LIVE" : "OFFLINE"}
        </span>
      </div>
      <div className="presence-contributions">
        <span>
          <b data-ready-browsers>{live ? state.contributors : "—"}</b> holding
          model pieces
        </span>
        <span>
          <b data-loading-browsers>{live ? loading : "—"}</b> getting ready
        </span>
      </div>
      <div className="shared-layers" aria-hidden="true">
        {Array.from({ length: MODEL_LAYERS }, (_, layer) => {
          const piece = group?.pieces.find(
            (p) => layer >= p.start && layer < p.end,
          );
          return (
            <i
              key={layer}
              className={
                piece?.ready
                  ? piece.busy
                    ? "busy"
                    : "ready"
                  : piece
                    ? "loading"
                    : ""
              }
            />
          );
        })}
      </div>
      <p className="presence-work">
        {!live
          ? "Live capacity will appear when the connection returns."
          : browserRoles
            ? `${browserRoles} ${browserRoles === 1 ? "agent response is" : "agent responses are"} running across browsers.`
            : complete
              ? `${complete} complete browser ${complete === 1 ? "group is" : "groups are"} ready to carry a thought.`
              : `${group?.covered || 0} of ${MODEL_LAYERS} model layers held. A full row can carry a thought.`}
      </p>
    </section>
  );
}
