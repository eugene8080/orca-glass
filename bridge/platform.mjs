// Per-OS locations for everything the bridge reads or runs on this computer.
// Every resolver takes an optional context { platform, env, home, exists } so tests
// can check Windows and macOS answers on either OS. Without a context the live
// process values are used. Environment-variable overrides always win.
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, posix, win32 } from 'node:path';

// Why path.win32/path.posix instead of path.join: a Windows answer computed on a
// macOS CI runner (or the reverse) must use that OS's separators. On the live OS
// these are the same functions node:path exports, so results are byte-identical.
export function platformContext(overrides = {}) {
  const platform = overrides.platform ?? process.platform;
  return {
    platform,
    env: overrides.env ?? process.env,
    home: overrides.home ?? homedir(),
    exists: overrides.exists ?? existsSync,
    path: platform === 'win32' ? win32 : posix,
  };
}

const ctxOf = context => (context?.path ? context : platformContext(context));

export function executable(name, context) {
  const { platform, env, exists, path } = ctxOf(context);
  const extensions = platform === 'win32' ? ['', '.exe', '.cmd', '.bat'] : [''];
  for (const dir of (env.PATH || '').split(path.delimiter)) {
    for (const ext of extensions) {
      const candidate = path.join(dir.replace(/^"|"$/g, ''), name + ext);
      if (exists(candidate)) return candidate;
    }
  }
  return null;
}

// macOS launchd agents start with PATH=/usr/bin:/bin:/usr/sbin:/sbin, so Homebrew
// (Apple silicon /opt/homebrew, Intel /usr/local) is searched explicitly as well.
const MAC_TOOL_DIRS = ['/opt/homebrew/bin', '/usr/local/bin'];
function macTool(name, context) {
  const ctx = ctxOf(context);
  return executable(name, ctx) || MAC_TOOL_DIRS.map(dir => ctx.path.join(dir, name)).find(file => ctx.exists(file)) || null;
}

// Orca CLI. Windows: the per-user installer's resources\bin\orca.exe.
// macOS: electron-builder copies resources/darwin/bin/orca to
// Orca.app/Contents/Resources/bin/orca, and Orca's "Install CLI" command links it
// to /usr/local/bin/orca (stablyai/orca config/electron-builder.config.cjs and
// src/main/cli/cli-install-constants.ts). PATH is searched first on macOS.
export function orcaExecutable(context) {
  const ctx = ctxOf(context);
  const { platform, env, home, exists, path } = ctx;
  if (env.ORCA_BIN) return env.ORCA_BIN;
  if (env.ORCA_CLI_COMMAND) return env.ORCA_CLI_COMMAND;
  if (env.ORCA_DEV_REPO_ROOT) return 'orca-dev';
  if (platform === 'win32' && env.LOCALAPPDATA) {
    const installed = path.join(env.LOCALAPPDATA, 'Programs', 'orca', 'resources', 'bin', 'orca.exe');
    if (exists(installed)) return installed;
  }
  if (platform === 'darwin') {
    const found = macTool('orca', ctx) || [
      '/Applications/Orca.app/Contents/Resources/bin/orca',
      path.join(home, 'Applications', 'Orca.app', 'Contents', 'Resources', 'bin', 'orca'),
    ].find(file => exists(file));
    if (found) return found;
  }
  return 'orca';
}

// Orca's Electron userData folder. Electron resolves it as appData/<app name>
// before Orca renames the app to 'Orca' (package.json name is 'orca'; see
// src/main/startup/windows-app-data-path.ts and
// src/main/persistence/loading-store/user-data-path.ts in stablyai/orca).
// Windows %APPDATA%\orca is verified on this PC; macOS ~/Library/Application
// Support/orca follows from the same rule and is not verified on a Mac.
export function orcaUserDataDir(context) {
  const { platform, env, home, path } = ctxOf(context);
  if (platform === 'win32') return path.join(env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'orca');
  if (platform === 'darwin') return path.join(home, 'Library', 'Application Support', 'orca');
  return path.join(env.XDG_CONFIG_HOME || path.join(home, '.config'), 'orca');
}

// The local Orca profile (src/shared/orca-profiles.ts: DEFAULT_LOCAL_ORCA_PROFILE_ID).
export function orcaProfileDir(context) {
  const ctx = ctxOf(context);
  return ctx.env.ORCA_GLASS_PROFILE_DIR || ctx.path.join(orcaUserDataDir(ctx), 'profiles', 'local-default');
}

// Hermes Agent home. NousResearch/hermes-agent
// apps/bootstrap-installer/src-tauri/src/paths.rs: Windows %LOCALAPPDATA%\hermes,
// macOS and Linux ~/.hermes.
export function hermesHome(context) {
  const { platform, env, home, path } = ctxOf(context);
  if (env.ORCA_GLASS_HERMES_HOME) return env.ORCA_GLASS_HERMES_HOME;
  if (platform === 'win32') return path.join(env.LOCALAPPDATA || path.join(home, 'AppData', 'Local'), 'hermes');
  return path.join(home, '.hermes');
}

// The installed Hermes launcher; it must answer --print-runtime-command.
// Windows: <home>\bin\hermes.exe (verified on this PC). macOS/Linux:
// scripts/install.sh checks out to <home>/hermes-agent and mints
// <checkout>/.hermes/bin/hermes; ~/.local/bin/hermes is a shell forwarder to it
// (hermes_cli/_launchers.py _publish_conveniences). Not verified on a Mac.
export function hermesLauncher(root = hermesHome(), context) {
  const ctx = ctxOf(context);
  const { platform, env, home, exists, path } = ctx;
  if (env.ORCA_GLASS_HERMES_CLI) return env.ORCA_GLASS_HERMES_CLI;
  if (platform === 'win32') return path.join(root, 'bin', 'hermes.exe');
  const checkout = path.join(root, 'hermes-agent', '.hermes', 'bin', 'hermes');
  return [checkout, path.join(home, '.local', 'bin', 'hermes')].find(file => exists(file)) || executable('hermes', ctx) || checkout;
}

// Pi coding agent sessions. The PcSettings trial root is one Windows machine's
// own launcher layout; it is never consulted on another OS.
export function piSessionRoots(context) {
  const { platform, env, home, path } = ctxOf(context);
  const roots = [path.join(home, '.pi', 'agent', 'sessions')];
  if (platform === 'win32') roots.push(path.join(env.LOCALAPPDATA || path.join(home, 'AppData', 'Local'), 'PcSettings', 'PiQwopusTrial', 'agent', 'sessions'));
  return roots;
}

// OpenCode follows XDG on every OS, including macOS and Windows.
export function opencodeDatabase(context) {
  const { env, home, path } = ctxOf(context);
  return path.join(env.XDG_DATA_HOME || path.join(home, '.local', 'share'), 'opencode', 'opencode.db');
}

export function cursorChatsDir(context) {
  const { home, path } = ctxOf(context);
  return path.join(home, '.cursor', 'chats');
}

// Folders a recorded transcript path must resolve inside, per provider.
export function transcriptRoots(provider, context) {
  const ctx = ctxOf(context);
  const { home, path } = ctx;
  if (provider === 'claude') return [path.join(home, '.claude', 'projects')];
  if (provider === 'openclaude') return [path.join(home, '.openclaude', 'projects')];
  return [path.join(home, '.codex'), path.join(orcaUserDataDir(ctx), 'codex-runtime-home')];
}

// whisper.cpp. Windows: setup-voice.ps1 unpacks the release into .local/voice/bin.
// macOS: Homebrew's whisper-cpp formula installs whisper-cli and whisper-server.
export function whisperBinaries(localVoice, context) {
  const ctx = ctxOf(context);
  const { platform, env, path } = ctx;
  const exe = platform === 'win32' ? '.exe' : '';
  const bin = env.WHISPER_BIN || (platform === 'darwin' ? macTool('whisper-cli', ctx) : executable('whisper-cli', ctx)) ||
    path.join(localVoice, 'bin', `whisper-cli${exe}`);
  const server = env.WHISPER_SERVER || path.join(path.dirname(bin), `whisper-server${exe}`);
  return { bin, server };
}

// Clipboard writer for the pairing code; null means print it instead.
export function clipboardCommand(context) {
  const { platform } = ctxOf(context);
  if (platform === 'win32') return 'clip.exe';
  if (platform === 'darwin') return 'pbcopy';
  return null;
}

// PSCAP11's own AI routing file (pc-settings). Windows-only; null elsewhere, and
// callers treat null as "no proxy route configured".
export function aiRouteFile(context) {
  const { platform, env, path } = ctxOf(context);
  if (platform !== 'win32' || !env.LOCALAPPDATA) return null;
  return path.join(env.LOCALAPPDATA, 'PcSettings', 'AiRouting', 'route.json');
}

const LARGE_TURBO = 'ggml-large-v3-turbo-q5_0.bin';

export function whisperModelIsMultilingual(modelPath) {
  const name = basename(String(modelPath || '')).toLowerCase();
  return Boolean(name) && !/\.en\./.test(name);
}

export function whisperModelCandidates(localVoiceDir, context) {
  const { env, home, path } = ctxOf(context);
  return [
    env.WHISPER_MODEL,
    path.join(localVoiceDir, 'ggml-base.en.bin'),
    path.join(localVoiceDir, 'ggml-base.bin'),
    path.join(localVoiceDir, LARGE_TURBO),
    path.join(home, '.cache/orca-glass', LARGE_TURBO),
    path.join(home, 'Library', 'Application Support', 'com.prakashjoshipax.VoiceInk', 'WhisperModels', LARGE_TURBO),
  ].filter(Boolean);
}

export function resolveWhisperModel(localVoiceDir, context) {
  const ctx = ctxOf(context);
  const candidates = whisperModelCandidates(localVoiceDir, ctx);
  const found = candidates.find(file => ctx.exists(file));
  if (found) return found;
  return candidates[0] || ctx.path.join(localVoiceDir, 'ggml-base.en.bin');
}
