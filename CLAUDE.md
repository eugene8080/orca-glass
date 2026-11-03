# Orca Glass fork
Updated: 2026-11-03

Read the machine-level instructions first. This fork targets Windows desktop
Orca, the Even Realities Android app, and G2 glasses.

## Explicit user constraint

Codex only. Do not launch, test, or interact with Claude until Eugene explicitly
authorizes it. Keep server-side provider restrictions in place. Historical
upstream Claude code is not evidence of authorization to test it.

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
