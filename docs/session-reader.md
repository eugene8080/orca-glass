# Session reader

## Book-style paging — 2026-11-04

Release update: user approved beta1.0.29. Upload/promotion verified50,436bytes;
116 tests and beta/prototype builds pass. StableHTTPS health ok. App-only release;
production bridge unchanged. Simulator remains OPEN. Physical G2 check pending.
The implementation's held-release notes below are historical.

Session readers now show six explicit native text rows per page, constrained to
900 UTF-8 bytes and measured to550px inside the560px body. Long words split by
Unicode code point; ordinary words and source list labels remain intact. Original
bullets, nested indentation and numbers are preserved; no renumbering occurs.
Eugene clarified that Campaign's source list is nested, not a flat1-19 list.
Other app screens retain their prior text behavior.

Open starts on the latest page. Up/down moves one full page, clamped at the ends.
The bottom-right hint's third row shows Page X of Y in native text; the session
title remains at the top. No extra containers. Browsing freezes the snapshot/count
while activity and question detection continue. Reopening or sending resumes live
newest-page updates. Page writes serialize with live writes and coalesce rapid
swipes. This replaces the prior inaccessible900-byte sections.

Voice hides the hint/counter, preserving three transcription rows. Cancel restores
the same page without rebuilding or rewriting the body; send resumes live updates.
Hold waits for pending page writes and checks release before enabling the mic.

116 tests/build/doctor pass. `scripts/check-reader-pages-simulator.mjs` uses a fresh
isolated simulator9900 and fixture8791, sets synthetic text, traverses8 pages both
ways, checks every character, two-digit items1-19 and nested bullets, clamps first
page, then records/cancels without a body rewrite. Preview OPEN on Page6of8 in the
existing root named Orca tabs. Captures in `.local/book-reader-preview` are not
visual proof: screenshot API returns solid green. User preview approval and G2
confirmation pending; beta1.0.28/production unchanged. No real provider input.

Earlier native-scroll behavior and section notes below are historical.


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

Updated: 2026-11-03

2026-11-03 user confirms native footer text fixed, terminal UI chrome removal
fixed, and voice completion behavior fixed (send/cancel/chat retention checklist).
These follow earlier three-row input confirmation. No new reader work required
by this report; list spinner remains separate and unresolved.

2026-11-03 hardware confirmation: User confirms all three input rows can be filled with text on G2. This verifies the full three-row transcription area; no instruction heading consumes a row.

Version1.0.16 removes the review instruction heading and provisional Listening
heading; captions/transcription now occupy all three native input rows. Click
still sends and double-click cancels. Timer and input hint are native text,
replacing the18px Arial raster that looked different; measured right padding
matches the native column approach. Braille alone remains raster in the reader.
Isolated simulator shows three explicit draft lines; cancel chat crop identical,
no voice rebuild/body rewrite, one complete fake send. Native timer/hint also
verified with demo13m32s.71 tests/build pass; G2 appearance remains pending.

2026-11-03 version1.0.13 reserves six chat rows (y32,height162) and three input
rows (y202,height81), with a28px title and divider at y198. Review displays an
instruction row plus two transcription rows. The voice border grows to84px at
y200, never overlaps body ending y194. Isolated native simulator verifies all
three input rows visible, no voice rebuild/body update and chat pixels identical
after cancel. This implements the user's two/three-row request, not the cancelled
six-row overlay. Native font size remains unchanged.

Terminal UI chrome filtering now removes recognized trailing input composers,
model/path/session status lines and shortcut hints. Codex's actual placeholder
Ask Codex to do anything plus GPT/model/path and left-arrow shortcut footer is
covered. Claude/generic empty prompts and shortcuts/permission hints have
synthetic coverage only. Filtering is confined to terminal fallback; genuine
conversation messages quoting those strings survive. This does not add support
for otherwise unknown agent conversation formats or exclude public commentary.

User subsequently cancelled the six-row overlay. Keep1.0.9 layout; the layout
choice below is closed, with no new build required.

Filtering clarification: structured Codex history excludes tool records and
internal analysis, but currently retains assistant commentary, final_answer and
unphased messages. Progress updates therefore still appear; it is not a strict
final-response-only view. Terminal fallback uses marker heuristics and cannot
reliably identify all progress messages. User reported remaining verbosity; no
filter implementation changed in response to the informational question.

Six-row trial, not released: user requested a larger review box while preserving
background scroll. Official native simulator showed that enlarging the foreground
image over chat masks it and clearing those tiles leaves black regions. Moving
tiles behind chat avoids that artifact but native voice text overlaps chat.
Brightness-only body upgrades did not dim it in the tested simulator. A partial
one-character update did trigger the brightness change but replaced body content
and lost the position. Pixel checks failed. All experimental source was reverted;
ordinary1.0.9 build restored. No new beta was uploaded. A layout decision is
pending: current chat with small voice box, or six voice rows reserved at session
creation with only about1–2 native chat rows left visible.

User explicitly retains the existing contextual menu and declines Click page
advance after its difference from native scrolling was explained. Click remains
no-op. Do not implement app-managed Click paging from the earlier request alone.

Version1.0.9 voice trial: two precreated280x64 image tiles draw a border around
the reserved footer at x8/y220, total560x64. They sit behind voice text, within
the four-image limit. Border uploads share the serialized panel queue and clear
on dismissal. The body is neither rebuilt nor rewritten throughout recording,
transcription, review and cancellation. Successful send resumes normal polling.
This is an app-drawn footer overlay, not native optical near-field depth; swipes
remain with native chat.59 tests/build pass. Official isolated simulator checks
with fake audio show no rebuild/body writes, one complete fake send and identical
chat text pixels through review/cancel/send. Scrollbar fading changes only its
own pixels; no real agent input or Claude interaction occurred.

Sequential native menus: replacing menuObject changes the next menu registration
but does not open it. There is no public open-menu command, and system entries
cannot be removed. A second Menu gesture is required. Native Page Down, End and
scroll-down commands likewise are not exposed. Session click remains unchanged;
no content replacement workaround was introduced. These reader changes share
state/rendering and are maintained in one worktree rather than three.

User confirms Filter by Agent works on G2, with Pi and Cursor visible alongside
Claude and Codex. Dynamic provider discovery and filtering are hardware-confirmed;
this report does not establish conversation parsing or near-field submenu depth.

User confirms the terminal spacing repair on G2: no more `restartedor`.
The row-boundary spacing fix is hardware-confirmed.

Hardware confirmation: user verified on G2 that session click does nothing,
the frame and divider are present, `/` appears before Waiting input, and
`[Tap & hold to input]` is visible. This confirms those four beta1.0.8 checks;
The user subsequently confirmed visible Braille spinner, animated thinking and
pondering labels, cycling . / .. / ... dots and response timer present on G2.
Exact five-second cadence and numerical timer accuracy were not explicitly
checked. User also confirmed the menu label Filter by Agent on G2. Voice flow remains
a separate check; near-field filter submenu behavior is not verified.

Version1.0.8: clicking the session reader does nothing, even if the terminal
contains numbered choices. Resume latest output/Earlier/Later/Back controls
are removed. Existing voice-review click-to-send and double-click navigation
remain. The idle slash is native text. Borders use level15 (white in the
simulator's documented firmware palette), width2; prior level1 was too dim on
G2. Filter menu/page label is now Filter by Agent.58 tests/build pass;
native simulator shows all three decorations and reader screenshots are pixel
identical before/after click. The four hardware checks above subsequently passed.

The reader has a solid outer frame and a divider above the reserved status/voice
area. User messages begin with `/`, assistant messages with `>`, with hanging
indentation and no spacer row between turns. Verified Codex transcripts supply
conversation messages only; reasoning/tool records are excluded. Terminal fallback
recognizes Codex/Claude role boundaries and excludes tool/status rows. Unknown
terminal formats display an unavailable notice rather than expose unfiltered
tools or reasoning. No live Claude interaction was performed.

Working status cycles the requested ten Braille patterns every200ms. Words rotate
every five seconds through Processing, Thinking, Pondering, Cooking, Computing,
Inferring, Burning Tokens; dots cycle one/two/three every500ms. The simulator font
omits Braille, so exact Unicode dot patterns are drawn as a20x28 Gray8 image.
The input hint uses a280x28 right-aligned raster at x280/y224.

Elapsed time appears immediately before `[Tap & hold to input]`, for example
`13m 32s [Tap & hold to input]`. The bridge extracts Codex's reported duration
from its current `Working (... • esc to interrupt)` terminal status. It returns
`elapsedSeconds` with the exact-pane activity response. The app formats this
value only: no timer starts on opening a conversation and no client clock
advances the displayed duration. Missing duration and non-working state hide it.
Other providers currently have no verified elapsed-time source.

Status and hint uploads are serialized with voice panel writes. Capture/review
owns the reserved bottom area; restoration does not rebuild or rewrite chat.
Native scrolling and existing pause/resume behavior remain.

Validation:62 tests, TypeScript/Vite build and doctor pass. Official simulator
automation9899 screenshots show frame/divider, visible spinner, changing words
and right-aligned13m32s fixture value remaining unchanged across animation.
Live bridge selected Codex session returned working with1282 seconds. Hardware
G2 rendering/voice checks remain pending; simulator screenshots are not proof of
hardware optical depth. Filter Agents retains its existing normal-distance page;
the SDK has no supported nested near-field submenu API.

## Firmware font widths (2026-11-04, beta 1.0.30)

Reader pages, session-list titles and right-aligned labels now use measured native
glyph advances (`glassTextWidth` in `app/src/text.ts`) instead of browser Arial 21px,
which over-measured by ~10-15% and stopped rows 8-10 letters short. Advances for
printable ASCII were measured in the official native simulator from bar-delimited
rows of 13 and 26 repeated glyphs; other characters still use Arial (an overestimate).
560px rows render on one line in the simulator; the reader wraps at 552px for slack.
A right-padded 278px line wrapped in a 280px hint container while 277px fit, so
`nativeRight` keeps 3px slack. List titles share the full width under the label column
and are fitted per row to end 8px before their own label. Hardware font fidelity is
not yet confirmed on G2.

## No title row, seven chat rows (2026-11-04, beta 1.0.31)

The reader no longer shows the session name. Its head container stays in the page
(container IDs and layers unchanged) with blank content. The body starts at y4 and
holds seven 27px rows (y4..193) above the divider at y198; pages hold seven rows.
On G2 beta 1.0.30, 'Page 20 of 21' (277px with padding) was cut in the 280px hint,
so `nativeRight` slack rose from 3px to 6px (maximum 274px).

## Swipe down on the last page refreshes (2026-11-04, beta 1.0.32)

Browsing freezes the reader snapshot, and the 1s poll skips frozen readers, so a
session looked stale after any swipe until a send or reopen. A swipe down while on
the last page now calls `refreshReader`: it clears the freeze, shows `Refreshing…`
in the page-counter row, runs one poll tick at once (`startReaderUpdates` returns its
tick) and restores `Page X of Y`. New output jumps to the newest page; live polling
then continues. Repeated swipes during a refresh are ignored.

## Open at the top of the latest response (2026-11-04, beta 1.0.33)

Reader text marks turns with `/ ` (user) and `> ` (assistant). A turn can contain
several assistant messages (progress notes, then the final answer), so
`latestResponseStart` in `app/src/text.ts` returns the start of the LAST assistant
message after the last user line. `readerLayout` paginates the text before and from
that point separately, so the response begins at the top of a page (the page before
it can be short) and records `responsePage`. Opening a session (`openAtResponse`)
shows that page once. Live updates and the swipe-down refresh still follow the
newest page. Text without turn markers (terminal fallback) opens at the newest page.

## Nine chat rows, one status row, full-screen voice (2026-11-05, beta 1.0.34)

User request: allocate nine rows to chat and one bottom row reading, for example,
`/Waiting Opus5.5 [Tap&Hold for Input] Pg77/78`. The reader body is nine 27px rows
(y4..247); a divider sits at y250 and the status row at y254. The row is two text
layers: `voice` (left: status word, or the spinner image plus working word, then the
model) and `hint` (right-aligned: provider timer while working, the hint and
`PgX/Y`). `readerHint` reserves the widest left text the state can show and picks
the longest hint from `[Tap&Hold for Input]`, `[Tap&Hold]`, `[T&H]`, none that fits
(measured with the firmware glyph widths, 6px slack).

The model comes from the bridge: Claude transcripts stamp `message.model`
(`claude-opus-5-5` -> `Opus5.5`), Codex transcripts record `turn_context` model and
effort (`gpt-6-astra` + `medium` -> `GPT-6-Astra med`), and terminal-only Codex
sessions fall back to the footer `GPT-6-Astra medium · <cwd> · <title>`.

Hold now opens a full-screen voice page (rebuild, already listening while held):
nine scrollable transcript rows, a divider and one instruction row (`Listening…
release to review`, `Transcribing…`, `Tap to send / Double tap to cancel`). Send
or cancel rebuilds the chat at its newest page, not the latest-response page. This
supersedes the earlier rule that voice must never rebuild the chat; the user chose
full-screen review explicitly. The voice-border images are gone, so the reader page
has seven containers (IDs 1..7, layers 0..6) and the voice page four.

## Small text (2026-11-09, revised)

The Even SDK has no font or size control for native text. In small-text mode the
whole screen (2px frame, chat, divider, status row) is drawn on the phone and sent
as four 288x144 greyscale image tiles, together exactly the 576x288 canvas (SDK
maximum: four images). One blank full-screen text container (ID 1) underneath
receives swipes; tiles are IDs 2..5. Only tiles whose pixels changed are re-sent.
The long-press menu on the reader: `Text: native`, `Text: Spleen 6x12`,
`Text: Spleen 8x16`, `Text: JetBrains Mono` (saved as `reader-text`) and, in a small
mode, `Display test pattern`. Code: app/src/fine-text.ts.

Every font is a fixed cell of whole pixels copied from a glyph table
(app/src/fonts/glyphs.ts, built by scripts/build-fine-fonts.py): no canvas text,
no anti-aliasing. Each font uses its own native cell, never a scaled size.
- Spleen 6x12 (bitmap, BSD-2-Clause): 93 columns x 21 rows. Has Braille.
- Spleen 8x16 (bitmap): 70 x 16. Wraps diagrams wider than 70 columns.
- JetBrains Mono 10px (OFL-1.1), rasterised once by FreeType in monochrome (hinted)
  mode; its metrics give a 6x14 cell (advance 6, ascent 11, descent 3): 93 x 18.
  A 6px cell is too small for a vector font: letters such as A and m are crude.
  (1.0.38 drew it with canvas text, which the user saw as anti-aliased on the G2.)
- Missing glyphs: Braille as 2x4 dots; others via the WebView monospace font,
  thresholded to on/off.
- Status row in the same font. The spinner steps once a second in small mode (each
  frame re-sends the bottom-left tile); the timer shows whole minutes.
- Display resolution: Even's specs list the panel as 640x350; developer docs give
  apps 576x288 (4-bit) and a full-screen image refresh of about 800 ms. Nothing
  published says whether the canvas is shown 1:1 or scaled. The test pattern
  (1px gratings at 2/3/4px periods, checkerboard) shows uneven or soft lines on the
  G2 if it is scaled. Sources: https://hub.evenrealities.com/docs/build/display,
  https://vrarwiki.com/wiki/Even_Realities_G2, everything-evenhub issue 48.
- Simulator 2026-11-09: all three fonts, diagrams, test pattern and Braille spinner
  frames verified. G2 legibility, scaling and page-turn time unmeasured.
- Status row order (2026-11-09): model first, then status, so the model never moves
  while the working words rotate. Native: the spinner image sits after the model
  name (x = 16 + its measured width); a model change rebuilds the page.
- Fonts added 2026-11-09 (user request; monospace only, enforced by the builder):
  Departure Mono 1.500 (OFL-1.1, Helena Zhang; native 11px grid, 7x14, 80 x 18, has
  box drawing), monogram (MIT per its GitLab source, datagoblin; author's bitmap table,
  6x12, 93 x 22), Pixeloid Mono (OFL-1.1, GGBotNet, from the author's DaFont release;
  native 9px grid, 6x11, 93 x 24). Pixeloid reserves its font name and our glyph
  table is a converted version: the menu names it only to identify the source; review
  before any public release. Box drawing missing from a font is drawn geometrically.
- Borders: frame and divider are single-pixel lines in native text (borderWidth 1,
  divider height 1) and in small text (2026-11-09 user request). Spleen 6x12 now 93 x 22.
- G2 2026-11-09: user reports the test pattern lines uniform (no visible scaling), but
  the 1px checkerboard looks blotchy ("camouflage"). 2px and 3px checkerboards added
  to tell pixel/optics limits from resampling.
- Thinking indicator (2026-11-09 user choice "Scanner sweep"): tile modes draw a
  scanner light (8 segments, 5px each, head plus three dimmer grey tail levels)
  between the model and the status words, one step per frame (1 frame/s, 14-frame
  round trip). Native text keeps the spinning Braille image.
- 2026-11-09 user removed Spleen 8x16 (menu, glyph table, builder). A saved
  'pixel16' choice falls back to native text.
