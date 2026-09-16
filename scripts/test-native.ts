import { NativeModel } from "../bridge/native-model";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { planMessages, recallMessages } from "../shared/personality";
const model = new NativeModel(
  resolve(".local/edition03/venv/bin/python"),
  resolve("bridge/native_model.py"),
  resolve(".local/edition03/model-q4"),
);
try {
  await model.ready;
  const first = new AbortController();
  let text = "";
  const cancelled = model.generate(
    {
      id: "cancel",
      kind: "art",
      messages: [{ role: "user", content: "Draw a tree using text." }],
      maxTokens: 180,
    },
    (e) => {
      const d = e as any;
      if (d.type === "chunk") first.abort();
    },
    first.signal,
  );
  await new Promise((r) => setTimeout(r, 20));
  first.abort();
  let done = false;
  const recovered = model.generate(
    {
      id: "recovery",
      kind: "plan",
      messages: planMessages("browser", "", { art: 1, memory: 0, wander: 0 }),
      maxTokens: 110,
    },
    (e) => {
      const d = e as any;
      if (d.type === "chunk") text += d.text;
      if (d.type === "done") done = true;
    },
    new AbortController().signal,
  );
  await Promise.all([cancelled, recovered]);
  assert.ok(done);
  const plan = JSON.parse(text);
  assert.ok(["art", "memory", "wander"].includes(plan.project));
  console.log(
    "PASS native readiness, cancellation immediately followed by fresh lease, valid model-selected plan:",
    plan,
  );
} finally {
  model.close();
}
