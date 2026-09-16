import { readFile } from "node:fs/promises";
const enabled = process.argv[2];
if (!["on", "off"].includes(enabled))
  throw new Error(
    "Usage: HELD_CONFIG=.local/launch-bridge.json node scripts/launch-support.mjs on|off",
  );
const config = JSON.parse(
  await readFile(
    process.env.HELD_CONFIG || ".local/launch-bridge.json",
    "utf8",
  ),
);
const response = await fetch(
  new URL("/api/launch-support?room=browser", config.url),
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ enabled: enabled === "on" }),
  },
);
if (!response.ok)
  throw new Error(`Launch support request failed (${response.status})`);
console.log(new URL(config.url).host, await response.json());
