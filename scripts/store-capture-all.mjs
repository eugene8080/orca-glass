// Drive the store fixture through scripted simulator gestures and capture every
// glasses screenshot. Requires scripts/store-preview.mjs on 8792 and the official
// evenhub-simulator on 9899 (or ORCA_GLASS_SIMULATOR_PORT) started on
// http://127.0.0.1:8792/?code=demo&lang=en, with the session list showing.
// Never double-click twice in a row from the list: it exits the app and the
// simulator then captures an empty (fully transparent) frame. Each step below
// returns to the session list with exactly one double-click.
// Japanese (13-japanese) needs the simulator restarted with &lang=ja; capture it
// separately with: node scripts/store-capture.mjs 13-japanese
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const port = process.env.ORCA_GLASS_SIMULATOR_PORT || '9899';
const base = `http://127.0.0.1:${port}`;
const wait = ms => new Promise(r => setTimeout(r, ms));
const run = (name, ...actions) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, ['scripts/store-capture.mjs', name, ...actions], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    env: { ...process.env, ORCA_GLASS_SIMULATOR_PORT: port },
    stdio: 'inherit',
  });
  child.on('exit', code => (code === 0 ? resolve() : reject(new Error(`${name} failed (${code})`))));
});
const gesture = async (...actions) => {
  for (const action of actions) {
    const response = await fetch(`${base}/api/input`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action }),
    });
    if (!response.ok) throw new Error(`${action}: ${await response.text()}`);
    await wait(action === 'long_press' ? 600 : action === 'context_menu' ? 700 : 350);
  }
};
const downs = async n => { for (let i = 0; i < n; i++) await gesture('down'); };
const ups = async n => { for (let i = 0; i < n; i++) await gesture('up'); };
// A native frame is fully transparent when the app has exited: stop instead of saving it.
const requireLive = async () => {
  const response = await fetch(`${base}/api/screenshot/glasses`);
  if (!response.ok) throw new Error(`Simulator not ready on ${port}`);
};
await requireLive();

// Rows: 0 Filter by Agent, 1 Filter by Workspace, 2.. sessions (a12c34, b56d78, c90e12, d34f56, e78a90, f12g34, g56h78).
await run('1-threads');

// d34f56 (Codex, Markdown table): Terminus small text. Reader menu: Using, Native, 7x14, 7x11, Misc, Shinonome, Terminus, Gohu, Scientifica, Compare.
await downs(5); await gesture('click'); await wait(900);
await gesture('context_menu'); await downs(6); await gesture('click'); await wait(900);
await run('10-small-text');
await gesture('context_menu'); await downs(9); await gesture('click'); await wait(900);
await run('11-compare-fonts');
await gesture('up'); await wait(600);              // back to the reader
await gesture('context_menu'); await downs(1); await gesture('click'); await wait(900); // Native text again
await gesture('double_click'); await wait(900);    // back to the list

// f12g34 (OpenClaude, native text) and voice review.
await downs(7); await gesture('click'); await wait(900);
await run('2-answer');
await gesture('long_press'); await wait(400); await gesture('long_press_release'); await wait(2000);
await run('3-reply');
await gesture('double_click'); await wait(700);    // cancel the draft
await gesture('double_click'); await wait(900);    // back to the list

// c90e12 (Claude, numbered choices), last page.
await downs(4); await gesture('click'); await wait(900); await gesture('down'); await wait(700);
await run('12-choices');
await gesture('double_click'); await wait(900);

// Usage: contextual menu, third item.
await gesture('context_menu'); await downs(2); await gesture('click'); await wait(900);
await run('4-usage');
await gesture('double_click'); await wait(900);

// Filter by Agent, then Hermes Agent (row above All Orca Sessions), then Hermes lists.
await gesture('click'); await wait(900);
await run('7-agent-filter');
await ups(1); await gesture('click'); await wait(900);
await run('9-hermes-sessions');
await downs(1); await gesture('click'); await wait(900);
await run('8-hermes-workspaces');
await gesture('double_click'); await wait(900);
// Reset the agent filter to All Orca Sessions.
await gesture('click'); await wait(700); await gesture('down'); await gesture('click'); await wait(900);
// Orca workspace filter.
await downs(1); await gesture('click'); await wait(900);
await run('5-workspaces');
await gesture('double_click'); await wait(900);

console.log('Native captures written under store/screenshots/native/. Now run: python scripts/store-previews.py');
