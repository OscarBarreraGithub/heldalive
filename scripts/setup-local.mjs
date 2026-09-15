import { mkdir, writeFile, readFile, chmod } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
await mkdir('.local', { recursive: true, mode: 0o700 });
let token;
try { token = JSON.parse(await readFile('.local/bridge.json', 'utf8')).token; } catch { token = randomBytes(48).toString('base64url'); }
for (const [file, content] of [
  ['.dev.vars', `BRIDGE_TOKEN=${token}\n`],
  ['.local/bridge.json', JSON.stringify({ url: 'http://127.0.0.1:8787', token, model: 'qwen2.5:0.5b' }, null, 2)],
  ['.local/secrets.json', JSON.stringify({ BRIDGE_TOKEN: token })],
]) {
  try { await writeFile(file, content, { flag: 'wx', mode: 0o600 }); } catch (error) { if (error.code !== 'EEXIST') throw error; }
  await chmod(file, 0o600);
}
execFileSync('npx', ['wrangler', 'types'], { stdio: 'inherit' });
console.log('Local configuration is ready. Secrets were not printed.');
