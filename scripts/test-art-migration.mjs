// Isolated local database fixture. Never accepts a remote target.
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
const base = "http://127.0.0.1:8794",
  dir = ".local/art-migration-test";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let server;
async function start() {
  server = spawn(
    process.execPath,
    [
      "node_modules/wrangler/bin/wrangler.js",
      "dev",
      "--port",
      "8794",
      "--persist-to",
      dir,
      "--log-level",
      "error",
    ],
    { detached: true, stdio: "ignore" },
  );
  for (let i = 0; i < 300; i++) {
    try {
      if ((await fetch(base + "/api/state?room=browser")).ok) return;
    } catch {}
    await wait(100);
  }
  throw Error("Worker startup");
}
async function stop() {
  if (!server) return;
  const p = server;
  server = null;
  try {
    process.kill(-p.pid, "SIGTERM");
  } catch {}
  if (p.exitCode === null) await new Promise((r) => p.once("exit", r));
  await wait(400);
}
try {
  await start();
  await stop();
  execFileSync("python3", [
    "-c",
    String.raw`
import json,sqlite3,sys
from pathlib import Path
for p in Path(sys.argv[1]).rglob('*.sqlite'):
 c=sqlite3.connect(p)
 if not c.execute("SELECT 1 FROM sqlite_master WHERE name='creature'").fetchone(): c.close();continue
 row=c.execute('SELECT value FROM creature WHERE id=1').fetchone()
 if not row:c.close();continue
 s=json.loads(row[0]);s['room']='browser';s['modelVersion']=3;s.pop('artEdition',None);s['launchSupport']=False;s['totalThoughts']=17;s['totalTokens']=123
 task={'id':'legacy-job','kind':'plan','messages':[{'role':'user','content':'legacy fixture'}],'maxTokens':110,'title':'legacy planner','projectId':'old','attempts':0}
 s['active']=[{'task':task,'peerId':'orphan','text':'','startedAt':0,'deadline':9999999999999,'source':'browser'}];s['queue']=[task]
 s['project']={'id':'old','kind':'memory','title':'old experiment','focus':'old','helpers':1,'at':1,'completed':0,'total':1,'status':'working'}
 s['results']=['old result'];s['journal']='preserved historical journal'
 c.execute('UPDATE creature SET value=? WHERE id=1',(json.dumps(s),))
 a={'id':'migration-art','title':'old drawing','text':' /\\\n/  \\\n|[]|\n|__|','at':9999999999998,'source':'browser','projectId':'old','model':'historical'}
 c.execute('INSERT OR REPLACE INTO artworks (id,value,at) VALUES (?,?,?)',(a['id'],json.dumps(a),a['at']))
 c.commit();c.close()
`,
    dir,
  ]);
  await start();
  const s = await fetch(base + "/api/state?room=browser").then((r) => r.json());
  assert.equal(s.active, null);
  assert.deepEqual(s.agents, []);
  assert.equal(s.project, null);
  assert.equal(s.totalThoughts, 17);
  assert.equal(s.totalTokens, 123);
  assert.equal(s.power.launchSupport, false);
  assert.ok(s.artworks.some((a) => a.id === "migration-art"));
  const input = await fetch(base + "/api/inputs?room=browser").then((r) =>
    r.json(),
  );
  assert.equal(
    input.tasks.length,
    0,
    "Retired planning task cannot be dispatched",
  );
  await stop();
  const saved = JSON.parse(
    execFileSync(
      "python3",
      [
        "-c",
        String.raw`
import json,sqlite3,sys
from pathlib import Path
for p in Path(sys.argv[1]).rglob('*.sqlite'):
 c=sqlite3.connect(p)
 if c.execute("SELECT 1 FROM sqlite_master WHERE name='creature'").fetchone():
  r=c.execute('SELECT value FROM creature WHERE id=1').fetchone()
  if r: print(r[0]);break
`,
        dir,
      ],
      { encoding: "utf8" },
    ),
  );
  assert.equal(saved.artEdition, 6);
  assert.equal(saved.modelVersion, 4);
  assert.deepEqual(saved.queue, []);
  assert.equal(saved.journal, "preserved historical journal");
  assert.ok(
    saved.projects.some((p) => p.id === "old" && p.status === "interrupted"),
  );
  console.log(
    "PASS: first read migrates legacy planning/memory jobs, preserves archive/counters/journal/support choice, and records interruption. Isolated LOCAL fixture.",
  );
} finally {
  await stop();
}
