# Orca Glass TODOs
Updated: 2026-11-04

Current beta: **1.0.24**.91 tests/build/doctor passed for Claude reader/progress/choices. Simulator stays
open for user review; visual changes require preview approval before beta upload.
Completed/superseded release notes: [history](docs/todo-history.md).

## Open work

- [ ] **Workspace multi-filter / workspace-agent row labels:** implemented in
  feature/workspace-filter (separate Orca worktree). Filter by Workspace is directly
  below Filter by Agent; native [x]/[ ] selections persist, combine with agent
  filter and retain cursor. Session labels include [porttracker/Claude] and
  [orca-glass/Codex].97 tests/build/doctor pass, native simulator verified two
  selected workspaces and filtered results; preview OPEN on8793/9900. Await user
  preview approval before beta/release integration. Production beta1.0.24 unchanged.
  See [reader details](docs/session-reader.md).
- [ ] **Claude/Cursor usage:** beta1.0.23 live; G2 confirmation pending. Shows
  Claude five-hour/weekly and Cursor monthly allowance alongside Codex. User
  approved simulator2026-11-03; beta channel verified, bridge restarted and
  local/stableHTTPS endpoints return ok for all three.79 tests/build/doctor pass.
- [ ] **Public release preparation:** user requests profile and screenshots on
  2026-11-03. CLI name/tagline/description saved; six native simulator captures
  and reproducible sample-data preview prepared. See [store/listing.md](store/listing.md).
  Public build still pins one private PC origin; general-user connection/setup,
  fork privacy policy and on-glasses/portal name consistency remain open.
  Five primary screenshots and Office cover saved in the portal; sixth screenshot
  is local/supplemental. List shows fictional Cursor/Pi/Claude/Codex/OpenCode.
  Original-author credit added; production build now carries original MIT license
  and attribution (not yet uploaded). User requires preview before Publish.
  User completed contact details; Quiet Signal and Personal Information now shown
  complete. Portal generated/attached policy and all checklist items complete, but
  template misstates developer collection/sharing and includes phone/address in
  publicly retrievable PDF. Corrected store/Orca-Glass-Privacy-and-Terms.pdf ready;
  user approved it and requested submission. Refreshed portal still points to old
  PDF; replacement pending (only generator exposed). Submission held for corrected
  attachment and public connection/setup (1.0.22 remains pinned to private PC).
  AI category saved; description checklist
  complete. User selected orca-glass-icon.png (earlier design);
  matching24x24 orca-glass-icon.png saved and verified in portal. Preview in
  store/gallery.html. No review/publication.
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

- [x] Claude saved chat / blank-reader recovery, concise working progress and
  numbered-input feature group — user confirms beta1.0.24 works on G2,2026-11-04.
  Overall release accepted; native/voice/stale-question edge cases also covered by
 91 synthetic tests and simulator checks. See [reader details](docs/session-reader.md).
- [x] Full-width session reader — user confirmed on G2, beta1.0.22,2026-11-03.
  Native wrapping uses560px body at x8, padding0; fixed50-character wrapping removed.
- [x] Remaining native-menu checks — Display off/Brightness/Close, moving dot,
  and no displaced slash when a working session is selected; user marks the
  remaining G2 checklist done2026-11-03. No further checks pending for these items.
- [x] Three contextual actions (Refresh sessions, New Session, Usage) work on G2
  — user confirmed2026-11-03 for beta1.0.21.
- [x] Bold vertical bar is gone — user confirmed resolved2026-11-03; exact cause
  not established. No further scrollbar-removal work required for this report.
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
