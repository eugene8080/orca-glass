import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from '../app/node_modules/typescript/lib/typescript.js';

test('session layout right-aligns count/filter/agents and fits long titles', () => {
  const calls = [], rectangles = [];
  const ctx = { fillRect: (...args) => rectangles.push(args), measureText: text => ({ width: text.length * 9 }),
    fillText(text, x, y) { calls.push({ text, x, y, align: this.textAlign }); },
    getImageData: () => ({ data: new Uint8ClampedArray(288 * 144 * 4) }) };
  const result = {};
  const source = ts.transpileModule(readFileSync(new URL('../app/src/session-list.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, { exports: result, __APP_VERSION__: '1.0.10', require: () => ({ SPINNER: ['⠋'], statusPixels: () => Array(560).fill(255) }), document: { createElement: () => ({ getContext: () => ctx }) } });
  const tiles = result.drawSessionList({ count: 4, selected: 0, frame: 0, rows: [
    { left: '* Refresh sessions', right: '[All sessions]' },
    { left: 'A very long title '.repeat(12), right: '[Codex]', handle: 'codex', state: 'idle' },
    { left: 'Active session', right: '[Cursor]', handle: 'cursor', state: 'busy' },
  ] });
  assert.equal(tiles.length, 4);
  assert.ok(tiles.every(t => t.length === 288 * 144));
  for (const text of ['4 connected terminals', '[All sessions]', '[Codex]', '[Cursor]']) {
    assert.ok(calls.some(c => c.text === text && c.x === 564 && c.align === 'right'));
  }
  assert.ok(calls.some(c => c.text === 'Orca-glass 1.0.10'));
  assert.ok(calls.some(c => c.text === '/' && c.x === 12));
  const shortened = calls.find(c => c.text.endsWith('…') && c.y === 88);
  assert.ok(shortened.x + shortened.text.length * 9 < 564 - '[Codex]'.length * 9);
  assert.ok(rectangles.length > 20, 'active marker is drawn as dots rather than a missing font glyph');
});

test('legacy Japanese or automatic language preferences resolve to English', () => {
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL('../app/src/i18n.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, { exports });
  for (const preference of ['ja', 'auto', 'en', '']) assert.equal(exports.detectLang(preference), 'en');
  assert.deepEqual(JSON.parse(readFileSync(new URL('../app/app.json', import.meta.url))).supported_languages, ['en']);
});
