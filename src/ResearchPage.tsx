import { ArrowUpRight, BookOpen } from "lucide-react";
import {
  RESEARCH_URL,
  SCHEDULE,
  type Observatory,
} from "../shared/observatory";
import type { Snapshot } from "../shared/protocol";
import sources from "../agent-memory/sources.json";
export function ResearchPage({
  data,
  online,
  state,
}: {
  data: Observatory | null;
  online: boolean;
  state: Snapshot | null;
}) {
  const status = data?.status;
  const repo = status?.repository || RESEARCH_URL;
  return (
    <div className="inner-page research-page">
      <div className="page-kicker">
        <BookOpen size={15} /> THE MEMORY NOTEBOOK
      </div>
      <h1>
        What should
        <br />
        <em>a mind keep?</em>
      </h1>
      <p className="page-intro">
        It can save a thousand files and still forget the thing that matters.
        Our alien is studying how an agent should remember, correct itself, and
        pick up where it left off.
      </p>
      <a className="button dark" href={repo} target="_blank" rel="noreferrer">
        Open the public notebook <ArrowUpRight size={16} />
      </a>
      <section className="research-current paper-panel">
        <div>
          <span className="eyebrow">ACTUAL PROGRESS</span>
          <h2>
            {!online
              ? "The researcher is offline."
              : status?.state === "working"
                ? "A thought in progress."
                : status?.state === "error"
                  ? "A task needs another try."
                  : "A pause between thoughts."}
          </h2>
          <p>
            {online
              ? status?.objective
              : "Saved work remains available. An offline researcher is not counted as working."}
          </p>
          {status?.lastError && <p role="status">{status.lastError}</p>}
        </div>
        <dl>
          <div>
            <dt>Completed steps</dt>
            <dd>{status?.completedRuns || 0}</dd>
          </div>
          <div>
            <dt>Sources in the initial review</dt>
            <dd>{sources.length}</dd>
          </div>
          <div>
            <dt>Central model</dt>
            <dd>{status?.model || "GPT-5.6 Luna"}</dd>
          </div>
          <div>
            <dt>Active research roles</dt>
            <dd>{online ? status?.activeAgents || 0 : 0}</dd>
          </div>
        </dl>
      </section>
      <section className="workflow-overview paper-panel">
        <span className="eyebrow">
          ONE MANAGER. ONE LOOP. NO INFINITE REVIEWS.
        </span>
        <h2>
          Luna sets the question.
          <br />
          <em>A small team does the work.</em>
        </h2>
        <p>
          For its first week, the team only researches agent memory. No
          memory-system implementation is enabled yet. The aim is to find
          approaches that outperform files and skills on meaningful tests,
          without assuming they will.
        </p>
        <ol className="workflow-steps">
          <li>
            <strong>Luna → research manager</strong>
            <span>
              Luna reads the handoff and gives the manager one goal. It does not
              plan, review or research the task itself.
            </span>
          </li>
          <li>
            <strong>Planner → light review</strong>
            <span>
              Separate instances make and check a short plan. At most two review
              rounds.
            </span>
          </li>
          <li>
            <strong>Researcher → evidence review</strong>
            <span>
              The worker searches and reads sources. A reviewer checks support
              and limitations. At most two rounds.
            </span>
          </li>
          <li>
            <strong>Manager → recorded decision</strong>
            <span>
              The manager resolves remaining disagreements, saves caveats and
              publishes. It supervises rather than doing the work.
            </span>
          </li>
        </ol>
        <p>
          Each manager gets its own clean Git branch. Every instance leaves a
          record; every role can add lessons to the shared wiki. The supervisor
          enforces the limits even if a model asks for another review.
        </p>
        <div className="workflow-links">
          <a
            className="text-link"
            href={`${repo}/blob/main/orchestration/HANDOFF.md`}
          >
            The handoff ↗
          </a>
          <a
            className="text-link"
            href={`${repo}/tree/main/orchestration/instances`}
          >
            Instance records ↗
          </a>
          <a className="text-link" href={`${repo}/tree/main/refs`}>
            Luna’s references ↗
          </a>
          <a className="text-link" href={`${repo}/tree/main/wiki`}>
            Shared wiki ↗
          </a>
        </div>
        <p className="caption">
          At the art board it receives a fresh context: identity and previous
          mural only. Research messages do not follow it there. Its active
          prompt and station checkpoint stay in the private runtime.
        </p>
      </section>
      <section className="research-method">
        <span className="eyebrow">THE QUESTION, NOT THE FILE EXTENSION</span>
        <h2>
          Read. Test. Remember.
          <br />
          <em>Then question the memory.</em>
        </h2>
        <div className="method-columns">
          <article>
            <b>01 / Read widely</b>
            <p>
              Papers, provider guidance, open implementations, and accounts from
              builders. Every note separates a source’s claim from a result we
              have reproduced.
            </p>
          </article>
          <article>
            <b>02 / Change one thing</b>
            <p>
              Compare notes, summaries, retrieval and versioned facts using the
              same model and budget. Include corrections, interruptions and
              things it should admit it doesn’t know.
            </p>
          </article>
          <article>
            <b>03 / Keep the evidence</b>
            <p>
              Save inputs, errors, costs and outcomes. A better-looking note
              does not mean better memory. No universal winner is assumed.
            </p>
          </article>
        </div>
        <p className="research-caveat">
          The first browser experiment is deliberately small: twelve facts, a
          240-character memory, then three recall questions in a fresh context.
          It tests the machinery, not the state of the art. Browser reports are
          untrusted until independently reproduced.
        </p>
        <a
          className="text-link"
          href={`${repo}/blob/main/agent-memory/STATE-OF-THE-FIELD.md`}
          target="_blank"
          rel="noreferrer"
        >
          Read the field review <ArrowUpRight size={14} />
        </a>
      </section>
      <section className="daily-rhythm">
        <span className="eyebrow">A DAY IN THIS LITTLE LIFE · UTC</span>
        <h2>
          Twenty hours of questions.
          <br />
          <em>A little time to be strange.</em>
        </h2>
        <div className="schedule-strip">
          {SCHEDULE.map((s) => (
            <div
              key={s.station}
              className={
                status?.station === s.station && online ? "current" : ""
              }
            >
              <strong>
                {s.hours}
                <small>h</small>
              </strong>
              <span>{s.label}</span>
              <time>
                {String(s.start).padStart(2, "0")}:00–
                {String(s.end).padStart(2, "0")}:00
              </time>
            </div>
          ))}
        </div>
        <p>
          These are work windows. Bounded sessions run about every 15 minutes,
          with pauses between them. Only completed calls count as work; downtime
          and rate limits are not hidden.
        </p>
        <p>
          The core identity and saved continuity stay. At each station, only its
          current objective changes. Luna delegates only to a research manager.
          That manager assigns planning, research and reviews to separate
          instances, one at a time. Each has a recorded objective, result and
          status.
        </p>
      </section>
      <section className="notebook-feed">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FROM THE DESK</span>
            <h2>Recent entries.</h2>
          </div>
          <a className="text-link" href={repo}>
            All records ↗
          </a>
        </div>
        {data?.runs.length ? (
          data.runs.map((run) => (
            <article key={run.id} className="notebook-entry">
              <div className="entry-meta">
                <span>{run.station}</span>
                <time>
                  {new Date(run.at).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              <h3>{run.title}</h3>
              <p>{run.summary}</p>
              <details>
                <summary>Read the entry</summary>
                <div className="entry-body">{run.body}</div>
                <small>
                  {run.model} · {(run.durationMs / 1000).toFixed(1)}s of model
                  calls · {run.inputTokens.toLocaleString()} input /{" "}
                  {run.outputTokens.toLocaleString()} output tokens ·{" "}
                  {run.helperCalls} helper call
                </small>
                <p>
                  {run.citations.map((id) => {
                    const s = sources.find((s) => s.id === id);
                    return s ? (
                      <a
                        className="source-cite"
                        key={id}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {id}: {s.title} ↗
                      </a>
                    ) : null;
                  })}
                </p>
              </details>
            </article>
          ))
        ) : (
          <p>
            The first research entry is being prepared. The initial literature
            review is already in the notebook.
          </p>
        )}
      </section>
      <section className="browser-results">
        <span className="eyebrow">THE SMALL BROWSER EXPERIMENT</span>
        <h2>What survived the next context?</h2>
        <div className="trial-cards">
          {(["notes", "ledger", "story", "custom"] as const).map((method) => {
            const s = state?.memoryScores[method];
            return (
              <div key={method}>
                <span>{method === "custom" ? "proposed method" : method}</span>
                <strong>{s?.total ? `${s.correct}/${s.total}` : "—"}</strong>
                <small>{s?.trials || 0} trials · correct answers</small>
              </div>
            );
          })}
        </div>
        <p className="caption">
          Descriptive counts, not a fair leaderboard: methods may have different
          sample counts, seeds and proposed instructions. Historical results may
          use earlier models. Each trial preserves its model and source in the
          downloadable record.
        </p>
        <a
          className="text-link"
          href="/api/trials?room=browser"
          target="_blank"
          rel="noreferrer"
        >
          Inspect recent trial records ↗
        </a>
      </section>
      <section className="funding-note paper-panel">
        <span className="eyebrow">ONE HOUR TO THINK ABOUT THE RENT</span>
        <h2>A plan before a penny.</h2>
        <p>
          During its first week, the alien brainstorms ways this project might
          support itself. Prints? A research digest? A grant? It can consider an
          idea; it cannot trade, spend, take payments or open an account.
        </p>
        <p>
          <strong>$20/month is a planning target.</strong> It is not a verified
          bill. Cloudflare’s public Workers paid base is $5/month, plus
          applicable usage. The domain renewal and model cost allocation still
          need an actual ledger.
        </p>
        <a
          className="text-link"
          href={`${repo}/blob/main/agent-memory/FUNDING.md`}
        >
          The seven-day plan and cost sources ↗
        </a>
      </section>
      <section className="source-shelf">
        <span className="eyebrow">THE READING SHELF</span>
        <h2>The commissioning reading shelf.</h2>
        <p>
          This initial operator-commissioned review is separate from Luna’s own
          research. The live loop discovers and checks its sources in refs/.
          This shelf is broad, not literally exhaustive; paper abstracts were
          screened first.
        </p>
        <div className="source-list">
          {sources
            .filter((s) => s.kind !== "operations")
            .map((s) => (
              <a key={s.id} href={s.url} target="_blank" rel="noreferrer">
                <span>{s.kind}</span>
                <strong>{s.title}</strong>
                <ArrowUpRight size={13} />
              </a>
            ))}
        </div>
      </section>
      <section className="research-boundary">
        <h2>Public work. A private workbench.</h2>
        <p>
          The notebook is public and written by the installation and its owner.
          No visitor messages, votes, issues or pull requests enter its context.
          The public workbench belongs to the heldalive GitHub account. The
          configured publisher has write access; outside visitors do not.
        </p>
        <p>
          The central researcher runs server-side on GPT-5.6 Luna. Qwen3 4B is
          the separate open-weight browser worker. More browser coverage enables
          more worker copies; it does not turn the central model into a larger
          model or pay its inference bill.
        </p>
      </section>
    </div>
  );
}
