// English-only interface. Use symbols supported by the G2 font.
export type Lang = 'en';

const dict = {
  en: {
    error: 'Error: {0}',
    homeTitle: 'Orca · {0} connected terminals',
    newSession: '＋ New session',
    usage: '◇ Usage',
    replyTitle: 'Reply → {0}',
    voice: '[Voice] Speak a reply',
    sent: 'Sent: {0}',
    failed: 'Failed {0}',
    transcribing: 'Transcribing…',
    processing: 'Processing {0}s of audio on your PC',
    voiceTitle: 'Voice',
    notHeard: 'Could not hear anything',
    confirmSend: 'Click=send / Double=cancel',
    recording: '● Recording {0}s',
    recordingHint: 'Click when you are done\nDouble-click to cancel',
    micFailed: 'Could not start the microphone',
    usageTitle: 'Usage',
    weekly: 'week',
    noInfo: 'no data',
    unavailable: 'Unavailable: {0}',
    newTitle: 'New session',
    step1: 'New 1/4 Workspace',
    step2: 'New 2/4 Agent ({0})',
    step3: 'New 3/4 Model ({0})',
    step4: 'New 4/4 First prompt',
    launch: '▶ Launch',
    cancel: 'Cancel',
    launching: 'Launching…',
    waitingAgent: 'Waiting for the agent to be ready (up to 60s)',
    launched: 'Launched',
    launchedNotSent: 'Launched, but the prompt was not sent ({0})',
    notPairedDiag: 'Not set up: paste the pairing code and save',
    notPaired: 'Open Orca Glass on your phone\nand enter the pairing code\n\n(Setup on your PC is required)',
    noRelay: 'Could not find your PC on the relay (the tunnel on your PC may be stopped)',
    viaCode: 'pairing code',
    diagOk: 'OK {0}ms\nVia: {1}\nBridge: {2}\nThreads: {3}',
    diagNg: 'NG {0}\nVia: {1}\nBridge: {2}',
    offlineTitle: 'Cannot reach your PC',
    offline: 'Check that the bridge and tunnel are running on your PC\n\n{0}\n\nClick to reconnect',
    badCode: 'NG Invalid pairing code (one line starting with eho1.)',
    pageIntro: 'View, reply to and start <a href="https://github.com/stablyai/orca">Orca</a> agent sessions on your PC from G2. <b>Setup on your PC is required.</b>',
    setupTitle: 'Getting started (on your PC)',
    setupSteps: '<li>Install Orca on your PC</li><li>Ask Codex to "set up Orca Glass" (skill: <a href="https://github.com/eugene8080/orca-glass">github.com/eugene8080/orca-glass</a>)</li><li>Paste the pairing code it gives you below and save</li>',
    opsTitle: 'On the glasses',
    opsList: '<li>Conversation: hold to talk directly; release to review. Click to send or double-click to cancel. No Reply menu is required. Double-click while recording to cancel.</li><li>Single click in a conversation does nothing. Double-click to return to sessions.</li><li>Scroll naturally within the text block.</li><li>Scrolling pauses updates. Return to the session list and reopen the session to resume.</li>',
    codeLabel: 'Pairing code (run <code>npm run pair</code> on your PC and paste)',
    langLabel: 'Language',
    save: 'Save and reconnect',
    diagLabel: 'Status',
    tryDemo: 'Try the demo (no PC needed)',
    viaDemo: 'demo (sample data)',
  },
} satisfies Record<Lang, Record<string, string>>;

export type Key = keyof typeof dict.en;

let lang: Lang = 'en';

export function detectLang(_pref: string): Lang {
  return 'en';
}

export function setLang(l: Lang) {
  lang = l;
}

export const getLang = () => lang;

export function t(key: Key, ...args: (string | number)[]): string {
  return dict[lang][key].replace(/\{(\d)\}/g, (_, i) => String(args[Number(i)] ?? ''));
}

// data-i18n 属性の付いた要素にその言語の文言を入れる(設定画面用。文言は固定の辞書なので innerHTML で良い)
export function applyPage() {
  document.documentElement.lang = lang;
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.innerHTML = t(el.dataset.i18n as Key);
  });
}
