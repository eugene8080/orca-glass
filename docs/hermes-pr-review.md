# Hermes bridge review


## Release status — 2026-11-04

User approved release. PR #2 merged as `5a48a6f`; beta **1.0.28** promoted and
verified (49,867 bytes), public remains1.0.23.113 tests/build/doctor pass. Production
bridge restarted; stableHTTPS health passes and discovery lists15 Hermes sessions.
Feature worktree and local/origin branch removed; synthetic captures preserved
under main `.local/hermes-merged-preview`. G2 and a real user-confirmed reply remain
pending. No real prompt/resume/reply submitted during release. Earlier held/branch
status below is historical.

Reviewed: 2026-11-04. Agent: OpenAI Codex GPT-6.

PR: https://github.com/eugene8080/orca-glass/pull/2

Reviewed head: `d02caff55b70a93f35ead2ffdcfb9af76f23b228`, branch
`eugene8080/hermes-bridge`, targeting `windows-android-codex`.
Original review below concerns that head; fixes and validation are recorded next.

## Fix validation — 2026-11-04

Both findings below are resolved in the feature branch. Stored reads run Hermes's
canonical `gateway.session_controls.display_projection` before the user/assistant
allowlist. Hidden and model-only metadata are also excluded defensively. The
sidecar import may redirect stdout; the helper restores both output streams so
its JSON transport remains intact, including failures.

Compressed picker identity now checks the logical root's creation timestamp,
the gateway-selected physical row's source, and the explicit compression link
from that root to that exact row. A newer tip, changed timestamp/source, hidden
root or missing root is refused. It reads the captured row, never a guessed tip.

Current base `windows-android-codex` at `c5d30c7` integrated; shared notes/TODO
conflicts reconciled, including usage-reset changes.113 combined Node tests pass,
including the Python helper runner's seven cases. TypeScript/Vite build and doctor
pass. Regression checks exercise compressed parent100/child200 timestamps,
replacement/hidden/missing identity failures, projection delegation and JSON
stream restoration. Installed canonical projection synthetic smoke confirms
hidden/model-only rows are absent. Read-only gateway discovery returns15 sessions,
zero unavailable profiles, and three sampled stored reads succeed. Logs contain
counts only, no real chat or identifiers.

Native simulator check passes: one Hermes filter, seven mixed-model sessions,
saved reading, no send before confirmation, one exact synthetic reply. Existing
named Orca tabs restarted and preview LEFT OPEN on8795/9902. Its screenshot API
returns solid green, so automated captures do not establish visual correctness.
User preview approval, PR merge, beta/deployment and physical G2/real confirmed
reply remain pending. Beta1.0.27 and production unchanged; no real prompt,
resume or reply submitted.

## Original findings


1. **P2 â€” Hidden model-facing rows become visible in stored conversations.**
   [bridge/hermes-client.py:30](https://github.com/eugene8080/orca-glass/blob/d02caff55b70a93f35ead2ffdcfb9af76f23b228/bridge/hermes-client.py#L30)
   only filters by role, while the stored-history loader at line90 calls
   `get_messages_as_conversation` directly. That is Hermes' model-replay projection;
   it carries `display_kind`, including `hidden`. The native display projection
   explicitly excludes hidden rows, but this helper renders their text as a user
   or assistant turn. Synthetic input with `role=user`, `display_kind=hidden` and
   a dummy scaffold string is included in the returned reader messages. Use the
   canonical display projection for stored history and test its hidden/scaffolding
   exclusions; role-only filtering is insufficient.

2. **P2 â€” Valid compressed stored conversations can be rejected as stale.**
   [bridge/hermes-client.py:84](https://github.com/eugene8080/orca-glass/blob/d02caff55b70a93f35ead2ffdcfb9af76f23b228/bridge/hermes-client.py#L84)
   compares the picker timestamp with the physical transcript row's timestamp.
   The installed gateway's `gateway/session_listing.py::_picker_row` can combine
   `session_id=tip_id` with `started_at=parent.started_at`. After compression those
   timestamps differ. Reproduction uses that installed mapping with synthetic
   parent/child creation times100/200: gateway-authorized picker membership is
   valid, but `stored_history` raises `StaleTarget`. Separate logical session
   ownership from physical transcript identity and add a compressed-history case.
   The currently observed stored-session sample had no such mismatch; this finding
   concerns the supported compressed-history path, not a claimed live outage.

## Evidence and limits

- Re-ran the existing branch suite:107 tests pass. Both uncovered cases are absent
  from that suite. Synthetic review reproduction is in ignored worker file
  `.local/hermes-review-repro.py`; results:
  `hiddenScaffoldRendered=true`, `authorizedCompressedPickerReadRejected=true`.
- Earlier same-day checks: branch TypeScript/Vite build and doctor pass; read-only
  discovery returns15 sessions, zero unavailable profiles. Fixture8795/native9902
  respond and contain synthetic data only.
- No real prompt, resume, reply or provider inference was submitted during review.
  No credential or transcript text was copied into the review.
- GitHub reports merge conflicts; the merge-tree check identifies shared
  `CLAUDE.md`/`TODOS.md` conflicts. Source auto-merge alone does not validate combined
  behavior with the newer usage-reset implementation. Physical G2 and a real
  user-confirmed reply remain pending.

Original recommendation addressed by the fix validation above. Preview approval
remains required before merge/release. Beta1.0.27 remains unchanged.
