import os
import json, time
from pathlib import Path
from huggingface_hub import snapshot_download
import mlx.core as mx
from mlx_lm import load, generate
from mlx_lm.sample_utils import make_sampler
folder=Path(os.environ.get("HELD_ART_RESULTS", ".local/qa/art-evaluation"))
folder.mkdir(parents=True, exist_ok=True)
models=[('SmolLM2-360M q4',os.environ.get("HELD_NATIVE_MODEL", ".local/edition03/model-q4")),('Qwen3-0.6B q4',snapshot_download('mlx-community/Qwen3-0.6B-4bit',revision='73e3e38d981303bc594367cd910ea6eb48349da8',allow_patterns=['*.json','*.safetensors','*.txt','README.md'])),('SmolLM2-1.7B bfloat16',snapshot_download('mlx-community/SmolLM2-1.7B-Instruct',revision='464b438b25894353a54836ec5d5a09157e62aa71',allow_patterns=['*.json','*.safetensors','*.txt','README.md']))]
results=[]
examples=[{'role':'user','content':'Draw a little boat in ASCII art. Return only the picture.'},{'role':'assistant','content':'       |\n       |\\\n       | \\\n       |__\\\n   ____|____\n   \\_______/\n ~~~~~~~~~~~~~'}, {'role':'user','content':'Draw a little house in ASCII art. Return only the picture.'},{'role':'assistant','content':'       /\\\n      /  \\\n     /____\\\n     | [] |\n     | __ |\n     ||  ||\n  ___||__||___'}]
for name,path in models:
    model,tok=load(path)
    for index,subject in enumerate(['a little alien in a flying saucer','a flower in a pot','a cat watching the moon']):
        mx.random.seed(index+6)
        messages=[{'role':'system','content':'You make small ASCII pictures. Reply with the picture only, using spaces and line breaks. No explanation.'}]+examples+[{'role':'user','content':f'Draw {subject} in ASCII art. Use at most 40 columns and 20 lines. Return only the picture.'}]
        prompt=tok.apply_chat_template(messages,tokenize=False,add_generation_prompt=True,enable_thinking=False)
        start=time.monotonic();text=generate(model,tok,prompt=prompt,max_tokens=384,sampler=make_sampler(temp=.65,top_p=.9),verbose=False)
        row={'model':name,'subject':subject,'text':text,'seconds':round(time.monotonic()-start,3),'width':max(map(len,text.splitlines()),default=0),'height':len(text.splitlines())}
        results.append(row);(folder/'format-comparison.json').write_text(json.dumps(results,indent=2));print(json.dumps(row),flush=True)
    del model,tok;mx.clear_cache()
