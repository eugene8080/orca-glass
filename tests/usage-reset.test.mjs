import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from '../app/node_modules/typescript/lib/typescript.js';

const i18n = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/i18n.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: i18n });
const reset = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/usage-reset.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: reset, require: () => i18n });

test('one reset instant displays different computer and phone calendar days', () => {
  const limit = { usedPercent: 42, resetDescription: 'old', resetsAt: Date.UTC(2026, 10, 4, 17, 12),
    computerResetDescription: 'Thu 1:12 AM' };
  assert.equal(reset.formatReset(limit, 'computer'), 'Thu 1:12 AM');
  assert.equal(reset.formatReset(limit, 'phone', 0, 'UTC'), 'Wed 5:12 PM');
  assert.equal(reset.formatReset(limit, 'phone', 0, 'Asia/Hong_Kong'), 'Thu 1:12 AM');
});

test('absolute mode is exact remaining duration, rounded to minutes and clamped at zero', () => {
  const now = Date.UTC(2026, 10, 4);
  const duration = (2 * 1440 + 5 * 60 + 12) * 60000;
  assert.equal(reset.formatReset({ resetsAt: now + duration }, 'absolute', now), '2d5h12m');
  assert.equal(reset.formatReset({ resetsAt: now + duration }, 'absolute', now + 60000), '2d5h11m');
  assert.equal(reset.formatReset({ resetsAt: now + 1000 }, 'absolute', now), '1m');
  assert.equal(reset.formatReset({ resetsAt: now - 1000 }, 'absolute', now), '0m');
});

test('missing or invalid timestamps are never guessed from a reset label', () => {
  for (const resetsAt of [undefined, null, NaN, Infinity, -1, 9e15]) {
    const limit = { resetsAt, resetDescription: 'Thursday' };
    assert.equal(reset.formatReset(limit, 'computer'), 'Thursday');
    assert.equal(reset.formatReset(limit, 'phone'), 'Reset time unavailable');
    assert.equal(reset.formatReset(limit, 'absolute'), 'Reset time unavailable');
  }
});
