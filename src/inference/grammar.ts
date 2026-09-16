import spec from "../../shared/ascii-spec.json";
/** Protocol punctuation is fixed. Semantic enum choices and the subject remain model predictions. */
type Tokenizer = {
  encode(text: string): number[];
  decode(ids: number[]): string;
};
type Segment =
  | { kind: "fixed"; ids: number[] }
  | { kind: "choice"; choices: number[][] }
  | { kind: "focus"; tokens: number; chars: number };
export class OutputGrammar {
  private segments: Segment[] = [];
  private index = 0;
  private ascii = false;
  private art = "";
  private artTokens = 0;
  private brushes: { id: number; text: string }[] = [];
  constructor(
    private tokenizer: Tokenizer,
    kind?: string,
  ) {
    this.ascii = kind === "art";
    if (this.ascii) {
      const glyphs = new Set(spec.glyphs);
      // Keep whole BPE tokens (e.g. a newline plus spaces). Restricting to
      // single characters destroys the model's learned drawing patterns.
      for (let id = 0; id < spec.vocabularySize; id++) {
        const text = tokenizer.decode([id]);
        if (text && [...text].every((c) => glyphs.has(c)))
          this.brushes.push({ id, text });
      }
      if (
        this.brushes.length + 1 > spec.maxCandidates ||
        !this.brushes.some((b) => b.text === "\n")
      )
        throw Error("Unsupported drawing vocabulary");
    }

    const fixed = (text: string) =>
      ({ kind: "fixed", ids: tokenizer.encode(text) }) as Segment;
    const choice = (values: string[]) =>
      ({
        kind: "choice",
        choices: values.map((s) => tokenizer.encode(s)),
      }) as Segment;
    if (kind === "plan")
      this.segments = [
        fixed('{"project":"'),
        choice(["art", "memory", "wander"]),
        fixed('","focus":"'),
        { kind: "focus", tokens: 0, chars: 0 },
        fixed('","helpers":'),
        choice(["1", "2", "3", "4", "5", "6", "7", "8"]),
        fixed("}"),
      ];
    if (kind === "recall") {
      const words = [
        "button",
        "acorn",
        "ribbon",
        "marble",
        "feather",
        "pebble",
        "thimble",
        "shell",
        "bell",
        "key",
        "leaf",
        "coin",
        "unknown",
      ];
      this.segments = [
        fixed('{"answers":["'),
        choice(words),
        fixed('","'),
        choice(words),
        fixed('","'),
        choice(words),
        fixed('"]}'),
      ];
    }
  }
  get enabled() {
    return this.ascii || this.segments.length > 0;
  }
  get finished() {
    return !this.ascii && this.enabled && this.index >= this.segments.length;
  }
  allowed(): number[] | undefined {
    if (this.ascii) {
      if (this.artTokens >= spec.maxTokens - 1) return [2];
      const allowed = this.brushes
        .filter((b) => {
          const lines = (this.art + b.text).split("\n");
          return (
            lines.length <= spec.rows &&
            lines.every((l) => l.length <= spec.columns)
          );
        })
        .map((b) => b.id);
      if (
        this.art.split("\n").filter((l) => l.trim()).length >= 4 &&
        this.art.replace(/\s/g, "").length >= 12
      )
        allowed.push(2);
      return allowed.length ? allowed : [2];
    }
    const s = this.segments[this.index];
    if (!s) return;
    if (s.kind === "fixed") return [s.ids[0]];
    if (s.kind === "choice")
      return [...new Set(s.choices.map((ids) => ids[0]))];
    if (s.tokens >= 24 || s.chars >= 80) {
      this.index++;
      return this.allowed();
    }
  }
  filter(top: [number, number][]): [number, number][] {
    const s = this.segments[this.index];
    if (s?.kind !== "focus") return top;
    // Let the model finish its subject naturally. Rejecting every closing quote
    // forced it to fill the full budget with spurious fields or punctuation.
    if (s.tokens > 0 && /^\s*["']/.test(this.tokenizer.decode([top[0][0]]))) {
      this.index++;
      return [[this.allowed()![0], top[0][1]]];
    }
    const valid = top.filter(([id]) => {
      const text = this.tokenizer.decode([id]);
      return /^[\x20-\x7e]+$/.test(text) && !/["\\]/.test(text);
    });
    if (!valid.length) {
      this.index++;
      return [[this.allowed()![0], 0]];
    }
    return valid;
  }
  consume(id: number) {
    if (this.ascii) {
      this.art += this.tokenizer.decode([id]);
      this.artTokens++;
      return;
    }
    const s = this.segments[this.index];
    if (!s) return;
    if (s.kind === "fixed") {
      if (id !== s.ids.shift()) throw Error("Grammar mismatch");
      if (!s.ids.length) this.index++;
    }
    if (s.kind === "choice") {
      s.choices = s.choices
        .filter((ids) => ids[0] === id)
        .map((ids) => ids.slice(1));
      if (!s.choices.length) throw Error("Invalid model choice");
      if (s.choices.some((ids) => !ids.length)) this.index++;
    }
    if (s.kind === "focus") {
      s.tokens++;
      s.chars += this.tokenizer.decode([id]).length;
    }
  }
}
