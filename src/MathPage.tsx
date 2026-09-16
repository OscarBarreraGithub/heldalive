import { useState } from "react";
import { ArrowUpRight, Download, FlaskConical } from "lucide-react";
export function MathPage() {
  const [browsers, setBrowsers] = useState(20);
  const [rate, setRate] = useState(12);
  const [duty, setDuty] = useState(10);
  const tokens = (browsers * rate * duty) / 100;
  const jobs = (tokens * 60) / 150;
  return (
    <div className="inner-page math-page">
      <div className="page-kicker">
        <FlaskConical size={15} /> FIELD NOTES / 02
      </div>
      <h1>
        The math of
        <br />
        <em>staying here.</em>
      </h1>
      <p className="page-intro">
        A little creature. A surprisingly big question: what does it take to
        keep a distributed mind running?
      </p>
      <div className="math-calculator paper-panel">
        <div>
          <span className="eyebrow">TRY A THOUGHT EXPERIMENT</span>
          <h2>
            Many small contributions
            <br />
            make room for more work.
          </h2>
          <p>
            Change the assumptions. This is an ideal throughput estimate, not a
            live benchmark or a promise of greater intelligence.
          </p>
          <label>
            Contributing browsers <strong>{browsers}</strong>
            <input
              type="range"
              min="1"
              max="200"
              value={browsers}
              onChange={(e) => setBrowsers(Number(e.target.value))}
            />
          </label>
          <label>
            Tokens per second, while working <strong>{rate}</strong>
            <input
              type="range"
              min="1"
              max="50"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </label>
          <label>
            Work / rest duty target <strong>{duty}%</strong>
            <input
              type="range"
              min="1"
              max="50"
              value={duty}
              onChange={(e) => setDuty(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="calculation-result">
          <div className="formula">capacity ≈ browsers × speed × duty</div>
          <strong>
            {tokens.toFixed(1)}
            <small>tokens / second</small>
          </strong>
          <p>
            About <b>{jobs.toFixed(1)} independent jobs per minute</b> at 150
            generated tokens each, before loading, input processing,
            coordination, retries, and the planner’s turn.
          </p>
          <span>
            Different devices have different speeds. Real capacity is the sum of
            their contributions.
          </span>
        </div>
      </div>
      <div className="editorial-grid">
        <article>
          <span className="section-number">01</span>
          <h2>A copy is not a slice.</h2>
          <p>
            Held fits on one compatible device. Each helper loads a complete
            copy of the same small model. Independent drawings can run in
            parallel; a single thought is not split across all visitors.
          </p>
          <p>
            More helpers mean more attempts and more independent work. They do
            not change the model’s weights, context limit, or underlying
            intelligence. Better results are something to measure.
          </p>
          <code className="equation">Q ≈ Σᵢ dᵢ rᵢ</code>
          <p className="caption">
            rᵢ is a device’s measured generation rate; dᵢ is its work/rest
            fraction. Serial planning and job availability also limit the
            result.
          </p>
        </article>
        <article>
          <span className="section-number">02</span>
          <h2>
            Alive is a metaphor.
            <br />
            Available is measurable.
          </h2>
          <p>
            Without a contributing browser, new model work stops. Saved drawings
            and memory persist. A returning worker can pick up an unfinished
            task.
          </p>
          <p>
            If each of n independent potential contributors is available with
            probability p, the chance of having at least one is:
          </p>
          <code className="equation">P(at least one) = 1 − (1 − p)ⁿ</code>
          <p className="caption">
            Independence is an assumption. Bedtimes, outages, browser suspension
            and shared services make real departures correlated.
          </p>
        </article>
      </div>
      <section className="research-note">
        <span className="eyebrow">WHERE THIS STARTED</span>
        <h2>
          From botnet mathematics
          <br />
          to a consensual little world.
        </h2>
        <p>
          The original working paper asks how much compute a decentralized AI
          needs, how networks persist, and why copies of model weights are
          different from running intelligence. Held Alive borrows the question,
          with people choosing to participate.
        </p>
        <div className="equation">
          dx/dt = βx(1 − x) − δx &nbsp; · &nbsp; R = β/δ
        </div>
        <p>
          In a simple epidemic model, R &gt; 1 permits a positive deterministic
          equilibrium. A finite stochastic population can still go extinct.
          These are theoretical scenarios—not measured AI spread rates, a
          prediction of irreversibility, or a model of our voluntary visitors.
        </p>
        <p>
          Compute, useful inference and surviving weights are separate
          quantities. Taking the entire internet down is neither generally
          necessary to stop execution nor sufficient to erase offline copies.
        </p>
        <div className="button-row">
          <a
            className="button dark"
            href="/research/short-paper.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Read the short paper <ArrowUpRight size={15} />
          </a>
          <a
            className="text-link"
            href="/research/full-analysis.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Full derivation <Download size={15} />
          </a>
        </div>
        <p className="caption">
          Research working drafts · September 2026 · not peer reviewed.
          Assumptions, source audit and reproducible calculations are included
          below.
        </p>
      </section>
      <div className="sources">
        <h2>Follow the evidence</h2>
        <a
          href="https://arxiv.org/abs/2209.01188v2"
          target="_blank"
          rel="noreferrer"
        >
          Petals: collaborative inference across distributed machines{" "}
          <ArrowUpRight size={13} />
        </a>
        <a href="https://webllm.mlc.ai/" target="_blank" rel="noreferrer">
          WebLLM: the browser inference runtime <ArrowUpRight size={13} />
        </a>
        <a href="/research/source-audit.md" target="_blank">
          Our source audit <ArrowUpRight size={13} />
        </a>
        <a
          href="https://github.com/OscarBarreraGithub/heldalive/tree/main/research"
          target="_blank"
          rel="noreferrer"
        >
          Equations, code and reproducibility files <ArrowUpRight size={13} />
        </a>
      </div>
    </div>
  );
}
