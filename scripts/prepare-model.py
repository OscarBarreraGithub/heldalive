"""Optional rebuild on Apple Silicon; visitors never run this script."""
import json
from pathlib import Path
from huggingface_hub import snapshot_download
from mlx_lm import convert
config=json.loads(Path("shared/model-config.json").read_text())
source=snapshot_download(config["hfRepo"], revision=config["sourceRevision"],
    allow_patterns=["*.json","*.safetensors","*.txt","*.jinja","README.md","LICENSE*"])
target=Path(".local/edition07/model-q4")
# This source is already affine four-bit. Retain the integer weights;
# cast floating-point scales, biases and norms for the browser's f16 kernels.
convert(hf_path=source,mlx_path=str(target),quantize=False,dtype="float16")
(target/"held-model.json").write_text(json.dumps({"id":config["id"],"revision":config["weightsRevision"]}))
print(f"Prepared. Run: npx tsx scripts/pack-model.ts {target}")
