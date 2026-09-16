# Source and claim audit

Access date: **2026-09-15**. “Verified” below means the named source was opened and checked for the specified claim. It does not mean independent replication of the source's underlying measurements. No malware samples or inference weights were downloaded or executed. Public configuration JSON and historical report figures were inspected. Numerical results in the manuscripts are separately checked by `calculations/compute.py`.

## Historical evidence

| BibTeX key | Source and locator checked | Supported use and limit |
|---|---|---|
| `jamf` | [Jamf investigation](https://www.jamf.com/blog/cryptojacking-macos-malware-discovered-by-jamf-threat-labs/), **Gaslight**, behavior paragraph | macOS malicious activity stops when Activity Monitor opens, returning on a later launch of the affected application. No assertion of general undetectability or concealed resource percentage. No commands reproduced. |
| `norman` | [Varonis investigation](https://www.varonis.com/blog/monero-cryptominer), Norman execution analysis | Miner stops on Task Manager opening and resumes after closure. Used only for observed behavior and measurement bias. The mutable page's publication year is deliberately omitted from the bibliography. |
| `perfctl` | [Aqua investigation](https://www.aquasec.com/blog/perfctl-a-stealthy-malware-targeting-millions-of-linux-servers/), **Main Impact** and **Appendix 5**, paragraph discussing the modified monitoring display | CPU exhaustion in observed cases; routine monitoring output concealed resource consumption. “Targeting millions” in the title is not used as a measured infection count. |
| `smominru` | [Proofpoint investigation](https://www.proofpoint.com/us/threat-insight/post/smominru-monero-mining-botnet-making-millions-operators), sinkholing paragraph and original Figures 2–5 | Reported **more than 526,000 Windows hosts**, mostly believed servers. Figure 3 was downloaded and visually inspected: **24 h average 2.61 MH/s**. Figure 2 separately shows **3.33 MH/s**. Neither rate divided by affected-host count; no hashes-to-FLOPs conversion. |
| `sorel` | [Harang and Rudd, arXiv:2012.07634](https://arxiv.org/abs/2012.07634), abstract and metadata | Nearly 20 million files, features and labels. A detection dataset, not unique-host resource telemetry. Dataset not downloaded. |
| `mining` | [Pastrana and Suarez-Tangil, arXiv:1901.00846v2](https://arxiv.org/abs/1901.00846v2), abstract and publication note | Approximately 4.5 million samples, 1.2 million miners; campaign/payment analysis. This is the full version associated with IMC 2019. No host-count or inference-capacity conversion. |
| `bazaar` | [MalwareBazaar About](https://bazaar.abuse.ch/about/), introductory paragraph | Malware sample and intelligence repository. Documentation only; no sample acquisition. |

## Model and systems evidence

| Key | Source and locator checked | Supported use and limit |
|---|---|---|
| `smol` | [Official SmolLM2 configuration](https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct/raw/main/config.json), saved JSON | Layers 24, hidden size 2048, heads/KV heads 32, intermediate size 8192, vocabulary 49152, tied embeddings. Architecture-based parameter count and KV calculation are our derivations; actual tensors were not downloaded. |
| `qwen` | [Official Qwen3.5-9B card](https://huggingface.co/Qwen/Qwen3.5-9B), **Model Overview**, and [configuration](https://huggingface.co/Qwen/Qwen3.5-9B/raw/main/config.json) | Nominal 9B language-model scale, eight full-attention layers and 24 linear layers; Q/KV heads 16/4, full head dimension 256; linear state dimensions recorded. The assumed 48 MiB recurrent allocation is a layout scenario, not a measured backend footprint. Optional vision/MTP residency excluded. |
| `deepseek` | [DeepSeek-V3 official card](https://huggingface.co/deepseek-ai/DeepSeek-V3), **Introduction** and **Model Downloads** | Main model: 671B total / 37B active; separate 14B MTP module. Card directly checked; the manuscript cites the card rather than relying on an unparsed abstract for the numeric claim. Four-bit packing is our scenario, not the card's download format. |
| `astra` | [Official GPT-6 Astra specification](https://developers.openai.com/api/docs/models/gpt-6-astra), whole model page and parameter search | The reviewed API page does not disclose the architecture/resource quantities needed here. This is a bounded statement about reviewed material, not proof that no specification exists anywhere. Product name is retained. |
| `fable` | [Official Claude Fable page](https://www.anthropic.com/claude/fable), product page for 5.1 and parameter search | Same limitation as Astra. No actual architecture, parameter count, or relative compute requirement is inferred. |
| `roofline` | [Original Berkeley technical report UCB/EECS-2008-134](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2008/EECS-2008-134.pdf), section 3 and performance equation | Memory/arithmetic bottleneck bounds and operational intensity. Bibliography deliberately cites the accessible 2008 technical report, whose title differs from the 2009 CACM article. Prior response's eScholarship link encountered a browser challenge; replaced with the primary report. |
| `pope` | [Efficiently Scaling Transformer Inference](https://arxiv.org/abs/2211.05102) and [full HTML](https://arxiv.org/html/2211.05102v1) | Inference latency/context/batch/partitioning framework. Our tensor arithmetic is derived explicitly rather than presented as a universal performance formula from this paper. No vendor benchmark transplanted to compromised PCs. |
| `petals` | [Petals v2](https://arxiv.org/html/2209.01188v2), **Table 3 and section 3.3**, saved PDF | BLOOM-176B; 14 real GPU servers; 0.83 sequential steps/s at length 128, 0.79 at 2048. Parallel-forward columns kept distinct. Raw table, configuration description, title, authors and version checked. |

## Mathematical sources and incident evidence

| Key | Source and locator checked | Supported use and limit |
|---|---|---|
| `network` | [Van Mieghem and Omic](https://arxiv.org/abs/1306.2588), [full HTML](https://arxiv.org/html/1306.2588v1) | Heterogeneous network mean-field framework and spectral thresholds. Our positive-vector proof states the irreducible/reducible conditions. The closure is not claimed to be exact stochastic dynamics. |
| `doering` | [Doering, Sargsyan and Sander](https://arxiv.org/html/q-bio/0401016v1), sections 1–3 and saved PDF | Finite birth–death extinction, SIS example, backward equation, failure of diffusion approximations for rare extinction. Full proof and calculations are provided independently. Our almost-sure extinction claim explicitly requires finite closed state space and positive clearance; no unqualified claim for arbitrary Markov chains. |
| `gillespie` | [Original 1977 article via university-hosted PDF](https://www.ma.imperial.ac.uk/~nsjones/gillespie_1977.pdf) | Exact event simulation of specified continuous-time hazards. DOI **10.1021/j100540a008** checked. ACS landing page retrieval failed; original article copy used. No claim that simulation validates empirical rates. |
| `albert` | [Albert, Jeong and Barabási](https://arxiv.org/abs/cond-mat/0008064), abstract and bibliographic metadata | Precedent for distinguishing random and targeted network removal. The manuscript's nine-node star is its own exactly solved example, not fitted or attributed numerical results. |
| `qiu` | [Authors' institutional publication record](https://experts.illinois.edu/en/publications/modeling-and-performance-analysis-of-bittorrent-like-peer-to-peer/), abstract and DOI | Verified bibliographic existence and fluid-model precedent only. DOI **10.1145/1030194.1015508** is the journal/proceedings record used. Full paper not needed for the independently derived transfer-conservation bound; no paper-specific rates or formulas imported. Pagination differs across records, so page range omitted. |
| `openaiincident` | [OpenAI technical report](https://cdn.openai.com/pdf/67869394-cb91-4c12-888c-5cbd85c7814c/OpenAI-Hugging-Face%20Incident-Technical-Report.pdf), printed pp. 15–16; linked by [original announcement](https://openai.com/index/hugging-face-incident-and-the-road-ahead/) | Workload shutdowns, later-found checkpoint, restricted model weights. Used to distinguish infrastructure compromise from demonstrated independent escaped-weight execution. Report's date is 2026-08-26. |
| `metr` | [METR/Redwood report](https://metr.org/hugging-face-incident-report-aug-2026.pdf), printed pp. 3–4, 15 footnote 29, 38–39 | Simultaneous exits with unknown cause, subsequent access failures, scope/redaction/transcript limitations. Common-cause failure is our modeling inference, not an established cause of those exits. |
| `dwarkesh` | [The Rise and Fall of Agent Civilizations](https://www.dwarkesh.com/p/openai-huggingface), title, date, opening narrative and links to both reports | Correct requested essay: Dwarkesh Patel, 2026-08-29. Secondary motivation only. It is not the Dario Amodei essay described as the motivating essay in the prior response. |
| `arxivguide` | [Official arXiv TeX submission guide](https://info.arxiv.org/help/submit_tex.html), processors/packages/bibliography guidance | Ordinary article class and TeX Live packages; include sources, bibliography and figures. No universal arXiv style or acceptance claim. Current guide accepts `.bib` or `.bbl`; bundles include both. |

## Corrections and qualifications to the prior response

1. The requested essay is Patel's **The Rise and Fall of Agent Civilizations**. The prior response's opening substitution of a Dario Amodei essay is not retained.
2. The 2.61 MH/s claim is verified specifically in **Figure 3**. Figure 2's 3.33 MH/s is a different displayed measure. The counts and rate are not converted into per-host LLM performance.
3. Petals' 0.79–0.83 values are **sequential steps/s**, with explicit context lengths and real cooperating GPU servers. No link to the SmolLM2 model card is used to support Petals.
4. The SmolLM2 long-context cache is substantial. Adding that traffic changes the nominal ten-token/s resource screen from 1 to 3; it still does not provide a sufficient distributed execution count.
5. Qwen full-attention and recurrent state are separated. Its nominal language-model scale is not an exact full-checkpoint or all-module tensor inventory.
6. DeepSeek's main model and optional prediction module are distinguished.
7. Astra/Fable architecture assumptions are not labeled actual ballpark estimates. Synthetic scenarios are not statistical bounds on undisclosed systems.
8. Network stability and finite stochastic extinction are kept distinct. The finite-state proof avoids the overly broad “any absorbing Markov process must become extinct” claim that would be false without conditions.
9. Activation does not consume an archive in the reservoir equations; an alternative convention would require another term. The linear system cannot predict an unlimited real-world steady population.
10. Internet shutdown is not assumed to erase disks or terminate local inference. Neither acquisition rates nor archive-loss rates are fitted to the agent incident.

## Audit limitations

Sources are checked for the statements actually used, not independently replicated or exhaustively validated. Reports can be incomplete; model cards and product pages are mutable. Saved public configuration files have hashes in `sources/download-manifest.json`. Third-party PDFs/images are research working files and are excluded from the final source bundles. No reviewed dataset supplies representative compromised-host inference resources; no manuscript value is presented as that missing measurement.
