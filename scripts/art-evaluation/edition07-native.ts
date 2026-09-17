import { NativeModel } from "../../bridge/native-model";
import { artMessages } from "../../shared/personality";
import { inspectArt } from "../../shared/ascii";
import { writeFile, mkdir } from "node:fs/promises";
await mkdir(".local/qa/edition07", { recursive: true });
const model = new NativeModel(
  process.env.HELD_PYTHON || "python3",
  "bridge/native_model.py",
  ".local/edition07/model-q4",
);
const rows = [];
try {
  await model.ready;
  for (let i = 0; i < 8; i++) {
    let text = "";
    let outcome;
    const job = {
      id: "trial-" + i,
      kind: "art",
      messages: artMessages("browser", {} as any, i),
      maxTokens: 384,
      temperature: 0.8,
    } as any;
    const start = Date.now();
    await model.generate(
      job,
      (event: any) => {
        if (event.type === "chunk") text += event.text;
        else outcome = event;
      },
      AbortSignal.timeout(85000),
    );
    const row = {
      i,
      text,
      outcome,
      checked: inspectArt(text),
      ms: Date.now() - start,
    };
    rows.push(row);
    console.log(JSON.stringify(row));
    await writeFile(
      ".local/qa/edition07/native-samples.json",
      JSON.stringify(rows, null, 2),
    );
  }
} finally {
  model.close();
}
