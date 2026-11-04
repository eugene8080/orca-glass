# Hermes bridge review

Reviewed: 2026-11-04. Agent: OpenAI Codex GPT-6.

PR: https://github.com/eugene8080/orca-glass/pull/2

Reviewed head: `d02caff55b70a93f35ead2ffdcfb9af76f23b228`, branch
`eugene8080/hermes-bridge`, targeting `windows-android-codex`.
No implementation fixes, merge or deployment performed.

## Findings

1. **P2 — Hidden model-facing rows become visible in stored conversations.**
   [bridge/hermes-client.py:30](https://github.com/eugene8080/orca-glass/blob/d02caff55b70a93f35ead2ffdcfb9af76f23b228/bridge/hermes-client.py#L30)
   only filters by role, while the stored-history loader at line90 calls
   `get_messages_as_conversation` directly. That is Hermes' model-replay projection;
   it carries `display_kind`, including `hidden`. The native display projection
   explicitly excludes hidden rows, but this helper renders their text as a user
   or assistant turn. Synthetic input with `role=user`, `display_kind=hidden` and
   a dummy scaffold string is included in the returned reader messages. Use the
   canonical display projection for stored history and test its hidden/scaffolding
   exclusions; role-only filtering is insufficient.

2. **P2 — Valid compressed stored conversations can be rejected as stale.**
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

Recommendation: fix both findings, reconcile the shared notes and run the combined
suite before merging. Beta1.0.27 remains unchanged.
