import { CURRENT_MODEL as model } from "../shared/model";
import { MAX_BATCH, HIDDEN_BYTES } from "../shared/pipeline";
import budgets from "../shared/model-budgets.json";
import { useState } from "react";
import { ArrowUpRight, Download, FlaskConical } from "lucide-react";
import { ComputeEstimateExplanation } from "./ComputeEstimate";
export function MathPage() {
  const [browsers, setBrowsers] = useState(budgets["2"].holders);
  const [layers, setLayers] = useState(2);
  const [latency, setLatency] = useState(80);
  const stages = Math.ceil(model.layers / layers);
  const groups = Math.min(8, Math.floor(browsers / stages));
  const stageMs = layers * 0.5; // Illustrative device assumption, not a measured browser rate.
  const duty = layers === 8 ? 0.2 : layers === 4 ? 0.1 : 0.05;
  const tokenMs = Math.max(stages * (stageMs + latency), stageMs / duty);
  const batchMs = Math.max(
    stages * (MAX_BATCH * stageMs + latency),
    (MAX_BATCH * stageMs) / duty,
  );
  const prefillMs = Math.ceil(256 / MAX_BATCH) * batchMs;
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
      <ComputeEstimateExplanation />
      <div className="math-calculator paper-panel">
        <div>
          <span className="eyebrow">ONE MIND, MANY PIECES</span>
          <h2>
            Enough to wake up.
            <br />A little more to think together.
          </h2>
          <p>
            These are adjustable assumptions, not a speed promise. A complete
            chain needs all {model.layers} layers. Additional chains run helper
            copies.
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
              <option value="4">More · 4 layers</option>
              <option value="8">Most · 8 layers</option>
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
          <div className="formula">
            browsers per mind = ceil({model.layers} / layers)
          </div>
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
              ? "Each complete group can run a small assigned task."
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
            {model.label} has {model.layers} transformer layers. Each browser
            applies its assigned layers and passes a{" "}
            {HIDDEN_BYTES.toLocaleString()}-byte hidden vector onward. The final
            piece scores possible next tokens; a tiny CPU contribution samples
            the next one. This repeats for every generated token.
          </p>
          <p>
            Prepared model buffers total {(budgets.totalBytes / 1e9).toFixed(2)}{" "}
            GB. A Gentle piece loads about {budgets["2"].minMB}–
            {budgets["2"].maxMB} MB; endpoints are larger because they hold
            vocabulary weights. These download estimates include room for the
            tokenizer and manifest. GPU working memory and temporary buffers are
            additional.
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
            Input tokens travel in batches of {MAX_BATCH}. Each stage submits an
            ordered batch before reading its result back. Approximate input time
            is ceil(P/B) × max[ Σᵢ(Bcᵢ + τᵢ), maxᵢ(Bcᵢ/dᵢ) ], with B ={" "}
            {MAX_BATCH}. This ignores startup and final partial-batch effects.
            Long prompts therefore matter even for short answers.
          </p>
        </article>
        <article>
          <span className="section-number">02 / A REAL DEPENDENCY</span>
          <h2>Missing a piece means missing a thought.</h2>
          <p>
            A browser chain cannot run if any required layer is absent. When a
            holder leaves, its unfinished task is queued. During launch, the
            preview server supports the public habitat when no browser chain is
            complete. After that support is retired, only replacement browser
            coverage can restart thinking. Saved drawings and earlier records
            remain.
          </p>
          <code className="equation">P(whole chain available) = pˢ</code>
          <p>
            If each of s holders is independently available with probability p,
            all s must be present. At p = 0.95, an eighteen-holder chain is
            available about 40% of the time. Five holders give about 77%.
            Independence is a simplifying assumption; shared outages and sleep
            schedules correlate departures.
          </p>
          <p>
            The minimum is a resource choice, not a law that a tiny model
            inherently needs eighteen machines. A compatible computer can run
            this model alone. This artwork deliberately divides the work into
            small contributions so its public activity depends on a collective.
          </p>
          <p className="caption">
            The source includes native-versus-browser numerical checks and
            interruption tests. Separate tabs on one computer verify the split;
            they do not establish performance across internet connections.
          </p>
        </article>
      </div>
      <section className="frontier-note">
        <span className="eyebrow">THE BIGGER QUESTION</span>
        <h2>How many computers for a much larger mind?</h2>
        <p>
          There is no defensible public host count for GPT-6 Astra or Claude
          Fable. Their self-hosting requirements are not disclosed. We can
          calculate resource bounds for explicit model sizes, without treating
          those sizes as estimates of either product.
        </p>
        <code className="equation">N ≥ ceil(max[ W/m, 2P·r/f, W·r/B ])</code>
        <p>
          P is the active parameter count of a dense model; four-bit raw weights
          occupy W = P/2 bytes. The target is r tokens per second. Each
          reference allocation offers m = 8 GB of memory, f = 100 billion
          relevant operations/s and B = 10 GB/s of weight-read bandwidth. These
          are illustrative resources, not measured infected devices.
        </p>
        <table>
          <caption>Ideal resource screens, before overhead</caption>
          <thead>
            <tr>
              <th>Dense model scenario</th>
              <th>Raw weights</th>
              <th>1 token/s</th>
              <th>10 tokens/s</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>9 billion parameters</td>
              <td>4.5 GB</td>
              <td>1 allocation</td>
              <td>5 allocations</td>
            </tr>
            <tr>
              <td>70 billion parameters</td>
              <td>35 GB</td>
              <td>5 allocations</td>
              <td>35 allocations</td>
            </tr>
            <tr>
              <td>1 trillion parameters, hypothetical</td>
              <td>500 GB</td>
              <td>63 allocations</td>
              <td>500 allocations</td>
            </tr>
          </tbody>
        </table>
        <p>
          These are lower bounds, not working deployments. Cache, quantization
          metadata, input processing, network delay, availability and the serial
          dependence between layers all add constraints. Summed bandwidth does
          not mean a chain can use it simultaneously. A model’s capability also
          cannot be inferred from parameter count alone.
        </p>
        <p>
          For scale: restrict the illustrative 70B case to 5% of each
          allocation’s compute and bandwidth, while leaving its memory
          available. Its one-token/s screen becomes max(4.375, 28, 70), or{" "}
          <strong>70 allocations</strong>; at ten tokens/s, <strong>700</strong>
          . Change the device, target rate or duty fraction and the count
          changes. A claim that exactly 1,200 visitors are necessary would be
          invented.
        </p>
        <p>
          Our current Qwen3 4B browser model is a different, measured
          implementation: 36 layers split into 18 Gentle pieces, nine More
          pieces or five Most pieces. One capable machine can also run it alone.
          Those counts describe the chosen sharing policy, not an intrinsic need
          for that many computers.
        </p>
      </section>
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
          The stable positive fraction in this simplified model is x* = 1 − 1/R.
          Near zero, growth occurs at rate β − δ, with doubling time ln(2)/(β −
          δ). We do not know a calibrated acquisition rate β for an escaped AI,
          so there is no measured escape timescale here.
        </p>
        <p>
          A one-time random removal may only shrink a population that can
          replenish itself. Durable protection changes the dynamics: protecting
          a fraction z gives decay near zero when (1 − z)R &lt; 1. On a network,
          the relevant threshold depends on connectivity and which machines
          remain reachable. Targeted intervention can matter more than the same
          random fraction; weights surviving in an archive are still different
          from live inference.
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
