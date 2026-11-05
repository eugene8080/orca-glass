# Orca Glass fork
Updated: 2026-11-04

Read the machine-level instructions first. This fork targets Windows desktop
Orca, the Even Realities Android app, and G2 glasses.

## Explicit user constraint

New agent launches remain Codex-only.2026-11-04 Eugene authorizes reading his
existing Claude sessions and user-initiated G2 numbered/voice input. Do not
autonomously prompt, launch or submit live Claude choices for tests. Use synthetic
fixtures for interaction tests. Historical upstream code grants no broader scope.

## Terminal policy

Eugene's explicit rule, 2026-11-03: run terminals inside this repo's Orca
workspace/worktree. This applies to every agent working here.

- Use the `orca-cli` skill and Orca-managed terminal tabs for interactive shells
  and long-running development processes: Vite, simulator, test fixtures and
  development helpers. Resolve the current worktree through Orca and target it
  explicitly; do not create a new checkout merely to run a process.
- Use named PowerShell (`pwsh.exe`) tabs, such as `Orca Glass Dev Server` and
  `G2 Simulator`. Reuse an appropriate existing tab or close its confirmed old
  process before replacing it; avoid duplicate servers/simulator instances.
- Do not launch separate cmd/PowerShell windows, ad hoc background shells or
  scheduled-task simulator instances. Do not use the legacy external-window
  simulator launcher as an agent without first adapting it to this policy.
- Verify terminal ownership, process startup and the relevant HTTP/automation
  endpoint before reporting success. Keep process output available in its tab.
- Short-lived reads, builds and tests may use execution tools without opening
  a persistent terminal. The already-authorized Windows bridge sign-in service
  remains a scheduled task; this rule does not remove automatic bridge startup.
- A specific later user request for another launch surface overrides this rule.

## Visual review policy

Eugene's explicit instruction2026-11-03: leave the simulator open for his review
before shipping visual changes to G2. Do not restore/close the preview immediately
after automated checks. Hold beta upload/promotion until he approves the preview.
Necessary reloads/restarts to prepare the preview should be explained; then keep
it available. Automatic commit/push does not authorize beta promotion.

## Browser policy

User requires his dedicated agent browser for GitHub/Discord work, not restricted
work Chrome.2026-11-03 he explicitly designated the connected Eugene Chrome profile
with GitHub/Discord open. Confirm the dedicated profile from fresh browser inventory;
do not fall back to pscapital.com.hk because it has an existing logged-in tab.

## Current work

2026-11-04 user requests opening a session at the top of the latest LLM response.
Reader pages break before the last assistant message after the last user line and
open there once; live/refresh still follow newest page.123 tests/build pass;
read-only check of this Claude session and simulator Page4of5 verified. Preview
LEFT OPEN; no beta upload.

2026-11-04 user approves swipe-down refresh. Beta1.0.32 uploaded/promoted; channel
verified50,727bytes, public remains1.0.23.122 tests pass; prototype dist restored.
App-only, no bridge restart. Simulator remains OPEN. G2 check pending.

2026-11-04 user confirms typed-list fix on G2 (this Claude session); row closed.
User requests swipe-down refresh: on the reader's last page it unfreezes, shows
Refreshing…, polls at once, jumps to newest page.122 tests/build pass; simulator
verified frozen Page3of3 -> Page5of5. Preview LEFT OPEN; no beta upload.

2026-11-04 user approves bridge restart for choice-parser fix. Verified scheduled
task supervisor85400/server82304 owned8787, stopped task and tree, restarted task.
New supervisor48356 (.local/custom.pid), server35092; local/stableHTTPS healthz ok.
Agent shell HTTPS_PROXY returns403; check tailnet URL with --noproxy. G2 pending.

2026-11-04 user confirms beta1.0.31 (no title, seven rows, page counter, full-width
text) works on G2; TODOS rows closed. User reports typed '❯ 1) / 2)' message in
porttracker Campaign Orchestrator shown as Claude choices. bridge/choices.mjs now
rejects menus with a later reply/prompt row/input footer below.121 tests pass;
read-only live-screen check keeps real menu, rejects typed list. Production bridge
NOT restarted (fix inactive). No live choice sent; no app/beta change.

2026-11-04 user approves no-title/seven-row reader. Beta1.0.31 uploaded/promoted;
channel verified50,650bytes, public remains1.0.23.118 tests pass; prototype dist
restored. App-only, no bridge restart. Simulator remains OPEN. G2 check pending.

2026-11-04 user requests chat view without session-name row and reports Page20/21
of21 cut off on G2. Reader head blank (container retained), body starts y4 with
seven rows; nativeRight slack6px.118 tests/build/doctor pass. Simulator synthetic
146-line chat shows Page20/21 of21 fully; preview LEFT OPEN on Page20of21.
No beta upload; approval and G2 pending.

2026-11-04 user approves full-width text preview. Beta1.0.30 uploaded/promoted;
channel verified50,632bytes, public remains1.0.23.118 tests pass; prototype
dist restored. App-only release, no bridge restart. Simulator remains OPEN.
G2 check pending (rows reach right edge without wrapping onto a second line).

2026-11-04 user reports session screens stop8-10 letters short of right edge.
Cause: Arial21px measurement wider than native font. Measured ASCII advances in
native simulator; reader wraps at552/560px, list titles fill to own label, labels/
hint keep3px slack.118 tests/build/doctor pass. Simulator restarted twice in its
existing tab (Vite reload returned app home; double-click exited); preview LEFT OPEN
on synthetic reader page1of2 (9900/8791). No beta upload; 1.0.29 unchanged.
Preview approval and G2 check pending.

2026-11-04 user approves book-reader beta upload. Beta1.0.29 uploaded/promoted;
channel verified50,436bytes, public remains1.0.23.116 tests pass; beta package
and restored prototype builds pass. StableHTTPS health ok. App-only release,
no production bridge restart needed. Native simulator remains OPEN. G2 page flip,
bottom counter, nested list completeness and voice-position confirmation pending.
No real provider input or public publication; unrelated screenshot retained.

2026-11-04 user reports Campaign list numbering/missing items and requests Books-style
reader pages. Read-only saved Claude history matches source nested bullets plus
1-5 sublist; user corrected initial1-19 claim after supplying actual terminal
screenshot. Preserve source list structure; no numbering rewrite. Existing reader
loaded only the final900-byte section and never changed sections on swipe, making
older sections unreachable. Reader now builds measured native six-row/900-byte
pages, opens latest, swipes whole pages with clamped ends and Page X of Y in the
bottom hint's third row. No extra containers or image-rendered text. Browsing
freezes text/page count; status/choice detection continues. Send or reopening
resumes live latest pages. Voice hides hint/counter, retains three input rows,
and restores exact page after cancel. Page/body writes serialize with live writes;
rapid gestures coalesce; hold waits for pending page writes and checks release.
116 tests/build/doctor pass. Native synthetic8791/9900 check traverses8 pages both
directions, retains every character/nested bullet/two-digit item1-19, clamps first
page, and verifies recording/cancel never rewrites body or rebuilds. Preview LEFT
OPEN on Page6of8 in existing root fixture/simulator tabs. Screenshot API remains
solid green, so capture is not visual proof. User visual approval/G2 pending;
no beta upload/bridge restart/live prompt. Beta1.0.28 unchanged.

2026-11-04 user approves Hermes beta and requests worktree/branch cleanup.
PR #2 merged as5a48a6f; beta1.0.28 uploaded/promoted, channel verified49,867bytes;
public remains1.0.23.113 tests/doctor and beta/prototype builds pass. Scheduled
bridge restarted after verified listener/supervisor ownership; supervisor85400,
local/stableHTTPS health pass. StableHTTPS lists28 sessions including15 Hermes.
No real prompts/resumes/replies submitted; physical G2/confirmed Hermes reply
still pending. Closed all three feature tabs, preserved synthetic preview files
under main .local/hermes-merged-preview, unlinked dependency junction without
following it. Orca removal initially left a locked empty directory; after tabs
stopped, explicitly removed the verified empty directory and Orca completed
removal. Worktree/local branch/origin branch now absent; main dependencies intact.
Existing root usage preview and unrelated user screenshot retained. No Hermes
installation/config/model change or public publication. Even Hub description
still reflects the prior1.0.27 README refresh; not edited during this release.


2026-11-04 user authorizes Hermes PR fixes and conflict resolution. Feature branch
now integrates current windows-android-codex c5d30c7 (including usage reset modes).
Both P2 findings fixed: stored reads use installed canonical display projection,
with hidden/model-only defensive exclusions and stdout restoration; compressed
picker rows validate root timestamp plus exact compression tip/source. Replaced
or newly compressed targets still fail closed.113 combined Node tests (including
seven Python helper cases), build and doctor pass. Installed canonical projection
synthetic smoke excludes hidden/model-only scaffolds; read-only discovery15,
unavailableProfiles0, three stored reads succeed without exposing chat in logs.
Native fixture interaction check passes on8795/9902 with synthetic confirmed send
only. Preview restarted in its existing named Orca tabs and LEFT OPEN. Screenshot
API returns solid green; capture is not visual/hardware proof. User visual review,
PR merge and release remain pending; beta1.0.27/production unchanged. No real
prompt/resume/reply or Hermes runtime/config changes. See docs/hermes-pr-review.md.


2026-11-04 Hermes adapter implemented in child eugene8080/hermes-bridge from
8caa276, pending coordinator review. Stable hermes/Hermes identity across models;
installed authenticated gateway transport covers live and stored Desktop/profile
sessions without another installation or runtime. Exact profile/session/owner
checks protect reads and confirmed replies; reciprocal Orca pane/profile receipts
assign workspaces, otherwise explicit Hermes profile groups.107 tests/build/doctor
pass; read-only discovery found15 Hermes sessions, including both live/stored
Desktop history. No live prompts, production restart/config change or beta upload.
Native synthetic preview LEFT OPEN in child workspace: fixture8795
term_9c62e87a-7074-4277-ba84-08ec0d2facde; simulator9902
term_9eb00df6-46b1-4ce7-b587-b60b47e26e5b. Seven mixed-model Hermes sessions plus
Codex/Claude; filter, reader and one exact confirmed synthetic reply verified.
See docs/hermes-bridge.md for plan, limits and review steps. Main checkout's
unrelated usage changes/screenshot untouched; G2 and real confirmed reply pending.

2026-11-04 user requests Hermes PR creation during code review. Created
https://github.com/eugene8080/orca-glass/pull/2 from eugene8080/hermes-bridge at
d02caff into windows-android-codex; open, merge conflicts in shared notes/TODOs.
Completed review finds two P2 issues: stored model-replay history renders
hidden display_kind rows, and compressed picker parent timestamps fail physical
child-row identity checks. Both synthetically reproduced against the helper;
second uses installed gateway _picker_row mapping. Existing107 tests pass but
miss these cases. Findings/reproduction recorded in docs/hermes-pr-review.md and
PR body. No real prompt/reply/resume, code fix, merge or deployment. Beta1.0.27
unchanged. Fixes and combined integration tests required before merge.

2026-11-04 user requests Even Hub README refresh and Hermes-bridge status.
Updated store description in dedicated Eugene Chrome's existing Even Hub tab,
Store listing > Description > Edit > Confirm. Reload confirms persisted beta1.0.27
text (1535 source characters), distinguishes public1.0.23, documents workspace
multi-filter/labels, swipe paging, Claude reader/choices, voice and reset modes.
Hermes explicitly marked development-only. No build promotion/review submission.
README.md synchronized; historical1.0.21 screenshots labelled as historical.
Portal currently confirms public1.0.23 live and beta1.0.27. Earlier listing
preparation notes claiming no publication are historical, not current status.
Browser connector failed; documented Orca computer-use operated the same verified
Eugene Chrome window10228026 instead. Screenshot .local/evenhub-readme-updated.png.
Hermes branch eugene8080/hermes-bridge atd02caff checked read-only in its worktree:
107 tests/build/doctor pass, live discovery15 sessions/unavailableProfiles0;
fixture8795 has9 synthetic rows, native automation9902 returns pong. Merge-tree
check against current main reports conflicts only in CLAUDE.md/TODOS.md; source
files auto-merge, but combined integration is not tested or approved. No PR exists.
Existing worker preview remains open. No prompts/replies, merge, deployment,
profile/runtime/config changes or model calls. Pending integration review and
G2/user-confirmed reply testing; current beta has no Hermes support.

2026-11-04 user approves Usage reset toggle beta.1.0.27 uploaded/promoted;
beta channel verified (49,865 bytes), public remains1.0.23.107 tests/build/doctor
passed for implementation; beta/prototype builds pass. Production bridge restarted
after verified listener/supervisor ownership; new supervisor86600 recorded in
.local/custom.pid. Local/stableHTTPS health pass; stableHTTPS usage supplies exact
reset timestamps and computer labels for Codex weekly, Claude session/weekly and
Cursor monthly. Physical phone/G2 timezone and toggle confirmation pending.
Simulator remains OPEN. No provider prompts or public publication.

2026-11-04 user requests Usage reset selector: computer local reset time,
phone local reset time, and "absolute" meaning remaining duration (2d5h12m).
Bridge now retains provider resetsAt epoch milliseconds and computes
computerResetDescription in its own OS time zone (America/Whitehorse observed).
Codex proxy fallback also retains reset instant; output remains allowlisted.
Read-only Orca usage check: Codex1, Claude2, Cursor1 timestamp-bearing windows.
Usage adds native top Reset selector; Click cycles Computer/Phone/Absolute,
persists usage-reset-mode, and updates three text containers without rebuilding
or re-fetching provider usage. Phone mode uses the WebView Intl local time zone;
Absolute subtracts current time from the exact reset instant, rounded up to a
minute/clamped0m. It refreshes every minute while the page is not being scrolled;
scroll pauses refresh to preserve native position. Double-click returns home.
Missing timestamps show Reset time unavailable in Phone/Absolute rather than
parsing ambiguous weekday labels. Original labels remain computer fallback.
107 tests/build/doctor pass. Synthetic native simulator verified all three modes,
calendar-day difference (Hong Kong computer fixture vs Whitehorse simulator phone),
remaining duration and unclipped top selector. Physical phone/G2 zone check pending.
Preview LEFT OPEN on Absolute; fixture8791 in
term_ef24fead-13e6-4db5-8c38-7e7ed00b332e, simulator9900 in
term_34a87732-acb9-4933-9f39-8885dd5949e1. Previous preview tabs were closed per
user request; these two named tabs are for this new feature's review.
No production bridge restart or beta upload; beta1.0.26 unchanged. Next release
requires both beta app update and bridge restart after user approval.

2026-11-04 user requests unused-tab cleanup in this workspace. Closed completed
G2 Menu Swipe Preview (term_ca89245d-e79b-4863-89c1-a65ddb9e8f8e) and isolated
fixture/Vite tab (term_fb9c320c-6a93-402e-b6bb-748a21072f5e). Orca confirms both
PTYs killed; two Codex agent sessions retained. No embedded browser tabs existed.
Production bridge health remains ok. Preview is now CLOSED at user's request;
recreate named Orca-managed preview processes when needed for the next change.

2026-11-04 user explicitly approves swipe-only paging beta after observing old
Previous/Next rows on installed1.0.25. Beta1.0.26 uploaded/promoted and channel
verified (49,179 bytes); public remains1.0.23.101 tests/build/doctor passed for
implementation; beta and restored prototype builds pass. StableHTTPS health ok.
App-only update; no bridge restart required. Simulator remains OPEN for review.
G2 paging confirmation pending; user must install1.0.26 in the Even app.

2026-11-04 user confirms workspace filter beta1.0.25 works on G2, then requests
removal of Previous/Next rows from main sessions and workspace checkbox picker.
Both now page on a swipe beyond the last/first row; next page selects first row,
previous selects last. Outer ends clamp without wrapping. Filter/Done/All rows
remain available on each page; capacity is seven sessions/checks plus two controls.
Page changes wait for old native cursor writes, suppress spinner writes and
repeated gestures/clicks during fetch, and cannot reopen a screen after system exit.
Checkbox selection/persistence remains unchanged; Agent filter's separate native
list is outside this change.101 tests/build/doctor pass. Native simulator verified
sessions00-06 ->07-13 and reverse selecting06; workspace picker07-13 without
navigation rows. Synthetic fixture has15 sessions/workspaces; no live input.
Preview LEFT OPEN on root workspace, simulator9900 in
term_ca89245d-e79b-4863-89c1-a65ddb9e8f8e; fixture8791 reused in
term_fb9c320c-6a93-402e-b6bb-748a21072f5e. Await preview approval before beta;
production bridge/beta1.0.25 unchanged. Prior workspace-filter G2 todo closed.

2026-11-04 user approves workspace-filter beta and requests local/origin branch
cleanup after PR completion. PR https://github.com/eugene8080/orca-glass/pull/1
merged into windows-android-codex as653b005 (merge preserves feature commits).
Beta1.0.25 uploaded/promoted and channel verified (49,081 bytes); public remains
1.0.23.97 tests/build/doctor passed for feature; beta/prototype builds pass.
Production scheduled bridge restarted after verifying listener/supervisor; new
supervisor55188 recorded in .local/custom.pid. Local/stableHTTPS health pass;
14 live sessions all include workspaceId/workspaceName metadata. G2 test pending.
Verified feature HEAD fully merged and worktree clean. Saved synthetic reviewed
captures under main .local/workspace-filter-reviewed-preview. Closed two feature
preview tabs plus verified empty default pwsh. Unlinked dependency junction without
following it; Orca removed feature worktree and local branch, origin branch deleted.
Verified feature path/local/origin branch absent and main dependencies intact.
No live provider input or public-channel change. User screenshot remains untouched.

2026-11-04 workspace-filter feature is isolated in Orca child worktree
C:/Users/eugen/orca/workspaces/orca-glass/workspace-filter on feature/workspace-filter,
based on windows-android-codex984ddbd. User requests a second session-list row
Filter by Workspace, multi-selection [x]/[ ], and right labels [workspace/Agent].
Implemented native text picker with Done/All workspaces and five workspace rows
per page. Toggles retain cursor position, persist exact Orca IDs, combine with
agent filter, and keep unavailable selections visible for clearing. All mode is
separate from explicit selection; explicit empty selection shows None. Child
worktrees remain distinct in picker; session labels use compact project names.
Thread API adds workspaceId/workspaceName/workspaceLabel. Metadata right column
widened to248px atx328; session titles use measured native width to prevent wraps.
Session paging reserves both filter rows (six first-page/five later sessions).
97 tests/build/doctor pass. Read-only live discovery identifies all14 sessions
across5 workspaces. Synthetic native preview verifies row placement, two checked
workspaces, unchanged toggle cursor and filtered rows with porttracker/Claude and
orca-glass/Codex labels. No live provider input, production restart or beta upload.
Beta1.0.24 remains live; feature branch not merged. Preview approval/G2 test pending.
Old approved-preview simulator closed; new preview LEFT OPEN in this worktree:
fixture8793 term_738e43fc-73ef-4113-85d5-2948b8812a54;
simulator9900 term_2f02b678-1002-4d32-bc22-74f64a7aeb5d.
app/node_modules is an ignored junction to the main worktree's installed deps.

2026-11-04 user confirms beta1.0.24 works on G2 after upload. Claude saved-chat /
blank-reader fix, concise progress and numbered-input feature group accepted;
move those items to Completed in TODOS.md. This is overall release confirmation,
not separate evidence for every native/voice edge case. Usage confirmation and
SDK popup/auto-follow requests remain open. Documentation only; no runtime change.

2026-11-04 user approves upload of the Claude reader/progress/numbered-input
preview. Beta1.0.24 uploaded/promoted; channel verified (48,244 bytes), public
channel remains1.0.23.91 tests/build/doctor passed for implementation; beta package
build and restored prototype build pass. Verified production listener/supervisor
before restarting scheduled bridge; new supervisor52988, .local/custom.pid updated.
Local/stableHTTPS health pass;13 connected sessions. Read-only Campaign session
history returns claude-transcript,442 messages/280956 characters. No live Claude
prompts/choices submitted. Native simulator stays OPEN; G2 verification pending.

2026-11-04 user requests short Claude thinking/progress and numbered prompt
controls with voice remaining default. Existing Claude session reading plus
user-initiated G2 selection/voice are authorized; no autonomous Claude prompts,
launches or live choice submissions for testing. readThread now returns a brief
public terminal activity summary (tool category or harness status word), never
tool arguments/results or transcript thinking. Saved chat stays visible; blank
live frames retain prior reply. Only Claude Working readers append one progress
line; native swipe still freezes body writes.
Claude AskUserQuestion parser supports wrapped descriptions, divider before the
final Chat about this option and native Enter-to-select footer. Full question +
options fingerprint invalidates stale choices, ignoring cursor movement. Reader
Click opens choices only while a current prompt exists; pick then Click confirms,
double cancels. Hold remains voice; reviewed spoken digits/one-nine/option N go
through captured menu ID and server revalidation, never free-text fallback. To
write a custom response, select Type something first, then use normal voice.
91 tests/build/doctor pass. Native simulator verified retained reply + Reading
files, five choices, full selected description, and native/voice option2 sends
only to synthetic fixture. Live screenshot's Campaign prompt had cleared at
read-only check (no live choice sent). User says Even Terminal chat presentation
is better; structural saved chat remains preferred, SDK auto-follow gap persists.
Simulator LEFT OPEN for review; production bridge and beta1.0.23 unchanged.
Preview approval required before next beta; G2 checks pending.

2026-11-03 Claude blank-reader diagnosis: user-directed read-only inspection of
LGT archive Retrieval in porttracker found terminal buffer occupied by filtered
tools and current Claude reply marker U+25CF unsupported by the old parser.
Exact Orca pane/incarnation/provider-session binding identifies saved Claude
JSONL; adapter now reads main user/assistant text blocks, excludes tools,
reasoning, sidechains and metadata, validates session/workspace/storage identity.
Current shell cwd may change after the transcript's initial workspace record.
App opens/polls verified claude-transcript alongside codex-transcript. Read-only
check returned654 messages/378501 characters; no private content committed.
83 synthetic tests/build/doctor pass; native simulator shows synthetic saved
reply while Working. Simulator LEFT OPEN. No Claude prompts/launches, production
bridge restart or beta upload; installed1.0.23 unchanged, preview approval pending.

2026-11-03 user approves usage preview and requests beta upload.1.0.23 uploaded/
promoted; channel verified (47,519 bytes).79 tests/build/doctor passed before
release. Production bridge restarted after verifying listener/parent process;
old .local/custom.pid was stale, corrected to newly verified supervisor PID.
Local and stableHTTPS usage endpoints return ok for Codex, Claude and Cursor;
observed Codex weekly64%, Claude5h4%/weekly2%, Cursor monthly~2.02%. Only usage
metadata read; no model prompts, Claude launches or provider browser interaction.
Ordinary prototype dist restored; simulator/Usage Preview kept OPEN. G2 usage
rendering remains pending user confirmation. No public publication.

2026-11-03 user supplies regenerated three-page policy PDF. Read/render confirms
blank optional rows remove specific sharing/categories, but AI unchecked yields
literal AI Used No (not no AI collection). Fixed retention/server/uninstall claims,
phone/address and reverse-engineering prohibition persist. Custom approved PDF
remains recommended; no new portal action or submission. Details store/listing.md.

2026-11-03 user requests Cursor/Claude usage from existing Orca sessions. Orca
account list reports Claude session3%/weekly2%, Cursor monthly~2.02%, Codex weekly
~64%. Bridge usage previously returned only Codex. New collectUsage retains all
three provider windows, strips account/auth metadata and raw errors, preserves
Claude/Cursor even if Codex proxy fallback fails. UI adds Monthly label and one-
decimal percentage display, provider display names.79 tests/build pass. Native
simulator verified all three using a sanitized real Orca usage snapshot injected
into isolated fixture; no agent prompts, Claude launch or authenticated provider
browser access. Production bridge NOT restarted; installed beta remains1.0.22.
Next1.0.23 after user simulator approval. Simulator left OPEN on Usage.
User also requests close unused pwsh tabs in this workspace: closed unconnected
Dev Server5173 (term_771aa5b7-f4dd-48de-82d2-a1644eca22ae) and Store Preview8792
(term_8e847b51-490a-482e-8dc1-02b3a280ac87); neither had active TCP clients.
Empty shell already exited. Both agent panes retained; simulator
term_70868121-7d70-44ee-9021-ae43e2bc4468 and Usage Preview8791
term_fb9c320c-6a93-402e-b6bb-748a21072f5e remain healthy. Keep simulator open.

2026-11-03 user requests store/icon cleanup: retained only selected
orca-glass-icon.png and matching orca-glass-icon.xcf, hashes unchanged. Removed
unused studies/previews/README; gallery now enlarges native PNG directly. Earlier
history below refers to removed studies retained in Git history. Third-party form
guidance: omit inactive prototype ntfy/Cloudflare; identify Tailscale and user-
configured LLM accounts as dependencies without claiming developer data sharing.
No portal regeneration or submission during this cleanup.

2026-11-03 user approves corrected PDF and requests review submission. Refreshed
portal still opens the exact original generated-PDF URL, not corrected local PDF.
Current beta1.0.22 manifest/build script still hard-code the private PC origin;
cannot serve arbitrary users' own bridges. No Submit for review clicked: approved
document replacement and public connection/setup remain concrete blockers. User
approval of corrected PDF recorded; no need to request that approval again.

2026-11-03 privacy generator completed and auto-attached PDF (no separate save),
all checklist items complete. Download/read shows misleading developer collection/
retention/sharing, reverse-engineering prohibition, and embedded phone/address.
CDN document retrieved without auth; no raw personal details/URL committed. User
corrects scope: own PC/Tailscale/LLM accounts, no Quiet Signal app-data collection
or sharing. Prepared store/Orca-Glass-Privacy-and-Terms.pdf plus Markdown/source
renderer: two pages visually checked, text/PII exclusions verified, MIT retained.
Portal replacement pending: inspected Edit offers fixed generator only; custom
upload not found. Existing generated attachment remains; do not submit it. No
review/publication/support message. User review PDF available via store/gallery.html.

2026-11-03 physical G2 confirmation: user confirms full-width session text and
marks remaining native-menu/moving-dot/selected-row slash checks done. Includes
retained OS controls and the already-confirmed Refresh/New Session/Usage actions.
TODOS.md moves reader-width and remaining G2 checklist into Completed. No related
hardware checks remain pending. Documentation only; no code/runtime/beta change.

2026-11-03 user approves full-width simulator preview and requests beta upload.
Beta1.0.22 uploaded/promoted; channel verified (47,461 bytes).76 tests/build/doctor
passed for width change; ordinary prototype dist restored after packaging. Existing
scheduled bridge supervisor identity verified and restarted to load formatter.
Local/tailnet HTTPS health ok; five live agent sessions; selected terminal-buffer
history now includes134-character source lines (no fixed50-character wrapping).
No transcript content printed for verification. Simulator remains OPEN on isolated
long-text preview; G2 width check pending. No public store submission/publication.

2026-11-03 reader-width preview: removed bridge's fixed50-character wrapping;
native proportional-font renderer now wraps original paragraphs to container width.
Explicit paragraph/code/source-terminal line breaks and / > role prefixes retained.
Reader body widened from544px at x16 to560px at x8, paddingLength0; six-row height,
frame/divider and three-row voice area unchanged.76 tests/build pass; official
native simulator long synthetic conversation reaches right edge without clipping.
No production bridge restart or beta upload: preview approval pending. Live bridge
retains cached old formatter until an approved restart. Next release1.0.22.
Simulator LEFT OPEN on long sample reader, automation9899; fixture8791 in Orca
terminal term_0867f568-c985-4b46-81a8-8aa32900bb98, simulator in
term_70868121-7d70-44ee-9021-ae43e2bc4468. Fixture sample saved in ignored
.local/reader-width-fixture.json. Store preview8792 retained separately.

2026-11-03 user enters phone/address themselves and asks to complete privacy
wizard. Portal now shows Quiet Signal and Personal Information complete. Selected
microphone/local network only; data collection AI checked, location unchecked;
entered voice audio/transcripts/agent-session data with local transcription and
confirmed-reply purposes. Next click blocked by Chrome extension UI. No final
privacy save/review/publication. Await user closing extension panel to continue;
do not bypass browser block or copy phone/address into repo. Source checks:
app manifest, bridge/whisper.mjs, bridge/server.mjs and app/src/pairing.ts.

2026-11-03 phone-publicity check: official Developer Terms3.1 allow display of
developer contact details but do not specify telephone. OcuClaw web catalogue
listing shows name, no contact section; mobile visibility not verified. Cannot
confirm phone stays private. Findings/sources in store/listing.md. No phone
entered or support message sent; contact wizard still unsaved.

2026-11-03 user chooses Quiet Signal and creates quietsignal.apps@gmail.com
for public support. Entered both in portal contact wizard, leaving phone/address
blank. Next returns Contact telephone is required; form NOT saved. Phone public
visibility and address requiredness remain unknown. No placeholder/personal
phone entered. Await chosen support number or clarification from Even; no publish.

2026-11-03 listing checklist: description was incomplete because Category was
unset. Saved AI category through portal; App description now complete. Privacy
wizard starts with contact information; Developer name required, email explicitly
public, phone/address fields present but requiredness unverified. No contact data
saved. User concerned about spam: prefer handle/dedicated support address; await
chosen public contact, leave personal phone/address blank. Privacy/terms remain
unfinished; no review/publication.

2026-11-03 user approves earlier store/icon/orca-glass-icon-preview.png,
explicitly correcting the v2 selection. Matching native24x24 orca-glass-icon.png
saved through Even Hub CLI update (success); refreshed portal visibly shows
the selected icon and App icon checklist complete. No build/promotion/review/
publication. Gallery updated to selected earlier design; v2 retained as study.

2026-11-03 user replaces icon starting point with store/icon/orca-glass-no-glasses.xcf.
Source26x24 retained unchanged. GIMP produces cleaned26x24 source with hidden
reference and no-glasses24x24 v2 adaptation; dimensions/colour/alpha/2x2-block
checks pass. Both revised XCFs opened in existing GIMP Icon Preview terminal.
store/gallery.html now shows revised versions. Visual approval pending; no
portal icon upload, beta change or public submission.

2026-11-03 user selects bottom-left orca-with-glasses design and requests GIMP
editing. GIMP3.2.6 Python-Fu produces layered731x731 cleaned master (hidden
original crop retained) and simplified24x24 candidate with2x2 blocks. PNG
dimensions/colour/alpha/block checks pass. Files in store/icon; preview added
to store/gallery.html. GIMP remains open in repo Orca terminal GIMP Icon Preview.
Candidate awaits user review; portal icon unchanged. No beta/public upload.

2026-11-03 Even Hub profile/screenshots prepared at user request. Name/tagline/
description saved; five native576x288 screenshots and stock Office cover saved
in portal. Session list has fictional Cursor/Pi/Claude/Codex/OpenCode; reader/
voice samples remain Codex. Sixth contextual-menu screenshot is supplemental/local.
User explicitly requires preview BEFORE Publish; no submission/publication or
beta change. Original2ero20ne attribution now in description/README; build emits
unchanged MIT LICENSE.txt plus ATTRIBUTION.txt, build and byte comparison pass.
Legal assets need a later version upload. Public blockers: one-PC-pinned origin,
blank developer/privacy fields, name consistency, existing hardware checks.
See store/listing.md and store/gallery.html. Isolated preview8792 and simulator9899
remain open in Orca pwsh terminals; no real agent/microphone interaction.

2026-11-03 user requests TODO follow-ups to monitor both filed SDK requests.
Added two unchecked entries to TODOS.md with GitHub44/45 and corresponding Discord
thread links, expected capabilities and awaiting-maintainer-response status.
This is task tracking only; no scheduled watcher/automation was requested or created.
Documentation only; no application/beta change.

2026-11-03 user authorizes external SDK request filing. Dedicated Eugene Chrome:
GitHub everything-evenhub issues44 (native popup) and45 (scroll-to-bottom) created;
separate even-hub-help Discord forum posts created and linked. User clarifies popup
PRIMARY use case is hold-to-talk with MORE visible input rows and NO session text
movement/reset when input window closes. Issue44 body edited accordingly and explicit
Discord-thread clarification posted; published content verified. All links in
 docs/sdk-feature-requests.md. This replaces prior no-submission status for these
requests only; no broader permission to send messages inferred. Await SDK response.
No application/runtime/beta changes.

2026-11-03 user narrows SDK priorities to native near-field framed popups and
native scroll-to-bottom/auto-follow of newest LLM text. Read-only Discord browser
search finds even-hub-help is a forum with existing SDK feature-request posts;
authentication thread cross-links official GitHub issue25 for tracking. Related
Oct31 SDK scroll/selection discussion found, no exact popup/auto-follow duplicate
identified in bounded inspected results. Submission guidance and links recorded in
 docs/sdk-feature-requests.md. No Discord message or GitHub issue submitted.

2026-11-03 user marks Compact native-text session menu trial done and asks TODO
cleanup. TODOS.md rewritten as current open work, optional verification/limitations,
confirmed completions and deferred scope. Full previous log preserved in
 docs/todo-history.md with explicit historical/superseded warning; compact trial
row closed there too. Remaining active items: latest1.0.21 G2 checks, identify bold
bar, final-only response filtering. Reboot and long-idle checks are optional
verification gaps, not current failures. No code/runtime/beta changes or tests.

2026-11-03 user explicitly confirms "Phone Failed to fetch follow-up" resolved.
TODOS.md row closed as Resolved; user confirmed. Exact earlier transient cause
remains unproven. Documentation only; no runtime/code/beta change.

2026-11-03 user explicitly marks "Menu compatibility diagnosis and smaller
markers" done. Corresponding TODOS.md history row closed. This confirmation is
scoped to that task; unrelated G2 checks and scrollbar request remain unchanged.
Documentation only, no beta/code change.

2026-11-03 user explicitly requests beta upload.1.0.21 uploaded/promoted and
channel verified (46,512 bytes): contextual Refresh/New Session/Usage, denser list,
selected-marker wrap fix.75 tests/build passed before release; ordinary prototype
dist restored. Simulator remains OPEN for review; G2 verification pending.
User asks for prior Even SDK feature requests for Discord; see
 docs/sdk-feature-requests.md. No message/ticket sent by agent.

2026-11-03 user requests move Refresh sessions/New Session/Usage to contextual
menu. Implemented session-list-only first-level actions1001/1002/1003; Filter by
Agent stays first list row. Native reader contextual menu remains OS-only. List
capacity now7 terminals first page/6 later (navigation rows fit nine native rows).
Marker-wrap preview fix retained.75 tests/build pass; native simulator verified
Refresh, New Session workspace picker (no launch), Usage demo and popup labels.
Leave popup OPEN for user approval in existing simulator terminal
term_f3709459-44be-4b71-b9a5-9ac192a45f0d. No beta uploaded: current beta1.0.20,
next release1.0.21 only after approval. Preview still shows1.0.20 manifest define.
Simulator omits OS Display off/Brightness/Close; hardware must verify those remain.

2026-11-03 user screenshot shows trailing idle slash displaced below row when
working session selected. Reproduced native marker-column wrap: arrow+separator+
three dot cells exceed narrow gutter. Unreleased preview fix removes separator,
uses32px gutter (title starts unchanged), at most four characters/selected busy
row.74 tests/build pass; simulator selected Fix flaky across all three dot frames:
changes confined to marker pixels, following idle row crop identical. Left simulator
OPEN with working row selected for review. Label still1.0.20, beta1.0.20 unchanged;
this fix is NOT uploaded. Bump next release to1.0.21 only after user preview approval.
Preview terminal term_f3709459-44be-4b71-b9a5-9ac192a45f0d remains running.

2026-11-03 user approves simulator: "looks good all aligned". Beta1.0.20
uploaded/promoted and channel verified (46,434 bytes),74 tests/build previously
passed. Native dot/title alignment G2 check pending. Simulator intentionally left
open in demo per review policy; ordinary prototype dist restored. Reader/bar
unchanged, scrollbar location question remains unanswered. No new1.0.21 work.

2026-11-03 unreleased1.0.20 aligns all session-list titles to the idle-session
start: adds one space to working titles, removes two from action-title padding.
Marker gutter stays separate; no activity-driven body rewrites remain.74 tests
and build pass; native simulator title/right-label crop identical across dot
frames. Version1.0.20 visible in demo; Vite restarted to refresh manifest define.
Preview left OPEN for user approval in Orca terminal
term_f3709459-44be-4b71-b9a5-9ac192a45f0d, dev server
term_771aa5b7-f4dd-48de-82d2-a1644eca22ae. Beta stays1.0.19; no1.0.20 upload.
Refresh sessions retained per user: activity polls3s, dot500ms, full roster on
Refresh/home. User asks remove bold vertical bar when opening active session;
likely native right-edge reader scrollbar, but location confirmation pending.
Installed SDK0.0.16 TextContainerProperty has no scrollbar visibility control.
Do not break native scrolling or claim the bar removed. Reader unchanged.

2026-11-03 beta1.0.19 replaces session-list raster markers with native text
in six containers. Working marker is one middle-height dot in three positions
('·  ', ' · ', '  ·'),500ms frames. Marker shares cursor gutter and serial/coalesced
updates; session titles/right labels never change on animation frames. Activity
poll updates title spacing only on busy transitions; Click waits for pending
spacing/cursor writes. All session names moved two spaces (~12px) left; working
session alone omits one additional space. Action titles retain their column.
Usage uses native smaller lozenge ◊ in marker gutter; ⋄ was missing in simulator
font and was rejected. Usage title aligns with other actions. Reader/voice unchanged.
74 tests/build/doctor pass. Native simulator frame diff confined to marker gutter,
label crop identical during swipe; navigation opens correct reader.1.0.19 beta
uploaded/promoted and channel verified (46,534 bytes);1.0.18 superseded by final
spacing/diamond/navigation guard changes. G2 animation/spacing check pending.
Simulator restored to unpaired localhost5173/?code= preview in Orca pwsh terminal
term_efcd8848-4201-42ff-9d4c-79257493a567. Ordinary prototype dist restored.

2026-11-03 native expanding middle-dot session-list trial is uncommitted1.0.18
source only, not beta.73 tests/build/doctor pass but simulator screenshot diff
shows working-session title movement during text replacement; do not ship this.
User says animation too wide, asks exact one-pixel outward steps. Public native
text cannot control intra-glyph pixel positions. Asked tighter approximate native
text versus exact-pixel drawn dots; answer pending. Preserve1.0.17 beta and all
hardware-confirmed alignment/gap behavior. Reader animation unchanged. Simulator
currently temporary demo in Orca terminal term_32039336-fb99-43b8-bbf1-8dd00e790806;
restore unpaired localhost5173/?code= preview when trial work finishes.

2026-11-03 user confirms no blank row between Orca-glass version title and
Filter by Agent on G2. Header gap check closed in TODOS.md. Count/filter right
alignment and shell exclusion also confirmed. Session-list spinner remains
unresolved: G2 accepts aligned native text/static fallback but rejects image
profile. No further layout confirmation pending; exact image rejection cause
still needs investigation. Documentation only; no new beta.

2026-11-03 user confirms selected filter ([All sessions]/agent) is right-aligned
on the Filter by Agent row on G2. Both count/filter alignment checks closed in
TODOS.md. Header-to-first-row gap remains unconfirmed; spinner unresolved.
Documentation only; no new beta. Next one-at-a-time check: title gap removal.

2026-11-03 user confirms connected-terminal count is right-aligned on G2 after
1.0.17 aligned native text/static fallback. Count alignment hardware check closed.
Selected-filter alignment and header gap remain unconfirmed; spinner unresolved.
Documentation only; no new beta. Next one-at-a-time check: selected filter alignment.

2026-11-03 G2 follow-up: user reports Menu layout Aligned native text (Static
markers) after1.0.17. This proves six-text aligned fallback accepted and full
marker-image profile rejected; shorter strips alone did not resolve rejection.
Spinner remains unresolved, and exact image/container constraint is unknown.
Count/filter visual alignment and header gap remain hardware-unconfirmed. Next
one-at-a-time check: connected-terminal count right alignment. No code/beta change.

2026-11-03 user confirms phone Menu Layout: Compact compatibility. This profile
intentionally disables marker images/animation and uses inline count/filter labels,
explaining reported symptoms without proving why G2 rejects the aligned profile.
Beta1.0.17 uploaded/promoted; channel verified (46,786 bytes). It tries short session-only84/28px image strips instead of144/116px strips;
image rejection now tries six aligned native text containers with static markers
before the proven three-text compact recovery. Persistent phone mode distinguishes
all three.73 tests/build/doctor pass. Native simulator spinner frames differ only
inside marker gutter; label crop is identical across swipe. Physical G2 acceptance
and right alignment remain pending. Header gap removal and shell exclusion included;
shell exclusion already hardware-confirmed. Reader/voice unchanged. Simulator restored
to unpaired localhost5173 preview in named Orca pwsh tab
term_e2a166c1-fe0a-4eb2-911a-59ec15288e82 after synthetic demo checks.

2026-11-03 user confirms1.0.16 runs on G2 again after phone Chrome healthz showed
ok:true. Earlier Failed to fetch report recovered; exact transient cause unknown.
Two old simulator instances stopped (standalone scheduled task and old cmd tab).
New named pwsh Orca terminals in this worktree: Dev Server
term_12e62966-65a9-47c3-bf80-00b73998961f (Vite5173 HTTP200), G2 Simulator
term_93ef9e42-e649-4968-85cf-b95d10f323c5 (desktop session1, automation9899 pong).
One simulator process remains; scheduled simulator task stopped. Preview uses
localhost5173 and currently needs its local pairing code; no demo substitution.
User explicitly requests repo terminal policy above. No beta upload; list spinner
still awaits phone layout-mode diagnosis.1.0.17 gap/shell source remains unreleased.

2026-11-03 user confirms current Filter row/contextual removal, native footer,
terminal UI chrome removal and voice send/cancel/chat retention. Count/provider
alignment meaning clarified, not newly verified. List spinner still failing.
Re-asked exact persistent phone Menu layout label; answer required to distinguish
disabled fallback from aligned renderer. Do not infer mode from missing transient
Status text. No spinner code change or new beta yet.

Unreleased1.0.17 source removes title-to-first-row gap (menu begins y28) and
excludes non-agent shell panes using agentIdentity or exact-pane agentType, no
provider allowlist. Actual cmd pane has neither field; four agent sessions
remain (Codex, Codex, Claude, Pi). Bridge restarted; frontend gap verified in
native simulator.72 tests/build pass. Hold beta upload pending spinner diagnosis.

2026-11-03 session-list Braille still not spinning per user. Asked phone Menu
layout label and exact marker (blank/slash/asterisk/static Braille); response
pending. Local exact-pane bridge reports orca-glass beta busy, so upstream state
is currently correct; rendering/mode not established. No new code/beta yet.
User asks remaining TODO confirmations: added current hardware-check list above
historical rows. Only spinner diagnosis, filter placement/alignment, native footer,
chrome filtering and voice completion need current checks; do not re-test
superseded/cancelled historical designs.

2026-11-03 user explicitly confirms on G2: host shutdown/load failure and screen
rejection recovered; input can fill all three transcription rows; session-menu
text no longer shifts during up/down swipes. These checks are hardware-confirmed.
Do not infer new confirmation of spinner, filter-row placement, native hint font,
exact alignment or terminal-chrome removal from this report. Documentation only.

2026-11-03 user confirms1.0.15 on menu and both Android/G2 open; startup recovery
is hardware-confirmed. No compatibility Status message seen does not prove mode,
as transient status can be overwritten.1.0.16 adds persistent phone layout label.
Filter by Agent is now first session-list row, selected filter on its right;
Refresh second, then New/Usage/sessions. Contextual menu has OS controls only.
First page can show4 sessions; later pages3 to leave both navigation actions.

Voice review/provisional captions omit headings, giving all three81px rows to
transcription. Click still sends; double-click cancels. Timer/input hint converted
from raster to native text with measured right padding; status/draft font now
matches. Braille/static marker icons remain tiny images only. Menu polls session
activity every3s so spinners can start/stop after opening; image strips layer
above title gutter and contain all icons so idle markers aren't erased. Native
cursor remains independent, stale marker frames coalesced; exit clears timers.
71 tests/build pass. Native simulator shows all three draft rows, cancel retains
chat pixels; SDK voice check no rebuild/body writes, exactly one fake send.
Native timer13m32s and hint verified in demo. G2 retest pending for1.0.16.
Beta1.0.16 uploaded/promoted and channel verified (46,614 bytes).

2026-11-03 force-stop clears host-load error but phone still shows our rejected
screen update.1.0.15 starts with minimal two-text native bootstrap, then rebuilds
the requested layout. Startup result1 can recover by rebuilding bootstrap once.
If aligned menu rejected, rebuild three-text compact fallback with blank input
capture and inline count/filter/provider labels; latch that mode for rest of app
run and skip marker images. Fallback uses one text update per move and supports
navigation; aligned layout still available where accepted. Widened cursor16→24px
to remove another firmware-size risk. Phone heading shows actual package version.
68 tests/build pass; official simulator forced aligned rejection via isolated
fixture, native fallback/cursor/session-reader verified visually. Normal startup
also checked. No claim of hardware recovery until G2 retest. See docs/session-list.md.
Beta1.0.15 uploaded/promoted and channel verified (46,390 bytes).

2026-11-03 follow-up after1.0.14 instructions: phone screenshot says Failed to
load: Bad state: Host shutdown did not complete; user also reports Glasses
rejected the screen update. Installed version not reconfirmed. The screenshot
message is outside Orca Glass's own strings and indicates Even host load/lifecycle
failure, not evidence that page compatibility is fixed. Asked Android Force stop
Even Realities, reopen and report host error vs normal open vs G2 page rejection.
No new app/beta change. Related public host-exit/image issue18 is not proof this
exact shutdown failure has the same cause. Await recovery result before changes.

2026-11-03 G2 rejects1.0.13 startup with result1. Candidate1.0.14 reduces menu
from9 to8 containers, merges markers into title column, normalizes IDs1..8 and
layers0..7. Prior menu had zOrder9 with9 containers; this is a compatibility
suspect, not a hardware-proven root cause. Blank capture/cursor/native columns
and tiny Braille strips retained. Startup latch is set before the one-shot call
so rejected startup recovery uses rebuild rather than repeating create.
67 tests/build pass, including ID/layer coverage and rejected-start recovery;
simulator menu/reader open. Reader/voice layout unchanged. G2 retest pending.
Beta1.0.14 uploaded/promoted and channel verified (46,064 bytes).

2026-11-03 user confirms1.0.12 G2 speed fixed but text shifts on swipes.1.0.13
separates blank event capture, static native text columns and cursor-only update.
Header version/count and Refresh filter/provider tags use dedicated right columns
with measured space padding (native has no alignment flag). Idle / and Refresh *;
active Braille uses only two20px-wide marker strips, no label/screen rasterization,
500ms serial guarded animation. Native simulator static title/right columns pixel
identical after swipe. G2 stability/alignment/spinner/speed check pending.

User authorizes larger reserved input area: six native chat rows (162px at y32),
three input rows (81px at y202), retaining title. Review shows one instruction
and two transcription rows. No separate screen. Synthetic native review/cancel/
send has no rebuild/body write; chat pixels identical after cancel.66 tests/build/
doctor pass. Existing small border images grow to84px height within reserved area.

User asks to remove terminal UI chrome across harnesses. Shared trailing-region
filter removes Codex input placeholder/model/path/session/shortcut footer and
recognized Claude/generic composer hints; real messages quoting them retained.
Actual Codex screen pattern verified; Claude tests synthetic only. Unknown agent
conversation parsing remains unsupported; no final-response-only change. See
docs/session-list.md and docs/session-reader.md.
Beta1.0.13 uploaded/promoted and channel verified (46,081 bytes).
Actual Codex readThread tail no longer ends in input chrome; Exited(status)
background-helper tool notices also excluded. G2 validation pending.

2026-11-02 user authorizes Nick-style native-text menu trial.1.0.12 sessions
page uses one multiline TextContainerProperty with > selection cursor; four
terminals/page, up to9 compact lines. Swipe updates one text container, no images
or animation timer. Rapid swipes coalesce to latest selected row; navigation
waits for pending cursor writes before reusing BODY. Filter page remains native
list; reader/voice unchanged. Row titles truncate at48 UTF-8 bytes preserving
handle/provider suffix.63 tests/build pass; official simulator compact rows,
cursor movement, selected session and contextual filter verified. G2 speed
trial pending; this follows published pattern, not verified Books source.
Beta1.0.12 uploaded/promoted and channel verified (45,260 bytes).

2026-11-02 Books v3.2.1 investigation only: exact Books source not found among
Nick Ustinov's29 public repos; optional app/source link requested. His public
even-g2-notes documents native-text custom menus (one text upgrade per cursor
move) and measured per-host-call overhead. Our1.0.10 navigation called
paintSessionList without its previous-pixels cache, causing all four image tiles
to upload serially on each move; no coalescing, so swipes could backlog. Native
text custom layouts may provide density without that image queue; not proof of
Books implementation.1.0.11 native list remains unchanged. See
docs/books-rendering-investigation.md for pinned sources and timing caveats.

2026-11-02 user rejects1.0.10 custom session-list rendering as too slow and
requests native text.1.0.11 restores native header/ListContainerProperty,
removes all session-list images and animation timers. Version/count/filter/
providers inline; / idle, * active, ? unknown snapshots. Native selection/scroll,
15 terminals/page.62 tests/build pass; native simulator selects reader correctly.
Reader/voice unchanged; English-only and /images ignore retained. G2 check pending.
Beta1.0.11 uploaded/promoted and channel verified (44,992 bytes).

2026-11-02 beta1.0.10 session-list redesign: version from app manifest, right
aligned total connected count/filter/provider labels, * Refresh, / idle and
raster Braille for active rows. Session list alone uses four image tiles plus
app-owned highlight/page selection (four terminals/page); animations update
changed tiles without rebuild or selection reset. Reader retains native scrolling.
List activity now joins exact worktree/pane state rather than terminal titles.
62 tests/build/doctor pass; native simulator row selection→reader, contextual
filter and right-aligned [Codex] verified; screenshot diff confined to spinner.
User requests /images ignored and English-only fork: root/images ignored,
manifest/UI/demo/templates/server/STT fixed English, legacy language preference
migrated, old language controls removed. Japanese README marked historical.
Live bridge reports busy/idle/unknown and legacy lang=ja prompts return English.
Unknown activity renders ? rather than falsely claiming idle. G2 check pending.
Beta1.0.10 uploaded/promoted and channel verified (45,860 bytes).

2026-11-02 user cancels six-row voice overlay; retain existing1.0.9 layout.
No layout choice remains pending. User asks whether verbose tool/thinking text
is already filtered to main response. Inspection: visibleMessage excludes tool
records/internal analysis but explicitly retains assistant commentary alongside
final_answer, plus unphased assistant messages. Terminal fallback uses heuristic
role/tool markers and cannot reliably distinguish progress commentary from final
answers. Thus current reader is not final-response-only. No filter code changed
for this question; do not claim full main-response filtering already exists.

2026-11-02 user leaves menu unchanged and explicitly declines app-managed Click
page advance; Click stays no-op. Six-row voice overlay trial failed native checks:
enlarged foreground image tiles cover chat but clearing leaves black regions;
background tiles plus separate native text overlap unchanged chat. Brightness-only
updates did not dim in simulator; sending a one-character partial update replaced
the body and lost position. All experimental source changes reverted, ordinary
1.0.9 build restored, simulator restored to localhost8787 demo. No new beta.
Asked layout preference: retain current chat/small voice area or reserve six voice
rows upfront (leaving about1–2 native chat rows). Await that answer before changing
layout. Trial screenshots under .local/large-overlay-*, native-large-*, partial-*.

2026-11-02 voice-border trial1.0.9: user authorizes bordered input overlay
provided mounted chat never refreshes/resets behind it. Added two precreated
280x64 image border tiles in reserved footer; capture/review toggles pixels only,
never rebuilds or updates body. Border tiles behind voice text (tested: images
above text masked it).59 tests/build pass; isolated native simulator fake audio
review/cancel/send: no rebuild/body write, one complete fake send, chat text crop
pixel-identical. Scrollbar alone changes as it fades. Normal polling resumes after
successful send. Native chat still owns swipes; no optical-depth claim.
Sequential contextual menus cannot auto-open via public API; replacement needs
another Menu gesture and always includes system slots. No native scroll/End/
Page Down command exists; click remains no-op pending a supported alternative.
One worktree is sufficient because all changes touch shared reader controller.
Beta1.0.9 uploaded/promoted and channel verified (47,673 bytes); G2 trial pending.

2026-11-02 user confirms Filter by Agent works on G2 and includes Pi and
Cursor alongside Claude/Codex. Dynamic provider discovery/filter behavior is
hardware-confirmed. This does not verify near-field submenu depth or reading
conversation content for those providers. Documentation only.

2026-11-02 user confirms spacing issue fixed on G2: no more restartedor.
Terminal row-boundary spacing repair is hardware-confirmed. Documentation only.

2026-11-02 user confirms phone listing showed1.0.6 and has now updated to1.0.8.
Phone update-availability report resolved by user confirmation. This does not
explain the historical CLI tester-roster Invited status. No new build needed.

2026-11-02 user confirms menu label Filter by Agent on physical G2.
Label verification complete; this does not verify a near-field filter submenu.

2026-11-02 further beta1.0.8 G2 confirmation: Braille spinner is visible,
thinking/pondering labels animate, dots cycle . / .. / ..., and response timer
is present. This verifies rendering/animation and timer visibility; exact
five-second cadence and numerical timer accuracy were not explicitly checked.
Documentation only; no new build needed.

2026-11-02 user verifies beta1.0.8 on physical G2: session click does nothing,
frame and divider are present, slash appears before Waiting input, and
[Tap & hold to input] is visible. These four checks are hardware-confirmed.
Spinner/timing, provider duration, filter rename and voice flow are not newly
verified by this report. Documentation only; no new build needed.

2026-11-02 reader1.0.8 supersedes click controls: session click does nothing,
including numbered terminal choices; removed Resume/Earlier/Later/Back menu.
Voice review click-to-send remains. Idle slash is native text rather than an
image. Frame/divider now borderColor15 (SDK white), width2; previous level1
was too dim on G2. Menu/page renamed Filter by Agent.58 tests/build pass;
native simulator shows slash/bright frame/divider and click leaves identical
pixels. Beta1.0.8 uploaded/promoted and channel verified (47,455 bytes).
G2 check pending. See docs/session-reader.md.

2026-11-02 reader1.0.7: solid frame/divider, compact / user and > assistant
turns, tools/reasoning excluded. Bottom status has Gray8 Braille spinner (native
simulator font omits Braille), five-second word rotation and 500ms dots. Hint is
rasterized right-aligned; elapsed duration immediately precedes it, sourced only
from Codex's actual Working status line via activity.elapsedSeconds, never a UI
clock. Missing/unsupported duration stays hidden; cleared when not working.
62 tests/build/doctor pass; official native simulator screenshots show spinner,
word changes and stable13m32s fixture timer with unchanged chat pixels. Live
selected session activity returned working/1282 seconds. Bottom review/native
scroll preserved; no agent input or Claude tests. See docs/session-reader.md.
Beta1.0.7 uploaded/promoted and channel verified (47,887 bytes). Physical G2
validation remains pending. Filter submenu depth remains unresolved.

2026-11-02 G2 confirms beta1.0.6 Display off/View options/Brightness/Close all
present; simulator-only missing system rows is not a G2 regression. User asks
rename Filter Agents and native near-field filter submenu. Rename prepared in
source/tests;56 tests/build pass. Latest SDK0.0.16 has first-level actions only,
closes popup on selection, no submenu/open-menu/optical-depth API. Asked choice:
put agent choices directly in native Menu, or retain renamed normal-distance
filter page. No new beta uploaded while that design choice is pending.

2026-11-02 beta1.0.6: sessions-list contextual menu adds View options >;
session reader has system-only menu. Provider filter persists (All Sessions,
Claude, Codex plus providers in current local sessions); selected label has ✓.
Native OS owns Display off, Brightness and Close, including order/close wording;
SDK cannot set exact close toast. App manifest/portal display name now Orca Glass.
56 tests/build/doctor pass; simulator verified menu action/filter and removal
inside a reader. Simulator omits OS slots; G2 brightness/off/close/glyph checks
remain pending. No app-owned scrolling, fake display-off, or provider launch.

2026-11-02 latest user ruling: retain smooth native scrolling; reject app-owned
line scrolling; remove separate review screen and restore bottom-panel review.
Beta1.0.5 implements that rollback plus fixed status payload (no layout fields
in textContainerUpgrade) and initial activity fetch. Simulator visually verified
Working/Waiting/live reply; reader pixels identical through record/review/cancel/
send, no rebuild/body writes in native log.50 tests/build/doctor pass; beta1.0.5
uploaded/promoted. G2 retest pending. Draft swipes are not separately focused;
do not claim they are. This supersedes candidate/review rulings below.

2026-11-02 user rejected beta1.0.4 review rebuild/chat reset and reported
Status unavailable on G2. Candidate1.0.5 restores bottom-panel review and removes
the full-page fallback; initial activity is fetched before reader rendering.
Do not upload/promote another beta before simulator interaction checks. Automated
simulator launch was rejected (blocked by policy); user asked to run npm run
sim:check. scripts/simulator-fixture.mjs uses real SDK/rendering with fake
sessions/audio. Native chat movement during bottom-panel review remains
unverified; SDK cannot switch isEventCapture via textContainerUpgrade. See
docs/simulator-check.md. Prior1.0.4 no-rebuild exception below is revoked.

2026-11-02 beta1.0.4 supersedes prior no-rebuild review constraint: after hold
release, a dedicated review page owns scrolling through the full transcript,
click sends once/double cancels. Returning rebuilds the selected chat block;
native pixel scroll position cannot be restored. Saved-history source loss now
falls back to live screen, and rejected live uploads retry without marking text
displayed. 50 tests/build/doctor pass; beta1.0.4 channel verified. G2 retest pending.

2026-11-02 beta1.0.3/1.0.4: reader's reserved bottom voice area shows Working…,
Waiting for input, Needs attention or Status unavailable using exact-pane Orca
activity, not the mutable terminal title. Status polls while reader text is
paused; capture/review owns the panel, then status resumes without chat rebuild.
Cancel retains paused text. 47 tests/build/doctor pass; live endpoint verified
working and waiting; beta channel1.0.3 verified. Phone/G2 retest pending.

2026-11-02: user requested removal of the Codex-only existing-session filter.
List/read/history/reply now accept all connected non-orphaned local terminals,
including OpenCode child workers. This authorizes user-directed existing-session
access across providers; it does not authorize agent-run Claude tests or launches.
New-session creation and the separate native AI router remain Codex-only.
Saved Codex transcript identity checks remain; other providers use terminal text.

2026-11-01 live replies after Send: successful voice submission now restarts
reader polling in place, using the original saved-history/terminal source. No
page rebuild is needed to dismiss the voice area. Cancel leaves reading paused.
Scrolling pauses updates again. This supersedes the earlier requirement to choose
Resume latest output after every send. 36 tests/build pass; hardware retest pending.

2026-11-01 hardware confirmed foreground text is transparent and overlaps the
chat. Replaced overlapping layout with a reserved bottom quarter: voice area
x0/y216/576x72, reader x0/y40/576x168, 8px gap. Chat remains mounted through
record/review/dismiss. The bottom quarter stays reserved when empty; this is not
an opaque popup. 36 mocked tests/build pass; hardware layout retest pending.

2026-11-01 foreground-panel regression: Eugene reported hold did nothing.
Exact native cause is unconfirmed. Initialize the panel with a dimmed space
instead of an empty string, show/hide with textColor 4/0, and fall back to the
standard recording screen if a panel update rejects. Hold/release prioritization
now checks all event envelopes; phone Status reports hold and recording stages.
36 mocked tests/build pass. Hardware retest pending; fallback can reset reader
position. No ticket submitted and no provider inference or Claude tests.

2026-11-01 voice foreground panel: reader pages pre-create a blank 288x144
text container at zOrderIndex 2 above the persistent chat. Hold/captions/review
update only that container; Send/Cancel clears its text without rebuilding or
rewriting the reader. Polling remains paused until Resume latest output. Hardware
must confirm empty-container transparency, overlapping text appearance, and
scroll retention. No optical depth control is claimed. No ticket submitted.

2026-11-01 latest voice ruling: release finishes transcription and displays the
text with Click=send / Double=cancel. No automatic submission. Draft remains
cancellable on system exit and sends at most once. User explicitly said not to
submit any SDK ticket. Native Terminal visibly auto-scrolls from top to bottom,
but installed SDK 0.0.16/public reference exposes no command to reproduce that;
auto-scroll remains unimplemented. Keep the working native reader intact.

2026-11-01 hardware correction: Eugene received "Glasses could not load the
selected text" with the 2,000-byte reader. Restored the known-working 900-byte
budget, keeping intact blocks, end-aligned latest text, and no replacement on
scroll gestures. Larger update support on this device is unverified. This
supersedes the size in the entry below. Same URL/QR; hardware retest pending.

2026-11-01 latest reader revision supersedes bottom-first windows and automatic
section switching below. Eugene rejected five-line chunks. Reader now sends intact
blocks up to 2,000 UTF-8 bytes via empty-page + textContainerUpgrade when needed.
Blocks fill from the end so latest is not a short remainder. Scroll events only
pause polling; firmware owns movement. Earlier/Later controls switch full blocks.
Native Even Terminal host returns up to ten whole messages but its native mobile
renderer is not in the installed Windows package. Matching its full history span
is not achieved. Hardware retest pending; existing QR/runtime unchanged.

2026-11-01 approved UI: hold directly from chat starts voice regardless of old
recording-mode preference; release sends, double-click cancels. Single click opens
only Resume latest output / Earlier text / Later text / Back to conversation, or
actual numbered choices. Upward navigation temporarily shows the bottom six-row
window of the previous section first, then traverses its remaining windows. No
native scroll-position API is claimed. Native Even Terminal was also restarted
at Eugene's request through the existing pc-settings proxy launcher; see
docs/native-terminal.md for verified runtime facts.

2026-11-01 history update: bridge/conversation.mjs reads Orca's profile-state.db
read-only and uses the exact recorded pane/incarnation/Codex session association to
load saved user/assistant messages. No folder/newest-file guessing. This session
returned 163 saved messages versus a terminal screen. Missing associations fall
back to the terminal buffer. Text boundary events now load adjacent sections;
hardware smoothness at section transitions is pending. See docs/voice-input.md.

2026-11-01 current ruling (supersedes older runtime notes below): Eugene rejected
the separate native Even AI spoken-navigation router. Keep the custom visual UI.
Warm local Whisper with incremental previews and firmware overflow scrolling are
implemented; hardware verification remains pending. Hold release sends final text
once; tap mode retains review. See docs/voice-input.md.

Read TODOS.md and docs/native-terminal.md before continuing setup. The active
route is official Even Terminal over Tailscale, with Codex as default. Its
provider default does not prohibit a client from selecting another provider.
The user chose to develop the custom Orca bridge on 2026-10-31, with sentences as
primary input and exact choices only for explicit menus. Reuse upstream code.
Public Even Hub SDK exposes PCM, not native transcription; reuse the upstream
Whisper flow with Windows support. See docs/voice-input.md for verified scope.
The experimental fork uses a local Node bridge and an HTTPS Cloudflare Quick Tunnel;
that runtime was started for hardware testing on 2026-11-01. Local/HTTPS checks
passed; Eugene confirmed G2 display, tap/hold capture and correct local transcription.
See docs/windows-android.md and .local/custom.pid. Native Even AI echo was also
confirmed; its endpoint now runs in Codex-routing mode after explicit voice target
selection. See docs/native-ai-voice.md. Native Codex send awaits hardware verification.
Direct Even WebView-to-Orca mobile protocol transport is not implemented.
Do not claim phone or glasses verification from desktop tests or mock menus.

Use `npm test`, `npm --prefix app run build`, and `npm run doctor` for local checks.
Pairing tokens, local runtime state, and QR files stay untracked. Stage explicit
paths only. No public marketplace publication without a user request.
