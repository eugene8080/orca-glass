import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { createHermesAdapter, hermesHandle, hermesBinding, mergeHermesThreads, profileTitle, hermesCatalog } from '../bridge/hermes.mjs';

const session = (id, profile = 'default', model = 'gpt-test') => ({
  target: { profile: `C:/synthetic/hermes/${profile}`, instance: 'owner-1', epoch: 3, session: id, started: 123, source: 'desktop' },
  profileName: profile, title: `Synthetic ${id}`, state: 'waiting', scope: 'live', model,
});

test('mixed models and profiles all group as Hermes; other agents remain unchanged', () => {
  const sessions = ['gpt-6', 'claude-test', 'gemini-test', 'qwen-test', 'custom', 'local'].map((m, i) => session(`s${i}`, i % 2 ? 'work' : 'personal', m));
  const codex = { handle: 'codex', agent: 'codex', workspaceId: 'orca' };
  const claude = { handle: 'claude', agent: 'claude', workspaceId: 'other' };
  const rows = mergeHermesThreads([codex, claude], sessions);
  assert.equal(rows.filter(r => r.agent === 'hermes').length, 6);
  // Each Desktop chat is its own Session group.
  assert.equal(new Set(rows.filter(r => r.agent === 'hermes').map(r => r.workspaceId)).size, 6);
  assert.ok(rows.filter(r => r.agent === 'hermes').every(r => r.hermesGroup === 'session'));
  assert.equal(rows[0], codex); assert.equal(rows[1], claude);
  assert.notEqual(hermesHandle(session('same', 'a').target), hermesHandle(session('same', 'b').target));
});

test('only exact incarnation, session and profile binding inherits Orca workspace', () => {
  const s = session('same');
  s.orca = { paneKey: 't:l', worktreeId: 'w' };
  const terminal = { handle: 'pane', agentIdentity: 'hermes', connected: true, tabId: 't', leafId: 'l', incarnationId: 'i', worktreeId: 'w' };
  const document = { terminalPtyIncarnationsByPaneKey: { 't:l': 'i' }, sleepingAgentSessionsByPaneKey: { 't:l': {
    agent: 'hermes', origin: 'live', paneKey: 't:l', worktreeId: 'w', providerSession: { key: 'session_id', id: 'same' },
  } } };
  const threads = [{ handle: 'pane', agent: 'hermes', workspaceId: 'w', workspaceName: 'Orca checkout', workspaceLabel: 'checkout' }];
  assert.equal(hermesBinding(document, terminal, [s]), s);
  const merged = mergeHermesThreads(threads, [s, s], [terminal], document);
  assert.equal(merged.length, 1); assert.equal(merged[0].workspaceId, 'w');
  assert.equal(hermesBinding(document, { ...terminal, incarnationId: 'new' }, [s]), null);
  assert.equal(hermesBinding(document, terminal, [session('same', 'different')]), null);
  const copied = { ...session('same', 'different'), orca: s.orca };
  assert.equal(hermesBinding(document, terminal, [s, copied]), null);
  const ambiguous = mergeHermesThreads(threads, [s], [terminal, { ...terminal, handle: 'another' }], document);
  assert.match(ambiguous[0].workspaceId, /^hermes-session:/);
  const changed = { ...s, target: { ...s.target, instance: 'other-owner' } };
  assert.equal(mergeHermesThreads(threads, [s, changed]).length, 0);
});

test('synthetic HTTP transport reads exact target and sends once; stale read/reply fail closed', async () => {
  const s = session('selected');
  let current = s.target, sends = 0;
  const server = createServer(async (req, res) => {
    let body = ''; for await (const part of req) body += part;
    const request = JSON.parse(body);
    if (request.action === 'list') return res.end(JSON.stringify({ sessions: [s] }));
    if (JSON.stringify(request.target) !== JSON.stringify(current)) { res.statusCode = 409; return res.end('{}'); }
    if (request.action === 'send') { sends++; assert.match(request.submissionId, /^[a-f0-9-]{36}$/); return res.end('{"accepted":true}'); }
    res.end(JSON.stringify({ messages: [{ role: 'user', text: 'Synthetic question' }, { role: 'assistant', text: 'Synthetic answer' }] }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const adapter = createHermesAdapter(async request => {
      const r = await fetch(`http://127.0.0.1:${server.address().port}`, { method: 'POST', body: JSON.stringify(request) });
      if (!r.ok) throw new Error('stale target');
      return r.json();
    }, { document: () => ({}) });
    await adapter.discover();
    const handle = hermesHandle(s.target);
    const history = await adapter.read(handle);
    assert.equal(history.source, 'hermes-transcript'); assert.match(history.text, /> Synthetic answer/);
    assert.equal(sends, 0);
    await assert.rejects(adapter.send(handle, 'draft', false), /complete confirmed/);
    await adapter.send(handle, 'Confirmed synthetic reply', true);
    assert.equal(sends, 1);
    current = { ...current, instance: 'restarted' };
    await assert.rejects(adapter.read(handle), /stale/);
    await assert.rejects(adapter.send(handle, 'must not send', true), /stale/);
    assert.equal(sends, 1);
    await assert.rejects(adapter.send('hermes:unknown', 'must not send', true), /stale/);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('slow unavailable Hermes does not stall existing Orca discovery', async () => {
  const adapter = createHermesAdapter(() => new Promise(resolve => setTimeout(() => resolve({ sessions: [] }), 150)), { listWaitMs: 10, document: () => ({}) });
  const start = Date.now();
  const rows = await adapter.merge([{ handle: 'codex', agent: 'codex' }], []);
  assert.equal(rows.length, 1); assert.ok(Date.now() - start < 100);
});

test('Python transport guards and visible-message whitelist use synthetic clients only', () => {
  const output = execFileSync('python', ['tests/hermes_client_test.py'], { encoding: 'utf8', windowsHide: true });
  assert.match(output, /Hermes helper synthetic checks passed/);
});

test('Hermes sessions group as Bots, Sessions and Scheduled jobs like Hermes Desktop', () => {
  const profiles = [
    { name: 'default', dir: 'C:/synthetic/hermes/default', title: 'Grand Master Bot', jobs: [] },
    { name: 'schedule', dir: 'C:/synthetic/hermes/schedule', title: 'Schedule Bot', jobs: [{ id: 'j1', name: 'Weekly sign-up' }, { id: 'j2', name: 'Never run job' }] },
    { name: 'writer', dir: 'C:/synthetic/hermes/writer', title: 'Writer Bot', jobs: [] },
  ];
  const at = (id, profile, source, title) => ({ ...session(id, profile), title, target: { ...session(id, profile).target, source } });
  const rows = mergeHermesThreads([], [
    at('t1', 'default', 'telegram', 'Chat one'), at('t2', 'default', 'telegram', 'Chat two'),
    at('d1', 'default', 'desktop', 'Desktop plan'),
    at('c1', 'schedule', 'cron', 'Weekly sign-up · Oct 30 00:20'), at('c2', 'schedule', 'cron', 'Unknown job run'),
  ], [], {}, profiles);
  const group = title => rows.find(r => r.title === title);
  assert.equal(group('Chat one').workspaceId, group('Chat two').workspaceId);
  assert.equal(group('Chat one').hermesGroup, 'bot');
  assert.equal(group('Chat one').workspaceLabel, 'Grand Master Bot');
  assert.equal(group('Desktop plan').hermesGroup, 'session');
  assert.equal(group('Desktop plan').workspaceLabel, 'Desktop plan');
  assert.equal(group('Desktop plan').workspaceName, 'Grand Master Bot');
  assert.equal(group('Weekly sign-up · Oct 30 00:20').hermesGroup, 'job');
  assert.equal(group('Weekly sign-up · Oct 30 00:20').workspaceLabel, 'Weekly sign-up');
  assert.equal(group('Unknown job run').hermesGroup, 'bot');          // Unmatched cron run -> its bot.
  // Catalog lists every bot and job, including ones without sessions.
  const catalog = hermesCatalog(profiles);
  assert.deepEqual(catalog.filter(c => c.hermes === 'bot').map(c => c.name), ['Grand Master Bot', 'Schedule Bot', 'Writer Bot']);
  assert.deepEqual(catalog.filter(c => c.hermes === 'job').map(c => c.name), ['Weekly sign-up', 'Never run job']);
  assert.equal(catalog.find(c => c.name === 'Weekly sign-up').id, group('Weekly sign-up · Oct 30 00:20').workspaceId);
});

test('bot names come from profile.yaml ui_meta.title, then display_name, then the profile name', () => {
  assert.equal(profileTitle('display_name: Top\nui_meta:\n    color: red\n    title: Grand Master Bot\nother: x\n', 'default'), 'Grand Master Bot');
  assert.equal(profileTitle('display_name: "Quoted Bot"\n', 'p'), 'Quoted Bot');
  assert.equal(profileTitle('model: x\n', 'writer'), 'writer');
});

test('pending Hermes questions render as numbered options after the chat', async () => {
  const { clarifyText } = await import('../bridge/hermes.mjs');
  assert.equal(clarifyText([]), '');
  assert.equal(clarifyText([{ question: 'Pin the job?', choices: ['Yes', 'No'] }]),
    '> ? Pin the job?\n  1. Yes\n  2. No\n> Answer in Telegram or Hermes Desktop for now.');
  assert.match(clarifyText([{ question: 'A?', choices: [] }, { question: 'B?', choices: ['x'] }]), /^> \? \(1\/2\) A\?\n> \? \(2\/2\) B\?\n  1\. x\n/);
});
