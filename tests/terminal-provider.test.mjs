import test from 'node:test';
import assert from 'node:assert/strict';
import { terminalProvider } from '../bridge/terminal-provider.mjs';

test('plain shells are excluded without limiting the agent provider list', () => {
  assert.equal(terminalProvider({ title: 'C:\\Windows\\system32\\cmd.exe' }), null);
  assert.equal(terminalProvider({ agentIdentity: 'pwsh' }), null);
  for (const provider of ['codex', 'claude', 'pi', 'cursor', 'opencode', 'new-provider']) {
    assert.equal(terminalProvider({ agentIdentity: provider }), provider);
  }
  assert.equal(terminalProvider({}, { agentType: 'opencode' }), 'opencode');
  assert.equal(terminalProvider({ title: 'cmd.exe', agentIdentity: 'codex' }), 'codex');
});
