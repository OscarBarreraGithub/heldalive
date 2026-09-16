# Exploratory ASCII model trials

Run from the repo root in an Apple Silicon Python environment with the pinned MLX dependencies in `scripts/model-requirements.txt` and `huggingface_hub`. Set `HELD_NATIVE_MODEL` to the prepared 360M q4 model directory. Each script saves complete outputs under `.local/qa/art-evaluation` (override with `HELD_ART_RESULTS`). `direct.py`, `fewshot.py`, and `simple.py` use the prompts and settings of the edition 06 trials. Candidate downloads are revision-pinned. The 1.7B checkpoint is bfloat16, not q4.

These scripts exercise unconstrained candidate inference; the installation's drawing-alphabet grammar is a separate format control. Samples are exploratory, not model rankings or browser-speed benchmarks. Local timing depends on hardware, load and cache. Native final-format samples are archived under `docs/edition06/native-art-samples.json`.
