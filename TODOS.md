# Orca Glass TODOs
Updated: 2026-11-05

Current beta: **1.0.46** (font list menu; six small fonts incl. Departure 7x11). Public: **1.0.36**.
Workspace-filter preview approved, released and retired with merged worktree cleanup.
Future visual changes require preview approval before beta upload.
Completed/superseded release notes: [history](docs/todo-history.md).

## Open work

- [ ] **Small text in the reader (pixel / mono image tiles) -- G2 check pending:**
  2026-11-09 G2 1.0.40: fonts fine, 1px frame good, all checkerboards blotchy, tiles draw
  one by one on page turn, scanner confirmed good. Page-turn ms from Settings log pending.
  2026-11-09 beta1.0.39 uploaded/promoted (75,794 bytes). Revision: whole screen incl. status row as four 288x144 tiles;
  Spleen 6x12 / 8x16 / JetBrains Mono (FreeType mono bitmap) menu names; display test
  pattern for the 640x350-panel vs 576x288-canvas question. 136 tests; simulator verified.
  2026-11-09 user approved; beta1.0.38 uploaded/promoted (94,654 bytes; fonts add ~40KB).
  user 2026-11-09 asked for more text per page at about half size, switchable from the
  long-press menu, JetBrains Mono plus a monospace pixel font, status row smaller only
  if it uses no tiles and keeps an animated spinner. Built for the reader: Spleen 6x12
  and JetBrains Mono 10px (each on its own whole-pixel grid) as four image tiles; status row stays native (cannot shrink;
  spinner native ASCII because the four tiles use all image slots). 136 tests/build pass.
  Simulator verified (captures in .local/), preview LEFT OPEN. Pending: approval, beta,
  G2 legibility and page-turn speed. Voice review/Usage not converted yet. See
  docs/session-reader.md.

- [ ] **Phone page: Filter by Agent, Filter by Workspace, Usage -- phone/G2 check pending:**
  2026-11-06 user approved preview; beta1.0.37 uploaded/promoted (54,819 bytes), public
  1.0.36 Published. 135 tests pass; prototype dist restored; no bridge restart.
  user 2026-11-06 asked for a more usable phone page after reviewing OcuClaw's phone app
  (YouTube screenshots); dark theme kept. Built: Home (collapsible connection bar,
  Filters, Usage with Computer/Phone/Absolute and bars, reply box) and Settings (setup,
  log). Filters share the glasses' saved selections and redraw each other; shared helpers
  in app/src/filters.ts. 135 tests/build pass. Phone preview (scripts/phone-preview.mjs,
  Orca tab Phone Preview, http://127.0.0.1:8796/?code=demo) LEFT OPEN; headless captures
  checked (demo, Hermes/Absolute, unpaired). App-only: beta upload after approval, no
  bridge restart.

- [ ] **Hermes questions (clarify): answer from the glasses -- first real answer pending:**
  user 2026-11-05 asked to build it after answering the AMC questions in Telegram.
  Built 2026-11-05: an open single-select question is the reader's choice menu (Click
  for choices or say the option number, then confirm); the bridge answers with
  clarify.respond using the exact choice text, only if the gateway's open prompt still
  has the same id. Open-ended questions take a spoken reply; multi-select and approvals
  stay in Telegram/Desktop. 134 Node + 16 Python synthetic tests pass. Bridge restarted
  2026-11-05 (supervisor72872, server71132, whisper71672 --vad), local/stableHTTPS
  healthz ok; live read-only check lists 11 Hermes sessions, no question open. No app/
  beta change. Pending: the user's first real answer from the G2. See docs/hermes-bridge.md.

- [ ] **Separate Hermes and Orca filters; Hermes picker Bots / Sessions / Scheduled jobs;
  new Filter by Agent page -- G2 confirmation:** user approved; beta1.0.36 uploaded/promoted
  (51,971 bytes), public remains1.0.23; bridge restarted (supervisor55704, server80588,
  whisper10560 --vad), local/stableHTTPS healthz ok. user 2026-11-05: on 1.0.35 Hermes mode still mixed Orca items. Now Filter by
  Agent is a text page '<-, Hermes Agent, divider (not selectable), All Orca Sessions,
  Claude, Codex, other Orca agents'. Hermes Agent shows only Hermes sessions and opens
  the Hermes workspace page (selection saved as view-hermes-workspaces); every other
  choice shows only Orca sessions and opens the Orca page (view-workspaces). 132 tests
  pass; simulator verified agent page, divider skip, Hermes list, Orca list and Orca
  page. Earlier picker detail:   (beta AND bridge restart), then G2:** user request 2026-11-05, matching Hermes Desktop
  (7 bots, 2 sessions, 2 scheduled jobs). Bridge: each Hermes session joins one group
  -- Desktop chat = its own Session, cron run = its job (run title starts with the job
  name, same profile), anything else = its profile's Bot. Bot name = profile.yaml
  ui_meta.title; jobs = <profile>/cron/jobs.json; listWorkspaces appends every bot and
  job (marked hermes) so bots/jobs without sessions still show. Session list label is
  now the bot name, e.g. [Grand Master Bot/Hermes]. Picker: Hermes mode shows only these
  sections (recency order); Orca mode no longer lists Hermes groups. Read-only live check:
  7 bots, 2 sessions, 2 jobs (FEHD has no run yet), exactly as Desktop. Old saved
  'hermes-profile:' selections show under 'Other selections' to clear. 132 tests pass;
  simulator verified both pages. Preview OPEN on page 2. Not released.

- [ ] **Hermes — G2 confirmation:** PR #2 merged as5a48a6f; beta1.0.28 live
  (49,867 bytes), bridge restarted and stableHTTPS lists15 Hermes sessions.
 113 tests/build/doctor and synthetic native interaction checks pass. Worktree
  and local/origin feature branches deleted after merge; preview captures kept
  in main .local/hermes-merged-preview. Physical reading and a real user-confirmed
  Hermes reply remain unverified; no autonomous live prompt/resume/reply sent.
  See [implementation](docs/hermes-bridge.md) and [review](docs/hermes-pr-review.md).
- [ ] **Public listing screenshots — user uploading:** 2026-11-05 portal confirms
  public1.0.36 Live. Eight fresh native1.0.36 screenshots, fictional data, are ready
  in store/screenshots; gallery/listing updated. User takes over portal upload;
  new set not saved by agent. Await persisted screenshot confirmation. Private-PC
  limitation remains, self-service setup and generated-policy issues remain open.
  See [listing status](store/listing.md).
- [ ] **Monitor native popup request:** [GitHub #44](https://github.com/even-realities/everything-evenhub/issues/44)
  and [Discord thread](https://discord.com/channels/1301124787740868620/1484753075590664332/threads/1567124600658202754).
  Await maintainer response/API guidance. Primary use case: hold-to-talk with more
  visible transcription rows; closing Send/Cancel must not move/reset session text.
- [ ] **Monitor scroll-to-bottom / auto-follow request:** [GitHub #45](https://github.com/even-realities/everything-evenhub/issues/45)
  and [Discord thread](https://discord.com/channels/1301124787740868620/1484753075590664332/threads/1567124754475909202).
  Await maintainer response/API guidance for following newest LLM output while
  preserving the user's position when reading older text.

- [ ] **Main-response-only filtering:** tool records/internal reasoning and terminal
  footer chrome are filtered, but public assistant progress commentary remains.
  Final-only filtering was requested earlier and is not implemented.2026-11-04
  user now requests some progress; a compact live activity line is prepared, while
  broader assistant-commentary condensation remains open. See
  [reader details](docs/session-reader.md).

## Optional verification / known limitations

- [ ] **Automatic startup after a real reboot:** sign-in task and manual task
  launch verified; no real reboot/recovery check recorded. This is a verification
  gap, not a current startup failure. Orca must be running.
- [ ] **Idle title retention:** fix and synthetic idle/incarnation tests passed;
  no explicit long-idle G2 confirmation recorded. Monitor for recurrence of
  "Codex ready" replacing the session name; no new failure reported.
- **Other provider conversations:** list/filter discovers Pi, Cursor and OpenCode,
  but safe terminal conversation parsing currently recognizes Codex/Claude only.
  Unknown formats cannot be claimed as fully supported readers. Claude live
  testing remains prohibited without explicit authorization.

## Completed / confirmed

- [x] Workspace picker without title, ten rows, Recent workspaces first, cursor skips
  headings -- user confirms beta1.0.35 on G2, 2026-11-05. (Its Hermes-only list did not
  meet the need; superseded by the separate Hermes/Orca pages row in Open work.)
- [x] Silent hold no longer transcribed as 'you' (Whisper Silero VAD) — user confirms
  on G2 'Could not hear anything' for silence and normal transcription, 2026-11-05.
- [x] Swipe down on the last page refreshes the reader (beta1.0.32) — user confirmed
  done, 2026-11-05.
- [x] Usage reset-time modes Computer/Phone/Absolute (beta1.0.27) — user confirmed
  done, 2026-11-05.
- [x] Swipe-only menu paging, no Previous/Next rows (beta1.0.26) — user confirmed
  done, 2026-11-05.
- [x] Claude five-hour/weekly and Cursor monthly usage (beta1.0.23) — user confirmed
  done, 2026-11-05.
- [x] Open a session at the top of the latest response — user confirms beta1.0.33
  works on G2, 2026-11-05.
- [x] Typed '❯ 1) / 2)' message no longer shown as Claude choices (bridge/choices.mjs
  rejects menus with later reply/prompt/input footer) — user confirms on G2 using
  this Claude session, 2026-11-04.
- [x] Reader without title row, seven chat rows, two-digit Page X of Y fits (6px
  right slack) — user confirms beta1.0.31 works on G2,2026-11-04.
- [x] Full-width text with measured firmware glyph widths (reader wrap552/560px,
  list titles to their label, flush-right labels) — confirmed with beta1.0.31 on G2,
  2026-11-04. See [reader details](docs/session-reader.md).
- [x] Even Hub description and repository README refreshed for beta1.0.27,
  with public1.0.23 distinction; saved portal text verified after reload2026-11-04.
  Hermes branch health/status checked without submitting agent input.
- [x] Workspace multi-filter and [workspace/Agent] session labels â€” user confirms
  beta1.0.25 works on G2,2026-11-04. Follow-up removes paging rows; tracked above.
- [x] Claude saved chat / blank-reader recovery, concise working progress and
  numbered-input feature group â€” user confirms beta1.0.24 works on G2,2026-11-04.
  Overall release accepted; native/voice/stale-question edge cases also covered by
 91 synthetic tests and simulator checks. See [reader details](docs/session-reader.md).
- [x] Full-width session reader â€” user confirmed on G2, beta1.0.22,2026-11-03.
  Native wrapping uses560px body at x8, padding0; fixed50-character wrapping removed.
- [x] Remaining native-menu checks â€” Display off/Brightness/Close, moving dot,
  and no displaced slash when a working session is selected; user marks the
  remaining G2 checklist done2026-11-03. No further checks pending for these items.
- [x] Three contextual actions (Refresh sessions, New Session, Usage) work on G2
  â€” user confirmed2026-11-03 for beta1.0.21.
- [x] Bold vertical bar is gone â€” user confirmed resolved2026-11-03; exact cause
  not established. No further scrollbar-removal work required for this report.
- [x] Compact native-text session menu trial â€” user marks done2026-11-03.
- [x] Menu compatibility diagnosis and smaller markers â€” user marks done2026-11-03.
- [x] Phone Failed to fetch follow-up â€” user marks resolved2026-11-03.
- [x] Android/G2 startup/load rejection recovery; menu speed and stationary text.
- [x] Count/filter/provider alignment, no blank title row, plain cmd.exe excluded.
- [x] Three-row transcription, native footer text, voice completion/chat retention.
- [x] Terminal UI chrome/merged-space fixes; Working/Waiting and reader animation.
- [x] Dynamic agent filtering, English-only fork and /images ignore.
- [x] Codex usage restored; user confirmed working in the conversation.
- [x] Orca-workspace terminal policy and simulator placement.
- [x] Private beta installation/update flow established; current1.0.23 uploaded.

## Deferred / closed scope

- [Even SDK requests](docs/sdk-feature-requests.md): native scroll controls/offset
  preservation, voice overlay/STT, contextual submenus, text controls and optional
  scrollbar visibility. Main popup/auto-follow requests filed with user authorization
  as GitHub #44/#45 and separate Discord threads; links/status in that document.
- Six-row overlay and app-managed Click paging cancelled; separate review screen
  removed. Single Click in a session stays no-op except voice review Send.
- Native Even AI router abandoned in favour of custom Orca Glass UI. Old native
  Terminal pairing/QR trials are historical, not active blockers for this beta.
- Direct mobile-protocol transport deferred; public marketplace preparation is
  now requested (profile/assets only), with the release work listed above.
- Historical numbered-choice trials are not a current task; do not submit agent
  input for verification without authorization.
