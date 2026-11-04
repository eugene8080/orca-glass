import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUsage, collectUsage } from '../bridge/usage.mjs';

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


test('usage retains Claude and Cursor windows and excludes account metadata', async () => {
  let fallbackCalls = 0;
  const usage = await collectUsage({
    codex: { provider: 'codex', status: 'ok', weekly: { usedPercent: 63, resetDescription: 'Thursday' } },
    claude: { provider: 'claude', status: 'ok', session: { usedPercent: 3, resetDescription: '9:50 AM' }, weekly: { usedPercent: 2, resetDescription: '1:00 PM' }, usageMetadata: { authProvenance: 'private' } },
    cursor: { provider: 'cursor', status: 'ok', monthly: { usedPercent: 2.02, resetDescription: 'Nov 5' }, planType: 'pro' },
  }, async () => { fallbackCalls++; });
  assert.equal(fallbackCalls, 0);
  assert.equal(usage.claude.session.usedPercent, 3);
  assert.equal(usage.claude.weekly.usedPercent, 2);
  assert.equal(usage.cursor.monthly.usedPercent, 2.02);
  assert.equal(usage.cursor.session, null);
  assert.equal(usage.claude.usageMetadata, undefined);
  assert.equal(usage.cursor.planType, undefined);
});

test('Codex fallback success or failure never removes other provider usage', async () => {
  const limits = { claude: { status: 'ok', session: { usedPercent: 4 } }, cursor: { status: 'ok', monthly: { usedPercent: 12 } } };
  const recovered = await collectUsage(limits, async () => ({ provider: 'codex', status: 'ok', weekly: { usedPercent: 60 } }));
  assert.equal(recovered.codex.weekly.usedPercent, 60);
  assert.equal(recovered.claude.session.usedPercent, 4);
  const failed = await collectUsage(limits, async () => { throw new Error('private auth/error body'); });
  assert.equal(failed.codex.status, 'error');
  assert.equal(failed.cursor.monthly.usedPercent, 12);
  assert.equal(failed.claude.status, 'ok');
  assert.ok(!JSON.stringify(failed).includes('private auth'));
});

test('provider reset instants survive sanitizing and computer labels use the bridge time zone', async () => {
  const resetsAt = Date.UTC(2026, 10, 5, 8, 12);
  const limits = Object.fromEntries(['codex', 'claude', 'cursor'].map(provider => [provider, {
    status: 'ok', weekly: { usedPercent: 42, resetsAt, resetDescription: 'Original label', privateAccount: 'hidden' },
  }]));
  const result = await collectUsage(limits);
  const expected = new Intl.DateTimeFormat('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true }).format(resetsAt).replace(',', '');
  for (const provider of Object.keys(limits)) {
    assert.equal(result[provider].weekly.resetsAt, resetsAt);
    assert.equal(result[provider].weekly.computerResetDescription, expected);
    assert.equal(result[provider].weekly.privateAccount, undefined);
  }
  const fallback = normalizeUsage({ rate_limit: { primary_window: { used_percent: 10, limit_window_seconds: 604800, reset_at: resetsAt / 1000 } } });
  assert.equal(fallback.weekly.resetsAt, resetsAt);
  const recovered = await collectUsage({}, async () => ({ ...fallback, account: 'hidden' }));
  assert.equal(recovered.codex.weekly.resetsAt, resetsAt);
  assert.equal(recovered.codex.account, undefined);
});
