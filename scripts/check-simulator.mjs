import fs from 'node:fs/promises';
// Run against a freshly opened simulator at its home list, using the isolated
// fixture only. This never connects to a real agent or bridge.
const base = `http://127.0.0.1:${process.env.ORCA_GLASS_SIMULATOR_PORT || '9899'}`;
const wait = ms => new Promise(r => setTimeout(r, ms));
const input = async action => {
  const response = await fetch(base + '/api/input', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action }) });
  if (!response.ok) throw new Error(await response.text());
  await wait(250);
};
const fixture = async data => {
  const response = await fetch('http://127.0.0.1:8791/__fixture', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
  return response.json();
};
const snap = async name => {
  const response = await fetch(base + '/api/screenshot/glasses');
  if (!response.ok) throw new Error(await response.text());
  await fs.writeFile(`.local/${name}.png`, Buffer.from(await response.arrayBuffer()));
};
const initial = await fixture({ state: 'waiting', source: 'codex-transcript', text: Array.from({ length: 35 }, (_, i) => `Chat line ${i + 1}: preserve native scroll position.`).join('\n'), transcript: 'This is the draft to review in the bottom panel.' });
for (let i = 0; i < 4; i++) await input('down');
await input('click');
await wait(800);
await snap('beta105-waiting');
await fixture({ state: 'working' });
await wait(1800);
await snap('beta105-working');
for (let i = 0; i < 3; i++) await input('down');
await snap('beta105-before-record');
const before = await (await fetch(base + '/api/console')).json();
const beforeId = Math.max(...before.entries.map(e => e.id));
await input('long_press'); await wait(400); await input('long_press_release'); await wait(400);
await snap('beta105-review');
await input('double_click'); await wait(400);
await snap('beta105-cancel');
await input('long_press'); await wait(400); await input('long_press_release'); await wait(400);
await input('click'); await wait(400);
await snap('beta105-send');
const log = await (await fetch(base + `/api/console?since_id=${beforeId + 1}`)).json();
const methods = log.entries.filter(e => e.message.startsWith('Native call ')).map(e => JSON.parse(e.message.slice(12)));
if (methods.some(m => ['rebuildPageContainer', 'createStartUpPageContainer'].includes(m.method))) throw new Error('Voice flow rebuilt the chat');
if (methods.some(m => m.method === 'textContainerUpgrade' && m.data.containerName === 'body')) throw new Error('Voice flow rewrote the chat');
const state = await fixture({});
if (state.sends.length !== initial.sends.length + 1 || state.sends.at(-1).text !== 'This is the draft to review in the bottom panel.') throw new Error('Draft send count/content differs');
await fs.writeFile('.local/beta105-native-voice-log.json', JSON.stringify(log, null, 2));
await fixture({ text: 'NEW REPLY: live output still updates after Send.', state: 'waiting', source: 'terminal-buffer' });
await wait(1800); await snap('beta105-live-reply');
console.log('Native SDK checks passed: no page rebuild/body write in capture/review/cancel/send; one complete fake send.');
