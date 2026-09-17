"""Development-only numerical oracle; never used by the hosted application."""
import json,sys
from pathlib import Path
import mlx.core as mx
from mlx_lm import load
config=json.loads(Path('shared/model-config.json').read_text())
model,tok=load(sys.argv[1] if len(sys.argv)>1 else '.local/edition07/model-q4')
questions=['What is the capital of France?',
 'Record:\n'+ '\n'.join(f'Person {i} keeps item {i+100} beside door {i+3}.' for i in range(24))+'\nWhich item does Person 7 keep? Answer briefly.',
 'Copy this line exactly: café, naïve, π = 3.14; 2026\n\nThen say done.']
cases=[]
for question in questions:
 prompt=tok.apply_chat_template([{'role':'system','content':'You are a helpful assistant.'},{'role':'user','content':question}],tokenize=False,add_generation_prompt=True)
 ids=tok.encode(prompt,add_special_tokens=False)
 logits=model(mx.array([ids]))[0,-1,:].astype(mx.float32);mx.eval(logits)
 top=mx.argsort(logits)[-10:][::-1].tolist()
 cases.append({'prompt':prompt,'ids':ids,'top':[[i,logits[i].item()] for i in top]})
Path('models') .joinpath(config['id'],'reference.json').write_text(json.dumps({'engine':'mlx-lm 0.31.3, mlx 0.32.2','cases':cases},indent=2))
print('Reference token counts:',[len(c['ids']) for c in cases])
