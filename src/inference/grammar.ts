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
  constructor(
    private tokenizer: Tokenizer,
    kind?: string,
  ) {
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
    return this.segments.length > 0;
  }
  get finished() {
    return this.enabled && this.index >= this.segments.length;
  }
  allowed(): number[] | undefined {
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
