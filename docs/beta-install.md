# Personal beta installation

2026-11-03 user approves usage preview and requests beta upload.1.0.23 uploaded/
promoted; channel verified (47,519 bytes).79 tests/build/doctor passed before
release. Production bridge restarted after verifying listener/parent process;
old .local/custom.pid was stale, corrected to newly verified supervisor PID.
Local and stableHTTPS usage endpoints return ok for Codex, Claude and Cursor;
observed Codex weekly64%, Claude5h4%/weekly2%, Cursor monthly~2.02%. Only usage
metadata read; no model prompts, Claude launches or provider browser interaction.
Ordinary prototype dist restored; simulator/Usage Preview kept OPEN. G2 usage
rendering remains pending user confirmation. No public publication.


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


2026-11-03 user explicitly requests beta upload.1.0.21 uploaded/promoted and
channel verified (46,512 bytes): contextual Refresh/New Session/Usage, denser list,
selected-marker wrap fix.75 tests/build passed before release; ordinary prototype
dist restored. Simulator remains OPEN for review; G2 verification pending.
User asks for prior Even SDK feature requests for Discord; see
 docs/sdk-feature-requests.md. No message/ticket sent by agent.


2026-11-03 user approves simulator: "looks good all aligned". Beta1.0.20
uploaded/promoted and channel verified (46,434 bytes),74 tests/build previously
passed. Native dot/title alignment G2 check pending. Simulator intentionally left
open in demo per review policy; ordinary prototype dist restored. Reader/bar
unchanged, scrollbar location question remains unanswered. No new1.0.21 work.


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

2026-11-03 hardware confirmation: User confirms host shutdown/load failure and G2 screen rejection recovered, all three input rows usable, and menu text stable during up/down swipes. These hardware checks are complete; no new build required.

## Current state

2026-11-03 user confirms1.0.16 runs on G2 again. Phone Chrome healthz returned
ok:true; earlier app Failed to fetch has recovered. Exact transient cause unknown.
No connection-related beta change or new pairing was needed.

2026-11-03 user confirms1.0.15 opens on Android and G2. Beta **1.0.16** now
uploaded/promoted and channel verified (46,614 bytes). Filter moves from native
contextual menu to first list row with current provider beside it. All three
input rows show transcription; send/cancel gestures retained. Timer/hint native
text, live activity markers and persistent phone layout mode added.71 tests/build
pass; native simulator three-row review, chat retention and native timer verified.
New1.0.16 appearance/markers remain hardware-pending.

2026-11-03 beta **1.0.15** uploaded/promoted and channel verified (46,390 bytes).
Minimal native startup, one-shot recovery and automatic compact-menu fallback
when aligned layout is rejected. Phone heading displays installed version;
Status reports compatibility activation. Fallback labels are inline and list
Braille animation is disabled; reader/input layout retained.68 tests/build pass;
forced-rejection native simulator fallback/cursor/session navigation verified.
G2 acceptance remains pending. No repeated force-stop or pairing change requested.

2026-11-03 follow-up: user screenshot reports **Failed to load: Bad state: Host
shutdown did not complete** in the Even app; user also reports rejected screen
update. Installed version not reconfirmed. Requested Android Force stop of Even
Realities, reopen and identify which error remains. No new beta uploaded for this
report.1.0.14 compatibility remains hardware-unverified; do not mark resolved.

2026-11-03 beta **1.0.14** uploaded/promoted and channel verified (46,064 bytes).
Compatibility repair for G2 startup invalid1: eight menu containers, contiguous
IDs/layers, merged marker/title text, and rejected-start recovery using rebuild.
67 tests/build pass; simulator menu and reader open. Exact hardware cause and
G2 recovery remain unconfirmed. Fully close/reopen Orca Glass after updating.

2026-11-03 beta **1.0.13** uploaded/promoted and channel verified (46,081 bytes).
Stable compact native text columns with separate blank gesture capture/cursor;
right-hand count/filter/providers, Refresh *, idle / and tiny marker-only Braille
strips. Six chat rows plus three input rows (instruction + two draft rows).
Terminal composer/status/shortcut chrome filter added.66 tests/build/doctor pass;
native simulator fixed menu pixels and voice chat-position retention verified.
G2 stability/alignment/spinner/speed/input-area checks pending.

2026-11-02 beta **1.0.12** uploaded/promoted and channel verified (45,260 bytes).
Authorized compact native-text menu trial: one multiline text container and >
cursor, four terminals/page, one text update per move, rapid swipes coalesced.
No session-menu images or animation timer. Reader/voice/filter layout unchanged.
63 tests/build pass; simulator compact/cursor/session/filter verified. G2 speed
check pending. This follows Nick's published pattern; Books source unverified.

2026-11-02 beta **1.0.11** uploaded/promoted and channel verified (44,992 bytes).
User requested native text after1.0.10 image list felt slow. Restored native
header/list/selection/scroll, with no session-list images or animation timers.
Version/count/filter/provider labels inline; idle/active snapshot markers.
62 tests/build pass; official simulator navigation verified. G2 speed check pending.

2026-11-02 beta **1.0.10** uploaded/promoted and channel verified (45,860 bytes).
Session list now has manifest version/count header, right-aligned filter and
provider tags, idle slash and animated active-session Braille. The list uses
highlighted rows with four terminals/page; reader scrolling and voice layout
remain unchanged. English-only manifest/UI/demo/templates/STT; root/images ignored.
62 tests/build/doctor pass; native simulator navigation/filter/spinner verified.
G2 validation pending. See docs/session-list.md.

2026-11-02 beta **1.0.9** uploaded/promoted and channel verified (47,673 bytes).
Trial app-drawn border around reserved voice input/review footer.59 tests/build
pass; isolated native simulator verifies no chat rebuild/body writes during
capture/review/cancel/send, identical chat text pixels and one complete fake send.
No new optical-depth or draft-scroll capability. Sequential contextual menus
and click-as-native-scroll remain blocked by missing public SDK commands.

User confirms Filter by Agent works on G2, including Pi and Cursor alongside
Claude and Codex. Filtering and dynamic provider discovery are verified.

User confirms the phone listing showed **1.0.6** and has now updated to
**1.0.8**. The earlier phone update-availability report is resolved. No
reinstallation or invitation change is needed. This does not establish the
cause of the historical CLI tester-roster discrepancy.

2026-11-02 beta **1.0.8** uploaded/promoted and channel verified (47,455 bytes).
Session click now does nothing; voice review click-to-send remains. Restores
native idle slash and bright frame/divider, and renames filter to Filter by Agent.
58 tests/build pass; official simulator verifies visible decorations and identical
reader pixels after click. User subsequently confirmed session click does nothing,
frame/divider present, slash before Waiting input and input hint visible on G2.
User further confirmed visible Braille spinner, animated thinking/pondering
labels, cycling dots and response timer present on G2. Exact cadence, numerical
timer accuracy and voice flow were not explicitly checked. The user also
confirmed the Filter by Agent menu label on G2.

2026-11-02 beta **1.0.7** uploaded/promoted and channel verified (47,887 bytes).
Adds framed compact conversation, visible Braille spinner, five-second working
words/animated dots, and a right-aligned provider-reported elapsed duration before
the input hint. Includes Filter Agents rename.62 tests/build/doctor pass; native
simulator verifies visuals and live Codex activity returns its actual duration.
G2 validation pending. See docs/session-reader.md for provider/source limitations.

2026-11-02 update availability report: user cannot see the1.0.6 update and has
not checked the new menu on G2. CLI recheck confirms version1.0.6 assigned beta,
signed account eugene8080@gmail.com, tester roster still Invited. Earlier user
acceptance/installations do not resolve that server mismatch; do not dismiss it
as proven cosmetic. App listing was renamed Orca Glass (without Windows).
Asked user to reopen phone app and report Me→Beta tester listing/details version.
No reinvitation, membership removal, reinstall, beta-channel mutation or code
change performed for this report. Native-menu regression scope remains pending.

2026-11-02 latest beta is **1.0.6** (46,466 bytes), channel verified. App display
name is now **Orca Glass** in manifest and portal. Added native View options >
only on the sessions list, opening persisted provider filters; session Menu keeps
OS-owned Display off/Brightness/Close.56 tests/build/doctor pass; native simulator
menu/filter/context checks passed. Firmware system rows, close wording and ✓
glyph appearance require G2 verification. The SDK cannot customize system slot
ordering or exact close toast. See docs/context-menu.md. No public publication.

2026-11-02 spacing fix (server-only): user reported restarted or displayed as
restartedor. cleanScreen's heuristic concatenated full-width terminal rows after
stripping whitespace. A synthetic two-row example reproduced that exact string.
Removed heuristic unwrapping; preserve newline boundaries instead of guessing
whether a wrap split a word or replaced a separator. Internal spaces are retained.
53 tests and doctor pass; bridge restarted and HTTPS200 verified. No beta update
or reader/scroll/voice-layout change. Original phrase was no longer in the current
pc-settings output, so this is a reproduced mechanism, not a captured original
render. Simulator fixture was stopped; automatic relaunch rejected blocked by
policy. No new simulator screenshot or G2 verification performed.

2026-11-02 later hardware report: user saw Working after initially reporting it
stayed on Waiting; both states are now user-observed on G2. User also reported
needing Resume latest output to refresh text. That symptom remains distinct and
unresolved: current code intentionally pauses body updates on scrolling or voice
cancel, while activity continues; sending/resuming re-enables following. No
evidence yet that text stalled without such a pause. No app change made.

2026-11-02 latest hardware confirmation: after close/reopen guidance, user
reported the G2 footer now displays Waiting for input. Bottom review and chat
position were already confirmed stable by the user. No additional beta or code
change was made. Do not infer the exact cause of the preceding unavailable
display from this recovery. A complete working→waiting transition on G2 has not
yet been explicitly reported; both states were verified in the simulator.

2026-11-02 hardware follow-up: user confirms restored bottom review and stable
chat position in1.0.5, but footer still reports Status unavailable. This remains
open despite simulator success. Added local activity trace (time, handle suffix,
origin and state only; no credentials/transcript). After bridge restart, the
phone's origin http://127.0.0.1:44253 repeatedly requested the selected e4c9a8
session and received working. Other desktop checks returned working/waiting200.
Downloaded beta1.0.5 package SHA256 exactly matches the locally tested package.
Asked user to confirm installed version; not yet answered. A read-only real-client
simulator launch was rejected by execution review (blocked by policy); it did not
run. No new beta uploaded, no further layout/scroll changes, no claimed fix.

2026-11-02 latest beta is **1.0.5** (46,075 bytes), upload/promotion verified.
User rejected line-by-line chat scrolling and asked to remove the separate review
page. Native chat scrolling remains. Recording/review/Send/Cancel update only the
bottom panel; a rejected panel no longer triggers a full-page fallback. Draft
review does not separately capture native swipes. Status now fetches immediately
and uses only valid native text-update fields; unsupported layout fields caused
the simulator's frozen/unavailable status.50 tests/build/doctor pass.

Desktop-session official simulator checks: visually confirmed Working→Waiting,
live reply after source fallback, no chat rebuild/body rewrite during voice flow,
exactly one full fake transcript send. Reader pixel crop (excluding scrollbar)
was identical before recording, during review, after cancel and after send.
Hardware appearance remains pending; update the phone beta to1.0.5. The1.0.4
review-screen behavior described below is historical and superseded.

2026-11-02 latest: beta channel is now **1.0.4** (46,426 bytes), verified after
upload/promotion. Install/update through the phone's Beta tester entry. This build
adds activity status in the reserved bottom voice area while reading. Working…
and Waiting for input come from Orca's exact-pane agent state, not terminal titles.
Unrecognized state/request failure displays Status unavailable; blocked/error
state displays Needs attention. Polling continues when conversation text is paused,
without replacing that text. Recording/review temporarily owns the panel;
Send/Cancel restores status and Cancel keeps text paused. 50 tests/build/doctor
pass, including paused-reader updates and late-status/voice protection. Live
HTTPS activity verified working for this session and waiting for completed
sessions. Hardware appearance and phone update remain pending; no public release.

This version also repairs saved-history source loss: a reader formerly locked
to codex-transcript now switches to the live screen when the bridge returns
terminal-buffer or cannot load saved history. Live native text updates must be
acknowledged before the UI records them as displayed; rejected uploads retry.
The current session's history endpoint was observed returning terminal-buffer,
confirming the previously ignored transition. These fixes do not remove the
intentional pause while reading older conversation text; click and choose Resume
latest output to follow again after scrolling.

Voice review now uses a dedicated full-screen transcript page. Up/down moves
through every line of the draft; click sends the full text once, double cancels.
The background chat cannot capture review scrolling. Capture/previews still use
the reserved bottom panel. Returning from review rebuilds the selected chat block;
the SDK does not expose the exact native scroll offset for restoration. This
supersedes older no-rebuild-at-review notes. Hardware review scrolling and live
reply behavior remain pending. Tests cover long drafts, no send while scrolling,
one full-text send, lost-history fallback and rejected-upload retry.

Version 1.0.2 is packaged in ignored `.local/orca-glass-1.0.2.ehpk`.
38 automated tests, beta packing, ordinary build and doctor passed.
2026-11-02: signed in as eugene8080@gmail.com; registered
`com.eugene8080.orcaglass`, uploaded version 1.0.2 (45,776 bytes), and
promoted it to beta. Server listing confirms channels=[beta]. User confirmed
accepting the tester invitation; their phone screenshot shows Orca Glass Windows
installed with a Beta badge on the home screen. CLI still reported Invited, so
that status conflicts with observed installation. Beta launch/G2 behavior remains
unverified. No public submission or publication performed.

## Stable bridge

Beta builds connect to `https://pscap11.tailf91bf7.ts.net:8443`, explicitly
allowed by `app/app.json`. Phone Tailscale must be connected to the same tailnet.
The existing signed Quick Tunnel discovery remains available in prototype builds.
Beta packages contain no pairing credential. Enter the existing connection code
once on the phone; `npm run pair` copies it to the PC clipboard.

Configured and checked on 2026-11-02:

```powershell
tailscale serve --bg --https=8443 http://127.0.0.1:8787
```

This is tailnet-only. The pre-existing port443 Funnel to port8600 is untouched.
HTTPS health and frontend returned HTTP200. The bridge still needs to run;
automatic sign-in startup is configured below. To remove only this proxy:
`tailscale serve --https=8443 off`.

## Windows automatic startup

2026-11-02: registered Task Scheduler task **Orca Glass Bridge** for PSCAP11's
`eugen` user, triggered at that user's Windows sign-in. It runs PowerShell and the
existing bridge/tunnel supervisor hidden, with normal user privileges, no stored
password, no execution time limit, and no battery restriction. Failure recovery
is configured for 999 retries one minute apart. Duplicate task instances are
ignored; a named mutex prevents duplicate launcher instances. An occupied bridge
port is left untouched. Orca itself must still be running for session access.

Reinstall/update the task with `scripts/install-windows-startup.ps1`.
The task runs `System32/conhost.exe --headless` plus PowerShell 7 and
`scripts/start-windows.ps1` (same headless pattern as PcSettings Vancouver Proxy).
Its launcher is `scripts/start-windows.ps1`; private logs are in
`.local/startup.log`, `.local/custom-output.log`, and `.local/custom-error.log`.
It starts after sign-in following power-up/reboot, not before Windows sign-in.

Verified by terminating only the process tree of the inspected old Orca Glass
supervisor, starting the scheduled task, checking task state Running and settings,
and receiving authenticated HTTP200 for local/HTTPS capabilities and HTTPS session
listing (two Codex sessions). No input was sent. A real reboot/sign-in trigger
and failure-recovery timing were not tested. No change to native Even Terminal,
existing Tailscale routes, or provider restrictions.

To disable startup: `Disable-ScheduledTask -TaskName 'Orca Glass Bridge'`.
This disables future starts; it does not terminate the running bridge.

## First registration

Sign in with the same Even Realities account used on Android:

```powershell
cd D:\dev\orca-glass\app
.\node_modules\.bin\evenhub.cmd login
.\node_modules\.bin\evenhub.cmd self-check --json
.\node_modules\.bin\evenhub.cmd ls --json
```

Check ownership and whether `com.eugene8080.orcaglass` already exists before
creating it. If absent:

```powershell
.\node_modules\.bin\evenhub.cmd create ..\.local\orca-glass-1.0.2.ehpk --name "Orca Glass Windows" --tagline "Read and reply to your Orca Codex sessions"
.\node_modules\.bin\evenhub.cmd promote 1.0.2 --to beta
.\node_modules\.bin\evenhub.cmd testers add <phone-account-email>
.\node_modules\.bin\evenhub.cmd ls com.eugene8080.orcaglass
.\node_modules\.bin\evenhub.cmd testers
```

Accept the tester invitation email. Verify both beta channel and Active tester
membership, then install through Even Realities → Me → Beta tester. Uploading
or promoting is not proof of installation. Public marketplace submission is
not requested and must not be performed.

## Later code updates

2026-11-02 Codex usage repair supersedes earlier usage403 notes: Orca account
list still reports HTTP403 from the OpenAI usage endpoint, while a read-only
request through the current PcSettings proxy succeeds. Bridge now prefers a
successful Orca usage result; otherwise it reads the selected route from
LOCALAPPDATA/PcSettings/AiRouting/route.json and launches a scoped Node
--use-env-proxy subprocess. It verifies api.ipify.org against expectedExitIp
before reading the first-party usage endpoint with the existing local Codex
ChatGPT login (CODEX_HOME or user .codex). No login tokens are returned or logged.
No global proxy changes, Orca restart, inference or Claude interaction.

Responses are cached for60 seconds and concurrent fallback calls share one
request. Map windows by duration: OpenAI returned only a weekly primary window,
so no5h figure is invented. Installed beta HTTPS usage returned status=ok,
weekly44%, reset2d17h after scheduled bridge restart. 44 tests/build/doctor pass;
actual phone display remains unverified. Reopen Usage; no beta update required.
The underlying Orca usage routing issue remains outside this bridge repair.

2026-11-02 idle-name correction supersedes tab-only naming below: user confirmed
the tab also resets to Codex ready while idle. Bridge now prefers worktree ps
conversationName by exact workspace/pane, and retains a last meaningful name
per running incarnation when idle metadata is missing. Cache is bounded and
in-memory; it does not survive bridge restarts. Renames replace cached names;
new incarnations cannot inherit them. 42 tests pass, including both titles
resetting, missing metadata, rename and incarnation isolation. HTTPS names checked
after restart. Actual post-turn idle transition and phone display remain unverified.

2026-11-02 session names: bridge uses Orca visual-layout tab titles (or explicit
pane titles), keyed by exact workspace/tab identity, instead of transient program
status such as Codex ready. Auto-generated worker-task tab IDs retain the more
descriptive program title. HTTPS verified orca-glass beta and Audit Orca VPN
preflight checks after restart; 40 tests/build/doctor pass. Refresh sessions on
the phone to replace its currently displayed list. No beta update required.

2026-11-02 existing-session scope: bridge lists all connected, non-orphaned local
terminals across providers, including child workers. Read/history/reply guards
accept those terminals too. Verified three sessions and OpenCode screen/history
via authenticated HTTPS after scheduled bridge restart. Refresh sessions in the
installed app; no beta reinstall is required for this server-only change.
No input sent and no Claude interaction tested. New-session creation and separate
native AI routing remain Codex-only. Usage is separately unavailable because
Orca's OpenAI usage request returns HTTP403; no proxy changes made for that issue.

Increase `version` in `app/app.json` for each upload. From the repository root:

```powershell
npm test
npm run beta:update -- "Describe this update"
```

This command checks authentication/ownership, builds, packs, uploads and promotes
the manifest version to beta, then lists server state. Install the update on the
phone. Existing active tester membership carries forward. `npm run beta:pack`
only builds/packages locally and performs no upload. These commands build into
`app/dist`; run `npm --prefix app run build` afterwards if continuing the old
public QR prototype without phone Tailscale.

References: [CLI](https://hub.evenrealities.com/docs/cli),
[beta testing](https://hub.evenrealities.com/docs/test/beta-testing),
[network allowlist](https://hub.evenrealities.com/docs/build/networking).
