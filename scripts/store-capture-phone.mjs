// Screenshot the phone companion preview (not the G2 framebuffer). Starts
// scripts/phone-preview.mjs briefly if port8796 is closed.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PHONE_PREVIEW_PORT || 8796);
const url = `http://127.0.0.1:${port}/?code=demo&lang=en`;
const out = fileURLToPath(new URL('../store/screenshots/phone-companion.png', import.meta.url));
const root = fileURLToPath(new URL('..', import.meta.url));

const up = async () => {
  try {
    const response = await fetch(url, { redirect: 'manual' });
    return response.ok || response.status === 304;
  } catch { return false; }
};

let child;
if (!(await up())) {
  child = spawn(process.execPath, ['scripts/phone-preview.mjs'], { cwd: root, stdio: 'ignore', detached: true });
  child.unref();
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 250));
    if (await up()) break;
  }
  if (!(await up())) throw new Error('Phone preview did not start');
}

await new Promise((resolve, reject) => {
  const cmd = `npx --yes playwright screenshot --viewport-size 420,900 "${url}" "${out}"`;
  const runner = spawn(cmd, { cwd: root, shell: true, stdio: 'inherit' });
  runner.on('exit', code => (code === 0 ? resolve() : reject(new Error(`playwright exit ${code}`))));
});
console.log(out);
if (child) spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { shell: true, stdio: 'ignore' });
