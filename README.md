# Windows / Android fork
Updated: 2026-10-29

**Current setup: use [native Even Terminal with Codex](docs/native-terminal.md).**
The official package supports Windows and the Android app's Terminal Mode, with
structured Codex questions and approvals. The native host is configured over
Tailscale; phone/glasses verification is pending.

This fork also contains an experimental Windows port of Orca Glass using a
local Node bridge plus an HTTPS Quick Tunnel. That bridge is currently stopped.
**Codex only. Claude testing is prohibited until explicitly authorized.**

For that alternative, read [Windows / Android setup](docs/windows-android.md) and [current status](TODOS.md).
Run `npm --prefix app ci`, `npm --prefix app run build`, `npm run doctor`, then
`npm start`. The original store app is not this fork: load our build with a
developer QR. Hardware verification is still pending.

Based on 2ero20ne's MIT-licensed Orca Glass. The original README follows for
provenance; its Mac setup and store listing describe the upstream project.

---

# Orca Glass

This Windows fork supports English only.

The session list shows the installed app version, connected count, active-agent
filter and provider labels in native text columns. `/` marks idle sessions and
small animated Braille markers identify working sessions; `?` means activity is
unknown. Refresh updates these states. Swipes move a separate cursor without
scrolling the menu text. Use up/down and Click to select;
Previous/Next page keeps every session reachable. Reference images under the
root `images/` directory are local and ignored by Git.

Control [Orca](https://github.com/stablyai/orca) agent sessions from **Even Realities G2** glasses — from anywhere.

- **Threads** — see every Claude / Codex session, which ones are waiting for you, and the latest answer (tool output and thinking filtered out)
- **Reply** — one-tap templates, or **voice** (transcribed on your own Mac with whisper.cpp, then confirmed on the glasses)
- **New session** — pick workspace, agent, model and a first prompt
- **Usage** — 5-hour / weekly limits per provider
- **English only** — interface, demo, reply templates, prompts and voice recognition use English

| Threads | Latest answer | Reply |
| --- | --- | --- |
| ![Threads](store/screenshots/1-threads.png) | ![Answer](store/screenshots/2-answer.png) | ![Reply](store/screenshots/3-reply.png) |
| **Usage** | **New session** | **Phone: pairing** |
| ![Usage](store/screenshots/4-usage.png) | ![New session](store/screenshots/5-new-session.png) | Run `npm run pair` on your Mac, then paste the code into the app. |

<sub>Glasses screens (576×288) from the built-in demo with sample data — tap **Try the demo** in the app to see them without a Mac.</sub>

```
G2 ⇄ Even app (Orca Glass) ⇄ Cloudflare Quick Tunnel ⇄ Mac bridge ⇄ orca CLI
                     ↑ tunnel URL announced via ntfy.sh, signed with your token
```

## Setup

1. Install **Orca Glass** from Even Hub on your phone.
2. Install the setup skill in your coding agent and ask it to "set up Orca Glass".
   - Orca: install from the [Orca skill link](https://share.onorca.dev/skills/share/shr_d60bfc61c56982da57cd656cd0314f5d253ee99a77539873)
   - Claude Code: `/plugin marketplace add 2ero20ne/orca-glass` → `/plugin install orca-glass@orca-glass`
   - Other agents: `git clone https://github.com/2ero20ne/orca-glass.git ~/orca-glass` and point your agent at `skills/orca-glass-setup/SKILL.md`
3. Paste the pairing code the agent gives you into Orca Glass on the phone. That's it — it reconnects automatically when the tunnel URL changes.

Connection setup uses the pairing code only.

Just want to look? Tap **Try the demo** in the app — no Mac needed.

Manual setup: `sh scripts/doctor.sh`, then `npm start`, then `npm run pair`.

## What leaves your Mac

| Where | What |
| --- | --- |
| Cloudflare Quick Tunnel (`*.trycloudflare.com`) | Bridge traffic. Every API call requires your token. Free, no account, **no uptime guarantee**. |
| ntfy.sh (random topic) | Tunnel URL + timestamp + HMAC signature. **Never the token.** The app ignores unsigned or wrongly signed URLs. |
| Nowhere | Voice. Audio is transcribed locally by whisper.cpp. |

Only fixed templates and text you confirm on the glasses are ever typed into your agents.

## Requirements

macOS, Node.js 20+, Orca (running), `cloudflared`, and for voice `whisper-cpp` + a ~550 MB model (`sh scripts/get-model.sh`).

## License

MIT
