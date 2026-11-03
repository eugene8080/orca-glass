// Upstream local transcription: G2 PCM (16 kHz mono s16le) → whisper.cpp.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { executable } from './platform.mjs';
const localVoice = fileURLToPath(new URL('../.local/voice/', import.meta.url));
export const WHISPER_BIN = process.env.WHISPER_BIN || executable('whisper-cli') || join(localVoice, 'bin', 'whisper-cli.exe');
// 既定は setup が置く場所。VoiceInk が同じモデルを持っていればそれを使う
const MODEL_NAME = 'ggml-large-v3-turbo-q5_0.bin';
export const MODEL =
  process.env.WHISPER_MODEL ||
  [
    join(localVoice, 'ggml-base.en.bin'),
    join(homedir(), '.cache/orca-glass', MODEL_NAME),
    join(homedir(), 'Library/Application Support/com.prakashjoshipax.VoiceInk/WhisperModels', MODEL_NAME),
  ].find(existsSync) ||
  join(homedir(), '.cache/orca-glass', MODEL_NAME);

export const WHISPER_SERVER = process.env.WHISPER_SERVER || join(dirname(WHISPER_BIN), process.platform === 'win32' ? 'whisper-server.exe' : 'whisper-server');
export const voiceAvailable = () => existsSync(WHISPER_SERVER) && existsSync(MODEL);

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
    const child = spawn(WHISPER_SERVER, ['-m', MODEL, '--host', '127.0.0.1', '--port', String(port), '-nt', '-sns', '-ng'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
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
  if (lang !== 'en') throw new Error('Unsupported transcription language');
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
