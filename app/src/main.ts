import {
  AudioInputSource,
  CreateStartUpPageContainer,
  ListContainerProperty,
  ListItemContainerProperty,
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

// 画面 576x288。上に見出し(テキスト)、下に本文(リスト or テキスト)の2段構成で統一する。
const HEAD = { containerID: 1, containerName: 'head', xPosition: 0, yPosition: 0, width: 576, height: 36 };
const BODY = { containerID: 2, containerName: 'body', xPosition: 0, yPosition: 40, width: 576, height: 248 };
const LIST_ITEM_BYTES = 63;
const LIST_MAX = 20;
const TEXT_BYTES = 999;
const POLL_MS = 1000;

type Screen =
  | { kind: 'list'; title: string; items: string[]; onPick: (i: number) => void; onBack?: () => void }
  | { kind: 'text'; title: string; text: string; tail?: boolean; offset?: number; reading?: boolean; onClick?: () => void; onBack?: () => void; onHold?: () => void; };

let bridge: EvenAppBridge;
let current: Screen | null = null;
let started = false;
let poll: ReturnType<typeof setInterval> | undefined;
let selectedThread: Thread | null = null;
let sending = false;
let recordingMode: 'tap' | 'hold' = 'tap';
let holding = false;
let releaseCapture: (() => void) | null = null;

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

function readerActions(t: Thread, screen: Extract<Screen, { kind: 'text' }>) {
  const sections = textSections(screen.text);
  const index = screen.offset ?? 0;
  const reopen = async (offset: number) => {
    // Do not mutate the saved reader until native has accepted the replacement.
    await show({ ...screen, offset, reading: true }, true);
  };
  const actions = [
    { label: 'Reply', run: () => replies(t) },
    ...(index > 0 ? [{ label: 'Earlier text', run: () => reopen(index - 1) }] : []),
    ...(index + 1 < sections.length ? [{ label: 'Later text', run: () => reopen(index + 1) }] : []),
    { label: 'Latest output / resume updates', run: () => thread(t) },
    { label: 'Retained terminal history', run: () => history(t) },
  ];
  return show({ kind: 'list', title: t.title, items: actions.map(a => a.label),
    onPick: i => { void guard(t.title, async () => { await actions[i]?.run(); }, () => { void readerActions(t, screen); }); },
    onBack: () => { void guard(t.title, () => show(screen, true), () => { void thread(t); }); } });
}

function screenTitle(s: Screen) {
  return s.title;
}

async function show(s: Screen, reloadText = false) {
  clearInterval(poll);
  const previous = current;
  current = s;
  const content = s.kind === 'text' ? bodyText(s) : '';
  const head = new TextContainerProperty({ ...HEAD, content: clipBytes(screenTitle(s), TEXT_BYTES), isEventCapture: 0 });
  const page =
    s.kind === 'list'
      ? {
          containerTotalNum: 2,
          textObject: [head],
          listObject: [
            new ListContainerProperty({
              ...BODY,
              isEventCapture: 1,
              itemContainer: new ListItemContainerProperty({
                itemCount: Math.min(s.items.length, LIST_MAX),
                itemName: s.items.slice(0, LIST_MAX).map((t) => clipBytes(t, LIST_ITEM_BYTES)),
              }),
            }),
          ],
        }
      : {
          containerTotalNum: 2,
          textObject: [head, new TextContainerProperty({ ...BODY, content: reloadText ? '' : content, isEventCapture: 1 })],
        };
  try {
    if (!started) {
      const result = await bridge.createStartUpPageContainer(new CreateStartUpPageContainer(page));
      if (result !== 0) throw new Error(`Glasses could not open the reader (${result}). Reconnect and try again.`);
      started = true;
    } else {
      const accepted = await bridge.rebuildPageContainer(new RebuildPageContainer(page));
      if (!accepted) throw new Error('Glasses rejected the screen update. Reconnect and try again.');
    }
    if (reloadText && s.kind === 'text') {
      const accepted = await bridge.textContainerUpgrade(new TextContainerUpgrade({ containerID: BODY.containerID, containerName: BODY.containerName, content }));
      if (!accepted) throw new Error('Glasses could not load the selected text. Click to retry.');
    }
  } catch (e) {
    if (current === s) current = previous;
    diag((e as Error).message);
    throw e;
  }
}

function updateText(title: string, text: string) {
  if (current?.kind !== 'text') return;
  current.title = title;
  current.text = text;
  const { containerID: hid, containerName: hname } = HEAD;
  const { containerID: bid, containerName: bname } = BODY;
  bridge.textContainerUpgrade(new TextContainerUpgrade({ containerID: hid, containerName: hname, content: clipBytes(screenTitle(current), TEXT_BYTES) }));
  bridge.textContainerUpgrade(new TextContainerUpgrade({ containerID: bid, containerName: bname, content: bodyText(current) }));
}

async function guard(title: string, f: () => Promise<void>, back: () => void) {
  try {
    await f();
  } catch (e) {
    await show({ kind: 'text', title, text: tr('error', (e as Error).message), onBack: back, onClick: back });
  }
}

// ---- 画面 ----


function home(page = 0) {
  selectThread(null);
  return guard('Orca', async () => {
    const threads = await api.threads();
    // Leave room for navigation; never silently truncate live terminals.
    const pageSize = LIST_MAX - 5;
    page = Math.max(0, Math.min(page, Math.ceil(threads.length / pageSize) - 1));
    const visible = threads.slice(page * pageSize, (page + 1) * pageSize);
    const actions: { label: string; run: () => unknown }[] = [
      { label: 'Refresh sessions', run: () => home(page) },
      { label: tr('newSession'), run: newSession },
      { label: tr('usage'), run: usage },
      ...visible.map(t => ({ label: `${t.title} · ${t.handle.slice(-6)}`, run: () => thread(t) })),
    ];
    if (page > 0) actions.push({ label: 'Previous page', run: () => home(page - 1) });
    if ((page + 1) * pageSize < threads.length) actions.push({ label: 'Next page', run: () => home(page + 1) });
    await show({
      kind: 'list',
      title: tr('homeTitle', threads.length),
      items: actions.map(a => a.label),
      onPick: (i) => { actions[i]?.run(); },
    });
  }, home);
}

function thread(t: Thread, note = '') {
  selectThread(t);
  return guard(t.title, async () => {
    const title = () => `${t.title}${note ? `  ${note}` : ''}`;
    const { text } = await api.thread(t.handle);
    await show({ kind: 'text', title: title(), text, tail: true, onClick: () => { if (current?.kind === 'text') void readerActions(t, current); }, onBack: home,
      onHold: () => { if (recordingMode === 'hold') void replies(t, true); } });
    const screen = current;
    let reading = false;
    poll = setInterval(async () => {
      if (reading || current !== screen) return;
      if (current?.kind === 'text' && current.reading) return;
      reading = true;
      const r = await api.thread(t.handle).catch(() => null);
      reading = false;
      // A slow response from the previous session must never overwrite a new screen.
      if (r && current === screen && current?.kind === 'text' && r.text !== current.text && !current.reading) {
        current.offset = undefined;
        updateText(title(), r.text);
      }
    }, POLL_MS);
  }, home);
}

function history(t: Thread) {
  const previous = current;
  return guard(t.title, async () => {
    const r = await api.history(t.handle);
    if (current !== previous) return;
    await show({ kind: 'text', title: 'Retained terminal history', text: r.text || 'No older terminal output is retained.', tail: true,
      onBack: () => thread(t),
      onClick: () => { if (current?.kind === 'text') void readerActions(t, current); },
      onHold: () => { if (recordingMode === 'hold') void replies(t, true); } });
  }, () => thread(t));
}

function replies(t: Thread, hold = false) {
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
    const { voice } = await api.capabilities().catch(() => ({ voice: false }));
    if (voice && (recordingMode === 'tap' || hold)) return record(t, hold);
    if (voice) {
      return show({ kind: 'text', title: t.title, text: 'Hold to talk. Wait for Recording, then speak. Release to send.\nDouble-click while recording to cancel.',
        onHold: () => { void record(t, true); }, onBack: () => thread(t) });
    }
    await show({
      kind: 'text',
      title: tr('replyTitle', t.title),
      text: 'Open Orca Glass on your phone to type or dictate a message. Review it, then send to this session. Glasses voice is available when local transcription is configured.',
      onClick: () => thread(t),
      onBack: () => thread(t),
    });
  }, () => thread(t));
}

// Reuse upstream PCM and local Whisper. Snapshots are serialized and provisional;
// only the final text can be sent, once, to the captured terminal handle.
let recording: Uint8Array[] | null = null;
let cancelCapture: (() => void) | null = null;
const MAX_REC_SEC = 60;

async function record(t: Thread, hold = false) {
  if ((hold && !holding) || recording !== null || cancelCapture) return;
  recording = [];
  const chunks = recording;
  const t0 = Date.now();
  let stopped = false, cancelled = false;
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
    if (cancelled || sending) return;
    sending = true;
    cancelCapture = null;
    await show({ kind: 'text', title: t.title, text: 'Sending…' });
    try {
      const r = await api.say(t.handle, text);
      await thread(t, tr('sent', clipBytes(r.sent, 30)));
    } catch (e) {
      await show({ kind: 'text', title: t.title, text: (e as Error).message, onBack: () => thread(t), onClick: () => thread(t) });
    } finally { sending = false; }
  };
  const stop = async (finish: boolean) => {
    if (stopped) return;
    if (!finish) { cancel(); await thread(t); return; }
    stopped = true;
    cleanup();
    await bridge.audioControl(false).catch(() => {});
    await show({ kind: 'text', title: tr('transcribing'), text: caption || 'Finishing transcription…',
      onBack: () => { cancel(); void thread(t); } });
    try {
      await pending;
      if (cancelled) return;
      const pcm = snapshot();
      const text = pcm.length === lastBytes ? caption : (await api.transcribe(pcm)).text.trim();
      if (cancelled) return;
      cancelCapture = null;
      if (!text) {
        await show({ kind: 'text', title: tr('voiceTitle'), text: tr('notHeard'), onClick: () => thread(t), onBack: () => thread(t) });
      } else if (hold) {
        await sendText(text);
      } else {
        await show({ kind: 'text', title: tr('confirmSend'), text,
          onClick: () => { void sendText(text); }, onBack: () => { cancel(); void thread(t); } });
      }
    } catch (e) {
      if (cancelled) return;
      cancelCapture = null;
      await show({ kind: 'text', title: tr('voiceTitle'), text: (e as Error).message, onBack: () => thread(t), onClick: () => thread(t) });
    }
  };
  if (hold) releaseCapture = () => { void stop(true); };
  const hint = hold ? 'Speak. Release to send. Double-click to cancel.' : tr('recordingHint');
  await show({ kind: 'text', title: tr('recording', 0), text: hint,
    onClick: hold ? undefined : () => { void stop(true); }, onBack: () => { void stop(false); } });
  if (stopped) return;
  const ok = await bridge.audioControl(true, AudioInputSource.Glasses).catch(() => false);
  if (stopped) { await bridge.audioControl(false); return; }
  if (!ok) {
    cancel();
    await show({ kind: 'text', title: tr('voiceTitle'), text: tr('micFailed'), onClick: () => thread(t), onBack: () => thread(t) });
    return;
  }
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
        if (!stopped && caption) updateText('Listening · provisional', caption);
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
  const systemType = e.sysEvent?.eventType;
  if (systemType === OsEventTypeList.SYSTEM_EXIT_EVENT || systemType === OsEventTypeList.ABNORMAL_EXIT_EVENT) {
    clearInterval(poll);
    cancelCapture?.();
    return;
  }
  if (e.audioEvent) {
    recording?.push(e.audioEvent.audioPcm);
    return;
  }
  const s = current;
  if (!s) return;
  const ev = e.listEvent ?? e.textEvent ?? e.sysEvent;
  if (!ev) return;
  // CLICK_EVENT(0) は既定値のため JSON から省かれて届くことがある
  const type = ev.eventType ?? OsEventTypeList.CLICK_EVENT;
  if (s.kind === 'text' && (type === OsEventTypeList.SCROLL_TOP_EVENT || type === OsEventTypeList.SCROLL_BOTTOM_EVENT)) {
    // Firmware scrolls overflowing text. Replacing content here causes visible jumps.
    // Pause polling so incoming output cannot reset the reader's scroll position.
    s.reading = true;
    return;
  }
  if (type === OsEventTypeList.LONG_PRESS_EVENT) {
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
    if (e.listEvent) s.onPick(e.listEvent.currentSelectItemIndex ?? 0);
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
  bridge = await waitForEvenAppBridge();
  // 開発用URLからも接続コードと言語だけを読み込む
  const q = new URLSearchParams(location.search);
  for (const k of ['code', 'lang']) {
    // evenhub qr は QR 内の & を &amp; にするため "amp;lang" でも受ける
    const v = q.get(k) ?? q.get(`amp;${k}`);
    if (v != null) await bridge.setLocalStorage(k, v);
  }
  const pref = (await bridge.getLocalStorage('lang')) || 'auto';
  $('lang').value = pref;
  useLang(pref);
  recordingMode = await bridge.getLocalStorage('recording-mode') === 'hold' ? 'hold' : 'tap';
  $('recording-mode').value = recordingMode;
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
    recordingMode = $('recording-mode').value === 'hold' ? 'hold' : 'tap';
    await bridge.setLocalStorage('recording-mode', recordingMode);
    await bridge.setLocalStorage('lang', $('lang').value);
    useLang($('lang').value);
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
  window.addEventListener('pagehide', () => { clearInterval(poll); cancelCapture?.(); });
  await connect();
}

main();
