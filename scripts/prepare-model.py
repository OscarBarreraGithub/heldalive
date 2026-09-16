"""Optional rebuild on Apple Silicon. Browser visitors never run this script.
Create a private virtual environment, install scripts/model-requirements.txt,
then run this script and `npx tsx scripts/pack-model.ts .local/model-q4`.
"""
from pathlib import Path
from huggingface_hub import snapshot_download
from mlx_lm import convert
REVISION = 'a10cc1512eabd3dde888204e902eca88bddb4951'
source = snapshot_download('HuggingFaceTB/SmolLM2-360M-Instruct', revision=REVISION,
    allow_patterns=['*.json', '*.safetensors', '*.txt', 'README.md', 'LICENSE*'])
convert(hf_path=source, mlx_path='.local/model-q4', quantize=True,
    q_group_size=64, q_bits=4, dtype='float16')
print('Converted. Run: npx tsx scripts/pack-model.ts .local/model-q4')
