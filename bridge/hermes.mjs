// Hermes is the agent. Provider/model are session settings, never filter identities.
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { access } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { formatMessages } from './reader-text.mjs';

const root = process.env.ORCA_GLASS_HERMES_HOME || join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'hermes');
const launcher = process.env.ORCA_GLASS_HERMES_CLI || join(root, 'bin', 'hermes.exe');
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
  if (!response.ok) throw new Error(response.error === 'stale_target' ? 'Hermes session changed or needs attention. Reopen it before sending.'
    : response.error === 'delivery_uncertain' ? 'Delivery uncertain. Reopen the session before sending again.' : 'Hermes is unavailable.');
  return response.result;
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

export function mergeHermesThreads(threads, sessions, terminals = [], document = {}) {
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
    const workspaceId = `hermes-profile:${digest(normalize(session.target.profile))}`;
    return { handle, title: session.title, agent: 'hermes',
      state: session.state === 'working' ? 'busy' : session.state === 'waiting' ? 'idle' : 'unknown',
      workspaceId: owned?.workspaceId || workspaceId,
      workspaceName: owned?.workspaceName || `Hermes: ${session.profileName}`,
      workspaceLabel: owned?.workspaceLabel || session.profileName,
      lastOutputAt: Number(session.target.started || 0) * 1000 };
  });
  // Gateway is authoritative for Hermes. Unproven terminal panes are never a
  // second row or an alternate input route; other agents remain untouched.
  return [...threads.filter(t => t.agent !== 'hermes'), ...hermesRows];
}

function orcaDocument() {
  const directory = process.env.ORCA_GLASS_PROFILE_DIR || join(process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'), 'orca', 'profiles', 'local-default');
  let db;
  try {
    db = new DatabaseSync(join(directory, 'profile-state.db'), { readOnly: true });
    return JSON.parse(db.prepare("SELECT payload FROM profile_state_documents WHERE domain = 'workspaceSession'").get()?.payload || '{}');
  } catch { return {}; } finally { db?.close(); }
}

export function createHermesAdapter(transport = localTransport, { document = orcaDocument, listWaitMs = 1500 } = {}) {
  let sessions = [], refreshed = 0, pending = null;
  const targets = new Map();
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
    async merge(threads, terminals) { return mergeHermesThreads(threads, await discover(), terminals, document()); },
    async read(handle) {
      const result = await request(handle, 'read');
      const text = formatMessages(result.messages || []);
      return { text, source: 'hermes-transcript', limited: !!result.limited, messageCount: result.messages?.length || 0, menu: null, progress: '' };
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
