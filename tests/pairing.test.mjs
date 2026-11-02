import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from '../app/node_modules/typescript/lib/typescript.js';

function pairing(origin, fetch) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL('../app/src/pairing.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, __BRIDGE_ORIGIN__: origin, fetch,
    require: () => ({ hmacSha256Hex: () => 'valid-signature' }) });
  return exports;
}

test('beta connects to its whitelisted origin without temporary tunnel discovery', async () => {
  const api = pairing('https://pc.example:8443', () => { throw new Error('Unexpected discovery request'); });
  assert.equal(await api.resolveBase({ topic: 'private', token: 'secret' }), 'https://pc.example:8443');
});

test('prototype retains signed discovery and rejects an unsigned newer announcement', async () => {
  const messages = [
    { u: 'https://working.trycloudflare.com', t: 1, s: 'valid-signature' },
    { u: 'https://forged.trycloudflare.com', t: 2, s: 'invalid' },
  ].map(message => JSON.stringify({ event: 'message', message: JSON.stringify(message) })).join('\n');
  const api = pairing('', async () => ({ ok: true, text: async () => messages }));
  assert.equal(await api.resolveBase({ topic: 'private', token: 'secret' }), 'https://working.trycloudflare.com');
});
