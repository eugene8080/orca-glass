import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from '../app/node_modules/typescript/lib/typescript.js';

test('native session rows retain provider and handle within byte budget', () => {
  const text = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/text.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: text, TextEncoder });
  const i18n = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/i18n.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: i18n });
  const result = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/session-list.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: result, __APP_VERSION__: '1.0.11', require: name => name === './i18n' ? i18n : text, TextEncoder });
  for (const title of ['A long title '.repeat(50), '語'.repeat(100)]) {
    const row = result.sessionRow(title, 'terminal-e4c9a8', 'codex', 'idle');
    assert.ok(new TextEncoder().encode(row).length <= 48);
    assert.match(row, /^\/ /);
    assert.match(row, /e4c9a8 \[Codex\]$/);
  }
  assert.match(result.sessionRow('Working', 'terminal', 'cursor', 'busy'), /^\* /);
});

test('only the saved preference ja selects Japanese; anything else is English', () => {
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL('../app/src/i18n.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, { exports });
  assert.equal(exports.detectLang('ja'), 'ja');
  for (const preference of ['auto', 'en', '', 'jp', 'ja-JP']) assert.equal(exports.detectLang(preference), 'en');
  // The store manifest still lists English only until Japanese voice and listing land (plan stages J2/J4).
  assert.deepEqual(JSON.parse(readFileSync(new URL('../app/app.json', import.meta.url))).supported_languages, ['en']);
});

test('the Japanese dictionary has every English key, each non-empty with the same placeholders', () => {
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL('../app/src/i18n.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, { exports });
  const en = exports.dictionaryFor('en'), ja = exports.dictionaryFor('ja');
  assert.deepEqual(Object.keys(ja).sort(), Object.keys(en).sort());
  const holes = text => (text.match(/\{\d\}/g) || []).sort().join();
  for (const key of Object.keys(en)) {
    assert.ok(ja[key].trim(), key);
    assert.equal(holes(ja[key]), holes(en[key]), key);
  }
  // Working words and hint steps keep their counts so the status row logic is unchanged.
  assert.equal(ja.workingWords.split('|').length, en.workingWords.split('|').length);
  for (const key of ['statusWaiting', 'statusAttention', 'statusUnknown']) assert.ok(ja[key].startsWith('/'), key);
  // Contextual menu labels stay within 32 UTF-8 bytes.
  for (const key of ['refreshSessions', 'menuNewSession', 'menuUsage', 'nativeText', 'compareFonts']) {
    assert.ok(new TextEncoder().encode(ja[key]).length <= 32, key);
  }
});
