import test from 'node:test';
import assert from 'node:assert/strict';
import { workspaceLabels } from '../bridge/workspace-label.mjs';

test('session labels use project names while workspace picker disambiguates child worktrees', () => {
  assert.deepEqual(workspaceLabels({ repo: 'porttracker', path: 'D:/dev/porttracker', displayName: 'main', isMainWorktree: true }), { name: 'porttracker', label: 'porttracker' });
  assert.deepEqual(workspaceLabels({ repo: 'orca-glass', path: 'C:/workspaces/orca-glass/filter', displayName: 'workspace-filter', isMainWorktree: false }), { name: 'orca-glass', label: 'orca-glass / workspace-filter' });
});

test('missing metadata and Windows separators retain safe nonempty workspace labels', () => {
  assert.deepEqual(workspaceLabels({ path: 'D:\\dev\\example', isMainWorktree: true }), { name: 'example', label: 'example' });
  assert.equal(workspaceLabels(undefined).name, 'Workspace');
});
