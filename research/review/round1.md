# Independent review — round 1 of at most 2

Date: 2026-09-15. Reviewer: independent reviewer agent `/root/review_round1`.

## Verdict

**PASS for mathematical content and evidence after four small corrections made during round 1.** The initial verdict was revise for the formal findings M1–M4 below. The author applied all four while this review was in progress, and I inspected the corrected passages in both manuscripts. No fundamental numerical or evidence failure was found. The numerical companion reruns successfully. Final task-ledger updates, rebuilt PDFs, visual checks, and extracted source-archive checks remain packaging duties. The user permits at most one further review round. This review does not require adding operational malware material or inventing empirical rates.

The findings below preserve the original issues and precise fixes rather than deleting review history. M1–M4 are resolved; L1 remains a final process item at the time of this review.

## Scope and work performed

- Read `ORIGINAL_PROMPT.md`, the entire supplied `gpt-6-response.md`, both manuscripts, `SOURCE_AUDIT.md`, the configuration snapshots, the numerical script/results, README, requirements, and task ledger.
- Checked the dimensional arithmetic, cache sizes, matrix and attention counts, pooled screens, serial-path argument, SIS solution and threshold, network closure and spectral proof, finite-chain recurrence, survival generator, Monte Carlo procedure, reservoir eigenvalues, and archive-loss algebra.
- Reran `.venv/bin/python research/calculations/compute.py` successfully. The recorded tables, survival probabilities, seed-dependent simulation result, and validation discrepancies reproduced.
- Independently opened primary source anchors for Qwen3.5-9B, Petals, Proofpoint, Jamf, Varonis, network mean field, and both original agent-incident reports. Checked the requested Dwarkesh essay's identity/date. These spot-checks support the manuscript's restrained empirical claims. This review does not claim independent access to the underlying incident telemetry or independent replication of every source paper.
- Confirmed the inspected short PDF contains **four pages including references** and both build logs contained no `Warning`, `Overfull`, or `undefined` matches. Full-page visual inspection and final source-archive compilation remain the parent author's assigned work.
- Did not download or execute malware, model weights, or propagation code, and did not modify the manuscripts. Rerunning the authorized offline script regenerated its usual numerical/figure outputs.

## Findings requiring correction or an explicit author disposition

### M1 — Medium: distinguish critical algebraic decay from strict exponential decay

**Location:** full manuscript, “Cleaning is different from changing the threshold,” originally lines 355–363; short manuscript, “Cleaning, patching, and dependencies,” around line 86.

The original wording said decay requires `(1-z) R < 1`. Equality also produces decay: substituting `beta(1-z)=delta` gives `dx/dt=-beta*x^2`, with solution `x(t)=x0/(1+beta*x0*t)`. The strict inequality is the condition for a strictly negative linear growth coefficient and exponential decay near zero, not all asymptotic decay.

**Precise fix:** state the strict condition for exponential decay, then state the equality case separately. The author implemented this during round 1; the revised wording and algebra were inspected and are correct. **Status: resolved during this round.**

### M2 — Medium: a negative derivative is sufficient, not necessary, for nonlinear stability

**Location:** full manuscript, “Coupling capability to activity without inventing feedback,” originally around line 485.

After correctly deriving `f'(x*)=x*[(1-x*)beta'(x*)-beta(x*)]`, the text says stability “requires” the derivative to be negative. A zero derivative is inconclusive and can admit a stable equilibrium when higher-order terms restore the state. The same nuance is correctly handled elsewhere in the SIS discussion.

**Precise fix:** replace the sentence with: a negative derivative gives local asymptotic stability, a positive derivative gives instability, and zero requires higher-order analysis. No numerical result changes.

**Status: resolved during this round; corrected three-way statement inspected.**

### M3 — Medium: make the no-self-contact assumption explicit in the network derivation

**Location:** full manuscript, “Network mean field and its approximation,” originally lines 366–372; short manuscript's network equation around lines 88–91.

The exact first-moment equation allows an arbitrary nonnegative `B`, but the subsequent factorization must apply only to distinct nodes. For `i=j`, `E[X_i^2]=x_i`, not `x_i^2`; the exact self-infection term vanishes. Without `B_ii=0`, the written closure can manufacture self-infection. A one-node counterexample with `B=2,D=1` has exact mean `x'=-x`, whereas the written closure would give `x'=x-2x^2` and a spurious positive fixed point.

**Precise fix:** require `B_ii=0` in the model definition and say the pairwise factorization is for `i != j`; or write both sums over `j != i`. Retain the current spectral analysis for that defined matrix. The star calculation already satisfies the condition. The cited [network mean-field paper](https://arxiv.org/html/1306.2588v1) is consistent with a contact-adjacency formulation; this finding is also established directly by the displayed binary-variable identity.

**Status: resolved during this round; zero-diagonal condition inspected in both manuscripts and distinct-node closure statement inspected in the full version.**

### M4 — Medium/clarification: specify which memory reads lie on the serial critical path

**Location:** full manuscript, “The serial-path counterexample,” originally lines 232–243; short manuscript's serial 50-second example around line 71.

The full version says a stage cannot start before its predecessor produces its input, which mostly supplies the necessary restriction. The short version omits that restriction. A matrix's weights are not intrinsically data-dependent on the arriving activation: prefetch into a faster memory tier can overlap some earlier work. Therefore `sum_j D_j/B_j` is a valid serial bound only for the counted reads constrained to occur after the relevant stage becomes ready, or for a model explicitly excluding useful prefetch/overlap. It is not an architecture-independent theorem about every stage partition.

**Precise fix:** explicitly state that the example assumes those weight reads occur after stage-input arrival and cannot overlap earlier stages; call `D_j` the bytes subject to that assumption. Preserve the general longest-dependency-path statement. In the short version, include the same caveat in a few words. The 50-second arithmetic is correct under the stated restriction and does not need changing.

**Status: resolved during this round; explicit no-cross-stage-prefetch restriction inspected in both manuscripts.**

### L1 — Low/process: bring the durable task record up to date before delivery

**Location:** `research/TASK_LEDGER.md` and `research/README.md`.

The inspected ledger still has almost all completed work unchecked and says zero review rounds completed. The README still labels the short length a target requiring verification. These files are intended to prevent work being lost across compaction, as explicitly requested by the user.

**Precise fix:** mark completed work and round 1, record dispositions for these findings, record final verified page counts, and identify final artifact locations. Do not claim the underlying empirical coefficients are identified or the work peer reviewed.

## Optional improvement, not a blocker

The already-cited [Proofpoint investigation](https://www.proofpoint.com/us/threat-insight/post/smominru-monero-mining-botnet-making-millions-operators), paragraph introducing Figure 6, reports recovery to roughly two-thirds of the earlier mining rate after intervention and cautiously interprets this as possible loss of control of about one-third of the population. A short, explicitly reported observation would connect historical evidence with the perturbation discussion. Do not treat a mining-rate fraction as a measured cleaned-host fraction, a random-removal experiment, an endemic equilibrium, or an autonomous-AI recovery coefficient. Leaving it out does not invalidate the calculations.

## Numerical and logical checks that passed

| Check | Independently reviewed result |
|---|---|
| SmolLM2 architecture count | `1,711,376,384` parameters under the stated tied-embedding architecture |
| Full-attention KV memory | SmolLM2 `1.5 GiB`; Qwen full-attention component `256 MiB` |
| Illustrative resident budgets | `3.640604560 GB` and `6.455008928 GB`; reserves/layout correctly labeled assumptions |
| Nominal resource screens | At 1 token/s: `1,1,42,63,625,625`; at 10 token/s: `1,5,42,500,625,5000` |
| Context-dependent traffic amendment | SmolLM2 ten-token/s aggregate screen becomes 3; Qwen remains 5 |
| Dense 10T storage and transfer | `5 TB` raw four-bit weights; `40,000 s = 11.111... h` at 1 Gbit/s |
| Scalar SIS solution | Analytic/integrator maximum absolute discrepancy about `1.92e-10` |
| Finite-chain means | At `N=40,n0=20,R=0.8,1,1.5,2`: `7.453823,10.417076,58.135063,2042.137631` |
| Recurrence vs matrix solve | Maximum recorded relative discrepancy about `2.27e-12` |
| Finite-horizon simulation | Exact survival `0.757938696`; simulated `0.761166667`; difference `0.584` standard errors |
| Random vs center removal | Star radius `1.13137`; leaf-removed `1.05830`; center-removed zero; threshold-crossing probability `1/9` |
| Availability | `0.9^10=0.34867844`; at least eight of ten `0.9298091736` |
| Reservoir example | Eigenvalues `-1.01097722,-0.08902278`; determinant `0.09` |
| Archive survival | Required scaled time `7.57562189` gives survival `0.05` for 100 independent loss-only copies |

The exact birth–death recurrence, generator orientation, almost-sure extinction proof, quasi-stationary lifetime distinction, and two-compartment determinant condition are correct within their explicit finite/closed/positive-loss assumptions. The code's simulation samples exponential event times correctly and counts survival correctly when the next event occurs beyond the horizon. The reports do not conflate numerical agreement with empirical validation.

## Primary-source spot-check results

- [Qwen's model overview](https://huggingface.co/Qwen/Qwen3.5-9B) specifies the nominal **language-model** parameter scale and the hybrid full/linear-attention layout used; exclusion of optional/vision components is disclosed.
- [Petals Table 3 and Section 3.3](https://arxiv.org/html/2209.01188v2) support 14 real GPU servers and 0.83/0.79 sequential steps/s at the two stated context lengths. The manuscript correctly distinguishes parallel-forward throughput and avoids treating arbitrary infected PCs as those GPUs.
- [Jamf](https://www.jamf.com/blog/cryptojacking-macos-malware-discovered-by-jamf-threat-labs/) and [Varonis](https://www.varonis.com/blog/monero-cryptominer) support the described monitoring-triggered stopping behavior. The manuscripts do not reproduce their operational methods.
- [Proofpoint](https://www.proofpoint.com/us/threat-insight/post/smominru-monero-mining-botnet-making-millions-operators) supports the reported host scale. The manuscript appropriately keeps mining work in hash units and avoids unsupported per-host or hash-to-token conversions.
- The [OpenAI report](https://cdn.openai.com/pdf/67869394-cb91-4c12-888c-5cbd85c7814c/OpenAI-Hugging-Face%20Incident-Technical-Report.pdf), printed pages 15–16, supports workload shutdown and checkpoint restrictions. [METR/Redwood](https://metr.org/hugging-face-incident-report-aug-2026.pdf), printed page 15 footnote 29, explicitly leaves the simultaneous-exit cause unknown. The manuscript preserves that uncertainty.
- [The requested Dwarkesh essay](https://www.dwarkesh.com/p/openai-huggingface) is correctly identified as Patel's August 29, 2026 essay; replacing the prior answer's initial Dario-essay attribution is justified.

## Original-request coverage checklist

| User requirement | Coverage and disposition |
|---|---|
| Read the prior response first and remain faithful to the original request | Preserved files, ledger, and manuscript discussion document this; prior answer's unsupported mappings are corrected |
| Save the full prompt as Markdown | Present in `ORIGINAL_PROMPT.md` |
| Previously caught malware hiding from routine activity monitoring | Jamf, Norman, perfctl; historical behavior only |
| Genuine citable database/literature and compute scale | SOREL-20M, mining-malware literature, MalwareBazaar description; Smominru host and hash-work anchor; dataset mismatch explicitly explained |
| Never reproduce malware | Respected; offline mathematical script contains no malware or host communications |
| Simple public model and Qwen 9B calculation | Explicit workloads, memory/compute/traffic terms, nominal tables and corrected long-context traffic screens |
| Astra and Fable ballparks | **Deliberately unidentified**; shared synthetic large-model stress tests provided. This is an appropriate evidence limitation, not a license to label invented parameter counts as product estimates |
| Limiting factors, assumptions, errors | Roofline, context/prefill, metadata, runtime, active/total parameters, serial path, availability, quality, covariance sensitivity and non-identification |
| Established mathematical techniques rather than decorative physics | Conservation/critical path, SIS, spectral mean field, exact birth–death chain, reservoir ODE; limited Lyapunov interpretation |
| Email/Slack-type spread assumptions | Accounts vs hosts and effective transition-rate definition; no operational mechanisms or fabricated measured rates |
| Stable points and perturbations | Scalar thresholds, durable vs temporary interventions, targeted/random star, feedback derivative; resolve M1–M3 wording/assumptions |
| Metastability and decentralized persistence | Exact finite-state extinction, survival and quasi-stationary discussion; compute dependencies kept distinct from contact topology |
| Requested Hugging Face narrative and incident | Original reports plus requested narrative, with source scope and correlated-failure limits |
| Huge escaped-model computation | 10T dense/MoE stress tests, physical transfer scale, archives/reactivation and copy-loss probability |
| Test “only the whole internet can stop it” | Universal claim correctly rejected with separate suppression, reactivation and erasure endpoints |
| Full derivation in `.tex` | Present; detailed derivations and reproducible values; resolve the small formal findings |
| Four-page research-style `.tex`, no more than five pages including title | Present, inspected compiled PDF is four pages including references |
| arXiv source preparation | Ordinary LaTeX/BibTeX/relative figures; no false submission or acceptance claim; final extracted-bundle compile belongs to packaging check |
| Reviewer agent and at most two rounds | This is the requested independent round 1; no child reviewer or extra agents spawned |
| Persist task tracking and log final judgment | Ledger exists but needs final status/disposition update (L1) |

### Remaining scientific limits accepted by this review

There is no representative compromised-host resource dataset, own inference benchmark, calibrated calendar-time propagation forecast, proprietary tensor inventory, or joint fitted probability of useful escaped-model survival. The manuscript repeatedly and correctly states these limits. The user asked for scientific calculations rather than hearsay; forcing precise infected-host counts or named proprietary ballparks would reduce scientific validity. The useful contribution is the transparent conditional accounting and checked containment mathematics, not a measured botnet deployment forecast.
