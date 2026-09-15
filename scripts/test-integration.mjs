import assert from 'node:assert/strict';
import { WebSocket } from 'ws';

const base = process.env.HELD_TEST_URL || 'http://127.0.0.1:8787';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Integration fixtures must only run locally.');
const opened = [];
async function peer(room = 'browser') {
  const url = new URL(`/api/socket?room=${room}`, base); url.protocol = 'ws:';
  const ws = new WebSocket(url, { origin: base }); opened.push(ws);
  const events = [];
  ws.on('message', b => events.push(JSON.parse(b.toString())));
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  return { ws, events, send: data => ws.send(JSON.stringify(data)) };
}
async function until(fn, timeout = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeout) { const result = fn(); if (result) return result; await new Promise(r => setTimeout(r, 30)); }
  throw new Error('Condition timed out');
}
async function rejected(query, origin, expected) {
  const url = new URL(`/api/socket?${query}`, base); url.protocol = 'ws:';
  const code = await new Promise((resolve, reject) => {
    const ws = new WebSocket(url, origin ? { origin } : {});
    ws.on('unexpected-response', (_req, res) => { resolve(res.statusCode); res.resume(); ws.terminate(); });
    ws.on('open', () => { ws.close(); reject(new Error('Unauthorized socket connected')); });
    ws.on('error', () => {});
  });
  assert.equal(code, expected);
}
try {
  await rejected('room=main&role=bridge', null, 401);
  await rejected('room=browser', 'https://foreign.example', 403);
  console.log('PASS: bridge authentication and browser origin checks');
  const watcher = await peer();
  await until(() => watcher.events.find(e => e.type === 'state'));
  assert.equal(watcher.events.at(-1).mode, 'browser');
  watcher.send({ type: 'chunk', jobId: 'forged', text: 'FORGED' });
  const contributor = await peer();
  contributor.send({ type: 'ready', ready: true, duty: 0.05, visible: true });
  const jobEvent = await until(() => contributor.events.find(e => e.type === 'job'), 35000);
  assert.ok(jobEvent.job.messages.some(m => m.content.includes('consenting visitors')));
  watcher.send({ type: 'chunk', jobId: jobEvent.job.id, text: 'FORGED' });
  contributor.send({ type: 'chunk', jobId: jobEvent.job.id, text: 'Integration fixture: a thought from its assigned contributor.' });
  contributor.send({ type: 'done', jobId: jobEvent.job.id, tokens: 12 });
  const completed = await until(() => watcher.events.find(e => e.type === 'state' && e.thoughts.some(t => t.id === jobEvent.job.id)));
  assert.equal(completed.thoughts.at(-1).text, 'Integration fixture: a thought from its assigned contributor.');
  assert.equal(completed.thoughts.at(-1).tokens, 12);
  assert.equal(completed.active, null);
  console.log('PASS: real job assignment, owner-only output, shared completion, persisted counters');
  contributor.send({ type: 'ready', ready: false });
  const withdrawal = await until(() => watcher.events.slice().reverse().find(e => e.type === 'state' && e.contributors === 0 && e.phase === 'waiting'));
  assert.equal(withdrawal.modelAvailable, false);
  console.log('PASS: withdrawal stops browser inference without a Mac fallback');
  watcher.send({ type: 'whisper', text: 'A harmless integration note' });
  await until(() => watcher.events.some(e => e.type === 'accepted'));
  watcher.send({ type: 'whisper', text: 'A second note too soon' });
  await until(() => watcher.events.some(e => e.type === 'error' && e.message.includes('Give this thought')));
  console.log('PASS: note acceptance and rate limiting');
  const state = await fetch(`${base}/api/state?room=browser`).then(r => r.json());
  assert.ok(state.thoughts.some(t => t.id === jobEvent.job.id));
  assert.ok(!JSON.stringify(state).includes('peerId'));
  assert.ok(!JSON.stringify(state).includes('lastWhisper'));
  console.log('PASS: state readback excludes connection identity and private scheduling data');
} finally { for (const ws of opened) ws.close(); }
