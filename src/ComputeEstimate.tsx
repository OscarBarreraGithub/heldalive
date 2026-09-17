import { useEffect, useState } from "react";
import {
  PHONE_EQUIVALENTS,
  simulatedPhoneEquivalents,
} from "../shared/compute-estimate";

export function useSimulatedCompute() {
  const [value, setValue] = useState(() =>
    simulatedPhoneEquivalents(Date.now()),
  );
  useEffect(() => {
    // Two inexpensive updates per ten seconds, with no work in hidden tabs.
    const update = () => {
      if (!document.hidden) setValue(simulatedPhoneEquivalents(Date.now()));
    };
    const timer = setInterval(update, 5000);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return value;
}

export function ComputeEstimate({ value }: { value: number }) {
  return (
    <aside
      className="compute-estimate"
      aria-label="Simulated phone-equivalent compute"
    >
      <div className="estimate-reading">
        <strong data-simulated-phone-equivalents>≈{value}</strong>
        <div>
          <span>phones’ worth of compute</span>
          <small>SIMULATED ESTIMATE</small>
        </div>
      </div>
      <p>
        A little from many. An imagined Qwen workload, expressed in tiny phone
        contributions. <a href="#math">How we estimate it ↗</a>
      </p>
    </aside>
  );
}

export function ComputeEstimateExplanation() {
  return (
    <section className="estimate-explanation paper-panel">
      <span className="eyebrow">THE PHONE-EQUIVALENT SCENARIO</span>
      <h2>What does “≈{PHONE_EQUIVALENTS} phones” mean?</h2>
      <p>
        Imagine running Qwen3 4B on 10% of one M4-class desktop’s inference
        capacity. We assume each phone’s browser runs the same work at 2% of
        that desktop’s full speed, then contributes 5% of its own capacity. That
        gives roughly 100 phone-equivalents.
      </p>
      <p className="estimate-equation">
        10% ÷ (2% × 5%) = 100 phone-equivalents
      </p>
      <p>
        The phone speed is an unmeasured assumption. Choosing 1–10% instead
        gives 20–200 equivalents, before network and coordination losses. This
        is a sensitivity example, not a confidence interval or a tested
        requirement for keeping the model running.
      </p>
      <p>
        The counter’s gentle fluctuations are part of the simulation. They do
        not track people arriving, measured GPU use or completed model work. The
        10% desktop allocation is a scenario, not an enforced load limit on the
        current installation. Actual connected tabs and work appear in the
        measured activity counters; actual models are named on the home page.
      </p>
    </section>
  );
}
