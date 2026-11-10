# macOS setup (Orca Glass bridge)

Updated: 2026-11-10

Eugene does not have a Mac; paths below follow upstream Orca, Hermes and whisper.cpp
sources. GitHub Actions `macos-latest` jobs run `npm test`, the app build and a
`/healthz` bridge smoke test only.

## Requirements

- macOS 12+ (Apple silicon or Intel)
- Node.js 20+
- [Orca](https://github.com/stablyai/orca) with the CLI installed (`/usr/local/bin/orca` or `Orca.app` resources)
- Tailscale and `cloudflared` on PATH (same tunnel model as Windows)
- Optional: Homebrew `whisper-cpp` for voice, or `scripts/setup-voice.sh`

## Paths (sources in `bridge/platform.mjs`)

| Resource | macOS location | Source |
| --- | --- | --- |
| Orca CLI | PATH, then `/Applications/Orca.app/Contents/Resources/bin/orca` | stablyai/orca electron-builder darwin bundle |
| Orca profile DB | `~/Library/Application Support/orca/profiles/local-default` | Electron `userData` + `orca-profiles.ts` |
| Hermes home | `~/.hermes` | NousResearch/hermes-agent `paths.rs` |
| Hermes launcher | `~/.hermes/hermes-agent/.hermes/bin/hermes`, `~/.local/bin/hermes`, or PATH | hermes-agent install scripts |
| Codex / Claude / OpenClaude transcripts | `~/.codex`, `~/.claude/projects`, `~/.openclaude/projects` | upstream agent defaults |
| OpenCode | `~/.local/share/opencode/opencode.db` | XDG on all OSes |
| Cursor | `~/.cursor/chats` | Cursor default |
| Pi | `~/.pi/agent/sessions` | Pi default (Windows PcSettings trial path skipped) |
| Whisper | Homebrew `whisper-cli` / `whisper-server`, or `.local/voice/bin` | whisper.cpp releases / formula |

Override any path with the same `ORCA_*`, `WHISPER_*` and `ORCA_GLASS_*` variables as on Windows.

## First-time setup

```bash
npm ci --prefix app
npm test
npm --prefix app run build
npm run doctor
# Optional voice (English default):
bash scripts/setup-voice.sh
# Optional Japanese UI voice (multilingual model, each user downloads locally):
bash scripts/setup-voice.sh --multilingual
```

Start the bridge manually with `npm start`, or install a LaunchAgent:

```bash
bash scripts/install-macos-startup.sh install
bash scripts/install-macos-startup.sh status
```

Logs: `.local/custom-output.log`, `.local/custom-error.log`, `.local/startup.log`.

Pairing: `npm run pair` copies the code with `pbcopy` when available.

## Japanese voice (J2)

The phone app sends `lang=ja` on transcription requests when the UI language is Japanese.
The bridge accepts Japanese only when the installed Whisper model name does not contain
`.en.` (for example `ggml-base.bin` from `setup-voice.sh --multilingual`). English
installs keep `ggml-base.en.bin`.

## Verified vs not verified

| Check | Status |
| --- | --- |
| Platform unit tests (injected macOS paths on Windows CI) | Verified in CI |
| `npm test` / app build on `macos-latest` | Verified in CI |
| Bridge `/healthz` without Orca CLI | Verified in CI smoke script |
| Real Orca CLI, G2, microphone, Hermes on macOS hardware | Not verified |
| LaunchAgent KeepAlive recovery | Not verified |
| Homebrew vs downloaded whisper binaries | Not verified on hardware |

See also `docs/windows-android.md` for the Windows analogue and `docs/i18n-mac-plan.md`.
