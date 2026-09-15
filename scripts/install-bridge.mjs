import { mkdir, writeFile, readFile, access, copyFile, chmod } from 'node:fs/promises';
import { build } from 'esbuild';
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
if (process.platform !== 'darwin') throw new Error('This installer is for macOS LaunchAgents. Run npm run bridge directly elsewhere.');
const root = process.cwd();
const runtime = join(homedir(), 'Library/Application Support/HeldAlive');
const config = resolve(process.env.HELD_CONFIG || '.local/bridge.json');
const parsed = JSON.parse(await readFile(config, 'utf8'));
if (!parsed.url || !parsed.token) throw new Error('Complete the bridge configuration first.');
let node = '/opt/homebrew/bin/node';
try { await access(node); } catch { node = process.execPath; }
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const label = 'com.heldalive.bridge';
const directory = join(homedir(), 'Library/LaunchAgents');
await mkdir(directory, { recursive: true });
await mkdir(runtime, { recursive: true, mode: 0o700 });
await build({ entryPoints: [resolve('bridge/index.ts')], outfile: join(runtime, 'bridge.mjs'), bundle: true, platform: 'node', format: 'esm', target: 'node22', banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" } });
await copyFile(config, join(runtime, 'bridge.json'));
await chmod(join(runtime, 'bridge.json'), 0o600);
await mkdir(join(runtime, 'logs'), { recursive: true, mode: 0o700 });
const plist = join(directory, `${label}.plist`);
await writeFile(plist, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${label}</string>
<key>ProgramArguments</key><array><string>${escape(node)}</string><string>${escape(join(runtime, 'bridge.mjs'))}</string></array>
<key>WorkingDirectory</key><string>${escape(runtime)}</string>
<key>EnvironmentVariables</key><dict><key>HELD_CONFIG</key><string>${escape(join(runtime, 'bridge.json'))}</string></dict>
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/><key>ThrottleInterval</key><integer>10</integer>
<key>StandardOutPath</key><string>${escape(join(runtime, 'logs/bridge.log'))}</string>
<key>StandardErrorPath</key><string>${escape(join(runtime, 'logs/bridge-error.log'))}</string>
</dict></plist>`, { mode: 0o600 });
const domain = `gui/${process.getuid()}`;
try { execFileSync('launchctl', ['bootout', `${domain}/${label}`], { stdio: 'ignore' }); } catch { /* First installation. */ }
execFileSync('launchctl', ['bootstrap', domain, plist], { stdio: 'inherit' });
console.log(`Installed ${label}. It restarts after login and reconnects to ${new URL(parsed.url).host}.`);
