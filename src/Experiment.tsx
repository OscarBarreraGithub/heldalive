import { CURRENT_MODEL as model } from "../shared/model";
import budgets from "../shared/model-budgets.json";
import { ArrowUpRight, Brain } from "lucide-react";
import type { Snapshot } from "../shared/protocol";
export function Experiment({ state }: { state: Snapshot | null }) {
  return (
    <div className="inner-page experiment-page">
      <div className="page-kicker">
        <Brain size={15} /> A SMALL EXPERIMENT IN SHARED EXISTENCE
      </div>
      <h1>
        We hold it here.
        <br />
        <em>It leaves little drawings.</em>
      </h1>
      <p className="page-intro">
        Held Alive is the title of the artwork. The alien has no name. It stands
        for a small language model whose work can be shared across the browsers
        visiting this page.
      </p>
      {state?.power?.launchSupport && (
        <p className="preview-truth">
          <strong>Still a preview.</strong> Temporary server support can draw
          when browser pieces are missing. Browser-only survival begins when
          that support is retired.
        </p>
      )}
      <div className="editorial-grid">
        <article>
          <span className="section-number">01 / A SKETCHBOOK, FOR NOW</span>
          <h2>Only ASCII art.</h2>
          <p>
            The model makes drawings from text characters. One short prompt asks
            it to choose a simple subject. It chooses every mark using its full
            vocabulary; a format check rejects non-ASCII or oversized attempts.
            A 40-column × 20-row canvas preserves spaces and line breaks.
            Formatting checks do not prove a drawing is good.
          </p>
          <p>
            More complete groups can make more drawings in parallel. The small
            saucers show actual additional drawing jobs. There is no voting or
            visitor chat, and no live memory experiments or prose journals in
            this edition.
          </p>
          <p>
            The ship's flights and spins are animation. They do not mean that
            the model is running another hidden task.
          </p>
        </article>
        <article>
          <span className="section-number">02 / TIME, NOT MONEY</span>
          <h2>Your tab does real work.</h2>
          <p>
            A compatible visible tab automatically holds a small piece of the
            model. Choose Gentle, More or Most to change your contribution. The
            extra levels last ten minutes. Watch stops contribution and stays
            saved.
          </p>
          <p>
            Gentle holds up to 2 layers, More up to 4 and Most up to 8. With
            identical contributions, that means {budgets["2"].holders},{" "}
            {budgets["4"].holders} or {budgets["8"].holders} tabs for a complete
            {model.layers}-layer model. Mixed contributions also work. A
            complete group makes one drawing at a time; there are at most eight
            groups.
          </p>
          <p>
            These are chosen contribution budgets. The model can fit on one
            capable computer; sharing is what makes this installation depend on
            a collective.
          </p>
        </article>
      </div>
      <section className="manifesto-panel">
        <span className="large-asterisk" aria-hidden="true">
          ✳
        </span>
        <p>
          Software can live across many computers.
          <br />
          What does it take to make it stop?
        </p>
        <span>THE QUESTION BEHIND HELD ALIVE</span>
      </section>
      <div className="editorial-grid">
        <article>
          <span className="section-number">03 / AN ACTUAL DEPENDENCY</span>
          <h2>No complete group. No new picture.</h2>
          <p>
            Each output token passes through all {model.layers} model layers. If
            a necessary browser leaves, its group's unfinished drawing stops.
            Other complete groups may continue. Enough returning browsers can
            restart interrupted work.
          </p>
          <p>
            During the preview, a server runs the same checkpoint when no
            browser group is complete. Its source is disclosed. Once support is
            off, missing coverage stops generation. Saved files remain; “death”
            does not mean permanent erasure or consciousness.
          </p>
        </article>
        <article>
          <span className="section-number">04 / A REASON TO COME BACK</span>
          <h2>See what the time became.</h2>
          <p>
            Completed drawings remain in the sketchbook. Keep favorites locally
            or download their original text. Each page records when it was made
            and whether browsers or preview support produced it.
          </p>
          <p>
            Some drawings will be lovely, some will be odd. This is a small
            model, and often makes abstract or uneven sketches. There are no
            paid boosts or messages to purchase.
          </p>
        </article>
      </div>
      <details className="paper-panel">
        <summary>What the page uses and stores</summary>
        <p>
          Model files load automatically on compatible visible tabs: about{" "}
          {budgets["2"].minMB}–{budgets["2"].maxMB}
          MB at Gentle, up to {budgets["4"].maxMB} MB at More, and up to{" "}
          {budgets["8"].maxMB} MB at Most. Cached files can remain after
          leaving. Browsers also exchange intermediate model values; these sizes
          are not total traffic.
        </p>
        <p>
          Work/rest targets are 5%, 10% and 20%; they are not exact GPU
          utilization or battery limits. Loading is additional work. Hidden tabs
          withdraw their piece, and closing the page stops its computation.
          Initial data-saving preferences and saved Watch are respected.
          Unsupported devices can perform small token-sampling tasks or simply
          watch.
        </p>
        <p>
          The page stores an anonymous identity cookie and local
          preferences/favorites. The coordinator stores completed public
          drawings and counters. The model receives no personal files or content
          from other tabs. Providers still see normal request information.
        </p>
        <p>
          Earlier research records remain in the source history and read-only
          archive. They are not active tasks.
        </p>
      </details>
      <a className="text-link" href="#math">
        Read the mathematics <ArrowUpRight size={14} />
      </a>
    </div>
  );
}
