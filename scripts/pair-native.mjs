import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Keep credentials in an ignored local file, never in console output or Git.
const require = createRequire(new URL('../app/package.json', import.meta.url));
const qr = require('qr-image');
const config = JSON.parse(readFileSync(join(homedir(), '.even-terminal', 'config.json'), 'utf8'));
if (config.provider !== 'codex' || config.network.mode !== 'tailscale') {
  throw new Error('This pairing helper requires a Codex / Tailscale native host configuration');
}
const ip = execFileSync('tailscale', ['ip', '-4'], { encoding: 'utf8', windowsHide: true }).trim().split(/\r?\n/)[0];
if (!/^100\.\d+\.\d+\.\d+$/.test(ip)) throw new Error('Tailscale IPv4 address unavailable');
const params = new URLSearchParams({ token: config.token, defaultProvider: 'codex', name: config.name || 'Windows Codex' });
const url = `http://${ip}:${config.port}?${params}`;
const png = qr.imageSync(url, { type: 'png', size: 8, margin: 4 });
const dir = fileURLToPath(new URL('../.local/', import.meta.url));
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'native-pairing.png'), png);
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pair G2 with Windows Codex</title>
<style>body{font:18px/1.5 system-ui;max-width:760px;margin:40px auto;padding:20px;background:#f6f7f8;color:#162432}img{display:block;width:min(100%,500px);height:auto}code{background:#e5e9ed;padding:3px}h1{font-size:28px}</style>
<h1>Pair G2 with Windows Codex</h1><p>Keep Tailscale connected on your Android phone.</p>
<ol><li>Open Even Realities → Settings → Features → Terminal.</li><li>Open Terminal from Home, then Host setup.</li><li>Set Default agent to <b>Codex</b>.</li><li>Tap the scanner at the top right and scan this QR.</li><li>Tap Probe, then Save. Open a Codex session.</li></ol>
<img alt="Private pairing QR for your Windows Codex host" src="data:image/png;base64,${png.toString('base64')}">
<p>Host: <code>${ip}:${config.port}</code>. This QR contains your pairing token. Keep this page private.</p>
<p>No Developer Mode or marketplace installation is needed. The PC must remain on.</p>
<p>For a shared desktop/glasses session, run <code>even-terminal codex</code> in the desired project directory. Existing ordinary Orca terminals are not automatically attached.</p>
<p>Generated: ${new Date().toISOString().slice(0, 10)}</p></html>`;
writeFileSync(join(dir, 'native-pairing.html'), html);
console.log(`Private pairing page: ${resolve(dir, 'native-pairing.html')}`);
