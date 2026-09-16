import { useState } from "react";
import { ArrowUpRight, Download, FlaskConical } from "lucide-react";
export function MathPage() {
  const [browsers, setBrowsers] = useState(16);
  const [layers, setLayers] = useState(2);
  const [latency, setLatency] = useState(80);
  const stages = Math.ceil(32 / layers);
  const groups = Math.min(8, Math.floor(browsers / stages));
  const stageMs = layers * 0.5; // Illustrative device assumption, not a measured browser rate.
  const duty = layers === 8 ? 0.2 : layers === 4 ? 0.1 : 0.05;
  const tokenMs = Math.max(stages * (stageMs + latency), stageMs / duty);
  const batchMs = Math.max(
    stages * (16 * stageMs + latency),
    (16 * stageMs) / duty,
  );
  const prefillMs = Math.ceil(256 / 16) * batchMs;
  const jobSeconds = (prefillMs + 64 * tokenMs) / 1000;
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
          <span className="eyebrow">ONE MIND, MANY PIECES</span>
          <h2>
            Enough to wake up.
            <br />A little more to think together.
          </h2>
          <p>
            These are adjustable assumptions, not a speed promise. A complete
            chain needs all 32 layers. Additional chains run helper copies.
          </p>
          <label>
            Contributing browsers <strong>{browsers}</strong>
            <input
              type="range"
              min="1"
              max="128"
              value={browsers}
              onChange={(e) => setBrowsers(Number(e.target.value))}
            />
          </label>
          <label>
            Layers per browser <strong>{layers}</strong>
            <select
              value={layers}
              onChange={(e) => setLayers(Number(e.target.value))}
            >
              <option value="2">Gentle · 2 layers</option>
              <option value="4">A little more · 4 layers</option>
              <option value="8">Room to roam · 8 layers</option>
            </select>
          </label>
          <label>
            Relay round trip per stage <strong>{latency} ms</strong>
            <input
              type="range"
              min="10"
              max="300"
              value={latency}
              onChange={(e) => setLatency(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="calculation-result">
          <div className="formula">browsers per mind = ceil(32 / layers)</div>
          <strong>
            {stages}
            <small>contributors per complete mind</small>
          </strong>
          <p>
            <b>
              {groups} complete {groups === 1 ? "chain" : "chains"}
            </b>{" "}
            with these identical contributions.{" "}
            {groups
              ? "One can be Held; the others can help."
              : "The model cannot run yet."}
          </p>
          <span>
            Illustrative time for a 256-token input and 64-token thought:{" "}
            {groups
              ? `${Math.round(jobSeconds)} seconds`
              : "waiting for coverage"}
            . This includes input processing and work/rest targets.
          </span>
        </div>
      </div>
      <div className="editorial-grid">
        <article>
          <span className="section-number">01 / ACTUAL INFERENCE</span>
          <h2>A thought passes through all of us.</h2>
          <p>
            SmolLM2-360M has 32 transformer layers. Each browser applies its
            assigned layers and passes a 1,920-byte hidden vector onward. The
            final piece scores possible next tokens; a tiny CPU contribution
            samples the next one. This repeats for every generated token.
          </p>
          <p>
            The model’s unique prepared weight buffers total 203.6 MB. Two
            layers use about 11.1 MB; either endpoint also holds 26.5 MB of
            vocabulary weights. That table is duplicated across endpoints.
            Browser overhead and temporary buffers are additional.
          </p>
          <code className="equation">
            T_token ≳ max[ Σᵢ(cᵢ + τᵢ), maxᵢ(cᵢ/dᵢ) ]
          </code>
          <p className="caption">
            cᵢ is a stage’s active calculation time, τᵢ its relay delay, dᵢ its
            work fraction. One token follows a serial chain. Rest can overlap
            other stages’ work. The calculator assumes 0.5 ms per layer,
            identical devices, no departures and no sampling delay; the output
            layer often costs more. The public coordinator currently supports
            eight chains.
          </p>
          <p>
            Input tokens travel in batches of 16. Each stage submits an ordered
            batch before reading its result back. Approximate input time is
            ceil(P/16) × max[ Σᵢ(16cᵢ + τᵢ), maxᵢ(16cᵢ/dᵢ) ]. This ignores
            startup and final partial-batch effects. Long prompts therefore
            matter even for short answers.
          </p>
        </article>
        <article>
          <span className="section-number">02 / A REAL DEPENDENCY</span>
          <h2>Missing a piece means missing a thought.</h2>
          <p>
            A browser chain cannot run if any required layer is absent. When a
            holder leaves, its unfinished task is queued. During launch, the
            artist’s Mini supports the public habitat when no browser chain is
            complete. After that support is retired, only replacement browser
            coverage can restart thinking. Saved drawings and memory files
            remain.
          </p>
          <code className="equation">P(whole chain available) = pˢ</code>
          <p>
            If each of s holders is independently available with probability p,
            all s must be present. At p = 0.95, a sixteen-holder chain is
            available about 44% of the time. Four holders give about 81%.
            Independence is a simplifying assumption; shared outages and sleep
            schedules correlate departures.
          </p>
          <p>
            The minimum is a resource choice, not a law that a tiny model
            inherently needs sixteen machines. A compatible computer can run
            this model alone. Held deliberately divides the work into small
            contributions so its public activity depends on a collective.
          </p>
          <p className="caption">
            Sixteen separate browser contexts have run one reference prompt on
            this Mac, matching the intact model’s generated token IDs. That
            verifies the split; it does not establish performance across sixteen
            internet connections. The source includes numerical and interruption
            tests.
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
        <a
          href="https://github.com/abgnydn/zero-tvm"
          target="_blank"
          rel="noreferrer"
        >
          Zero-TVM: the browser inference engine <ArrowUpRight size={13} />
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
