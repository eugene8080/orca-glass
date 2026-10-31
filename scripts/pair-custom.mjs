import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const require = createRequire(new URL('../app/package.json', import.meta.url));
const qr = require('qr-image');
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8').trim();
const base = read('../tunnel/current-url');
if (!/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(base)) throw new Error('No valid custom tunnel URL');
const token = read('../bridge/.token');
const topic = read('../bridge/.topic');
const response = await fetch(`${base}/api/capabilities`, {
  headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20000),
});
if (!response.ok) throw new Error(`Bridge check failed: HTTP ${response.status}`);
const code = `eho1.${topic}.${token}`;
const url = new URL(base);
url.searchParams.set('code', code);
url.searchParams.set('lang', 'en');
const png = qr.imageSync(url.href, { type: 'png', size: 7, margin: 4 });
const dir = fileURLToPath(new URL('../.local/', import.meta.url));
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'custom-pairing.png'), png);
writeFileSync(join(dir, 'custom-pairing.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><title>Orca Glass test pairing</title>
<style>body{font:18px/1.5 system-ui;max-width:760px;margin:36px auto;padding:20px}img{width:min(100%,640px)}li{margin:12px 0}</style>
<h1>Orca Glass — Windows test</h1>
<ol><li>In Even Realities on Android, open <b>Even Hub</b> and its <b>Developer / Prototype Mode → Scan QR</b> entry.</li>
<li>Scan this QR. This opens the custom app; pairing and English are filled in automatically.</li>
<li>Allow microphone access if prompted. First check that your Codex terminals appear. Select one and read its response.</li>
<li>Tap to record a sentence; tap again to stop. Review the transcript. Double-tap to cancel, or tap to send.</li></ol>
<img alt="Private QR for the custom Orca Glass app" src="data:image/png;base64,${png.toString('base64')}">
<p>Use the Even Hub scanner, not the native Terminal host scanner. If Developer / Prototype Mode is missing, sign in at <a href="https://hub.evenrealities.com/login">Even Hub</a> with the same account as your Android app, then reopen the app.</p>
<p>This QR contains your private pairing credential. Keep it private. Generated: ${new Date().toISOString()}.</p></html>`);
console.log(`Private pairing page: ${join(dir, 'custom-pairing.html')}`);
