import test from 'node:test';
import assert from 'node:assert/strict';
import { createNativeRouter } from '../bridge/native-router.mjs';

function fixture() {
  const sent = [];
  const terminal = { agentIdentity: 'codex', connected: true, writable: true, orphaned: false, incarnationId: 'run-1' };
  let snapshot = { text: 'Previous answer', inputReady: true };
  const io = {
    listThreads: async () => [{ handle: 'terminal-1', title: 'Example Codex' }],
    inspect: async () => terminal,
    readThread: async () => snapshot,
    sendToThread: async (handle, text, enter) => { sent.push({ handle, text, enter }); },
    waitMs: 0,
  };
  return { io, sent, terminal, setSnapshot: value => { snapshot = value; }, respond: createNativeRouter(io) };
}

test('native voice requires explicit selection and routes text once to that existing terminal', async () => {
  const f = fixture();
  assert.match(await f.respond('hello'), /list sessions/);
  assert.equal(f.sent.length, 0);
  await f.respond('List sessions.');
  assert.match(await f.respond('Select session one.'), /Selected Example Codex/);
  assert.match(await f.respond('Explain the change'), /Sent to Example Codex/);
  await f.respond('Explain the change');
  assert.deepEqual(f.sent, [{ handle: 'terminal-1', text: 'Explain the change', enter: true }]);
});

test('native voice rejects changed, non-Codex, and disconnected targets', async () => {
  for (const change of [{ incarnationId: 'other-run' }, { agentIdentity: 'claude' }, { connected: false }]) {
    const f = fixture();
    await f.respond('list sessions'); await f.respond('select session 1');
    Object.assign(f.terminal, change);
    assert.match(await f.respond('Do work'), /changed or disconnected/);
    assert.equal(f.sent.length, 0);
  }
});

test('native voice does not type ordinary speech into a numbered approval prompt', async () => {
  const f = fixture();
  await f.respond('list sessions'); await f.respond('select session 1');
  f.setSnapshot({ text: '', menu: { question: 'Allow?', options: [{ value: '1', label: 'Yes' }, { value: '2', label: 'No' }] } });
  assert.match(await f.respond('Yes'), /Use Orca Glass or the desktop/);
  assert.equal(f.sent.length, 0);
});

test('uncertain native sends are not retried and read latest remains read-only', async () => {
  const f = fixture();
  let attempts = 0;
  f.io.sendToThread = async () => { attempts++; throw new Error('transport lost'); };
  await f.respond('list sessions'); await f.respond('select session 1');
  assert.match(await f.respond('Do work'), /uncertain/);
  await f.respond('Do work');
  assert.equal(attempts, 1);
  assert.equal(await f.respond('read latest'), 'Previous answer');
});

test('native voice returns new output without claiming the turn is complete', async () => {
  const f = fixture();
  let clock = 0;
  const respond = createNativeRouter({ ...f.io, waitMs: 5000, now: () => clock, sleep: async ms => { clock += ms; f.setSnapshot({ text: 'New response' }); } });
  await respond('list sessions'); await respond('select session 1');
  assert.match(await respond('Explain'), /Latest from Example Codex:\nNew response/);
});

test('a stale Codex identity at a shell never receives voice input', async () => {
  const f = fixture();
  await f.respond('list sessions'); await f.respond('select session 1');
  f.setSnapshot({ text: 'PS D:/dev>', inputReady: false });
  assert.match(await f.respond('Do work'), /Nothing sent/);
  assert.equal(f.sent.length, 0);
});
