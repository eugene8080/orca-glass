import {
  AudioInputSource,
  CreateStartUpPageContainer,
  ListContainerProperty,
  ListItemContainerProperty,
  ImageContainerProperty,
  ImageRawDataUpdate,
  ImageRawDataUpdateResult,
  OsEventTypeList,
  RebuildPageContainer,
  TextContainerProperty,
  TextContainerUpgrade,
  waitForEvenAppBridge,
  type EvenAppBridge,
  type EvenHubEvent,
} from '@evenrealities/even_hub_sdk';
import { api, currentBase, setApiLang, setConnection, setDemo, type Provider, type Thread, type Workspace } from './api';
import { parseCode, resolveBase } from './pairing';
import { applyPage, detectLang, setLang, t as tr } from './i18n';
import { clipBytes, textSections } from './text';
import { readerStatus, statusPixels, voiceBorderPixels, SPINNER } from './reader-status';
import { footerHint } from './footer-hint';
import { agentLabel, sessionRow, sessionListTitle, sessionHeading, MENU_LEFT, MENU_CURSOR, MENU_STRIPS, nativeRight, menuTitle, compactSessionTitle, cursorText, type SessionColumns } from './session-list';

// 画面 576x288。上に見出し(テキスト)、下に本文(リスト or テキスト)の2段構成で統一する。
const HEAD = { containerID: 1, containerName: 'head', xPosition: 0, yPosition: 0, width: 576, height: 36 };
const BODY = { containerID: 2, containerName: 'body', xPosition: 0, yPosition: 40, width: 576, height: 248 };
// Text layers are transparent on G2. Reserve a separate quarter-screen input
// area so showing/hiding it needs no reader rebuild or overlapping text.
const VOICE = { containerID: 3, containerName: 'voice', xPosition: 16, yPosition: 202, width: 544, height: 81 };
const FRAME = { containerID: 4, containerName: 'frame', xPosition: 0, yPosition: 0, width: 576, height: 288 };
const DIVIDER = { containerID: 5, containerName: 'divider', xPosition: 16, yPosition: 198, width: 544, height: 2 };
const HINT = { containerID: 6, containerName: 'hint', xPosition: 280, yPosition: 202, width: 280, height: 28 };
const STATUS_ICON = { containerID: 7, containerName: 'status-icon', xPosition: 16, yPosition: 202, width: 20, height: 28 };
const VOICE_BORDER_LEFT = { containerID: 8, containerName: 'voice-border-l', xPosition: 8, yPosition: 200, width: 280, height: 84 };
const VOICE_BORDER_RIGHT = { containerID: 9, containerName: 'voice-border-r', xPosition: 288, yPosition: 200, width: 280, height: 84 };
const READER_HEIGHT = 162;
const LIST_ITEM_BYTES = 63;
const LIST_MAX = 20;
const TEXT_BYTES = 999;
const POLL_MS = 1000;

type Screen =
  | { kind: 'list'; title: string; items: string[]; sessionList?: boolean; compat?: boolean; columns?: SessionColumns[]; connectedCount?: number; selected?: number; paintedSelection?: number; cursorWriting?: boolean; onPick: (i: number) => void; onBack?: () => void }
  | { kind: 'text'; title: string; text: string; tail?: boolean; offset?: number; reading?: boolean; activityLabel?: string; activityState?: string; reportedSeconds?: number | null; statusFrame?: number; statusStartedAt?: number; savedHistory?: boolean; reader?: Thread; onClick?: () => void; onBack?: () => void; onHold?: () => void; };

let bridge: EvenAppBridge;
let current: Screen | null = null;
let started = false;
let compactMenuOnly = false;
let poll: ReturnType<typeof setInterval> | undefined;
let menuPoll: ReturnType<typeof setInterval> | undefined;
let menuAnimation: ReturnType<typeof setInterval> | undefined;
let statusAnimation: ReturnType<typeof setInterval> | undefined;
let panelWrites: Promise<void> = Promise.resolve();
let sessionCursorWrites: Promise<void> = Promise.resolve();
let voiceBorderVisible = false;
let selectedThread: Thread | null = null;
let sending = false;
let holding = false;
let releaseCapture: (() => void) | null = null;
let viewProvider = 'all';
const providerName = agentLabel;

function selectThread(t: Thread | null) {
  if (selectedThread?.handle !== t?.handle) {
    (document.getElementById('reply-text') as HTMLTextAreaElement).value = '';
    document.getElementById('send-reply')!.hidden = true;
    document.getElementById('reply-status')!.textContent = '';
  }
  selectedThread = t;
  document.getElementById('composer')!.hidden = !t;
  document.getElementById('reply-target')!.textContent = t ? `Reply to: ${t.title} (${t.handle.slice(-8)})` : '';
}

// Send overflowing text intact; the G2 firmware owns movement within a section.
function bodyText(s: { text: string; tail?: boolean; offset?: number }) {
  const sections = textSections(s.text);
  s.offset = Math.max(0, Math.min(s.offset ?? (s.tail ? sections.length - 1 : 0), sections.length - 1));
  return sections[s.offset];
}

function screenTitle(s: Screen) {
  return s.title;
}

function activityLabel(state: string) {
  return readerStatus(state);
}

function writePanel(content: string, active: () => boolean = () => true, statusMode?: boolean) {
  const write = panelWrites.then(async () => {
    if (!active()) return false;
    const status = statusMode ?? (current?.kind === 'text' && !!current.reader);
    if (voiceBorderVisible !== !status) {
      // Mark ownership first so cancellation clears even a partially uploaded border.
      voiceBorderVisible = !status;
      for (const [geometry, side] of [[VOICE_BORDER_LEFT, 'left'], [VOICE_BORDER_RIGHT, 'right']] as const) {
        const result = await bridge.updateImageRawData(new ImageRawDataUpdate({
          containerID: geometry.containerID, containerName: geometry.containerName,
          imageData: voiceBorderPixels(side, !status),
        }));
        if (result !== ImageRawDataUpdateResult.success) throw new Error('Glasses rejected the voice border update. Chat position preserved.');
      }
    }
    // The four-space gutter reserves the icon's 20px without changing voice
    // panel geometry when capture/review temporarily takes ownership.
    let visible = status && content[0] !== '/' && content.length > 2 ? '    ' + content.slice(2) : content;
    try {
      await bridge.updateImageRawData(new ImageRawDataUpdate({ containerID: STATUS_ICON.containerID, containerName: STATUS_ICON.containerName,
        imageData: statusPixels(status && content[0] !== '/' ? content[0] : '') }));
    } catch (e) {
      // A missing image renderer must not prevent voice review or status text.
      diag((e as Error).message);
      visible = content;
    }
    if (!active()) return false;
    return bridge.textContainerUpgrade(new TextContainerUpgrade({ containerID: VOICE.containerID, containerName: VOICE.containerName, content: visible || ' ', textColor: content ? 4 : 0 }));
  });
  panelWrites = write.then(() => {}, () => {});
  return write;
}

async function inputHint(visible: boolean) {
  const owner = current;
  const seconds = current?.kind === 'text' ? current.reportedSeconds : null;
  const write = panelWrites.then(async () => {
    if (visible && current !== owner) return;
    await bridge.textContainerUpgrade(new TextContainerUpgrade({ containerID: HINT.containerID, containerName: HINT.containerName,
      content: visible ? nativeRight(footerHint(seconds), HINT.width) : ' ', textColor: 4 }));
  });
  panelWrites = write.then(() => {}, () => {});
  await write;
}

async function show(s: Screen, reloadText = false) {
  clearInterval(poll);
  clearInterval(statusAnimation);
  clearInterval(menuAnimation);
  clearInterval(menuPoll);
  if (s.kind === 'text' && s.reader) s.activityLabel ??= readerStatus('unknown');
  const previous = current;
  current = s;
  voiceBorderVisible = false;
  const content = s.kind === 'text' ? bodyText(s) : '';
  const uploadText = reloadText || (s.kind === 'text' && !!s.reader && s.text.length > 900) || new TextEncoder().encode(content).length > 999;
  const head = new TextContainerProperty({ ...HEAD, ...(s.kind === 'text' && s.reader ? { xPosition: 16, yPosition: 2, width: 544, height: 28, zOrderIndex: 1 } : {}), content: s.kind === 'list' && s.sessionList ? sessionHeading() : clipBytes(screenTitle(s), TEXT_BYTES), isEventCapture: 0 });
  // Only OS-owned Display off, Brightness and Close remain in the contextual menu.
  const menu = {};
  let page =
    s.kind === 'list'
      ? {
          containerTotalNum: s.sessionList ? 8 : 2,
          ...(s.sessionList ? { imageObject: MENU_STRIPS.map((tile, i) => new ImageContainerProperty({ ...tile, zOrderIndex: 7 - i })) } : {}),
          ...menu,
          textObject: s.sessionList ? [
            new TextContainerProperty({ ...HEAD, width: 300, content: sessionHeading(), isEventCapture: 0, paddingLength: 0, zOrderIndex: 1 }),
            new TextContainerProperty({ containerID: 3, containerName: 'menu-count', xPosition: 300, yPosition: 0, width: 276, height: 36, content: nativeRight(`${s.connectedCount} connected terminals`, 276), isEventCapture: 0, paddingLength: 0, zOrderIndex: 2 }),
            new TextContainerProperty({ containerID: 5, containerName: 'menu-input', xPosition: 0, yPosition: 0, width: 576, height: 288, content: ' ', isEventCapture: 1, paddingLength: 0, zOrderIndex: 0 }),
            new TextContainerProperty({ ...MENU_CURSOR, content: cursorText(s.items.length, s.selected || 0), isEventCapture: 0, paddingLength: 0, zOrderIndex: 3 }),
            new TextContainerProperty({ ...MENU_LEFT, content: s.columns!.map(r => `     ${menuTitle(r.title)}`).join('\n'), isEventCapture: 0, paddingLength: 0, zOrderIndex: 4 }),
            new TextContainerProperty({ containerID: 6, containerName: 'menu-right', xPosition: 396, yPosition: 40, width: 180, height: 248, content: s.columns!.map(r => nativeRight(r.right, 180)).join('\n'), isEventCapture: 0, paddingLength: 0, zOrderIndex: 5 }),
          ] : [head],
          ...(s.sessionList ? {} : { listObject: [
            new ListContainerProperty({
              ...BODY,
              isEventCapture: 1,
              itemContainer: new ListItemContainerProperty({
                itemCount: Math.min(s.items.length, LIST_MAX),
                itemName: s.items.slice(0, LIST_MAX).map((t) => clipBytes(t, LIST_ITEM_BYTES)),
              }),
            }),
          ] }),
        }
      : {
          containerTotalNum: s.reader ? 9 : 2,
          textObject: [head, new TextContainerProperty({ ...BODY, ...(s.reader ? { xPosition: 16, yPosition: 32, width: 544, zOrderIndex: 2, height: READER_HEIGHT } : {}), content: uploadText ? '' : content, isEventCapture: 1 }),
            ...(s.reader ? [
              new TextContainerProperty({ ...HINT, content: nativeRight(footerHint(s.reportedSeconds), HINT.width), textColor: 4, isEventCapture: 0, zOrderIndex: 8 }),
              new TextContainerProperty({ ...VOICE, content: s.activityLabel![0] === '/' ? s.activityLabel : '    ' + s.activityLabel!.slice(2), textColor: 4, isEventCapture: 0, zOrderIndex: 7 }),
              new TextContainerProperty({ ...FRAME, content: ' ', textColor: 4, borderWidth: 2, borderColor: 15, borderRadius: 0, isEventCapture: 0, zOrderIndex: 0 }),
              new TextContainerProperty({ ...DIVIDER, content: ' ', textColor: 4, borderWidth: 2, borderColor: 15, isEventCapture: 0, zOrderIndex: 3 }),
            ] : [])],
          ...(s.reader ? { imageObject: [
            new ImageContainerProperty({ ...STATUS_ICON, zOrderIndex: 6 }),
            new ImageContainerProperty({ ...VOICE_BORDER_LEFT, zOrderIndex: 4 }),
            new ImageContainerProperty({ ...VOICE_BORDER_RIGHT, zOrderIndex: 5 }),
          ] } : {}),
        };
  try {
    if (!started) {
      // Bootstrap with the small, hardware-proven native text shape. The richer
      // menu is a later rebuild, so rejection cannot consume startup itself.
      started = true;
      const bootstrap = { containerTotalNum: 2, textObject: [
        new TextContainerProperty({ ...HEAD, content: sessionHeading(), isEventCapture: 0 }),
        new TextContainerProperty({ ...BODY, content: 'Connecting to Orca…', isEventCapture: 1 }),
      ] };
      const result = await bridge.createStartUpPageContainer(new CreateStartUpPageContainer(bootstrap));
      if (result !== 0 && !await bridge.rebuildPageContainer(new RebuildPageContainer(bootstrap))) {
        throw new Error(`${sessionHeading()}: native startup failed (${result}); bootstrap recovery rejected.`);
      }
    }
    if (s.kind === 'list' && s.sessionList && compactMenuOnly) { s.compat = true; page = compatibilityMenu(s, menu) as typeof page; }
    let accepted = await bridge.rebuildPageContainer(new RebuildPageContainer(page));
    if (!accepted && s.kind === 'list' && s.sessionList && !s.compat) {
      s.compat = true;
      accepted = await bridge.rebuildPageContainer(new RebuildPageContainer(compatibilityMenu(s, menu)));
      if (accepted) {
        compactMenuOnly = true;
        diag(`${sessionHeading()}: aligned menu rejected; compact compatibility menu active.`);
      }
    }
    if (!accepted) throw new Error(`${sessionHeading()}: ${s.kind === 'list' && s.sessionList ? 'both aligned and compact menus rejected' : 'glasses rejected the screen update'}.`);
    if (s.kind === 'list' && s.sessionList) document.getElementById('menu-layout')!.textContent = s.compat
      ? 'Menu layout: Compact compatibility' : 'Menu layout: Aligned native text';
    if (uploadText && s.kind === 'text') {
      const accepted = await bridge.textContainerUpgrade(new TextContainerUpgrade({ containerID: BODY.containerID, containerName: BODY.containerName, content }));
      if (!accepted) throw new Error('Glasses could not load the selected text. Click to retry.');
    }
    if (s.kind === 'list' && s.sessionList && !s.compat) startMenuSpinner(s);
    if (s.kind === 'text' && s.reader) {
      await bridge.updateImageRawData(new ImageRawDataUpdate({ containerID: STATUS_ICON.containerID, containerName: STATUS_ICON.containerName, imageData: statusPixels(s.activityLabel![0] === '/' ? '' : s.activityLabel![0]) })).catch(e => diag((e as Error).message));
      startReaderUpdates(s);
    }
  } catch (e) {
    if (current === s) current = previous;
    diag((e as Error).message);
    throw e;
  }
}

async function updateText(title: string, text: string) {
  if (current?.kind !== 'text') return;
  const screen = current;
  const next = { ...screen, title, text };
  const { containerID: hid, containerName: hname } = HEAD;
  const { containerID: bid, containerName: bname } = BODY;
  if (title !== screen.title) {
    const accepted = await bridge.textContainerUpgrade(new TextContainerUpgrade({ containerID: hid, containerName: hname, content: clipBytes(title, TEXT_BYTES) }));
    if (!accepted) throw new Error('Glasses rejected the title update.');
  }
  if (current !== screen) return;
  const accepted = await bridge.textContainerUpgrade(new TextContainerUpgrade({ containerID: bid, containerName: bname, content: bodyText(next) }));
  if (!accepted) throw new Error('Glasses rejected the live text update. Retrying.');
  if (current === screen) { screen.title = title; screen.text = text; }
}

async function guard(title: string, f: () => Promise<void>, back: () => void) {
  try {
    await f();
  } catch (e) {
    await show({ kind: 'text', title, text: tr('error', (e as Error).message), onBack: back, onClick: back });
  }
}

// ---- 画面 ----


type SessionMenuScreen = Extract<Screen, { kind: 'list' }>;
function compatibilityMenu(screen: SessionMenuScreen, menu: object) {
  return { containerTotalNum: 3, ...menu, textObject: [
    new TextContainerProperty({ ...HEAD, content: screen.title, isEventCapture: 0 }),
    new TextContainerProperty({ ...BODY, content: compatibilityText(screen), isEventCapture: 0 }),
    new TextContainerProperty({ containerID: 3, containerName: 'menu-input', xPosition: 0, yPosition: 0,
      width: 576, height: 288, content: ' ', isEventCapture: 1 }),
  ] };
}
function compatibilityText(screen: SessionMenuScreen, selected = screen.selected || 0) {
  return screen.items.map((item, i) => `${i === selected ? '>' : ' '} ${clipBytes(item, 48)}`).join('\n');
}
function startMenuSpinner(screen: SessionMenuScreen) {
  let frame = 0, busy = false, polling = false;
  const previous: number[][] = [];
  const draw = async () => {
    if (busy || current !== screen) return;
    busy = true;
    try {
      const glyph = SPINNER[frame++ % SPINNER.length];
      for (let tileIndex = 0; tileIndex < MENU_STRIPS.length; tileIndex++) {
        const tile = MENU_STRIPS[tileIndex];
        if (current !== screen) return;
        const pixels = Array(tile.width * tile.height).fill(0);
        screen.columns!.forEach((row, i) => {
          const icon = statusPixels(row.busy ? glyph : row.marker);
          for (let y = 0; y < 27; y++) {
            const target = 40 + i * 27 + y - tile.yPosition;
            if (target < 0 || target >= tile.height) continue;
            for (let x = 0; x < 20; x++) pixels[target * 20 + x] = icon[y * 20 + x];
          }
        });
        if (previous[tileIndex]?.every((p, i) => p === pixels[i])) continue;
        const result = await bridge.updateImageRawData(new ImageRawDataUpdate({ containerID: tile.containerID, containerName: tile.containerName, imageData: pixels }));
        if (result !== ImageRawDataUpdateResult.success) throw new Error('Session marker image transfer rejected.');
        previous[tileIndex] = pixels;
      }
    } catch (e) { diag((e as Error).message); }
    finally { busy = false; }
  };
  void draw();
  menuAnimation = setInterval(() => { void draw(); }, 500);
  menuPoll = setInterval(async () => {
    if (polling || current !== screen) return;
    polling = true;
    try {
      const latest = await api.threads();
      if (current !== screen) return;
      for (const row of screen.columns!) {
        if (!row.handle) continue;
        const state = latest.find(t => t.handle === row.handle)?.state || 'unknown';
        row.busy = state === 'busy'; row.marker = state === 'idle' ? '/' : state === 'busy' ? '' : '?';
      }
      void draw();
    } catch (e) { diag((e as Error).message); }
    finally { polling = false; }
  }, 3000);
}
async function updateSessionCursor(screen: SessionMenuScreen) {
  if (screen.cursorWriting) return;
  screen.cursorWriting = true;
  try {
    // Coalesce rapid swipes to the newest position instead of queuing redraws.
    while (current === screen && screen.paintedSelection !== screen.selected) {
      const selected = screen.selected || 0;
      const accepted = await bridge.textContainerUpgrade(new TextContainerUpgrade(screen.compat
        ? { containerID: BODY.containerID, containerName: BODY.containerName, content: compatibilityText(screen, selected) }
        : { containerID: MENU_CURSOR.containerID, containerName: MENU_CURSOR.containerName, content: cursorText(screen.items.length, selected) }));
      if (!accepted) throw new Error('Session menu text update rejected');
      screen.paintedSelection = selected;
    }
  } catch (e) { diag((e as Error).message); }
  finally { screen.cursorWriting = false; }
}

function home(page = 0) {
  selectThread(null);
  return guard('Orca-glass', async () => {
    const allThreads = await api.threads();
    const threads = viewProvider === 'all' ? allThreads : allThreads.filter(t => t.agent === viewProvider);
    const pageCount = threads.length <= 4 ? 1 : 1 + Math.ceil((threads.length - 4) / 3);
    page = Math.max(0, Math.min(page, pageCount - 1));
    const pageSize = page === 0 ? 4 : 3;
    const start = page === 0 ? 0 : 4 + (page - 1) * 3;
    const visible = threads.slice(start, start + pageSize);
    const actions: { label: string; run: () => unknown }[] = [
      { label: `* Filter by Agent [${viewProvider === 'all' ? 'All sessions' : agentLabel(viewProvider)}]`, run: () => viewOptions() },
      { label: '* Refresh sessions', run: () => home(page) },
      { label: '+ New Session', run: newSession },
      { label: '◇ Usage', run: usage },
      ...visible.map(t => ({ label: sessionRow(t.title, t.handle, t.agent, t.state), run: () => thread(t) })),
    ];
    if (page > 0) actions.push({ label: 'Previous page', run: () => home(page - 1) });
    if (page + 1 < pageCount) actions.push({ label: 'Next page', run: () => home(page + 1) });
    const columns = actions.map((a, i): SessionColumns => {
      const t = i >= 4 ? visible[i - 4] : undefined;
      if (t) return { marker: t.state === 'idle' ? '/' : t.state === 'busy' ? '' : '?', title: compactSessionTitle(t.title, t.handle), right: `[${agentLabel(t.agent)}]`, busy: t.state === 'busy', handle: t.handle };
      return i === 0 ? { marker: '*', title: 'Filter by Agent', right: `[${viewProvider === 'all' ? 'All sessions' : agentLabel(viewProvider)}]` }
        : { marker: i === 1 ? '*' : i === 2 ? '+' : i === 3 ? '◇' : '', title: i === 1 ? 'Refresh sessions' : i === 2 ? 'New Session' : i === 3 ? 'Usage' : a.label, right: '' };
    });
    await show({ kind: 'list', title: sessionListTitle(allThreads.length), sessionList: true, columns, connectedCount: allThreads.length, selected: 0, paintedSelection: 0,
      items: actions.map(a => a.label),
      onPick: i => { actions[i]?.run(); } });
  }, home);
}

function viewOptions(page = 0) {
  return guard('Filter by Agent', async () => {
    const threads = await api.threads();
    const providers = ['all', 'claude', 'codex', ...new Set(threads.map(t => t.agent).filter(Boolean))]
      .filter((id, index, ids) => ids.indexOf(id) === index);
    if (!providers.includes(viewProvider)) providers.push(viewProvider);
    const size = LIST_MAX - 3;
    const actions: { label: string; run: () => unknown }[] = [{ label: '<-', run: () => home() }];
    for (const id of providers.slice(page * size, (page + 1) * size)) {
      actions.push({ label: `${id === 'all' ? 'All Sessions' : providerName(id)}${viewProvider === id ? ' ✓' : ''}`,
        run: async () => {
          await bridge.setLocalStorage('view-provider', id);
          viewProvider = id;
          await home();
        } });
    }
    if (page > 0) actions.push({ label: 'Previous page', run: () => viewOptions(page - 1) });
    if ((page + 1) * size < providers.length) actions.push({ label: 'Next page', run: () => viewOptions(page + 1) });
    await show({ kind: 'list', title: 'Filter by Agent', items: actions.map(a => a.label),
      onPick: i => { void actions[i]?.run(); }, onBack: home });
  }, home);
}

function thread(t: Thread, note = '') {
  selectThread(t);
  return guard(t.title, async () => {
    const title = () => `${t.title}${note ? `  ${note}` : ''}`;
    const snapshot = await api.thread(t.handle);
    const saved = !snapshot.menu ? await api.history(t.handle).catch(() => null) : null;
    const useSaved = saved?.source === 'codex-transcript';
    const text = useSaved ? saved.text : snapshot.text;
    const state = await api.activity(t.handle).catch(e => {
      diag(`Activity request failed: ${(e as Error).message}`);
      return { state: 'unknown', elapsedSeconds: null };
    });
    await show({ kind: 'text', title: title(), text, tail: true, activityState: state.state, reportedSeconds: state.state === 'working' ? state.elapsedSeconds ?? null : null, activityLabel: activityLabel(state.state), savedHistory: useSaved, reader: t, onBack: home,
      onHold: () => { void record(t, true); } });
    startReaderUpdates(current);
  }, home);
}


// Restart live updates without rebuilding the mounted chat after a successful send.
function startReaderUpdates(screen: Screen | null) {
  clearInterval(poll);
  clearInterval(statusAnimation);
  if (screen?.kind !== 'text' || !screen.reader) return;
  const t = screen.reader;
  screen.statusStartedAt ??= Date.now();
  let animating = false;
  statusAnimation = setInterval(async () => {
    if (animating || current !== screen || screen.activityState !== 'working') return;
    animating = true;
    const label = readerStatus('working', screen.statusFrame = (screen.statusFrame || 0) + 1, Date.now() - screen.statusStartedAt!);
    try {
      const accepted = await writePanel(label, () => current === screen && screen.activityState === 'working');
      if (accepted && current === screen) screen.activityLabel = label;
    } catch (e) { diag((e as Error).message); }
    finally { animating = false; }
  }, 200);
  let reading = false;
  poll = setInterval(async () => {
    if (reading || current !== screen) return;
    reading = true;
    const activity = await api.activity(t.handle).catch(e => {
      diag(`Activity request failed: ${(e as Error).message}`);
      return { state: 'unknown', elapsedSeconds: null };
    });
    if (current !== screen) { reading = false; return; }
    if (screen.activityState !== activity.state) { screen.statusFrame = 0; screen.statusStartedAt = Date.now(); }
    screen.activityState = activity.state;
    const seconds = activity.state === 'working' ? activity.elapsedSeconds ?? null : null;
    if (screen.reportedSeconds !== seconds) {
      screen.reportedSeconds = seconds;
      try { await inputHint(true); } catch (e) { diag((e as Error).message); }
      if (current !== screen) { reading = false; return; }
    }
    const label = readerStatus(activity.state, screen.statusFrame || 0, Date.now() - screen.statusStartedAt!);
    if (screen.activityLabel !== label) {
      try {
        const accepted = await writePanel(label, () => current === screen);
        if (accepted && current === screen) screen.activityLabel = label;
      } catch (e) { diag((e as Error).message); }
    }
    if (current !== screen || screen.reading) { reading = false; return; }
    let r = await (screen.savedHistory ? api.history(t.handle) : api.thread(t.handle)).catch(() => null);
    if (screen.savedHistory && (!r || !('source' in r) || r.source !== 'codex-transcript')) {
      r = await api.thread(t.handle).catch(() => null);
      // Stay on live output after losing the verified saved-history association.
      if (r && current === screen) screen.savedHistory = false;
    }
    // A pending old-session read must never overwrite another screen or draft.
    if (r && r.text.trim() && current === screen && r.text !== screen.text && !screen.reading) {
      screen.offset = undefined;
      try { await updateText(screen.title, r.text); }
      catch (e) { diag((e as Error).message); }
    }
    reading = false;
  }, POLL_MS);
}

function history(t: Thread) {
  const previous = current;
  return guard(t.title, async () => {
    const r = await api.history(t.handle);
    if (current !== previous) return;
    await show({ kind: 'text', title: r.source === 'codex-transcript' ? 'Conversation history' : 'Terminal buffer only',
      text: r.text || r.reason || 'No older terminal output is retained.', tail: true, reader: t,
      onBack: () => thread(t),
      onHold: () => { void record(t, true); } });
  }, () => thread(t));
}

function replies(t: Thread) {
  return guard(t.title, async () => {
    const { menu } = await api.thread(t.handle);
    if (menu) {
      await show({
        kind: 'list', title: t.title,
        items: menu.options.map(o => `${o.value}. ${o.label}`),
        onPick: (i) => {
          const option = menu.options[i];
          if (!option) return;
          show({ kind: 'text', title: 'Click to choose / Double-click to cancel',
            text: `${menu.question}\n\n${option.value}. ${option.label}`,
            onBack: () => replies(t),
            onClick: () => guard(t.title, async () => {
              if (sending) return;
              sending = true;
              try {
                await show({ kind: 'text', title: t.title, text: 'Sending…' });
                const result = await api.choice(t.handle, menu.id, option.value);
                await thread(t, `Input sent: ${result.sent}`);
              } finally { sending = false; }
            }, () => thread(t)),
          });
        },
        onBack: () => thread(t),
      });
      return;
    }
    await thread(t);
  }, () => thread(t));
}

// Reuse upstream PCM and local Whisper. Snapshots are serialized and provisional;
// only the final text can be sent, once, to the captured terminal handle.
let recording: Uint8Array[] | null = null;
let cancelCapture: (() => void) | null = null;
const MAX_REC_SEC = 60;

async function record(t: Thread, hold = false) {
  if ((hold && !holding) || recording !== null || cancelCapture) return;
  diag('Hold received. Opening voice panel…');
  const background = current;
  if (background?.kind !== 'text' || !background.reader) return;
  // Keep the mounted reader and its firmware scroll position untouched throughout
  // capture, transcription and review. Only a successful Send resumes updates.
  background.reading = true;
  clearInterval(poll);
  clearInterval(statusAnimation);
  let overlayActive = true;
  let overlayWrites: Promise<void> = Promise.resolve();
  const writeOverlay = (content: string, status = false) => {
    const write = overlayWrites.then(async () => {
      const accepted = await writePanel(content, () => true, status);
      if (!accepted) throw new Error('Glasses rejected the voice panel update.');
    });
    overlayWrites = write.catch(() => {});
    return write;
  };
  const voiceShow = async (screen: Extract<Screen, { kind: 'text' }>) => {
    if (!overlayActive) return;
    current = screen;
    try { await writeOverlay(clipBytes(screen.title ? `${screen.title}\n${screen.text}` : screen.text, 900)); }
    catch (e) {
      diag(`${(e as Error).message} Chat position preserved; voice panel could not update.`);
      throw e;
    }
  };
  const closeVoice = async () => {
    if (!overlayActive) return;
    overlayActive = false;
    current = background;
    await inputHint(true).catch(e => diag((e as Error).message));
    try { await writeOverlay(background.activityLabel || readerStatus('unknown'), true); }
    catch (e) { diag((e as Error).message); }
    finally { startReaderUpdates(background); }
  };
  recording = [];
  const chunks = recording;
  const t0 = Date.now();
  let stopped = false, cancelled = false, submitted = false;
  let tick: ReturnType<typeof setInterval> | undefined;
  let pending: Promise<void> | null = null;
  let lastBytes = 0, caption = '';
  const snapshot = () => {
    const pcm = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
    let offset = 0;
    for (const c of chunks) { pcm.set(c, offset); offset += c.length; }
    return pcm;
  };
  const cleanup = () => {
    clearInterval(tick);
    recording = null;
    releaseCapture = null;
  };
  const cancel = () => {
    cancelled = true;
    stopped = true;
    cleanup();
    cancelCapture = null;
    void bridge.audioControl(false).catch(() => {});
  };
  cancelCapture = cancel;
  const sendText = async (text: string) => {
    if (cancelled || submitted || sending) return;
    submitted = true;
    sending = true;
    cancelCapture = null;
    try {
      await voiceShow({ kind: 'text', title: t.title, text: 'Sending…' });
      await api.say(t.handle, text);
      await closeVoice();
      if (current === background) {
        background.reading = false;
        background.tail = true;
        background.offset = undefined;
        startReaderUpdates(background);
      }
    } catch (e) {
      await voiceShow({ kind: 'text', title: t.title, text: (e as Error).message, onBack: () => closeVoice(), onClick: () => closeVoice() }).catch(e => diag((e as Error).message));
    } finally { sending = false; }
  };
  const stop = async (finish: boolean) => {
    if (stopped) return;
    if (!finish) { cancel(); await closeVoice(); return; }
    stopped = true;
    cleanup();
    await bridge.audioControl(false).catch(() => {});
    try {
      await voiceShow({ kind: 'text', title: tr('transcribing'), text: caption || 'Finishing transcription…',
        onBack: () => { cancel(); void closeVoice(); } });
      await pending;
      if (cancelled) return;
      const pcm = snapshot();
      const text = pcm.length === lastBytes ? caption : (await api.transcribe(pcm)).text.trim();
      if (cancelled) return;
      cancelCapture = null;
      if (!text) {
        await voiceShow({ kind: 'text', title: tr('voiceTitle'), text: tr('notHeard'), onClick: () => closeVoice(), onBack: () => closeVoice() });
      } else {
        cancelCapture = cancel;
        await voiceShow({ kind: 'text', title: '', text,
          onClick: () => { void sendText(text); }, onBack: () => { cancel(); void closeVoice(); } });
      }
    } catch (e) {
      if (cancelled) return;
      cancelCapture = null;
      await voiceShow({ kind: 'text', title: tr('voiceTitle'), text: (e as Error).message, onBack: () => closeVoice(), onClick: () => closeVoice() }).catch(e => diag((e as Error).message));
    }
  };
  if (hold) releaseCapture = () => { void stop(true); };
  const hint = hold ? 'Speak. Release to review. Double-click to cancel.' : tr('recordingHint');
  try {
    await inputHint(false);
    await voiceShow({ kind: 'text', title: tr('recording', 0), text: hint,
      onClick: hold ? undefined : () => { void stop(true); }, onBack: () => { void stop(false); } });
  } catch (e) {
    cancel();
    current = background;
    void inputHint(true).catch(() => {});
    startReaderUpdates(background);
    diag((e as Error).message);
    return;
  }
  if (stopped) return;
  const ok = await bridge.audioControl(true, AudioInputSource.Glasses).catch(() => false);
  if (stopped) { await bridge.audioControl(false); return; }
  if (!ok) {
    cancel();
    await voiceShow({ kind: 'text', title: tr('voiceTitle'), text: tr('micFailed'), onClick: () => closeVoice(), onBack: () => closeVoice() });
    return;
  }
  diag('Recording — bottom voice panel.');
  tick = setInterval(() => {
    if (stopped) return;
    const sec = Math.floor((Date.now() - t0) / 1000);
    if (sec >= MAX_REC_SEC) { void stop(true); return; }
    if (pending) return; // No overlapping inference or growing request queue.
    const pcm = snapshot();
    if (pcm.length < 16000 || pcm.length === lastBytes) return;
    pending = (async () => {
      try {
        const result = await api.transcribe(pcm);
        if (cancelled) return;
        lastBytes = pcm.length;
        caption = result.text.trim();
        if (!stopped && caption) await voiceShow({ kind: 'text', title: '', text: caption,
          onBack: () => { void stop(false); } });
      } catch { /* Final transcription reports errors; transient preview failure is not a send. */ }
      finally { pending = null; }
    })();
  }, 1500);
}

function usage() {
  return guard(tr('usageTitle'), async () => {
    const u = await api.usage();
    // rateLimits には設定フラグ等も混ざるので provider を持つ項目だけ使う
    const all = Object.entries(u).filter(([, v]) => v && typeof v === 'object' && 'provider' in v);
    const ok = all.filter(([, v]) => v.status === 'ok');
    const ng = all.filter(([, v]) => v.status !== 'ok').map(([name]) => name);
    const lines = ok.map(([name, v]) => {
      const s = v.session ? `5h ${v.session.usedPercent}% (${v.session.resetDescription})` : '';
      const w = v.weekly ? `${tr('weekly')} ${v.weekly.usedPercent}% (${v.weekly.resetDescription})` : '';
      return `${name}\n  ${[s, w].filter(Boolean).join(' / ') || tr('noInfo')}`;
    });
    if (ng.length) lines.push(tr('unavailable', ng.join(', ')));
    await show({ kind: 'text', title: tr('usageTitle'), text: lines.join('\n'), onBack: home, onClick: home });
  }, home);
}

// 新規セッション: 作業場所 → エージェント → モデル → 最初の指示 → 確認
function newSession() {
  return guard(tr('newTitle'), async () => {
    const ws = await api.workspaces();
    await show({
      kind: 'list',
      title: tr('step1'),
      items: ws.map((w) => w.name),
      onPick: (i) => ws[i] && pickAgent(ws[i]),
      onBack: home,
    });
  }, home);
}

function pickAgent(w: Workspace) {
  return guard(tr('newTitle'), async () => {
    const ps = await api.providers();
    await show({
      kind: 'list',
      title: tr('step2', w.name),
      items: ps.map((p) => `${p.ok ? '○' : '×'} ${p.id}  ${p.note}`),
      onPick: (i) => ps[i]?.ok && pickModel(w, ps[i]),
      onBack: newSession,
    });
  }, newSession);
}

function pickModel(w: Workspace, p: Provider) {
  if (p.models.length === 1) return pickPrompt(w, p, p.models[0]);
  return show({
    kind: 'list',
    title: tr('step3', p.id),
    items: p.models,
    onPick: (i) => pickPrompt(w, p, p.models[i]),
    onBack: () => pickAgent(w),
  });
}

function pickPrompt(w: Workspace, p: Provider, model: string) {
  return guard(tr('newTitle'), async () => {
    const prompts = await api.prompts();
    await show({
      kind: 'list',
      title: tr('step4'),
      items: prompts,
      onPick: (i) => confirm(w, p, model, i, prompts[i]),
      onBack: () => pickModel(w, p),
    });
  }, () => pickModel(w, p));
}

function confirm(w: Workspace, p: Provider, model: string, prompt: number, label: string) {
  return show({
    kind: 'list',
    title: `${w.name} / ${p.id} ${model} / ${label}`,
    items: [tr('launch'), tr('cancel')],
    onPick: async (i) => {
      if (i !== 0) return home();
      await show({ kind: 'text', title: tr('launching'), text: tr('waitingAgent') });
      await guard(tr('newTitle'), async () => {
        const r = await api.startSession({ workspaceId: w.id, agent: p.id, model, prompt });
        const text = r.sent || !prompt ? tr('launched') : tr('launchedNotSent', r.reason ?? '');
        await show({ kind: 'text', title: tr('newTitle'), text, onClick: home, onBack: home });
      }, home);
    },
    onBack: () => pickPrompt(w, p, model),
  });
}

// ---- 入力 ----

function onEvent(e: EvenHubEvent) {
  if (e.menuItemClickEvent) return;
  const systemType = e.sysEvent?.eventType;
  if (systemType === OsEventTypeList.SYSTEM_EXIT_EVENT || systemType === OsEventTypeList.ABNORMAL_EXIT_EVENT) {
    clearInterval(poll);
    clearInterval(statusAnimation);
    clearInterval(menuAnimation);
    clearInterval(menuPoll);
    current = null;
    cancelCapture?.();
    return;
  }
  if (e.audioEvent) {
    recording?.push(e.audioEvent.audioPcm);
    return;
  }
  const s = current;
  if (!s) return;
  // Press/release are system events even when another envelope accompanies them.
  const ev = [e.sysEvent, e.textEvent, e.listEvent].find(event =>
    event && [OsEventTypeList.LONG_PRESS_EVENT, OsEventTypeList.LONG_PRESS_RELEASE_EVENT].includes(event.eventType as OsEventTypeList))
    ?? e.listEvent ?? e.textEvent ?? e.sysEvent;
  if (!ev) return;
  // CLICK_EVENT(0) は既定値のため JSON から省かれて届くことがある
  const type = ev.eventType ?? OsEventTypeList.CLICK_EVENT;
  if (s.kind === 'list' && s.sessionList && (type === OsEventTypeList.SCROLL_TOP_EVENT || type === OsEventTypeList.SCROLL_BOTTOM_EVENT)) {
    s.selected = Math.max(0, Math.min(s.items.length - 1, (s.selected || 0) + (type === OsEventTypeList.SCROLL_TOP_EVENT ? -1 : 1)));
    if (!s.cursorWriting) sessionCursorWrites = updateSessionCursor(s);
    return;
  }
  if (s.kind === 'text' && (type === OsEventTypeList.SCROLL_TOP_EVENT || type === OsEventTypeList.SCROLL_BOTTOM_EVENT)) {
    // Firmware scrolls overflowing text. Replacing content here causes visible jumps.
    // Pause polling so incoming output cannot reset the reader's scroll position.
    s.reading = true;
    // These events also report gestures, not reliably just boundaries. Never
    // replace the block on a swipe.
    return;
  }
  if (type === OsEventTypeList.LONG_PRESS_EVENT) {
    diag(holding ? 'Hold received; waiting for button release.' : 'Hold event received.');
    if (!holding) {
      holding = true;
      if (s.kind === 'text') s.onHold?.();
    }
    return;
  }
  if (type === OsEventTypeList.LONG_PRESS_RELEASE_EVENT) {
    holding = false;
    releaseCapture?.();
    return;
  }
  if (type === OsEventTypeList.DOUBLE_CLICK_EVENT) {
    if (s.onBack) s.onBack();
    else bridge.shutDownPageContainer(1);
    return;
  }
  if (type !== OsEventTypeList.CLICK_EVENT) return;
  if (s.kind === 'list') {
    // 先頭項目(0)も既定値として省かれうる
    if (s.sessionList) {
      const index = e.listEvent?.currentSelectItemIndex ?? s.selected ?? 0;
      // Finish in-flight cursor writes before reusing BODY on the next page.
      void sessionCursorWrites.then(() => { if (current === s) s.onPick(index); });
    }
    else if (e.listEvent) s.onPick(e.listEvent.currentSelectItemIndex ?? 0);
  } else {
    s.onClick?.();
  }
}

// ---- 接続設定(スマホ側の画面) ----

const $ = (id: string) => document.getElementById(id) as HTMLInputElement;

function diag(line: string) {
  $('diag').textContent = line;
}

async function connect() {
  const code = await bridge.getLocalStorage('code');
  const pairing = parseCode(code);
  $('code').value = code;
  const t0 = Date.now();
  setDemo(code === 'demo');
  if (code === 'demo') {
    diag(tr('diagOk', 0, tr('viaDemo'), '-', 3));
    return home();
  }
  if (!pairing) {
    diag(tr('notPairedDiag'));
    return show({ kind: 'text', title: 'Orca Glass', text: tr('notPaired') });
  }
  try {
    const base = await resolveBase(pairing);
    if (!base) throw new Error(tr('noRelay'));
    setConnection({ token: pairing.token, base, resolve: () => resolveBase(pairing) });
    await api.health();
    const threads = await api.threads();
    diag(tr('diagOk', Date.now() - t0, tr('viaCode'), currentBase(), threads.length));
  } catch (e) {
    diag(tr('diagNg', (e as Error).message, tr('viaCode'), currentBase()));
    return show({
      kind: 'text',
      title: tr('offlineTitle'),
      text: tr('offline', (e as Error).message),
      onClick: () => connect(),
    });
  }
  await home();
}

function useLang(pref: string) {
  const l = detectLang(pref);
  setLang(l);
  setApiLang(l);
  applyPage();
}

async function main() {
  document.getElementById('app-heading')!.textContent = sessionHeading();
  bridge = await waitForEvenAppBridge();
  // 開発用URLからも接続コードと言語だけを読み込む
  const q = new URLSearchParams(location.search);
  for (const k of ['code']) {
    // Accept escaped QR query keys; language is fixed to English.
    const v = q.get(k) ?? q.get(`amp;${k}`);
    if (v != null) await bridge.setLocalStorage(k, v);
  }
  const pref = 'en';
  await bridge.setLocalStorage('lang', 'en');
  viewProvider = (await bridge.getLocalStorage('view-provider')) || 'all';
  useLang(pref);
  const draft = document.getElementById('reply-text') as HTMLTextAreaElement;
  const send = document.getElementById('send-reply') as HTMLButtonElement;
  const status = document.getElementById('reply-status')!;
  let reviewed: { handle: string; text: string } | null = null;
  draft.addEventListener('input', () => { reviewed = null; send.hidden = true; });
  document.getElementById('reply-form')!.addEventListener('submit', ev => {
    ev.preventDefault();
    if (!selectedThread || sending || !draft.value.trim()) return;
    reviewed = { handle: selectedThread.handle, text: draft.value.trim() };
    status.textContent = `Ready to send to ${selectedThread.title}: ${reviewed.text}`;
    send.hidden = false;
  });
  send.addEventListener('click', async () => {
    if (sending || !reviewed || reviewed.handle !== selectedThread?.handle || reviewed.text !== draft.value.trim()) return;
    const message = reviewed;
    reviewed = null;
    sending = true;
    send.hidden = true;
    status.textContent = 'Sending…';
    try {
      await api.say(message.handle, message.text);
      if (selectedThread?.handle === message.handle) {
        draft.value = '';
        status.textContent = 'Sent.';
      }
    } catch (e) {
      if (selectedThread?.handle === message.handle) status.textContent = (e as Error).message;
    } finally { sending = false; }
  });
  $('conn').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    cancelCapture?.();
    holding = false;
    await bridge.setLocalStorage('lang', 'en');
    useLang('en');
    const code = $('code').value.trim();
    if (code && code !== 'demo' && !parseCode(code)) return diag(tr('badCode'));
    await bridge.setLocalStorage('code', code);
    await connect();
  });
  $('demo').addEventListener('click', async () => {
    await bridge.setLocalStorage('code', 'demo');
    await connect();
  });
  bridge.onEvenHubEvent(onEvent);
  window.addEventListener('pagehide', () => { clearInterval(poll); clearInterval(statusAnimation); clearInterval(menuAnimation); clearInterval(menuPoll); cancelCapture?.(); });
  await connect();
}

main();
