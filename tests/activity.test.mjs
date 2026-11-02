import test from 'node:test';
import assert from 'node:assert/strict';
import { activityState } from '../bridge/activity.mjs';

test('activity reports observed working/waiting and never guesses missing state', () => {
  assert.equal(activityState({ state: 'working' }), 'working');
  assert.equal(activityState({ state: 'done' }), 'waiting');
  assert.equal(activityState({ state: 'working', mainAgent: { state: 'done' } }), 'waiting');
  assert.equal(activityState({ state: 'blocked' }), 'attention');
  assert.equal(activityState(null), 'unknown');
});
