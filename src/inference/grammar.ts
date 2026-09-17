/** Protocol punctuation is fixed. Semantic enum choices and the subject remain model predictions. */
import { AGENT_FIELDS, sourceChoices } from "../../shared/agents";
type Tokenizer = {
  encode(text: string): number[];
  decode(ids: number[]): string;
};
type Segment =
  | { kind: "fixed"; ids: number[] }
  | { kind: "choice"; choices: number[][] }
  | {
      kind: "focus";
      tokens: number;
      chars: number;
      maxTokens?: number;
      maxChars?: number;
      sentence?: boolean;
      tail?: string;
    };
export class OutputGrammar {
  private segments: Segment[] = [];
  private index = 0;
  constructor(
    private tokenizer: Tokenizer,
    kind?: string,
    sourceIds: string[] = [],
  ) {
    const fixed = (text: string) =>
      ({ kind: "fixed", ids: tokenizer.encode(text) }) as Segment;
    const choice = (values: string[]) =>
      ({
        kind: "choice",
        choices: values.map((s) => tokenizer.encode(s)),
      }) as Segment;
    if (kind === "agent") {
      for (const [i, field] of AGENT_FIELDS.entries()) {
        this.segments.push(fixed(`${i ? "," : "{"}"${field.name}":"`));
        // Include the terminator in choices: S1 must remain distinguishable
        // from S1,S2 after their shared prefix has been generated.
        if ("choices" in field)
          this.segments.push(choice(field.choices.map((v) => v + '"')));
        else if ("sources" in field)
          this.segments.push(
            choice(sourceChoices(sourceIds).map((v) => v + '"')),
          );
        else
          this.segments.push({
            kind: "focus",
            tokens: 0,
            chars: 0,
            maxTokens: field.tokens,
            maxChars: field.chars,
            sentence: field.name === "content",
            tail: "",
          });
        if (!("choices" in field) && !("sources" in field))
          this.segments.push(fixed('"'));
      }
      this.segments.push(fixed("}"));
    }
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
    if (s.tokens >= (s.maxTokens ?? 24) || s.chars >= (s.maxChars ?? 80)) {
      this.index++;
      return this.allowed();
    }
  }
  filter(top: [number, number][]): [number, number][] {
    const s = this.segments[this.index];
    if (s?.kind !== "focus") return top;
    // Let the model finish its subject naturally. Rejecting every closing quote
    // forced it to fill the full budget with spurious fields or punctuation.
    if (
      s.tokens > 0 &&
      (!s.sentence || /[.!?\]]\s*$/.test(s.tail || "")) &&
      /^\s*"/.test(this.tokenizer.decode([top[0][0]]))
    ) {
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
      s.tail = ((s.tail || "") + this.tokenizer.decode([id])).slice(-16);
    }
  }
}
