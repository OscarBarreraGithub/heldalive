/** LOCAL transport fixtures, never inference or public research evidence. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {WebSocket} from 'ws';
const base=process.env.HELD_TEST_URL||'http://127.0.0.1:8791';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const vars=await readFile('.dev.vars','utf8');
const token=vars.match(/^BRIDGE_TOKEN\s*=\s*["']?([^\r\n"']+)/m)?.[1];assert.ok(token);
const model=JSON.parse(await readFile('shared/model-config.json','utf8'));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const admin=async body=>{const r=await fetch(base+'/api/workflow?room=browser',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200,await r.clone().text());return r.json();};
async function until(fn,label,timeout=45000){const end=Date.now()+timeout;while(Date.now()<end){const x=await fn();if(x)return x;await wait(100);}throw Error(label);}
const clients=[];
async function connect(){
 const cookie=(await fetch(base+'/api/identity')).headers.get('set-cookie').split(';')[0];
 const ws=new WebSocket(base.replace('http','ws')+'/api/socket?room=browser',{headers:{Origin:base,Cookie:cookie}});
 const c={ws,jobs:[],events:[],send:d=>ws.send(JSON.stringify(d))};clients.push(c);
 ws.on('message',raw=>{const d=JSON.parse(raw);c.events.push(d);if(d.type==='job')c.jobs.push(d.job);if(d.type==='pipeline_assign'){c.piece=d.piece;c.send({type:'pipeline_ready',modelId:model.id,key:d.piece.key});}});
 await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
 c.send({type:'pipeline_offer',modelId:model.id,protocol:2,duty:0.2,visible:true});
 c.timer=setInterval(()=>{if(ws.readyState===1)c.send({type:'ping',visible:true});},15000);
 await until(()=>c.piece,'assignment');return c;
}
const state=()=>fetch(base+'/api/state?room=browser').then(r=>r.json());
const pendingJobs=()=>clients.flatMap(c=>c.jobs.splice(0).map(job=>({c,job})));
function finish(c,job){
 const ids=job.agent.sourceIds;
 const answer={summary:'Local transport fixture',content:'Verify a saved handoff survives replacement.'+(ids.length?` Inspected [${ids[0]}].`:''),decision:'advance',search:'agent memory evaluation',sources:ids[0]||'none',nextTask:`Investigate corrections for assignment ${job.agent.loopId}.`,lesson:'Do not bind an agent identity to its inference connection.'};
 c.send({type:'chunk',jobId:job.id,text:JSON.stringify(answer)});c.send({type:'done',jobId:job.id,tokens:70,inputTokens:200});
}
function close(c){clearInterval(c.timer);c.ws.close();}
try{
 const unauth=await fetch(base+'/api/workflow?room=browser',{method:'POST',body:'{}'});assert.equal(unauth.status,401);
 await admin({action:'enable',enabled:true});
 for(let i=0;i<10;i++)await connect();
 await until(async()=>(await state()).power.browserChains===2,'two independent groups');
 let first;await until(()=>{first=pendingJobs().find(x=>x.job.agent?.role==='orchestrator');return first;},'actual orchestrator job');
 finish(first.c,first.job);
 let pair=[];await until(()=>{pair.push(...pendingJobs());return pair.some(x=>x.job.agent.role==='manager_setup')&&pair.some(x=>x.job.agent.role==='orchestrator');},'parallel manager and orchestrator');
 const victim=pair.find(x=>x.job.agent.role==='manager_setup'),other=pair.find(x=>x.job.agent.role==='orchestrator');
 const holder=clients.find(c=>c.piece.group===victim.c.piece.group&&c!==victim.c);
 const before=(await admin({action:'status'})).state.completed;
 close(holder);
 await until(async()=>!(await state()).agents.some(a=>a.id===victim.job.id),'lost lease removed');
 finish(victim.c,victim.job); // delayed response from old lease
 await wait(250);assert.equal((await admin({action:'status'})).state.completed,before);
 assert.ok((await state()).agents.some(a=>a.id===other.job.id),'other group keeps running');
 finish(other.c,other.job);
 let replacement;
 await until(()=>{replacement=pendingJobs().find(x=>x.job.agent.instanceId===victim.job.agent.instanceId);return replacement;},'saved agent reassigned');
 assert.notEqual(replacement.job.id,victim.job.id);assert.notEqual(replacement.c.piece.group,victim.c.piece.group);
 finish(replacement.c,replacement.job);
 await until(async()=>(await admin({action:'status'})).state.completed===before+2,'each result committed once');
 const beforePause=await admin({action:'status'});
 for(const c of clients)close(c);
 await wait(8000);
 const paused=await admin({action:'status'});assert.equal(paused.state.completed,beforePause.state.completed);assert.equal((await state()).modelAvailable,false);
 for(let i=0;i<5;i++)await connect();
 let resumed;await until(()=>{resumed=pendingJobs().find(x=>x.c.ws.readyState===1);return resumed;},'resume saved agent after every browser left');
 finish(resumed.c,resumed.job);
 await until(async()=>(await admin({action:'status'})).state.completed>paused.state.completed,'resume completed work');
 const after=await admin({action:'status'});
 await mkdir('.local/qa/edition11',{recursive:true});
 await writeFile('.local/qa/edition11/transport.json',JSON.stringify({kind:'local fixtures only',beforePause,paused,after,reassigned:{instance:victim.job.agent.instanceId,oldLease:victim.job.id,newLease:replacement.job.id}},null,2));
 console.log('PASS: real role dispatch, two concurrent managers, independent group loss, same saved agent on another group, stale result rejected, zero-capacity pause and resume. LOCAL FIXTURES ONLY.');
}finally{for(const c of clients)close(c);await admin({action:'enable',enabled:false});}
