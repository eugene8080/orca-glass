import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUsage } from '../bridge/usage.mjs';

test('a weekly primary window is not incorrectly labelled as five-hour usage', () => {
  const usage = normalizeUsage({ rate_limit: { primary_window: {
    used_percent: 44, limit_window_seconds: 604800, reset_at: 3600,
  } } }, 0);
  assert.equal(usage.session, null);
  assert.equal(usage.weekly.usedPercent, 44);
  assert.equal(usage.weekly.resetDescription, 'resets in 1h');
});

test('both rate limit windows are mapped by duration regardless of order', () => {
  const usage = normalizeUsage({ rate_limit: {
    primary_window: { used_percent: 60, limit_window_seconds: 604800, reset_at: 172800 },
    secondary_window: { used_percent: 20, limit_window_seconds: 18000, reset_at: 3600 },
  } }, 0);
  assert.equal(usage.weekly.usedPercent, 60);
  assert.equal(usage.session.usedPercent, 20);
  assert.equal(usage.weekly.resetDescription, 'resets in 2d 0h');
  assert.throws(() => normalizeUsage({}), /no supported usage windows/);
});
