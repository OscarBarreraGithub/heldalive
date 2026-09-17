import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const base=process.env.HELD_TEST_URL || 'http://127.0.0.1:8787';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,channel:'chromium'});
try{
 const page=await browser.newPage();let ready=false,intercepted=false;
 await page.route('**/weights/**/g.embed_w.0.bin',route=>{intercepted=true;return route.fulfill({status:200,contentType:'application/octet-stream',body:Buffer.alloc(16)})});
 page.on('websocket',ws=>ws.on('framesent',f=>{try{if(JSON.parse(String(f.payload)).type==='pipeline_ready')ready=true}catch{}}));
 await page.goto(base);
 await page.locator('.your-contribution[data-compute-status="error"]').waitFor({timeout:60000});
 assert.ok(intercepted);assert.match(await page.locator('.compute-notice').innerText(),/integrity check/);assert.equal(ready,false);
 console.log('PASS: altered model part is rejected before readiness; no incomplete model joins a chain. LOCAL network fixture.');
}finally{await browser.close()}
