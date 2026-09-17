/** Real WebGPU inference; no result fixtures and no native fallback. */
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const base=process.env.HELD_TEST_URL||'http://127.0.0.1:8792';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const token=(await readFile('.dev.vars','utf8')).match(/^BRIDGE_TOKEN\s*=\s*["']?([^\r\n"']+)/m)?.[1];
const post=async(path,body)=>{const r=await fetch(base+path,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200,await r.clone().text());return r.json();};
const admin=body=>post('/api/workflow?room=browser',body);
const state=()=>fetch(base+'/api/state?room=browser').then(r=>r.json());
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,timeout=120000){const end=Date.now()+timeout;while(Date.now()<end){const r=await fn();if(r)return r;await wait(500);}throw Error(label);}
const browser=await chromium.launch({headless:true,channel:'chromium'});
const contexts=[],pages=[],jobs=[],errors=[];let completions=0;
const snapshots=[];const resumed=process.env.HELD_RESUME === '1';const started=Date.now();let lastRenewal=started;const reportedRejections=new Set();
async function holder(){
 const context=await browser.newContext({viewport:{width:1440,height:1000}});contexts.push(context);
 const page=await context.newPage();pages.push(page);
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')console.log('BROWSER',m.text().slice(0,350));});
 page.on('websocket',ws=>{ws.on('framereceived',f=>{try{const d=JSON.parse(String(f.payload));if(d.type==='job'){jobs.push(d.job);console.log('JOB',d.job.agent?.role,d.job.agent?.instanceId);}}catch{}});ws.on('framesent',f=>{try{const d=JSON.parse(String(f.payload));if(d.type==='done'){completions++;console.log('MODEL DONE',d.tokens,d.inputTokens);}}catch{}});});
 await page.goto(base);await page.getByRole('button',{name:'Most compute',exact:true}).click();
 await page.locator('.your-contribution[data-compute-status="ready"]').waitFor({timeout:120000});return {page,context};
}
try {
 await admin({action:'enable',enabled:true});await post('/api/launch-support?room=browser',{enabled:false});
 for(let i=0;i<5;i++){await holder();console.log('HOLDER',i+1);}
 const first=await until(async()=>{const s=await admin({action:'status'});return s.state.loops[0]||null;},'first saved manager');const loopId=first.id;
 await until(async()=>{const s=await admin({action:'status'});snapshots.push(s);return s.state.completed>=1;},'orchestrator completes',300000);
 await until(async()=>(await state()).active,'next role starts');
 const lostAt=await admin({action:'status'});
 await contexts.at(-1).close();
 await until(async()=>!(await state()).modelAvailable,'missing physical layer stops inference');
 const stopped=(await admin({action:'status'})).state.completed;await wait(6000);
 assert.equal((await admin({action:'status'})).state.completed,stopped,'no model progress without coverage');
 await holder();console.log('REPLACED physical holder; same saved agent resumes');
 let final;
 await until(async()=>{
   const s=await admin({action:'status'});snapshots.push(s);
   const loop=s.state.loops.find(l=>l.id===loopId);
   const rejection=loop?.instances.at(-1);
   if(rejection?.status==='rejected'&&!reportedRejections.has(rejection.id)){reportedRejections.add(rejection.id);console.log('REJECTED',rejection.error);}
   if(Date.now()-lastRenewal>7*60000){
     // Exercise ordinary user renewal instead of bypassing the ten-minute cap.
     for(const page of pages.filter(p=>!p.isClosed())){await page.getByRole('button',{name:'Gentle compute',exact:true}).click();await wait(150);await page.getByRole('button',{name:'Most compute',exact:true}).click();await page.locator('.your-contribution[data-compute-status="ready"]').waitFor({timeout:120000});}
     lastRenewal=Date.now();console.log('Renewed voluntary ten-minute contributions');
   }
   if(loop?.stage==='failed')throw Error('Real model loop failed: '+loop.instances.at(-1)?.error);
   if(s.state.reports.some(r=>r.id===loopId)){final=s;return true;}return false;
 },'full browser-only manager loop completes',1800000);
 assert.equal(final.launchSupport,false);assert.ok(completions>=(resumed?1:8));assert.deepEqual(errors,[]);
 const instances=[...new Map(snapshots.flatMap(s=>s.state.loops.flatMap(l=>l.instances)).map(i=>[i.id,i])).values()];
 assert.ok(instances.some(i=>i.role==='researcher'&&i.status==='completed'));
 assert.ok(instances.filter(i=>i.status==='completed').every(i=>i.source==='browser'));
 await mkdir('.local/qa/edition11',{recursive:true});
 await pages[0].screenshot({path:'.local/qa/edition11/browser-workflow.png',fullPage:true});
 await writeFile('.local/qa/edition11/browser-workflow.json',JSON.stringify({kind:'actual WebGPU on one Mac; not a WAN/phone benchmark',elapsedMs:Date.now()-started,completions,loopId,instances,jobs,lostAt,final,errors},null,2));
 console.log('PASS real browser-only orchestrator → manager → planner → review → researcher → review → manager; physical loss pauses and replacement resumes; no local model. Elapsed',Date.now()-started);
}catch(e){await mkdir('.local/qa/edition11',{recursive:true});await writeFile('.local/qa/edition11/browser-failure.json',JSON.stringify({error:String(e),snapshots,jobs,errors},null,2));throw e;}
finally{await browser.close();}
