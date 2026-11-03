import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from '../app/node_modules/typescript/lib/typescript.js';

const textExports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/text.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: textExports, TextEncoder });
const statusExports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/reader-status.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: statusExports });
const hintExports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/footer-hint.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: hintExports, document: { createElement: () => ({ getContext: () => ({ fillRect() {}, fillText() {}, getImageData: () => ({ data: new Uint8ClampedArray(280 * 28 * 4) }) }) }) } });

const listExports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/session-list.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: listExports, __APP_VERSION__: '1.0.10', require: () => statusExports, document: { createElement: () => ({ getContext: () => ({ fillRect() {}, fillText() {}, measureText: text => ({ width: text.length * 9 }), getImageData: () => ({ data: new Uint8ClampedArray(288 * 144 * 4) }) }) }) } });

// Exercise the real controller with a simulated Even bridge: no agent input,
// microphone access, network, or hardware claims.
async function harness(count = 2, voice = false, mode = 'tap', savedView = '') {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { value: '', hidden: false, textContent: '', listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; } });
    return elements.get(id);
  };
  const threads = Array.from({ length: count }, (_, i) => ({ handle: `terminal-${i}`, title: `Session ${i}`, agent: 'codex', state: 'unknown' }));
  const pages = [], sends = [], timers = new Map(), mic = [], upgrades = [], transcriptions = [], images = [];
  const animations = new Map();
  let timerId = 0, event;
  const api = {
    activity: async () => ({ state: 'unknown' }),
    threads: async () => threads,
    thread: async h => ({ text: `Content ${h}` }),
    history: async () => ({ text: 'Older terminal output' }),
    capabilities: async () => ({ voice }),
    transcribe: async pcm => { transcriptions.push(pcm); return { text: 'A voice test.' }; },
    say: async (handle, text) => { sends.push({ handle, text }); return { sent: text }; },
  };
  const bridge = {
    updateImageRawData: async value => { images.push(value); return 'success'; },
    getLocalStorage: async key => key === 'code' ? 'demo' : key === 'recording-mode' ? mode : key === 'lang' ? 'en' : key === 'view-provider' ? savedView : '',
    setLocalStorage: async () => {},
    createStartUpPageContainer: async p => { pages.push(p); return 0; },
    rebuildPageContainer: async p => { pages.push(p); return true; },
    textContainerUpgrade: async value => { upgrades.push(value); return true; },
    onEvenHubEvent: fn => { event = fn; },
    audioControl: async on => { mic.push(on); return true; },
  };
  class Property { constructor(value) { Object.assign(this, value); } }
  const sdk = new Proxy({ ImageRawDataUpdateResult: { success: 'success' }, waitForEvenAppBridge: async () => bridge, AudioInputSource: { Glasses: 0 }, OsEventTypeList: { CLICK_EVENT: 0, SCROLL_TOP_EVENT: 1, SCROLL_BOTTOM_EVENT: 2, DOUBLE_CLICK_EVENT: 3, SYSTEM_EXIT_EVENT: 7, ABNORMAL_EXIT_EVENT: 6, LONG_PRESS_EVENT: 9, LONG_PRESS_RELEASE_EVENT: 10 } }, { get: (target, key) => target[key] ?? Property });
  const imports = {
    '@evenrealities/even_hub_sdk': sdk,
    './api': { api, setDemo() {}, setApiLang() {}, currentBase: () => '' },
    './pairing': { parseCode: () => null },
    './i18n': { applyPage() {}, detectLang: () => 'en', setLang() {}, t: key => key },
    './text': textExports,
    './reader-status': statusExports,
    './footer-hint': hintExports,
    './session-list': listExports,
  };
  const source = ts.transpileModule(readFileSync(new URL('../app/src/main.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, {
    exports: {}, require: name => imports[name], document: { getElementById: element },
    location: { search: '' }, window: { addEventListener() {} }, URLSearchParams, Uint8Array, TextEncoder,
    setInterval: (fn, delay) => { (delay === 200 ? animations : timers).set(++timerId, fn); return timerId; },
    clearInterval: id => { timers.delete(id); animations.delete(id); },
  });
  const flush = () => new Promise(resolve => setImmediate(resolve));
  await flush();
  return { api, bridge, elements, pages, sends, timers, animations, mic, upgrades, images, transcriptions, flush,
    menu: async id => { event({ menuItemClickEvent: { itemID: id } }); await flush(); },
    system: async type => { event({ sysEvent: { eventType: type } }); await flush(); },
    press: () => { event({ sysEvent: { eventType: 9 } }); },
    release: () => { event({ sysEvent: { eventType: 10 } }); },
    audio: () => { event({ audioEvent: { audioPcm: new Uint8Array(32000) } }); },
    pick: async i => { event({ listEvent: { currentSelectItemIndex: i, eventType: 0 } }); await flush(); },
    tap: async () => { event({ textEvent: { eventType: 0 } }); await flush(); },
    back: async () => { event({ textEvent: { eventType: 3 } }); await flush(); },
    scroll: async direction => { event({ textEvent: { eventType: direction === 'up' ? 1 : 2 } }); await flush(); },
  };
}

test('every live terminal remains reachable through session-list pages', async () => {
  const h = await harness(40);
  const seen = new Set();
  for (let page = 0; page < 20; page++) {
    const labels = h.pages.at(-1).listObject[0].itemContainer.itemName;
    labels.filter(s => s.startsWith('Session ')).forEach(s => seen.add(s));
    const next = labels.indexOf('Next page');
    if (next < 0) break;
    await h.pick(next);
  }
  assert.equal(seen.size, 40);
});

test('native Filter by Agent belongs only to the session list and does not duplicate OS controls', async () => {
  const h = await harness();
  assert.equal(h.pages.at(-1).menuObject.menuItems.length, 1);
  assert.equal(h.pages.at(-1).menuObject.menuItems[0].itemName, 'Filter by Agent >');
  await h.system(4);
  assert.equal(h.pages.length, 1);
  await h.pick(3);
  assert.equal(h.pages.at(-1).menuObject, undefined);
  const count = h.pages.length;
  await h.menu(1001);
  await h.system(5);
  assert.equal(h.pages.length, count);
  assert.equal(h.sends.length, 0);
});

test('Filter by Agent discovers providers, marks selection, filters and restores All Sessions', async () => {
  const h = await harness();
  h.api.threads = async () => [
    { handle: 'codex', title: 'Codex conversation', agent: 'codex' },
    { handle: 'open', title: 'OpenCode worker', agent: 'opencode' },
    { handle: 'gemini', title: 'Gemini conversation', agent: 'gemini' },
  ];
  const saved = [];
  h.bridge.setLocalStorage = async (key, value) => { saved.push([key, value]); };
  await h.menu(1001);
  assert.deepEqual([...h.pages.at(-1).listObject[0].itemContainer.itemName],
    ['<-', 'All Sessions ✓', 'Claude', 'Codex', 'OpenCode', 'Gemini']);
  await h.pick(4);
  assert.deepEqual(saved, [['view-provider', 'opencode']]);
  let items = h.pages.at(-1).listObject[0].itemContainer.itemName;
  assert.equal(items.length, 4);
  assert.match(items[3], /OpenCode worker/);
  await h.menu(1001);
  assert.match(h.pages.at(-1).listObject[0].itemContainer.itemName[4], /OpenCode ✓/);
  await h.pick(1);
  items = h.pages.at(-1).listObject[0].itemContainer.itemName;
  assert.equal(items.length, 6);
  assert.equal(h.sends.length, 0);
});

test('saved provider filter restores even with no matching live sessions', async () => {
  const h = await harness(2, false, 'tap', 'claude');
  assert.equal(h.pages.at(-1).listObject[0].itemContainer.itemCount, 3);
  await h.menu(1001);
  assert.equal(h.pages.at(-1).listObject[0].itemContainer.itemName[2], 'Claude ✓');
  assert.equal(h.sends.length, 0);
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
  await h.flush();
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

test('working footer uses reported duration and animation never rewrites the conversation', async () => {
  const h = await harness();
  h.api.activity = async () => ({ state: 'working', elapsedSeconds: 812 });
  await h.pick(3);
  const pageCount = h.pages.length;
  const imagesBefore = h.images.length;
  await [...h.animations.values()][0]();
  assert.equal(h.pages.length, pageCount);
  assert.ok(h.images.length > imagesBefore);
  assert.ok(h.upgrades.every(u => u.containerName === 'voice'));
  assert.equal(hintExports.footerHint(812), '13m 32s [Tap & hold to input]');
  assert.equal(hintExports.footerHint(null), '[Tap & hold to input]');
  assert.equal(hintExports.footerHint(NaN), '[Tap & hold to input]');
});

test('working words last five seconds and Braille patterns are distinct', () => {
  assert.match(statusExports.readerStatus('working', 0, 0), /Processing\.$/);
  assert.match(statusExports.readerStatus('working', 1, 500), /Processing\.\.$/);
  assert.match(statusExports.readerStatus('working', 2, 1000), /Processing\.\.\.$/);
  assert.match(statusExports.readerStatus('working', 0, 4999), /Processing/);
  assert.match(statusExports.readerStatus('working', 0, 5000), /Thinking\.$/);
  assert.equal(new Set(statusExports.SPINNER.map(s => JSON.stringify(statusExports.statusPixels(s)))).size, 10);
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
  assert.match(h.upgrades.at(-1).content, /A voice test\./);
  assert.equal(h.upgrades.at(-1).containerName, 'voice');
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
  const count = h.pages.length;
  await h.tap();
  assert.equal(h.pages.length, count);
  assert.equal(h.upgrades.length, 0);
});

test('Unicode sections preserve all text within native update limit', () => {
  const original = '語🙂abc'.repeat(1000);
  const sections = textExports.textSections(original);
  assert.equal(sections.join(''), original);
  assert.ok(sections.every(s => new TextEncoder().encode(s).length <= 900 && !/[\uD800-\uDBFF]$/.test(s)));
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
  assert.match(h.upgrades.at(-1).content, /First words and final words/);
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
  assert.equal(h.upgrades.findLast(u => u.containerName === 'voice').content, '/ Status unavailable');
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


test('capture and bottom-panel review never rebuild or rewrite the chat on send or cancel', async () => {
  for (const send of [true, false]) {
    const h = await harness(2, true, 'hold');
    h.api.history = async () => ({ text: 'Saved history '.repeat(300), source: 'codex-transcript' });
    await h.pick(3); await h.scroll('up');
    const page = h.pages.at(-1), count = h.pages.length, writes = h.upgrades.length;
    const panel = page.textObject.find(c => c.containerName === 'voice');
    assert.equal(panel.width, 544);
    assert.ok(panel.height <= 72);
    const reader = page.textObject.find(c => c.containerName === 'body');
    assert.ok(reader.yPosition + reader.height <= panel.yPosition);
    assert.ok(panel.yPosition + panel.height <= 288);
    assert.equal(panel.content, '/ Status unavailable');
    assert.equal(panel.textColor, 4);
    assert.ok(panel.zOrderIndex > page.textObject[1].zOrderIndex);
    h.press(); await h.flush();
    assert.equal(h.pages.length, count);
    assert.ok(h.upgrades.slice(writes).every(u => ['voice', 'hint'].includes(u.containerName)));
    h.audio(); h.release(); await h.flush();
    assert.equal(h.pages.length, count);
    assert.equal(h.upgrades.at(-1).containerName, 'voice');
    assert.equal(h.sends.length, 0);
    if (send) await h.tap(); else await h.back();
    const restoredPages = h.pages.length;
    assert.equal(restoredPages, count);
    assert.equal(h.pages.at(-1).textObject.find(c => c.containerName === 'voice').content, '/ Status unavailable');
    assert.equal(h.sends.length, send ? 1 : 0);
    assert.equal(h.timers.size, 1);
    if (send) {
      h.api.history = async () => ({ text: 'New response after voice send', source: 'codex-transcript' });
      await [...h.timers.values()][0]();
      assert.equal(h.upgrades.at(-1).containerName, 'body');
      assert.equal(h.upgrades.at(-1).content, 'New response after voice send');
      assert.equal(h.pages.length, restoredPages);
      await h.scroll('up');
      const pausedWrites = h.upgrades.length;
      await [...h.timers.values()][0]();
      assert.equal(h.upgrades.length, pausedWrites);
    }
  }
});


test('rejected foreground panel preserves the chat instead of rebuilding a voice page', async () => {
  const h = await harness(2, true, 'hold');
  await h.pick(3);
  const upgrade = h.bridge.textContainerUpgrade;
  const count = h.pages.length;
  h.bridge.textContainerUpgrade = value => value.containerName === 'voice' ? Promise.resolve(false) : upgrade(value);
  h.press(); await h.flush();
  assert.equal(h.pages.length, count);
  assert.notEqual(h.mic.at(-1), true);
  assert.match(h.elements.get('diag').textContent, /rejected/);
  assert.equal(h.sends.length, 0);
});

test('bottom status changes while reading is paused without rewriting the conversation', async () => {
  const h = await harness();
  await h.pick(3);
  const pages = h.pages.length;
  await h.scroll('up');
  h.api.activity = async () => ({ state: 'working' });
  await [...h.timers.values()][0]();
  assert.equal(h.upgrades.at(-1).content, '    Processing.');
  assert.deepEqual(Object.keys(h.upgrades.at(-1)).sort(), ['containerID', 'containerName', 'content', 'textColor'].sort());
  h.api.activity = async () => ({ state: 'waiting' });
  await [...h.timers.values()][0]();
  assert.equal(h.upgrades.at(-1).content, '/ Waiting input');
  assert.ok(h.upgrades.every(u => u.containerName === 'voice'));
  assert.equal(h.pages.length, pages);
});

test('initial reader status is fetched before rendering rather than waiting for phone timers', async () => {
  const h = await harness();
  h.api.activity = async () => ({ state: 'working' });
  await h.pick(3);
  assert.equal(h.pages.at(-1).textObject.find(c => c.containerName === 'voice').content, '    Processing.');
});

test('late activity cannot overwrite voice capture; cancel restores status and keeps text paused', async () => {
  const h = await harness(2, true, 'hold');
  await h.pick(3);
  h.api.activity = async () => ({ state: 'working' });
  await [...h.timers.values()][0]();
  let finish;
  h.api.activity = () => new Promise(resolve => { finish = resolve; });
  const pending = [...h.timers.values()][0]();
  h.press(); await h.flush();
  const writes = h.upgrades.length;
  finish({ state: 'waiting' });
  await pending;
  assert.equal(h.upgrades.length, writes);
  await h.back();
  assert.equal(h.upgrades.findLast(u => u.containerName === 'voice').content, '    Processing.');
  h.api.activity = async () => ({ state: 'waiting' });
  const afterCancel = h.upgrades.length;
  await [...h.timers.values()][0]();
  assert.equal(h.upgrades.at(-1).content, '/ Waiting input');
  assert.ok(h.upgrades.slice(afterCancel).every(u => u.containerName === 'voice'));
});

test('saved history losing its association falls back to live output and keeps updating', async () => {
  const h = await harness();
  h.api.history = async () => ({ text: 'Saved conversation', source: 'codex-transcript' });
  await h.pick(3);
  h.api.history = async () => ({ text: 'Raw buffer', source: 'terminal-buffer' });
  h.api.thread = async () => ({ text: 'New live reply' });
  await [...h.timers.values()][0]();
  assert.equal(h.upgrades.at(-1).content, 'New live reply');
  h.api.history = async () => { throw new Error('Must stay on the live source'); };
  h.api.thread = async () => ({ text: 'Next live reply' });
  await [...h.timers.values()][0]();
  assert.equal(h.upgrades.at(-1).content, 'Next live reply');
});

test('a rejected live text update is retried instead of marking unseen text as displayed', async () => {
  const h = await harness();
  await h.pick(3);
  h.api.thread = async () => ({ text: 'Fresh reply' });
  const original = h.bridge.textContainerUpgrade;
  let attempts = 0;
  h.bridge.textContainerUpgrade = async value => {
    if (value.containerName === 'body' && ++attempts === 1) return false;
    return original(value);
  };
  await [...h.timers.values()][0]();
  assert.match(h.elements.get('diag').textContent, /Retrying/);
  await [...h.timers.values()][0]();
  assert.equal(attempts, 2);
  assert.equal(h.upgrades.at(-1).content, 'Fresh reply');
});

 test('session click does nothing, including when terminal has numbered choices', async () => {
  const h = await harness();
  await h.pick(3);
  const count = h.pages.length;
  h.api.thread = async () => { throw new Error('Click must not read or open a choice menu'); };
  await h.tap();
  assert.equal(h.pages.length, count);
  assert.equal(h.upgrades.length, 0);
  assert.equal(h.sends.length, 0);
  const frame = h.pages.at(-1).textObject.find(c => c.containerName === 'frame');
  const divider = h.pages.at(-1).textObject.find(c => c.containerName === 'divider');
  assert.equal(frame.borderColor, 15);
  assert.equal(divider.borderColor, 15);
  assert.equal(frame.borderWidth, 2);
  assert.equal(divider.height, 2);
  assert.equal(h.pages.at(-1).textObject.find(c => c.containerName === 'voice').content, '/ Status unavailable');
});

test('voice border is precreated, appears for capture/review and clears on cancel', async () => {
  const h = await harness(2, true, 'hold');
  await h.pick(3);
  const page = h.pages.at(-1);
  assert.equal(page.imageObject.length, 4);
  for (const tile of page.imageObject.filter(c => c.containerName.startsWith('voice-border'))) {
    assert.ok(tile.width <= 288 && tile.height <= 144);
    assert.ok(tile.yPosition >= 208);
  }
  const count = h.pages.length;
  h.press(); await h.flush(); h.audio(); h.release(); await h.flush();
  const borders = h.images.filter(i => i.containerName.startsWith('voice-border'));
  assert.equal(borders.length, 2);
  assert.ok(borders.every(i => i.imageData.some(p => p === 255)));
  await h.back();
  assert.equal(h.pages.length, count);
  assert.ok(h.images.filter(i => i.containerName.startsWith('voice-border')).slice(-2).every(i => i.imageData.every(p => p === 0)));
  assert.ok(h.upgrades.every(u => u.containerName === 'voice'));
});

test('session list navigates image rows without rebuilding during spinner animation', async () => {
  const h = await harness();
  const count = h.pages.length;
  assert.equal(h.pages.at(-1).imageObject.length, 4);
  assert.equal(h.pages.at(-1).textObject[0].isEventCapture, 1);
  await h.scroll('down'); await h.scroll('down'); await h.scroll('down');
  await [...h.animations.values()][0]();
  assert.equal(h.pages.length, count);
  await h.tap();
  assert.equal(h.pages.at(-1).textObject[1].content, 'Content terminal-0');
});
