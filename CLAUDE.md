# Orca Glass fork
Updated: 2026-11-02

Read the machine-level instructions first. This fork targets Windows desktop
Orca, the Even Realities Android app, and G2 glasses.

## Explicit user constraint

Codex only. Do not launch, test, or interact with Claude until Eugene explicitly
authorizes it. Keep server-side provider restrictions in place. Historical
upstream Claude code is not evidence of authorization to test it.

## Current work

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
