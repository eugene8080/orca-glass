# Japanese and macOS support: plan

Generated: 2026-11-10

Eugene, 2026-11-10: "can we re-enable japanese and Mac support? i realize those are
popular for G2 users. but i don't have a mac and i cannot read japanese." He chose
"Both, Japanese first". Betas upload automatically as each stage lands (CLAUDE.md
Release policy). Neither he nor the agent can verify by native reading or on a Mac,
so each stage states what was and was not verified.

## Starting point (checked 2026-11-10)

- `app/src/i18n.ts` keeps the dictionary/`t()`/`applyPage()` plumbing with English
  only; the upstream Japanese dictionary (~60 strings by the original native-speaking
  author) is in git history at 5323bb0. Most strings added since the fork are
  hard-coded English in `app/src/main.ts`, `app/src/phone.ts`, `app/index.html`,
  `app/src/reader-status.ts`, `app/src/footer-hint.ts`, `app/src/filters.ts`,
  `app/src/fine-text.ts` and bridge error messages.
- Whisper uses `ggml-base.en.bin` (English-only); `bridge/whisper.mjs` rejects any
  language but `en`. Japanese needs a multilingual model.
- Small-text bitmap fonts have no Japanese glyphs (canvas fallback only).
- Bridge: Node, Orca CLI, Whisper and Tailscale are portable; about nine spots are
  Windows-only (Task Scheduler startup, PowerShell setup, %APPDATA%/%LOCALAPPDATA%
  paths for Orca, Cursor, OpenCode, Pi, Hermes, clipboard). Upstream Mac scripts
  `scripts/doctor.sh` and `scripts/get-model.sh` remain.

## Japanese stages

1. Language setting (phone Settings: English / 日本語, saved as `lang`), Japanese
   dictionary: upstream wording where it exists (Mac -> PC), new strings translated by
   the agent and marked for native review. Move hard-coded glasses/phone strings into
   the dictionary.
2. Voice: multilingual Whisper model as a setup option; app passes the language;
   bridge accepts `ja` only when a multilingual model is installed.
3. Glasses font: confirm native Japanese rendering in the simulator; add Shinonome 12
   (public domain; 6x12 half-width + 12x12 full-width) as the small-text font for
   Japanese text.
4. Store listing / README: Japanese description, README.ja.md refresh.

Checks the user can do without reading Japanese: nothing overflows or clips, no boxes
or blank glyphs, layouts match the English ones.

## macOS stages

1. Platform layer: per-OS paths (Orca app/profile, Cursor, OpenCode, Pi, Hermes),
   clipboard, Whisper binary names.
2. Startup: launchd agent instead of Task Scheduler; shell setup instead of PowerShell.
3. CI: GitHub Actions macOS job running `npm test` and a bridge smoke test on every
   push. Real Orca/G2/microphone on a Mac remain unverified until a Mac user tries it.

## Progress

- 2026-11-10 user clarified: code and comments are not translated; the app supports
  English and Japanese; some pixel fonts must show Japanese; the language is chosen in
  the phone companion app only, not on the G2.
- J1 done (6f1061f): phone Settings English / 日本語 (saved as `lang`), 140-key `en`
  and `ja` dictionaries (49 upstream-author entries tagged `// upstream`, the rest
  agent-translated, native review pending); glasses and phone text from the dictionary.
- J3 done: Shinonome 0.9.11 (public domain, app/src/fonts/SHINONOME-LICENSE.txt).
  'Shinonome 6x12' is a small font of its own; its 12x12 Japanese table (JIS level 1
  kanji, kana, symbols: 3,489 glyphs) draws two-cell characters in every small font,
  baseline-aligned. Exact fit in 6x12, 6x13, 7x14; 11-row fonts overflow one row up,
  Scientifica one column right. Level 2 kanji fall back to the WebView font. The
  reader wraps Japanese between characters with simple kinsoku. Bundle 340 -> 535 KB
  (168 KB gzip). The glasses menu is now at the SDK's 10-item maximum.
- Not verified: native-text Japanese on the G2 (upstream used it), real Japanese text
  width in the firmware font, translation quality.
- Open: J2 (Japanese voice: multilingual Whisper), J4 (store listing / README.ja.md),
  then the macOS stages.
- 2026-11-10 user: Japanese voice model is downloaded by each Japanese user in their
  own setup (nothing downloaded on this PC); J2 code (opt-in multilingual model in the
  setup scripts, bridge accepts `ja` only with a multilingual model) is folded into
  macOS stage 2. Store listing (J4) deferred until the macOS port is finished. macOS
  stages 1-3 started the same day.
- 2026-11-10 Progress (Cursor Composer): macOS stages 1-3 landed in source. Stage 1:
  `bridge/platform.mjs` centralizes Orca/Hermes/OpenCode/Cursor/Pi/Whisper paths with
  injectable context; bridge modules and `scripts/pair.mjs` migrated; zsh/bash shell
  prompt guard in `bridge/orca.mjs`; `tests/platform.test.mjs` (158 tests total).
  Stage 2: `scripts/start-macos.sh`, `install-macos-startup.sh`, `setup-voice.sh`
  (verified ggml-base.bin sha256 `60ed5bc3…` on this PC); `-Multilingual` /
  `--multilingual` on both setup scripts; bridge accepts `lang=ja` when the model name
  has no `.en.`; `docs/macos.md` + README dual-OS setup; `scripts/doctor.mjs` voice
  check. Stage 3: `.github/workflows/test.yml` matrix windows-latest + macos-latest,
  `scripts/ci-bridge-smoke.sh` curls `/healthz`. Verified: `npm test`, app `tsc`/build
  on Windows; `bash -n` on shell scripts. Not verified: real Mac hardware, LaunchAgent,
  Homebrew whisper, J2 on G2. Open: J4 listing, native Japanese translation review,
  Mac user acceptance.
