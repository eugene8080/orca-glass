# Windows + Android setup
Updated: 2026-10-29

This fork uses Codex only. Claude testing is prohibited until the user authorizes it.

The active setup now uses [native Even Terminal](native-terminal.md). This
experimental bridge is retained as an alternative and is currently stopped.

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

Voice is hidden unless whisper-cli is available and WHISPER_MODEL names an existing
model. Voice installation/testing is outside this first numbered-choice setup.

QR development sessions differ from installed beta builds; do not assume phone
lock/background persistence. A personal beta requires developer portal access
and a separate package ID. No marketplace publication has been performed.

## Services and privacy

The bridge listens on loopback and requires a bearer token for session APIs.
Cloudflare carries bridge traffic; ntfy.sh receives a random topic, tunnel URL,
timestamp, and HMAC signature, never the pairing token. Quick Tunnels have no
uptime guarantee. QR files containing a pairing code are credentials.

## Verification

Desktop builds and synthetic menu tests do not establish Android/G2 compatibility.
Hardware acceptance requires opening the fork from Android, reading a real Codex
question, selecting its actual option, observing the expected result on desktop,
and checking reconnect behaviour. Claude is excluded from every check.
