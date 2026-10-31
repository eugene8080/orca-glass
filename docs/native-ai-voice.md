# Native Even AI voice investigation
Updated: 2026-11-01

## Active Codex routing

Eugene confirmed the native echo on G2 and requested Codex routing. The endpoint
now runs with `node scripts/start-native-echo.mjs --codex`, on the same Tailscale
address/port and credential. Without `--codex`, the script still runs echo-only.
The old process alone was restarted; no coding session or network setting changed.

Native Even AI handles live speech recognition and sends text on release. Voice
commands supported by our router:

- `List sessions`: a numbered snapshot of connected Orca Codex terminals.
- `Read more`: next portion of a long list or response (native output kept short).
- `Select session 2`: bind to that listed terminal, validating its incarnation.
- `Which session`: report the selected target.
- `Read latest`: read current output without submitting input.
- Other sentences: send once to the selected existing Codex terminal. Wait up to
  eight seconds for changed output; otherwise return an acknowledgement and ask
  the user to read latest later. Changed output is labelled Latest, not final.

Selection persists in ignored `.local/native-codex-target.json`; disconnected,
changed-incarnation or non-Codex targets require reselection. The router refuses
ordinary speech at a numbered choice menu and refuses submission when no current
Codex input row is visible (agentIdentity can remain after Codex exits to a shell).
Approval selection still uses Orca Glass or desktop. There is no atomic screen
check-and-send in Orca. Identical messages to the same incarnation within 30 seconds
return the previous receipt instead of submitting again; uncertain sends are not
automatically retried. One request runs at a time.

Twenty automated tests and the build pass. All test submissions used mocks; no
live Codex prompt or Claude interaction was initiated during deployment. Native
endpoint health/list requests are checked read-only. A hardware Codex send remains
for Eugene's next voice test. Built-in Even AI scrolling belongs to Even; the
custom Orca Glass reader separately now scrolls one wrapped line per gesture.

Eugene prefers Even AI's native live transcript while holding, followed by send
on release. This is separate from native Even Terminal and our Even Hub app.
The custom app's tap mode was hardware tested; Eugene reports hold not working,
but whether the saved mode was changed has not been confirmed. Do not mark hold
hardware support as passing from the corrected terminal header alone.

## Evidence

- [Even official Bring Your Own Agent tutorial](https://support.evenrealities.com/hc/en-us/articles/16280926743695-Tutorial-Bridging-G2-to-OpenClaw-Bring-Your-Own-Agent)
  documents Settings → Even AI → Agent Configuration, a custom
  `/v1/chat/completions` endpoint, token, Save & Activate, and Tailscale access.
  Its example uses OpenClaw; we do not need to install or run OpenClaw to implement
  the compatible endpoint.
- [Even privacy center](https://www.evenrealities.com/privacy-center) says Even AI
  sends voice/text input to cloud servers and may use third-party providers.
  The reviewed page does not identify Google as its transcription vendor.
- Installed Even Hub SDK 0.0.16 exposes raw PCM and long-press/release events, but
  no public native-transcript API. Native AI custom-agent configuration is a
  different integration boundary, not an SDK transcript callback.

## Prototype

`bridge/native-echo.mjs` implements authenticated JSON/SSE chat completions that
only repeat the latest user text. It imports no Orca or provider code. An independent
echo-only credential and request metadata (not transcript text) stay in `.local/`.
`scripts/start-native-echo.mjs` binds only to this PC's Tailscale IPv4, port 8788.
It generates `.local/native-echo-settings.html` with the URL and private token.
No Windows firewall, proxy, existing server, or agent settings are modified.

The first hardware test must verify that native Even AI still shows live captions,
sends on release, reaches the endpoint, and displays its echo. Twelve automated
checks pass, including authentication, latest-user extraction and JSON/SSE output.
Native Android/G2 compatibility remains pending.

Only after that check should we wire a chosen existing Codex terminal into this
endpoint. Session selection, duplicate delivery, response completion, display
limits and permission/question handling need explicit implementation. An ordinary
chat-completions API does not automatically inherit our custom session picker.
No live Codex input, Claude testing, model inference, or native agent activation
was performed by this prototype.
