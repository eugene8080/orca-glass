# Windows voice and live sessions
Updated: 2026-11-01

## Current implementation: warm Whisper and native scrolling

2026-11-01 hardware follow-up: Eugene confirms smooth scrolling. Earlier text
appeared to do nothing. Desktop navigation logic did select a different section;
no device rejection was captured, so the exact cause remains unproven. Repair:
sections now respect a conservative 900-byte UTF-8 limit; earlier/later navigation
rebuilds an empty reader and explicitly uploads its selected content. Native
create/rebuild/upload acknowledgments are checked and failures are shown rather
than silently ignored. Twenty-five tests and build pass; G2 retest pending.
Same tunnel and QR remain valid; only static app files changed.

This supersedes the older line-window and hold-review instructions below.
The requested UI stays in Orca Glass; the native Even AI spoken-navigation router
is not the desired workflow.

- Reuse installed whisper.cpp server and base.en CPU model. One hidden loopback
  worker keeps the model loaded. No cloud transcription or GPU configuration.
- During recording, decode accumulated PCM snapshots at most once per 1.5 seconds,
  without overlapping requests. These are provisional repeated decodes, not a
  token-streaming model. Maximum recording length is 60 seconds.
- Hold until Recording appears, speak with provisional captions, release to finalize
  and send once. Double-click before sending cancels, including pending transcription.
  Tap mode retains transcript review. Preview errors never send text.
- Public JFK fixture: warm startup 246 ms; 3/6/11-second clips decoded in
  473/486/515 ms. Excludes Android, tunnel, BLE and display latency. No agent prompt
  was submitted. Hardware caption timing remains unverified.
- Intact sections of up to 990 UTF-16 code units use isEventCapture=1; firmware
  performs overflow scrolling. Gestures no longer replace text. Scrolling pauses
  updates to preserve position. Click for Reply, Earlier/Later text, Latest output
  to resume, or retained terminal history. Hold can record directly from the reader.
- Native smoothness needs G2 confirmation. Long text still requires sections due
  to the SDK content limit; history is the bounded terminal buffer, not the full
  archived conversation.

Validation: 23 automated tests, TypeScript/Vite build and doctor passed. Custom
bridge restarted (supervisor PID 37876); authenticated silence returned empty text,
and the public JFK recording transcribed through the running bridge in 525 ms.
Pairing helper verified the replacement HTTPS tunnel and regenerated the private QR.
No Claude launch/test or live Codex inference was performed.

References: https://hub.evenrealities.com/docs/build/display and
https://github.com/ggml-org/whisper.cpp/tree/master/examples/server .

## Hardware results and recording modes

Latest reader update, 2026-11-01: removed page counters and page-sized jumps.
Each scroll event shifts one wrapped line in an eight-line viewport. The SDK
delivers discrete scroll events, so this is incremental line scrolling, not
continuous pixel animation. Position remains fixed while reading older output;
return to the bottom to resume live updates. Native Even AI retains its own UI.

Latest update, 2026-11-01: Eugene confirmed hold-to-talk works on the G2.
Release now starts transcription immediately, removing the extra confirmation.
The resulting transcript still requires a click to send; double-click discards it.
This supersedes the initial hold flow described below. Fourteen tests/build pass.

2026-11-01: Eugene confirmed the G2 session list, accurate microphone transcription,
and a test sentence received in this Codex session. Reported stop-to-transcript
delay: approximately 2–3 seconds. Tap recording is hardware tested.

The phone settings now offer Tap to start / tap to finish (default) and Hold to
talk / release to finish. Save and reconnect persists the selected mode. In hold
mode, long press from the session screen starts capture; wait for Recording before
speaking. Release stops capture, then click to transcribe or double-click to discard.
Transcription is still reviewed before a separate click sends it. A short hold
released before microphone startup is ignored. Hold mode uses SDK 0.0.16 events 9
and 10 and is automated-test verified, but remains unverified on Eugene's firmware.
If the OS intercepts long press, retain tap mode.

The home header now counts connected terminals instead of reporting a misleading
waiting count. Orca terminal-list metadata does not establish agent waiting state;
connected terminals can include a shell after its agent exits.

Eugene's later screenshot shows the Recording mode selector is present and set to
Tap to start / tap to finish. The prior report of absent hold settings is therefore
not evidence that the SDK failed to deliver hold events.

Text screens now paginate all received text within the eight-row/999-byte display
budget. Scroll up/down moves between pages; the title shows page/total. Live polling
does not overwrite older pages. Scrolling above the first current-response page
loads up to 1,000 retained terminal rows; scrolling past the last history page or
double-tapping returns to live output. This is bounded terminal scrollback, which
may include TUI redraw artifacts, not a full saved Codex transcript. A restarted
terminal may retain little history. Fourteen automated checks and the build pass.

The custom app reuses the Mac upstream implementation in app/src/main.ts,
bridge/whisper.mjs and bridge/orca.mjs: glasses microphone PCM, local whisper.cpp,
transcript review, then ordinary text sent to the selected Orca terminal. Codex
does not receive audio. Claude remains prohibited for launch, testing and input.

## Verified SDK boundary

The installed Even SDK 0.0.16 exposes audioControl and audioEvent.audioPcm.
No transcript callback or native speech-to-text method is exposed in its public
API. Even's official [ASR example](https://github.com/even-realities/evenhub-templates/tree/main/asr)
requires an app-supplied transcription engine. Native Even Terminal voice does
not establish that custom Even Hub apps receive the same feature.

## Local setup

Run `pwsh -NoProfile -File scripts/setup-voice.ps1` on Windows x64.
It installs whisper.cpp b5454 (the build linked by v1.9.5) and the English
base.en model in ignored `.local/voice`. Downloads are SHA-256 checked against
GitHub release metadata and the model repository LFS hash. No global PATH or
network settings are changed. Override WHISPER_BIN and WHISPER_MODEL for an
existing installation. The English model is about 148 MB; use a multilingual
model if choosing Japanese in the app.

On the glasses, open a terminal and tap to reply. An explicit Codex choice menu
shows its real options; otherwise the app starts microphone capture when local
recognition is configured. Tap to stop and transcribe, then tap to send the
reviewed transcript. Double-tap cancels and returns to the terminal. Recording
is capped at 60 seconds. Audio is temporarily processed on the Windows PC and
the temporary WAV is removed afterward; no separate cloud STT account is used.

The phone WebView also has a sentence composer. Android keyboard dictation can
fill the text box; it uses the phone keyboard microphone, not the G2 microphone.
Review and Send are separate steps. Switching sessions clears the draft. A lost
POST response is not retried because input might already have been delivered.

## Session browsing and refresh

The bridge lists connected, non-orphaned Codex terminals from Orca, not Codex
history. The glasses list is paginated rather than silently dropping terminals
beyond the SDK's 20-item page. Refresh sessions reloads that list without moving
items under the user's selection automatically. Handle suffixes distinguish tabs
with identical titles.

The selected terminal is polled at one-second intervals, with at most one read
in flight. A delayed poll cannot overwrite a different screen. This reduces the
old three-second scheduling delay; it is not streaming and hardware latency has
not been measured. The existing bridge/tunnel pairing remains unchanged.

## Validation boundary

Automated tests use synthetic Codex screens and a simulated Even bridge; no
messages are sent to live agents. TypeScript/Vite build and Orca doctor are local
checks. Real G2 microphone, Android WebView, Bluetooth display latency and
end-to-end message submission remain hardware checks. This change does not
restart native Even Terminal, alter proxy routing, or publish a marketplace app.

2026-11-01: seven automated tests and the production build passed. Doctor found
nine Codex terminals. The hash-verified Windows engine and base.en model were
installed locally. whisper.cpp's public JFK WAV was decoded to PCM and transcribed
through bridge/whisper.mjs successfully. This is a local speech-engine test, not
a Codex inference or live terminal submission. The custom server/tunnel was then
started with local/HTTPS checks passing; Android/G2 pairing remains the next check.
