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
import { orcaAgents, workspaceSections, toggleWorkspace, workspaceSummary, type PickerRow } from './filters';
import { createPhone } from './phone';
import { FINE_FONTS, FINE_TILES, FINE_TEXT_WIDTH, fineLayout, fineMeasure, fineCells, renderFineScreen, renderTestPattern, type FineFont } from './fine-text';
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
// Frame and divider are single-pixel lines (user request 2026-11-09).
const DIVIDER = { containerID: 5, containerName: 'divider', xPosition: 16, yPosition: 250, width: 544, height: 1 };
const HINT = { containerID: 6, containerName: 'hint', xPosition: 280, yPosition: STATUS_ROW_Y, width: 280, height: 28 };
const STATUS_ICON = { containerID: 7, containerName: 'status-icon', xPosition: 16, yPosition: STATUS_ROW_Y, width: 20, height: 28 };
// Full-screen voice page: the same nine rows hold the scrollable transcript and
// the status row holds the instruction. IDs/layers are contiguous from 1/0.
const VOICE_BODY = { containerID: 1, containerName: 'voice-body', xPosition: 8, yPosition: READER_TOP, width: 560, height: READER_HEIGHT };
const VOICE_HINT = { containerID: 2, containerName: 'voice-hint', xPosition: 16, yPosition: STATUS_ROW_Y, width: 544, height: 28 };
const VOICE_FRAME = { ...FRAME, containerID: 3, containerName: 'voice-frame' };
const VOICE_DIVIDER = { ...DIVIDER, containerID: 4, containerName: 'voice-divider' };
// Small-text reader: the whole screen is four 288x144 image tiles (IDs 2..5)
// over one blank, full-screen text container (ID 1) that receives swipes.
const FINE_CAPTURE = { containerID: 1, containerName: 'fine-input', xPosition: 0, yPosition: 0, width: 576, height: 288 };
const FINE_TILE_IDS = FINE_TILES.map((tile, i) => ({ ...tile, containerID: 2 + i, containerName: `fine-${i}` }));
const USAGE_RESET = { containerID: 3, containerName: 'usage-reset', xPosition: 0, yPosition: 28, width: 576, height: 28 };
const LIST_ITEM_BYTES = 63;
const LIST_MAX = 20;
const TEXT_BYTES = 999;
const POLL_MS = 1000;

type Screen =
  | { kind: 'list'; title: string; items: string[]; sessionList?: boolean; workspacePicker?: boolean; agentPicker?: boolean; headings?: number[]; menuActions?: { id: number; label: string; run: () => unknown }[]; compat?: boolean; columns?: SessionColumns[]; connectedCount?: number; selected?: number; paintedSelection?: number; menuFrame?: number; paintedCursor?: string; cursorWriting?: boolean; paging?: boolean; onPreviousPage?: () => unknown; onNextPage?: () => unknown; onPick: (i: number) => void; onBack?: () => void }
  | { kind: 'text'; title: string; text: string; usageMode?: ResetMode; conversationText?: string; choiceMenu?: ChoiceMenu | null; tail?: boolean; offset?: number; pageText?: string; pages?: string[]; pageTarget?: number; pageWriting?: boolean; reading?: boolean; refreshing?: boolean; responsePage?: number; openAtResponse?: boolean; model?: string; voice?: boolean; voiceHint?: string; voiceTail?: boolean; activityLabel?: string; activityState?: string; reportedSeconds?: number | null; statusFrame?: number; statusStartedAt?: number; savedHistory?: boolean; reader?: Thread; fine?: FineFont; pagesFine?: FineFont; tiles?: number[][]; fineLabel?: string; fineQueued?: boolean; pattern?: boolean; menuActions?: { id: number; label: string; run: () => unknown }[]; onClick?: () => void; onBack?: () => void; onHold?: () => void; };

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
// Reader text: the firmware's native font, or small text drawn as image tiles.
type ReaderText = 'native' | FineFont;
let readerText: ReaderText = 'native';
let usageResetMode: ResetMode = 'computer';
let viewWorkspaces: Set<string> | null = null;
// Hermes is not part of Orca: it has its own workspace selection and page.
let viewHermesWorkspaces: Set<string> | null = null;
const hermesView = () => viewProvider === 'hermes';
const activeWorkspaces = () => hermesView() ? viewHermesWorkspaces : viewWorkspaces;
function setActiveWorkspaces(value: Set<string> | null) { if (hermesView()) viewHermesWorkspaces = value; else viewWorkspaces = value; }
const saveWorkspaces = (hermes: boolean, value: Set<string> | null) =>
  bridge.setLocalStorage(hermes ? 'view-hermes-workspaces' : 'view-workspaces', value === null ? 'all' : JSON.stringify([...value]));
// A glasses change also redraws the phone page's filters.
const saveActiveWorkspaces = async () => { await saveWorkspaces(hermesView(), activeWorkspaces()); phone?.render(); };
let phone: ReturnType<typeof createPhone> | null = null;

// A phone change redraws whichever filter-dependent glasses page is showing.
function refreshGlasses() {
  const s = current;
  if (s?.kind === 'list' && s.sessionList) void home();
  else if (s?.kind === 'list' && s.workspacePicker) void workspaceOptions();
  else if (s?.kind === 'list' && s.agentPicker) void viewOptions();
}
const providerFilterLabel = () => viewProvider === 'all' ? 'All Orca sessions' : agentLabel(viewProvider);
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
  if (s.pageText !== s.text || !s.pages || s.pagesFine !== s.fine) {
    s.pagesFine = s.fine;
    if (s.fine) {
      // Monospace small text: wrap by cells; images have no native byte limit.
      const measure = fineMeasure(s.fine);
      const width = FINE_TEXT_WIDTH, rows = fineLayout(s.fine).rows;
      const start = latestResponseStart(s.text);
      const whole = readerPages(s.text, measure, width, rows, Infinity);
      const chars = (text: string) => text.replaceAll('\n', '').length;
      if (start < 0) { s.pages = whole; s.responsePage = undefined; }
      else if (chars(s.text.slice(0, start)) >= chars(whole.slice(0, -1).join(''))) { s.pages = whole; s.responsePage = whole.length - 1; }
      else {
        const before = start > 0 ? readerPages(s.text.slice(0, start - 1), measure, width, rows, Infinity) : [];
        s.pages = [...before, ...readerPages(s.text.slice(start), measure, width, rows, Infinity)];
        s.responsePage = before.length;
      }
      s.pageText = s.text;
      return s.pages;
    }
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
    new TextContainerProperty({ ...VOICE_FRAME, content: ' ', textColor: 4, borderWidth: 1, borderColor: 15, borderRadius: 0, isEventCapture: 0, zOrderIndex: 0 }),
    new TextContainerProperty({ ...VOICE_DIVIDER, content: ' ', textColor: 4, borderWidth: 1, borderColor: 15, isEventCapture: 0, zOrderIndex: 2 }),
  ] };
}

// The reader keeps its head container (stable IDs/layers) but leaves it blank.
function screenTitle(s: Screen) { return s.kind === 'text' && s.reader ? ' ' : s.title; }

// Left part of the status row: '/Waiting Opus5.5'. A working label starts with
// its spinner glyph, drawn as a separate 20px image, so four spaces replace it.
// The model comes first so it never moves while the working words rotate:
// 'Opus5.5 /Waiting', 'Opus5.5 [spinner] Thinking...'. The Braille spinner is a
// 20px image placed after the model name, so four spaces stand in for it.
function statusLeft(label: string, model?: string) {
  const prefix = model ? `${model} ` : '';
  return label[0] !== '/' && label.length > 2 ? `${prefix}    ${label.slice(2)}` : prefix + label;
}
const statusIconX = (model?: string) => VOICE.xPosition + (model ? glassWidth(`${model} `) : 0);

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
  if (s.pattern) { s.pattern = false; requestFineStatus(s); return; }
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
      if (s.fine) { if (!await paintFine(s, content, target)) return; }
      else if (!await bridge.textContainerUpgrade(new TextContainerUpgrade({ containerID: BODY.containerID, containerName: BODY.containerName, content }))) throw new Error('Glasses rejected the page. Swipe to retry.');
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
    if (owner.fine) { owner.fineLabel = label; requestFineStatus(owner); return true; }
    let visible = statusLeft(label, owner.model);
    try {
      await bridge.updateImageRawData(new ImageRawDataUpdate({ containerID: STATUS_ICON.containerID, containerName: STATUS_ICON.containerName,
        imageData: statusPixels(label[0] !== '/' ? label[0] : '') }));
    } catch (e) {
      // A missing image renderer must not prevent the status text.
      diag((e as Error).message);
      visible = owner.model ? `${owner.model} ${label}` : label;
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
  if (owner.fine) { requestFineStatus(owner); return; }
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
  if (s.kind === 'text' && s.reader && !s.voice) {
    s.fine = readerText === 'native' ? undefined : readerText;
    s.tiles = undefined; // A rebuild clears every image container.
    s.menuActions = readerMenu();
    s.pattern = false;
  }
  const previous = current;
  current = s;
  const content = s.kind === 'text' ? (s.voice ? voiceBodyText(s) : bodyText(s)) : '';
  const fine = s.kind === 'text' && !!s.reader && !!s.fine;
  const uploadText = !fine && (reloadText || (s.kind === 'text' && !!s.reader && s.text.length > 900) || new TextEncoder().encode(content).length > 999);
  const head = new TextContainerProperty({ ...HEAD, ...(s.kind === 'text' && s.usageMode ? { height: 28 } : {}), ...(s.kind === 'text' && s.reader ? { xPosition: 16, yPosition: 2, width: 544, height: 28, zOrderIndex: 1 } : {}), content: s.kind === 'list' && s.sessionList ? sessionHeading() : clipBytes(screenTitle(s), TEXT_BYTES), isEventCapture: 0 });
  // Firmware retains Display off, Brightness and Close alongside these actions.
  const menu = (s.kind === 'list' && s.sessionList) || (s.kind === 'text' && s.menuActions) ? { menuObject: new MenuContainerProperty({
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
          ...menu,
          textObject: [head, new TextContainerProperty({ ...BODY, ...(s.usageMode ? { yPosition: 64, height: 224 } : {}), ...(s.reader ? { xPosition: 8, yPosition: READER_TOP, width: 560, paddingLength: 0, zOrderIndex: 2, height: READER_HEIGHT } : {}), content: uploadText ? '' : content, isEventCapture: 1 }),
            ...(s.usageMode ? [new TextContainerProperty({ ...USAGE_RESET, content: `Reset: ${resetModeLabel(s.usageMode)}  (Click to change)`, isEventCapture: 0 })] : []),
            ...(s.reader ? [
              new TextContainerProperty({ ...HINT, content: readerHint(s, s.reportedSeconds), textColor: 4, isEventCapture: 0, paddingLength: 0, zOrderIndex: 6 }),
              new TextContainerProperty({ ...VOICE, content: statusLeft(s.activityLabel!, s.model), textColor: 4, isEventCapture: 0, paddingLength: 0, zOrderIndex: 5 }),
              new TextContainerProperty({ ...FRAME, content: ' ', textColor: 4, borderWidth: 1, borderColor: 15, borderRadius: 0, isEventCapture: 0, zOrderIndex: 0 }),
              new TextContainerProperty({ ...DIVIDER, content: ' ', textColor: 4, borderWidth: 1, borderColor: 15, isEventCapture: 0, zOrderIndex: 3 }),
            ] : [])],
          ...(s.reader ? { imageObject: [new ImageContainerProperty({ ...STATUS_ICON, xPosition: statusIconX(s.model), zOrderIndex: 4 })] } : {}),
        };
  if (fine) page = { containerTotalNum: 5, ...menu,
    textObject: [new TextContainerProperty({ ...FINE_CAPTURE, content: ' ', isEventCapture: 1, paddingLength: 0, zOrderIndex: 0 })],
    imageObject: FINE_TILE_IDS.map((tile, i) => new ImageContainerProperty({ ...tile, zOrderIndex: i + 1 })),
  } as unknown as typeof page;
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
    if (s.kind === 'list' && (s.workspacePicker || s.agentPicker)) { s.compat = true; page = compatibilityMenu(s, {}) as typeof page; }
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
      if (s.fine && !s.voice) await paintFine(s, content, s.offset ?? 0);
      else await bridge.updateImageRawData(new ImageRawDataUpdate({ containerID: STATUS_ICON.containerID, containerName: STATUS_ICON.containerName, imageData: statusPixels(s.activityLabel![0] === '/' ? '' : s.activityLabel![0]) })).catch(e => diag((e as Error).message));
      startReaderUpdates(s);
    }
  } catch (e) {
    if (current === s) current = previous;
    diag((e as Error).message);
    throw e;
  }
}

// Draw a small-text page and upload only the tiles that changed. Returns false
// when the screen changed meanwhile; throws if the glasses reject a tile.
async function paintFine(s: TextScreen, content: string, page: number, pattern = false): Promise<boolean> {
  const t0 = Date.now();
  const tiles = pattern ? renderTestPattern(s.fine!) : renderFineScreen(content, s.fine!, fineStatus(s, page));
  let sent = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (current !== s) return false;
    const before = s.tiles?.[i];
    if (before && before.length === tiles[i].length && before.every((v, p) => v === tiles[i][p])) continue;
    const tile = FINE_TILE_IDS[i];
    const result = await bridge.updateImageRawData(new ImageRawDataUpdate({ containerID: tile.containerID, containerName: tile.containerName, imageData: tiles[i] }));
    if (result !== ImageRawDataUpdateResult.success) throw new Error(`Glasses rejected small-text tile ${i + 1} (${result}).`);
    (s.tiles ??= [])[i] = tiles[i];
    sent++;
  }
  diag(`Small text (${s.fine}): ${sent} tile(s) in ${Date.now() - t0} ms`);
  return current === s;
}

// Status row drawn in the small font: '⠋ Thinking... Opus5.5' left, '13m
// [Tap&Hold for Input] Pg3/5' right. The timer shows whole minutes so the row
// changes (and is re-sent) at most once a minute while idle text stays put.
function fineStatus(s: TextScreen, page: number) {
  const label = s.fineLabel ?? s.activityLabel ?? readerStatus('unknown');
  const left = s.model ? `${s.model} ${label}` : label;
  const pages = readerLayout(s).length;
  const where = s.refreshing ? 'Refreshing…' : `Pg${page + 1}/${pages}`;
  const minutes = s.activityState === 'working' && s.reportedSeconds != null ? `${Math.floor(s.reportedSeconds / 60)}m` : '';
  const room = fineLayout(s.fine!).columns - fineCells(left) - 1;
  const right = statusRight(null, !!s.choiceMenu, where, text => fineCells([minutes, text].filter(Boolean).join(' ')) <= room);
  return { left, right: [minutes, right].filter(Boolean).join(' ') };
}

// Coalesced repaint of the current small-text page (status changes, dismissing
// the test pattern). Serialized with page turns on the reader write queue; only
// tiles whose pixels changed are sent, usually the bottom two.
function requestFineStatus(s: TextScreen) {
  if (s.fineQueued) return;
  s.fineQueued = true;
  const run = readerWrites.then(async () => {
    s.fineQueued = false;
    if (current !== s || !s.fine || s.pageWriting || s.pattern) return;
    await paintFine(s, bodyText(s), s.offset ?? 0);
  });
  readerWrites = run.catch(e => diag((e as Error).message));
}

// Reader long-press menu: switch between native text and the two small fonts.
// The glasses OS adds its own Display off / Brightness / Close entries.
function readerMenu() {
  const option = (id: number, mode: ReaderText, label: string) => ({ id, label: `${label}${readerText === mode ? ' (on)' : ''}`, run: () => setReaderText(mode) });
  return [option(1101, 'native', 'Text: native'), option(1102, 'pixel', 'Text: Spleen 6x12'), option(1103, 'pixel16', 'Text: Spleen 8x16'),
    option(1104, 'mono', 'Text: JetBrains Mono'), option(1106, 'departure', 'Text: Departure Mono'),
    option(1107, 'monogram', 'Text: Monogram'), option(1108, 'pixeloid', 'Text: Pixeloid Mono'),
    ...(readerText === 'native' ? [] : [{ id: 1105, label: 'Display test pattern', run: () => showTestPattern() }])];
}

// Paint the 1:1 display test into the tiles; the next swipe restores the page.
function showTestPattern() {
  const s = current;
  if (s?.kind !== 'text' || !s.reader || !s.fine) return;
  s.pattern = true;
  const run = readerWrites.then(() => paintFine(s, '', s.offset ?? 0, true));
  readerWrites = run.then(() => {}, e => diag((e as Error).message));
}

// Switch fonts in place and keep the reader near the same text: the first
// character of the current page stays on screen; the newest page stays newest.
async function setReaderText(mode: ReaderText) {
  await bridge.setLocalStorage('reader-text', mode);
  readerText = mode;
  const s = current;
  if (s?.kind !== 'text' || !s.reader || s.voice) return;
  const pages = readerLayout(s);
  const atEnd = (s.offset ?? 0) >= pages.length - 1;
  const chars = (text: string) => text.replaceAll('\n', '').length;
  const before = chars(pages.slice(0, s.offset ?? 0).join(''));
  s.fine = mode === 'native' ? undefined : mode;
  const next = readerLayout(s);
  let index = 0, seen = 0;
  while (index < next.length - 1 && seen + chars(next[index]) <= before) seen += chars(next[index++]);
  s.offset = atEnd ? next.length - 1 : index;
  s.openAtResponse = false;
  await show(s);
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
    if (screen.fine) { if (!await paintFine(screen, content, next.offset ?? 0)) return; }
    else if (!await bridge.textContainerUpgrade(new TextContainerUpgrade({ containerID: BODY.containerID, containerName: BODY.containerName, content }))) throw new Error('Glasses rejected the live text update. Retrying.');
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
  // The workspace picker has no title row: its ten 27px rows start at the top.
  const picker = !!screen.workspacePicker;
  return { containerTotalNum: 3, ...menu, textObject: [
    new TextContainerProperty({ ...HEAD, height: 28, content: picker ? ' ' : screen.title, isEventCapture: 0 }),
    new TextContainerProperty({ ...BODY, yPosition: picker ? 4 : 28, height: picker ? 280 : 260, content: compatibilityText(screen), isEventCapture: 0 }),
    new TextContainerProperty({ containerID: 3, containerName: 'menu-input', xPosition: 0, yPosition: 0,
      width: 576, height: 288, content: ' ', isEventCapture: 1 }),
  ] };
}
function compatibilityText(screen: SessionMenuScreen, selected = screen.selected || 0) {
  // Section headings sit flush left without a cursor column.
  return screen.items.map((item, i) => screen.headings?.includes(i) ? clipBytes(item, 48) : `${i === selected ? '>' : ' '} ${clipBytes(item, 48)}`).join('\n');
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
    // Hermes Agent lists only Hermes sessions; All Orca sessions and each Orca agent
    // exclude Hermes. Each side applies its own workspace selection.
    const selection = activeWorkspaces();
    const threads = allThreads.filter(t => (hermesView() ? t.agent === 'hermes' : t.agent !== 'hermes' && (viewProvider === 'all' || t.agent === viewProvider))
      && (selection === null || !!t.workspaceId && selection.has(t.workspaceId)));
    for (const t of allThreads) if (t.workspaceId) workspaceNames.set(t.workspaceId, (t.agent === 'hermes' ? t.workspaceLabel : t.workspaceName) || t.workspaceLabel || t.workspaceName || 'Workspace');
    const workspaceFilter = workspaceSummary(selection, workspaceNames);
    const pageSize = 7; // Nine native rows: two filters plus seven sessions.
    const pageCount = Math.max(1, Math.ceil(threads.length / pageSize));
    page = Math.max(0, Math.min(page, pageCount - 1));
    const start = page * pageSize;
    const visible = threads.slice(start, start + pageSize);
    const actions: { label: string; run: () => unknown }[] = [
      { label: `* Filter by Agent [${providerFilterLabel()}]`, run: () => viewOptions() },
      { label: `* Filter by Workspace [${workspaceFilter}]`, run: () => workspaceOptions() },
      ...visible.map(t => ({ label: sessionRow(t.title, t.handle, t.agent, t.state, t.workspaceName), run: () => thread(t) })),
    ];
    const columns = actions.map((a, i): SessionColumns => {
      const t = i >= 2 ? visible[i - 2] : undefined;
      if (t) return { marker: t.state === 'idle' ? '/' : t.state === 'busy' ? '' : '?', title: compactSessionTitle(t.title, t.handle), right: sessionAgentLabel(t.workspaceName || '', t.agent), busy: t.state === 'busy', handle: t.handle };
      return i === 0 ? { marker: '*', title: 'Filter by Agent', right: `[${providerFilterLabel()}]` }
        : i === 1 ? { marker: '*', title: 'Filter by Workspace', right: `[${workspaceFilter}]` } : { marker: '', title: a.label, right: '' };
    });
    const cursor = selected < 0 ? actions.length - 1 : Math.min(selected, actions.length - 1);
    await show({ kind: 'list', title: sessionListTitle(allThreads.length), sessionList: true, columns, connectedCount: allThreads.length, selected: cursor, paintedSelection: cursor,
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

// Filter by Agent: Hermes Agent first, a divider, then All Orca sessions and each
// Orca agent harness (Claude, Codex, then any others seen). Rendered as native
// text so the divider is not selectable.
function viewOptions() {
  return guard('Filter by Agent', async () => {
    const threads = await api.threads();
    const orca = orcaAgents(threads, viewProvider);
    const choose = (id: string) => async () => {
      await bridge.setLocalStorage('view-provider', id);
      viewProvider = id;
      phone?.render();
      await home();
    };
    const label = (id: string, name: string) => `${name}${viewProvider === id ? ' ✓' : ''}`;
    const actions: { label: string; run: () => unknown }[] = [
      { label: '<-', run: () => home() },
      { label: label('hermes', 'Hermes Agent'), run: choose('hermes') },
      { label: '-------------------------', run: () => {} },
      ...orca.map(id => ({ label: label(id, id === 'all' ? 'All Orca Sessions' : providerName(id)), run: choose(id) })),
    ];
    const headings = [2];
    const selected = Math.max(0, actions.findIndex(a => a.label.endsWith(' ✓')));
    await show({ kind: 'list', agentPicker: true, title: 'Filter by Agent', items: actions.map(a => a.label), headings, selected,
      onPick: i => { if (!headings.includes(i)) void actions[i]?.run(); }, onBack: home });
  }, home);
}

// null means all workspaces; an explicit empty set means none. Keep each
// toggle selected in a native text page so multiple picks do not jump to row 1.
// Ten rows, no title: Done, All, then sections paged eight entries at a time.
// Orca: Recent workspaces (four most recently active), then Other workspaces
// (alphabetical). Hermes (not part of Orca): Bots, Sessions, Scheduled jobs, as
// in Hermes Desktop. Headings are not selectable and never end a page.
const PICKER_ROWS = 10;
function workspaceOptions(page = 0, selected = 0) {
  return guard('Filter by Workspace', async () => {
    const owner = current;
    const [threads, catalog] = await Promise.all([api.threads(), api.workspaces().catch(() => [])]);
    if (current !== owner) return;
    const hermesOnly = hermesView();
    const chosen = activeWorkspaces();
    const sections = workspaceSections(threads, catalog, hermesOnly, chosen, workspaceNames);
    // Flatten to headings and rows, then page eight entries below Done/All.
    const flat: ({ heading: string } | { row: PickerRow })[] = sections.filter(x => x.rows.length)
      .flatMap(x => [...(x.title ? [{ heading: x.title }] : []), ...x.rows.map(row => ({ row }))]);
    const perPage = PICKER_ROWS - 2;
    const pages: typeof flat[] = [[]];
    for (const entry of flat) {
      const last = pages.at(-1)!;
      if (last.length === perPage || ('heading' in entry && last.length === perPage - 1)) pages.push([]);
      pages.at(-1)!.push(entry);
    }
    page = Math.max(0, Math.min(page, pages.length - 1));
    const save = saveActiveWorkspaces;
    const actions: { label: string; run: () => unknown }[] = [
      { label: 'Done', run: () => home() },
      { label: `[${chosen === null ? 'x' : ' '}] All workspaces`, run: async () => { const owner = current; setActiveWorkspaces(null); await save(); if (current === owner) await workspaceOptions(page, 1); } },
    ];
    const headings: number[] = [];
    for (const entry of pages[page]) {
      const index = actions.length;
      if ('heading' in entry) { headings.push(index); actions.push({ label: entry.heading, run: () => {} }); continue; }
      const [id, name] = entry.row;
      actions.push({ label: `[${chosen?.has(id) ? 'x' : ' '}] ${name}`, run: async () => {
        setActiveWorkspaces(toggleWorkspace(activeWorkspaces(), id));
        const owner = current; await save(); if (current === owner) await workspaceOptions(page, index);
      } });
    }
    let selection = selected < 0 ? actions.length - 1 : Math.min(selected, actions.length - 1);
    while (headings.includes(selection)) selection--;
    await show({ kind: 'list', workspacePicker: true, title: 'Filter by Workspace', items: actions.map(a => a.label), headings, selected: selection,
      onPreviousPage: page > 0 ? () => workspaceOptions(page - 1, -1) : undefined,
      onNextPage: page + 1 < pages.length ? () => workspaceOptions(page + 1) : undefined,
      onPick: i => { if (!headings.includes(i)) void actions[i]?.run(); }, onBack: () => home() });
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
  }, screen.fine ? 1000 : 200);
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
        // Native: the spinner image sits after the model name, and an image cannot
        // move without a rebuild. Small text redraws its status row.
        if (!screen.fine) { reading = false; await show(screen).catch(e => diag((e as Error).message)); return; }
        requestFineStatus(screen);
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
          phone?.render();
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
    } else if (screen?.kind === 'text' && screen.reader && !screen.voice) {
      const action = screen.menuActions?.find(a => a.id === e.menuItemClickEvent!.itemID);
      if (action) void readerWrites.then(() => { if (current === screen) return action.run(); }).catch(err => diag((err as Error).message));
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
  if (s.kind === 'list' && (s.sessionList || s.workspacePicker || s.agentPicker) && (type === OsEventTypeList.SCROLL_TOP_EVENT || type === OsEventTypeList.SCROLL_BOTTOM_EVENT)) {
    const step = type === OsEventTypeList.SCROLL_TOP_EVENT ? -1 : 1;
    let next = (s.selected || 0) + step;
    while (s.headings?.includes(next)) next += step; // Headings are not selectable.
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
    if (s.sessionList || s.workspacePicker || s.agentPicker) {
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
    phone?.connection({ state: 'demo' });
    return home();
  }
  if (!pairing) {
    diag(tr('notPairedDiag'));
    phone?.connection({ state: 'unpaired' });
    return show({ kind: 'text', title: 'Orca Glass', text: tr('notPaired') });
  }
  phone?.connection({ state: 'connecting' });
  try {
    const base = await resolveBase(pairing);
    if (!base) throw new Error(tr('noRelay'));
    setConnection({ token: pairing.token, base, resolve: () => resolveBase(pairing) });
    await api.health();
    const threads = await api.threads();
    const ms = Date.now() - t0;
    diag(tr('diagOk', ms, tr('viaCode'), currentBase(), threads.length));
    phone?.connection({ state: 'connected', ms });
  } catch (e) {
    diag(tr('diagNg', (e as Error).message, tr('viaCode'), currentBase()));
    phone?.connection({ state: 'offline', error: (e as Error).message });
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
  const savedText = await bridge.getLocalStorage('reader-text');
  if (FINE_FONTS.includes(savedText as FineFont)) readerText = savedText as FineFont;
  const resetMode = await bridge.getLocalStorage('usage-reset-mode');
  if (RESET_MODES.includes(resetMode as ResetMode)) usageResetMode = resetMode as ResetMode;
  for (const [key, set] of [['view-workspaces', (v: Set<string>) => { viewWorkspaces = v; }], ['view-hermes-workspaces', (v: Set<string>) => { viewHermesWorkspaces = v; }]] as const) {
    try {
      const stored = JSON.parse(await bridge.getLocalStorage(key) || 'null');
      if (Array.isArray(stored) && stored.every(id => typeof id === 'string')) set(new Set(stored));
    } catch { /* Older or corrupt preferences safely restore all workspaces. */ }
  }
  useLang(pref);
  phone = createPhone({
    filters: () => ({ provider: viewProvider, orca: viewWorkspaces, hermes: viewHermesWorkspaces }),
    setProvider: async id => { await bridge.setLocalStorage('view-provider', id); viewProvider = id; refreshGlasses(); },
    setWorkspaces: async (hermes, value) => {
      if (hermes) viewHermesWorkspaces = value; else viewWorkspaces = value;
      await saveWorkspaces(hermes, value);
      refreshGlasses();
    },
    resetMode: () => usageResetMode,
    setResetMode: async mode => {
      await bridge.setLocalStorage('usage-reset-mode', mode);
      usageResetMode = mode;
      if (current?.kind === 'text' && current.usageMode) void usage();
    },
    agentName: providerName,
  });
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
