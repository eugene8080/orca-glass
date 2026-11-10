// English-only interface. Use symbols supported by the G2 font.
// Stage J1 (2026-11-10): English and Japanese. Japanese marked "upstream" below
// is the original native-speaking author's wording (git 5323bb0, Mac -> PC);
// every other Japanese string is the agent's translation, pending native review.
export type Lang = 'en' | 'ja';

const en = {
  error: 'Error: {0}',
  homeTitle: 'Orca · {0} sessions',
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
  setupSteps: '<li>Install Orca on your PC</li><li>Ask Codex to "set up Orca Glass" (skill: <a href="https://github.com/eugene8080/orca-glass">github.com/eugene8080/orca-glass</a>)</li><li>On Home, tap the connection bar, paste the pairing code it gives you and save</li>',
  opsTitle: 'On the glasses',
  opsList: '<li>Conversation: hold to talk directly; release to review. Click to send or double-click to cancel. No Reply menu is required. Double-click while recording to cancel.</li><li>Single click in a conversation does nothing. Double-click to return to sessions.</li><li>Scroll naturally within the text block.</li><li>Scrolling pauses updates. Return to the session list and reopen the session to resume.</li>',
  codeLabel: 'Pairing code (run <code>npm run pair</code> on your PC and paste)',
  langLabel: 'Language',
  save: 'Save and reconnect',
  diagLabel: 'Status',
  tryDemo: 'Try the demo (no PC needed)',
  viaDemo: 'demo (sample data)',
  // Glasses: session list, filters and pickers.
  sessionCount: '{0} sessions',
  connectingOrca: 'Connecting to Orca…',
  filterAgent: 'Filter by Agent',
  filterWorkspace: 'Filter by Workspace',
  filterWorkspaceHermes: 'Filter by Workspace (Hermes)',
  allOrcaSessions: 'All Orca sessions',
  allOrcaSessionsRow: 'All Orca Sessions',
  refreshSessions: 'Refresh sessions',
  menuNewSession: 'New Session',
  menuUsage: 'Usage',
  moreBelow: 'v more below',
  moreAbove: '^ more above',
  done: 'Done',
  allWorkspaces: 'All workspaces',
  noneSelected: 'None',
  countSelected: '{0} selected',
  workspaceFallback: 'Workspace',
  unavailableSuffix: '{0} (unavailable)',
  recentWorkspaces: 'Recent workspaces',
  otherWorkspaces: 'Other workspaces',
  hermesBots: 'Bots',
  hermesSessions: 'Sessions',
  hermesJobs: 'Scheduled jobs',
  unavailableSection: 'Unavailable',
  // Glasses: reader status row, menu and errors.
  statusWaiting: '/Waiting',
  statusAttention: '/Needs attention',
  statusUnknown: '/Status unknown',
  workingWords: 'Processing|Thinking|Pondering|Cooking|Computing|Inferring|Burning Tokens',
  hintTap: '[Tap&Hold for Input]',
  hintTapShort: '[Tap&Hold]',
  hintTapTiny: '[T&H]',
  hintChoices: '[Click:choices]',
  hintChoicesShort: '[Click]',
  pageCounter: 'Pg{0}/{1}',
  refreshing: 'Refreshing…',
  usingFont: 'Using: {0}',
  nativeText: 'Native text',
  compareFonts: 'Compare fonts',
  compareBack: 'Swipe to return to the chat.',
  pageRejected: 'Glasses rejected the page. Swipe to retry.',
  textLoadFailed: 'Glasses could not load the selected text. Click to retry.',
  screenRejected: 'glasses rejected the screen update',
  conversationHistory: 'Conversation history',
  terminalOnly: 'Terminal buffer only',
  noOlderOutput: 'No older terminal output is retained.',
  chooseHint: 'Click to choose / Double-click to cancel',
  sending: 'Sending…',
  inputSent: 'Input sent: {0}',
  voiceListening: 'Listening… release to review',
  voiceReview: 'Tap to send / Double tap to cancel',
  voiceReturn: 'Tap or double tap to return',
  finishingTranscription: 'Finishing transcription…',
  sayOptionNumber: 'Say one of the displayed option numbers. Nothing sent.',
  monthly: 'Monthly',
  resetLine: 'Reset: {0}  (Click to change)',
  resetComputer: 'Computer time',
  resetPhone: 'Phone time',
  resetAbsolute: 'Absolute time',
  resetUnavailable: 'Reset time unavailable',
  // Phone page.
  tabHome: 'Home',
  tabSettings: 'Settings',
  filtersTitle: 'Filters',
  filtersNote: 'Shared with the glasses session list.',
  resetTimeAria: 'Reset time',
  refresh: 'Refresh',
  composerNote: 'Type a sentence or use your Android keyboard’s microphone, then review it before sending.',
  messageLabel: 'Message',
  reviewMessage: 'Review message',
  sendToSession: 'Send to this session',
  replyTo: 'Reply to: {0} ({1})',
  readyToSend: 'Ready to send to {0}: {1}',
  sentDone: 'Sent.',
  settingsVoiceNote: 'In a conversation, hold to talk and release to review. Click to send or double-click to cancel. Double-click while recording to cancel.',
  connConnected: 'Connected · PC bridge · {0}ms',
  connDemo: 'Demo · sample data',
  connOffline: 'Offline · {0}',
  connConnecting: 'Connecting…',
  connUnpaired: 'Not connected · tap to pair',
  usageUnavailable: 'Usage unavailable',
  usageNone: 'No usage information',
  usageStatusUnavailable: 'Unavailable',
  usageLimitLine: ' · {0} · resets {1}',
  window5h: '5h',
  windowWeekly: 'Weekly',
  windowMonthly: 'Monthly',
  modeComputer: 'Computer',
  modePhone: 'Phone',
  modeAbsolute: 'Absolute',
  menuLayoutCompact: 'Menu layout: Compact compatibility',
  menuLayoutAligned: 'Menu layout: Aligned native text (animated dots)',
};

export type Key = keyof typeof en;

// Record<Key, string> on an object literal makes TypeScript reject a missing or
// an extra key, so the two dictionaries cannot drift apart.
const ja: Record<Key, string> = {
  error: 'エラー: {0}', // upstream
  homeTitle: 'Orca · セッション{0}件',
  newSession: '＋ 新規セッション', // upstream
  usage: '◇ 使用量', // upstream
  replyTitle: '返信 → {0}', // upstream
  voice: '[音声] 話して返信', // upstream
  sent: '送信: {0}', // upstream
  failed: '失敗 {0}', // upstream
  transcribing: '文字起こし中…', // upstream
  processing: '{0}秒の音声を PC で処理しています', // upstream (Mac -> PC)
  voiceTitle: '音声入力', // upstream
  notHeard: '聞き取れませんでした', // upstream
  confirmSend: 'クリック=送信 / ダブル=やめる', // upstream
  recording: '● 録音中 {0}秒', // upstream
  recordingHint: '話し終えたらクリック\nダブルクリックで中止', // upstream
  micFailed: 'マイクを開始できませんでした', // upstream
  usageTitle: '使用量', // upstream
  weekly: '週', // upstream
  noInfo: '情報なし', // upstream
  unavailable: '使用不可: {0}', // upstream
  newTitle: '新規セッション', // upstream
  step1: '新規 1/4 作業場所', // upstream
  step2: '新規 2/4 エージェント ({0})', // upstream
  step3: '新規 3/4 モデル ({0})', // upstream
  step4: '新規 4/4 最初の指示', // upstream
  launch: '▶ 起動する', // upstream
  cancel: 'やめる', // upstream
  launching: '起動中…', // upstream
  waitingAgent: 'エージェントの準備を待っています(最大60秒)', // upstream
  launched: '起動しました', // upstream
  launchedNotSent: '起動しましたが指示は未送信です({0})', // upstream
  notPairedDiag: '未設定: 接続コードを貼って保存してください', // upstream
  notPaired: 'スマホの Orca Glass を開いて\n接続コードを設定してください\n\n(PC 側の準備が必要です)', // upstream (Mac -> PC)
  noRelay: '連絡板に PC の接続先が見つかりません(PC 側のトンネルが止まっている可能性)', // upstream (Mac -> PC)
  viaCode: '接続コード', // upstream
  diagOk: 'OK {0}ms\n方式: {1}\n接続先: {2}\nスレッド {3}件', // upstream
  diagNg: 'NG {0}\n方式: {1}\n接続先: {2}', // upstream
  offlineTitle: 'PC につながりません', // upstream (Mac -> PC)
  offline: 'PC の中継サーバとトンネルが動いているか確認してください\n\n{0}\n\nクリックで再接続', // upstream (Mac -> PC)
  badCode: 'NG 接続コードの形式が違います(eho1. で始まる1行)', // upstream
  pageIntro: 'G2 から PC 上の <a href="https://github.com/stablyai/orca">Orca</a> のエージェントを見る・返信する・起動するアプリです。<b>PC 側の準備が必要です。</b>', // upstream (Mac -> PC)
  setupTitle: 'はじめに(PC 側の準備)', // upstream (Mac -> PC)
  setupSteps: '<li>PC に Orca を入れておく</li><li>Codex に「Orca Glass をセットアップして」と頼む(スキル: <a href="https://github.com/eugene8080/orca-glass">github.com/eugene8080/orca-glass</a>)</li><li>ホームで接続バーをタップし、表示された接続コードを貼って保存</li>',
  opsTitle: 'グラスでの操作', // upstream
  opsList: '<li>会話画面: 長押ししてそのまま話し、離すと内容を確認できます。クリックで送信、ダブルクリックで中止します。返信メニューは不要です。録音中もダブルクリックで中止できます。</li><li>会話画面でのクリックは何もしません。ダブルクリックでセッション一覧に戻ります。</li><li>テキストはそのままスクロールできます。</li><li>スクロール中は更新が止まります。セッション一覧に戻って開き直すと再開します。</li>',
  codeLabel: '接続コード(PC で <code>npm run pair</code> を実行して貼り付け)', // upstream (Mac -> PC)
  langLabel: '言語', // upstream
  save: '保存して再接続', // upstream
  diagLabel: '状態',
  tryDemo: 'デモを試す(PC なし)', // upstream (Mac -> PC)
  viaDemo: 'デモ(架空のデータ)', // upstream
  sessionCount: 'セッション{0}件',
  connectingOrca: 'Orca に接続中…',
  filterAgent: 'エージェントで絞り込み',
  filterWorkspace: '作業場所で絞り込み',
  filterWorkspaceHermes: '作業場所で絞り込み (Hermes)',
  allOrcaSessions: 'Orca の全セッション',
  allOrcaSessionsRow: 'Orca の全セッション',
  refreshSessions: 'セッションを更新',
  menuNewSession: '新規セッション', // upstream (newTitle)
  menuUsage: '使用量', // upstream (usageTitle)
  moreBelow: 'v 下に続く',
  moreAbove: '^ 上に続く',
  done: '完了',
  allWorkspaces: 'すべての作業場所',
  noneSelected: 'なし',
  countSelected: '{0}件選択',
  workspaceFallback: '作業場所',
  unavailableSuffix: '{0} (利用不可)',
  recentWorkspaces: '最近の作業場所',
  otherWorkspaces: 'その他の作業場所',
  hermesBots: 'ボット',
  hermesSessions: 'セッション',
  hermesJobs: '定期ジョブ',
  unavailableSection: '利用不可',
  statusWaiting: '/入力待ち',
  statusAttention: '/要対応',
  statusUnknown: '/状態不明',
  workingWords: '処理中|思考中|熟考中|調理中|計算中|推論中|トークン消費中',
  hintTap: '[長押しで入力]',
  hintTapShort: '[長押し]',
  hintTapTiny: '[T&H]',
  hintChoices: '[クリックで選択]',
  hintChoicesShort: '[選択]',
  pageCounter: 'P{0}/{1}',
  refreshing: '更新中…',
  usingFont: '現在: {0}',
  nativeText: '標準フォント',
  compareFonts: 'フォント比較',
  compareBack: 'スワイプでチャットに戻ります。',
  pageRejected: 'グラスがページを受け付けませんでした。スワイプで再試行します。',
  textLoadFailed: 'グラスがテキストを読み込めませんでした。クリックで再試行します。',
  screenRejected: 'グラスが画面の更新を受け付けませんでした',
  conversationHistory: '会話履歴',
  terminalOnly: 'ターミナル表示のみ',
  noOlderOutput: '以前のターミナル出力は残っていません。',
  chooseHint: 'クリックで選択 / ダブルクリックで中止',
  sending: '送信中…',
  inputSent: '入力を送信: {0}',
  voiceListening: '聞き取り中… 離すと確認',
  voiceReview: 'タップで送信 / ダブルタップで中止',
  voiceReturn: 'タップかダブルタップで戻る',
  finishingTranscription: '文字起こしの仕上げ中…',
  sayOptionNumber: '表示中の選択肢の番号を言ってください。送信していません。',
  monthly: '月',
  resetLine: 'リセット: {0}  (クリックで切替)',
  resetComputer: 'PC の時刻',
  resetPhone: 'スマホの時刻',
  resetAbsolute: '残り時間',
  resetUnavailable: 'リセット時刻不明',
  tabHome: 'ホーム',
  tabSettings: '設定',
  filtersTitle: '絞り込み',
  filtersNote: 'グラスのセッション一覧と共通の設定です。',
  resetTimeAria: 'リセット時刻',
  refresh: '更新',
  composerNote: '文章を入力するか Android キーボードのマイクで話し、確認してから送信します。',
  messageLabel: 'メッセージ',
  reviewMessage: '内容を確認',
  sendToSession: 'このセッションに送信',
  replyTo: '返信先: {0} ({1})',
  readyToSend: '{0} に送信します: {1}',
  sentDone: '送信しました。',
  settingsVoiceNote: '会話画面で長押しして話し、離すと内容を確認できます。クリックで送信、ダブルクリックで中止します。録音中もダブルクリックで中止できます。',
  connConnected: '接続済み · PC ブリッジ · {0}ms',
  connDemo: 'デモ · サンプルデータ',
  connOffline: 'オフライン · {0}',
  connConnecting: '接続中…',
  connUnpaired: '未接続 · タップして接続設定',
  usageUnavailable: '使用量を取得できません',
  usageNone: '使用量の情報なし',
  usageStatusUnavailable: '取得できません',
  usageLimitLine: ' · {0} · リセット {1}',
  window5h: '5時間',
  windowWeekly: '週',
  windowMonthly: '月',
  modeComputer: 'PC',
  modePhone: 'スマホ',
  modeAbsolute: '残り',
  menuLayoutCompact: 'メニュー表示: 互換モード(簡易)',
  menuLayoutAligned: 'メニュー表示: 整列テキスト(ドット表示)',
};

const dict = { en, ja } satisfies Record<Lang, Record<Key, string>>;

export const LANGS: Lang[] = ['en', 'ja'];
export const dictionaryFor = (l: Lang): Readonly<Record<Key, string>> => dict[l];

let lang: Lang = 'en';

export function detectLang(pref: string): Lang {
  return pref === 'ja' ? 'ja' : 'en';
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
  // aria-label text (no markup) for controls whose visible text is set elsewhere.
  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria as Key));
  });
}
