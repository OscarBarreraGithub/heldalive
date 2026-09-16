import os
import json,time
from mlx_lm import load,generate
from mlx_lm.sample_utils import make_sampler
from huggingface_hub import snapshot_download
import mlx.core as mx
from pathlib import Path
folder=Path(os.environ.get("HELD_ART_RESULTS", ".local/qa/art-evaluation"))
folder.mkdir(parents=True, exist_ok=True)
out=[]
for repo,rev in [('HuggingFaceTB/SmolLM2-360M-Instruct',None),('mlx-community/Qwen3-0.6B-4bit','73e3e38d981303bc594367cd910ea6eb48349da8'),('mlx-community/SmolLM2-1.7B-Instruct','464b438b25894353a54836ec5d5a09157e62aa71')]:
 p=os.environ.get("HELD_NATIVE_MODEL", ".local/edition03/model-q4") if rev is None else snapshot_download(repo,revision=rev,allow_patterns=["*.json","*.safetensors","*.txt","README.md"])
 m,t=load(p)
 for subj in ['cat','flower','rocket','smiling alien']:
  msg=[{'role':'user','content':f'Make a tiny ASCII art {subj}. Use plain text characters in 4 to 10 lines. Keep it less than 30 characters wide. Output only the picture.'}]
  prompt=t.apply_chat_template(msg,tokenize=False,add_generation_prompt=True,enable_thinking=False)
  mx.random.seed(0);start=time.monotonic();s=generate(m,t,prompt=prompt,max_tokens=256,sampler=make_sampler(temp=.2),verbose=False)
  r={'model':repo,'subject':subj,'text':s,'seconds':time.monotonic()-start};out.append(r);print(json.dumps(r),flush=True)
 del m,t;mx.clear_cache()
open(folder/'simple-comparison.json','w').write(json.dumps(out,indent=2))
