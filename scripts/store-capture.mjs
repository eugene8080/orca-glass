// Capture the official simulator framebuffer. Run only against the store fixture.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const [name, ...actions] = process.argv.slice(2);
const allowed = new Set(['up', 'down', 'click', 'double_click', 'long_press', 'long_press_release', 'context_menu']);
if (!name || !/^[a-z0-9-]+$/.test(name) || actions.some(action => !allowed.has(action))) {
  throw new Error('Usage: node scripts/store-capture.mjs <lowercase-name> [documented simulator actions...]');
}
const base = 'http://127.0.0.1:9899';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
for (const action of actions) {
  const response = await fetch(`${base}/api/input`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action }),
  });
  if (!response.ok) throw new Error(`Simulator input failed: ${response.status} ${await response.text()}`);
  await delay(action === 'long_press' ? 600 : 350);
}
await delay(500);
const response = await fetch(`${base}/api/screenshot/glasses`);
if (!response.ok) throw new Error(`Simulator capture failed: ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || bytes.readUInt32BE(16) !== 576 || bytes.readUInt32BE(20) !== 288) {
  throw new Error('Expected a native 576x288 PNG framebuffer.');
}
const directory = new URL('../store/screenshots/native/', import.meta.url);
await mkdir(directory, { recursive: true });
const output = new URL(`${name}.png`, directory);
await writeFile(output, bytes);
console.log(fileURLToPath(output));
