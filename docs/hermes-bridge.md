# Hermes session bridge
Updated: 2026-11-04

## Release status — 2026-11-04

User approved release. PR #2 merged as `5a48a6f`; beta **1.0.28** promoted and
verified (49,867 bytes), public remains1.0.23.113 tests/build/doctor pass. Production
bridge restarted; stableHTTPS health passes and discovery lists15 Hermes sessions.
Feature worktree and local/origin branch removed; synthetic captures preserved
under main `.local/hermes-merged-preview`. G2 and a real user-confirmed reply remain
pending. No real prompt/resume/reply submitted during release. Earlier held/branch
status below is historical.


## Implementation plan / status

- [x] Inspect installed Hermes 0.22.5 and Orca Glass discovery, transcript and reply paths.
- [x] Confirm canonical local gateway transport: same-user Windows named pipe grants an in-memory ticket for `/api/ws`; never ensure/start a gateway.
- [x] Implement bounded profile discovery, exact session ownership, conversation reads, activity and confirmed replies.
- [x] Preserve agent/workspace filters, deduplicate only proven Orca bindings, and test stale targets and existing agents.
- [x] Run tests/build/doctor; leave a synthetic native simulator preview open in this child worktree.
- [x] Review explicit task paths for commit/push to coordinator review; no merge, deployment or beta promotion. Final commit/push receipt is in the worker completion message.

## Decisions and read-only observations

Coordinator approved explicit `Hermes: <profile>` workspace groups for sessions outside Orca. Only exact recorded pane/session/profile ownership may assign an Orca workspace. Agent identity is always `hermes`, displayed as Hermes; model/provider is never agent identity. Creation remains Codex-only, and Hermes has no invented usage windows.

Local metadata discovery found seven ready profile authorities on the existing gateway. Default profile exposed one live Desktop session and nine stored Telegram conversations; bookings-bot exposed one stored Desktop session; health-bot and research exposed one stored Telegram conversation each; schedule-bot exposed two stored conversations (cron and Telegram); developer and writer had none. These are observations, not a promised session count. No titles, messages, IDs or credentials are recorded here. The gateway's own visible live and stored pickers determine inclusion; hidden/archived/internal sessions remain excluded. Stored sessions must not be silently dropped merely because they lack a terminal.

The installed `hermes_cli.gateway_client` supports `connect_gateway(endpoint=...)` without startup. Discovery returns profile, instance and authority epoch. `session.list` is read-only; `session.history` serves display messages for live sessions without attaching. `session.resume` may refresh policy/adopt stored history and is reserved for explicit confirmed replies. Canonical history includes tool/reasoning records, so the adapter must whitelist user/assistant text only. Unknown/stale ownership fails closed; neither newest-file lookup nor title matching is allowed.

Production services/configuration are unchanged. No real session was prompted. Hardware/G2 and real user-confirmed reply remain review/deployment checks.

## Implementation and safety contract

`bridge/hermes.mjs` dispatches opaque Hermes handles separately from terminal handles; `bridge/hermes-client.py` reuses the interpreter selected by the installed launcher's `--print-runtime-command` and that installation's dependency bootstrap. No second installation, downgrade, OcuClaw, package installation, external service or provider API is involved. Tickets remain inside the helper, off argv and out of logs. Existing bridge authentication/private connection architecture is unchanged.

The handle hashes canonical profile path, gateway instance, authority epoch, exact session ID, creation time and source. Model changes cannot change agent identity. Every read/activity/reply rechecks gateway identity and exact authorized picker membership. Reads recheck after loading. A confirmed reply alone calls `session.resume` for that exact ID, refuses a redirected identity or pending interactive prompt, rechecks membership, and uses a fresh submission ID with `prompt.submit`. No automatic retry occurs after uncertain delivery. The installed submit protocol does not accept a caller revision guard; the owner still authorizes admission under its mutation lock. Concurrent same-session state changes can therefore be refused or queued by Hermes; the bridge never substitutes another session or title.

Live history uses `session.history`; stored history uses the exact gateway-authorized row in its profile's read-only SessionDB, including explicit ancestors. User/assistant text is whitelisted; tools, system messages and reasoning are omitted. Text is bounded to one million characters of whole recent messages with `limited` reported. Activity uses the gateway's `session.active_list`, including working/starting/attention/idle; no inferred elapsed timer or usage window is added.

Installed Orca source inspection confirmed `extractAgentProviderSession('hermes')` persists only `key: session_id` and `id`. Its managed plugin binds hooks to the launch pane. The bridge joins that exact current pane/incarnation/workspace record to the same profile's frozen `gateway.local_policy.v1:<id>` receipt, reading only the local-client pane/workspace fields with SQLite JSON projection. No full environment or hook token is returned. Exactly one reciprocal binding inherits the Orca workspace. Missing/ambiguous bindings stay under `Hermes: <profile>`; Hermes terminal rows are suppressed so they cannot become duplicate or unsafe alternative send routes. No Hermes Orca pane binding existed during live inspection, so this join is synthetically validated only.

Discovery caches/coalesces for five seconds. It waits at most 1.5 seconds per adapter list call (the Orca wrapper can make two such calls); late discovery appears on the next refresh. Each profile gets at most three seconds and the inventory gets ten seconds total; successful profiles survive another profile's failure. It limits enumeration to 32 profiles and 200 rows per native feed, retaining an unavailable/truncated-profile count in `hermes.status()`. Offline authorities are not started and cannot supply rows. Current live enumeration had zero unavailable/truncated profiles. Real replies remain deliberately untested until the user explicitly confirms one in the deployed UI.

## Validation and review preview

- `npm test`: **107 passed**, including five Python synthetic helper checks launched by the Node suite. Coverage includes seven-model UI filtering, exact confirmed voice target, cross-profile same-ID isolation, stale owner/read/submit guards, changed resume targets, pending prompts, reciprocal Orca ownership, ambiguous/duplicate bindings, partial profile availability and visible-message exclusions. Existing Codex/Claude, workspace selection and swipe paging regressions pass.
- `npm --prefix app run build`: passed; ordinary prototype build only, version remains 1.0.26.
- `npm run doctor`: passed against the running local Orca and installed tools. Doctor does not exercise Hermes or phone/G2; separate read-only Hermes checks cover discovery and Desktop history.
- Read-only combined roster: 33 sessions at observation, including 15 Hermes sessions. Live Desktop read returned 16 visible messages / 7,750 characters; stored Desktop read returned 6 / 878. Only counts were printed; no conversation text or IDs committed.
- `node scripts/check-hermes-simulator.mjs`: passed on the native simulator, using seven synthetic mixed-model Hermes sessions across three profiles plus Codex/Claude rows. Verified one Hermes filter, seven Hermes rows, saved reader, no send before confirmation, exactly one reply to the selected synthetic profile/session, and live reader update. Preview remains open on the Hermes-filtered list. Existing native scroll position is preserved; no auto-follow capability is claimed.

Worktree: `C:/Users/eugen/orca/workspaces/orca-glass/hermes-bridge`; branch: `eugene8080/hermes-bridge`, based on `8caa276`.

Fixture: `http://127.0.0.1:8795/?code=demo&lang=en`, terminal `term_9c62e87a-7074-4277-ba84-08ec0d2facde` (**Hermes Fixture 8795**).

Native simulator automation: `http://127.0.0.1:9902`, terminal `term_9eb00df6-46b1-4ce7-b587-b60b47e26e5b` (**Hermes Native Preview 9902**). Both terminal ownership records match this worktree; HTTP and automation endpoints are verified. Synthetic screenshots/native calls are in ignored `.local/hermes-preview/`, with composited `*-visible.png` captures for review. The fixture was refreshed once to use the final adapter; production processes were untouched.

To reproduce, use named Orca-managed PowerShell terminals in this worktree: set `ORCA_GLASS_SIM_PORT=8795` and `ORCA_GLASS_SIM_SCENARIO=hermes`, run `node scripts/simulator-fixture.mjs`; in the other terminal run the installed `app/node_modules/@evenrealities/sim-win32-x64/bin/evenhub-simulator.exe` against the fixture URL with `--automation-port 9902`. Then run the check script. Do not start duplicate listeners.

Awaiting coordinator review, user preview approval, approved deployment/restart, and physical G2/real user-confirmed Hermes reply validation. Main checkout's unrelated usage edits and screenshot were untouched. No merge, beta upload/promotion, publication or production configuration change occurred.

## Integrated review fixes — 2026-11-04

PR #2's two P2 findings are fixed; see [review evidence](hermes-pr-review.md).
Stored history uses Hermes's canonical display projection and checks root/tip
identity separately for compressed transcripts.113 combined tests pass after
integrating current release branch c5d30c7, with seven Python helper cases;
build/doctor and read-only stored-history smoke pass. Synthetic simulator
interaction checks pass; preview remains open on8795/9902. Screenshot API capture
is solid green, so user visual review is still required. Merge and deployment
remain held; beta1.0.27/production unchanged. No real prompts/resumes/replies.
