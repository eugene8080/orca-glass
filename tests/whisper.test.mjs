import test from 'node:test';
import assert from 'node:assert/strict';
import { whisperArgs, VAD_MODEL, transcribe, MODEL } from '../bridge/whisper.mjs';
import { whisperModelIsMultilingual } from '../bridge/platform.mjs';

test('voice-activity detection is enabled whenever the Silero model is present', () => {
  const withVad = whisperArgs(4321, true);
  assert.deepEqual(withVad.slice(-3), ['--vad', '-vm', VAD_MODEL]);
  assert.ok(withVad.includes('127.0.0.1') && withVad.includes('4321'));
  // Without the model the server still starts, with the previous arguments.
  assert.ok(!whisperArgs(4321, false).includes('--vad'));
});

test('transcription rejects unknown languages and Japanese without a multilingual model', async () => {
  const pcm = Buffer.alloc(16000);
  pcm.writeInt16LE(4000, 0);
  await assert.rejects(() => transcribe(pcm, 'fr'), /Unsupported transcription language/);
  if (whisperModelIsMultilingual(MODEL)) return;
  await assert.rejects(() => transcribe(pcm, 'ja'), /multilingual|not configured/);
});
