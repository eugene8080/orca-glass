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

test('nested bullets and two-digit list numbers remain literal in conversation display', () => {
  const source = 'Open:\n- Group\n  - Nested bullet\n  1. Nested ordered\n  2. Second\n\n11. Eleven\n12. Twelve\n13. Thirteen\n14. Fourteen\n15. Fifteen\n19. Nineteen';
  assert.equal(formatMessages([{ role: 'assistant', text: source }]),
    source.split('\n').map((line, i) => (i ? '  ' : '> ') + line).join('\n'));
});

test('model labels are compact for the one-row reader status', async () => {
  const { modelLabel, terminalModel } = await import('../bridge/reader-text.mjs');
  assert.equal(modelLabel('claude-opus-5-5'), 'Opus5.5');
  assert.equal(modelLabel('claude-haiku-4-5-20251001'), 'Haiku4.5');
  assert.equal(modelLabel('<synthetic>'), '');
  assert.equal(modelLabel('gpt-6-astra', 'medium'), 'GPT-6-Astra med');
  assert.equal(modelLabel('gpt-6.1-sol', 'low'), 'GPT-6.1-Sol low');
  // Synthetic Codex footer; quoted prose higher up the screen is ignored.
  assert.equal(terminalModel(['GPT-9 high · quoted earlier', ...Array(8).fill(''), '› Ask Codex to do anything', '  GPT-6-Astra medium · D:\dev\example · Example title']), 'GPT-6-Astra med');
  assert.equal(terminalModel(['No footer here']), '');
});
