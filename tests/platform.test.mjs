import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aiRouteFile, clipboardCommand, cursorChatsDir, hermesHome, hermesLauncher,
  opencodeDatabase, orcaExecutable, orcaProfileDir, orcaUserDataDir, piSessionRoots,
  resolveWhisperModel, transcriptRoots, whisperModelIsMultilingual, whisperModelCandidates,
} from '../bridge/platform.mjs';
import { looksLikeShellPrompt } from '../bridge/orca.mjs';

const win = { platform: 'win32', home: 'C:\\Users\\eugen', env: { APPDATA: 'C:\\Users\\eugen\\AppData\\Roaming', LOCALAPPDATA: 'C:\\Users\\eugen\\AppData\\Local', PATH: 'C:\\bin' }, exists: () => false };
const mac = { platform: 'darwin', home: '/Users/eugen', env: { PATH: '/usr/bin' }, exists: () => false };

test('Orca CLI and profile paths follow each OS layout', () => {
  const orcaExe = 'C:\\Users\\eugen\\AppData\\Local\\Programs\\orca\\resources\\bin\\orca.exe';
  assert.equal(orcaExecutable({ ...win, exists: () => true }), orcaExe);
  assert.equal(orcaExecutable(win), 'orca');
  assert.equal(orcaExecutable({ ...win, env: { ...win.env, ORCA_BIN: '/custom/orca' } }), '/custom/orca');
  assert.equal(orcaExecutable(mac), 'orca');
  assert.equal(orcaExecutable({ ...mac, exists: p => p === '/Applications/Orca.app/Contents/Resources/bin/orca' }), '/Applications/Orca.app/Contents/Resources/bin/orca');
  assert.equal(orcaUserDataDir(win), 'C:\\Users\\eugen\\AppData\\Roaming\\orca');
  assert.equal(orcaUserDataDir(mac), '/Users/eugen/Library/Application Support/orca');
  assert.equal(orcaProfileDir({ ...win, env: { ...win.env, ORCA_GLASS_PROFILE_DIR: 'D:\\profile' } }), 'D:\\profile');
  assert.equal(orcaProfileDir(win), 'C:\\Users\\eugen\\AppData\\Roaming\\orca\\profiles\\local-default');
  assert.equal(orcaProfileDir(mac), '/Users/eugen/Library/Application Support/orca/profiles/local-default');
});

test('Hermes, Pi, OpenCode and Cursor locations', () => {
  assert.equal(hermesHome(win), 'C:\\Users\\eugen\\AppData\\Local\\hermes');
  assert.equal(hermesHome(mac), '/Users/eugen/.hermes');
  assert.equal(hermesLauncher('C:\\Users\\eugen\\AppData\\Local\\hermes', win), 'C:\\Users\\eugen\\AppData\\Local\\hermes\\bin\\hermes.exe');
  assert.equal(
    hermesLauncher('/Users/eugen/.hermes', { ...mac, exists: p => p === '/Users/eugen/.local/bin/hermes' }),
    '/Users/eugen/.local/bin/hermes',
  );
  assert.deepEqual(piSessionRoots(mac), ['/Users/eugen/.pi/agent/sessions']);
  assert.equal(piSessionRoots(win).length, 2);
  assert.ok(piSessionRoots(win)[1].includes('PiQwopusTrial'));
  assert.equal(opencodeDatabase(mac), '/Users/eugen/.local/share/opencode/opencode.db');
  assert.equal(cursorChatsDir(mac), '/Users/eugen/.cursor/chats');
});

test('transcript roots and Windows-only routing', () => {
  assert.equal(transcriptRoots('claude', mac)[0], '/Users/eugen/.claude/projects');
  assert.equal(transcriptRoots('openclaude', mac)[0], '/Users/eugen/.openclaude/projects');
  assert.deepEqual(transcriptRoots('codex', win), ['C:\\Users\\eugen\\.codex', 'C:\\Users\\eugen\\AppData\\Roaming\\orca\\codex-runtime-home']);
  assert.equal(aiRouteFile(win), 'C:\\Users\\eugen\\AppData\\Local\\PcSettings\\AiRouting\\route.json');
  assert.equal(aiRouteFile(mac), null);
  assert.equal(clipboardCommand(win), 'clip.exe');
  assert.equal(clipboardCommand(mac), 'pbcopy');
});

test('whisper model helpers distinguish English-only and multilingual files', () => {
  assert.equal(whisperModelIsMultilingual('.local/voice/ggml-base.en.bin'), false);
  assert.equal(whisperModelIsMultilingual('.local/voice/ggml-base.bin'), true);
  const local = '/repo/.local/voice';
  const exists = f => f.endsWith('ggml-base.bin');
  assert.equal(resolveWhisperModel(local, { ...mac, exists }), '/repo/.local/voice/ggml-base.bin');
  const candidates = whisperModelCandidates(local, mac);
  assert.ok(candidates[0].includes('ggml-base.en.bin'));
});

test('shell prompt detection covers PowerShell, cmd, zsh and bash', () => {
  assert.ok(looksLikeShellPrompt('PS D:\\dev\\orca-glass>'));
  assert.ok(looksLikeShellPrompt('C:\\Users\\eugen>'));
  assert.ok(looksLikeShellPrompt('eugen@macbook orca-glass %'));
  assert.ok(looksLikeShellPrompt('$'));
  assert.ok(!looksLikeShellPrompt(' › Working on task'));
});
