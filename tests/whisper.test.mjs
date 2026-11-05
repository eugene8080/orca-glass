import test from 'node:test';
import assert from 'node:assert/strict';
import { whisperArgs, VAD_MODEL } from '../bridge/whisper.mjs';

test('voice-activity detection is enabled whenever the Silero model is present', () => {
  const withVad = whisperArgs(4321, true);
  assert.deepEqual(withVad.slice(-3), ['--vad', '-vm', VAD_MODEL]);
  assert.ok(withVad.includes('127.0.0.1') && withVad.includes('4321'));
  // Without the model the server still starts, with the previous arguments.
  assert.ok(!whisperArgs(4321, false).includes('--vad'));
});
