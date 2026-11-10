import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { aiRouteFile } from './platform.mjs';

try {
  const routeFile = aiRouteFile();
  if (!routeFile) throw new Error('Windows routing configuration is unavailable');
  const route = JSON.parse(await readFile(routeFile, 'utf8'));
  const probe = await fetch('https://api.ipify.org', { signal: AbortSignal.timeout(15000) });
  if (!probe.ok || (await probe.text()).trim() !== route.expectedExitIp) {
    throw new Error('Selected proxy egress verification failed');
  }
  // Reuse the local Codex login only for its own first-party usage endpoint.
  // Never return credentials, identifiers, or an HTML error body to the bridge.
  const auth = JSON.parse(await readFile(join(process.env.CODEX_HOME || join(homedir(), '.codex'), 'auth.json'), 'utf8'));
  if (!auth.tokens?.access_token || !auth.tokens?.account_id) throw new Error('Codex ChatGPT login is unavailable');
  const response = await fetch('https://chatgpt.com/backend-api/wham/usage', {
    headers: { authorization: `Bearer ${auth.tokens.access_token}`, 'ChatGPT-Account-Id': auth.tokens.account_id },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Codex usage returned HTTP ${response.status}`);
  const data = await response.json();
  process.stdout.write(JSON.stringify({ rate_limit: data.rate_limit }));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
