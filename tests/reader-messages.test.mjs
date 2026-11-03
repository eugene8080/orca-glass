import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMessages, terminalConversation } from '../bridge/reader-text.mjs';

test('compact role markers hang-indent continuation lines without blank rows between turns', () => {
  assert.equal(formatMessages([{ role: 'user', text: 'Question\ncontinued' }, { role: 'assistant', text: 'Answer\ncontinued' }]),
    '/ Question\n  continued\n> Answer\n  continued');
});

test('Codex screen keeps user/reply turns but omits tool blocks, thinking and empty input prompt', () => {
  const text = terminalConversation(['› My question', '  continued', '• Ran a command', '  private tool output', '• Thinking about tools',
    '  internal continuation', '• Public reply', '  More reply', '└ command output', '  hidden', '› '], 'codex');
  assert.equal(text, '/ My question\n  continued\n> Public reply\n  More reply');
});

test('synthetic Claude tool blocks and unsupported formats never expose raw tool output', () => {
  assert.equal(terminalConversation(['❯ Question', '⏺ Bash(secret)', '  output', '⏺ Answer', '✻ Thinking'], 'claude'), '/ Question\n> Answer');
  assert.equal(terminalConversation(['unrecognized tool output'], 'unknown'), '');
});
