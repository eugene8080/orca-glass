# Orca Glass fork
Updated: 2026-11-01

Read the machine-level instructions first. This fork targets Windows desktop
Orca, the Even Realities Android app, and G2 glasses.

## Explicit user constraint

Codex only. Do not launch, test, or interact with Claude until Eugene explicitly
authorizes it. Keep server-side provider restrictions in place. Historical
upstream Claude code is not evidence of authorization to test it.

## Current work

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
