import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanScreen, codexAnswersOnly } from '../bridge/orca.mjs';

test('terminal row boundaries never merge restarted and or', () => {
  assert.equal(cleanScreen(['The service was restarted', 'or left running.']),
    'The service was restarted\nor left running.');
});

test('Codex answer extraction preserves wrapped row and paragraph boundaries', () => {
  const rows = ['• The service was restarted', '  or left running.', '',
    '  Another paragraph has two  spaces.', '› '];
  assert.equal(cleanScreen(codexAnswersOnly(rows)),
    'The service was restarted\nor left running.\n\nAnother paragraph has two  spaces.');
});

test('ambiguous split tokens retain their line boundary instead of inventing separators', () => {
  assert.equal(cleanScreen(['https://example.test/restart', 'ed']), 'https://example.test/restart\ned');
});
