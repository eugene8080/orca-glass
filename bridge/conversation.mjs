// Read-only adapter for Orca's recorded pane -> provider transcript association.
// Never infer identity from a working directory or choose the newest transcript.
import { DatabaseSync } from 'node:sqlite';
import { open, readdir, readFile, realpath, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, join, relative, resolve } from 'node:path';
import { formatMessages, modelLabel, modelName } from './reader-text.mjs';

const appData = process.env.APPDATA || join(homedir(), 'AppData', 'Roaming');
const orcaHome = join(appData, 'orca');
const profile = process.env.ORCA_GLASS_PROFILE_DIR || join(orcaHome, 'profiles', 'local-default');
const cache = new Map();
const reads = new Map();
const MAX_TEXT = 1_000_000;
// OpenClaude is a Claude Code fork: same transcript format, its own storage folder.
const CLAUDE_LIKE = new Set(['claude', 'openclaude']);
const normalize = value => String(value || '').replace(/^\\\\\?\\/, '').replaceAll('\\', '/').replace(/\/$/, '').toLowerCase();

export function transcriptBinding(session, terminal) {
  const key = `${terminal.tabId}:${terminal.leafId}`;
  const record = session.sleepingAgentSessionsByPaneKey?.[key];
  if (!['codex', 'claude', 'openclaude'].includes(terminal.agentIdentity) || !terminal.connected || terminal.orphaned ||
      (terminal.executionHostId && terminal.executionHostId !== 'local') ||
      session.terminalPtyIncarnationsByPaneKey?.[key] !== terminal.incarnationId ||
      record?.agent !== terminal.agentIdentity || record.origin !== 'live' || record.worktreeId !== terminal.worktreeId ||
      record.paneKey !== key || normalize(record.providerSession?.cwd) !== normalize(terminal.worktreePath)) return null;
  const provider = record.providerSession;
  if (!/^[a-f0-9-]{36}$/i.test(provider?.id || '') || !provider.transcriptPath) return null;
  return { id: provider.id, path: provider.transcriptPath, cwd: provider.cwd, provider: terminal.agentIdentity };
}

// Cursor's agent CLI: Orca records only the chat ID for the pane (no path or
// cwd). The same exact pane/incarnation/live-record checks apply; the chat is
// then the one store whose own metadata names that ID.
const ID_ONLY = { cursor: /^[a-f0-9-]{36}$/i, opencode: /^ses_[A-Za-z0-9]{20,40}$/, opencode2: /^ses_[A-Za-z0-9]{20,40}$/,
  pi: /^[a-f0-9-]{36}$/i };
export function cursorBinding(session, terminal) {
  const key = `${terminal.tabId}:${terminal.leafId}`;
  const record = session.sleepingAgentSessionsByPaneKey?.[key];
  const shape = ID_ONLY[terminal.agentIdentity];
  if (!shape || !terminal.connected || terminal.orphaned ||
      (terminal.executionHostId && terminal.executionHostId !== 'local') ||
      session.terminalPtyIncarnationsByPaneKey?.[key] !== terminal.incarnationId ||
      record?.agent !== terminal.agentIdentity || record.origin !== 'live' || record.worktreeId !== terminal.worktreeId ||
      record.paneKey !== key || !shape.test(record.providerSession?.id || '')) return null;
  const provider = { cursor: 'cursor', pi: 'pi' }[terminal.agentIdentity] || 'opencode';
  const path = typeof record.providerSession.transcriptPath === 'string' ? record.providerSession.transcriptPath : undefined;
  return { id: record.providerSession.id, provider, ...(path ? { path } : {}) };
}

// OpenCode 2 (opencode / opencode2 commands): one SQLite database. A session's
// conversation is session_message rows in seq order: user { text }, assistant
// { content: [{ type: 'text' | 'reasoning' | ..., text }], model: { id } }.
// Shown: user text and assistant text parts; reasoning, tools, compaction
// summaries, idle and system rows are excluded.
export function opencodeMessages(rows) {
  const messages = [];
  let model;
  for (const row of rows) {
    let data;
    try { data = JSON.parse(row.data); } catch { continue; }
    if (row.type === 'user' && typeof data?.text === 'string' && data.text.trim()) messages.push({ role: 'user', text: data.text.trim() });
    else if (row.type === 'assistant') {
      if (typeof data?.model?.id === 'string') model = data.model.id;
      const text = (Array.isArray(data?.content) ? data.content : []).filter(part => part?.type === 'text' && typeof part.text === 'string')
        .map(part => part.text).join('\n').trim();
      if (text) messages.push({ role: 'assistant', text });
    }
  }
  return { messages, model };
}

// Pi (pi-coding-agent): one JSONL file per session, '<timestamp>_<session id>.jsonl'
// under <agent dir>/sessions/<encoded cwd>/. Orca's Pi status extension reports the
// session ID (and file). The file is the one the record names, else the single file
// with exactly that ID in the known agent folders; its 'session' header must carry
// the same ID. Entries form a tree through parentId (Pi can branch a conversation):
// the current branch is the path from the last entry back to the root. Shown: user
// text and assistant text parts; thinking, tool calls/results and system text hidden.
export function piMessages(entries) {
  const byId = new Map(entries.filter(e => typeof e?.id === 'string').map(e => [e.id, e]));
  const branch = [];
  for (let e = entries.at(-1), guard = 0; e && guard < entries.length; e = byId.get(e.parentId), guard++) branch.push(e);
  branch.reverse();
  const messages = [];
  let model;
  for (const entry of branch) {
    if (entry.type === 'model_change' && typeof entry.modelId === 'string') model = entry.modelId;
    if (entry.type !== 'message') continue;
    const message = entry.message || {};
    const parts = typeof message.content === 'string' ? [{ type: 'text', text: message.content }] : Array.isArray(message.content) ? message.content : [];
    const text = parts.filter(part => part?.type === 'text' && typeof part.text === 'string').map(part => part.text).join('\n').trim();
    if (message.role === 'user' && text) messages.push({ role: 'user', text });
    else if (message.role === 'assistant') {
      if (typeof message.model === 'string') model = message.model;
      if (text) messages.push({ role: 'assistant', text });
    }
  }
  return { messages, model };
}

async function readPiSession(binding) {
  const roots = [join(homedir(), '.pi', 'agent', 'sessions'),
    join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'PcSettings', 'PiQwopusTrial', 'agent', 'sessions')];
  const suffix = `_${binding.id}.jsonl`;
  let file = binding.path && basename(binding.path).endsWith(suffix) && await stat(binding.path).then(s => s.isFile(), () => false) ? binding.path : null;
  if (!file) {
    const matches = [];
    for (const root of roots) for (const dir of await readdir(root).catch(() => [])) {
      for (const name of await readdir(join(root, dir)).catch(() => [])) if (name.endsWith(suffix)) matches.push(join(root, dir, name));
    }
    if (matches.length !== 1) return null; // missing or ambiguous: fall back to the screen
    file = matches[0];
  }
  const info = await stat(file);
  if (info.size > 64 * 1024 * 1024) throw new Error('Pi session file is too large to read');
  const entries = [];
  for (const line of (await readFile(file, 'utf8')).split('\n')) {
    if (!line.trim()) continue;
    try { entries.push(JSON.parse(line)); } catch { /* a partly written last line */ }
  }
  if (entries[0]?.type !== 'session' || entries[0].id !== binding.id) throw new Error('Pi session identity does not match the selected terminal');
  const { messages, model } = piMessages(entries);
  let kept = messages, size = 0;
  for (let i = messages.length - 1; i >= 0; i--) { size += messages[i].text.length; if (size > MAX_TEXT) { kept = messages.slice(i + 1); break; } }
  return { text: formatMessages(kept), model: modelName(model) || undefined, source: 'pi-transcript', limited: kept.length !== messages.length, messageCount: kept.length };
}

async function readOpencodeStore(binding) {
  const file = join(process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share'), 'opencode', 'opencode.db');
  if (!await stat(file).then(s => s.isFile(), () => false)) return null;
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    if (!db.prepare('SELECT 1 FROM session_v2 WHERE id = ?').get(binding.id)) return null; // unknown or older-format session: use the screen
    const { messages, model } = opencodeMessages(db.prepare('SELECT type, data FROM session_message WHERE session_id = ? ORDER BY seq').all(binding.id));
    const sessionModel = () => { try { return JSON.parse(db.prepare('SELECT model FROM session_v2 WHERE id = ?').get(binding.id)?.model || 'null')?.id; } catch { return undefined; } };
    let kept = messages, size = 0;
    for (let i = messages.length - 1; i >= 0; i--) { size += messages[i].text.length; if (size > MAX_TEXT) { kept = messages.slice(i + 1); break; } }
    return { text: formatMessages(kept), model: modelName(model ?? sessionModel()) || undefined, source: 'opencode-transcript', limited: kept.length !== messages.length, messageCount: kept.length };
  } finally { db.close(); }
}

// Cursor's store.db: a meta row (hex JSON: agentId, latestRootBlobId,
// lastUsedModel, ...) and content-addressed blobs. The root blob is protobuf;
// its repeated field 1 lists the conversation's message blob IDs in order, and
// each message blob is JSON { role, content }. Shown: the user's own query (the
// <user_query> part; context Cursor injects has none) and the assistant's text
// parts. Reasoning, tool calls, tool results and system text are excluded.
function rootMessageIds(root) {
  const ids = [];
  let at = 0;
  const varint = () => { let value = 0, shift = 0, byte; do { byte = root[at++]; value += (byte & 0x7f) * 2 ** shift; shift += 7; } while (byte & 0x80 && at < root.length); return value; };
  while (at < root.length) {
    const tag = varint(), field = Math.floor(tag / 8), wire = tag & 7;
    if (wire === 2) {
      const length = varint();
      if (field === 1 && length === 32) ids.push(root.subarray(at, at + 32).toString('hex'));
      at += length;
    } else if (wire === 0) varint();
    else if (wire === 1) at += 8;
    else if (wire === 5) at += 4;
    else break; // unknown wire type: stop rather than misread
  }
  return ids;
}

export function cursorMessages(meta, blob) {
  const messages = [];
  for (const id of rootMessageIds(blob(meta.latestRootBlobId) || Buffer.alloc(0))) {
    let record;
    try { record = JSON.parse(blob(id)?.toString('utf8') || ''); } catch { continue; } // binary blobs are not messages
    if (record?.role === 'user') {
      // Content is a string or a list of { type: 'text', text } parts.
      const content = typeof record.content === 'string' ? record.content : Array.isArray(record.content)
        ? record.content.filter(part => part?.type === 'text' && typeof part.text === 'string').map(part => part.text).join('\n') : '';
      const query = /<user_query>([\s\S]*?)<\/user_query>/.exec(content)?.[1]?.trim();
      if (query) messages.push({ role: 'user', text: query });
    } else if (record?.role === 'assistant' && Array.isArray(record.content)) {
      const text = record.content.filter(part => part?.type === 'text' && typeof part.text === 'string').map(part => part.text).join('\n').trim();
      if (text) messages.push({ role: 'assistant', text });
    }
  }
  return messages;
}

async function readCursorStore(binding) {
  const chats = join(homedir(), '.cursor', 'chats');
  const matches = [];
  for (const dir of await readdir(chats).catch(() => [])) {
    if (!/^[a-f0-9]{32}$/i.test(dir)) continue;
    const file = join(chats, dir, binding.id, 'store.db');
    if (await stat(file).then(s => s.isFile(), () => false)) matches.push(file);
  }
  if (matches.length !== 1) return null; // missing or ambiguous: fall back to the screen
  const db = new DatabaseSync(matches[0], { readOnly: true });
  try {
    const meta = JSON.parse(Buffer.from(db.prepare('SELECT value FROM meta WHERE key = ?').get('0')?.value || '', 'hex').toString('utf8'));
    if (meta.agentId !== binding.id) throw new Error('Cursor chat identity does not match the selected terminal');
    const query = db.prepare('SELECT data FROM blobs WHERE id = ?');
    const messages = cursorMessages(meta, id => { const row = query.get(id); return row ? Buffer.from(row.data) : null; });
    let kept = messages, size = 0;
    for (let i = messages.length - 1; i >= 0; i--) { size += messages[i].text.length; if (size > MAX_TEXT) { kept = messages.slice(i + 1); break; } }
    const model = modelName(meta.lastUsedModel) || undefined;
    return { text: formatMessages(kept), model, source: 'cursor-transcript', limited: kept.length !== messages.length, messageCount: kept.length };
  } finally { db.close(); }
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
    state = { offset: 0, size: 0, mtime: 0, messages: [], chars: 0, limited: false, meta: null, ids: new Set(), model: '' };
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
      if (CLAUDE_LIKE.has(binding.provider) && ['user', 'assistant'].includes(record.type) && !record.isSidechain) {
        // Claude records the current shell directory per message; cd during a
        // session must not invalidate its original workspace association.
        if (record.sessionId !== binding.id) throw new Error('Transcript identity does not match the selected terminal');
        state.meta ??= { id: record.sessionId, cwd: record.cwd };
      } else if (record.type === 'session_meta') state.meta = record.payload;
      // The latest model wins: Claude stamps each assistant message; Codex records
      // model and reasoning effort per turn. Synthetic/unknown names are skipped.
      if (CLAUDE_LIKE.has(binding.provider) && record.type === 'assistant' && !record.isSidechain) state.model = modelLabel(record.message?.model) || state.model;
      else if (record.type === 'turn_context') state.model = modelLabel(record.payload?.model, record.payload?.effort) || state.model;
      const message = CLAUDE_LIKE.has(binding.provider) ? visibleClaudeMessage(record) : visibleMessage(record);
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
  return { text: formatMessages(state.messages), model: state.model || undefined,
    source: CLAUDE_LIKE.has(binding.provider) ? 'claude-transcript' : 'codex-transcript', limited: state.limited, messageCount: state.messages.length };
}

export async function readConversation(terminal) {
  const db = new DatabaseSync(join(profile, 'profile-state.db'), { readOnly: true });
  let binding;
  try {
    const row = db.prepare("SELECT payload FROM profile_state_documents WHERE domain = 'workspaceSession'").get();
    const session = row && JSON.parse(row.payload);
    binding = session && (ID_ONLY[terminal.agentIdentity] ? cursorBinding(session, terminal) : transcriptBinding(session, terminal));
  } finally { db.close(); }
  if (!binding) return null;
  if (binding.provider === 'cursor') return readCursorStore(binding);
  if (binding.provider === 'opencode') return readOpencodeStore(binding);
  if (binding.provider === 'pi') return readPiSession(binding);
  const file = await realpath(binding.path);
  const roots = binding.provider === 'claude' ? [join(homedir(), '.claude', 'projects')]
    : binding.provider === 'openclaude' ? [join(homedir(), '.openclaude', 'projects')]
    : [join(homedir(), '.codex'), join(orcaHome, 'codex-runtime-home')];
  const allowed = await Promise.all(roots.map(async root => {
    const actual = await realpath(root).catch(() => null);
    if (!actual) return false;
    const rel = relative(resolve(actual), resolve(file));
    return rel && !rel.startsWith('..') && !/^[A-Za-z]:/.test(rel);
  }));
  if (!allowed.some(Boolean) || !basename(file).endsWith(`${binding.id}.jsonl`)) throw new Error('Transcript path is outside the configured provider storage');
  return readTranscript(file, binding);
}
