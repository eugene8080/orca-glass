import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from '../app/node_modules/typescript/lib/typescript.js';

// Exercise the real controller with a simulated Even bridge: no agent input,
// microphone access, network, or hardware claims.
async function harness(count = 2, voice = false, mode = 'tap') {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { value: '', hidden: false, textContent: '', listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; } });
    return elements.get(id);
  };
  const threads = Array.from({ length: count }, (_, i) => ({ handle: `terminal-${i}`, title: `Session ${i}`, agent: 'codex', state: 'unknown' }));
  const pages = [], sends = [], timers = new Map(), mic = [], upgrades = [], transcriptions = [];
  let timerId = 0, event;
  const api = {
    threads: async () => threads,
    thread: async h => ({ text: `Content ${h}` }),
    capabilities: async () => ({ voice }),
    transcribe: async pcm => { transcriptions.push(pcm); return { text: 'A voice test.' }; },
    say: async (handle, text) => { sends.push({ handle, text }); return { sent: text }; },
  };
  const bridge = {
    getLocalStorage: async key => key === 'code' ? 'demo' : key === 'recording-mode' ? mode : 'en',
    createStartUpPageContainer: async p => { pages.push(p); },
    rebuildPageContainer: async p => { pages.push(p); },
    textContainerUpgrade: async value => { upgrades.push(value); },
    onEvenHubEvent: fn => { event = fn; },
    audioControl: async on => { mic.push(on); return true; },
  };
  class Property { constructor(value) { Object.assign(this, value); } }
  const sdk = new Proxy({ waitForEvenAppBridge: async () => bridge, AudioInputSource: { Glasses: 0 }, OsEventTypeList: { CLICK_EVENT: 0, DOUBLE_CLICK_EVENT: 1, SYSTEM_EXIT_EVENT: 2, ABNORMAL_EXIT_EVENT: 3, LONG_PRESS_EVENT: 9, LONG_PRESS_RELEASE_EVENT: 10 } }, { get: (target, key) => target[key] ?? Property });
  const imports = {
    '@evenrealities/even_hub_sdk': sdk,
    './api': { api, setDemo() {}, setApiLang() {}, currentBase: () => '' },
    './pairing': { parseCode: () => null },
    './i18n': { applyPage() {}, detectLang: () => 'en', setLang() {}, t: key => key },
    './text': { clipBytes: x => x, tailBytes: x => x, tailRows: x => x },
  };
  const source = ts.transpileModule(readFileSync(new URL('../app/src/main.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, {
    exports: {}, require: name => imports[name], document: { getElementById: element },
    location: { search: '' }, window: { addEventListener() {} }, URLSearchParams, Uint8Array,
    setInterval: fn => { timers.set(++timerId, fn); return timerId; },
    clearInterval: id => timers.delete(id),
  });
  const flush = () => new Promise(resolve => setImmediate(resolve));
  await flush();
  return { api, elements, pages, sends, timers, mic, upgrades, transcriptions, flush,
    press: () => { event({ sysEvent: { eventType: 9 } }); },
    release: () => { event({ sysEvent: { eventType: 10 } }); },
    audio: () => { event({ audioEvent: { audioPcm: new Uint8Array([0, 0, 1, 0]) } }); },
    pick: async i => { event({ listEvent: { currentSelectItemIndex: i, eventType: 0 } }); await flush(); },
    tap: async () => { event({ textEvent: { eventType: 0 } }); await flush(); },
    back: async () => { event({ textEvent: { eventType: 1 } }); await flush(); },
  };
}

test('every live terminal remains reachable beyond the 20-item display limit', async () => {
  const h = await harness(40);
  assert.equal(h.pages.at(-1).listObject[0].itemContainer.itemCount, 19);
  await h.pick(18); // next page
  assert.ok(h.pages.at(-1).listObject[0].itemContainer.itemName.some(s => s.includes('Session 29')));
  await h.pick(19); // next page after previous-page action
  assert.ok(h.pages.at(-1).listObject[0].itemContainer.itemName.some(s => s.includes('Session 39')));
});

test('phone message requires review and cannot be sent to a newly selected session', async () => {
  const h = await harness();
  await h.pick(3);
  h.elements.get('reply-text').value = 'Please explain the change.';
  h.elements.get('reply-form').listeners.submit({ preventDefault() {} });
  await h.back();
  await h.pick(4);
  await h.elements.get('send-reply').listeners.click();
  assert.equal(h.sends.length, 0);
  h.elements.get('reply-text').value = 'A new sentence.';
  h.elements.get('reply-form').listeners.submit({ preventDefault() {} });
  await h.elements.get('send-reply').listeners.click();
  await h.elements.get('send-reply').listeners.click();
  assert.deepEqual(h.sends, [{ handle: 'terminal-1', text: 'A new sentence.' }]);
});

test('cancelling upstream microphone flow stops capture without restarting or sending', async () => {
  const h = await harness(2, true);
  await h.pick(3);
  await h.tap();
  assert.deepEqual(h.mic, [true]);
  await h.back();
  assert.deepEqual(h.mic, [true, false]);
  assert.equal(h.sends.length, 0);
});

test('slow polls do not overlap or overwrite a different session screen', async () => {
  const h = await harness();
  await h.pick(3);
  let finish, reads = 0;
  h.api.thread = () => { reads++; return new Promise(resolve => { finish = resolve; }); };
  const poll = [...h.timers.values()][0];
  const pending = poll();
  await poll();
  assert.equal(reads, 1);
  await h.back();
  h.api.thread = async () => ({ text: 'Other session' });
  await h.pick(4);
  finish({ text: 'Stale session output' });
  await pending;
  assert.equal(h.upgrades.length, 0);
  assert.equal(h.pages.at(-1).textObject[1].content, 'Other session');
});

test('hold release waits for explicit transcription, then a separate send confirmation', async () => {
  const h = await harness(2, true, 'hold');
  await h.pick(3);
  h.press();
  await h.flush();
  h.audio();
  h.release();
  await h.flush();
  assert.deepEqual(h.mic, [true, false]);
  assert.equal(h.transcriptions.length, 0);
  assert.equal(h.sends.length, 0);
  await h.tap();
  assert.equal(h.transcriptions.length, 1);
  assert.equal(h.sends.length, 0);
  await h.tap();
  assert.equal(h.sends.length, 1);
});

test('hold recording can be discarded without transcription or input', async () => {
  const h = await harness(2, true, 'hold');
  await h.pick(3);
  h.press();
  await h.flush();
  h.audio();
  h.release();
  await h.flush();
  await h.back();
  assert.equal(h.transcriptions.length, 0);
  assert.equal(h.sends.length, 0);
});

test('release before asynchronous menu checks finish never leaves the microphone running', async () => {
  const h = await harness(2, true, 'hold');
  await h.pick(3);
  h.press();
  h.release();
  await h.flush();
  assert.deepEqual(h.mic, []);
});
