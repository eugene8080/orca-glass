import test from 'node:test';
import assert from 'node:assert/strict';
import { parseChoices, validateChoice } from '../bridge/choices.mjs';

const screen = ['Choose a colour for the test:', '› 1. Red', '  2. Green', '  3. Blue', '  4. Cancel'];
test('Codex four-option menu retains real labels and option four', () => {
  const menu = parseChoices(screen);
  assert.equal(menu.options.length, 4);
  assert.equal(menu.options[3].label, 'Cancel');
  assert.equal(validateChoice(menu, menu.id, '4'), '4');
});
test('numbered prose and partial menus are not actionable', () => {
  assert.equal(parseChoices(['1. Red', '2. Green']), null);
  assert.equal(parseChoices(['› 2. Green', '3. Blue']), null);
  assert.equal(parseChoices(['› 1. Red']), null);
});
test('a changed question or an unknown option cannot be submitted', () => {
  const menu = parseChoices(screen);
  const changed = parseChoices(['A different question:', ...screen.slice(1)]);
  assert.throws(() => validateChoice(changed, menu.id, '1'), /Question changed/);
  assert.throws(() => validateChoice(menu, menu.id, '5'), /Unknown choice/);
});

const claude = ['● Earlier reply', '────────────────────', '□ Test choice',
  '│ Which approach should the example use?', '│ Choose one approach.', '',
  '❯ 1. Validate first (Recommended)', '   Run the checks before applying.',
  '   Report the result afterwards.', '  2. Ask each time', '   Wait for confirmation.',
  '  3. Code changes only', '   Leave the example data alone.', '  4. Type something.',
  '────────────────────', '  5. Chat about this', '', 'Enter to select · ↑/↓ to navigate · Esc to cancel'];

test('Claude wrapped choices retain descriptions and separated final option', () => {
  const menu = parseChoices(claude);
  assert.equal(menu.options.length, 5);
  assert.equal(menu.options[0].description, 'Run the checks before applying. Report the result afterwards.');
  assert.equal(menu.options[4].label, 'Chat about this');
  assert.match(menu.question, /Which approach/);
  assert.doesNotMatch(menu.question, /Earlier reply/);
  const moved = claude.map(l => l.replace('❯ 1.', '  1.').replace('  5.', '❯ 5.'));
  assert.equal(parseChoices(moved).id, menu.id);
  assert.equal(validateChoice(parseChoices(moved), menu.id, '5'), '5');
});

test('wrapped unverified prose or a changed Claude question is never submitted', () => {
  assert.equal(parseChoices(claude.slice(0, -1)), null);
  assert.equal(parseChoices(claude.map(l => l === '   Wait for confirmation.' ? 'Unexpected unindented text' : l)), null);
  const old = parseChoices(claude);
  const changed = parseChoices(claude.map(l => l.replace('Which approach', 'Which other approach')));
  assert.throws(() => validateChoice(changed, old.id, '1'), /Question changed/);
});
