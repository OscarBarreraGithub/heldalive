/** Developer deployment assets. Site visitors never install or run this script. */
import { readFile, mkdir, writeFile, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const name = "smollm2-360m-q4-v1";
const root = `public/weights/${name}`;
const metadata = JSON.parse(
  await readFile(`models/${name}/artifact.json`, "utf8"),
);
const sha = (data) => createHash("sha256").update(data).digest("hex");
let present = false;
try {
  present = Boolean(await readFile(root + "/manifest.json"));
} catch {}
if (!present && process.argv.includes("--download")) {
  console.log(
    "Fetching pinned development model assets (about 190 MB; no app installation for visitors).",
  );
  const response = await fetch(metadata.url);
  if (!response.ok) throw Error(`Model download failed: ${response.status}`);
  const data = Buffer.from(await response.arrayBuffer());
  if (sha(data) !== metadata.sha256)
    throw Error("Model archive checksum mismatch");
  await mkdir(".local", { recursive: true });
  const archive = `.local/${name}.tar.gz`;
  await writeFile(archive, data);
  const entries = execFileSync("tar", ["-tzf", archive], { encoding: "utf8" })
    .trim()
    .split("\n");
  if (
    entries.some(
      (p) => !p.startsWith(name + "/") || p.includes("..") || p.startsWith("/"),
    )
  )
    throw Error("Unexpected model archive path");
  await mkdir("public/weights", { recursive: true });
  execFileSync("tar", ["-xzf", archive, "-C", "public/weights"]);
  present = true;
}
if (!present)
  throw Error(
    "Model assets are missing. Run npm run model:download before deploying.",
  );
const manifest = JSON.parse(await readFile(root + "/manifest.json", "utf8"));
const pinned = JSON.parse(
  await readFile(`models/${name}/manifest.json`, "utf8"),
);
if (JSON.stringify(manifest) !== JSON.stringify(pinned))
  throw Error("Model manifest differs from the pinned source artifact");
let bytes = 0;
for (const [key, record] of Object.entries(manifest.buffers)) {
  const data = await readFile(`${root}/${key}.bin`);
  if (data.length !== record.bytes || sha(data) !== record.sha256)
    throw Error(`Invalid buffer ${key}`);
  bytes += data.length;
}
for (const file of ["LICENSE", "NOTICE", "SOURCE-MODEL-CARD.md"])
  await copyFile(`models/${name}/${file}`, `${root}/${file}`);
console.log(
  `Verified ${Object.keys(manifest.buffers).length} model buffers (${bytes} bytes) and attribution.`,
);
