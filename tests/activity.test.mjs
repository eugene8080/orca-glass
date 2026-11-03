import test from 'node:test';
import assert from 'node:assert/strict';
import { activityState, reportedElapsed } from '../bridge/activity.mjs';

test('activity reports observed working/waiting and never guesses missing state', () => {
  assert.equal(activityState({ state: 'working' }), 'working');
  assert.equal(activityState({ state: 'done' }), 'waiting');
  assert.equal(activityState({ state: 'working', mainAgent: { state: 'done' } }), 'waiting');
  assert.equal(activityState({ state: 'blocked' }), 'attention');
  assert.equal(activityState(null), 'unknown');
});

test('elapsed duration comes only from the provider status line', () => {
  assert.equal(reportedElapsed(['• Working (13m 32s • esc to interrupt)'], 'codex'), 812);
  assert.equal(reportedElapsed(['• Working (1h 2m 3s • esc to interrupt)'], 'codex'), 3723);
  assert.equal(reportedElapsed(['› Please show 13m 32s', '• Waiting for input'], 'codex'), null);
  assert.equal(reportedElapsed(['• Working (13m 32s • esc to interrupt)'], 'opencode'), null);
  assert.equal(reportedElapsed([], 'codex'), null);
});
