// Upstream local transcription: G2 PCM (16 kHz mono s16le) → whisper.cpp.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveWhisperModel, whisperBinaries, whisperModelIsMultilingual } from './platform.mjs';
const localVoice = fileURLToPath(new URL('../.local/voice/', import.meta.url));
const { bin: WHISPER_BIN, server: WHISPER_SERVER } = whisperBinaries(localVoice);
export { WHISPER_BIN, WHISPER_SERVER };
export const MODEL = resolveWhisperModel(localVoice);
export const voiceAvailable = () => existsSync(WHISPER_SERVER) && existsSync(MODEL);
// Whisper invents short phrases ('you', 'Thank you.') for quiet microphone noise,
// and its no-speech probability does not flag them. Silero voice-activity
// detection skips non-speech audio before decoding; silence then yields ''.
export const VAD_MODEL = process.env.WHISPER_VAD_MODEL || join(localVoice, 'ggml-silero-v5.1.2.bin');
export const whisperArgs = (port, vad = existsSync(VAD_MODEL)) =>
  ['-m', MODEL, '--host', '127.0.0.1', '--port', String(port), '-nt', '-sns', '-ng', ...(vad ? ['--vad', '-vm', VAD_MODEL] : [])];

let worker, ready;
let busy = false;
export function stopWhisper() {
  worker?.kill();
  worker = undefined;
  ready = undefined;
}
process.once('exit', stopWhisper);

// Keep the upstream model resident, on loopback only. Never reuse an unknown service.
export function warmWhisper() {
  if (ready) return ready;
  ready = (async () => {
    if (!voiceAvailable()) throw new Error('Local speech recognition is not configured');
    const reservation = createServer();
    await new Promise((resolve, reject) => { reservation.once('error', reject); reservation.listen(0, '127.0.0.1', resolve); });
    const port = reservation.address().port;
    await new Promise(resolve => reservation.close(resolve));
    const child = spawn(WHISPER_SERVER, whisperArgs(port), { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
    worker = child;
    let failure;
    child.stderr.on('data', () => {}); // Do not log microphone transcripts.
    child.on('error', e => { failure = e; });
    child.on('exit', () => { failure ||= new Error('Local speech engine stopped'); if (worker === child) { worker = undefined; ready = undefined; } });
    const base = `http://127.0.0.1:${port}`;
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      if (failure) throw failure;
      const response = await fetch(`${base}/health`, { signal: AbortSignal.timeout(500) }).catch(() => null);
      if (response?.ok) return base;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('Local speech engine startup timed out');
  })().catch(e => { stopWhisper(); throw e; });
  return ready;
}

function wav(pcm) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(16000, 24);
  h.writeUInt32LE(32000, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

export async function transcribe(pcm, lang = 'en') {
  if (!voiceAvailable()) throw new Error('Local speech recognition is not configured');
  if (!Buffer.isBuffer(pcm) || pcm.length % 2 || pcm.length > 16000 * 2 * 90) throw new Error('Invalid microphone PCM');
  if (lang !== 'en' && lang !== 'ja') throw new Error('Unsupported transcription language');
  if (lang === 'ja' && !whisperModelIsMultilingual(MODEL)) {
    throw new Error('Japanese transcription requires a multilingual Whisper model (run setup with --multilingual or set WHISPER_MODEL)');
  }
  // Empty/tiny captures and digital silence must not produce a hallucinated reply.
  if (pcm.length < 8000) return '';
  let energy = 0;
  for (let i = 0; i < pcm.length; i += 2) energy += pcm.readInt16LE(i) ** 2;
  if (Math.sqrt(energy / (pcm.length / 2)) < 30) return '';
  if (busy) throw new Error('Speech engine is busy; try again when the current transcription finishes');
  busy = true;
  try {
    const base = await warmWhisper();
    const form = new FormData();
    form.set('file', new Blob([wav(pcm)], { type: 'audio/wav' }), 'speech.wav');
    form.set('language', lang);
    form.set('response_format', 'json');
    form.set('temperature', '0');
    const response = await fetch(`${base}/inference`, { method: 'POST', body: form, signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`Local transcription failed (${response.status})`);
    const result = await response.json();
    if (typeof result.text !== 'string') throw new Error('Invalid local transcription response');
    return result.text.trim();
  } catch (e) {
    // A timed-out native inference may still be running; discard that worker.
    if (e.name === 'TimeoutError' || e.name === 'AbortError') stopWhisper();
    throw e;
  } finally {
    busy = false;
  }
}
