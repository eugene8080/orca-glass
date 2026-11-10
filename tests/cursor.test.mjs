import test from 'node:test';
import assert from 'node:assert/strict';
import { cursorBinding, cursorMessages } from '../bridge/conversation.mjs';
import { terminalConversation, terminalModel } from '../bridge/reader-text.mjs';

// Synthetic Cursor store: a protobuf root listing message blob IDs (field 1,
// 32 bytes each) in order, JSON message blobs and one binary non-message blob.
const id = n => n.toString(16).padStart(64, '0');
const root = ids => Buffer.concat(ids.map(i => Buffer.concat([Buffer.from([0x0a, 0x20]), Buffer.from(i, 'hex')])));
const blobs = new Map([
  [id(1), Buffer.from(JSON.stringify({ role: 'system', content: 'system prompt' }))],
  [id(2), Buffer.from(JSON.stringify({ role: 'user', content: '<user_info>injected context</user_info>' }))],
  [id(3), Buffer.from(JSON.stringify({ role: 'user', content: [{ type: 'text', text: '<timestamp>t</timestamp>\n<user_query>\nPlease check the build\n</user_query>' }] }))],
  [id(4), Buffer.from(JSON.stringify({ role: 'assistant', content: [{ type: 'redacted-reasoning', data: 'x' }, { type: 'text', text: 'Checking now.' }, { type: 'tool-call', toolName: 'Shell' }] }))],
  [id(5), Buffer.from(JSON.stringify({ role: 'tool', content: [{ type: 'tool-result', output: 'secret output' }] }))],
  [id(6), Buffer.from([0x0a, 0x01, 0xff])],
  [id(7), Buffer.from(JSON.stringify({ role: 'assistant', content: [{ type: 'text', text: 'Build passes.' }] }))],
  [id(9), root([id(1), id(2), id(3), id(4), id(5), id(6), id(7)])],
]);

test('Cursor store shows only the user query and assistant text, in root order', () => {
  const messages = cursorMessages({ latestRootBlobId: id(9) }, key => blobs.get(key) || null);
  assert.deepEqual(messages, [
    { role: 'user', text: 'Please check the build' },
    { role: 'assistant', text: 'Checking now.' },
    { role: 'assistant', text: 'Build passes.' },
  ]);
});

test('Cursor binding requires the exact live pane record and a chat ID', () => {
  const terminal = { agentIdentity: 'cursor', connected: true, tabId: 't', leafId: 'l', incarnationId: 'i', worktreeId: 'w' };
  const record = { agent: 'cursor', origin: 'live', paneKey: 't:l', worktreeId: 'w', providerSession: { key: 'k', id: '7449a4fe-8ce6-406e-bf58-c6898c14cb52' } };
  const session = { sleepingAgentSessionsByPaneKey: { 't:l': record }, terminalPtyIncarnationsByPaneKey: { 't:l': 'i' } };
  assert.deepEqual(cursorBinding(session, terminal), { id: record.providerSession.id, provider: 'cursor' });
  assert.equal(cursorBinding({ ...session, terminalPtyIncarnationsByPaneKey: { 't:l': 'other' } }, terminal), null);
  assert.equal(cursorBinding(session, { ...terminal, agentIdentity: 'codex' }), null);
  assert.equal(cursorBinding({ ...session, sleepingAgentSessionsByPaneKey: { 't:l': { ...record, providerSession: { id: 'not-a-uuid' } } } }, terminal), null);
});

test('Cursor screen fallback keeps reply text and drops tools, diffs and footer', () => {
  const lines = ['  Cursor Agent', '  v2026.10.31-abc', '  I checked the config.', '    Read src/app.ts', '    Grepped "foo" in .',
    '    Edited src/parse.ts', '    ▎+ const a = 1;', '  $ npm test 12s', '    137 passing', '  • Parser trims the footer and keeps', '    wrapped bullets together',
    '  → Add a follow-up', '  Composer 2.5 Fast · 33.6% · 1 file edited             Run Everything', '  D:\dev\repo · main'];
  assert.equal(terminalConversation(lines, 'cursor'), '> I checked the config.\n  • Parser trims the footer and keeps wrapped bullets together');
  assert.equal(terminalModel(lines), 'Composer 2.5 Fast');
});

test('OpenCode 2 shows user text and assistant text parts, not reasoning, tools or compaction', async () => {
  const { opencodeMessages } = await import('../bridge/conversation.mjs');
  const row = (type, data) => ({ type, data: JSON.stringify(data) });
  const result = opencodeMessages([
    row('system', { text: 'system notice' }),
    row('user', { text: 'Fix the parser', files: [] }),
    row('assistant', { model: { id: 'qwen3.8-27b' }, content: [{ type: 'reasoning', text: 'secret thoughts' }, { type: 'tool', state: { output: 'tool output' } }] }),
    row('assistant', { model: { id: 'qwen3.8-27b' }, content: [{ type: 'text', text: 'Fixed it.' }] }),
    row('compaction', { summary: 'compacted summary' }),
    row('idle', { outcome: 'done' }),
    { type: 'assistant', data: 'not json' },
  ]);
  assert.deepEqual(result, { messages: [{ role: 'user', text: 'Fix the parser' }, { role: 'assistant', text: 'Fixed it.' }], model: 'qwen3.8-27b' });
});

test('OpenClaude panes use the Claude screen format', () => {
  assert.equal(terminalConversation(['❯ Question', '⏺ Bash(secret)', '  output', '⏺ Answer'], 'openclaude'), '/ Question\n> Answer');
});

test('Pi shows the current branch: user text and reply text, not thinking, tools or system', async () => {
  const { piMessages } = await import('../bridge/conversation.mjs');
  const entries = [
    { type: 'session', id: 'sess', cwd: 'D:/x' },
    { type: 'model_change', id: 'm', parentId: null, modelId: 'qwopus-pi-128k' },
    { type: 'message', id: 'a', parentId: 'm', message: { role: 'system', content: 'rules' } },
    { type: 'message', id: 'b', parentId: 'a', message: { role: 'user', content: [{ type: 'text', text: 'hi' }] } },
    { type: 'message', id: 'c', parentId: 'b', message: { role: 'assistant', model: 'qwopus-pi-128k', content: [{ type: 'thinking', thinking: 'private' }, { type: 'text', text: 'Hello!' }] } },
    // An abandoned branch from 'b' that the user moved away from.
    { type: 'message', id: 'd', parentId: 'b', message: { role: 'assistant', content: [{ type: 'text', text: 'Old answer' }] } },
    { type: 'message', id: 'e', parentId: 'c', message: { role: 'user', content: [{ type: 'text', text: 'list files' }] } },
    { type: 'message', id: 'f', parentId: 'e', message: { role: 'assistant', content: [{ type: 'toolCall', name: 'ls' }] } },
    { type: 'message', id: 'g', parentId: 'f', message: { role: 'toolResult', content: [{ type: 'text', text: 'secret listing' }] } },
    { type: 'message', id: 'h', parentId: 'g', message: { role: 'assistant', content: [{ type: 'text', text: 'Two files.' }] } },
  ];
  assert.deepEqual(piMessages(entries), { model: 'qwopus-pi-128k', messages: [
    { role: 'user', text: 'hi' }, { role: 'assistant', text: 'Hello!' }, { role: 'user', text: 'list files' }, { role: 'assistant', text: 'Two files.' }] });
});
