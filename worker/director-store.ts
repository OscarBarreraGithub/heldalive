import type {
  DirectorState,
  DirectorStore,
  Publication,
} from "../../heldalive-runtime/cloud/director";
import type { Instance } from "../../heldalive-runtime/cloud/roles";
import type { MuralTile, ResearchRun } from "../shared/observatory";

export class SqlDirectorStore implements DirectorStore {
  constructor(private sql: SqlStorage) {
    sql.exec(
      "CREATE TABLE IF NOT EXISTS agent_director(id INTEGER PRIMARY KEY,value TEXT NOT NULL)",
    );
    sql.exec(
      "CREATE TABLE IF NOT EXISTS agent_instances(id TEXT PRIMARY KEY,loop_id TEXT NOT NULL,value TEXT NOT NULL,at INTEGER NOT NULL)",
    );
    sql.exec(
      "CREATE TABLE IF NOT EXISTS agent_outbox(seq INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT NOT NULL UNIQUE,value TEXT NOT NULL)",
    );
  }
  load() {
    const row = this.sql
      .exec<{ value: string }>("SELECT value FROM agent_director WHERE id=1")
      .toArray()[0];
    return row ? (JSON.parse(row.value) as DirectorState) : undefined;
  }
  save(state: DirectorState) {
    this.sql.exec(
      "INSERT INTO agent_director(id,value) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value",
      JSON.stringify(state),
    );
  }
  record(instance: Instance, loopId: string) {
    this.sql.exec(
      "INSERT OR IGNORE INTO agent_instances(id,loop_id,value,at) VALUES(?,?,?,?)",
      instance.id,
      loopId,
      JSON.stringify(instance),
      instance.at,
    );
  }
  run(run: ResearchRun) {
    this.sql.exec(
      "INSERT OR IGNORE INTO research_runs(id,value,at) VALUES(?,?,?)",
      run.id,
      JSON.stringify(run),
      run.at,
    );
  }
  enqueue(p: Publication) {
    this.sql.exec(
      "INSERT OR IGNORE INTO agent_outbox(id,value) VALUES(?,?)",
      p.id,
      JSON.stringify(p),
    );
  }
  nextPublication(now: number) {
    const row = this.sql
      .exec<{ value: string }>(
        "SELECT value FROM agent_outbox ORDER BY seq LIMIT 1",
      )
      .toArray()[0];
    const p = row ? (JSON.parse(row.value) as Publication) : undefined;
    return p && p.notBefore <= now ? p : undefined;
  }
  published(id: string) {
    this.sql.exec("DELETE FROM agent_outbox WHERE id=?", id);
  }
  defer(p: Publication) {
    this.sql.exec(
      "UPDATE agent_outbox SET value=? WHERE id=?",
      JSON.stringify(p),
      p.id,
    );
  }
  publicationCount() {
    return this.sql
      .exec<{ n: number }>("SELECT COUNT(*) AS n FROM agent_outbox")
      .one().n;
  }
  mural() {
    const row = this.sql
      .exec<{ value: string }>(
        "SELECT value FROM mural ORDER BY position DESC LIMIT 1",
      )
      .toArray()[0];
    return row ? (JSON.parse(row.value) as MuralTile) : undefined;
  }
  muralCount() {
    return this.sql.exec<{ n: number }>("SELECT COUNT(*) AS n FROM mural").one()
      .n;
  }
  putMural(tile: MuralTile) {
    this.sql.exec(
      "INSERT INTO mural(id,value,position,revision) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value,revision=excluded.revision WHERE excluded.revision>mural.revision",
      tile.id,
      JSON.stringify(tile),
      tile.index,
      tile.revision,
    );
  }
}
