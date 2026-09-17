/** Maintainer commissioning: real production work, never synthetic model results. */
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join} from 'node:path';
const base='https://heldalive.com';
const config=JSON.parse(await readFile(join(homedir(),'Library/Application Support/HeldAlive/launch/bridge.json'),'utf8'));
const call=async(route,body)=>{const r=await fetch(base+route,{method:'POST',headers:{Authorization:`Bearer ${config.token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200);return r.json();};
const status=()=>call('/api/workflow?room=browser',{action:'status'});
const support=enabled=>call('/api/launch-support?room=browser',{enabled});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,timeout=600000){const end=Date.now()+timeout;while(Date.now()<end){const value=await fn();if(value)return value;await sleep(1000);}throw Error(label);}
const before=await status();assert.ok(before.enabled);
const browser=await chromium.launch({headless:true,channel:'chromium'});const contexts=[],pages=[],jobs=[],errors=[];const started=Date.now();
try {
 await support(false);
 const paused=(await status()).state.completed;await sleep(6000);assert.equal((await status()).state.completed,paused);
 for(let n=0;n<5;n++){
  const c=await browser.newContext({viewport:{width:1440,height:1000}});contexts.push(c);const p=await c.newPage();pages.push(p);
  p.on('pageerror',e=>errors.push(e.message));p.on('websocket',ws=>ws.on('framereceived',f=>{try{const d=JSON.parse(String(f.payload));if(d.type==='job'){jobs.push(d.job.agent);console.log('Live browser role:',d.job.agent?.role);}}catch{}}));
  await p.goto(base);await p.getByRole('button',{name:'Most compute',exact:true}).click();await p.locator('.your-contribution[data-compute-status="ready"]').waitFor({timeout:180000});console.log('Ready browser',n+1);
 }
 const saved=await until(async()=>{const s=await status();return s.state.completed>paused?s:false;},'production browser role did not complete');
 const instance=saved.state.loops.flatMap(l=>l.instances).find(i=>i.at>started&&i.status==='completed'&&i.source==='browser');assert.ok(instance,'actual browser-attributed role record');assert.equal(saved.launchSupport,false);
 await contexts.at(-1).close();
 await until(async()=>!(await fetch(base+'/api/state?room=browser').then(r=>r.json())).modelAvailable,'missing layer removes coverage',30000);
 const frozen=(await status()).state.completed;await sleep(6000);assert.equal((await status()).state.completed,frozen);
 const published=await until(async()=>{const s=await status();return s.outbox===0?s:false;},'durable publication queue did not drain',90000);
 await pages[0].screenshot({path:'.local/qa/edition11/live-browser.png',fullPage:true});
 await mkdir('.local/qa/edition11',{recursive:true});await writeFile('.local/qa/edition11/live-browser.json',JSON.stringify({kind:'real production roles, five headless browsers on one Mac; not a physical-phone/WAN benchmark',started,elapsedMs:Date.now()-started,beforeCompleted:paused,completed:published.state.completed,instance,jobs,errors,outbox:published.outbox,launchSupportDuringTest:false},null,2));assert.deepEqual(errors,[]);
 console.log('PASS production browser role, native inference disabled, capacity loss pauses, GitHub publication queue drained.',{instance:instance.id,completed:published.state.completed});
}finally{await browser.close();await support(before.launchSupport);}
