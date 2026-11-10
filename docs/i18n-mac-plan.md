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
