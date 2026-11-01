import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, appendFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { transcriptBinding, readTranscript, visibleMessage } from '../bridge/conversation.mjs';

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
    assert.equal(initial.text, 'You\nOld question\n\nCodex\nOld answer');
    const next = JSON.stringify(message('user', 'New question'));
    await appendFile(path, next.slice(0, 30));
    assert.equal((await readTranscript(path, binding)).messageCount, 2);
    await appendFile(path, next.slice(30) + '\n');
    const results = await Promise.all([readTranscript(path, binding), readTranscript(path, binding)]);
    assert.ok(results.every(r => r.messageCount === 3 && r.text.endsWith('New question')));
    await assert.rejects(readTranscript(path, { ...binding, id: 'wrong' }), /identity/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
