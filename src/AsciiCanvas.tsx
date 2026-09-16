import type { CSSProperties } from "react";
import { ART_COLUMNS, ART_ROWS } from "../shared/ascii";
export function AsciiCanvas({
  text,
  live = false,
  label = "ASCII drawing",
  compact = false,
}: {
  text: string;
  live?: boolean;
  label?: string;
  compact?: boolean;
}) {
  // Legacy archive drawings keep their original full width, too.
  const columns = Math.max(
    ART_COLUMNS,
    ...text.split("\n").map((l) => l.length),
  );
  const rows = Math.max(ART_ROWS, text.split("\n").length);
  return (
    <div
      className={`ascii-canvas ${compact ? "compact" : ""} ${live ? "is-drawing" : ""}`}
      style={{ "--art-columns": columns, "--art-rows": rows } as CSSProperties}
    >
      {text ? (
        <pre tabIndex={compact ? undefined : 0} aria-label={label}>
          {text}
        </pre>
      ) : (
        <span className="blank-canvas">a blank page, for now</span>
      )}
      {!compact && (
        <span className="canvas-size">
          {live ? "drawing · " : ""}
          {columns} × {rows}
        </span>
      )}
    </div>
  );
}
