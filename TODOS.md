# Orca Glass TODOs
Updated: 2026-11-04

Current beta: **1.0.34** (nine rows + status row, full-screen voice); 1.0.33 G2-confirmed.
Workspace-filter preview approved, released and retired with merged worktree cleanup.
Future visual changes require preview approval before beta upload.
Completed/superseded release notes: [history](docs/todo-history.md).

## Open work

- [ ] **Nine chat rows + one status row; full-screen voice page — G2 confirmation:**
  user request 2026-11-05. Approved; beta1.0.34 uploaded/promoted (51,240 bytes),
  public remains1.0.23; bridge restarted (supervisor33076, server49736),
  local/stableHTTPS healthz ok.
  Reader: nine 27px rows (y4..247), divider y250, one status row y254: left
  '/Waiting Opus5.5' (spinner icon + working word + model while working), right
  '[Tap&Hold for Input] Pg77/78' (provider timer in front while working). The hint
  shrinks to [Tap&Hold], [T&H], then none, fitted against the widest working word,
  model, timer and page counter (4-digit Pg1453/1467 tested). Model: bridge reads
  saved transcript (Claude message.model, Codex turn_context model+effort) or the
  Codex footer; read-only check: this Claude session Opus5.5, Codex sessions
  GPT-6.1-Sol low / GPT-6-Astra med. Hold opens a full-screen voice page already
  listening (nine scrollable transcript rows, divider, instruction row: Listening…,
  Transcribing…, Tap to send / Double tap to cancel); send or cancel rebuilds the chat
  at its newest (bottom) page. Voice-border images removed: reader page 7 containers,
  IDs 1..7, layers 0..6; voice page 4 containers. Latest-response page break now only
  when the response does not already sit wholly on the last page. 126 tests/build/
  typecheck pass; simulator verified layout, listen/review/send (one synthetic send),
  cancel (no send) and return to Pg6/6. Supersedes the 2026-11-02
  no-rebuild voice overlay rule at the user's explicit request.

- [ ] **Swipe down on last page refreshes the reader — G2 confirmation:**
  user reports sessions sometimes stop auto-refreshing. Cause: any page swipe freezes
  the snapshot until send/reopen, while the 1s poll skips frozen readers. Swipe down
  on the last page now unfreezes, shows Refreshing… in the counter row, polls at once
  and jumps to the newest page; live polling continues. 122 tests/build pass;
  simulator: frozen Page3of3 -> swipe -> Page5of5 with new lines. User approved;
  beta1.0.32 uploaded/promoted, channel verified (50,727 bytes), public remains1.0.23.
  App-only; no bridge restart. G2 check pending.

- [ ] **Book-style reader — G2 confirmation:** native six-row whole-page
  swipes; bottom Page X of Y, latest page on open, frozen snapshot while browsing.
  Preserves source nested lists and complete two-digit numbers. Resolves previously
  unreachable900-byte sections.116 tests/build/doctor pass; synthetic native8-page
  traversal and voice cancel preservation pass. Preview OPEN on Page6of8 (8791/9900).
  User approved upload; beta1.0.29 promoted and verified (50,436bytes).
  Physical G2 confirmation pending. See [reader details](docs/session-reader.md).

- [ ] **Usage reset-time modes â€” G2 confirmation:** beta1.0.27 live; selector cycles
  Computer time / Phone time / Absolute time (remaining duration, e.g.2d5h12m).
  Selection persists; bridge retains exact reset instants and computer-local
  labels.107 tests/build/doctor pass; synthetic simulator checked day/zone
  conversion and countdown, left OPEN on Absolute (8791/9900). User
  approved upload; beta channel verified (49,865 bytes), bridge restarted and
  stableHTTPS usage has timestamps/computer labels for all four provider windows.
  Physical phone/G2 time-zone verification pending. See [reader details](docs/session-reader.md).
- [ ] **Swipe-only menu paging â€” G2 confirmation:** beta1.0.26 live;
  no Previous/Next rows. Swipe past last/first row changes pages and selects the
  opposite edge; outer ends clamp. Seven entries plus two controls per page.
 101 tests/build/doctor pass, native simulator forward/reverse checks pass.
  User approved upload; beta channel verified (49,179 bytes). Completed preview closed at user request
  after beta upload; stableHTTPS health ok. Awaiting G2 check on1.0.26. See [reader details](docs/session-reader.md).
- [ ] **Claude/Cursor usage:** beta1.0.23 live; G2 confirmation pending. Shows
  Claude five-hour/weekly and Cursor monthly allowance alongside Codex. User
  approved simulator2026-11-03; beta channel verified, bridge restarted and
  local/stableHTTPS endpoints return ok for all three.79 tests/build/doctor pass.
- [ ] **Hermes — G2 confirmation:** PR #2 merged as5a48a6f; beta1.0.28 live
  (49,867 bytes), bridge restarted and stableHTTPS lists15 Hermes sessions.
 113 tests/build/doctor and synthetic native interaction checks pass. Worktree
  and local/origin feature branches deleted after merge; preview captures kept
  in main .local/hermes-merged-preview. Physical reading and a real user-confirmed
  Hermes reply remain unverified; no autonomous live prompt/resume/reply sent.
  See [implementation](docs/hermes-bridge.md) and [review](docs/hermes-pr-review.md).
- [ ] **General installation / public listing follow-up:** public1.0.23 is live;
  beta1.0.29 is current. README/Even Hub description updated2026-11-04, saved and
  verified after reload. Packaged origin is still one configured private PC, so
  arbitrary-PC self-service setup remains open. Earlier submission/privacy notes
  are historical; current PDF contents were not rechecked in this task. See
  [listing status](store/listing.md).
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
