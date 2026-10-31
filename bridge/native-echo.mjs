// Native Even AI compatibility probe. Deliberately has no Orca or LLM imports.
import { createServer } from 'node:http';
import { randomUUID, timingSafeEqual } from 'node:crypto';

export function lastUserText(body) {
  if (!Array.isArray(body?.messages)) throw new Error('messages must be an array');
  const message = body.messages.findLast(m => m?.role === 'user');
  const content = message?.content;
  const text = typeof content === 'string' ? content : Array.isArray(content)
    ? content.filter(p => p?.type === 'text' && typeof p.text === 'string').map(p => p.text).join('\n') : '';
  if (!text.trim() || text.length > 4000) throw new Error('Expected a user message of 1–4000 characters');
  return text.trim();
}

export function createEchoServer(token, report = () => {}, respond = null) {
  if (!token || token.length < 24) throw new Error('A strong echo-only token is required');
  const json = (res, status, body) => {
    res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify(body));
  };
  return createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/healthz') return json(res, 200, { ok: true, mode: respond ? 'codex-router' : 'echo-only' });
    if (req.method !== 'POST' || req.url?.split('?')[0] !== '/v1/chat/completions') return json(res, 404, { error: 'not found' });
    const got = Buffer.from(req.headers.authorization?.replace(/^Bearer /i, '') || '');
    const want = Buffer.from(token);
    if (got.length !== want.length || !timingSafeEqual(got, want)) return json(res, 401, { error: 'unauthorized' });
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 65536) return json(res, 413, { error: 'request too large' });
        chunks.push(chunk);
      }
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const text = lastUserText(body);
      const content = respond ? await respond(text) : `Voice test received: ${text.slice(0, 240)}. Nothing was sent to Codex.`;
      const base = { id: `chatcmpl-${randomUUID()}`, created: Math.floor(Date.now() / 1000), model: respond ? 'orca-codex' : 'orca-voice-echo' };
      // Store only protocol metadata, never the spoken sentence or credentials.
      report({ at: new Date().toISOString(), stream: body.stream === true, messageCount: body.messages.length, characters: text.length });
      if (body.stream === true) {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', 'x-accel-buffering': 'no' });
        const chunk = (delta, finish_reason) => `data: ${JSON.stringify({ ...base, object: 'chat.completion.chunk', choices: [{ index: 0, delta, finish_reason }] })}\n\n`;
        res.write(chunk({ role: 'assistant', content }, null));
        res.write(chunk({}, 'stop'));
        res.end('data: [DONE]\n\n');
      } else {
        json(res, 200, { ...base, object: 'chat.completion', choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }] });
      }
    } catch {
      if (!res.headersSent) json(res, 400, { error: 'Invalid chat-completions request' });
    }
  });
}
