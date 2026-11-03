# Orca Glass TODOs
Updated: 2026-11-03

Current beta: **1.0.21**.75 tests and build passed before release. Simulator stays
open for user review; visual changes require preview approval before beta upload.
Completed/superseded release notes: [history](docs/todo-history.md).

## Open work

- [ ] **G2 check of beta1.0.21:** verify the three contextual actions (Refresh
  sessions, New Session, Usage), retained OS Display off/Brightness/Close, moving
  dot, and no displaced slash when a working session is selected. Titles/count/
  filter alignment were approved earlier; only latest-build regressions need checks.
  Simulator routes all three actions and marker frames correctly. Ask one check
  at a time, per user preference.
- [ ] **Bold vertical bar:** identify the reported bar's location. Likely the
  native reader scrollbar; location question remains unanswered. Installed SDK
  has no scrollbar-hide setting. Preserve native smooth scrolling; do not claim
  removal or add a destructive scrolling workaround.
- [ ] **Main-response-only filtering:** tool records/internal reasoning and terminal
  footer chrome are filtered, but public assistant progress commentary remains.
  Final-only filtering was requested earlier and is not implemented. See
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

- [x] Compact native-text session menu trial — user marks done2026-11-03.
- [x] Menu compatibility diagnosis and smaller markers — user marks done2026-11-03.
- [x] Phone Failed to fetch follow-up — user marks resolved2026-11-03.
- [x] Android/G2 startup/load rejection recovery; menu speed and stationary text.
- [x] Count/filter/provider alignment, no blank title row, plain cmd.exe excluded.
- [x] Three-row transcription, native footer text, voice completion/chat retention.
- [x] Terminal UI chrome/merged-space fixes; Working/Waiting and reader animation.
- [x] Dynamic agent filtering, English-only fork and /images ignore.
- [x] Codex usage restored; user confirmed working in the conversation.
- [x] Orca-workspace terminal policy and simulator placement.
- [x] Private beta installation/update flow established; current1.0.21 uploaded.

## Deferred / closed scope

- [Even SDK requests](docs/sdk-feature-requests.md): native scroll controls/offset
  preservation, voice overlay/STT, contextual submenus, text controls and optional
  scrollbar visibility. No SDK ticket or Discord message sent by agent.
- Six-row overlay and app-managed Click paging cancelled; separate review screen
  removed. Single Click in a session stays no-op except voice review Send.
- Native Even AI router abandoned in favour of custom Orca Glass UI. Old native
  Terminal pairing/QR trials are historical, not active blockers for this beta.
- Direct mobile-protocol transport deferred; public marketplace release not requested.
- Historical numbered-choice trials are not a current task; do not submit agent
  input for verification without authorization.
