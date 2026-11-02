# Native simulator interaction gate
Updated: 2026-11-02

## Current facts

- User reported beta1.0.4 Status unavailable and review replacing/resetting chat.
- Bridge HTTPS activity was checked: selected active session returned working,
  completed sessions waiting, all HTTP200. Device symptom is not explained by
  those server observations. Candidate fetches status before initial rendering
  instead of relying on phone timers; failures appear in phone diagnostics.
- Candidate1.0.5 restores review in the bottom quarter without rebuilding the
  chat, including on rejected panel updates. It is not uploaded or promoted.
- Automated simulator launch was rejected by the execution tool with blocked by
  policy and no further reason. No simulator check has passed. The user was
  asked to launch the prepared command manually. Do not bypass that rejection.

## Start

From PowerShell in this repository:

```powershell
npm run sim:check
```

This starts an isolated Vite fixture on loopback8791 and the installed official
simulator with automation on9898. Fake sessions, transcripts and audio replace
only app API/microphone input; the native SDK and simulator renderer are real.
No requests go to real agents, provider APIs or the real bridge. Logs/PIDs and
screenshots belong under ignored `.local/`. Visible simulator launch is intentional.

## Required checks before uploading another beta

Use the simulator's documented HTTP API (installed package README):

- GET http://127.0.0.1:9898/api/ping
- POST /api/input with action down/up/click/double_click/long_press/long_press_release
- GET /api/screenshot/glasses and /api/console

Fixture control: GET/POST http://127.0.0.1:8791/__fixture. POST can change state,
text, source and transcript. The response includes captured fake sends. State
starts working; transcript has30 lines. Browser console logs SDK methods so
unexpected page rebuilds can be identified.

1. Open fixture session; verify Working is visible immediately, then change
   state to waiting and verify display changes without chat replacement.
2. Change text; verify the new reply appears. Change source to terminal-buffer;
   verify source fallback continues updating.
3. Scroll chat, hold/release, scroll the draft up/down, cancel. Compare reader
   pixels before/after each phase and method logs. Require no rebuild and no
   reader writes throughout capture/review/cancel.
4. Verify transcript scroll reaches both ends, no send until click, exactly one
   full transcript sent, and restored chat position after cancellation.

SDK0.0.16 exposes isEventCapture only in page container definitions, not text
upgrades. Candidate handles review gestures in software but BODY remains native
capture owner; native scrolling of the underlying chat is therefore unresolved.
If the simulator confirms movement, do not claim focused scroll retention or
upload. Record the limitation and discuss a concrete interaction choice with the
user. Mocks cannot verify native scrolling. Simulator success also cannot prove
G2 firmware or Android background-timer behavior; keep those hardware checks open.
