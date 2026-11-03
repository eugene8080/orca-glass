# Orca Glass

**Read your coding sessions. Speak your next step.**

Orca Glass connects Even Realities G2 glasses to Orca on Windows. Browse connected sessions, read a conversation, check agent activity, and review a spoken instruction before sending it back to your PC.

This is Eugene's Windows/Android fork of [2ero20ne's Orca Glass](https://github.com/2ero20ne/orca-glass), licensed under MIT. Interface and speech recognition use English.

## Availability

As of 2026-11-03, **1.0.21 is a personal beta**, not a public Even Hub release. The installed build connects to a specific PC over Tailscale; it is not yet a self-service installation for arbitrary PCs. Orca and the companion bridge must remain running. The phone and glasses do not run the coding agent.

The active app is the custom Orca Glass bridge. Earlier native Even Terminal experiments are historical. See [current work](TODOS.md) and [beta setup/release history](docs/beta-install.md).

## Features and controls

- **Sessions:** browse connected agent terminals, filter by provider, and see working/idle activity. The contextual menu offers Refresh sessions, New Session and Usage.
- **Conversation:** read native scrollable text with live activity status. Scrolling pauses text updates; return to the list and reopen to resume.
- **Voice:** hold to talk, release to review, click to send, double-click to cancel. Whisper transcribes on the PC. The conversation stays mounted above the voice review area.
- **New session:** choose an existing Orca workspace and start Codex.
- **Usage:** view available allowance windows; absent windows are not invented.

Codex is the primary supported workflow. Other connected agents may appear in the list and filter, but reader support depends on their terminal format. Tool records, internal reasoning and terminal chrome are filtered; public assistant progress messages can still appear. New-session creation is Codex-only. Live Claude testing is not authorized in this project.

## Screenshots

Native 576 × 288 simulator captures of 1.0.21 with fictional sample data.

| Sessions | Conversation | Voice review |
| --- | --- | --- |
| ![Sessions](store/screenshots/1-threads.png) | ![Conversation](store/screenshots/2-answer.png) | ![Voice review](store/screenshots/3-reply.png) |
| **Usage** | **Workspace picker** | **App actions** |
| ![Usage](store/screenshots/4-usage.png) | ![Workspace picker](store/screenshots/5-new-session.png) | ![App actions](store/screenshots/6-actions.png) |

The simulator omits OS contextual entries. See [store profile/capture instructions](store/listing.md) for raw exports, the local gallery and remaining public-release preparation.

## Development

Requirements: Windows, Node.js 20+, installed/running Orca, and local Whisper for voice. The installed beta and earlier Quick Tunnel prototype use different network routes.

```powershell
npm --prefix app ci
npm test
npm --prefix app run build
npm run doctor
```

Run development servers and the simulator in named PowerShell terminals inside this repo's Orca workspace. See [project instructions](CLAUDE.md), [voice implementation](docs/voice-input.md), [reader behavior](docs/session-reader.md) and [session-list behavior](docs/session-list.md).

Pairing codes are credentials: keep them, authenticated QR files and local runtime settings out of Git and screenshots. Audio travels through the phone to the configured PC for local transcription. A confirmed reply is sent to the selected desktop agent, whose own provider/data policies then apply. Earlier prototype routes use Cloudflare and ntfy; the personal installed beta uses the configured Tailscale connection.

## License

[MIT](LICENSE). Original copyright: **Copyright (c) 2026 2ero20ne**.
Production builds include the full original notice in `LICENSE.txt` and project
links in `ATTRIBUTION.txt`. This independent fork does not imply upstream endorsement.
