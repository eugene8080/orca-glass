import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from '../app/node_modules/typescript/lib/typescript.js';

// The real dictionary, shared by every module below (one language state).
const i18nExports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/i18n.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: i18nExports });
const textExports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/text.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: textExports, TextEncoder });
const statusExports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/reader-status.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: statusExports, require: () => i18nExports });
const hintExports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/footer-hint.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: hintExports, require: () => i18nExports, document: { createElement: () => ({ getContext: () => ({ fillRect() {}, fillText() {}, getImageData: () => ({ data: new Uint8ClampedArray(280 * 28 * 4) }) }) }) } });
const usageResetExports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/usage-reset.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: usageResetExports, require: () => i18nExports });

const glyphExports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/fonts/glyphs.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: glyphExports });
const fineExports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/fine-text.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: fineExports, require: name => name === './i18n' ? i18nExports : glyphExports, Uint8ClampedArray });
const filterExports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/filters.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: filterExports, require: () => i18nExports });

const listExports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/src/session-list.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: listExports, __APP_VERSION__: '1.0.12', require: name => name === './i18n' ? i18nExports : textExports, TextEncoder, document: { createElement: () => ({ getContext: () => ({ font: '', measureText: t => ({ width: t.length * 10 }) }) }) } });

// Exercise the real controller with a simulated Even bridge: no agent input,
// microphone access, network, or hardware claims.
async function harness(count = 2, voice = false, mode = 'tap', savedView = '', startupResult = 0, rejectAlignedMenu = false, savedWorkspaces = '', savedUsage = '', savedOpen = '') {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { value: '', hidden: false, textContent: '', listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; } });
    return elements.get(id);
  };
  const threads = Array.from({ length: count }, (_, i) => ({ handle: `terminal-${i}`, title: `Session ${i}`, agent: 'codex', state: 'unknown' }));
  const pages = [], sends = [], choices = [], timers = new Map(), mic = [], upgrades = [], transcriptions = [], images = [];
  const animations = new Map();
  let timerId = 0, event, phoneDeps;
  const windowListeners = new Map();
  const phoneCalls = [];
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
    getLocalStorage: async key => key === 'code' ? 'demo' : key === 'recording-mode' ? mode : key === 'lang' ? 'en' : key === 'view-provider' ? savedView : key === 'view-workspaces' ? savedWorkspaces : key === 'usage-reset-mode' ? savedUsage : key === 'open-thread' ? savedOpen : '',
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
    // Real dictionary; the page-filling DOM step is a no-op without a document.
    './i18n': { ...i18nExports, applyPage() {} },
    './text': textExports,
    './reader-status': statusExports,
    './footer-hint': hintExports,
    './usage-reset': usageResetExports,
    './session-list': listExports,
    './filters': filterExports,
    './fine-text': fineExports,
    // The phone page is DOM-only and checked in a browser preview; the glasses tests see a no-op.
    './phone': { createPhone: deps => { phoneDeps = deps; return { connection: c => phoneCalls.push(['connection', c.state]), load() {}, render: () => phoneCalls.push(['render']), retranslate: () => phoneCalls.push(['retranslate']) }; } },
  };
  const source = ts.transpileModule(readFileSync(new URL('../app/src/main.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, {
    exports: {}, require: name => imports[name], document: { getElementById: element },
    location: { search: '' }, window: { addEventListener(name, fn) { windowListeners.set(name, fn); } }, URLSearchParams, Uint8Array, TextEncoder,
    setInterval: (fn, delay) => { (delay === 200 ? animations : timers).set(++timerId, fn); return timerId; },
    clearInterval: id => { timers.delete(id); animations.delete(id); },
  });
  const flush = () => new Promise(resolve => setImmediate(resolve));
  await flush();
  return { api, bridge, elements, pages, sends, choices, threads, timers, animations, mic, upgrades, images, transcriptions, flush, phone: () => phoneDeps, phoneCalls,
    menu: async id => { event({ menuItemClickEvent: { itemID: id } }); await flush(); },
    system: async type => { event({ sysEvent: { eventType: type } }); await flush(); },
    press: () => { event({ sysEvent: { eventType: 9 } }); },
    release: () => { event({ sysEvent: { eventType: 10 } }); },
    audio: () => { event({ audioEvent: { audioPcm: new Uint8Array(32000) } }); },
    pick: async i => { event({ listEvent: { currentSelectItemIndex: i, eventType: 0 } }); await flush(); },
    tap: async () => { event({ textEvent: { eventType: 0 } }); await flush(); },
    back: async () => { event({ textEvent: { eventType: 3 } }); await flush(); },
    scroll: async direction => { event({ textEvent: { eventType: direction === 'up' ? 1 : 2 } }); await flush(); },
    pagehide: () => { windowListeners.get('pagehide')?.(); },
  };
}

const voiceBody = h => h.upgrades.findLast(u => u.containerName === 'voice-body')?.content;
const statusHint = h => h.upgrades.findLast(u => u.containerName === 'hint').content.trim();
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
  // No title row: the first row is Hermes Agent.
  assert.equal(h.pages.at(-1).textObject[0].content, ' ');
  assert.equal(menuItems(h)[0], 'Hermes Agent');
});

test('Filter by Agent lists Hermes Agent, then All Orca sessions and each Orca agent', async () => {
  const h = await harness();
  h.api.threads = async () => [
    { handle: 'codex', title: 'Codex conversation', agent: 'codex' },
    { handle: 'open', title: 'OpenCode worker', agent: 'opencode' },
    { handle: 'gemini', title: 'Gemini conversation', agent: 'gemini' },
  ];
  const saved = [];
  h.bridge.setLocalStorage = async (key, value) => { saved.push([key, value]); };
  await h.pick(0);
  // No title, divider or back row; double-click returns.
  assert.equal(JSON.stringify([...menuItems(h)]),
    JSON.stringify(['Hermes Agent', 'All Orca Sessions ✓', 'Claude', 'Codex', 'OpenCode', 'Gemini']));
  // The cursor opens on the ticked row.
  await h.scroll('up');
  assert.match(h.upgrades.at(-1).content.split('\n')[0], /^> Hermes Agent/);
  await h.scroll('down');
  assert.match(h.upgrades.at(-1).content.split('\n')[1], /^> All Orca Sessions/);
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
  assert.equal(JSON.stringify([...menuItems(h)]), JSON.stringify(['Hermes Agent', 'All Orca Sessions ✓', 'Claude', 'Codex']));
  // All Orca Sessions never includes Hermes.
  assert.ok(!menuItems(h).some(s => /^Hermes (?!Agent)/.test(s)));
  await h.pick(0);
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
  assert.equal(hintExports.compactDuration(812), '13m32s');
  assert.equal(hintExports.compactDuration(3725), '1h02m');
  assert.equal(hintExports.compactDuration(NaN), '');
  assert.equal(hintExports.statusRight(812, false, 'Pg7/8'), '13m32s [Tap&Hold for Input] Pg7/8');
  assert.equal(hintExports.statusRight(null, false, 'Pg7/8', t => t.length <= 12), '[T&H] Pg7/8');
  assert.equal(hintExports.statusRight(null, false, 'Pg7/8', t => t.length <= 6), 'Pg7/8');
  assert.equal(hintExports.statusRight(null, true, 'Pg1/2'), '[Click:choices] Pg1/2');
});

test('working words last five seconds and Braille patterns are distinct', () => {
  assert.match(statusExports.readerStatus('working', 0, 0), /Processing\.$/);
  assert.match(statusExports.readerStatus('working', 1, 500), /Processing\.\.$/);
  assert.match(statusExports.readerStatus('working', 2, 1000), /Processing\.\.\.$/);
  assert.match(statusExports.readerStatus('working', 0, 4999), /Processing/);
  assert.match(statusExports.readerStatus('working', 0, 5000), /Thinking\.$/);
  assert.equal(new Set(statusExports.SPINNER.map(s => JSON.stringify(statusExports.statusPixels(s)))).size, 10);
});

test('hold opens a full-screen voice page; release reviews; only explicit send submits once', async () => {
  const h = await harness(2, true, 'hold');
  await h.pick(2);
  const readerBuilds = h.pages.length;
  h.press(); await h.flush();
  const voicePage = h.pages.at(-1);
  assert.equal(h.pages.length, readerBuilds + 1);
  assert.equal(voicePage.containerTotalNum, 4);
  assert.equal(voicePage.textObject.find(c => c.containerName === 'voice-hint').content, 'Listening… release to review');
  h.audio(); h.release(); await h.flush();
  assert.deepEqual(h.mic, [true, false]);
  assert.equal(h.transcriptions.length, 1);
  assert.equal(h.sends.length, 0);
  assert.match(voiceBody(h), /A voice test\./);
  assert.equal(h.upgrades.findLast(u => u.containerName === 'voice-hint').content, 'Tap to send / Double tap to cancel');
  await h.tap();
  assert.equal(h.sends.length, 1);
  assert.ok(h.pages.at(-1).textObject.some(c => c.containerName === 'hint'), 'send returns to the chat');
  h.release(); await h.flush();
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

test('reader flips nine-row pages, shows position, clamps ends and freezes incoming text', async () => {
  const h = await harness();
  const output = Array.from({ length: 30 }, (_, i) => `Line ${i}`).join('\n');
  h.api.thread = async () => ({ text: output });
  await h.pick(2);
  assert.equal(h.pages.at(-1).textObject[1].content, 'Line 27\nLine 28\nLine 29');
  assert.match(h.pages.at(-1).textObject.find(c => c.containerName === 'hint').content.trim(), /Pg4\/4$/);
  const body = () => h.upgrades.findLast(u => u.containerName === 'body')?.content;
  await h.scroll('up');
  assert.equal(body(), Array.from({ length: 9 }, (_, i) => `Line ${i + 18}`).join('\n'));
  assert.match(statusHint(h), /Pg3\/4$/);
  await h.scroll('up'); await h.scroll('up');
  assert.match(statusHint(h), /Pg1\/4$/);
  const writes = h.upgrades.length;
  await h.scroll('up');
  h.api.thread = async () => ({ text: 'Updated output' });
  await [...h.timers.values()][0]();
  assert.equal(h.upgrades.length, writes);
  const count = h.pages.length;
  await h.tap();
  assert.equal(h.pages.length, count);
  assert.equal(h.upgrades.length, writes);
  await h.scroll('down');
  assert.equal(body(), Array.from({ length: 9 }, (_, i) => `Line ${i + 9}`).join('\n'));
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
  assert.match(voiceBody(h), /First words and final words/);
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
  assert.ok(h.pages.at(-1).textObject.some(c => c.containerName === 'hint'), 'cancel returns to the chat');
  assert.ok(h.upgrades.every(u => !u.content.includes('Late caption')));
  assert.equal(h.sends.length, 0);
});

test('saved history is reachable in both directions without dropped or renumbered nested items', async () => {
  const h = await harness();
  const text = '> Open items:\n' + Array.from({ length: 19 }, (_, i) => `  ${i + 1}. Item ${i + 1}`).join('\n') + '\n  - Group\n    1. Nested one\n    2. Nested two';
  h.api.history = async () => ({ text, source: 'claude-transcript' });
  await h.pick(2);
  const expected = [...textExports.readerPages(text, t => textExports.glassTextWidth(t), 552, 9)];
  // A single response opens at its top (page 1); page down through the rest.
  const seen = [h.pages.at(-1).textObject[1].content];
  const pageCount = h.pages.length;
  for (let i = 1; i < expected.length; i++) {
    await h.scroll('down');
    seen.push(h.upgrades.findLast(u => u.containerName === 'body').content);
  }
  assert.deepEqual(seen, expected);
  assert.equal(seen.join('\n'), text);
  for (let i = 1; i <= 19; i++) assert.ok(seen.join('\n').includes(`  ${i}. Item ${i}`));
  for (let i = 1; i < expected.length; i++) await h.scroll('up');
  assert.equal(h.upgrades.findLast(u => u.containerName === 'body').content, expected[0]);
  const writes = h.upgrades.length;
  h.api.history = async () => ({ text: text + '\nNew output', source: 'claude-transcript' });
  await [...h.timers.values()][0]();
  assert.equal(h.upgrades.length, writes);
  assert.equal(h.pages.length, pageCount);
  assert.equal(h.sends.length, 0);
});

test('rapid reader swipes serialize writes and never rebuild the page or send input', async () => {
  const h = await harness();
  h.api.thread = async () => ({ text: Array.from({ length: 30 }, (_, i) => `Line ${i}`).join('\n') });
  await h.pick(2);
  let release;
  const original = h.bridge.textContainerUpgrade;
  h.bridge.textContainerUpgrade = value => {
    if (value.containerName !== 'body') return original(value);
    h.bridge.textContainerUpgrade = original;
    return new Promise(resolve => { release = () => { original(value); resolve(true); }; });
  };
  const rebuilds = h.pages.length;
  await h.scroll('up'); await h.scroll('up'); await h.scroll('up');
  release(); await h.flush();
  assert.equal(h.upgrades.findLast(u => u.containerName === 'body').content, Array.from({ length: 9 }, (_, i) => `Line ${i}`).join('\n'));
  assert.match(statusHint(h), /Pg1\/4$/);
  assert.equal(h.pages.length, rebuilds);
  assert.equal(h.sends.length, 0);
});

test('reader page wrapping retains every character with proportional widths and Unicode budgets', () => {
  const measure = t => [...t].reduce((n, c) => n + (c === 'W' ? 24 : 9), 0);
  const text = Array.from({ length: 19 }, (_, i) => `  ${i + 1}. WWW item ${i + 1} with wide words and punctuation; ` + '🙂'.repeat(100)).join('\n');
  const pages = [...textExports.readerPages(text, measure)];
  // Wrapping adds hanging-indent spaces and drops wrap-point spaces only.
  assert.equal(pages.join('').replace(/\s/g, ''), text.replace(/\s/g, ''));
  assert.ok(pages.every(page => page.split('\n').length <= 6 && new TextEncoder().encode(page).length <= 900));
  assert.ok(pages.every(page => page.split('\n').every(row => measure(row) <= 550)));
  assert.ok(pages.some(page => page.includes('19.')));
});

test('hold starts directly from chat even with a saved tap preference, without menu checks', async () => {
  const h = await harness(2, true, 'tap');
  await h.pick(2);
  const before = h.pages.length;
  h.api.thread = async () => { throw new Error('No pre-record menu lookup should run'); };
  h.api.capabilities = async () => { throw new Error('No pre-record capability lookup should run'); };
  h.press(); await h.flush();
  assert.deepEqual(h.mic, [true]);
  assert.equal(h.pages.length, before + 1);
  assert.equal(h.pages.at(-1).listObject, undefined);
  assert.equal(h.pages.at(-1).textObject.find(c => c.containerName === 'voice-hint').content, 'Listening… release to review');
  await h.back();
  assert.equal(h.sends.length, 0);
});

test('double-click discards a finished voice draft without sending', async () => {
  const h = await harness(2, true, 'hold');
  await h.pick(2); h.press(); await h.flush(); h.audio(); h.release(); await h.flush();
  assert.equal(voiceBody(h), 'A voice test.');
  await h.back();
  assert.equal(h.sends.length, 0);
  assert.equal(h.pages.at(-1).textObject[1].content, 'Content terminal-0');
  h.press(); await h.flush();
  assert.equal(h.mic.at(-1), true);
  await h.back();
});


test('voice send and cancel both return to the newest chat page and resume live updates', async () => {
  for (const send of [true, false]) {
    const h = await harness(2, true, 'hold');
    const text = Array.from({ length: 30 }, (_, i) => `Line ${i}`).join('\n');
    h.api.history = async () => ({ text, source: 'codex-transcript' });
    await h.pick(2); await h.scroll('up'); await h.scroll('up');
    assert.match(statusHint(h), /Pg2\/4$/);
    h.press(); await h.flush(); h.audio(); h.release(); await h.flush();
    assert.equal(h.sends.length, 0);
    if (send) await h.tap(); else await h.back();
    await h.flush();
    const page = h.pages.at(-1);
    assert.equal(page.textObject.find(c => c.containerName === 'body').content, 'Line 27\nLine 28\nLine 29');
    assert.match(page.textObject.find(c => c.containerName === 'hint').content.trim(), /Pg4\/4$/);
    assert.equal(h.sends.length, send ? 1 : 0);
    assert.equal(h.timers.size, 1);
    h.api.history = async () => ({ text: `${text}\nLine 30`, source: 'codex-transcript' });
    await [...h.timers.values()][0]();
    assert.equal(h.upgrades.findLast(u => u.containerName === 'body').content, 'Line 27\nLine 28\nLine 29\nLine 30');
  }
});

test('a rejected voice page keeps the chat, never starts the microphone and resumes polling', async () => {
  const h = await harness(2, true, 'hold');
  await h.pick(2);
  const rebuild = h.bridge.rebuildPageContainer;
  h.bridge.rebuildPageContainer = async p => p.textObject.some(c => c.containerName === 'voice-body') ? false : rebuild(p);
  h.press(); await h.flush();
  assert.notEqual(h.mic.at(-1), true);
  assert.match(h.elements.get('diag').textContent, /rejected/);
  assert.equal(h.sends.length, 0);
  assert.equal(h.timers.size, 1);
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
  assert.equal(h.upgrades.findLast(u => u.containerName === 'voice').content, '/Waiting');
  assert.ok(h.upgrades.every(u => ['voice', 'hint'].includes(u.containerName)));
  assert.equal(h.pages.length, pages);
});

test('initial reader status is fetched before rendering rather than waiting for phone timers', async () => {
  const h = await harness();
  h.api.activity = async () => ({ state: 'working' });
  await h.pick(2);
  assert.equal(h.pages.at(-1).textObject.find(c => c.containerName === 'voice').content, '    Processing.');
});

test('late activity cannot write to the voice page; cancel restores status and live polling', async () => {
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
  await h.back(); await h.flush();
  assert.equal(h.pages.at(-1).textObject.find(c => c.containerName === 'voice').content, '    Processing.');
  h.api.activity = async () => ({ state: 'waiting' });
  await [...h.timers.values()][0]();
  assert.equal(h.upgrades.findLast(u => u.containerName === 'voice').content, '/Waiting');
});

test('saved history losing its association falls back to live output and keeps updating', async () => {
  const h = await harness();
  h.api.history = async () => ({ text: 'Saved conversation', source: 'codex-transcript' });
  await h.pick(2);
  h.api.history = async () => ({ text: 'Raw buffer', source: 'terminal-buffer' });
  h.api.thread = async () => ({ text: 'New live reply' });
  await [...h.timers.values()][0]();
  assert.equal(h.upgrades.findLast(u => u.containerName === 'body').content, 'New live reply');
  h.api.history = async () => { throw new Error('Must stay on the live source'); };
  h.api.thread = async () => ({ text: 'Next live reply' });
  await [...h.timers.values()][0]();
  assert.equal(h.upgrades.findLast(u => u.containerName === 'body').content, 'Next live reply');
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
  assert.equal(h.upgrades.findLast(u => u.containerName === 'body').content, 'Fresh reply');
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
  assert.equal(frame.borderWidth, 1);
  assert.equal(divider.borderWidth, 1);
  assert.equal(divider.height, 1);
  assert.equal(h.pages.at(-1).textObject.find(c => c.containerName === 'voice').content, '/Status unknown');
});

test('reader and voice pages use contiguous IDs; voice page has nine transcript rows and one instruction row', async () => {
  const h = await harness(2, true, 'hold');
  await h.pick(2);
  const reader = h.pages.at(-1);
  assert.equal(reader.containerTotalNum, 7);
  const list = values => JSON.stringify([...values]);
  assert.equal(list(reader.imageObject.map(c => c.containerName)), list(['status-icon']));
  assert.equal(list([...reader.textObject, ...reader.imageObject].map(c => c.containerID).sort((a, b) => a - b)), list([1, 2, 3, 4, 5, 6, 7]));
  assert.equal(list([...reader.textObject, ...reader.imageObject].map(c => c.zOrderIndex).sort((a, b) => a - b)), list([0, 1, 2, 3, 4, 5, 6]));
  h.press(); await h.flush(); h.audio(); h.release(); await h.flush();
  const voice = h.pages.at(-1);
  assert.equal(list(voice.textObject.map(c => c.containerID).sort((a, b) => a - b)), list([1, 2, 3, 4]));
  const body = voice.textObject.find(c => c.containerName === 'voice-body');
  const hint = voice.textObject.find(c => c.containerName === 'voice-hint');
  const divider = voice.textObject.find(c => c.containerName === 'voice-divider');
  assert.equal(body.height, 243);
  assert.equal(body.isEventCapture, 1);
  assert.ok(body.yPosition + body.height < divider.yPosition);
  assert.ok(divider.yPosition + divider.height <= hint.yPosition);
  assert.equal(hint.height, 28);
  assert.ok(hint.yPosition + hint.height <= 288);
  await h.back();
  assert.equal(h.images.filter(i => i.containerName.startsWith('voice-border')).length, 0);
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
  assert.match(columns.find(c => c.containerName === 'menu-right').content.split('\n')[0], /All Orca sessions/);
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

test('reader has no title row, nine chat rows, a divider and one status row', async () => {
  const h = await harness();
  await h.pick(2);
  const page = h.pages.at(-1);
  const body = page.textObject.find(c => c.containerName === 'body');
  const voice = page.textObject.find(c => c.containerName === 'voice');
  const hint = page.textObject.find(c => c.containerName === 'hint');
  const divider = page.textObject.find(c => c.containerName === 'divider');
  assert.equal(page.textObject.find(c => c.containerName === 'head').content, ' ');
  assert.equal(body.yPosition, 4);
  assert.equal(body.height, 243);
  assert.equal(body.xPosition, 8);
  assert.equal(body.width, 560);
  assert.equal(body.paddingLength, 0);
  assert.ok(body.yPosition + body.height < divider.yPosition);
  for (const row of [voice, hint]) {
    assert.equal(row.height, 28);
    assert.ok(divider.yPosition + divider.height <= row.yPosition);
    assert.ok(row.yPosition + row.height < 288);
  }
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

test('voice review shows a multi-line transcript on the full-screen page', async () => {
  const h = await harness(2, true, 'hold');
  await h.pick(2);
  h.api.transcribe = async () => ({ text: 'First line.\nSecond line.\nThird line.' });
  h.press(); await h.flush(); h.audio(); h.release(); await h.flush();
  assert.equal(voiceBody(h), 'First line.\nSecond line.\nThird line.');
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

test('locking the phone keeps the open chat polling', async () => {
  const h = await harness();
  await h.pick(2);
  const running = h.timers.size;
  assert.ok(running >= 1);
  h.pagehide();
  assert.equal(h.timers.size, running);
});

test('a recreated page reopens the chat that was on screen', async () => {
  const h = await harness(2, false, 'tap', '', 0, false, '', '', 'terminal-1');
  assert.equal(h.pages.at(-1).textObject.find(c => c.containerName === 'body').content, 'Content terminal-1');
  assert.ok(h.timers.size >= 1);
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
  assert.equal(h.pages.at(-1).textObject[0].content, 'New 1/4 Workspace');
  assert.equal(menuItems(h)[0], 'Fixture workspace');
  assert.equal(h.pages.at(-1).menuObject, undefined);
  await h.back();
  h.api.usage = async () => ({ codex: { provider: 'codex', status: 'ok', weekly: { usedPercent: 25, resetDescription: 'tomorrow' } } });
  await h.menu(1003);
  assert.equal(h.pages.at(-1).textObject[0].content, 'Usage');
  assert.match(h.pages.at(-1).textObject[1].content, /25%/);
  await h.back(); await h.pick(2);
  // The reader's own menu only switches text size; session-list actions do nothing there.
  assert.equal(JSON.stringify(h.pages.at(-1).menuObject.menuItems.map(i => [i.itemID, i.itemName])),
    JSON.stringify([[1101, 'Using: Native text'], [1102, 'Native text'], [1110, 'Misc Fixed 9x15'], [1111, 'GohuFont 8x14'],
      [1112, 'Departure 7x14'], [1113, 'Misc Fixed 6x13'], [1114, 'Shinonome 6x12'], [1106, 'Smaller fonts'], [1107, 'Brightness 15']]));
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
  assert.ok(h.upgrades.some(u => u.containerName === 'voice-body' && u.content === '2. Second approach'));
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
  const seen = new Set();
  let unavailable = false;
  for (let page = 0; page < 5; page++) {
    const items = menuItems(h);
    unavailable ||= items.some(s => s.includes('unavailable'));
    items.filter(s => s.includes('Workspace ')).forEach(s => seen.add(s));
    assert.ok(items.length <= 10);
    assert.ok(!items.some(s => /^(Next|Previous) page$/.test(s)));
    if (seen.size === 15 && unavailable) break;
    for (let row = 0; row < items.length; row++) await h.scroll('down');
  }
  assert.equal(seen.size, 15);
  assert.ok(unavailable, 'saved missing workspace is listed so it can be cleared');
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
  // No activity times: no headings; Done, All and eight workspaces fill ten rows.
  assert.equal(menuItems(h).length, 10);
  for (let i = 0; i < 9; i++) await h.scroll('down');
  await h.tap();
  assert.equal(menuItems(h)[9], '[x] Workspace 07');
  await h.scroll('down');
  assert.equal(menuItems(h)[2], '[ ] Workspace 08');
  assert.match(h.pages.at(-1).textObject.find(c => c.containerName === 'body').content, /^> Done/);
  await h.scroll('up');
  assert.equal(menuItems(h)[9], '[x] Workspace 07');
  assert.match(h.pages.at(-1).textObject.find(c => c.containerName === 'body').content.split('\n')[9], /^>/);
  await h.scroll('down');
  await h.pick(2);
  assert.equal(menuItems(h)[2], '[x] Workspace 08');
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

test('Usage top toggle cycles and persists three reset modes without re-fetching or rebuilding the page', async () => {
  const h = await harness();
  let requests = 0;
  const saved = [];
  h.bridge.setLocalStorage = async (key, value) => { saved.push([key, value]); };
  h.api.usage = async () => { requests++; return { codex: { provider: 'codex', status: 'ok', weekly: {
    usedPercent: 42, resetsAt: Date.now() + (2 * 1440 + 5 * 60 + 12) * 60000,
    resetDescription: 'Original label', computerResetDescription: 'Thu 1:12 AM',
  } } }; };
  await h.menu(1003);
  const page = h.pages.at(-1), count = h.pages.length;
  assert.equal(page.containerTotalNum, 3);
  const toggle = page.textObject.find(c => c.containerName === 'usage-reset');
  assert.match(toggle.content, /Computer time/);
  assert.ok(page.textObject.find(c => c.containerName === 'body').yPosition >= toggle.yPosition + toggle.height);
  await h.tap();
  assert.match(h.upgrades.findLast(u => u.containerName === 'usage-reset').content, /Phone time/);
  await h.tap();
  assert.match(h.upgrades.findLast(u => u.containerName === 'usage-reset').content, /Absolute time/);
  assert.match(h.upgrades.findLast(u => u.containerName === 'body').content, /2d5h12m/);
  await h.tap();
  assert.match(h.upgrades.findLast(u => u.containerName === 'body').content, /Thu 1:12 AM/);
  assert.deepEqual(saved, [['usage-reset-mode', 'phone'], ['usage-reset-mode', 'absolute'], ['usage-reset-mode', 'computer']]);
  assert.equal(requests, 1);
  assert.equal(h.pages.length, count);
  for (const u of h.upgrades.filter(u => u.containerName === 'usage-reset')) assert.ok(!('xPosition' in u || 'width' in u));
  await h.back();
  assert.match(menuItems(h)[0], /Filter by Agent/);
});

test('Usage restores its saved reset mode', async () => {
  const h = await harness(2, false, 'tap', '', 0, false, '', 'absolute');
  h.api.usage = async () => ({ cursor: { provider: 'cursor', status: 'ok', monthly: { usedPercent: 2, resetsAt: Date.now() - 1000, resetDescription: 'Old label' } } });
  await h.menu(1003);
  assert.match(h.pages.at(-1).textObject.find(c => c.containerName === 'usage-reset').content, /Absolute time/);
  assert.match(h.pages.at(-1).textObject.find(c => c.containerName === 'body').content, /Monthly 2% \(0m\)/);
});

test('native text widths use measured firmware advances so rows reach the right edge', () => {
  // Values measured in the native simulator; Arial 21px would report ~10-15% more.
  assert.equal(textExports.glassTextWidth('Page 2 of 2'), 98);
  assert.equal(textExports.glassTextWidth('[Tap & hold to input]'), 177);
  assert.equal(textExports.glassTextWidth('…', () => 9), 9);
  const prose = 'The reader now wraps every row with the measured firmware glyph widths instead of the wider browser Arial estimate, so each row runs close to the frame.';
  const rows = textExports.readerPages(prose, t => textExports.glassTextWidth(t), 552)[0].split('\n');
  assert.ok(rows.every(row => textExports.glassTextWidth(row) <= 552));
  assert.ok(textExports.glassTextWidth(rows[0]) > 500, 'first row should fill most of the 560px body');
  // Right-aligned labels keep 3px slack: a 278px line wrapped in a 280px container.
  const padded = listExports.nativeRight('Page 2 of 2', 280);
  assert.ok(textExports.glassTextWidth(padded) <= 277 && textExports.glassTextWidth(padded) > 270);
});

test('session titles extend to their own label and keep the handle suffix', () => {
  const title = listExports.menuTitle('Campaign A50 exception loads and remaining scope review · a1b2c3', 300);
  assert.ok(title.endsWith('… · a1b2c3'), title);
  assert.equal(listExports.menuTitle('Short title · a1b2c3', 300), 'Short title · a1b2c3');
});

test('swiping down on the last page resumes live updates and refreshes at once', async () => {
  const h = await harness();
  const lines = n => Array.from({ length: n }, (_, i) => `Line ${i}`).join('\n');
  h.api.thread = async () => ({ text: lines(12) });
  await h.pick(2);
  const body = () => h.upgrades.findLast(u => u.containerName === 'body')?.content;
  await h.scroll('up');                       // Browsing freezes the snapshot.
  await h.scroll('down');                     // Back on the last page: still frozen.
  assert.match(statusHint(h), /Pg2\/2$/);
  h.api.thread = async () => ({ text: lines(20) });
  await [...h.timers.values()][0]();
  assert.equal(body(), 'Line 9\nLine 10\nLine 11');   // Frozen poll ignored the new output.
  const rebuilds = h.pages.length;
  await h.scroll('down');                     // Swipe past the last page: refresh.
  await h.flush();
  assert.ok(h.upgrades.some(u => u.containerName === 'hint' && /Refreshing…$/.test(u.content.trim())));
  assert.equal(body(), 'Line 18\nLine 19');
  assert.match(statusHint(h), /Pg3\/3$/);
  assert.equal(h.pages.length, rebuilds);
  assert.equal(h.sends.length, 0);
  h.api.thread = async () => ({ text: lines(21) });
  await [...h.timers.values()].at(-1)();      // Live polling continues afterwards.
  assert.equal(body(), 'Line 18\nLine 19\nLine 20');
});

test('opening a session shows the page that starts the latest response', async () => {
  const h = await harness();
  const earlier = Array.from({ length: 9 }, (_, i) => `  earlier line ${i}`).join('\n');
  const latest = Array.from({ length: 9 }, (_, i) => `  latest line ${i}`).join('\n');
  const text = `/ first question\n> First answer\n${earlier}\n/ second question\n> Progress note before the answer.\n> Latest answer starts here\n${latest}`;
  h.api.history = async () => ({ text, source: 'claude-transcript' });
  await h.pick(2);
  const open = h.pages.at(-1);
  assert.match(open.textObject[1].content, /^> Latest answer starts here\n/);
  const hint = open.textObject.find(c => c.containerName === 'hint').content.trim();
  const [, page, total] = hint.match(/Pg(\d+)\/(\d+)$/);
  assert.ok(Number(page) < Number(total), 'long response opens before the last page');
  // Earlier pages remain reachable and every character is kept.
  assert.equal(textExports.latestResponseStart(text), text.indexOf('> Latest'));
  assert.equal(textExports.latestResponseStart('/ only a question'), -1);
  assert.equal(textExports.latestResponseStart('plain terminal text'), -1);
});

test('status row shows the model and shrinks the hint to fit one row', async () => {
  const h = await harness();
  h.api.history = async () => ({ text: '/ question\n> answer', source: 'claude-transcript', model: 'Opus5.5' });
  h.api.activity = async () => ({ state: 'waiting' });
  await h.pick(2);
  const page = h.pages.at(-1);
  assert.equal(page.textObject.find(c => c.containerName === 'voice').content, 'Opus5.5 /Waiting');
  // The spinner image sits right after the model name.
  assert.equal(page.imageObject[0].xPosition, 16 + listExports.glassWidth('Opus5.5 '));
  assert.equal(page.textObject.find(c => c.containerName === 'hint').content.trim(), '[Tap&Hold for Input] Pg1/1');
  // A model switch rebuilds the page so the spinner image moves with the name.
  h.api.history = async () => ({ text: '/ question\n> answer', source: 'claude-transcript', model: 'Sonnet5.5' });
  await [...h.timers.values()][0]();
  assert.equal(h.pages.at(-1).textObject.find(c => c.containerName === 'voice').content, 'Sonnet5.5 /Waiting');
  assert.equal(h.pages.at(-1).imageObject[0].xPosition, 16 + listExports.glassWidth('Sonnet5.5 '));
  // The widest working state cannot fit the full hint next to a long model.
  const w = t => textExports.glassTextWidth(t, () => 12);
  h.api.history = async () => ({ text: '/ question\n> answer', source: 'codex-transcript', model: 'GPT-6-Astra med' });
  h.api.activity = async () => ({ state: 'working', elapsedSeconds: 812 });
  await [...h.timers.values()][0]();
  // The model change rebuilt the page; its hint is the current one.
  const right = h.pages.at(-1).textObject.find(c => c.containerName === 'hint').content.trim();
  assert.match(right, /^13m32s (?:\[T&H\] )?Pg1\/1$/);
  const left = Math.max(...statusExports.WORKING_LABELS.map(word => w(`GPT-6-Astra med     ${word}...`)));
  assert.ok(left + 10 + w(right) <= 538, `${left} + ${w(right)}`);
});

test('four-digit page counters shrink the hint instead of wrapping the status row', async () => {
  const h = await harness();
  h.api.history = async () => ({ text: Array.from({ length: 13200 }, (_, i) => `> Row ${i}`).join('\n'), source: 'codex-transcript', model: 'GPT-6-Astra med' });
  h.api.activity = async () => ({ state: 'working', elapsedSeconds: 812 });
  await h.pick(2);
  const right = h.pages.at(-1).textObject.find(c => c.containerName === 'hint').content.trim();
  assert.match(right, /^13m32s (?:\[T&H\] )?Pg\d{4}\/\d{4}$/);
  const w = t => textExports.glassTextWidth(t, () => 12);
  const left = Math.max(...statusExports.WORKING_LABELS.map(word => w(`GPT-6-Astra med     ${word}...`)));
  assert.ok(left + 10 + w(right) <= 538 && w(right) <= 274, `${left} + ${w(right)}`);
});

test('workspace picker has no title, lists four recent workspaces first and the cursor skips headings', async () => {
  const h = await harness(0);
  const names = ['zeta', 'ai-family-office', 'porttracker', 'ai-stock-picker-and-alerts-app', 'orca-glass', 'pc-settings', 'bamboa', 'desk', 'market-sessions', 'union-mq'];
  // Activity order (newest first): porttracker, orca-glass, pc-settings, zeta, then older.
  const times = { porttracker: 900, 'orca-glass': 800, 'pc-settings': 700, zeta: 600, desk: 100 };
  h.api.workspaces = async () => names.map(name => ({ id: name, name, lastActivityAt: times[name] }));
  await h.pick(1);
  const page = h.pages.at(-1);
  assert.equal(page.textObject.find(c => c.containerName === 'head').content, ' ');
  const body = page.textObject.find(c => c.containerName === 'body');
  assert.equal(body.yPosition, 4);
  assert.ok(body.height >= 270);
  assert.equal(JSON.stringify([...menuItems(h)]), JSON.stringify(['Done', '[x] All workspaces', 'Recent workspaces',
    '[ ] porttracker', '[ ] orca-glass', '[ ] pc-settings', '[ ] zeta', 'Other workspaces',
    '[ ] ai-family-office', '[ ] ai-stock-picker-and-alerts-app']));
  const rows = body.content.split('\n');
  assert.equal(rows[2], 'Recent workspaces');                 // Headings carry no cursor column.
  await h.scroll('down'); await h.scroll('down');             // All -> skips heading -> porttracker.
  assert.match(h.upgrades.at(-1).content.split('\n')[3], /^> \[ \] porttracker/);
  for (let i = 0; i < 4; i++) await h.scroll('down');         // zeta -> skips heading -> ai-family-office.
  assert.match(h.upgrades.at(-1).content.split('\n')[8], /^> \[ \] ai-family-office/);
  await h.scroll('down'); await h.scroll('down');             // Past the last row: next page.
  assert.equal(JSON.stringify([...menuItems(h)]), JSON.stringify(['Done', '[x] All workspaces', '[ ] bamboa', '[ ] desk', '[ ] market-sessions', '[ ] union-mq']));
  await h.scroll('up');                                       // Back: previous page, last row.
  assert.match(h.pages.at(-1).textObject.find(c => c.containerName === 'body').content.split('\n')[9], /^> \[ \] ai-stock/);
});

test('Hermes and Orca keep separate workspace pages, selections and session lists', async () => {
  const h = await harness(0, false, 'tap', 'hermes', 0, false, '["porttracker-id"]');
  const saved = [];
  h.bridge.setLocalStorage = async (key, value) => { saved.push([key, value]); };
  h.api.threads = async () => [
    { handle: 'codex-1', title: 'Codex work', agent: 'codex', state: 'idle', workspaceId: 'orca-glass-id', workspaceName: 'orca-glass', workspaceLabel: 'orca-glass', lastOutputAt: 50 },
    { handle: 'claude-1', title: 'Claude port', agent: 'claude', state: 'idle', workspaceId: 'porttracker-id', workspaceName: 'porttracker', workspaceLabel: 'porttracker', lastOutputAt: 45 },
    { handle: 'hermes:1', title: 'Hermes chat', agent: 'hermes', state: 'idle', workspaceId: 'bot-gm', workspaceName: 'Grand Master Bot', workspaceLabel: 'Grand Master Bot', hermesGroup: 'bot', lastOutputAt: 40 },
  ];
  h.api.workspaces = async () => [...['orca-glass', 'porttracker', 'zeta'].map((name, i) => ({ id: `${name}-id`, name, lastActivityAt: 100 - i })),
    { id: 'bot-gm', name: 'Grand Master Bot', hermes: 'bot' }];
  await h.menu(1001);
  // Hermes Agent: only Hermes sessions; the saved Orca selection does not apply.
  let list = [...menuItems(h)];
  assert.ok(list.some(s => s.includes('Hermes chat')) && !list.some(s => /Codex work|Claude port/.test(s)), list.join(' | '));
  await h.pick(1);
  const hermesPage = [...menuItems(h)];
  assert.ok(hermesPage.includes('[ ] Grand Master Bot'));
  assert.ok(!hermesPage.some(s => /orca-glass|porttracker|zeta/.test(s)), hermesPage.join(' | '));
  await h.pick(hermesPage.indexOf('[ ] Grand Master Bot'));
  assert.equal(saved.at(-1)[0], 'view-hermes-workspaces');
  await h.pick(0);
  // Switch to All Orca Sessions: Orca workspace page with its own saved selection.
  await h.pick(0); await h.pick(1);
  list = [...menuItems(h)];
  assert.ok(list.some(s => s.includes('Claude port')) && !list.some(s => /Hermes chat|Codex work/.test(s)), list.join(' | '));
  await h.pick(1);
  const orcaPage = [...menuItems(h)];
  assert.ok(orcaPage.includes('[x] porttracker'));
  assert.ok(!orcaPage.some(s => s.includes('Grand Master Bot')), orcaPage.join(' | '));
});

test('Hermes picker shows Bots, Sessions and Scheduled jobs instead of Orca workspaces', async () => {
  const h = await harness(0, false, 'tap', 'hermes');
  h.api.threads = async () => [
    { handle: 'codex-1', title: 'Codex work', agent: 'codex', state: 'idle', workspaceId: 'orca-glass-id', workspaceLabel: 'orca-glass', lastOutputAt: 99 },
    { handle: 'hermes:1', title: 'Chat', agent: 'hermes', state: 'idle', workspaceId: 'bot-gm', workspaceName: 'Grand Master Bot', workspaceLabel: 'Grand Master Bot', hermesGroup: 'bot', lastOutputAt: 50 },
    { handle: 'hermes:2', title: 'Plan', agent: 'hermes', state: 'idle', workspaceId: 'session-plan', workspaceName: 'Grand Master Bot', workspaceLabel: 'Complete porttracker', hermesGroup: 'session', lastOutputAt: 40 },
    { handle: 'hermes:3', title: 'Run', agent: 'hermes', state: 'idle', workspaceId: 'job-amc', workspaceName: 'Schedule Bot', workspaceLabel: 'AMC sign-up', hermesGroup: 'job', lastOutputAt: 60 },
  ];
  h.api.workspaces = async () => [
    { id: 'orca-glass-id', name: 'orca-glass', lastActivityAt: 100 },
    { id: 'bot-gm', name: 'Grand Master Bot', hermes: 'bot' },
    { id: 'bot-writer', name: 'Writer Bot', hermes: 'bot' },
    { id: 'job-amc', name: 'AMC sign-up', hermes: 'job' },
    { id: 'job-fehd', name: 'FEHD list', hermes: 'job' },
  ];
  await h.menu(1001); await h.pick(1);
  assert.equal(JSON.stringify([...menuItems(h)]), JSON.stringify(['Done', '[x] All workspaces',
    'Bots', '[ ] Grand Master Bot', '[ ] Writer Bot',
    'Sessions', '[ ] Complete porttracker',
    'Scheduled jobs', '[ ] AMC sign-up', '[ ] FEHD list']));
  // Selecting a bot filters the Hermes session list to that bot's chats.
  await h.pick(3); await h.pick(0);
  const list = [...menuItems(h)];
  assert.ok(list.some(s => s.includes('Chat')) && !list.some(s => s.includes('Plan') || s.includes('Run')), list.join(' | '));
});

test('phone filters and glasses share one saved selection and redraw each other', async () => {
  const h = await harness();
  h.api.threads = async () => [
    { handle: 'codex', title: 'Codex chat', agent: 'codex', workspaceId: 'w1', workspaceName: 'alpha' },
    { handle: 'claude', title: 'Claude chat', agent: 'claude', workspaceId: 'w2', workspaceName: 'beta' },
    { handle: 'hermes:x', title: 'Bot chat', agent: 'hermes', workspaceId: 'hermes-bot:1', workspaceName: 'Bot', workspaceLabel: 'Bot', hermesGroup: 'bot' },
  ];
  const saved = [];
  h.bridge.setLocalStorage = async (key, value) => { saved.push([key, value]); };
  // Demo start reports the connection to the phone page.
  assert.deepEqual(h.phoneCalls[0], ['connection', 'demo']);
  const phone = h.phone();
  const f0 = phone.filters();
  assert.deepEqual([f0.provider, f0.orca, f0.hermes], ['all', null, null]);
  // Phone picks an Orca workspace while the glasses show the session list: the list redraws.
  const before = h.pages.length;
  await phone.setWorkspaces(false, new Set(['w2']));
  await h.flush();
  assert.deepEqual(saved.at(-1), ['view-workspaces', '["w2"]']);
  assert.ok(h.pages.length > before);
  assert.match(menuItems(h).join(' | '), /Claude chat/);
  assert.doesNotMatch(menuItems(h).join(' | '), /Codex chat/);
  // Phone switches to Hermes Agent: Hermes keeps its own, separate selection.
  await phone.setProvider('hermes');
  await h.flush();
  assert.deepEqual(saved.at(-1), ['view-provider', 'hermes']);
  assert.match(menuItems(h).join(' | '), /Bot chat/);
  const f1 = phone.filters();
  assert.deepEqual([f1.provider, [...f1.orca], f1.hermes], ['hermes', ['w2'], null]);
  // A glasses change redraws the phone page.
  const renders = h.phoneCalls.filter(c => c[0] === 'render').length;
  await h.pick(0);
  await h.pick(1); // All Orca Sessions
  assert.ok(h.phoneCalls.filter(c => c[0] === 'render').length > renders);
  assert.equal(phone.filters().provider, 'all');
});

test('small text draws the whole screen, status row included, as four tiles and switches back', async () => {
  const h = await harness();
  const nl = String.fromCharCode(10);
  const output = Array.from({ length: 50 }, (_, i) => `Line ${i}`).join(nl);
  h.api.thread = async () => ({ text: output });
  const saved = [];
  h.bridge.setLocalStorage = async (key, value) => { saved.push([key, value]); };
  await h.pick(2);
  // Terminus 6x12 is on Smaller fonts (the menu holds ten entries). One blank
  // full-screen swipe target plus four 288x144 tiles.
  await h.menu(1106);
  assert.deepEqual([...h.pages.at(-1).listObject[0].itemContainer.itemName],
    ['Terminus 6x12', 'GohuFont 6x11', 'Scientifica 5x11']);
  await h.pick(0);
  const page = h.pages.at(-1);
  assert.deepEqual(saved.slice(-2), [['reader-text', 'terminus'], ['reader-font', 'terminus']]);
  assert.equal(page.containerTotalNum, 5);
  assert.equal(JSON.stringify(page.textObject.map(t => [t.containerID, t.width, t.height, t.isEventCapture, t.content])), JSON.stringify([[1, 576, 288, 1, ' ']]));
  assert.equal(JSON.stringify(page.imageObject.map(i => [i.containerID, i.xPosition, i.yPosition, i.width, i.height])),
    JSON.stringify([[2, 0, 0, 288, 144], [3, 288, 0, 288, 144], [4, 0, 144, 288, 144], [5, 288, 144, 288, 144]]));
  assert.equal(JSON.stringify(page.menuObject.menuItems.map(i => i.itemName)),
    JSON.stringify(['Using: Terminus 6x12', 'Native text', 'Misc Fixed 9x15', 'GohuFont 8x14', 'Departure 7x14',
      'Misc Fixed 6x13', 'Shinonome 6x12', 'Smaller fonts', 'Brightness 15', 'Compare fonts']));
  // Ten items: the SDK's menu maximum.
  assert.equal(page.menuObject.menuItems.length, 10);
  // Every possible label fits the menu without truncation (about 210px in the firmware font).
  for (const f of fineExports.FINE_FONTS) assert.ok(listExports.glassWidth(`Using: ${fineExports.fineLabel(f)}`) <= 210, fineExports.fineLabel(f));
  const layout = fineExports.fineLayout('terminus');
  assert.deepEqual([layout.columns, layout.rows], [95, 22]);
  // Every font on its own whole-pixel grid, filling the 574px inside the frame.
  assert.equal(JSON.stringify(Object.fromEntries(fineExports.FINE_FONTS.map(f => { const l = fineExports.fineLayout(f); return [f, [l.cell, l.line, l.columns, l.rows]]; }))),
    JSON.stringify({ scientifica: [5, 11, 114, 24], gohu: [6, 11, 95, 24], terminus: [6, 12, 95, 22], shinonome: [6, 12, 95, 22], fixed: [6, 13, 95, 20],
      departure: [7, 14, 82, 18], gohu14: [8, 14, 71, 18], fixed9: [9, 15, 63, 17] }));
  // A full row is exactly `columns` cells, and one more cell wraps. The gap
  // inside the frame is shorter than one cell, so Departure 7px (82) and the
  // narrower fonts both run to the right edge.
  const sentence = 'The quick brown fox jumps over the lazy dog. '.repeat(8);
  for (const f of fineExports.FINE_FONTS) {
    const l = fineExports.fineLayout(f);
    assert.ok(l.textX >= 1 && l.textX + l.textWidth <= 575, f);
    assert.ok(574 - l.textWidth < l.cell, f);
    const measure = fineExports.fineMeasure(f);
    const full = 'M'.repeat(l.columns);
    assert.equal(textExports.readerPages(full, measure, l.textWidth, l.rows, Infinity)[0], full);
    assert.deepEqual(textExports.readerPages(full + 'N', measure, l.textWidth, l.rows, Infinity)[0].split('\n'), [full, 'N']);
    const row = textExports.readerPages(sentence, measure, l.textWidth, l.rows, Infinity)[0].split('\n')[0];
    assert.ok(l.columns - fineExports.fineCells(row) < 6, `${f} left ${l.columns - fineExports.fineCells(row)} cells`);
  }
  // GohuFont 8x14 is an 8px cell: M's ink stays inside the cell and the next pixel is empty.
  for (const font of ['gohu14']) {
    const cell = fineExports.fineLayout(font);
    const tile = fineExports.renderFineScreen('M', font, { left: '', right: '' })[0];
    let ink = 0;
    for (let y = 4; y < 4 + cell.line; y++) {
      for (let x = 0; x < cell.cell; x++) if (tile[y * 288 + cell.textX + x] > 0) ink++;
      assert.equal(tile[y * 288 + cell.textX + cell.cell], 0, font);
    }
    assert.ok(ink > 8, `${font} drew ${ink} pixels`);
  }
  // Picking a font from the menu switches to it; the 'Using:' line changes nothing.
  await h.menu(1112);
  assert.deepEqual(saved.slice(-2), [['reader-text', 'departure'], ['reader-font', 'departure']]);
  assert.equal(h.pages.at(-1).menuObject.menuItems[0].itemName, 'Using: Departure 7x14');
  const pagesBefore = h.pages.length;
  await h.menu(1101);
  assert.equal(h.pages.length, pagesBefore);
  await h.menu(1106);
  await h.pick(0);
  assert.deepEqual(saved.at(-1), ['reader-font', 'terminus']);
  // 50 lines at 22 rows: three pages, opening on the newest. The tiles sent are
  // exactly the rendered screen with the status row drawn in.
  const sent = () => h.images.filter(i => /^fine-/.test(i.containerName));
  const expected = (from, pageNo) => fineExports.renderFineScreen(Array.from({ length: Math.min(22, 50 - from) }, (_, i) => `Line ${from + i}`).join(nl),
    'terminus', { left: '/Status unknown', right: `[Tap&Hold for Input] Pg${pageNo}/3` });
  // A rebuild re-sends all four tiles; the latest four are the Spleen page.
  assert.equal(JSON.stringify(sent().slice(-4).map(i => i.containerName)), JSON.stringify(['fine-0', 'fine-1', 'fine-2', 'fine-3']));
  assert.equal(JSON.stringify(sent().slice(-4).map(i => i.imageData)), JSON.stringify(expected(44, 3)));
  // A page turn re-sends only tiles that changed and keeps native text untouched.
  const before = sent().length;
  await h.scroll('up'); await h.flush();
  const turned = sent().slice(before);
  const want = expected(22, 2);
  assert.ok(turned.length >= 1 && turned.length <= 4);
  for (const tile of turned) assert.equal(JSON.stringify(tile.imageData), JSON.stringify(want[Number(tile.containerName.slice(5))]));
  assert.ok(!h.upgrades.some(u => ['body', 'voice', 'hint'].includes(u.containerName)));
  // The display test replaces the tiles; the next swipe restores the page.
  await h.menu(1105); await h.flush();
  assert.equal(JSON.stringify(sent().slice(-4).map(i => i.imageData)), JSON.stringify(fineExports.renderFontComparison()));
  await h.scroll('down'); await h.flush();
  const restored = new Map(sent().slice(-4).map(i => [i.containerName, i.imageData]));
  for (const [name, data] of restored) assert.equal(JSON.stringify(data), JSON.stringify(want[Number(name.slice(5))]));
  // Brightness is the panel's 16 steps. 8 draws the font and frame at byte 136, then native text uses its five-step scale.
  await h.menu(1107);
  assert.equal(h.pages.at(-1).textObject[0].content, 'Brightness');
  assert.deepEqual([...h.pages.at(-1).listObject[0].itemContainer.itemName].slice(0, 8), ['15 ✓', '14', '13', '12', '11', '10', '9', '8']);
  const dimFrom = sent().length;
  await h.pick(7);
  assert.deepEqual(saved.at(-1), ['reader-ink', '8']);
  const dim = fineExports.renderFineScreen(Array.from({ length: 22 }, (_, i) => `Line ${22 + i}`).join(nl), 'terminus', { left: '/Status unknown', right: '[Tap&Hold for Input] Pg2/3' }, 8);
  const dimmed = sent().slice(dimFrom);
  assert.equal(dimmed.length, 4);
  for (const tile of dimmed) assert.equal(JSON.stringify(tile.imageData), JSON.stringify(dim[Number(tile.containerName.slice(5))]));
  // Back to native text on the page holding the same first line, at the chosen ink.
  await h.menu(1102);
  assert.deepEqual(saved.at(-1), ['reader-text', 'native']);
  assert.equal(h.pages.at(-1).containerTotalNum, 7);
  const native = h.pages.at(-1);
  assert.equal(native.textObject.find(c => c.containerName === 'body').textColor, 3);
  assert.equal(native.textObject.find(c => c.containerName === 'frame').borderColor, 8);
  assert.equal(native.textObject.find(c => c.containerName === 'hint').textColor, 3);
});

test('reader ink follows the panel steps 0 through 15', () => {
  assert.equal(fineExports.parseInk(''), 15);
  assert.equal(fineExports.parseInk('0'), 0);
  assert.equal(fineExports.parseInk('8'), 8);
  assert.equal(fineExports.parseInk('16'), 15);
  assert.equal(fineExports.inkByte(15), 255);
  assert.equal(fineExports.inkByte(8), 136);
  assert.equal(fineExports.inkByte(0), 0);
  assert.equal(fineExports.nativeTextColor(15), 4);
  assert.equal(fineExports.nativeTextColor(12), 4);
  assert.equal(fineExports.nativeTextColor(8), 3);
  assert.equal(fineExports.nativeTextColor(1), 1);
  assert.equal(fineExports.nativeTextColor(0), 0);
  const full = fineExports.renderFineScreen('M', 'gohu14', { left: '', right: '' }, 15)[0];
  const dim = fineExports.renderFineScreen('M', 'gohu14', { left: '', right: '' }, 8)[0];
  let ink = 0;
  for (let i = 0; i < full.length; i++) {
    if (full[i] === 0) assert.equal(dim[i], 0);
    else { assert.equal(full[i], 255); assert.equal(dim[i], 136); ink++; }
  }
  assert.ok(ink > 8);
});

test('tile modes sweep a scanner light where native text shows the Braille spinner', () => {
  const heads = Array.from({ length: 15 }, (_, f) => fineExports.scannerLevels(f).indexOf(255));
  // Sweeps 0..7 and back, one segment per frame.
  assert.equal(JSON.stringify(heads), JSON.stringify([0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 0]));
  // A fading tail follows the light: right-moving at frame 3, left-moving at frame 10.
  assert.equal(JSON.stringify(fineExports.scannerLevels(3)), JSON.stringify([64, 112, 176, 255, 0, 0, 0, 0]));
  assert.equal(JSON.stringify(fineExports.scannerLevels(10)), JSON.stringify([0, 0, 0, 0, 255, 176, 112, 64]));
  // Two frames differ only in the bottom-left tile, where the status row starts.
  const frame = n => fineExports.renderFineScreen('Line', 'terminus', { model: 'Opus5.5', scanner: n, left: 'Thinking...', right: 'Pg1/1' });
  const a = frame(0), b = frame(1);
  assert.equal(JSON.stringify([0, 1, 2, 3].map(i => JSON.stringify(a[i]) === JSON.stringify(b[i]))), JSON.stringify([true, true, false, true]));
});

test('small-text modes pad Markdown tables so columns line up in monospace', () => {
  const nl = String.fromCharCode(10);
  const input = ['> Here:', '  | Mode | Cols | Chars/page |', '  |:--|--:|:-:|', '  | native | ~55 | ~500 |', '  | pixel | 93 | ~1860 |', '  Done.'].join(nl);
  assert.equal(fineExports.alignMarkdownTables(input), ['> Here:',
    '  | Mode   | Cols | Chars/page |',
    '  | ------ | ---- | ---------- |',
    '  | native |  ~55 |    ~500    |',
    '  | pixel  |   93 |   ~1860    |',
    '  Done.'].join(nl));
  // Pipe text without a rule row is not a table and stays as written.
  assert.equal(fineExports.alignMarkdownTables('> a | b |' + nl + '  | x |'), '> a | b |' + nl + '  | x |');
});

test('Filter by Agent pages past ten rows with visible more-below and more-above cues', async () => {
  const h = await harness();
  const agents = ['codex', 'claude', 'cursor', 'opencode2', 'pi', 'openclaude', 'gemini', 'aider', 'goose', 'amp'];
  h.api.threads = async () => agents.map((agent, i) => ({ handle: `t${i}`, title: agent, agent }));
  await h.pick(0);
  const rows = () => h.pages.at(-1).textObject.find(c => c.containerName === 'body').content.split(String.fromCharCode(10)).map(r => r.replace(/^[> ] /, '').trim());
  // Hermes + All + ten agents = twelve rows: nine on page one, then the cue.
  assert.equal(rows().length, 10);
  assert.deepEqual(rows().slice(0, 2), ['Hermes Agent', 'All Orca Sessions ✓']);
  assert.equal(rows().at(-1), 'v more below');
  // Swipe down past the last agent (the cue row is skipped): page two.
  for (let i = 0; i < 8; i++) await h.scroll('down');
  assert.equal(rows()[0], '^ more above');
  assert.ok(rows().some(r => /amp/i.test(r)));
  // Swipe up past the first agent: back to page one.
  await h.scroll('up'); await h.scroll('up'); await h.scroll('up');
  assert.equal(rows()[0], 'Hermes Agent');
});

test('wrapped rows hang under the text after the / and > markers', () => {
  const nl = String.fromCharCode(10);
  const mono = t => [...t].length * 6;
  const text = ['/ blah blah blah blah blah blah', '> blah blah blah blah blah blah', '  blah blah blah blah blah blah', 'plain blah blah blah blah blah'].join(nl);
  const rows = textExports.readerPages(text, mono, 6 * 18, 20)[0].split(nl);
  assert.deepEqual([...rows], [
    '/ blah blah blah', '  blah blah blah',
    '> blah blah blah', '  blah blah blah',
    '  blah blah blah', '  blah blah blah',
    'plain blah blah', 'blah blah blah']);
  // Proportional native text: the indent is the run of spaces closest in width to '> '.
  const native = t => [...t].reduce((n, c) => n + (c === ' ' ? 5 : c === '>' ? 12 : 10), 0);
  const second = textExports.readerPages('> ' + 'word '.repeat(20), native, 120, 20)[0].split(nl)[1];
  assert.match(second, /^ {3}\S/);
});

test('wrapped list items hang under the item text', () => {
  const nl = String.fromCharCode(10);
  const mono = t => [...t].length * 6;
  const rows = textExports.readerPages(['  - blah blah blah blah blah', '> 12. blah blah blah blah blah'].join(nl), mono, 6 * 18, 20)[0].split(nl);
  assert.deepEqual([...rows], ['  - blah blah blah', '    blah blah', '> 12. blah blah', '      blah blah', '      blah']);
});

test('switching the phone language to Japanese redraws glasses labels and keeps the status row fitting', async () => {
  const h = await harness();
  const select = h.elements.get('lang');
  select.value = 'ja';
  await select.listeners.change();
  await h.flush();
  try {
    // Session list: contextual menu and filter rows are redrawn in Japanese.
    assert.deepEqual([...h.pages.at(-1).menuObject.menuItems].map(i => i.itemName), ['セッションを更新', '新規セッション', '使用量']);
    assert.match(menuItems(h)[0], /^エージェントで絞り込み/);
    // Reader: Japanese status word, hint and page counter share the one status row.
    await h.pick(2);
    const page = h.pages.at(-1);
    assert.equal(page.textObject.find(c => c.containerName === 'voice').content, '/状態不明');
    const hint = page.textObject.find(c => c.containerName === 'hint').content.trim();
    assert.match(hint, /^\[長押しで入力\] P1\/1$/);
    assert.ok(listExports.glassWidth(hint) <= 280 - 6);
    assert.equal(JSON.stringify(page.menuObject.menuItems.slice(0, 2).map(i => i.itemName)), JSON.stringify(['現在: 標準フォント', '標準フォント']));
    assert.equal(statusExports.readerStatus('waiting'), '/入力待ち');
    assert.match(statusExports.readerStatus('working', 0, 5000), /思考中\.$/);
    // The hint still shrinks step by step when the row is crowded.
    assert.equal(hintExports.statusRight(null, false, 'P7/8', t => new TextEncoder().encode(t).length <= 10), '[T&H] P7/8');
    assert.equal(hintExports.statusRight(null, true, 'P1/2'), '[クリックで選択] P1/2');
    assert.equal(usageResetExports.resetModeLabel('absolute'), '残り時間');
    for (const f of fineExports.FINE_FONTS) assert.ok(listExports.glassWidth(`現在: ${fineExports.fineLabel(f)}`) <= 210, fineExports.fineLabel(f));
    for (const item of page.menuObject.menuItems) assert.ok(new TextEncoder().encode(item.itemName).length <= 32, item.itemName);
  } finally { select.value = 'en'; await select.listeners.change(); await h.flush(); }
  assert.equal(statusExports.readerStatus('waiting'), '/Waiting');
});

test('Japanese draws from the Shinonome wide table in every small font', () => {
  // あ (U+3042) and 漢 are in the 12x12 table: two cells, real pixels, no canvas fallback.
  for (const font of fineExports.FINE_FONTS) {
    const tiles = fineExports.renderFineScreen('あ漢', font, { left: '', right: '' });
    const lit = tiles.reduce((n, tile) => n + tile.filter(v => v > 0).length, 0);
    const blank = fineExports.renderFineScreen('', font, { left: '', right: '' }).reduce((n, tile) => n + tile.filter(v => v > 0).length, 0);
    assert.ok(lit - blank > 40, `${font}: ${lit - blank} glyph pixels`);
  }
  assert.equal(fineExports.fineCells('日本語abc'), 9);
});

test('Japanese wraps between characters but never starts a row with closing punctuation', () => {
  const nl = String.fromCharCode(10);
  const cells = t => [...t].reduce((n, c) => n + (c.charCodeAt(0) > 0x2e80 ? 2 : 1), 0) * 6;
  // 'UTC の実行日…': before, the whole Japanese run moved to the next row.
  const rows = textExports.readerPages('> 明細の日付を UTC の実行日と比べているため、翌日扱いになりました。', cells, 6 * 24, 20)[0].split(nl);
  assert.ok(rows.length >= 2);
  assert.ok(rows.every(row => cells(row) <= 6 * 24), rows.join('|'));
  assert.ok(cells(rows[0]) >= 6 * 22, `first row filled: ${rows[0]}`);
  assert.ok(rows.slice(1).every(row => row.startsWith('  ') && !/^\s*[、。」）ー]/.test(row)), rows.join('|'));
  // Every character kept: only the hanging indent and wrap-point spaces differ.
  assert.equal(rows.join('').replace(/\s/g, ''), '>明細の日付をUTCの実行日と比べているため、翌日扱いになりました。');
  // Latin words are still never split.
  assert.deepEqual([...textExports.readerPages('alpha beta gamma', t => t.length * 6, 6 * 11, 20)[0].split(nl)], ['alpha beta', 'gamma']);
});
