import test from 'node:test';
import assert from 'node:assert/strict';
import { sessionTitles, sessionTitle } from '../bridge/session-titles.mjs';

test('idle program titles do not replace named tabs, including nested groups', () => {
  const names = sessionTitles([{ worktreeId: 'workspace', root: { children: [
    { tabs: [{ tabId: 'tab', title: 'orca-glass beta' }] },
  ] } }]);
  const terminal = { worktreeId: 'workspace', tabId: 'tab', title: 'Codex ready' };
  assert.equal(sessionTitle(terminal, names), 'orca-glass beta');
  assert.equal(sessionTitle({ ...terminal, paneTitle: 'Named split pane' }, names), 'Named split pane');
  assert.equal(sessionTitle({ ...terminal, worktreeId: 'other' }, names), 'Codex ready');
});

test('generated worker tab names retain descriptive program titles', () => {
  const names = sessionTitles([{ worktreeId: 'workspace', root: {
    tabs: [{ tabId: 'worker', title: 'worker-task_123' }],
  } }]);
  assert.equal(sessionTitle({ worktreeId: 'workspace', tabId: 'worker', title: 'OC | Diagnostic sampler' }, names), 'OC | Diagnostic sampler');
  assert.equal(sessionTitle({ title: '⠧ Active session' }, names), 'Active session');
});
