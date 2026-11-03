// デモモード: 中継サーバなしで全画面を試せる架空データ(審査・ストア画像用)。実在の名前や会話は入れない
import type { Lang } from './i18n';

type Thread = { handle: string; title: string; agent: string; state: 'idle' | 'busy' | 'unknown' };

const content = {
  en: {
    threads: [
      ['demo-1', 'Refactor auth middleware', 'claude', 'idle'],
      ['demo-2', 'Fix flaky CI test', 'codex', 'busy'],
      ['demo-3', 'Draft release notes', 'claude', 'idle'],
    ],
    texts: {
      'demo-1':
        'Session validation now lives in one place.\n- Expired tokens return 401\n- Admin routes use the same check\n\nAll 42 tests pass. Shall I commit this?\n1. Yes\n2. No, show me the diff',
      'demo-2': 'Looking into the timeouts.\nParallel tests shared one port, so each test now picks a free port.',
      'demo-3': 'Drafted release notes for v2.3.0.\n- New: CSV export\n- Fixed: date display offset\n\nPlease review the wording before publishing.',
    },
    replies: ['1 (Yes)', "2 (Yes, don't ask again)", '3 (No)', 'Continue', 'OK, go ahead', 'Status in 3 lines'],
    prompts: ['Start without a prompt', 'Run tests and report', 'Summarize changes'],
    heard: 'Looks good, go ahead with that plan',
    week: 'week',
  },
} as const;

export function demoCall(lang: Lang, method: string, path: string, body: unknown): unknown {
  const c = content[lang];
  // APIパスとクエリだけが必要。ホスト名を持つ仮URLは作らない。
  const queryStart = path.indexOf('?');
  const pathname = queryStart === -1 ? path : path.slice(0, queryStart);
  const searchParams = new URLSearchParams(queryStart === -1 ? '' : path.slice(queryStart + 1));
  const b = (body ?? {}) as Record<string, unknown>;
  switch (`${method} ${pathname}`) {
    case 'GET /healthz':
      return { ok: true };
    case 'GET /api/threads':
      return c.threads.map(([handle, title, agent, state]) => ({ handle, title, agent, state }) as Thread);
    case 'GET /api/thread':
    case 'GET /api/history':
      return { text: '/ Please review this session.\n> ' + (c.texts[searchParams.get('handle') as keyof typeof c.texts] ?? '').replaceAll('\n', '\n  ') };
    case 'GET /api/activity':
      return { state: searchParams.get('handle') === 'demo-2' ? 'working' : 'waiting', elapsedSeconds: searchParams.get('handle') === 'demo-2' ? 812 : null };
    case 'GET /api/replies':
      return c.replies;
    case 'POST /api/reply':
      return { sent: c.replies[Number(b.index)] ?? '' };
    case 'POST /api/transcribe':
      return { text: c.heard };
    case 'POST /api/say':
      return { sent: String(b.text ?? '') };
    case 'GET /api/usage':
      return {
        claude: { provider: 'claude', status: 'ok', session: { usedPercent: 12, resetDescription: '3:00 PM' }, weekly: { usedPercent: 30, resetDescription: 'Sat' } },
        codex: { provider: 'codex', status: 'ok', session: null, weekly: { usedPercent: 55, resetDescription: 'Mon' } },
      };
    case 'GET /api/providers':
      return [
        { id: 'claude', models: ['default', 'opus', 'sonnet', 'haiku'], ok: true, note: `5h 12% ${c.week} 30%` },
        { id: 'codex', models: ['default'], ok: true, note: `${c.week} 55%` },
      ];
    case 'GET /api/workspaces':
      return [
        { id: 'demo-ws-1', name: 'my-app' },
        { id: 'demo-ws-2', name: 'website' },
      ];
    case 'GET /api/prompts':
      return c.prompts;
    case 'POST /api/session':
      return { handle: 'demo-new', sent: true };
    default:
      throw new Error(`demo: ${method} ${pathname}`);
  }
}
