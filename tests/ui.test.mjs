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
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/session-list.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: listExports, __APP_VERSION__: '1.0.12', require: () => textExports, TextEncoder, document: { createElement: () => ({ getContext: () => ({ font: '', measureText: t => ({ width: t.length * 10 }) }) }) } });

// Exercise the real controller with a simulated Even bridge: no agent input,
// microphone access, network, or hardware claims.
async function harness(count = 2, voice = false, mode = 'tap', savedView = '', startupResult = 0, rejectAlignedMenu = false, savedWorkspaces = '') {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { value: '', hidden: false, textContent: '', listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; } });
    return elements.get(id);
  };
  const threads = Array.from({ length: count }, (_, i) => ({ handle: `terminal-${i}`, title: `Session ${i}`, agent: 'codex', state: 'unknown' }));
  const pages = [], sends = [], choices = [], timers = new Map(), mic = [], upgrades = [], transcriptions = [], images = [];
  const animations = new Map();
  let timerId = 0, event;
  const api = {
    activity: async () => ({ state: 'unknown' }),
    threads: async () => threads,
    workspaces: async () => [],
    thread: async h => ({ text: `Content ${h}` }),
    history: async () => ({ text: 'Older terminal output' }),
    capabilities: async () => ({ voice }),
    transcribe: async pcm => { transcriptions.push(pcm); return { text: 'A voice test.' }; },
    say: async (handle, text) => { sends.push({ handle, text }); return { sent: text }; },
    choice: async (handle, menuId, value) => { choices.push({ handle, menuId, value }); return { sent: value }; },
  };
  const bridge = {
    updateImageRawData: async value => { images.push(value); return 'success'; },
    getLocalStorage: async key => key === 'code' ? 'demo' : key === 'recording-mode' ? mode : key === 'lang' ? 'en' : key === 'view-provider' ? savedView : key === 'view-workspaces' ? savedWorkspaces : '',
    setLocalStorage: async () => {},
    createStartUpPageContainer: async p => { pages.push(p); return startupResult; },
    rebuildPageContainer: async p => { pages.push(p); return !(rejectAlignedMenu && p.textObject.some(c => c.containerName === 'menu-right') && (rejectAlignedMenu !== 'images' || !!p.imageObject)); },
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
  return { api, bridge, elements, pages, sends, choices, threads, timers, animations, mic, upgrades, images, transcriptions, flush,
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

const menuItems = h => h.pages.at(-1).listObject?.[0].itemContainer.itemName || h.pages.at(-1).textObject.find(c => c.containerName === 'body').content.split('\n').map(row => row.trim().replace(/^> ?/, '').replace(/^[*/?+◇]\s+/, ''));

test('every live terminal remains reachable through session-list pages', async () => {
  const h = await harness(40);
  const seen = new Set();
  for (let page = 0; page < 20; page++) {
    const labels = menuItems(h);
    labels.filter(s => s.includes('Session ')).forEach(s => seen.add(s));
    assert.ok(!labels.some(s => /^(Next|Previous) page$/.test(s)));
    if (seen.size === 40) break;
    for (let row = 0; row < labels.length; row++) await h.scroll('down');
  }
  assert.equal(seen.size, 40);
});

test('Filter by Agent stays in the list and contextual menu gets the three moved actions', async () => {
  const h = await harness();
  assert.deepEqual([...h.pages.at(-1).menuObject.menuItems].map(i => i.itemName), ['Refresh sessions', 'New Session', 'Usage']);
  const count = h.pages.length;
  await h.menu(9999); await h.system(4); await h.system(5);
  assert.equal(h.pages.length, count);
  assert.match(menuItems(h)[0], /Filter by Agent/);
  await h.pick(0);
  assert.equal(h.pages.at(-1).textObject[0].content, 'Filter by Agent');
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
  await h.pick(0);
  assert.deepEqual([...menuItems(h)],
    ['<-', 'All Sessions ✓', 'Claude', 'Codex', 'OpenCode', 'Gemini']);
  await h.pick(4);
  assert.deepEqual(saved, [['view-provider', 'opencode']]);
  let items = menuItems(h);
  assert.equal(items.length, 3);
  assert.match(items[2], /OpenCode worker/);
  await h.pick(0);
  assert.match(menuItems(h)[4], /OpenCode ✓/);
  await h.pick(1);
  items = menuItems(h);
  assert.equal(items.length, 5);
  assert.equal(h.sends.length, 0);
});

test('saved provider filter restores even with no matching live sessions', async () => {
  const h = await harness(2, false, 'tap', 'claude');
  assert.equal(menuItems(h).length, 2);
  await h.pick(0);
  assert.equal(menuItems(h)[2], 'Claude ✓');
  assert.equal(h.sends.length, 0);
});

test('Hermes mixed models share one filter and saved reader uses confirmed voice flow', async () => {
  const h = await harness(2, true, 'hold');
  const models = ['GPT', 'Claude', 'Gemini', 'Qwen', 'Local', 'Custom', 'Other'];
  h.api.threads = async () => [
    ...models.map((model, i) => ({ handle: `hermes:${i}`, title: `Hermes ${model}`, agent: 'hermes',
      workspaceId: `profile-${i % 2}`, workspaceName: `Hermes profile ${i % 2}`, workspaceLabel: `profile ${i % 2}` })),
    { handle: 'codex', title: 'Codex regression', agent: 'codex' },
    { handle: 'claude', title: 'Claude regression', agent: 'claude' },
  ];
  await h.pick(0);
  assert.deepEqual([...menuItems(h)], ['<-', 'All Sessions ✓', 'Claude', 'Codex', 'Hermes']);
  await h.pick(4);
  assert.equal(menuItems(h).length, 9);
  assert.ok(menuItems(h).slice(2).every(t => t.startsWith('Hermes ')));
  h.api.history = async () => ({ source: 'hermes-transcript', text: '> Exact Hermes saved answer' });
  await h.pick(2);
  assert.ok(h.pages.at(-1).textObject.some(c => c.content.includes('Exact Hermes saved answer')));
  h.press(); await h.flush(); h.audio(); h.release(); await h.flush();
  assert.equal(h.sends.length, 0);
  await h.tap();
  assert.deepEqual(h.sends, [{ handle: 'hermes:0', text: 'A voice test.' }]);
});

test('phone message requires review and cannot be sent to a newly selected session', async () => {
  const h = await harness();
  await h.pick(2);
  h.elements.get('reply-text').value = 'Please explain the change.';
  h.elements.get('reply-form').listeners.submit({ preventDefault() {} });
  await h.back();
  await h.pick(3);
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
  await h.pick(2);
  h.press();
  await h.flush();
  assert.deepEqual(h.mic, [true]);
  await h.back();
  assert.deepEqual(h.mic, [true, false]);
  assert.equal(h.sends.length, 0);
});

test('slow polls do not overlap or overwrite a different session screen', async () => {
  const h = await harness();
  await h.pick(2);
  let finish, reads = 0;
  h.api.thread = () => { reads++; return new Promise(resolve => { finish = resolve; }); };
  const poll = [...h.timers.values()][0];
  const pending = poll();
  await h.flush();
  await poll();
  assert.equal(reads, 1);
  await h.back();
  h.api.thread = async () => ({ text: 'Other session' });
  await h.pick(3);
  finish({ text: 'Stale session output' });
  await pending;
  assert.equal(h.upgrades.length, 0);
  assert.equal(h.pages.at(-1).textObject[1].content, 'Other session');
});

test('working footer uses reported duration and animation never rewrites the conversation', async () => {
  const h = await harness();
  h.api.activity = async () => ({ state: 'working', elapsedSeconds: 812 });
  await h.pick(2);
  const pageCount = h.pages.length;
  const imagesBefore = h.images.length;
  await [...h.animations.values()][0]();
  assert.equal(h.pages.length, pageCount);
  assert.ok(h.images.length > imagesBefore);
  assert.ok(h.upgrades.every(u => ['voice', 'hint'].includes(u.containerName)));
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
  await h.pick(2);
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
  await h.pick(2);
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
  await h.pick(2);
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
  await h.pick(2);
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
  await h.pick(2); h.press(); await h.flush(); h.audio();
  let finish, requests = 0;
  h.api.transcribe = () => { requests++; return new Promise(resolve => { finish = resolve; }); };
  const preview = [...h.timers.values()][0];
  preview(); preview();
  assert.equal(requests, 1);
  finish({ text: 'First words' }); await h.flush();
  assert.equal(h.upgrades.at(-1).content, 'First words');
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
  await h.pick(2); h.press(); await h.flush(); h.audio();
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
  await h.pick(2);
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
  await h.pick(2);
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
  await h.pick(2); h.press(); await h.flush(); h.audio(); h.release(); await h.flush();
  assert.equal(h.upgrades.at(-1).content, 'A voice test.');
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
    await h.pick(2); await h.scroll('up');
    const page = h.pages.at(-1), count = h.pages.length, writes = h.upgrades.length;
    const panel = page.textObject.find(c => c.containerName === 'voice');
    assert.equal(panel.width, 544);
    assert.ok(panel.height <= 81);
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
  await h.pick(2);
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
  await h.pick(2);
  const pages = h.pages.length;
  await h.scroll('up');
  h.api.activity = async () => ({ state: 'working' });
  await [...h.timers.values()][0]();
  assert.equal(h.upgrades.at(-1).content, '    Processing.');
  assert.deepEqual(Object.keys(h.upgrades.at(-1)).sort(), ['containerID', 'containerName', 'content', 'textColor'].sort());
  h.api.activity = async () => ({ state: 'waiting' });
  await [...h.timers.values()][0]();
  assert.equal(h.upgrades.at(-1).content, '/ Waiting input');
  assert.ok(h.upgrades.every(u => ['voice', 'hint'].includes(u.containerName)));
  assert.equal(h.pages.length, pages);
});

test('initial reader status is fetched before rendering rather than waiting for phone timers', async () => {
  const h = await harness();
  h.api.activity = async () => ({ state: 'working' });
  await h.pick(2);
  assert.equal(h.pages.at(-1).textObject.find(c => c.containerName === 'voice').content, '    Processing.');
});

test('late activity cannot overwrite voice capture; cancel restores status and keeps text paused', async () => {
  const h = await harness(2, true, 'hold');
  await h.pick(2);
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
  assert.ok(h.upgrades.slice(afterCancel).every(u => ['voice', 'hint'].includes(u.containerName)));
});

test('saved history losing its association falls back to live output and keeps updating', async () => {
  const h = await harness();
  h.api.history = async () => ({ text: 'Saved conversation', source: 'codex-transcript' });
  await h.pick(2);
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
  await h.pick(2);
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

 test('session click does nothing without a detected numbered prompt', async () => {
  const h = await harness();
  await h.pick(2);
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
  await h.pick(2);
  const page = h.pages.at(-1);
  assert.equal(page.imageObject.length, 3);
  for (const tile of page.imageObject.filter(c => c.containerName.startsWith('voice-border'))) {
    assert.ok(tile.width <= 288 && tile.height <= 144);
    assert.ok(tile.yPosition >= 198);
  }
  const count = h.pages.length;
  h.press(); await h.flush(); h.audio(); h.release(); await h.flush();
  const borders = h.images.filter(i => i.containerName.startsWith('voice-border'));
  assert.equal(borders.length, 2);
  assert.ok(borders.every(i => i.imageData.some(p => p === 255)));
  await h.back();
  assert.equal(h.pages.length, count);
  assert.ok(h.images.filter(i => i.containerName.startsWith('voice-border')).slice(-2).every(i => i.imageData.every(p => p === 0)));
  assert.ok(h.upgrades.every(u => ['voice', 'hint'].includes(u.containerName)));
});

test('compact session menu uses native text and one update per cursor move', async () => {
  const h = await harness();
  const pages = h.pages.length;
  assert.equal(h.pages.at(-1).imageObject, undefined);
  assert.equal(h.pages.at(-1).listObject, undefined);
  assert.equal(h.pages.at(-1).textObject.find(c => c.containerName === 'menu-input').isEventCapture, 1);
  assert.ok(h.pages.at(-1).textObject.filter(c => c.containerName !== 'menu-input').every(c => c.isEventCapture === 0));
  assert.ok(h.images.every(i => i.containerName.startsWith('menu-spin')));
  assert.equal(h.animations.size, 0);
  const columns = h.pages.at(-1).textObject;
  assert.equal(columns.find(c => c.containerName === 'menu-count').xPosition, 300);
  assert.equal(columns.find(c => c.containerName === 'head').height, 28);
  assert.equal(columns.find(c => c.containerName === 'body').yPosition, 28);
  assert.equal(columns.find(c => c.containerName === 'menu-right').xPosition, 328);
  assert.equal(columns.find(c => c.containerName === 'body').content.split('\n')[0], ' Filter by Agent');
  assert.equal(columns.find(c => c.containerName === 'body').xPosition, 28);
  const actionRows = columns.find(c => c.containerName === 'body').content.split('\n').slice(0, 4);
  assert.ok(actionRows.every(row => /^ {1}\S/.test(row)));
  assert.ok(!actionRows.join(' ').includes('Usage'));
  assert.match(columns.find(c => c.containerName === 'menu-right').content.split('\n')[0], /All sessions/);
  assert.equal(columns.find(c => c.containerName === 'menu-right').content.split('\n')[2].trim(), '[Codex]');
  assert.equal(h.pages.at(-1).containerTotalNum, 6);
  const all = [...columns];
  assert.deepEqual(all.map(c => c.zOrderIndex).sort((a, b) => a - b), [0,1,2,3,4,5]);
  assert.deepEqual(all.map(c => c.containerID).sort((a, b) => a - b), [1,2,3,4,5,6]);
  await h.scroll('down');
  assert.equal(h.upgrades.length, 1);
  assert.equal(h.upgrades[0].containerName, 'menu-cursor');
  assert.equal(h.upgrades[0].content.split('\n')[1].trimStart(), '>*');
  await h.scroll('down');
  assert.equal(h.pages.length, pages);
  await h.tap();
  assert.equal(h.pages.at(-1).textObject[1].content, 'Content terminal-0');
});

test('reader reserves six native chat rows and three input rows without overlap', async () => {
  const h = await harness();
  await h.pick(2);
  const page = h.pages.at(-1);
  const body = page.textObject.find(c => c.containerName === 'body');
  const voice = page.textObject.find(c => c.containerName === 'voice');
  assert.equal(body.height, 162);
  assert.equal(body.xPosition, 8);
  assert.equal(body.width, 560);
  assert.equal(body.paddingLength, 0);
  assert.equal(voice.height, 81);
  assert.ok(body.yPosition + body.height < voice.yPosition);
  assert.ok(voice.yPosition + voice.height < 288);
});

test('rapid native-text menu swipes coalesce instead of queuing every redraw', async () => {
  const h = await harness(4);
  let finish;
  const original = h.bridge.textContainerUpgrade;
  h.bridge.textContainerUpgrade = value => { h.bridge.textContainerUpgrade = original; return new Promise(resolve => { finish = () => { original(value); resolve(true); }; }); };
  await h.scroll('down'); await h.scroll('down'); await h.scroll('down'); await h.scroll('down'); await h.scroll('down');
  finish(); await h.flush();
  assert.equal(h.upgrades.length, 2);
  assert.equal(h.upgrades.at(-1).content.split('\n')[5].trimStart(), '>?');
  assert.ok(h.images.every(i => i.containerName.startsWith('menu-spin')));
});

test('startup uses a minimal native page and recovers an already-consumed startup', async () => {
  const h = await harness(2, false, 'tap', '', 1);
  assert.equal(h.pages.length, 3);
  assert.equal(h.pages[0].containerTotalNum, 2);
  assert.equal(h.pages[1].containerTotalNum, 2);
  assert.equal(h.pages[2].containerTotalNum, 6);
});

test('hardware rejecting aligned layout gets an operable compact fallback', async () => {
  const h = await harness(2, false, 'tap', '', 0, true);
  assert.equal(h.pages[0].containerTotalNum, 2);
  assert.equal(h.pages[1].containerTotalNum, 6);
  assert.equal(h.pages.at(-1).containerTotalNum, 3);
  assert.equal(h.pages.at(-1).imageObject, undefined);
  assert.match(h.elements.get('diag').textContent, /compact compatibility menu active/);
  await h.scroll('down');
  assert.equal(h.upgrades.at(-1).containerName, 'body');
  await h.scroll('down');
  await h.tap();
  assert.equal(h.pages.at(-1).textObject[1].content, 'Content terminal-0');
  await h.back();
  assert.equal(h.pages.at(-1).containerTotalNum, 3);
  assert.equal(h.pages.filter(p => p.containerTotalNum === 6).length, 1);
});

test('voice review uses all three native rows and hint is native text', async () => {
  const h = await harness(2, true, 'hold');
  await h.pick(2);
  const page = h.pages.at(-1), count = h.pages.length;
  assert.ok(page.textObject.some(c => c.containerName === 'hint'));
  assert.ok(!page.imageObject.some(c => c.containerName === 'hint'));
  h.api.transcribe = async () => ({ text: 'First line.\nSecond line.\nThird line.' });
  h.press(); await h.flush(); h.audio(); h.release(); await h.flush();
  assert.equal(h.upgrades.filter(u => u.containerName === 'voice').at(-1).content, 'First line.\nSecond line.\nThird line.');
  assert.equal(h.pages.length, count);
  await h.tap();
  assert.equal(h.sends.length, 1);
});

test('menu activity polling starts a spinner after a session becomes busy', async () => {
  const h = await harness();
  h.api.threads = async () => [{ handle: 'terminal-0', title: 'Session 0', agent: 'codex', state: 'busy' }];
  await [...h.timers.values()].at(-1)(); await h.flush();
  const before = h.upgrades.filter(i => i.containerName === 'menu-cursor').at(-1).content;
  await [...h.timers.values()][0](); await h.flush();
  const after = h.upgrades.filter(i => i.containerName === 'menu-cursor').at(-1).content;
  assert.notEqual(before, after);
  assert.equal(h.images.length, 0);
  const bodyWrites = h.upgrades.filter(u => u.containerName === 'body');
  assert.equal(bodyWrites.length, 0);
  assert.match(after.split('\n')[2], /^[ >][ ·]{3}$/);
});

test('system exit stops menu activity polling and marker animation', async () => {
  const h = await harness();
  assert.ok(h.timers.size >= 2);
  await h.system(7);
  assert.equal(h.timers.size, 0);
  assert.equal(h.animations.size, 0);
});

test('session menu never requests marker images', async () => {
  const h = await harness(2, false, 'tap', '', 0, 'images');
  assert.equal(h.pages.at(-1).containerTotalNum, 6);
  assert.equal(h.pages.at(-1).imageObject, undefined);
  assert.ok(h.pages.at(-1).textObject.some(c => c.containerName === 'menu-right'));
  assert.match(h.elements.get('menu-layout').textContent, /animated dots/);
  await h.scroll('down');
  assert.equal(h.upgrades.at(-1).containerName, 'menu-cursor');
});


test('action, idle and working titles share one fixed leading space', () => {
  const rows = [
    { title: 'Filter by Agent', marker: '*' },
    { title: 'Usage', marker: '◊' },
    { title: 'Idle', marker: '/', handle: 'idle', busy: false },
    { title: 'Working', marker: '', handle: 'busy', busy: true },
  ];
  assert.equal(listExports.menuNativeText(rows), ' Filter by Agent\n Usage\n Idle\n Working');
  for (let frame = 0; frame < 3; frame++) {
    const markers = listExports.menuCursorText(rows, 3, frame).split('\n');
    assert.equal(markers.length, rows.length);
    assert.equal(markers[3].length, 4);
    assert.equal(markers[3][0], '>');
  }
});


test('contextual actions refresh roster, open workspace picker and display usage', async () => {
  const h = await harness();
  h.api.threads = async () => [{ handle: 'terminal-0', title: 'Renamed session', agent: 'codex', state: 'idle' }];
  await h.menu(1001);
  assert.match(menuItems(h)[2], /Renamed session/);
  h.api.workspaces = async () => [{ id: 'fixture', name: 'Fixture workspace' }];
  await h.menu(1002);
  assert.equal(h.pages.at(-1).textObject[0].content, 'step1');
  assert.equal(menuItems(h)[0], 'Fixture workspace');
  assert.equal(h.pages.at(-1).menuObject, undefined);
  await h.back();
  h.api.usage = async () => ({ codex: { provider: 'codex', status: 'ok', weekly: { usedPercent: 25, resetDescription: 'tomorrow' } } });
  await h.menu(1003);
  assert.equal(h.pages.at(-1).textObject[0].content, 'usageTitle');
  assert.match(h.pages.at(-1).textObject[1].content, /25%/);
  await h.back(); await h.pick(2);
  assert.equal(h.pages.at(-1).menuObject, undefined);
  const pages = h.pages.length;
  await h.menu(1002);
  assert.equal(h.pages.length, pages);
  assert.equal(h.sends.length, 0);
});


test('Usage renders Claude windows and Cursor monthly allowance without mislabelling', async () => {
  const h = await harness();
  h.api.usage = async () => ({
    claude: { provider: 'claude', status: 'ok', session: { usedPercent: 3, resetDescription: '9:50 AM' }, weekly: { usedPercent: 2, resetDescription: '1:00 PM' } },
    cursor: { provider: 'cursor', status: 'ok', monthly: { usedPercent: 2.020596, resetDescription: 'Nov 5' } },
  });
  await h.menu(1003);
  const text = h.pages.at(-1).textObject[1].content;
  assert.match(text, /Claude\n  5h 3%/);
  assert.match(text, /Cursor\n  Monthly 2% \(Nov 5\)/);
  assert.ok(!text.includes('2.020596'));
});


test('Claude verified saved chat opens and polls even when the live tool screen is empty', async () => {
  const h = await harness();
  h.api.thread = async () => ({ text: '' });
  h.api.history = async () => ({ text: '/ Question\n> Earlier answer', source: 'claude-transcript' });
  await h.pick(2);
  assert.ok(h.pages.at(-1).textObject.some(c => c.content.includes('Earlier answer')));
  h.api.history = async () => ({ text: '/ Question\n> Earlier answer\n> Latest answer', source: 'claude-transcript' });
  for (const fn of h.timers.values()) await fn();
  assert.ok(h.upgrades.some(u => u.content.includes('Latest answer')));
});

const prompt = { id: 'question-a', question: 'Which test approach?', options: [
  { value: '1', label: 'First approach', description: 'Detailed first approach.' },
  { value: '2', label: 'Second approach' }, { value: '3', label: 'Type something.' },
] };

test('Claude progress keeps the public reply visible and freezes body updates on swipe', async () => {
  const h = await harness();
  h.threads[0].agent = 'claude';
  h.api.activity = async () => ({ state: 'working' });
  h.api.thread = async () => ({ text: '', progress: 'Reading files' });
  h.api.history = async () => ({ source: 'claude-transcript', text: '> Earlier reply' });
  await h.pick(2);
  assert.ok(h.pages.at(-1).textObject.some(c => c.content.includes('> Earlier reply\n~ Reading files')));
  h.api.thread = async () => ({ text: '', progress: 'Running a command' });
  await [...h.timers.values()][0]();
  assert.ok(h.upgrades.some(u => u.containerName === 'body' && u.content.includes('Earlier reply\n~ Running a command')));
  await h.scroll('up');
  const writes = h.upgrades.filter(u => u.containerName === 'body').length;
  h.api.thread = async () => ({ text: '', progress: 'Editing a file' });
  await [...h.timers.values()][0]();
  assert.equal(h.upgrades.filter(u => u.containerName === 'body').length, writes);
});

test('a newly detected prompt enables Click choices and confirmation sends only the selected number', async () => {
  const h = await harness();
  await h.pick(2);
  h.api.thread = async () => ({ text: 'Public reply', menu: prompt });
  await [...h.timers.values()][0]();
  await h.tap();
  assert.deepEqual([...h.pages.at(-1).listObject[0].itemContainer.itemName], ['1. First approach', '2. Second approach', '3. Type something.']);
  await h.pick(0);
  assert.ok(h.pages.at(-1).textObject.some(c => c.content.includes('Detailed first approach.')));
  assert.equal(h.choices.length, 0);
  h.api.thread = async () => ({ text: 'Reply after choice', menu: null });
  await h.tap();
  await h.flush();
  assert.deepEqual(h.choices, [{ handle: 'terminal-0', menuId: 'question-a', value: '1' }]);
  assert.equal(h.sends.length, 0);
  const count = h.pages.length;
  await h.tap();
  assert.equal(h.pages.length, count);
});

test('spoken choice is reviewed, then validated against the captured prompt without a free-text send', async () => {
  const h = await harness(2, true, 'hold');
  h.api.thread = async () => ({ text: '', menu: prompt });
  h.api.transcribe = async () => ({ text: 'Option two.' });
  await h.pick(2);
  h.press(); await h.flush(); h.audio(); h.release();
  await h.flush(); await h.flush();
  assert.ok(h.upgrades.some(u => u.containerName === 'voice' && u.content === '2. Second approach'));
  assert.equal(h.choices.length, 0);
  await h.tap(); await h.flush();
  assert.deepEqual(h.choices, [{ handle: 'terminal-0', menuId: 'question-a', value: '2' }]);
  assert.equal(h.sends.length, 0);
});

test('stale spoken choices fail without sending a sentence or automatically retrying', async () => {
  const h = await harness(2, true, 'hold');
  h.api.thread = async () => ({ text: '', menu: prompt });
  h.api.transcribe = async () => ({ text: 'One' });
  let attempts = 0;
  h.api.choice = async () => { attempts++; throw new Error('Question changed. Reopen the thread before choosing.'); };
  await h.pick(2);
  h.press(); await h.flush(); h.audio(); h.release();
  await h.flush(); await h.flush();
  await h.tap(); await h.flush();
  assert.equal(attempts, 1);
  assert.ok(h.upgrades.some(u => u.content.includes('Question changed')));
  assert.equal(h.sends.length, 0);
});

test('spoken option matching never infers a choice from a sentence containing a number', () => {
  assert.equal(textExports.choiceNumber('Option four.'), '4');
  assert.equal(textExports.choiceNumber('2'), '2');
  assert.equal(textExports.choiceNumber('I have one more question'), null);
  assert.equal(textExports.choiceNumber('not one'), null);
});


const workspaceThreads = [
  { handle: 'p', title: 'Archive session', agent: 'claude', state: 'idle', workspaceId: 'port', workspaceName: 'porttracker', workspaceLabel: 'porttracker' },
  { handle: 'g', title: 'Glasses session', agent: 'codex', state: 'busy', workspaceId: 'glass', workspaceName: 'orca-glass', workspaceLabel: 'orca-glass' },
  { handle: 's', title: 'Settings session', agent: 'claude', state: 'idle', workspaceId: 'pc', workspaceName: 'pc-settings', workspaceLabel: 'pc-settings' },
];

test('workspace multi-select stays open, persists, combines with agent filter and shows workspace/agent labels', async () => {
  const h = await harness();
  const saved = [];
  h.api.threads = async () => workspaceThreads;
  h.bridge.setLocalStorage = async (key, value) => { saved.push([key, value]); };
  await h.menu(1001);
  assert.match(menuItems(h)[0], /Filter by Agent/);
  assert.match(menuItems(h)[1], /Filter by Workspace/);
  const right = h.pages.at(-1).textObject.find(c => c.containerName === 'menu-right').content;
  assert.match(right, /\[porttracker\/Claude\]/);
  assert.match(right, /\[orca-glass\/Codex\]/);
  await h.pick(1);
  assert.deepEqual([...menuItems(h)], ['Done', '[x] All workspaces', '[ ] orca-glass', '[ ] pc-settings', '[ ] porttracker']);
  await h.pick(2);
  assert.equal(menuItems(h)[2], '[x] orca-glass');
  assert.match(h.pages.at(-1).textObject.find(c => c.containerName === 'body').content.split('\n')[2], /^>/);
  await h.pick(4);
  assert.equal(menuItems(h)[4], '[x] porttracker');
  assert.deepEqual(JSON.parse(saved.at(-1)[1]), ['glass', 'port']);
  await h.pick(0);
  assert.equal(menuItems(h).length, 4);
  assert.ok(menuItems(h).some(s => s.includes('Archive session')));
  assert.ok(!menuItems(h).some(s => s.includes('Settings session')));
  await h.pick(0); await h.pick(3);
  assert.equal(menuItems(h).length, 3);
  assert.ok(menuItems(h)[2].includes('Glasses session'));
  await h.pick(1); await h.pick(2); await h.pick(0);
  assert.equal(menuItems(h).length, 2);
  await h.pick(1); await h.pick(1); await h.pick(0);
  assert.equal(menuItems(h).length, 3);
  assert.deepEqual(saved.at(-1), ['view-workspaces', 'all']);
  assert.equal(h.sends.length + h.choices.length, 0);
});

test('restored workspace IDs survive missing sessions; empty and malformed preferences are distinct', async () => {
  const h = await harness(2, false, 'tap', '', 0, false, '["port"]');
  assert.equal(menuItems(h).length, 2);
  h.api.threads = async () => workspaceThreads;
  await h.menu(1001);
  assert.equal(menuItems(h).length, 3);
  assert.match(menuItems(h)[2], /Archive session/);
  const empty = await harness(2, false, 'tap', '', 0, false, '[]');
  assert.equal(menuItems(empty).length, 2);
  assert.match(empty.pages.at(-1).textObject.find(c => c.containerName === 'menu-right').content, /\[None\]/);
  const corrupt = await harness(2, false, 'tap', '', 0, false, '{bad');
  assert.equal(menuItems(corrupt).length, 4);
});

test('workspace picker pages reach every entry and saved unavailable workspaces can be cleared', async () => {
  const h = await harness(0, false, 'tap', '', 0, false, '["missing"]');
  h.api.workspaces = async () => Array.from({ length: 15 }, (_, i) => ({ id: `w${i}`, name: `Workspace ${String(i).padStart(2, '0')}` }));
  await h.pick(1);
  assert.ok(menuItems(h).some(s => s.includes('unavailable')));
  const seen = new Set();
  for (let page = 0; page < 5; page++) {
    const items = menuItems(h);
    items.filter(s => s.includes('Workspace ')).forEach(s => seen.add(s));
    assert.ok(items.length <= 9);
    assert.ok(!items.some(s => /^(Next|Previous) page$/.test(s)));
    if (seen.size === 15) break;
    for (let row = 0; row < items.length; row++) await h.scroll('down');
  }
  assert.equal(seen.size, 15);
  await h.back();
  assert.equal(menuItems(h).length, 2);
});


test('workspaces with the same project name are filtered by exact Orca ID', async () => {
  const h = await harness();
  h.api.threads = async () => [
    { ...workspaceThreads[0], workspaceId: 'main-id', workspaceLabel: 'porttracker' },
    { ...workspaceThreads[0], handle: 'child', title: 'Child session', workspaceId: 'child-id', workspaceLabel: 'porttracker / experiment' },
  ];
  await h.menu(1001); await h.pick(1);
  const child = menuItems(h).findIndex(s => s.includes('experiment'));
  await h.pick(child); await h.pick(0);
  assert.equal(menuItems(h).length, 3);
  assert.match(menuItems(h)[2], /Child session/);
});


test('session edge swipes change pages in both directions and clamp at the outer ends', async () => {
  const h = await harness(15);
  assert.equal(menuItems(h).length, 9);
  for (let i = 0; i < 9; i++) await h.scroll('down');
  assert.match(menuItems(h)[2], /Session 7/);
  assert.match(h.pages.at(-1).textObject.find(c => c.containerName === 'menu-cursor').content.split('\n')[0], /^>/);
  await h.scroll('up');
  assert.match(menuItems(h)[2], /Session 0/);
  assert.match(h.pages.at(-1).textObject.find(c => c.containerName === 'menu-cursor').content.split('\n')[8], /^>/);
  for (let i = 0; i < 8; i++) await h.scroll('up');
  const count = h.pages.length;
  await h.scroll('up');
  assert.equal(h.pages.length, count);
  for (let i = 0; i < 18; i++) await h.scroll('down');
  assert.equal(menuItems(h).length, 3);
  assert.match(menuItems(h)[2], /Session 14/);
  await h.scroll('down'); await h.scroll('down');
  const finalCount = h.pages.length;
  await h.scroll('down');
  assert.equal(h.pages.length, finalCount);
});

test('workspace edge swipes retain checks and reverse to the last row of the previous page', async () => {
  const h = await harness(0);
  h.api.workspaces = async () => Array.from({ length: 10 }, (_, i) => ({ id: `w${i}`, name: `Workspace ${String(i).padStart(2, '0')}` }));
  await h.pick(1);
  for (let i = 0; i < 8; i++) await h.scroll('down');
  await h.tap();
  assert.equal(menuItems(h)[8], '[x] Workspace 06');
  await h.scroll('down');
  assert.equal(menuItems(h)[2], '[ ] Workspace 07');
  assert.match(h.pages.at(-1).textObject.find(c => c.containerName === 'body').content, /^> Done/);
  await h.scroll('up');
  assert.equal(menuItems(h)[8], '[x] Workspace 06');
  assert.match(h.pages.at(-1).textObject.find(c => c.containerName === 'body').content.split('\n')[8], /^>/);
  await h.scroll('down');
  await h.pick(2);
  assert.equal(menuItems(h)[2], '[x] Workspace 07');
  await h.pick(0);
  assert.match(h.pages.at(-1).textObject.find(c => c.containerName === 'menu-right').content, /2 selected/);
});

test('rapid edge swipes and clicks cannot skip pages or activate a row during a page fetch', async () => {
  const h = await harness(20);
  for (let i = 0; i < 8; i++) await h.scroll('down');
  let finish, calls = 0;
  h.api.threads = () => { calls++; return new Promise(resolve => { finish = resolve; }); };
  await h.scroll('down'); await h.scroll('down'); await h.tap();
  assert.equal(calls, 1);
  finish(h.threads); await h.flush();
  assert.match(menuItems(h)[2], /Session 7/);
  assert.equal(h.sends.length + h.choices.length, 0);
});

test('an in-flight page fetch cannot reopen the glasses after system exit', async () => {
  const h = await harness(15);
  for (let i = 0; i < 8; i++) await h.scroll('down');
  let finish;
  h.api.threads = () => new Promise(resolve => { finish = resolve; });
  await h.scroll('down');
  const count = h.pages.length;
  await h.system(7);
  finish(h.threads); await h.flush();
  assert.equal(h.pages.length, count);
  assert.equal(h.timers.size, 0);
});
