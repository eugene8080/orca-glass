# Even Hub store listing — Orca Glass

Language policy: this Windows fork supports English only. Other upstream
platform/listing details below are historical and must be reviewed before publication.

- App name: Orca Glass
- Tagline (≤50): View and reply to Orca agent sessions
- Developer: 2ero20ne
- Privacy & terms: https://www.2ero20ne.com/orca-glass/privacy
- Source / setup: https://github.com/2ero20ne/orca-glass

## Description (English)

Keep an eye on your coding agents without going back to your desk.

Orca Glass connects your G2 to Orca running on your own Mac:

- Threads — every Claude Code / Codex session, which ones are waiting for you (●), and the latest answer. Tool output and thinking are filtered out.
- Reply — one-tap replies (Yes / No / Continue …), or speak a reply: it is transcribed on your Mac and shown on the glasses before you send it.
- New session — pick a workspace, agent, model and a first prompt.
- Usage — 5-hour and weekly limits per provider.
- English only.

Requires setup on your Mac. Orca Glass talks to a small open-source bridge on your Mac (github.com/2ero20ne/orca-glass). Ask your coding agent to "set up Orca Glass", then paste the pairing code into this app once. It works away from home: the bridge is reached through a Cloudflare Quick Tunnel and reconnects automatically when the tunnel address changes.

Your data stays yours: the developer runs no server and collects nothing. Voice is transcribed on your Mac and never leaves it.

## Review notes

- The app needs a companion bridge running on the user's own Mac (open source, linked above). Without it the app shows setup instructions.
- Network: the app contacts ntfy.sh (listed) to find the user's bridge URL, then the user's own Cloudflare Quick Tunnel URL (`https://<random>.trycloudflare.com`, different for every user). All bridge requests require the user's token; URLs from ntfy are accepted only with a valid HMAC signature.
- Microphone: used only when the user chooses a voice reply; audio is sent to the user's own Mac for transcription.
- To review without a Mac: open the app and tap **Try the demo (no Mac needed)**. Every screen (threads, answer, replies, voice reply, new session, usage) works with sample data.

## Assets to prepare

- Cover image
- Screenshots of the glasses display (576×288): home (thread list), thread (answer), reply menu, voice confirm, new session, usage — in English
