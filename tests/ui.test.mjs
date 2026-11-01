import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from '../app/node_modules/typescript/lib/typescript.js';

const textExports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/text.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: textExports, TextEncoder });

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
    history: async () => ({ text: 'Older terminal output' }),
    capabilities: async () => ({ voice }),
    transcribe: async pcm => { transcriptions.push(pcm); return { text: 'A voice test.' }; },
    say: async (handle, text) => { sends.push({ handle, text }); return { sent: text }; },
  };
  const bridge = {
    getLocalStorage: async key => key === 'code' ? 'demo' : key === 'recording-mode' ? mode : 'en',
    createStartUpPageContainer: async p => { pages.push(p); return 0; },
    rebuildPageContainer: async p => { pages.push(p); return true; },
    textContainerUpgrade: async value => { upgrades.push(value); return true; },
    onEvenHubEvent: fn => { event = fn; },
    audioControl: async on => { mic.push(on); return true; },
  };
  class Property { constructor(value) { Object.assign(this, value); } }
  const sdk = new Proxy({ waitForEvenAppBridge: async () => bridge, AudioInputSource: { Glasses: 0 }, OsEventTypeList: { CLICK_EVENT: 0, SCROLL_TOP_EVENT: 1, SCROLL_BOTTOM_EVENT: 2, DOUBLE_CLICK_EVENT: 3, SYSTEM_EXIT_EVENT: 7, ABNORMAL_EXIT_EVENT: 6, LONG_PRESS_EVENT: 9, LONG_PRESS_RELEASE_EVENT: 10 } }, { get: (target, key) => target[key] ?? Property });
  const imports = {
    '@evenrealities/even_hub_sdk': sdk,
    './api': { api, setDemo() {}, setApiLang() {}, currentBase: () => '' },
    './pairing': { parseCode: () => null },
    './i18n': { applyPage() {}, detectLang: () => 'en', setLang() {}, t: key => key },
    './text': textExports,
  };
  const source = ts.transpileModule(readFileSync(new URL('../app/src/main.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, {
    exports: {}, require: name => imports[name], document: { getElementById: element },
    location: { search: '' }, window: { addEventListener() {} }, URLSearchParams, Uint8Array, TextEncoder,
    setInterval: fn => { timers.set(++timerId, fn); return timerId; },
    clearInterval: id => timers.delete(id),
  });
  const flush = () => new Promise(resolve => setImmediate(resolve));
  await flush();
  return { api, bridge, elements, pages, sends, timers, mic, upgrades, transcriptions, flush,
    press: () => { event({ sysEvent: { eventType: 9 } }); },
    release: () => { event({ sysEvent: { eventType: 10 } }); },
    audio: () => { event({ audioEvent: { audioPcm: new Uint8Array(32000) } }); },
    pick: async i => { event({ listEvent: { currentSelectItemIndex: i, eventType: 0 } }); await flush(); },
    tap: async () => { event({ textEvent: { eventType: 0 } }); await flush(); },
    back: async () => { event({ textEvent: { eventType: 3 } }); await flush(); },
    scroll: async direction => { event({ textEvent: { eventType: direction === 'up' ? 1 : 2 } }); await flush(); },
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
  h.press();
  await h.flush();
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

test('hold release reviews text and only explicit send submits once', async () => {
  const h = await harness(2, true, 'hold');
  await h.pick(3);
  h.press();
  await h.flush();
  h.audio();
  h.release();
  await h.flush();
  assert.deepEqual(h.mic, [true, false]);
  assert.equal(h.transcriptions.length, 1);
  assert.equal(h.sends.length, 0);
  assert.equal(h.upgrades.at(-1).content, 'confirmSend\nA voice test.');
  await h.tap();
  assert.equal(h.sends.length, 1);
  h.release();
  await h.flush();
  assert.equal(h.sends.length, 1);
});

test('cancelling final transcription prevents late sending', async () => {
  const h = await harness(2, true, 'hold');
  await h.pick(3);
  h.press();
  await h.flush();
  h.audio();
  let finish;
  h.api.transcribe = () => new Promise(resolve => { finish = resolve; });
  h.release();
  await h.flush();
  await h.back();
  finish({ text: 'Must not send' });
  await h.flush();
  assert.equal(h.sends.length, 0);
});

test('release before the recording screen is ready never leaves the microphone running', async () => {
  const h = await harness(2, true, 'hold');
  await h.pick(3);
  h.press();
  h.release();
  await h.flush();
  assert.equal(h.mic.includes(true), false);
});

test('text pages preserve long Unicode output within row and byte limits', () => {
  const text = '語'.repeat(1000);
  const pages = textExports.textPages(text);
  assert.equal(pages.join('').replaceAll('\n', ''), text);
  assert.ok(pages.every(p => new TextEncoder().encode(p).length <= 999 && p.split('\n').length <= 8));
});

test('firmware gets overflowing text; scroll does not replace content and pauses polls', async () => {
  const h = await harness();
  const output = Array.from({ length: 20 }, (_, i) => `Line ${i}`).join('\n');
  h.api.thread = async () => ({ text: output });
  await h.pick(3);
  assert.equal(h.pages.at(-1).textObject[1].content, output);
  assert.equal(h.pages.at(-1).textObject[1].isEventCapture, 1);
  await h.scroll('up'); await h.scroll('down');
  h.api.thread = async () => ({ text: 'Updated output' });
  await [...h.timers.values()][0]();
  assert.equal(h.upgrades.length, 0);
  await h.tap();
  assert.deepEqual([...h.pages.at(-1).listObject[0].itemContainer.itemName], ['Resume latest output', 'Back to conversation']);
  await h.pick(1);
  assert.equal(h.upgrades.at(-1).content, output);
});

test('Unicode sections preserve all text within native update limit', () => {
  const original = '語🙂abc'.repeat(1000);
  const sections = textExports.textSections(original);
  assert.equal(sections.join(''), original);
  assert.ok(sections.every(s => new TextEncoder().encode(s).length <= 900 && !/[\uD800-\uDBFF]$/.test(s)));
});

test('Earlier and Later text send the selected section after rebuilding the reader', async () => {
  const h = await harness();
  const output = 'Earlier — '.repeat(400) + 'Latest text';
  const sections = textExports.textSections(output);
  h.api.thread = async () => ({ text: output });
  await h.pick(3);
  assert.equal(h.upgrades.at(-1).content, sections.at(-1));
  await h.tap();
  const labels = h.pages.at(-1).listObject[0].itemContainer.itemName;
  await h.pick(labels.indexOf('Earlier text'));
  assert.equal(h.pages.at(-1).textObject[1].content, '');
  assert.equal(h.upgrades.at(-1).content, sections.at(-2));
  await h.tap();
  await h.pick(h.pages.at(-1).listObject[0].itemContainer.itemName.indexOf('Later text'));
  assert.equal(h.upgrades.at(-1).content, sections.at(-1));
  assert.equal(h.sends.length, 0);
});

test('a rejected reader update is reported instead of silently changing section', async () => {
  const h = await harness();
  h.api.thread = async () => ({ text: 'Older text '.repeat(400) });
  await h.pick(3); await h.tap();
  const rebuild = h.bridge.rebuildPageContainer;
  h.bridge.rebuildPageContainer = async p => {
    h.bridge.rebuildPageContainer = rebuild;
    return false;
  };
  await h.pick(1);
  assert.match(h.elements.get('diag').textContent, /rejected/);
  assert.equal(h.upgrades.length, 1);
  assert.equal(h.sends.length, 0);
});

test('previews serialize requests; release waits for final text before review', async () => {
  const h = await harness(2, true, 'hold');
  await h.pick(3); h.press(); await h.flush(); h.audio();
  let finish, requests = 0;
  h.api.transcribe = () => { requests++; return new Promise(resolve => { finish = resolve; }); };
  const preview = [...h.timers.values()][0];
  preview(); preview();
  assert.equal(requests, 1);
  finish({ text: 'First words' }); await h.flush();
  assert.equal(h.upgrades.at(-1).content, 'Listening · provisional\nFirst words');
  assert.equal(h.sends.length, 0);
  h.audio(); preview(); h.release(); await h.flush();
  assert.equal(h.sends.length, 0);
  finish({ text: 'First words and final words' }); await h.flush();
  assert.equal(requests, 2);
  assert.equal(h.sends.length, 0);
  assert.equal(h.upgrades.at(-1).content, 'confirmSend\nFirst words and final words');
  await h.tap();
  assert.deepEqual(h.sends, [{ handle: 'terminal-0', text: 'First words and final words' }]);
});

test('cancel during preview prevents late captions and input', async () => {
  const h = await harness(2, true, 'hold');
  await h.pick(3); h.press(); await h.flush(); h.audio();
  let finish;
  h.api.transcribe = () => new Promise(resolve => { finish = resolve; });
  [...h.timers.values()][0](); await h.back();
  finish({ text: 'Late caption' }); await h.flush();
  assert.equal(h.upgrades.at(-1).content, ' ');
  assert.ok(h.upgrades.every(u => !u.content.includes('Late caption')));
  assert.equal(h.sends.length, 0);
});

test('saved conversation stays intact through repeated scroll gestures and pauses polling', async () => {
  const h = await harness();
  const text = 'First conversation message '.repeat(200) + 'Newest answer';
  h.api.history = async () => ({ text, source: 'codex-transcript', messageCount: 20 });
  await h.pick(3);
  assert.equal(h.pages.at(-1).textObject[1].content, '');
  assert.equal(h.upgrades.at(-1).content, text.slice(-900));
  const count = h.upgrades.length, pages = h.pages.length;
  for (let i = 0; i < 20; i++) { await h.scroll('up'); await h.scroll('down'); }
  h.api.history = async () => ({ text: text + 'new output', source: 'codex-transcript' });
  for (const timer of h.timers.values()) await timer();
  assert.equal(h.upgrades.length, count);
  assert.equal(h.pages.length, pages);
  assert.equal(h.sends.length, 0);
});

test('hold starts directly from chat even with a saved tap preference, without menu checks', async () => {
  const h = await harness(2, true, 'tap');
  await h.pick(3);
  const before = h.pages.length;
  h.api.thread = async () => { throw new Error('No pre-record menu lookup should run'); };
  h.api.capabilities = async () => { throw new Error('No pre-record capability lookup should run'); };
  h.press(); await h.flush();
  assert.deepEqual(h.mic, [true]);
  assert.equal(h.pages.length, before);
  assert.equal(h.pages.at(-1).listObject, undefined);
  assert.match(h.upgrades.at(-1).content, /^recording/);
  await h.back();
  assert.equal(h.sends.length, 0);
});

test('single click opens actual numbered choices instead of reading controls', async () => {
  const h = await harness();
  await h.pick(3);
  h.api.thread = async () => ({ text: 'Choose', menu: { id: 'menu', question: 'Choose', options: [{ value: '1', label: 'Proceed' }, { value: '2', label: 'Cancel' }] } });
  await h.tap();
  assert.deepEqual([...h.pages.at(-1).listObject[0].itemContainer.itemName], ['1. Proceed', '2. Cancel']);
  assert.equal(h.mic.length, 0);
  assert.equal(h.sends.length, 0);
});

test('explicit earlier controls traverse complete blocks without losing text', async () => {
  const h = await harness();
  const text = Array.from({ length: 280 }, (_, i) => `Line ${i}: distinct text.\n`).join('');
  const sections = textExports.textSections(text);
  h.api.history = async () => ({ text, source: 'codex-transcript' });
  await h.pick(3);
  assert.equal(h.upgrades.at(-1).content, sections.at(-1));
  for (let section = sections.length - 2; section >= 0; section--) {
    await h.tap();
    await h.pick(h.pages.at(-1).listObject[0].itemContainer.itemName.indexOf('Earlier text'));
    assert.equal(h.upgrades.at(-1).content, sections[section]);
  }
  await h.tap();
  assert.ok(!h.pages.at(-1).listObject[0].itemContainer.itemName.includes('Earlier text'));
  assert.equal(sections.join(''), text);
});


test('reader stays within the working hardware budget on opening and navigation', async () => {
  const h = await harness();
  const accepted = h.bridge.textContainerUpgrade;
  h.bridge.textContainerUpgrade = async value => {
    assert.ok(new TextEncoder().encode(value.content).length <= 900);
    return accepted(value);
  };
  h.api.history = async () => ({ text: 'Unicode 🙂 conversation. '.repeat(400), source: 'codex-transcript' });
  await h.pick(3);
  assert.ok(h.upgrades.at(-1).content.length > 300);
  await h.tap();
  await h.pick(h.pages.at(-1).listObject[0].itemContainer.itemName.indexOf('Earlier text'));
  assert.ok(h.upgrades.at(-1).content.length > 300);
  assert.equal(h.elements.get('diag').textContent.includes('could not load'), false);
});


test('double-click discards a finished voice draft without sending', async () => {
  const h = await harness(2, true, 'hold');
  await h.pick(3); h.press(); await h.flush(); h.audio(); h.release(); await h.flush();
  assert.match(h.upgrades.at(-1).content, /^confirmSend/);
  await h.back();
  assert.equal(h.sends.length, 0);
  assert.equal(h.pages.at(-1).textObject[1].content, 'Content terminal-0');
  h.press(); await h.flush();
  assert.equal(h.mic.at(-1), true);
  await h.back();
});


test('quarter-screen voice area never overlaps or rebuilds the reader on send or cancel', async () => {
  for (const send of [true, false]) {
    const h = await harness(2, true, 'hold');
    h.api.history = async () => ({ text: 'Saved history '.repeat(300), source: 'codex-transcript' });
    await h.pick(3); await h.scroll('up');
    const page = h.pages.at(-1), count = h.pages.length, writes = h.upgrades.length;
    const panel = page.textObject.find(c => c.containerName === 'voice');
    assert.equal(panel.width * panel.height, 576 * 288 / 4);
    const reader = page.textObject.find(c => c.containerName === 'body');
    assert.ok(reader.yPosition + reader.height <= panel.yPosition);
    assert.ok(panel.yPosition + panel.height <= 288);
    assert.equal(panel.content, ' ');
    assert.equal(panel.textColor, 0);
    assert.ok(panel.zOrderIndex > page.textObject[1].zOrderIndex);
    h.press(); await h.flush(); h.audio(); h.release(); await h.flush();
    assert.equal(h.sends.length, 0);
    if (send) await h.tap(); else await h.back();
    assert.equal(h.pages.length, count);
    assert.ok(h.upgrades.slice(writes).every(u => u.containerName === 'voice'));
    assert.equal(h.upgrades.at(-1).content, ' ');
    assert.equal(h.sends.length, send ? 1 : 0);
    assert.equal(h.timers.size, 0);
  }
});


test('rejected foreground panel falls back to recording and still requires explicit send', async () => {
  const h = await harness(2, true, 'hold');
  await h.pick(3);
  const upgrade = h.bridge.textContainerUpgrade;
  h.bridge.textContainerUpgrade = value => value.containerName === 'voice' ? Promise.resolve(false) : upgrade(value);
  h.press(); await h.flush();
  assert.equal(h.pages.at(-1).textObject[0].content, 'recording');
  assert.equal(h.mic.at(-1), true);
  assert.match(h.elements.get('diag').textContent, /fallback/);
  h.audio(); h.release(); await h.flush();
  assert.equal(h.pages.at(-1).textObject[0].content, 'confirmSend');
  assert.equal(h.sends.length, 0);
  await h.tap();
  assert.equal(h.sends.length, 1);
});
