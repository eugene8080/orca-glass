import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMessages, terminalConversation, stripTerminalChrome } from '../bridge/reader-text.mjs';

test('compact role markers hang-indent continuation lines without blank rows between turns', () => {
  assert.equal(formatMessages([{ role: 'user', text: 'Question\ncontinued' }, { role: 'assistant', text: 'Answer\ncontinued' }]),
    '/ Question\n  continued\n> Answer\n  continued');
});


test('long conversation paragraphs use native width without character-count line breaks', () => {
  const paragraph = 'A continuous response should use the full native reader width instead of stopping after a fixed number of narrow or wide characters.';
  assert.equal(formatMessages([{ role: 'assistant', text: paragraph }]), '> ' + paragraph);
  const code = 'const message = "keep explicit code and paragraph breaks";\nreturn message;';
  assert.equal(formatMessages([{ role: 'assistant', text: code }]), '> const message = "keep explicit code and paragraph breaks";\n  return message;');
});

test('Codex composer/model/path/shortcut chrome does not become a user turn', () => {
  assert.equal(terminalConversation(['› Real question', '• Real answer', '› Ask Codex to do anything',
    '  GPT-6.1-Sol low · D:\\dev\\orca-glass · orca-glass beta', '  ← for agents · ? for shortcuts'], 'codex'), '/ Real question\n> Real answer');
});

test('synthetic Claude and other harness footers are stripped without live harness access', () => {
  assert.equal(terminalConversation(['❯ Question', '⏺ Answer', '❯ ', '  ⏵⏵ accept edits on (shift+tab to cycle)', '  ? for shortcuts'], 'claude'), '/ Question\n> Answer');
  assert.deepEqual(stripTerminalChrome(['Visible reply', '> Type your message', '~/work · model', '? for shortcuts']), ['Visible reply']);
  assert.equal(terminalConversation(['› Explain the phrase Ask Codex to do anything', '• The footer shows GPT-6.1-Sol and ? for shortcuts.'], 'codex'), '/ Explain the phrase Ask Codex to do anything\n> The footer shows GPT-6.1-Sol and ? for shortcuts.');
});

test('Codex screen keeps user/reply turns but omits tool blocks, thinking and empty input prompt', () => {
  const text = terminalConversation(['› My question', '  continued', '• Ran a command', '  private tool output', '• Thinking about tools',
    '  internal continuation', '• Exited (status 1) node helper.mjs', '• Public reply', '  More reply', '└ command output', '  hidden', '› '], 'codex');
  assert.equal(text, '/ My question\n  continued\n> Public reply\n  More reply');
});

test('synthetic Claude tool blocks and unsupported formats never expose raw tool output', () => {
  assert.equal(terminalConversation(['❯ Question', '⏺ Bash(secret)', '  output', '⏺ Answer', '✻ Thinking'], 'claude'), '/ Question\n> Answer');
  assert.equal(terminalConversation(['unrecognized tool output'], 'unknown'), '');
});


test('Claude solid-circle replies are recognized while tool-only screens stay filtered', () => {
  assert.equal(terminalConversation(['❯ Question', '● Update(file.txt)', '  hidden diff', '● Visible answer', '  continuation', '❯ ', '? for shortcuts'], 'claude'), '/ Question\n> Visible answer\n  continuation');
  assert.equal(terminalConversation(['● Update(file.txt)', '  hidden diff', '⎿ Allowed by auto', '✻ Thinking'], 'claude'), '');
});
