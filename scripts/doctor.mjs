import { existsSync } from 'node:fs';
import { platform } from 'node:os';
import { executable, orcaExecutable } from '../bridge/platform.mjs';
import { orca } from '../bridge/orca.mjs';
import { MODEL, voiceAvailable } from '../bridge/whisper.mjs';

let failed = false;
function check(name, ok, detail) {
  console.log(`${ok ? 'OK' : 'FAIL'} ${name}: ${detail}`);
  if (!ok) failed = true;
}
check('Node', Number(process.versions.node.split('.')[0]) >= 20, process.version);
check('cloudflared', !!executable('cloudflared'), executable('cloudflared') || 'Install cloudflared and add it to PATH');
check('Web build', existsSync(new URL('../app/dist/index.html', import.meta.url)), 'npm --prefix app run build');
const voiceHint = platform() === 'darwin'
  ? 'Run scripts/setup-voice.sh or brew install whisper-cpp'
  : 'Run scripts/setup-voice.ps1';
check('Voice engine', voiceAvailable(), voiceAvailable() ? MODEL : voiceHint);
try {
  const { terminals } = await orca(['terminal', 'list']);
  check('Orca', true, `${orcaExecutable()} (${terminals.filter(t => t.agentIdentity === 'codex').length} Codex terminals)`);
} catch (error) {
  check('Orca', false, error.message);
}
console.log('Existing connected terminals are available across providers. New sessions remain Codex-only. Claude testing is disabled.');
process.exitCode = failed ? 1 : 0;
