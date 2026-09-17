import { CURRENT_MODEL as model } from "../shared/model";
import budgets from "../shared/model-budgets.json";
import type { Snapshot } from "../shared/protocol";
export function Survival({
  state,
  connected,
}: {
  state: Snapshot | null;
  connected: boolean;
}) {
  const best = state?.pipelines?.reduce<
    NonNullable<Snapshot["pipelines"]>[number] | undefined
  >((a, b) => (!a || b.covered > a.covered ? b : a), undefined);
  const covered = best?.covered || 0;
  const chains = state?.power?.browserChains || 0;
  const preview = state?.power?.launchSupport === true;
  const title = !connected
    ? "Connecting…"
    : chains
      ? "Its mind is complete."
      : preview
        ? "The preview is on life support."
        : "Its mind is incomplete. It cannot think.";
  return (
    <section
      className={`survival-panel ${chains ? "has-power" : "needs-power"}`}
      aria-label="Browser survival status"
    >
      <div className="survival-heading">
        <strong>{title}</strong>
        <span>
          {covered} / {model.layers}
        </span>
      </div>
      <div
        className="mind-pieces"
        style={{ gridTemplateColumns: `repeat(${model.layers},1fr)` }}
        role="meter"
        aria-label="Model layers present in the fullest browser group"
        aria-valuemin={0}
        aria-valuemax={model.layers}
        aria-valuenow={covered}
      >
        {Array.from({ length: model.layers }, (_, i) => (
          <i
            key={i}
            className={
              best?.pieces.some((p) => p.ready && p.start <= i && p.end > i)
                ? "present"
                : ""
            }
          />
        ))}
      </div>
      <p>
        {chains
          ? `${chains} complete ${chains === 1 ? "group" : "groups"} of browsers. Lose the last complete group and browser thinking stops.`
          : `${model.layers - covered} model layers missing. One complete group needs ${budgets["2"].holders} Gentle tabs, ${budgets["4"].holders} at More, or ${budgets["8"].holders} at Most.`}
      </p>
      {preview && (
        <p className="preview-truth">
          <strong>Preview mode:</strong> temporary server support can still
          generate thoughts. The browser-only death rule is not active yet.
        </p>
      )}
      {!preview && connected && (
        <p className="survival-rule">
          No complete group means no new drawings. Enough returning browsers can
          bring it back.
        </p>
      )}
    </section>
  );
}
