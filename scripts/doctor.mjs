import { existsSync } from 'node:fs';
import { executable, orcaExecutable } from '../bridge/platform.mjs';
import { orca } from '../bridge/orca.mjs';

let failed = false;
function check(name, ok, detail) {
  console.log(`${ok ? 'OK' : 'FAIL'} ${name}: ${detail}`);
  if (!ok) failed = true;
}
check('Node', Number(process.versions.node.split('.')[0]) >= 20, process.version);
check('cloudflared', !!executable('cloudflared'), executable('cloudflared') || 'Install cloudflared and add it to PATH');
check('Web build', existsSync(new URL('../app/dist/index.html', import.meta.url)), 'npm --prefix app run build');
try {
  const { terminals } = await orca(['terminal', 'list']);
  check('Orca', true, `${orcaExecutable()} (${terminals.filter(t => t.agentIdentity === 'codex').length} Codex terminals)`);
} catch (error) {
  check('Orca', false, error.message);
}
console.log('This fork permits Codex sessions only. Claude testing is disabled.');
process.exitCode = failed ? 1 : 0;
