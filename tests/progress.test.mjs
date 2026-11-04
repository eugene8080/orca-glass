import test from 'node:test';
import assert from 'node:assert/strict';
import { progressSummary } from '../bridge/progress.mjs';

test('Claude progress is bounded public activity without arguments, output or reasoning', () => {
  assert.equal(progressSummary(['● Read(secret-file.txt)', '  private file content', '✻ Cooking… (2m 30s · tokens)'], 'claude'), 'Reading files');
  assert.equal(progressSummary(['● Bash(private command)', '  private output'], 'claude'), 'Running a command');
  assert.equal(progressSummary(['✻ Pondering… (2m)'], 'claude'), 'Pondering…');
  assert.equal(progressSummary(['private unmarked reasoning'], 'claude'), '');
  assert.equal(progressSummary(['● Read(secret)'], 'codex'), '');
});
