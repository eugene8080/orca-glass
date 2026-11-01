# Orca Glass work
Updated: 2026-11-01

| Task | Status | Evidence / remaining work |
| --- | --- | --- |
| Earlier text display repair | Implemented; G2 retest pending | 2026-11-01: Eugene confirmed smooth firmware scrolling but Earlier text did nothing. Navigation now rebuilds an empty reader then explicitly uploads the selected section, bounds sections to 900 UTF-8 bytes, and checks native acknowledgments. 25 tests/build pass; exact hardware failure cause not proven. Static app updated, same tunnel/QR. |
| Warm Whisper previews and native overflow scrolling | Implemented; hardware pending | 2026-11-01: warm CPU decodes about 0.5 seconds for public 3/6/11-second clips. Serialized previews every 1.5 seconds; hold release sends, tap reviews. Intact text uses firmware scrolling; click opens reading controls. Supersedes line-step rendering. Native voice navigation was rejected. |
| Native Codex routing and incremental scrolling | Implemented; hardware check pending | 2026-11-01: native echo confirmed by Eugene. Same endpoint now routes after explicit voice session selection; mocked send/dedup/menu/incarnation tests pass. Custom reader moves one line per scroll, no page counters. Twenty tests/build pass. |
| Hold release transcription | Implemented | 2026-11-01: user confirmed hold capture works; release now transcribes immediately. Final send/cancel remains. Fourteen tests/build pass; reload app. |
| Text scrolling | Implemented; hardware pending | 2026-11-01: page counters, scroll up/down, preserve reading position, retained terminal history endpoint (up to 1,000 rows). Full archived Codex transcript is not implemented. Fourteen tests/build pass. |
| Native Even AI voice route | Echo prototype; hardware pending | User prefers built-in live captions/release-to-send. Official custom-agent endpoint confirmed. Separate Tailscale echo-only server on 8788; private settings page generated. Twelve automated tests pass. No routing into Codex yet. See docs/native-ai-voice.md. |
| Recording mode / status correction | Implemented; hold hardware pending | 2026-11-01: truthful connected-terminal header; persisted tap/hold setting. Hold release waits for click-to-transcribe or double-click discard. Ten automated checks and build pass; reload phone app for hardware test. |
| First G2 voice test | Passed | Eugene confirmed session list, accurate transcription and about 2–3 seconds delay. Test sentence reached this Codex conversation. No Claude interaction. |
| Live Orca workflow | Running; hardware pending | 2026-11-01 custom supervisor started; local/HTTPS health and capabilities passed, nine Codex terminals. Private custom pairing QR generated. Seven automated tests, build and doctor passed. Await Android/G2 scan. |
| G2 speech transcription | Local engine verified; hardware pending | Reused upstream PCM → whisper.cpp → review → Orca text. Windows b5454/base.en installed under ignored .local/voice, downloads hash verified; public JFK fixture passed through bridge transcribe. Real G2 capture/send still unverified. See docs/voice-input.md. |
| Native Even Terminal / Codex | Awaiting phone check | 0.10.5 installed and running over Tailscale on 3456; PC-side Codex info and session listing passed. Pairing QR generated. See docs/native-terminal.md. |
| Windows fork bridge | Alternative retained, stopped | Windows paths, discovery, pairing ported. Build, doctor, three menu tests, authenticated live Codex read and unauthenticated 401 passed. Public tunnel validation was not completed; initial failures were 1033/404, then isolated config and HTTP/2 were added. |
| Actual numbered choices | Awaiting hardware check | Native package source supports structured Codex questions/approvals. Fork has synthetic Codex fixtures only. Neither path has a live option selection verified. |
| Claude testing | Prohibited | Explicit user instruction, 2026-10-29. Await explicit authorization. |
| Direct mobile protocol transport | Deferred | Existing bridge is the first implementation. Requires an Even WebView transport prototype. |
| Public store release | Not requested | Private development QR first; no public submission. |
