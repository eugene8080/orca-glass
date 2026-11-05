import {
  AudioInputSource,
  CreateStartUpPageContainer,
  ListContainerProperty,
  ListItemContainerProperty,
  MenuContainerProperty,
  MenuItemProperty,
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
import { api, currentBase, setApiLang, setConnection, setDemo, type ChoiceMenu, type Provider, type Thread, type Usage, type Workspace } from './api';
import { parseCode, resolveBase } from './pairing';
import { applyPage, detectLang, setLang, t as tr } from './i18n';
import { clipBytes, tailBytes, textSections, readerPages, latestResponseStart, choiceNumber, readerContent, glassTextWidth } from './text';
import { readerStatus, statusPixels, SPINNER, WORKING_LABELS } from './reader-status';
import { statusRight } from './footer-hint';
import { formatReset, RESET_MODES, resetModeLabel, type ResetMode } from './usage-reset';
import { agentLabel, sessionRow, sessionListTitle, sessionHeading, MENU_LEFT, MENU_RIGHT, MENU_CURSOR, sessionAgentLabel, menuNativeText, menuCursorText, nativeRight, glassWidth, compactSessionTitle, type SessionColumns } from './session-list';

// 画面 576x288。上に見出し(テキスト)、下に本文(リスト or テキスト)の2段構成で統一する。
const HEAD = { containerID: 1, containerName: 'head', xPosition: 0, yPosition: 0, width: 576, height: 36 };
const BODY = { containerID: 2, containerName: 'body', xPosition: 0, yPosition: 40, width: 576, height: 248 };
// Reader: nine 27px chat rows (y4..247), a divider at y250 and one status row
// (y254..281). Status (left, 'voice') and hint/page (right, 'hint') share that
// row as two transparent text layers; their combined width is fitted to the row.
const READER_ROWS = 9;
const READER_TOP = 4;
const READER_HEIGHT = READER_ROWS * 27;
const STATUS_ROW_Y = 254;
const VOICE = { containerID: 3, containerName: 'voice', xPosition: 16, yPosition: STATUS_ROW_Y, width: 544, height: 28 };
const FRAME = { containerID: 4, containerName: 'frame', xPosition: 0, yPosition: 0, width: 576, height: 288 };
const DIVIDER = { containerID: 5, containerName: 'divider', xPosition: 16, yPosition: 250, width: 544, height: 2 };
const HINT = { containerID: 6, containerName: 'hint', xPosition: 280, yPosition: STATUS_ROW_Y, width: 280, height: 28 };
const STATUS_ICON = { containerID: 7, containerName: 'status-icon', xPosition: 16, yPosition: STATUS_ROW_Y, width: 20, height: 28 };
// Full-screen voice page: the same nine rows hold the scrollable transcript and
// the status row holds the instruction. IDs/layers are contiguous from 1/0.
const VOICE_BODY = { containerID: 1, containerName: 'voice-body', xPosition: 8, yPosition: READER_TOP, width: 560, height: READER_HEIGHT };
const VOICE_HINT = { containerID: 2, containerName: 'voice-hint', xPosition: 16, yPosition: STATUS_ROW_Y, width: 544, height: 28 };
const VOICE_FRAME = { ...FRAME, containerID: 3, containerName: 'voice-frame' };
const VOICE_DIVIDER = { ...DIVIDER, containerID: 4, containerName: 'voice-divider' };
const USAGE_RESET = { containerID: 3, containerName: 'usage-reset', xPosition: 0, yPosition: 28, width: 576, height: 28 };
const LIST_ITEM_BYTES = 63;
const LIST_MAX = 20;
const TEXT_BYTES = 999;
const POLL_MS = 1000;

type Screen =
  | { kind: 'list'; title: string; items: string[]; sessionList?: boolean; workspacePicker?: boolean; menuActions?: { id: number; label: string; run: () => unknown }[]; compat?: boolean; columns?: SessionColumns[]; connectedCount?: number; selected?: number; paintedSelection?: number; menuFrame?: number; paintedCursor?: string; cursorWriting?: boolean; paging?: boolean; onPreviousPage?: () => unknown; onNextPage?: () => unknown; onPick: (i: number) => void; onBack?: () => void }
  | { kind: 'text'; title: string; text: string; usageMode?: ResetMode; conversationText?: string; choiceMenu?: ChoiceMenu | null; tail?: boolean; offset?: number; pageText?: string; pages?: string[]; pageTarget?: number; pageWriting?: boolean; reading?: boolean; refreshing?: boolean; responsePage?: number; openAtResponse?: boolean; model?: string; voice?: boolean; voiceHint?: string; voiceTail?: boolean; activityLabel?: string; activityState?: string; reportedSeconds?: number | null; statusFrame?: number; statusStartedAt?: number; savedHistory?: boolean; reader?: Thread; onClick?: () => void; onBack?: () => void; onHold?: () => void; };

let bridge: EvenAppBridge;
let current: Screen | null = null;
let started = false;
let compactMenuOnly = false;
let poll: ReturnType<typeof setInterval> | undefined;
let menuPoll: ReturnType<typeof setInterval> | undefined;
let menuAnimation: ReturnType<typeof setInterval> | undefined;
let statusAnimation: ReturnType<typeof setInterval> | undefined;
let readerWrites: Promise<void> = Promise.resolve();
let panelWrites: Promise<void> = Promise.resolve();
let sessionCursorWrites: Promise<void> = Promise.resolve();
let selectedThread: Thread | null = null;
let sending = false;
let holding = false;
let releaseCapture: (() => void) | null = null;
let viewProvider = 'all';
let usageResetMode: ResetMode = 'computer';
let viewWorkspaces: Set<string> | null = null;
let workspaceNames = new Map<string, string>();
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

// Reader body is 560px wide with no padding. 560px rows fit in the simulator; keep
// 8px (under one glyph) in case hardware rendering differs slightly.
const READER_WRAP_WIDTH = 552;
type TextScreen = Extract<Screen, { kind: 'text' }>;
function readerLayout(s: TextScreen) {
  if (s.pageText !== s.text || !s.pages) {
    const ctx = document.createElement?.('canvas').getContext('2d');
    if (ctx) ctx.font = '21px Arial';
    // Wrap with the measured firmware font; Arial only sizes non-ASCII glyphs.
    const measure = (text: string) => glassTextWidth(text, ch => ctx ? ctx.measureText(ch).width : 21);
    // Open on the latest response. When it already lies wholly on the last
    // page, keep normal pages; otherwise start a fresh page at its first line
    // so it opens at the page top. Pages keep every character except the
    // newlines at row breaks, so non-newline counts locate the start.
    const start = latestResponseStart(s.text);
    const whole = readerPages(s.text, measure, READER_WRAP_WIDTH, READER_ROWS);
    const chars = (text: string) => text.replaceAll('\n', '').length;
    if (start < 0) {
      s.pages = whole;
      s.responsePage = undefined;
    } else if (chars(s.text.slice(0, start)) >= chars(whole.slice(0, -1).join(''))) {
      s.pages = whole;
      s.responsePage = whole.length - 1;
    } else {
      const before = start > 0 ? readerPages(s.text.slice(0, start - 1), measure, READER_WRAP_WIDTH, READER_ROWS) : [];
      s.pages = [...before, ...readerPages(s.text.slice(start), measure, READER_WRAP_WIDTH, READER_ROWS)];
      s.responsePage = before.length;
    }
    s.pageText = s.text;
  }
  return s.pages;
}

function bodyText(s: TextScreen) {
  const sections = s.reader ? readerLayout(s) : textSections(s.text);
  // Opening a session shows the top of the latest response once; later live
  // updates and refreshes follow the newest page.
  const tail = s.openAtResponse && s.responsePage !== undefined ? s.responsePage : sections.length - 1;
  s.openAtResponse = false;
  s.offset = Math.max(0, Math.min(s.offset ?? (s.tail ? tail : 0), sections.length - 1));
  return sections[s.offset];
}

// Full-screen voice page: nine scrollable transcript rows, a divider and one
// instruction row. Live captions show their latest words; review shows the start.
function voiceBodyText(s: TextScreen) {
  return (s.voiceTail ? tailBytes(s.text, 900) : clipBytes(s.text, 900)) || ' ';
}
function voicePage(s: TextScreen, content: string) {
  return { containerTotalNum: 4, textObject: [
    new TextContainerProperty({ ...VOICE_BODY, content, paddingLength: 0, isEventCapture: 1, zOrderIndex: 1 }),
    new TextContainerProperty({ ...VOICE_HINT, content: s.voiceHint || ' ', textColor: 4, paddingLength: 0, isEventCapture: 0, zOrderIndex: 3 }),
    new TextContainerProperty({ ...VOICE_FRAME, content: ' ', textColor: 4, borderWidth: 2, borderColor: 15, borderRadius: 0, isEventCapture: 0, zOrderIndex: 0 }),
    new TextContainerProperty({ ...VOICE_DIVIDER, content: ' ', textColor: 4, borderWidth: 2, borderColor: 15, isEventCapture: 0, zOrderIndex: 2 }),
  ] };
}

// The reader keeps its head container (stable IDs/layers) but leaves it blank.
function screenTitle(s: Screen) { return s.kind === 'text' && s.reader ? ' ' : s.title; }

// Left part of the status row: '/Waiting Opus5.5'. A working label starts with
// its spinner glyph, drawn as a separate 20px image, so four spaces replace it.
function statusLeft(label: string, model?: string) {
  const line = model ? `${label} ${model}` : label;
  return label[0] !== '/' && label.length > 2 ? '    ' + line.slice(2) : line;
}

// Right part: '[Tap&hold] Pg77/78', right-aligned in its own layer on the same
// row. Reserve the widest left text this state can show (working words rotate)
// and shrink the hint so the two parts never collide.
function readerHint(s: TextScreen, seconds: number | null | undefined) {
  bodyText(s);
  const left = s.activityState === 'working'
    ? Math.max(...WORKING_LABELS.map(word => glassWidth(statusLeft(`. ${word}...`, s.model))))
    : glassWidth(statusLeft(s.activityLabel || readerStatus('unknown'), s.model));
  const room = Math.min(VOICE.width - 6 - left - 10, HINT.width - 6);
  const page = s.refreshing ? 'Refreshing…' : `Pg${s.offset! + 1}/${s.pages!.length}`;
  return nativeRight(statusRight(seconds, !!s.choiceMenu, page, text => glassWidth(text) <= room), HINT.width);
}

function flipReader(s: TextScreen, delta: number) {
  const pages = readerLayout(s);
  // Swiping down past the last page resumes live updates and fetches now.
  if (delta > 0 && !s.pageWriting && (s.offset ?? 0) >= pages.length - 1) { void refreshReader(s); return; }
  s.reading = true; // Freeze this snapshot and its page count while browsing.
  s.pageTarget = Math.max(0, Math.min(pages.length - 1, (s.pageTarget ?? s.offset ?? 0) + delta));
  if (s.pageWriting) return;
  s.pageWriting = true;
  const write = readerWrites.then(async () => {
    while (current === s && s.pageTarget !== s.offset) {
      const target = s.pageTarget!;
      const next = { ...s, offset: target };
      const content = bodyText(next);
      if (!await bridge.textContainerUpgrade(new TextContainerUpgrade({ containerID: BODY.containerID, containerName: BODY.containerName, content }))) throw new Error('Glasses rejected the page. Swipe to retry.');
      if (current !== s) return;
      s.offset = target;
      await inputHint();
      if (current !== s) return;
    }
  });
  readerWrites = write.catch(e => diag((e as Error).message)).finally(() => { s.pageWriting = false; s.pageTarget = undefined; });
}

// Unfreeze a browsed snapshot, show Refreshing… in the counter row, run one poll
// immediately, then restore the counter. Polling continues live afterwards.
async function refreshReader(s: TextScreen) {
  if (s.refreshing || current !== s) return;
  s.refreshing = true;
  s.reading = false;
  s.tail = true;
  try {
    await inputHint();
    if (current !== s) return;
    await startReaderUpdates(s)?.();
  } catch (e) { diag((e as Error).message); }
  finally {
    s.refreshing = false;
    if (current === s) await inputHint().catch(e => diag((e as Error).message));
  }
}

function activityLabel(state: string) {
  return readerStatus(state);
}

// Reader status (left part of the status row). Writes are serialized with the
// hint so the two layers of the row never interleave.
function writePanel(label: string, active: () => boolean = () => true) {
  const owner = current;
  const write = panelWrites.then(async () => {
    if (!active() || owner?.kind !== 'text' || !owner.reader) return false;
    let visible = statusLeft(label, owner.model);
    try {
      await bridge.updateImageRawData(new ImageRawDataUpdate({ containerID: STATUS_ICON.containerID, containerName: STATUS_ICON.containerName,
        imageData: statusPixels(label[0] !== '/' ? label[0] : '') }));
    } catch (e) {
      // A missing image renderer must not prevent the status text.
      diag((e as Error).message);
      visible = owner.model ? `${label} ${owner.model}` : label;
    }
    if (!active()) return false;
    return bridge.textContainerUpgrade(new TextContainerUpgrade({ containerID: VOICE.containerID, containerName: VOICE.containerName, content: visible || ' ', textColor: 4 }));
  });
  panelWrites = write.then(() => {}, () => {});
  return write;
}

async function inputHint() {
  const owner = current;
  if (owner?.kind !== 'text' || !owner.reader) return;
  const write = panelWrites.then(async () => {
    if (current !== owner) return;
    await bridge.textContainerUpgrade(new TextContainerUpgrade({ containerID: HINT.containerID, containerName: HINT.containerName,
      content: readerHint(owner, owner.reportedSeconds), textColor: 4 }));
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
  const content = s.kind === 'text' ? (s.voice ? voiceBodyText(s) : bodyText(s)) : '';
  const uploadText = reloadText || (s.kind === 'text' && !!s.reader && s.text.length > 900) || new TextEncoder().encode(content).length > 999;
  const head = new TextContainerProperty({ ...HEAD, ...(s.kind === 'text' && s.usageMode ? { height: 28 } : {}), ...(s.kind === 'text' && s.reader ? { xPosition: 16, yPosition: 2, width: 544, height: 28, zOrderIndex: 1 } : {}), content: s.kind === 'list' && s.sessionList ? sessionHeading() : clipBytes(screenTitle(s), TEXT_BYTES), isEventCapture: 0 });
  // Firmware retains Display off, Brightness and Close alongside these actions.
  const menu = s.kind === 'list' && s.sessionList ? { menuObject: new MenuContainerProperty({
    menuItems: s.menuActions!.map(action => new MenuItemProperty({ itemID: action.id, itemName: action.label })),
  }) } : {};
  let page =
    s.kind === 'list'
      ? {
          containerTotalNum: s.sessionList ? 6 : 2,
          ...menu,
          textObject: s.sessionList ? [
            new TextContainerProperty({ ...HEAD, width: 300, height: 28, content: sessionHeading(), isEventCapture: 0, paddingLength: 0, zOrderIndex: 1 }),
            new TextContainerProperty({ containerID: 3, containerName: 'menu-count', xPosition: 300, yPosition: 0, width: 276, height: 28, content: nativeRight(`${s.connectedCount} sessions`, 276), isEventCapture: 0, paddingLength: 0, zOrderIndex: 2 }),
            new TextContainerProperty({ containerID: 5, containerName: 'menu-input', xPosition: 0, yPosition: 0, width: 576, height: 288, content: ' ', isEventCapture: 1, paddingLength: 0, zOrderIndex: 0 }),
            new TextContainerProperty({ ...MENU_CURSOR, content: menuCursorText(s.columns!, s.selected || 0), isEventCapture: 0, paddingLength: 0, zOrderIndex: 3 }),
            new TextContainerProperty({ ...MENU_LEFT, content: menuNativeText(s.columns!), isEventCapture: 0, paddingLength: 0, zOrderIndex: 4 }),
            new TextContainerProperty({ containerID: 6, containerName: 'menu-right', ...MENU_RIGHT, yPosition: 28, height: 260, content: s.columns!.map(r => nativeRight(r.right, MENU_RIGHT.width)).join('\n'), isEventCapture: 0, paddingLength: 0, zOrderIndex: 5 }),
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
          containerTotalNum: s.reader ? 7 : s.usageMode ? 3 : 2,
          textObject: [head, new TextContainerProperty({ ...BODY, ...(s.usageMode ? { yPosition: 64, height: 224 } : {}), ...(s.reader ? { xPosition: 8, yPosition: READER_TOP, width: 560, paddingLength: 0, zOrderIndex: 2, height: READER_HEIGHT } : {}), content: uploadText ? '' : content, isEventCapture: 1 }),
            ...(s.usageMode ? [new TextContainerProperty({ ...USAGE_RESET, content: `Reset: ${resetModeLabel(s.usageMode)}  (Click to change)`, isEventCapture: 0 })] : []),
            ...(s.reader ? [
              new TextContainerProperty({ ...HINT, content: readerHint(s, s.reportedSeconds), textColor: 4, isEventCapture: 0, paddingLength: 0, zOrderIndex: 6 }),
              new TextContainerProperty({ ...VOICE, content: statusLeft(s.activityLabel!, s.model), textColor: 4, isEventCapture: 0, paddingLength: 0, zOrderIndex: 5 }),
              new TextContainerProperty({ ...FRAME, content: ' ', textColor: 4, borderWidth: 2, borderColor: 15, borderRadius: 0, isEventCapture: 0, zOrderIndex: 0 }),
              new TextContainerProperty({ ...DIVIDER, content: ' ', textColor: 4, borderWidth: 2, borderColor: 15, isEventCapture: 0, zOrderIndex: 3 }),
            ] : [])],
          ...(s.reader ? { imageObject: [new ImageContainerProperty({ ...STATUS_ICON, zOrderIndex: 4 })] } : {}),
        };
  if (s.kind === 'text' && s.voice) page = voicePage(s, content) as typeof page;
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
    if (s.kind === 'list' && s.sessionList && compactMenuOnly) {
      s.compat = true; page = compatibilityMenu(s, menu) as typeof page;
    }
    if (s.kind === 'list' && s.workspacePicker) { s.compat = true; page = compatibilityMenu(s, {}) as typeof page; }
    let accepted = await bridge.rebuildPageContainer(new RebuildPageContainer(page));
    if (!accepted && s.kind === 'list' && s.sessionList && !s.compat) {
      s.compat = true;
      accepted = await bridge.rebuildPageContainer(new RebuildPageContainer(compatibilityMenu(s, menu)));
      if (accepted) { compactMenuOnly = true; diag(`${sessionHeading()}: aligned layout rejected; compact compatibility menu active.`); }
    }
    if (!accepted) throw new Error(`${sessionHeading()}: ${s.kind === 'list' && s.sessionList ? 'both aligned and compact menus rejected' : 'glasses rejected the screen update'}.`);
    if (s.kind === 'list' && s.sessionList) document.getElementById('menu-layout')!.textContent = s.compat
      ? 'Menu layout: Compact compatibility' : 'Menu layout: Aligned native text (animated dots)';
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
  const write = async () => {
    if (current !== screen || (screen.reader && screen.reading)) return;
    const next = { ...screen, title, text };
    if (screen.reader) next.offset = undefined; // Live mode follows the newest page.
    const content = bodyText(next);
    if (screenTitle(next) !== screenTitle(screen)) {
      if (!await bridge.textContainerUpgrade(new TextContainerUpgrade({ containerID: HEAD.containerID, containerName: HEAD.containerName, content: clipBytes(screenTitle(next), TEXT_BYTES) }))) throw new Error('Glasses rejected the title update.');
    }
    if (current !== screen || (screen.reader && screen.reading)) return;
    if (!await bridge.textContainerUpgrade(new TextContainerUpgrade({ containerID: BODY.containerID, containerName: BODY.containerName, content }))) throw new Error('Glasses rejected the live text update. Retrying.');
    if (current === screen && !(screen.reader && screen.reading)) { screen.title = title; screen.text = text; screen.offset = next.offset; screen.pages = next.pages; screen.pageText = next.pageText; screen.responsePage = next.responsePage; if (screen.reader) await inputHint(); }
  };
  if (screen.reader) {
    const work = readerWrites.then(write);
    readerWrites = work.catch(() => {});
    await work;
  } else await write();
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
    new TextContainerProperty({ ...HEAD, height: 28, content: screen.title, isEventCapture: 0 }),
    new TextContainerProperty({ ...BODY, yPosition: 28, height: 260, content: compatibilityText(screen), isEventCapture: 0 }),
    new TextContainerProperty({ containerID: 3, containerName: 'menu-input', xPosition: 0, yPosition: 0,
      width: 576, height: 288, content: ' ', isEventCapture: 1 }),
  ] };
}
function compatibilityText(screen: SessionMenuScreen, selected = screen.selected || 0) {
  return screen.items.map((item, i) => `${i === selected ? '>' : ' '} ${clipBytes(item, 48)}`).join('\n');
}
function startMenuSpinner(screen: SessionMenuScreen) {
  let polling = false;
  screen.menuFrame = 0;
  screen.paintedCursor = menuCursorText(screen.columns!, screen.selected || 0);
  menuAnimation = setInterval(() => {
    if (current !== screen || screen.paging) return;
    screen.menuFrame = ((screen.menuFrame || 0) + 1) % 3;
    if (!screen.cursorWriting) sessionCursorWrites = updateSessionCursor(screen);
  }, 500);
  menuPoll = setInterval(async () => {
    if (polling || current !== screen || screen.paging) return;
    polling = true;
    try {
      const latest = await api.threads();
      if (current !== screen || screen.paging) return;
      for (const row of screen.columns!) {
        if (!row.handle) continue;
        const state = latest.find(t => t.handle === row.handle)?.state || 'unknown';
        row.busy = state === 'busy'; row.marker = state === 'idle' ? '/' : state === 'busy' ? '' : '?';
      }
      if (!screen.cursorWriting) sessionCursorWrites = updateSessionCursor(screen);
    } catch (e) { diag((e as Error).message); }
    finally { polling = false; }
  }, 3000);
}
async function updateSessionCursor(screen: SessionMenuScreen) {
  if (screen.cursorWriting) return;
  screen.cursorWriting = true;
  try {
    // Coalesce rapid swipes to the newest position instead of queuing redraws.
    while (current === screen) {
      const content = screen.compat ? compatibilityText(screen) : menuCursorText(screen.columns!, screen.selected || 0, screen.menuFrame || 0);
      if (screen.compat ? screen.paintedSelection === screen.selected : screen.paintedCursor === content) break;
      const selected = screen.selected || 0;
      const accepted = await bridge.textContainerUpgrade(new TextContainerUpgrade(screen.compat
        ? { containerID: BODY.containerID, containerName: BODY.containerName, content: compatibilityText(screen, selected) }
        : { containerID: MENU_CURSOR.containerID, containerName: MENU_CURSOR.containerName, content }));
      if (!accepted) throw new Error('Session menu text update rejected');
      screen.paintedSelection = selected;
      screen.paintedCursor = content;
    }
  } catch (e) { diag((e as Error).message); }
  finally { screen.cursorWriting = false; }
}

function home(page = 0, selected = 0) {
  selectThread(null);
  return guard('Orca-glass', async () => {
    const owner = current;
    const allThreads = await api.threads();
    if (current !== owner) return;
    const threads = allThreads.filter(t => (viewProvider === 'all' || t.agent === viewProvider) && (viewWorkspaces === null || !!t.workspaceId && viewWorkspaces.has(t.workspaceId)));
    for (const t of allThreads) if (t.workspaceId) workspaceNames.set(t.workspaceId, t.workspaceName || t.workspaceLabel || 'Workspace');
    const workspaceFilter = viewWorkspaces === null ? 'All workspaces' : viewWorkspaces.size === 0 ? 'None' : viewWorkspaces.size === 1 ? workspaceNames.get([...viewWorkspaces][0]) || '1 selected' : `${viewWorkspaces.size} selected`;
    const pageSize = 7; // Nine native rows: two filters plus seven sessions.
    const pageCount = Math.max(1, Math.ceil(threads.length / pageSize));
    page = Math.max(0, Math.min(page, pageCount - 1));
    const start = page * pageSize;
    const visible = threads.slice(start, start + pageSize);
    const actions: { label: string; run: () => unknown }[] = [
      { label: `* Filter by Agent [${viewProvider === 'all' ? 'All sessions' : agentLabel(viewProvider)}]`, run: () => viewOptions() },
      { label: `* Filter by Workspace [${workspaceFilter}]`, run: () => workspaceOptions() },
      ...visible.map(t => ({ label: sessionRow(t.title, t.handle, t.agent, t.state, t.workspaceName), run: () => thread(t) })),
    ];
    const columns = actions.map((a, i): SessionColumns => {
      const t = i >= 2 ? visible[i - 2] : undefined;
      if (t) return { marker: t.state === 'idle' ? '/' : t.state === 'busy' ? '' : '?', title: compactSessionTitle(t.title, t.handle), right: sessionAgentLabel(t.workspaceName || '', t.agent), busy: t.state === 'busy', handle: t.handle };
      return i === 0 ? { marker: '*', title: 'Filter by Agent', right: `[${viewProvider === 'all' ? 'All sessions' : agentLabel(viewProvider)}]` }
        : i === 1 ? { marker: '*', title: 'Filter by Workspace', right: `[${workspaceFilter}]` } : { marker: '', title: a.label, right: '' };
    });
    const selection = selected < 0 ? actions.length - 1 : Math.min(selected, actions.length - 1);
    await show({ kind: 'list', title: sessionListTitle(allThreads.length), sessionList: true, columns, connectedCount: allThreads.length, selected: selection, paintedSelection: selection,
      onPreviousPage: page > 0 ? () => home(page - 1, -1) : undefined,
      onNextPage: page + 1 < pageCount ? () => home(page + 1) : undefined,
      menuActions: [
        { id: 1001, label: 'Refresh sessions', run: () => home(page) },
        { id: 1002, label: 'New Session', run: newSession },
        { id: 1003, label: 'Usage', run: usage },
      ],
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

// null means all workspaces; an explicit empty set means none. Keep each
// toggle selected in a native text page so multiple picks do not jump to row 1.
function workspaceOptions(page = 0, selected = 0) {
  return guard('Filter by Workspace', async () => {
    const owner = current;
    const [threads, catalog] = await Promise.all([api.threads(), api.workspaces().catch(() => [])]);
    if (current !== owner) return;
    const choices = new Map(catalog.map(w => [w.id, w.name]));
    for (const t of threads) if (t.workspaceId) choices.set(t.workspaceId, t.workspaceLabel || t.workspaceName || 'Workspace');
    for (const id of viewWorkspaces || []) if (!choices.has(id)) choices.set(id, `${workspaceNames.get(id) || id.replaceAll('\\', '/').split('/').pop() || 'Workspace'} (unavailable)`);
    const rows = [...choices].sort((a, b) => a[1].localeCompare(b[1]));
    const size = 7; // Done/All plus seven checkboxes; no navigation rows.
    page = Math.max(0, Math.min(page, Math.max(0, Math.ceil(rows.length / size) - 1)));
    const save = async () => bridge.setLocalStorage('view-workspaces', viewWorkspaces === null ? 'all' : JSON.stringify([...viewWorkspaces]));
    const actions: { label: string; run: () => unknown }[] = [
      { label: 'Done', run: () => home() },
      { label: `[${viewWorkspaces === null ? 'x' : ' '}] All workspaces`, run: async () => { const owner = current; viewWorkspaces = null; await save(); if (current === owner) await workspaceOptions(page, 1); } },
    ];
    for (const [id, name] of rows.slice(page * size, (page + 1) * size)) {
      const index = actions.length;
      actions.push({ label: `[${viewWorkspaces?.has(id) ? 'x' : ' '}] ${name}`, run: async () => {
        viewWorkspaces ??= new Set();
        if (viewWorkspaces.has(id)) viewWorkspaces.delete(id); else viewWorkspaces.add(id);
        const owner = current; await save(); if (current === owner) await workspaceOptions(page, index);
      } });
    }
    const selection = selected < 0 ? actions.length - 1 : Math.min(selected, actions.length - 1);
    await show({ kind: 'list', workspacePicker: true, title: 'Filter by Workspace', items: actions.map(a => a.label), selected: selection,
      onPreviousPage: page > 0 ? () => workspaceOptions(page - 1, -1) : undefined,
      onNextPage: (page + 1) * size < rows.length ? () => workspaceOptions(page + 1) : undefined,
      onPick: i => { void actions[i]?.run(); }, onBack: () => home() });
  }, home);
}

function thread(t: Thread, note = '') {
  selectThread(t);
  return guard(t.title, async () => {
    const title = () => `${t.title}${note ? `  ${note}` : ''}`;
    const snapshot = await api.thread(t.handle);
    const saved = await api.history(t.handle).catch(() => null);
    const useSaved = ['codex-transcript', 'claude-transcript', 'hermes-transcript'].includes(saved?.source || '');
    const conversationText = useSaved ? saved!.text : snapshot.text;
    const state = await api.activity(t.handle).catch(e => {
      diag(`Activity request failed: ${(e as Error).message}`);
      return { state: 'unknown', elapsedSeconds: null };
    });
    const text = readerContent(conversationText, snapshot.menu, snapshot.progress, t.agent === 'claude' && state.state === 'working');
    await show({ kind: 'text', title: title(), text, conversationText, choiceMenu: snapshot.menu, tail: true, openAtResponse: true, model: (useSaved ? saved!.model : undefined) || snapshot.model, activityState: state.state, reportedSeconds: state.state === 'working' ? state.elapsedSeconds ?? null : null, activityLabel: activityLabel(state.state), savedHistory: useSaved, reader: t, onBack: home,
      onClick: () => { if (current?.kind === 'text' && current.choiceMenu) void replies(t); },
      onHold: () => { void record(t, true); } });
    startReaderUpdates(current);
  }, home);
}


// Restart live updates without rebuilding the mounted chat after a successful send.
function startReaderUpdates(screen: Screen | null): (() => Promise<void>) | undefined {
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
  const tick = async () => {
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
      try { await inputHint(); } catch (e) { diag((e as Error).message); }
      if (current !== screen) { reading = false; return; }
    }
    const label = readerStatus(activity.state, screen.statusFrame || 0, Date.now() - screen.statusStartedAt!);
    if (screen.activityLabel !== label) {
      try {
        const accepted = await writePanel(label, () => current === screen);
        if (accepted && current === screen) screen.activityLabel = label;
      } catch (e) { diag((e as Error).message); }
    }
    if (current !== screen) { reading = false; return; }
    // Choice prompts live in the terminal UI, not saved chat. Check them even
    // when history is selected, without rebuilding or moving a paused reader.
    const snapshot = await api.thread(t.handle).catch(() => null);
    if (current !== screen) { reading = false; return; }
    if (snapshot && screen.choiceMenu?.id !== snapshot.menu?.id) {
      screen.choiceMenu = snapshot.menu;
      await inputHint().catch(e => diag((e as Error).message));
    }
    if (screen.reading) { reading = false; return; }
    let r = await (screen.savedHistory ? api.history(t.handle) : Promise.resolve(snapshot)).catch(() => null);
    if (screen.savedHistory && (!r || !('source' in r) || !['codex-transcript', 'claude-transcript', 'hermes-transcript'].includes(r.source || ''))) {
      r = snapshot;
      // Stay on live output after losing the verified saved-history association.
      if (r && current === screen) screen.savedHistory = false;
    }
    // A pending old-session read must never overwrite another screen or draft.
    if (r && current === screen && !screen.reading) {
      // An empty live tool frame must not erase the last public reply.
      if (r.text.trim()) screen.conversationText = r.text;
      // A model switch mid-session updates the status row in place.
      const model = ('model' in r ? r.model : undefined) || snapshot?.model;
      if (model && model !== screen.model) {
        screen.model = model;
        await writePanel(screen.activityLabel || readerStatus('unknown'), () => current === screen).catch(e => diag((e as Error).message));
        await inputHint().catch(e => diag((e as Error).message));
      }
      const text = readerContent(screen.conversationText || '', screen.choiceMenu, snapshot?.progress, t.agent === 'claude' && screen.activityState === 'working');
      if (text.trim() && text !== screen.text) {
        try { await updateText(screen.title, text); }
        catch (e) { diag((e as Error).message); }
      }
    }
    reading = false;
  };
  poll = setInterval(tick, POLL_MS);
  return tick;
}

function history(t: Thread) {
  const previous = current;
  return guard(t.title, async () => {
    const r = await api.history(t.handle);
    if (current !== previous) return;
    await show({ kind: 'text', title: ['codex-transcript', 'claude-transcript', 'hermes-transcript'].includes(r.source || '') ? 'Conversation history' : 'Terminal buffer only',
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
            text: `${menu.question}\n\n${option.value}. ${option.label}${option.description ? '\n' + option.description : ''}`,
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

// Voice hints on the full-screen voice page's instruction row.
const VOICE_LISTENING = 'Listening… release to review';
const VOICE_REVIEW = 'Tap to send / Double tap to cancel';
const VOICE_RETURN = 'Tap or double tap to return';

async function record(t: Thread, hold = false) {
  if ((hold && !holding) || recording !== null || cancelCapture) return;
  diag('Hold received. Opening voice screen…');
  const background = current;
  if (background?.kind !== 'text' || !background.reader) return;
  await readerWrites;
  if (current !== background || (hold && !holding)) return;
  const choiceMenu = background.choiceMenu;
  // Hold opens a full-screen voice page that is already listening. Send or
  // cancel rebuilds the chat at its newest (bottom) page.
  background.reading = true;
  clearInterval(poll);
  clearInterval(statusAnimation);
  let overlayActive = true;
  let voiceWrites: Promise<void> = Promise.resolve();
  const voiceScreen: TextScreen = { kind: 'text', title: ' ', text: ' ', voice: true, voiceHint: VOICE_LISTENING, voiceTail: true };
  // Serialize page and row writes; the first call builds the voice page and
  // later calls replace only its transcript and instruction rows.
  const voiceShow = (text: string, hint: string, handlers: { onClick?: () => void; onBack?: () => void } = {}, tail = false) => {
    const write = voiceWrites.then(async () => {
      if (!overlayActive) return;
      const before = { text: voiceScreen.text, hint: voiceScreen.voiceHint, tail: voiceScreen.voiceTail };
      Object.assign(voiceScreen, { text: text || ' ', voiceHint: hint, voiceTail: tail, onClick: handlers.onClick, onBack: handlers.onBack });
      if (current !== voiceScreen) { await show(voiceScreen); return; }
      if (before.text !== voiceScreen.text || before.tail !== voiceScreen.voiceTail) {
        if (!await bridge.textContainerUpgrade(new TextContainerUpgrade({ containerID: VOICE_BODY.containerID, containerName: VOICE_BODY.containerName, content: voiceBodyText(voiceScreen) })))
          throw new Error('Glasses rejected the voice text update.');
      }
      if (before.hint !== hint && !await bridge.textContainerUpgrade(new TextContainerUpgrade({ containerID: VOICE_HINT.containerID, containerName: VOICE_HINT.containerName, content: hint || ' ', textColor: 4 })))
        throw new Error('Glasses rejected the voice instruction update.');
    });
    voiceWrites = write.catch(() => {});
    return write;
  };
  // Return to the chat at its newest page (not the latest-response page).
  const closeVoice = async () => {
    if (!overlayActive) return;
    overlayActive = false;
    await voiceWrites;
    Object.assign(background, { reading: false, tail: true, offset: undefined, openAtResponse: false, pageTarget: undefined, pageWriting: false });
    try { await show(background); }
    catch (e) { diag((e as Error).message); void home(); }
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
  const back = () => { cancel(); void closeVoice(); };
  const sendText = async (text: string, shown: string) => {
    if (cancelled || submitted || sending) return;
    submitted = true;
    sending = true;
    cancelCapture = null;
    try {
      await voiceShow(shown, 'Sending…');
      if (choiceMenu) {
        const value = choiceNumber(text);
        if (!value || !choiceMenu.options.some(o => o.value === value)) throw new Error('Say one of the displayed option numbers. Nothing sent.');
        await api.choice(t.handle, choiceMenu.id, value);
      } else await api.say(t.handle, text);
      await closeVoice();
    } catch (e) {
      await voiceShow((e as Error).message, VOICE_RETURN, { onBack: () => { void closeVoice(); }, onClick: () => { void closeVoice(); } }).catch(e => diag((e as Error).message));
    } finally { sending = false; }
  };
  const stop = async (finish: boolean) => {
    if (stopped) return;
    if (!finish) { back(); return; }
    stopped = true;
    cleanup();
    await bridge.audioControl(false).catch(() => {});
    try {
      await voiceShow(caption || 'Finishing transcription…', 'Transcribing…', { onBack: back }, true);
      await pending;
      if (cancelled) return;
      const pcm = snapshot();
      const text = pcm.length === lastBytes ? caption : (await api.transcribe(pcm)).text.trim();
      if (cancelled) return;
      cancelCapture = null;
      if (!text) {
        await voiceShow(tr('notHeard'), VOICE_RETURN, { onClick: () => { void closeVoice(); }, onBack: () => { void closeVoice(); } });
      } else {
        cancelCapture = cancel;
        const choice = choiceMenu?.options.find(o => o.value === choiceNumber(text));
        const shown = choice ? `${choice.value}. ${choice.label}` : text;
        await voiceShow(shown, VOICE_REVIEW, { onClick: () => { void sendText(text, shown); }, onBack: back });
      }
    } catch (e) {
      if (cancelled) return;
      cancelCapture = null;
      await voiceShow((e as Error).message, VOICE_RETURN, { onBack: () => { void closeVoice(); }, onClick: () => { void closeVoice(); } }).catch(e => diag((e as Error).message));
    }
  };
  if (hold) releaseCapture = () => { void stop(true); };
  try {
    await voiceShow(hold ? ' ' : tr('recordingHint'), VOICE_LISTENING, { onClick: hold ? undefined : () => { void stop(true); }, onBack: () => { void stop(false); } }, true);
  } catch (e) {
    // The voice page was rejected: the chat is still mounted, so resume it.
    cancel();
    overlayActive = false;
    current = background;
    background.reading = false;
    startReaderUpdates(background);
    diag((e as Error).message);
    return;
  }
  if (stopped) return;
  const ok = await bridge.audioControl(true, AudioInputSource.Glasses).catch(() => false);
  if (stopped) { await bridge.audioControl(false); return; }
  if (!ok) {
    cancel();
    await voiceShow(tr('micFailed'), VOICE_RETURN, { onClick: () => { void closeVoice(); }, onBack: () => { void closeVoice(); } });
    return;
  }
  diag('Recording — full-screen voice page.');
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
        if (!stopped && caption) await voiceShow(caption, VOICE_LISTENING, { onBack: () => { void stop(false); } }, true);
      } catch { /* Final transcription reports errors; transient preview failure is not a send. */ }
      finally { pending = null; }
    })();
  }, 1500);
}

function usageText(u: Usage, mode: ResetMode) {
  const all = Object.entries(u).filter(([, v]) => v && typeof v === 'object' && 'provider' in v);
  const ok = all.filter(([, v]) => v.status === 'ok');
  const ng = all.filter(([, v]) => v.status !== 'ok').map(([name]) => name);
  const lines = ok.map(([name, v]) => {
    const percent = (value: number) => Math.round(value * 10) / 10;
    const s = v.session ? `5h ${percent(v.session.usedPercent)}% (${formatReset(v.session, mode)})` : '';
    const w = v.weekly ? `${tr('weekly')} ${percent(v.weekly.usedPercent)}% (${formatReset(v.weekly, mode)})` : '';
    const m = v.monthly ? `Monthly ${percent(v.monthly.usedPercent)}% (${formatReset(v.monthly, mode)})` : '';
    return `${providerName(v.provider || name)}\n  ${[s, w, m].filter(Boolean).join(' / ') || tr('noInfo')}`;
  });
  if (ng.length) lines.push(tr('unavailable', ng.join(', ')));
  return lines.join('\n');
}

function usage() {
  return guard(tr('usageTitle'), async () => {
    const u = await api.usage();
    let writing = false;
    const screen: Extract<Screen, { kind: 'text' }> = { kind: 'text', title: tr('usageTitle'),
      usageMode: usageResetMode, text: usageText(u, usageResetMode), onBack: home,
      onClick: () => { void update(true); } };
    const update = async (cycle = false) => {
      if (current !== screen || writing || (!cycle && screen.reading)) return;
      writing = true;
      try {
        if (cycle) {
          const next = RESET_MODES[(RESET_MODES.indexOf(usageResetMode) + 1) % RESET_MODES.length];
          await bridge.setLocalStorage('usage-reset-mode', next);
          usageResetMode = next;
          screen.usageMode = next;
          if (current !== screen) return;
          await bridge.textContainerUpgrade(new TextContainerUpgrade({ containerID: USAGE_RESET.containerID, containerName: USAGE_RESET.containerName,
            content: `Reset: ${resetModeLabel(next)}  (Click to change)` }));
        }
        if (current !== screen) return;
        const text = usageText(u, usageResetMode);
        if (text !== screen.text) {
          screen.offset = undefined;
          await updateText(screen.title, text);
        }
      } catch (e) { diag((e as Error).message); }
      finally { writing = false; }
    };
    await show(screen);
    if (current === screen) poll = setInterval(() => {
      if (usageResetMode === 'absolute') void update();
    }, 60000);
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
  if (e.menuItemClickEvent) {
    const screen = current;
    if (screen?.kind === 'list' && screen.sessionList) {
      const action = screen.menuActions?.find(a => a.id === e.menuItemClickEvent!.itemID);
      if (action) void sessionCursorWrites.then(() => { if (current === screen) action.run(); });
    }
    return;
  }
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
  // Finish old-page cursor writes before reusing the same native containers.
  // Ignore repeated swipes/clicks during a fetch so one edge gesture changes
  // exactly one page and cannot activate a row from the page being replaced.
  if (s.kind === 'list' && s.paging) return;
  if (s.kind === 'list' && (s.sessionList || s.workspacePicker) && (type === OsEventTypeList.SCROLL_TOP_EVENT || type === OsEventTypeList.SCROLL_BOTTOM_EVENT)) {
    const next = (s.selected || 0) + (type === OsEventTypeList.SCROLL_TOP_EVENT ? -1 : 1);
    const changePage = next < 0 ? s.onPreviousPage : next >= s.items.length ? s.onNextPage : undefined;
    if (changePage) {
      s.paging = true;
      void sessionCursorWrites.then(() => { if (current === s) return changePage(); })
        .catch(e => diag((e as Error).message)).finally(() => { s.paging = false; });
      return;
    }
    s.selected = Math.max(0, Math.min(s.items.length - 1, next));
    if (!s.cursorWriting) sessionCursorWrites = updateSessionCursor(s);
    return;
  }
  if (s.kind === 'text' && (type === OsEventTypeList.SCROLL_TOP_EVENT || type === OsEventTypeList.SCROLL_BOTTOM_EVENT)) {
    if (s.reader) flipReader(s, type === OsEventTypeList.SCROLL_TOP_EVENT ? -1 : 1);
    else s.reading = true;
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
    if (s.sessionList || s.workspacePicker) {
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
  const resetMode = await bridge.getLocalStorage('usage-reset-mode');
  if (RESET_MODES.includes(resetMode as ResetMode)) usageResetMode = resetMode as ResetMode;
  try {
    const stored = JSON.parse(await bridge.getLocalStorage('view-workspaces') || 'null');
    if (Array.isArray(stored) && stored.every(id => typeof id === 'string')) viewWorkspaces = new Set(stored);
  } catch { /* Older or corrupt preferences safely restore all workspaces. */ }
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
