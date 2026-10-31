# Windows voice and live sessions
Updated: 2026-11-01

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
a Codex inference or live terminal submission. The custom server/tunnel remains
stopped; Android/G2 pairing is the next deployment check.
