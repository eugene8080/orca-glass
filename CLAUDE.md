# Orca Glass fork
Updated: 2026-11-02

Read the machine-level instructions first. This fork targets Windows desktop
Orca, the Even Realities Android app, and G2 glasses.

## Explicit user constraint

Codex only. Do not launch, test, or interact with Claude until Eugene explicitly
authorizes it. Keep server-side provider restrictions in place. Historical
upstream Claude code is not evidence of authorization to test it.

## Current work

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
