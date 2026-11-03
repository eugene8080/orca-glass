// Read-only adapter for Orca's recorded pane -> provider transcript association.
// Never infer identity from a working directory or choose the newest transcript.
import { DatabaseSync } from 'node:sqlite';
import { open, realpath, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, join, relative, resolve } from 'node:path';
import { formatMessages } from './reader-text.mjs';

const appData = process.env.APPDATA || join(homedir(), 'AppData', 'Roaming');
const orcaHome = join(appData, 'orca');
const profile = process.env.ORCA_GLASS_PROFILE_DIR || join(orcaHome, 'profiles', 'local-default');
const cache = new Map();
const reads = new Map();
const MAX_TEXT = 1_000_000;
const normalize = value => String(value || '').replace(/^\\\\\?\\/, '').replaceAll('\\', '/').replace(/\/$/, '').toLowerCase();

export function transcriptBinding(session, terminal) {
  const key = `${terminal.tabId}:${terminal.leafId}`;
  const record = session.sleepingAgentSessionsByPaneKey?.[key];
  if (!['codex', 'claude'].includes(terminal.agentIdentity) || !terminal.connected || terminal.orphaned ||
      (terminal.executionHostId && terminal.executionHostId !== 'local') ||
      session.terminalPtyIncarnationsByPaneKey?.[key] !== terminal.incarnationId ||
      record?.agent !== terminal.agentIdentity || record.origin !== 'live' || record.worktreeId !== terminal.worktreeId ||
      record.paneKey !== key || normalize(record.providerSession?.cwd) !== normalize(terminal.worktreePath)) return null;
  const provider = record.providerSession;
  if (!/^[a-f0-9-]{36}$/i.test(provider?.id || '') || !provider.transcriptPath) return null;
  return { id: provider.id, path: provider.transcriptPath, cwd: provider.cwd, provider: terminal.agentIdentity };
}

export function visibleMessage(record) {
  const p = record.payload;
  if (record.type !== 'response_item' || p?.type !== 'message' || !['user', 'assistant'].includes(p.role)) return null;
  if (p.role === 'assistant' && p.phase && !['final_answer', 'commentary'].includes(p.phase)) return null;
  const text = (p.content || []).filter(c => ['input_text', 'output_text', 'text'].includes(c.type) && typeof c.text === 'string').map(c => c.text).join('\n').trim();
  if (!text || (p.role === 'user' && /^(?:# AGENTS\.md instructions|<environment_context>|<permissions instructions>|<turn_aborted>)/.test(text))) return null;
  return { role: p.role, text, id: p.id || null };
}

// Claude JSONL contains tools and reasoning alongside visible chat. Only text
// blocks from the main conversation are eligible; never render tool_result.
export function visibleClaudeMessage(record) {
  if (!['user', 'assistant'].includes(record.type) || record.isSidechain || record.isMeta || record.isCompactSummary) return null;
  const message = record.message;
  if (message?.role !== record.type) return null;
  const content = message.content;
  const text = (typeof content === 'string' ? content : Array.isArray(content)
    ? content.filter(b => b.type === 'text' && typeof b.text === 'string').map(b => b.text).join('\n') : '').trim();
  if (!text || (record.type === 'user' && /^(?:<local-command|<command-name>|<system-reminder>|<task-notification>|This session is being continued from a previous conversation)/.test(text))) return null;
  return { role: record.type, text, id: record.uuid || null };
}

export function readTranscript(file, binding) {
  const key = `${file}:${binding.id}:${binding.provider || 'codex'}`;
  const previous = reads.get(key) || Promise.resolve();
  const task = previous.catch(() => {}).then(() => parseTranscript(file, binding));
  reads.set(key, task);
  task.finally(() => { if (reads.get(key) === task) reads.delete(key); }).catch(() => {});
  return task;
}

async function parseTranscript(file, binding) {
  const info = await stat(file);
  const key = `${file}:${binding.id}:${binding.provider || 'codex'}`;
  let state = cache.get(key);
  if (!state || info.size < state.offset || (info.size === state.size && info.mtimeMs !== state.mtime)) {
    state = { offset: 0, size: 0, mtime: 0, messages: [], chars: 0, limited: false, meta: null, ids: new Set() };
    cache.set(key, state);
    if (cache.size > 32) cache.delete(cache.keys().next().value);
  }
  if (info.size > state.offset) {
    const size = info.size - state.offset;
    if (size > 64 * 1024 * 1024) throw new Error('Transcript exceeds the current reader size limit');
    const fd = await open(file, 'r');
    let data;
    try {
      data = Buffer.alloc(size);
      let total = 0;
      while (total < size) {
        const { bytesRead } = await fd.read(data, total, size - total, state.offset + total);
        if (!bytesRead) break;
        total += bytesRead;
      }
      data = data.subarray(0, total);
    } finally { await fd.close(); }
    // Leave an incomplete final record for the next read; do not lose live text.
    const end = data.lastIndexOf(10) + 1;
    for (const line of data.subarray(0, end).toString('utf8').split('\n')) {
      if (!line.trim()) continue;
      let record;
      try { record = JSON.parse(line); } catch { continue; }
      if (binding.provider === 'claude' && ['user', 'assistant'].includes(record.type) && !record.isSidechain) {
        // Claude records the current shell directory per message; cd during a
        // session must not invalidate its original workspace association.
        if (record.sessionId !== binding.id) throw new Error('Transcript identity does not match the selected terminal');
        state.meta ??= { id: record.sessionId, cwd: record.cwd };
      } else if (record.type === 'session_meta') state.meta = record.payload;
      const message = binding.provider === 'claude' ? visibleClaudeMessage(record) : visibleMessage(record);
      if (!message || (message.id && state.ids.has(message.id))) continue;
      if (message.id) state.ids.add(message.id);
      state.messages.push(message);
      state.chars += message.text.length;
      while (state.chars > MAX_TEXT && state.messages.length > 1) {
        state.chars -= state.messages.shift().text.length;
        state.limited = true;
      }
    }
    state.offset += end;
  }
  state.size = info.size;
  state.mtime = info.mtimeMs;
  if ((state.meta?.id || state.meta?.session_id) !== binding.id || normalize(state.meta?.cwd) !== normalize(binding.cwd)) throw new Error('Transcript identity does not match the selected terminal');
  return { text: formatMessages(state.messages),
    source: binding.provider === 'claude' ? 'claude-transcript' : 'codex-transcript', limited: state.limited, messageCount: state.messages.length };
}

export async function readConversation(terminal) {
  const db = new DatabaseSync(join(profile, 'profile-state.db'), { readOnly: true });
  let binding;
  try {
    const row = db.prepare("SELECT payload FROM profile_state_documents WHERE domain = 'workspaceSession'").get();
    binding = row && transcriptBinding(JSON.parse(row.payload), terminal);
  } finally { db.close(); }
  if (!binding) return null;
  const file = await realpath(binding.path);
  const roots = binding.provider === 'claude' ? [join(homedir(), '.claude', 'projects')] : [join(homedir(), '.codex'), join(orcaHome, 'codex-runtime-home')];
  const allowed = await Promise.all(roots.map(async root => {
    const actual = await realpath(root).catch(() => null);
    if (!actual) return false;
    const rel = relative(resolve(actual), resolve(file));
    return rel && !rel.startsWith('..') && !/^[A-Za-z]:/.test(rel);
  }));
  if (!allowed.some(Boolean) || !basename(file).endsWith(`${binding.id}.jsonl`)) throw new Error('Transcript path is outside the configured provider storage');
  return readTranscript(file, binding);
}
