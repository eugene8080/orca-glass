import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from '../app/node_modules/typescript/lib/typescript.js';

test('native session rows retain provider and handle within byte budget', () => {
  const text = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/text.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: text, TextEncoder });
  const result = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/session-list.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: result, __APP_VERSION__: '1.0.11', require: () => text, TextEncoder });
  for (const title of ['A long title '.repeat(50), '語'.repeat(100)]) {
    const row = result.sessionRow(title, 'terminal-e4c9a8', 'codex', 'idle');
    assert.ok(new TextEncoder().encode(row).length <= 48);
    assert.match(row, /^\/ /);
    assert.match(row, /e4c9a8 \[Codex\]$/);
  }
  assert.match(result.sessionRow('Working', 'terminal', 'cursor', 'busy'), /^\* /);
});

test('legacy Japanese or automatic language preferences resolve to English', () => {
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL('../app/src/i18n.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, { exports });
  for (const preference of ['ja', 'auto', 'en', '']) assert.equal(exports.detectLang(preference), 'en');
  assert.deepEqual(JSON.parse(readFileSync(new URL('../app/app.json', import.meta.url))).supported_languages, ['en']);
});
