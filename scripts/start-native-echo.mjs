import { mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createEchoServer } from '../bridge/native-echo.mjs';

const dir = fileURLToPath(new URL('../.local/', import.meta.url));
mkdirSync(dir, { recursive: true });
const file = join(dir, 'native-echo-token');
try { writeFileSync(file, randomBytes(24).toString('base64url'), { flag: 'wx', mode: 0o600 }); }
catch (e) { if (e.code !== 'EEXIST') throw e; }
const token = readFileSync(file, 'utf8').trim();
const host = execFileSync('tailscale', ['ip', '-4'], { encoding: 'utf8', windowsHide: true }).trim().split(/\r?\n/)[0];
if (!/^100\.\d+\.\d+\.\d+$/.test(host)) throw new Error('No Tailscale IPv4 address');
const port = 8788;
const endpoint = `http://${host}:${port}/v1/chat/completions`;
const codexMode = process.argv.includes('--codex');
let respond = null;
if (codexMode) {
  const orca = await import('../bridge/orca.mjs');
  const { createNativeRouter } = await import('../bridge/native-router.mjs');
  const targetFile = join(dir, 'native-codex-target.json');
  respond = createNativeRouter({
    listThreads: orca.listThreads, readThread: orca.readThread, sendToThread: orca.sendToThread,
    inspect: async handle => (await orca.orca(['terminal', 'show', '--terminal', handle])).terminal,
    loadTarget: () => { try { return JSON.parse(readFileSync(targetFile, 'utf8')); } catch { return null; } },
    saveTarget: target => writeFileSync(targetFile, JSON.stringify(target), { mode: 0o600 }),
  });
}
writeFileSync(join(dir, 'native-echo-settings.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><title>Even AI native voice test</title>
<style>body{font:18px/1.5 system-ui;max-width:800px;margin:40px auto;padding:20px}input{width:100%;font:16px monospace;padding:10px;box-sizing:border-box}label{display:block;margin-top:20px}</style>
<h1>Even AI — ${codexMode ? 'Orca Codex' : 'native voice test'}</h1><p>${codexMode ? 'Say list sessions, then select session and its number. Ordinary sentences then go to that existing Codex terminal. Claude is excluded.' : 'This endpoint only repeats your words. It cannot send input to Codex or Claude.'}</p>
<p>Keep Tailscale connected on Android. Open Even Realities → Settings → Even AI → Agent Configuration → Add Agent.</p>
<label>Name</label><input readonly value="Orca voice test">
<label>Endpoint / URL</label><input readonly value="${endpoint}">
<label>Token / API key (private)</label><input readonly value="${token}">
<p>Save and activate this agent. ${codexMode ? 'Use native Even AI. Say list sessions to begin; read latest retrieves the selected terminal output, and read more continues a long reply.' : 'Hold and say “This is a native voice test,” then release. Expected reply: “Voice test received…”'}</p>
<p>Generated: ${new Date().toISOString()}. This file contains a private credential.</p></html>`);
const server = createEchoServer(token, metadata => appendFileSync(join(dir, 'native-echo-events.jsonl'), JSON.stringify(metadata) + '\n'), respond);
server.requestTimeout = 15000;
server.on('error', error => { console.error(error.message); process.exit(1); });
server.listen(port, host, () => console.log(`Native ${codexMode ? 'Codex router' : 'echo-only'} endpoint ready at ${endpoint}`));
