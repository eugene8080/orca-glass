# Windows + Android setup
Updated: 2026-11-10

This fork uses Codex only. Claude testing is prohibited until the user authorizes it.

The custom bridge is now running for the first Android/G2 hardware test.
[Native Even Terminal](native-terminal.md) is separate and was not restarted.

## Connection

G2 glasses ↔ Even Realities app on Android ↔ HTTPS Quick Tunnel ↔ local Node
bridge on Windows ↔ Orca CLI. Orca and this bridge must remain running on the PC.
The phone does not run the coding agent. This version does not use Orca Mobile
as an intermediary or implement Orca's encrypted mobile protocol.

## Windows

Requirements: Node 20+, installed/running Orca, cloudflared on PATH.

```powershell
npm --prefix app ci
npm --prefix app run build
npm test
npm run doctor
npm start
```

Keep the last command running. In a second PowerShell window, run `npm run pair`.
It copies the secret pairing code to the Windows clipboard. Paste the code in
Orca Glass on the phone. Never commit or share the code or an authenticated QR.

The Windows Orca executable is discovered under LOCALAPPDATA. ORCA_BIN can
override it; explicit ORCA_CLI_COMMAND and ORCA_DEV_REPO_ROOT are respected.

## Android / G2

Pair G2 in the Even Realities Android app. Enable its developer mode if needed.
Use the developer QR scanner to open a QR made by `evenhub qr --url <tunnel-url>`.
The URL is in tunnel/current-url after startup. This loads this fork, not the
original creator's store version. A normal browser can show the page but cannot
operate the glasses because it has no Even SDK bridge.

Paste the pairing code and save. Open a Codex session, then click to open replies.
Recognized interactive menus show their actual option labels. Selecting an item
shows question context and the selected label; click again to send it. A changed
screen rejects the old selection. Ordinary numbered prose is not treated as an
interactive menu. Unrecognized or wrapped layouts may need the desktop.

The stale-screen check is not atomic with terminal input: Orca does not expose a
compare-and-send operation here. A successful input send is not proof that Codex
accepted the choice. Check the following screen before repeating any action.

Voice uses the Windows local Whisper setup documented in [voice-input.md](voice-input.md).
The engine and English model are installed and passed a public speech-fixture test.
Tap an ordinary session to record; explicit choice menus retain their actual options.

QR development sessions differ from installed beta builds; do not assume phone
lock/background persistence. A personal beta requires developer portal access
and a separate package ID. No marketplace publication has been performed.

## Services and privacy

### Quick Tunnel metrics and restart safety

`tunnel/quick.yml` pins cloudflared metrics and readiness to loopback
`127.0.0.1:20261` (`/metrics` and `/ready`). This stays outside cloudflared's
default port walk, 20241..20245, and avoids 20251, reserved for the separate PMS
connector. On 2026-11-10 the Orca Glass tunnel took 20241 before PMS started;
PMS's old health probe then checked the wrong connector. Fixed, separate metrics
addresses prevent startup order from changing which service a probe reaches.

The sole cloudflared launch is in `tunnel/watch.mjs`, which explicitly reads
`tunnel/quick.yml`. `npm start` and both OS startup entrypoints
(`scripts/start-windows.ps1`, `scripts/start-macos.sh`) run `scripts/start.mjs`
and this same watcher. The Windows scheduled task `Orca Glass Bridge` invokes
`scripts/start-windows.ps1`; no separate Orca Glass Startup shortcut was found
on PSCAP11. No launch-line override is needed. The watcher checks local and
tunnel `/healthz` and obtains the URL from stderr, not metrics; there are no
existing metrics/readiness probes to repoint in this repo.

A quick-tunnel restart changes its public URL. The watcher writes
`tunnel/current-url` and publishes signed API discovery through ntfy; loaded
prototype clients can rediscover after a failed GET. However, the prototype
app-loading URL embedded by `scripts/pair-custom.mjs` in the private QR is
static and is not automatically regenerated. Installed beta builds use their
configured Tailscale origin instead. Do not restart solely to apply this port
change while a prototype link may still be in use. At the next planned restart,
regenerate/rescan the private prototype QR if needed and verify
`http://127.0.0.1:20261/ready` returns HTTP 200. Never stop cloudflared by name;
identify only the Orca Glass process by this repo's `tunnel/quick.yml` in its
command line, leaving the separate PMS connector untouched.

2026-11-10 rollout: configuration changed without restarting the live tunnel
(PID 22564, still on 20241). Port 20261 takes effect at the next tunnel restart
or reboot. PMS PID 50832 was healthy on 20251 with four ready connections before
the change; final verification is recorded in `TODOS.md`.

### Data handling

The bridge listens on loopback and requires a bearer token for session APIs.
Cloudflare carries bridge traffic; ntfy.sh receives a random topic, tunnel URL,
timestamp, and HMAC signature, never the pairing token. Quick Tunnels have no
uptime guarantee. QR files containing a pairing code are credentials.

## Verification

2026-11-01: custom supervisor started hidden, PID recorded in ignored
`.local/custom.pid`. Loopback and current HTTPS tunnel health/capabilities checks
passed; voice=true, nine live Codex terminals. Tunnel URL publication succeeded.
`node scripts/pair-custom.mjs` generated ignored `.local/custom-pairing.html` and
PNG with the pairing code and English preference prefilled. No agent input sent.
Scan using Even Hub Developer/Prototype Mode, not the native Terminal scanner.
Phone/G2 display and microphone capture remain awaiting Eugene's check.

Desktop builds and synthetic menu tests do not establish Android/G2 compatibility.
Hardware acceptance requires opening the fork from Android, reading a real Codex
question, selecting its actual option, observing the expected result on desktop,
and checking reconnect behaviour. Claude is excluded from every check.
