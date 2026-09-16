import { WebSocket } from "ws";
import { writeFile, mkdir } from "node:fs/promises";
const base = process.env.HELD_TEST_URL || "http://127.0.0.1:8787";
const cookie = (await fetch(base + "/api/identity")).headers
  .get("set-cookie")
  .split(";")[0];
const before = await fetch(base + "/api/state?room=main").then((r) => r.json());
const ws = new WebSocket(base.replace("http", "ws") + "/api/socket?room=main", {
  headers: { Origin: base, Cookie: cookie },
});
let heartbeat;
let last = before.totalThoughts;
let result;
try {
  await new Promise((resolve, reject) => {
    const deadline = setTimeout(
      () => reject(new Error("Mac model did not finish in time")),
      120000,
    );
    ws.on("open", () => {
      heartbeat = setInterval(
        () => ws.send(JSON.stringify({ type: "ping", visible: true })),
        15000,
      );
    });
    ws.on("message", (raw) => {
      const s = JSON.parse(String(raw));
      if (s.type !== "state") return;
      if (s.totalThoughts !== last) {
        last = s.totalThoughts;
        console.log(
          JSON.stringify({
            jobs: last - before.totalThoughts,
            kind: s.project?.kind,
            newArt: s.artworkCount - before.artworkCount,
          }),
        );
      }
      if (
        last >= before.totalThoughts + 8 &&
        (s.artworkCount > before.artworkCount ||
          s.trials.some((t) => t.at > before.serverTime))
      ) {
        result = s;
        clearTimeout(deadline);
        resolve();
      }
    });
    ws.on("error", (e) => {
      clearTimeout(deadline);
      reject(e);
    });
    ws.on("close", () => {
      clearTimeout(deadline);
      if (!result)
        reject(new Error("Test socket closed; run against a stable build"));
    });
  });
  await mkdir(".local/qa/edition02", { recursive: true });
  await writeFile(
    ".local/qa/edition02/mac-evidence.json",
    JSON.stringify(
      {
        base,
        at: new Date().toISOString(),
        jobs: result.totalThoughts - before.totalThoughts,
        tokens: result.totalTokens - before.totalTokens,
        jobWallMs: result.totalComputeMs - before.totalComputeMs,
        art: result.artworks.filter((t) => t.at > before.serverTime),
        trials: result.trials.filter((t) => t.at > before.serverTime),
        journal: result.journal,
      },
      null,
      2,
    ),
  );
  console.log("PASS: real Mac planner and delegated work, persisted results");
} finally {
  clearInterval(heartbeat);
  ws.close();
}
