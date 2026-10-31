# Orca Glass work
Updated: 2026-11-01

| Task | Status | Evidence / remaining work |
| --- | --- | --- |
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
