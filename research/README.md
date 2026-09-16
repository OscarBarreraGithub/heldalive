# Compute and containment research

## Deliverables

- `tex/full_analysis.tex`: **21-page** full derivation, evidence limits, worked resource accounting, network and stochastic models, archive analysis.
- `tex/short_paper.tex`: **four-page** research-style paper, including title, abstract and references; page count verified after compilation.
- `../public/research/short-paper.pdf` and `../public/research/full-analysis.pdf`: final compiled PDFs.
- `ORIGINAL_PROMPT.md`: preserved task request.
- `TASK_LEDGER.md`: progress and scope record.
- `SOURCE_AUDIT.md`: all cited claims, source locators, corrections and access limitations.
- `calculations/compute.py`: offline arithmetic and abstract-state simulation; no network calls or malware functionality.
- `calculations/results.json`, `resources.csv`, `extinction.csv`: numerical outputs.
- `review/`: reviewer findings, at most two rounds, and final judgment.

## Reproduce

From the workspace root, create an environment and install `research/calculations/requirements.txt`, then run:

```sh
python research/calculations/compute.py
cd research/tex
latexmk -pdf -interaction=nonstopmode -halt-on-error full_analysis.tex
latexmk -pdf -interaction=nonstopmode -halt-on-error short_paper.tex
```

The two public configuration snapshots in `sources/` are inputs. Figures are regenerated into `tex/figures/`. No model weights or malware samples are used. Python 3.14.3, NumPy 2.5.3, SciPy 1.18.1, Matplotlib 3.11.2 and pdfTeX 1.40.29 (TeX Live 2026) were used for the recorded run.

The repository includes both manuscripts, the bibliography, generated figures, configuration inputs, numerical outputs and the prior two-round review. This is arXiv-compatible source preparation, not a submission or guarantee of acceptance. A human author should supply the author block and review the scientific limitations before submission. Source PDF excerpts are not redistributed here; links and locators are in the audit.

## Interpretation

Resource tables use hypothetical consenting-host allocations. The reviewed evidence does **not** identify infected-host counts, proprietary architectures, representative spread rates, or calendar lifetimes of escaped systems. The papers explain what can be calculated, how it depends on assumptions, and what measurements would be needed. The original user-requested malware non-reproduction restriction is preserved throughout.
