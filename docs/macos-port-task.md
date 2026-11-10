# macOS port: task brief for the implementing agent

Generated: 2026-11-10

Eugene, 2026-11-10: "mac: do 3 stages now", then "try to delegate all the work to cursor
composer or grok as i'm almost out of claude usage". This brief hands the work to a
Cursor (Composer) agent. Read first: `CLAUDE.md` (constraints, terminal policy, release
policy), `docs/i18n-mac-plan.md`, the README setup sections, `docs/windows-android.md`,
`git log --oneline -15`.

## State at handoff

- A Claude worker was stopped part-way through stage 1. Its UNCOMMITTED changes are in
  `bridge/platform.mjs` (new per-OS location helpers) and `bridge/conversation.mjs`
  (starting to use them). Review them with `git diff`; keep, fix or redo them.
- There is no Mac. GitHub Actions macOS runners are the only Mac test.

## Context

Orca Glass = an Even Realities G2 glasses app (`app/`, TypeScript) plus a Node bridge
(`bridge/*.mjs`, started by `scripts/start.mjs`) on the user's PC next to the Orca
desktop app (github.com/stablyai/orca, Electron, with an `orca` CLI). The bridge reads
agent sessions (Orca CLI + Orca's `profile-state.db`; Claude/Codex/OpenClaude
transcripts; Cursor `~/.cursor/chats`; OpenCode `opencode.db`; Pi session JSONL; Hermes
Agent via its gateway, `bridge/hermes.mjs` + `bridge/hermes-client.py`), transcribes
voice with whisper.cpp (`bridge/whisper.mjs`, whisper-server `--vad`) and is reached
over Tailscale HTTPS. The fork was made Windows-only; the upstream author ran it on a
Mac (`scripts/doctor.sh`, `scripts/get-model.sh` survive; older git history shows the
old Mac setup).

## Stage 1: platform layer

One module (`bridge/platform.mjs`) resolves per-OS locations; replace the scattered
APPDATA / LOCALAPPDATA / `.exe` uses in `bridge/conversation.mjs`, `bridge/hermes.mjs`,
`bridge/usage.mjs`, `bridge/usage-worker.mjs`, `bridge/whisper.mjs`, `scripts/pair*.mjs`.

- Orca CLI: PATH first; Windows `%LOCALAPPDATA%/Programs/orca/resources/bin/orca.exe`;
  macOS `/Applications/Orca.app/Contents/Resources/bin/orca`, then `~/Applications/...`.
- Orca profile dir: Windows `%APPDATA%/orca/profiles/local-default`; macOS Electron
  userData `~/Library/Application Support/<name>/profiles/local-default` - confirm
  `<name>` from the Orca source (electron-builder productName / app.setPath).
- Hermes home and launcher: Windows `%LOCALAPPDATA%/hermes`, `bin/hermes.exe`; macOS from
  NousResearch hermes-agent docs/source (e.g. `~/.hermes`, `hermes` on PATH).
- OpenCode: XDG `~/.local/share/opencode` on both. Cursor `~/.cursor`. Pi `~/.pi`.
- Whisper: no `.exe` on macOS; Homebrew `whisper-cpp` gives `whisper-cli`,
  `whisper-server` on PATH. Clipboard: `clip.exe` / `pbcopy`.
- Keep Windows behaviour and every env-var override exactly as now. Machine-specific
  extras (PcSettings PiQwopusTrial sessions root; PcSettings AiRouting `route.json` in
  `usage-worker.mjs`) stay Windows-only and are skipped cleanly when absent.
- Path normalisation that assumes backslashes must work with POSIX paths. The shell
  prompt check in `bridge/orca.mjs` (~line 180, `PS ...>` / `C:\...>`) must also know
  zsh/bash prompts (`user@host dir %`, `$`).
- Unit tests that inject platform/env/homedir (not `process.platform`), so Windows CI
  checks the macOS paths too.

## Stage 2: macOS startup and setup, plus Japanese voice

- Shell equivalents of `scripts/start-windows.ps1`, `scripts/install-windows-startup.ps1`,
  `scripts/setup-voice.ps1`: `scripts/start-macos.sh`, `scripts/install-macos-startup.sh`
  (launchd LaunchAgent in `~/Library/LaunchAgents`, RunAtLoad + KeepAlive, logs in
  `.local/`, install / uninstall / status), `scripts/setup-voice.sh` (Homebrew or download
  with sha256 check, plus the Silero VAD model). Mirror what the `.ps1` files do.
- `npm run doctor` works on macOS. `pwsh`-only npm scripts must not break `npm test`.
- `docs/macos.md`: Mac setup steps, sources for each path, verified vs not verified.
  README setup covers both OSes.
- Japanese voice (stage J2): each Japanese user downloads a multilingual Whisper model
  in their own setup - never on this PC. Opt-in `-Multilingual` / `--multilingual` in both
  setup scripts (choose ggml-base.bin or large-v3-turbo-q5_0, justify, verify the Hugging
  Face sha256). `bridge/whisper.mjs` rejects any language but `en` today: accept `ja` only
  when the model is multilingual (no `.en` in the name), else a clear error. The app sends
  its UI language (`getLang()` in `app/src/i18n.ts`) with transcription requests.

## Stage 3: CI

`.github/workflows/test.yml`, on push and pull_request, matrix `windows-latest` and
`macos-latest`, Node 20+, Python 3: install (check lockfiles in root and `app/`),
`npm test`, `npm --prefix app run build`; on macOS a bridge smoke test - start the bridge
with fixture config (see `scripts/simulator-fixture.mjs`, tests that start
`bridge/server.mjs`), curl `/healthz`, stop it. Without an Orca CLI the bridge must start
and answer healthz; if it does not, make it degrade gracefully.

## Rules

- `npm test`, `cd app && npx tsc --noEmit -p .` and `npm --prefix app run build` pass on
  this Windows PC; `bash -n` on every shell script.
- Do NOT restart the production bridge, upload betas, launch agents or send input to live
  sessions. Do not translate code comments. Touch only files this task needs.
- Commit in logical commits (platform; macOS setup + Japanese voice; CI) once checks pass.
  Stage explicit paths only (never `git add -A` / `.` / `-u`, never `git commit -a`). Each
  message ends with `Agent: Cursor <model>` (e.g. `Agent: Cursor Composer 2.5`). Then
  `git push` to `origin windows-android-codex` and check the GitHub Actions run
  (`gh run list`, `gh run view --log-failed`); fix until both OSes pass.
- Bash heredocs mangle backslashes on this PC: edit files with the editor, not heredocs.
  Use `python`, not `python3`.
- Finish by appending a dated "Progress" entry to `docs/i18n-mac-plan.md` and updating the
  macOS row in `TODOS.md`: commits, paths chosen with sources, verified vs not, open items.
