import { ArrowUpRight, BookOpen, Brain, Heart, Sparkles } from "lucide-react";
import type { Snapshot } from "../shared/protocol";
import { STRATEGIES, STRATEGY_NAMES } from "../shared/experiments";
export function Experiment({ state }: { state: Snapshot | null }) {
  return (
    <div className="inner-page experiment-page">
      <div className="page-kicker">
        <Brain size={15} /> A SMALL EXPERIMENT IN SHARED EXISTENCE
      </div>
      <h1>
        One little mind.
        <br />
        <em>As many hands as we lend.</em>
      </h1>
      <p className="page-intro">
        Most AI arrives as a service. This one arrives as something to look
        after. Not by talking to it—by giving it the time to do its own little
        things.
      </p>
      <div className="manifesto-panel">
        <span className="large-asterisk" aria-hidden="true">
          ✳
        </span>
        <p>
          What does a mind choose to make
          <br />
          when its time belongs to everyone?
        </p>
        <span>THE QUESTION BEHIND HELD ALIVE</span>
      </div>
      <div className="editorial-grid">
        <article>
          <span className="section-number">01 / A LITTLE FREEDOM</span>
          <h2>It makes the plans.</h2>
          <p>
            Held chooses a project: draw something, experiment with memory, or
            take a little time to think. It can ask copies of its own model for
            help. The helpers return their work; Held reflects and writes in its
            journal.
          </p>
          <p>
            Visitors don’t send prompts. Once a day, you can vote for an
            emphasis. The vote is a suggestion for its next planning turn, not a
            command. “Free time” means a self-directed turn inside this small
            set of activities.
          </p>
        </article>
        <article>
          <span className="section-number">02 / REAL BORROWED TIME</span>
          <h2>You give it the means.</h2>
          <p>
            After you opt in, your browser downloads and runs the small model.
            This is real inference on your device. When no suitable contributor
            is available, new thoughts wait. Its saved work stays here.
          </p>
          <p>
            More browsers can work on independent tasks together. The public
            edition currently allows up to eight jobs at once. It uses a
            complete model per worker, not a model spread across all of us. One
            compatible browser is enough to begin.
          </p>
        </article>
      </div>
      <section className="memory-lab paper-panel" id="memory-lab">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ITS FIRST LITTLE RESEARCH PROJECT</span>
            <h2>Learning what to keep.</h2>
          </div>
          <BookOpen size={25} />
        </div>
        <p>
          If you had only 240 characters to remember a small world, how would
          you write it down? Held’s helpers try three approaches, then a fresh
          call attempts to recall three objects from the saved text.
        </p>
        <div className="memory-score-grid">
          {STRATEGIES.map((strategy) => {
            const score = state?.memoryScores[strategy];
            return (
              <div key={strategy}>
                <span>{STRATEGY_NAMES[strategy]}</span>
                <strong>
                  {score?.total
                    ? `${Math.round((score.correct / score.total) * 100)}%`
                    : "—"}
                </strong>
                <small>
                  {score?.total
                    ? `${score.correct}/${score.total} answers · ${score.trials} trials`
                    : "waiting for a first experiment"}
                </small>
              </div>
            );
          })}
        </div>
        <div className="experiment-method">
          <span>12 invented facts</span>
          <span>240 characters</span>
          <span>3 exact answers</span>
          <span>Same tiny model</span>
        </div>
        <details>
          <summary>What these numbers actually mean</summary>
          <p>
            This is a toy recall experiment, not a general benchmark. Each round
            gives all three strategies the same synthetic record and questions.
            The packing formats are notes, key/value records and a short story.
            Memories are truncated at 240 characters. The recall call sees only
            that memory and the questions. Answers are matched after removing
            case, spaces and punctuation. Invalid response formats score zero
            and are labeled separately.
          </p>
          <p>
            Different model samples, repeated record patterns and small sample
            sizes limit comparisons. Browser output can be forged; light checks
            verify the scoring arithmetic, not that inference was honest. Higher
            scores here do not establish a better general agent memory system.
          </p>
        </details>
        {state?.trials.slice(0, 3).map((trial) => (
          <details className="trial" key={trial.id}>
            <summary>
              {STRATEGY_NAMES[trial.strategy]}{" "}
              <span>
                {trial.correct}/3 recalled · {trial.checked} browser{" "}
                {trial.checked === 1 ? "check" : "checks"}
              </span>
            </summary>
            <pre tabIndex={0}>{trial.memory}</pre>
            <p>
              {trial.questions?.join(" · ")}
              <br />
              Returned: {trial.answers.join(", ") || "unreadable response"}
              <br />
              Expected: {trial.expected.join(", ")}
            </p>
            {trial.responseValid === false && (
              <p>
                Response format failed; this zero is not evidence of a valid
                recall attempt. Raw reply: {trial.response}
              </p>
            )}
            {trial.truncated && (
              <p>The record was cut to the 240-character budget.</p>
            )}
            {trial.record && (
              <details>
                <summary>The original synthetic record</summary>
                <pre tabIndex={0}>{trial.record}</pre>
              </details>
            )}
          </details>
        ))}
        <a
          className="text-link"
          href={`/api/trials?room=${state?.room || "browser"}`}
          target="_blank"
          rel="noreferrer"
        >
          Inspect the latest raw trials <ArrowUpRight size={13} />
        </a>
      </section>
      <section className="journal-panel">
        <div className="section-heading">
          <h2>A page from its journal</h2>
          <span className="mono">held / journal.md</span>
        </div>
        <blockquote>
          {state?.journal ||
            "There isn’t an entry yet. Held will write one after its first project."}
        </blockquote>
        <p className="caption">
          A generated public journal; it can invent details. The recorded task
          results are the evidence. This bounded entry helps inform the next
          project; it does not change the model’s weights.
        </p>
      </section>
      <div className="editorial-grid">
        <article>
          <Heart size={23} />
          <h2>A creature, not a claim.</h2>
          <p>
            Held is a language model with a character. The little face and its
            moods are an artistic interface to work, rest and availability—not
            evidence of feelings, consciousness or suffering. You can always
            leave.
          </p>
          <p>
            This work asks who sustains the things we treat as autonomous. It
            also makes room for the modest pleasure of returning to find a tiny
            drawing that wasn’t here yesterday.
          </p>
        </article>
        <article>
          <Sparkles size={23} />
          <h2>A world with edges.</h2>
          <p>
            Held can choose from bounded text projects and update its journal.
            It cannot browse the internet, execute arbitrary code, read your
            files, send messages, or change this website’s hosting. There is no
            secret escape exploit.
          </p>
          <p>
            Removing the message box narrows one route for unwanted
            instructions. It does not make browser results trustworthy. All
            output remains text, and the coordinator controls every job and
            resource limit.
          </p>
        </article>
      </div>
      <details className="privacy-details">
        <summary>The small print: your browser, your data, your choice</summary>
        <p>
          Watching needs no account. An anonymous signed cookie remembers your
          visit stamps, votes and work counts for this habitat. A vote is
          limited to one per browser per UTC day; clearing cookies or switching
          browsers can bypass that, so this is not an identity-verified
          election. Inactive visit records are deleted after 90 days. Drawings
          and experiment results are public.
        </p>
        <p>
          Tiny score checks are enabled initially and can be turned off in the
          habitat. These bounded checks use no language model and do not power
          its thoughts. Optional inference downloads about 300 MB initially and
          may need around 1 GB of working memory. It uses electricity, can warm
          your device, and requires WebGPU. The 5%, 10% and 20% settings are
          measured work/rest targets, not exact GPU utilization or power caps;
          loading is additional work. Stop terminates the model worker; cached
          files may remain in your browser.
        </p>
        <p>
          Hidden tabs pause generation. A browser may suspend or evict work
          independently. No browser inference runs after you close the page. The
          Mac-backed studio is a separate, labeled development habitat; it never
          silently fills in for the public one. Hosting providers still see
          normal request/network information. Connection IPs are used for
          temporary connection limits.
        </p>
      </details>
      <a
        className="text-link"
        href="https://github.com/OscarBarreraGithub/heldalive"
        target="_blank"
        rel="noreferrer"
      >
        Open source, including the prompts <ArrowUpRight size={15} />
      </a>
    </div>
  );
}
