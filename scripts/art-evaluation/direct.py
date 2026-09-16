import os
import json, time, re
from pathlib import Path
from huggingface_hub import snapshot_download
import mlx.core as mx
from mlx_lm import load, generate
from mlx_lm.sample_utils import make_sampler
folder=Path(os.environ.get("HELD_ART_RESULTS", ".local/qa/art-evaluation"))
folder.mkdir(parents=True, exist_ok=True)
models=[('SmolLM2-360M q4',os.environ.get("HELD_NATIVE_MODEL", ".local/edition03/model-q4")),('Qwen3-0.6B q4',snapshot_download('mlx-community/Qwen3-0.6B-4bit',revision='73e3e38d981303bc594367cd910ea6eb48349da8',allow_patterns=['*.json','*.safetensors','*.txt','README.md']))]
results=[]
subjects=['a little alien in a flying saucer','a house with a tree beside it','a curious flower growing from a teacup']
for name,path in models:
    model,tok=load(path)
    for index,subject in enumerate(subjects):
        mx.random.seed(index+6)
        messages=[{'role':'system','content':'You draw pictures using only printable ASCII characters, spaces and line breaks. Output the drawing only: no words, title, explanation or code fences. Preserve spaces to align the picture.'},{'role':'user','content':f'Draw {subject}. Canvas: at most 40 characters wide and 20 lines high. Use 8 to 16 lines. Character cells are twice as tall as they are wide. Draw one centered, recognizable silhouette with a few charming details. Use spaces for empty areas; do not fill the whole canvas with characters.'}]
        prompt=tok.apply_chat_template(messages,tokenize=False,add_generation_prompt=True,enable_thinking=False)
        start=time.monotonic()
        text=generate(model,tok,prompt=prompt,max_tokens=512,sampler=make_sampler(temp=.55,top_p=.9),verbose=False)
        lines=text.strip('\n').splitlines()
        row={'model':name,'subject':subject,'text':text,'seconds':round(time.monotonic()-start,3),'width':max(map(len,lines),default=0),'height':len(lines),'ascii':text.isascii()}
        results.append(row)
        (folder/'model-comparison.json').write_text(json.dumps(results,indent=2))
        print(json.dumps(row),flush=True)
    del model,tok
    mx.clear_cache()
