import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, appendFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { transcriptBinding, readTranscript, visibleMessage, visibleClaudeMessage } from '../bridge/conversation.mjs';

const binding = { id: '01a187f8-bcde-7550-9ff0-f9ecc8c16ede', cwd: 'D:/dev/example', path: 'example.jsonl' };
const terminal = { tabId: 'tab', leafId: 'leaf', incarnationId: 'incarnation', worktreeId: 'workspace', worktreePath: binding.cwd, connected: true, agentIdentity: 'codex', executionHostId: 'local' };
const session = { terminalPtyIncarnationsByPaneKey: { 'tab:leaf': 'incarnation' }, sleepingAgentSessionsByPaneKey: {
  'tab:leaf': { paneKey: 'tab:leaf', worktreeId: 'workspace', agent: 'codex', origin: 'live', providerSession: { ...binding, transcriptPath: binding.path } },
} };
const message = (role, text, phase) => ({ type: 'response_item', payload: { type: 'message', role, phase, content: [{ type: 'input_text', text }] } });

test('history requires exact pane, incarnation, provider and workspace association', () => {
  assert.equal(transcriptBinding(session, terminal).id, binding.id);
  for (const change of [{ incarnationId: 'new' }, { leafId: 'other' }, { agentIdentity: 'claude' }, { connected: false }, { worktreePath: 'D:/other' }, { executionHostId: 'remote' }]) {
    assert.equal(transcriptBinding(session, { ...terminal, ...change }), null);
  }
});

test('reader extracts conversation text without instructions, tools or internal reasoning', () => {
  assert.equal(visibleMessage(message('assistant', 'Private reasoning', 'analysis')), null);
  assert.equal(visibleMessage(message('developer', 'Instructions')), null);
  assert.equal(visibleMessage(message('user', '# AGENTS.md instructions for example')), null);
  assert.equal(visibleMessage({ type: 'response_item', payload: { type: 'function_call_output', output: 'Secret tool output' } }), null);
  assert.equal(visibleMessage(message('assistant', 'Visible answer', 'final_answer')).text, 'Visible answer');
});

test('saved history survives compaction, incremental partial writes and concurrent reads', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'orca-history-test-'));
  const path = join(dir, 'session.jsonl');
  try {
    const records = [{ type: 'session_meta', payload: { id: binding.id, cwd: binding.cwd } }, message('user', 'Old question'), message('assistant', 'Old answer', 'final_answer'), { type: 'compacted', payload: { message: 'Internal summary', replacement_history: [message('user', 'Old question')] } }];
    await writeFile(path, records.map(r => JSON.stringify(r)).join('\n') + '\n');
    const initial = await readTranscript(path, binding);
    assert.equal(initial.messageCount, 2);
    assert.equal(initial.text, '/ Old question\n> Old answer');
    const next = JSON.stringify(message('user', 'New question'));
    await appendFile(path, next.slice(0, 30));
    assert.equal((await readTranscript(path, binding)).messageCount, 2);
    await appendFile(path, next.slice(30) + '\n');
    const results = await Promise.all([readTranscript(path, binding), readTranscript(path, binding)]);
    assert.ok(results.every(r => r.messageCount === 3 && r.text.endsWith('New question')));
    await assert.rejects(readTranscript(path, { ...binding, id: 'wrong' }), /identity/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});


test('Claude saved history requires the same exact live pane association', () => {
  const claude = structuredClone(session);
  claude.sleepingAgentSessionsByPaneKey['tab:leaf'].agent = 'claude';
  assert.equal(transcriptBinding(claude, { ...terminal, agentIdentity: 'claude' }).provider, 'claude');
  assert.equal(transcriptBinding(claude, terminal), null);
  assert.equal(transcriptBinding(claude, { ...terminal, agentIdentity: 'claude', incarnationId: 'replaced' }), null);
});

test('Claude saved chat remains available during tools and excludes internal blocks', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'orca-claude-history-'));
  const path = join(dir, 'session.jsonl');
  const b = { ...binding, provider: 'claude' };
  const row = (type, content, uuid, extra = {}) => ({ type, sessionId: b.id, cwd: b.cwd, uuid, message: { role: type, content }, ...extra });
  try {
    const records = [row('user', 'Original question', 'u1'),
      row('assistant', [{ type: 'thinking', thinking: 'Private' }, { type: 'text', text: 'Earlier reply' }], 'a1'),
      row('assistant', [{ type: 'tool_use', name: 'Read', input: {} }], 'a2'),
      row('user', [{ type: 'tool_result', content: 'Private tool output' }], 'u2'),
      row('user', 'Internal reminder', 'u3', { isMeta: true }),
      row('assistant', [{ type: 'text', text: 'Child agent' }], 'a3', { isSidechain: true })];
    await writeFile(path, records.map(r => JSON.stringify(r)).join('\n') + '\n');
    const first = await readTranscript(path, b);
    assert.equal(first.source, 'claude-transcript');
    assert.equal(first.text, '/ Original question\n> Earlier reply');
    assert.equal(first.messageCount, 2);
    const next = JSON.stringify(row('assistant', [{ type: 'text', text: 'Final reply' }], 'a4', { cwd: 'D:/dev/example/subfolder' }));
    await appendFile(path, next.slice(0, 20));
    assert.equal((await readTranscript(path, b)).text, first.text);
    await appendFile(path, next.slice(20) + '\n' + next + '\n');
    assert.equal((await readTranscript(path, b)).text, first.text + '\n> Final reply');
    await assert.rejects(readTranscript(path, { ...b, cwd: 'D:/wrong' }), /identity/);
    assert.equal(visibleClaudeMessage(row('user', '<task-notification>worker</task-notification>', 'u4')), null);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
