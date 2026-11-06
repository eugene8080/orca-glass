# Native simulator interaction gate
Updated: 2026-11-03

## Current launch rule

Agents must launch interactive/development processes in named Orca worktree
terminals; see CLAUDE.md, Terminal policy. The standalone scheduled simulator
and old cmd tab were stopped at user request. Current pwsh tabs are
`Orca Glass Dev Server` (Vite5173) and `G2 Simulator` (localhost5173,
automation9899). One simulator verified in desktop session1; HTTP/automation
healthy. The live preview currently needs its pairing code in its local settings.
Legacy Start-Process/scheduled-task instructions below are historical and do not
override this rule. Existing automatic Windows bridge startup remains unchanged.

## Current facts

2026-11-02 live desktop dev startup: default Vite bound ::1:5173 while the
documented simulator URL used127.0.0.1:5173, producing connection refused.
Confirmed localhost/IPv6 HTTP200 versus IPv4 refusal. Set app/vite.config.ts
server host127.0.0.1, port5173, strictPort true so the documented URL matches.
No plugin/beta/bridge behavior change. Refresh the simulator Browser after the
dev server restarts, then use the real pairing code rather than demo.

2026-11-02 final1.0.5 checks supersede the review-focus candidate:
User explicitly retained smooth native scrolling and requested bottom-panel
review restoration. Removed the separate screen, draft line-scrolling code and
full-page fallback. `scripts/check-simulator.mjs` reproduces the native check
against a freshly started isolated simulator home list (default9899; override
ORCA_GLASS_SIMULATOR_PORT). It saves screenshots/native logs under `.local/`.
The check completed: no page rebuild or body-text rewrite during recording,
review, cancel or send, and exactly one complete fake transcript send. Alpha-
composited screenshot crops x0..560/y40..208 were pixel-identical before record,
during review, after cancel and after send. Footer Working/Waiting visibly
changed; subsequent live reply rendered. Files `.local/beta105-*-visible.png`.
50 tests/build/doctor pass; beta1.0.5 uploaded/promoted only after these native
checks. No real provider input or G2 verification. Draft swipes still belong to
native chat, per accepted tradeoff; do not claim separately focused draft scroll.

2026-11-02 desktop simulator results supersede the startup blocker below:

- User launched the first instance over SSH; confirmed PID56120 was in session0,
  desktop eugen in session1. Left inaccessible SSH instance alone.
- Registered manual-only task Orca Glass Simulator with Interactive/Limited
  principal eugen, no startup trigger, port9899. Launched successfully in session1.
  Native WebView and SDK initialized. If restarting, wait for task Ready before
  starting again; one immediate restart exited0xC0000409, next clean start worked.
- Native screenshots are green RGBA with text in alpha. Composite onto black to
  view/compare; raw RGB alone appears solid green. Screenshots under `.local/`.
- Reproduced status-update failure: polling sent layout fields x/y/width/height
  in TextContainerUpgrade; renderer remained Working after state changed to waiting.
  Removed unsupported layout fields. After a clean simulator restart, screenshots
  visibly show Working → Waiting for input. Initial activity fetch also renders.
- Live reply verified visually after source changed from codex-transcript to
  terminal-buffer. Screenshot `.local/sim-live-fallback-visible.png` shows the new
  reply and Working status. No real provider request/input used.
- Bottom review renders without rebuilding the chat. Review swipes still scroll
  the native chat behind it, and normal native interior scrolling emitted no app
  scroll event; therefore software draft scroll cannot intercept those gestures.
  Native chat pixel comparison changed after review swipe/cancel. Review capture
  ownership cannot change via supported text-only upgrade fields. Not fixed.
- Asked user to choose app-controlled line scrolling (both chat/draft, preserved
  positions) or keep native chat scrolling and review long drafts on phone.
  No new beta uploaded; installed channel remains1.0.4. Status/live-output fixes
  are verified in simulator only, not G2. Do not describe whole interaction as passed.

2026-11-02 user reported simulator open. Automation on9898 returns pong; fixture
on8791 returns HTTP200. Native glasses screenshot is entirely black; webview
screenshot returns main window not found. Console has zero entries. A documented
click input produced simulator warning inject_input: no active event container.
Simulator PID56120 has no discoverable main window; process details/owner access
are denied to this session. Installed WebView2 Runtime156.0.4314.58 is present.
No app interaction, status rendering, scrolling or retention check has passed.
Asked user what the visible simulator window shows; awaiting that observation.

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

## Phone page preview (2026-11-06)

The G2 simulator shows only the glasses. To review the phone page (the Even app's
WebView), run `node scripts/phone-preview.mjs` in a named Orca tab (`Phone Preview`) and
open `http://127.0.0.1:8796/?code=demo` at phone width. It uses the app's own Vite config
with the Even Hub SDK replaced by `scripts/phone-preview-sdk.ts`: glasses calls succeed
and draw nothing, storage is the browser's localStorage. Demo data only; it is never part
of the app bundle.
