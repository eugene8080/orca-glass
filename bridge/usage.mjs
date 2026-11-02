import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isIP } from 'node:net';

const run = promisify(execFile);
let cached;
let pending;

export function normalizeUsage(data, now = Date.now()) {
  const windows = [data.rate_limit?.primary_window, data.rate_limit?.secondary_window].filter(Boolean);
  const window = seconds => {
    const value = windows.find(w => w.limit_window_seconds === seconds);
    if (!value || !Number.isFinite(value.used_percent) || !Number.isFinite(value.reset_at)) return null;
    const hours = Math.max(0, Math.ceil((value.reset_at * 1000 - now) / 3600000));
    return { usedPercent: value.used_percent, resetDescription: hours >= 24
      ? `resets in ${Math.floor(hours / 24)}d ${hours % 24}h` : `resets in ${hours}h` };
  };
  const session = window(18000), weekly = window(604800);
  if (!session && !weekly) throw new Error('Codex returned no supported usage windows');
  return { provider: 'codex', status: 'ok', session, weekly, source: 'selected-proxy' };
}

export async function proxyUsage() {
  if (cached && Date.now() - cached.time < 60000) return cached.value;
  if (pending) return pending;
  pending = (async () => {
    const root = process.env.LOCALAPPDATA;
    if (!root) throw new Error('Windows routing configuration is unavailable');
    const route = JSON.parse(await readFile(join(root, 'PcSettings/AiRouting/route.json'), 'utf8'));
    const proxy = new URL(route.proxyUrl);
    if (proxy.protocol !== 'http:' || proxy.username || proxy.password ||
        !['127.0.0.1', 'localhost', '[::1]', '100.73.110.10'].includes(proxy.hostname) || !isIP(route.expectedExitIp)) {
      throw new Error('Selected proxy route is invalid');
    }
    // Proxy settings apply to this read-only subprocess, not Orca or other apps.
    const env = { ...process.env };
    for (const key of ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy']) env[key] = route.proxyUrl;
    env.NO_PROXY = env.no_proxy = 'localhost,127.0.0.1,::1';
    const { stdout } = await run(process.execPath,
      ['--use-env-proxy', fileURLToPath(new URL('./usage-worker.mjs', import.meta.url))],
      { env, windowsHide: true, timeout: 45000, maxBuffer: 65536 });
    const value = normalizeUsage(JSON.parse(stdout));
    cached = { time: Date.now(), value };
    return value;
  })();
  try { return await pending; } finally { pending = null; }
}
