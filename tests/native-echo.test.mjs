import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createEchoServer, lastUserText } from '../bridge/native-echo.mjs';

test('native input extraction uses only the latest user message', () => {
  assert.equal(lastUserText({ messages: [{ role: 'user', content: 'old' }, { role: 'assistant', content: 'reply' }, { role: 'user', content: [{ type: 'text', text: 'latest' }] }] }), 'latest');
  assert.throws(() => lastUserText({ messages: [{ role: 'assistant', content: 'not input' }] }));
});

test('native echo authenticates and supports JSON and SSE without an agent', async t => {
  const token = 'test-only-credential-1234567890';
  const events = [];
  const server = createEchoServer(token, event => events.push(event));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  const url = `http://127.0.0.1:${server.address().port}/v1/chat/completions`;
  assert.equal((await fetch(url, { method: 'POST' })).status, 401);
  for (const stream of [false, true]) {
    const response = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ stream, messages: [{ role: 'user', content: 'Voice fixture' }] }) });
    assert.equal(response.status, 200);
    const text = await response.text();
    assert.match(text, /Voice test received: Voice fixture/);
    assert.match(text, /Nothing was sent to Codex/);
    if (stream) assert.match(text, /data: \[DONE\]/);
    else assert.equal(JSON.parse(text).object, 'chat.completion');
  }
  assert.equal(events.length, 2);
  assert.ok(events.every(event => !JSON.stringify(event).includes('Voice fixture')));
});
