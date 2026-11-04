import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isIP } from 'node:net';

const run = promisify(execFile);
let cached;
let pending;

function resetFields(resetsAt, description = '') {
  const valid = Number.isFinite(resetsAt) && resetsAt >= 0 && resetsAt <= 8.64e15;
  return {
    resetsAt: valid ? resetsAt : null,
    // Format on the bridge, which uses the computer's local time zone. The
    // original epoch is retained for the phone and remaining-duration modes.
    computerResetDescription: valid ? new Intl.DateTimeFormat('en-US', {
      weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
    }).format(resetsAt).replace(',', '') : description,
  };
}

export function normalizeUsage(data, now = Date.now()) {
  const windows = [data.rate_limit?.primary_window, data.rate_limit?.secondary_window].filter(Boolean);
  const window = seconds => {
    const value = windows.find(w => w.limit_window_seconds === seconds);
    if (!value || !Number.isFinite(value.used_percent) || !Number.isFinite(value.reset_at)) return null;
    const hours = Math.max(0, Math.ceil((value.reset_at * 1000 - now) / 3600000));
    return { usedPercent: value.used_percent, ...resetFields(value.reset_at * 1000), resetDescription: hours >= 24
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


// Expose usage windows, not Orca account/auth metadata or raw provider errors.
// A failed Codex fallback must not discard the other providers' successful data.
export async function collectUsage(rateLimits = {}, codexFallback = proxyUsage) {
  const output = {};
  const window = value => value && Number.isFinite(value.usedPercent) && value.usedPercent >= 0
    ? { usedPercent: value.usedPercent, resetDescription: typeof value.resetDescription === 'string' ? value.resetDescription : '',
      ...resetFields(value.resetsAt, typeof value.resetDescription === 'string' ? value.resetDescription : '') }
    : null;
  for (const provider of ['codex', 'claude', 'cursor']) {
    const value = rateLimits?.[provider];
    output[provider] = {
      provider, status: value?.status === 'ok' ? 'ok' : 'unavailable',
      session: window(value?.session), weekly: window(value?.weekly), monthly: window(value?.monthly),
    };
  }
  if (output.codex.status !== 'ok') {
    try {
      const value = await codexFallback();
      output.codex = { provider: 'codex', status: value?.status === 'ok' ? 'ok' : 'unavailable',
        session: window(value?.session), weekly: window(value?.weekly), monthly: window(value?.monthly) };
    }
    catch { output.codex = { provider: 'codex', status: 'error', error: 'Codex usage unavailable through the selected proxy. Check routing and Codex login.' }; }
  }
  return output;
}
