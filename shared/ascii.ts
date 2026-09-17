import spec from "./ascii-spec.json";
/** One canvas contract for generation, validation and display. */
export const ART_COLUMNS = spec.columns;
export const ART_ROWS = spec.rows;
export const ART_MAX_TOKENS = spec.maxTokens;
export function unwrapArt(raw: string): string {
  const text = raw.replace(/\r\n?/g, "\n").replace(/^\n+|\s+$/g, "");
  const fence = text.match(
    /^\s*```(?:ascii|text|plaintext)?\s*\n([\s\S]*?)\n?```\s*$/i,
  );
  return (fence ? fence[1] : text).replace(/^\n+|\s+$/g, "");
}
export function inspectArt(raw: string) {
  const text = unwrapArt(raw);
  const lines = text.split("\n");
  const width = Math.max(0, ...lines.map((l) => l.length));
  const height = lines.length;
  let reason = "";
  if (!/^[\x20-\x7e\n]+$/.test(text))
    reason = "Use only printable ASCII and line breaks.";
  else if (width > ART_COLUMNS || height > ART_ROWS)
    reason = `The drawing must fit ${ART_COLUMNS} columns by ${ART_ROWS} rows.`;
  else if (
    lines.filter((l) => l.trim()).length < 3 ||
    text.replace(/\s/g, "").length < 12
  )
    reason = "The drawing needs at least three visible rows.";
  else if (
    lines.length > 7 &&
    new Set(lines.filter((l) => l.trim()).map((l) => l.trim())).size <
      lines.filter((l) => l.trim()).length / 2
  )
    reason = "The drawing repeats too many identical rows.";
  else if (
    (text.match(/[A-Za-z]{4,}/g) || []).some(
      (word) => new Set(word.toLowerCase()).size > 2,
    )
  )
    reason = "Return a drawing without prose, labels or a title.";
  return { ok: !reason, text, width, height, reason };
}
