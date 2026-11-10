// Hermes is the agent. Provider/model are session settings, never filter identities.
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { access } from 'node:fs/promises';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { formatMessages, modelName } from './reader-text.mjs';
import { hermesHome, hermesLauncher, orcaProfileDir } from './platform.mjs';

const root = hermesHome();
const launcher = hermesLauncher(root);
const helper = fileURLToPath(new URL('./hermes-client.py', import.meta.url));
const normalize = value => String(value || '').replaceAll('\\', '/').replace(/\/$/, '').toLowerCase();
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const isHermes = handle => typeof handle === 'string' && handle.startsWith('hermes:');
export const hermesHandle = target => `hermes:${digest([normalize(target.profile), target.instance, target.epoch, target.session, target.started, target.source])}`;

function execute(command, args, request, timeout) {
  return new Promise((resolve, reject) => {
    const child = execFile(command, args, { timeout, maxBuffer: 8 * 1024 * 1024, windowsHide: true }, (error, stdout) => {
      // execFile's raw errors include argv/stderr. Do not expose them to clients.
      if (error) return reject(new Error(request?.action === 'send' ? 'Delivery uncertain. Reopen the session before sending again.' : 'Hermes is unavailable.'));
      try { resolve(JSON.parse(stdout)); } catch { reject(new Error('Hermes returned an invalid response.')); }
    });
    child.stdin.on('error', () => {});
    child.stdin.end(request ? JSON.stringify(request) : '');
  });
}

let runtime;
async function localTransport(request) {
  await access(launcher);
  // Ask the existing installation for its current Python/dependency environment.
  // No pinned interpreter, second venv, package install or gateway startup.
  if (!runtime) runtime = execute(launcher, ['--print-runtime-command', '--module', 'runpy', '--', helper], null, 3000)
    .catch(error => { runtime = null; throw error; });
  const [command] = await runtime;
  const response = await execute(command, ['-I', helper, root], { ...request, root }, request.action === 'list' ? 14000 : 27000);
  // 'answer' is a write like 'send': a transport failure must not read as "not sent".
  if (request.action === 'answer' && !response.ok && response.error === 'hermes_unavailable') throw new Error('Delivery uncertain. Reopen the session before choosing again.');
  if (!response.ok) throw new Error(response.error === 'question_pending' ? 'Hermes is waiting for an answer to its question. Click for choices, or answer it in Telegram or Hermes Desktop.'
    : response.error === 'question_changed' ? 'Question changed or was already answered. Nothing sent.'
    : response.error === 'stale_target' ? 'Hermes session changed or needs attention. Reopen it before sending.'
    : response.error === 'delivery_uncertain' ? 'Delivery uncertain. Reopen the session before sending again.' : 'Hermes is unavailable.');
  return response.result;
}

// Hermes Desktop groups conversations as Bots (one per profile), Sessions
// (Desktop chats) and Scheduled jobs (cron definitions). The bot name is the
// profile's ui_meta.title (the Desktop label), else display_name, else its name.
export function profileTitle(yaml, fallback) {
  const meta = /^ui_meta:[^\n]*\n((?:[ \t]+[^\n]*(?:\n|$))*)/m.exec(yaml || '')?.[1] || '';
  const title = /^[ \t]+title:[ \t]*(.+?)[ \t]*$/m.exec(meta)?.[1] || /^display_name:[ \t]*(.+?)[ \t]*$/m.exec(yaml || '')?.[1];
  return title ? title.replace(/^(['"])(.*)\1$/, '$2') : fallback;
}

// Read-only: the root profile ('default') and profiles/*, with each profile's
// cron job definitions. Bounded; unreadable files simply contribute nothing.
export function hermesProfiles(home = root) {
  const read = file => { try { return readFileSync(file, 'utf8'); } catch { return ''; } };
  let dirs = [];
  try { dirs = readdirSync(join(home, 'profiles'), { withFileTypes: true }).filter(d => d.isDirectory()).slice(0, 32).map(d => [d.name, join(home, 'profiles', d.name)]); } catch {}
  return [['default', home], ...dirs].filter(([, dir]) => existsSync(join(dir, 'profile.yaml'))).map(([name, dir]) => {
    let jobs = [];
    try {
      const parsed = JSON.parse(read(join(dir, 'cron', 'jobs.json')) || '[]');
      jobs = (Array.isArray(parsed) ? parsed : parsed?.jobs || []).filter(j => typeof j?.id === 'string' && typeof j?.name === 'string')
        .slice(0, 200).map(j => ({ id: j.id, name: j.name, lastRunAt: Date.parse(j.last_run_at) || undefined }));
    } catch {}
    return { name, dir, title: profileTitle(read(join(dir, 'profile.yaml')), name), jobs };
  });
}

const botGroup = dir => `hermes-bot:${digest(normalize(dir))}`;
const jobGroup = (dir, job) => `hermes-job:${digest([normalize(dir), job])}`;

// Picker entries for every bot and scheduled job, including ones with no sessions yet.
export function hermesCatalog(profiles = hermesProfiles()) {
  return profiles.flatMap(p => [
    { id: botGroup(p.dir), name: p.title, hermes: 'bot' },
    ...p.jobs.map(j => ({ id: jobGroup(p.dir, j.id), name: j.name, hermes: 'job', lastActivityAt: j.lastRunAt })),
  ]);
}

// Pending Hermes questions after the chat. With an open choice question the
// reader shows that menu instead (readerContent), so only the batch is listed here
// when the glasses cannot answer: multi-select, approvals, or not yet checked.
export function clarifyText(questions, answerable = null) {
  if (!Array.isArray(questions) || !questions.length) return '';
  const blocks = questions.map((q, i) => [`> ? ${questions.length > 1 ? `(${i + 1}/${questions.length}) ` : ''}${q.question}`,
    ...(q.choices || []).map((c, n) => `  ${n + 1}. ${c}`)].join('\n'));
  return [...blocks, answerable === 'text' ? '> Hold to answer by voice.' : '> Answer in Telegram or Hermes Desktop.'].join('\n');
}

export function hermesBinding(document, terminal, sessions) {
  const pane = `${terminal.tabId}:${terminal.leafId}`;
  const record = document.sleepingAgentSessionsByPaneKey?.[pane];
  const provider = record?.providerSession;
  if (terminal.agentIdentity !== 'hermes' || !terminal.connected || terminal.orphaned ||
      (terminal.executionHostId && terminal.executionHostId !== 'local') ||
      record?.agent !== 'hermes' || record.origin !== 'live' || record.paneKey !== pane ||
      record.worktreeId !== terminal.worktreeId || !terminal.incarnationId ||
      document.terminalPtyIncarnationsByPaneKey?.[pane] !== terminal.incarnationId || !provider?.id) return null;
  // Session ID alone is insufficient: profiles may contain the same ID.
  const candidates = [...new Map(sessions.filter(s => s.target.session === provider.id &&
    s.orca?.paneKey === pane && s.orca?.worktreeId === terminal.worktreeId)
    .map(s => [hermesHandle(s.target), s])).values()];
  return candidates.length === 1 ? candidates[0] : null;
}

export function mergeHermesThreads(threads, sessions, terminals = [], document = {}, profiles = []) {
  const unique = new Map();
  for (const session of sessions) {
    const handle = hermesHandle(session.target);
    // Multiple contradictory owner records are not safe to choose between.
    const key = `${normalize(session.target.profile)}\0${session.target.session}`;
    if (unique.has(key) && unique.get(key)?.handle !== handle) unique.set(key, null);
    else if (!unique.has(key)) unique.set(key, { session, handle });
  }
  const hermesRows = [...unique.values()].filter(Boolean).map(({ session, handle }) => {
    const matches = terminals.filter(t => hermesBinding(document, t, sessions) === session);
    const owned = matches.length === 1 ? threads.find(t => t.handle === matches[0].handle) : null;
    // One group per session: a Desktop chat is its own Session, a cron run
    // belongs to its job (the run title starts with the job name), anything
    // else (Telegram and other channels) to its profile's Bot.
    const profile = profiles.find(p => normalize(p.dir) === normalize(session.target.profile));
    const bot = profile?.title || session.profileName;
    const job = session.target.source === 'cron' ? profile?.jobs.find(j => (session.title || '').startsWith(j.name)) : null;
    const group = session.target.source === 'desktop' ? { id: `hermes-session:${handle}`, label: session.title || 'Hermes session', kind: 'session' }
      : job ? { id: jobGroup(profile.dir, job.id), label: job.name, kind: 'job' }
      : { id: botGroup(session.target.profile), label: bot, kind: 'bot' };
    return { handle, title: session.title, agent: 'hermes',
      state: session.state === 'working' ? 'busy' : session.state === 'waiting' ? 'idle' : 'unknown',
      workspaceId: owned?.workspaceId || group.id,
      workspaceName: owned?.workspaceName || bot,
      workspaceLabel: owned?.workspaceLabel || group.label,
      hermesGroup: owned ? 'session' : group.kind,
      lastOutputAt: Number(session.target.started || 0) * 1000 };
  });
  // Gateway is authoritative for Hermes. Unproven terminal panes are never a
  // second row or an alternate input route; other agents remain untouched.
  return [...threads.filter(t => t.agent !== 'hermes'), ...hermesRows];
}

function orcaDocument() {
  const directory = orcaProfileDir();
  let db;
  try {
    db = new DatabaseSync(join(directory, 'profile-state.db'), { readOnly: true });
    return JSON.parse(db.prepare("SELECT payload FROM profile_state_documents WHERE domain = 'workspaceSession'").get()?.payload || '{}');
  } catch { return {}; } finally { db?.close(); }
}

export function createHermesAdapter(transport = localTransport, { document = orcaDocument, listWaitMs = 1500, profiles = () => hermesProfiles(), promptCheckMs = 10000, now = Date.now } = {}) {
  let sessions = [], refreshed = 0, pending = null;
  const targets = new Map();
  // Which question is open needs a gateway attach (session.resume), so the reader's
  // 1-second polls reuse the last answer for promptCheckMs. Answering clears it.
  const prompts = new Map();
  let unavailableProfiles = 0;
  async function discover() {
    if (!pending && Date.now() - refreshed > 5000) {
      pending = transport({ action: 'list' }).then(result => {
        sessions = result.sessions || [];
        unavailableProfiles = result.unavailableProfiles || 0;
        targets.clear();
        for (const s of sessions) targets.set(hermesHandle(s.target), s.target);
        refreshed = Date.now();
      }).catch(() => { sessions = []; targets.clear(); unavailableProfiles = 1; refreshed = Date.now(); })
        .finally(() => { pending = null; });
    }
    if (pending) {
      let timer;
      await Promise.race([pending, new Promise(resolve => { timer = setTimeout(resolve, listWaitMs); })]);
      clearTimeout(timer);
    }
    return sessions;
  }
  async function request(handle, action, extra = {}) {
    const target = targets.get(handle);
    if (!target) throw new Error('Hermes session is stale. Refresh the sessions list.');
    // Helper re-enumerates exact profile/session/instance immediately on every read/write.
    return transport({ action, target, ...extra });
  }
  return {
    discover,
    async merge(threads, terminals) { return mergeHermesThreads(threads, await discover(), terminals, document(), profiles()); },
    async read(handle) {
      const cached = prompts.get(handle);
      const result = await request(handle, 'read', { withPrompt: !cached || now() - cached.at >= promptCheckMs });
      if (!result.questions?.length) prompts.delete(handle);
      else if (result.promptChecked) prompts.set(handle, { at: now(), menu: result.menu || null, answerable: result.answerable || null });
      const open = result.questions?.length ? prompts.get(handle) : null;
      // An open choice question becomes the reader's choice menu (Click or a spoken
      // number), exactly like a terminal prompt; otherwise list the batch as text.
      const menu = open?.menu || null;
      const text = [formatMessages(result.messages || []), menu ? '' : clarifyText(result.questions, open?.answerable)].filter(Boolean).join('\n');
      // The gateway lists each session's model; the status row shows it.
      const model = modelName(sessions.find(s => hermesHandle(s.target) === handle)?.model) || undefined;
      return { text, model, source: 'hermes-transcript', limited: !!result.limited, messageCount: result.messages?.length || 0, menu, progress: '' };
    },
    async choose(handle, id, value) {
      if (typeof id !== 'string' || !/^[0-9a-f]{64}$/.test(id) || typeof value !== 'string' || !/^[1-9]$/.test(value)) throw new Error('Unknown choice');
      prompts.delete(handle);
      // The helper re-reads the open prompt and answers only if it still has this exact id.
      return request(handle, 'answer', { menuId: id, value });
    },
    activity: handle => request(handle, 'activity'),
    async send(handle, text, enter) {
      if (!enter) throw new Error('Hermes accepts complete confirmed messages only.');
      if (typeof text !== 'string' || !text.trim() || text.length > 16000) throw new Error('Invalid Hermes message.');
      const result = await request(handle, 'send', { text, submissionId: randomUUID() });
      if (!result.accepted) throw new Error('Delivery uncertain. Reopen the session before sending again.');
      return result;
    },
    status: () => ({ unavailableProfiles }),
  };
}

export const hermes = createHermesAdapter();
