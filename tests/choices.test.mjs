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
