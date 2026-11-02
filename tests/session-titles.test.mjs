import test from 'node:test';
import assert from 'node:assert/strict';
import { sessionTitles, sessionTitle } from '../bridge/session-titles.mjs';

test('recorded conversation name survives both tab and program resetting to Codex ready', () => {
  const names = sessionTitles([{ worktreeId: 'workspace', root: {
    tabs: [{ tabId: 'tab', title: 'Codex ready' }],
  } }], [{ worktreeId: 'workspace', agents: [
    { paneKey: 'tab:leaf', conversationName: 'orca-glass beta' },
  ] }]);
  const terminal = { worktreeId: 'workspace', tabId: 'tab', leafId: 'leaf', title: 'Codex ready' };
  assert.equal(sessionTitle(terminal, names), 'orca-glass beta');
  assert.equal(sessionTitle({ ...terminal, leafId: 'different-pane' }, names), 'Codex ready');
  assert.equal(sessionTitle({ ...terminal, worktreeId: 'different-workspace' }, names), 'Codex ready');
});

test('idle metadata gaps retain the last name only for the same running pane', () => {
  const terminal = { worktreeId: 'cached-workspace', tabId: 'tab', leafId: 'leaf', incarnationId: 'run1', title: 'orca-glass beta' };
  assert.equal(sessionTitle(terminal, new Map()), 'orca-glass beta');
  const idle = { ...terminal, title: 'Codex ready' };
  assert.equal(sessionTitle(idle, new Map()), 'orca-glass beta');
  assert.equal(sessionTitle({ ...idle, incarnationId: 'run2' }, new Map()), 'Codex ready');
  assert.equal(sessionTitle({ ...terminal, title: 'Renamed conversation' }, new Map()), 'Renamed conversation');
  assert.equal(sessionTitle(idle, new Map()), 'Renamed conversation');
});

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
