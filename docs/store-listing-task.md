# Even Hub store listing refresh: task brief

Generated: 2026-11-10

Eugene, 2026-11-10: "now I need to update the even hub description and images ... I will
upload the images myself." Handed to a Cursor agent to save Claude usage. The agent writes
the text and produces the image files; Eugene pastes the description and uploads the images
in the Even Hub portal himself. The agent does NOT open, edit or submit anything in the
portal or any browser.

Read first: `CLAUDE.md` (constraints, terminal policy, release policy, Current work),
`store/listing.md` (how the last set was made, sizes, rules), `store/description.txt`,
`README.md`, `docs/i18n-mac-plan.md`, `docs/macos.md`, `git log --oneline -40`.

## 1. Description

Rewrite `store/description.txt` for the current beta (1.0.49+), within the portal limit
recorded in `store/listing.md` (check it; the current text is 1,649 characters). Cover what
changed since the published listing (public release 1.0.36):

- Agents: Claude, Codex, Cursor, OpenCode, Pi, OpenClaude, Hermes Agent (bots, sessions,
  scheduled jobs; answer Hermes questions from the glasses), with the model shown for each.
- Reader: book-style pages, opens at the latest reply, swipe-down refresh, hanging indents,
  Markdown tables lined up, small-text mode with pixel fonts (list them) and a font
  comparison screen; Scanner-sweep thinking indicator.
- Filters by agent and workspace on the glasses and the phone; Usage with reset modes.
- Voice: hold to talk, local Whisper on your own computer, review then click to send.
- English and Japanese (switch in the phone app); Japanese pixel font.
- Runs on Windows and macOS (macOS: say it is new / not yet tested on a real Mac).
- Keep: own-computer/Tailscale setup, privacy stance, MIT and original-author attribution
  exactly as the current text has them.
Plain, short sentences. No claims the code does not support.

Also write `store/description.ja.txt`: a Japanese version for Japanese users (mark in
`store/listing.md` that a native speaker has not reviewed it).

## 2. Screenshots

Produce a fresh set in `store/screenshots/` using the existing tooling and process in
`store/listing.md` (`scripts/store-preview.mjs` fixture with FICTIONAL data only,
`scripts/store-capture.mjs` against the official simulator, `scripts/store-previews.py` to
composite alpha onto black). Native 576x288; keep the existing file naming scheme. Run the
fixture and simulator in named Orca pwsh terminal tabs (terminal policy), reuse existing
tabs, close what you start when done. Never connect to the real bridge or real sessions.

Wanted shots (update the fixture where it lacks data, fictional only):
session list with several agents and models; reader page in native text; reader in a small
pixel font; Compare fonts; voice input; choices menu; Filter by Agent; Filter by
Workspace; Usage; Hermes sessions; one Japanese screen (phone language 日本語); the phone
companion page (if the existing phone preview can capture it).

Open every image and check it: no clipping, no real names/paths/content, correct size.
List the files and what each shows in `store/listing.md` and refresh `store/gallery.html`.

## Rules

- No portal, browser, beta upload, bridge restart, or input to live sessions.
- `npm test` still passes. Stage explicit paths only (never `git add -A` / `.` / `-u`,
  never `git commit -a`). Commit message ends with `Agent: Cursor <model>`. Push to
  `origin windows-android-codex`.
- Edit files with the editor, not bash heredocs (they mangle backslashes on this PC).
- Finish with a dated note in `store/listing.md`: what was produced, what Eugene must
  upload/paste, what was not verified.
