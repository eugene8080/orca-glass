# Personal beta installation
Updated: 2026-11-02

## Current state

User confirms Filter by Agent works on G2, including Pi and Cursor alongside
Claude and Codex. Filtering and dynamic provider discovery are verified.

User confirms the phone listing showed **1.0.6** and has now updated to
**1.0.8**. The earlier phone update-availability report is resolved. No
reinstallation or invitation change is needed. This does not establish the
cause of the historical CLI tester-roster discrepancy.

2026-11-02 beta **1.0.8** uploaded/promoted and channel verified (47,455 bytes).
Session click now does nothing; voice review click-to-send remains. Restores
native idle slash and bright frame/divider, and renames filter to Filter by Agent.
58 tests/build pass; official simulator verifies visible decorations and identical
reader pixels after click. User subsequently confirmed session click does nothing,
frame/divider present, slash before Waiting input and input hint visible on G2.
User further confirmed visible Braille spinner, animated thinking/pondering
labels, cycling dots and response timer present on G2. Exact cadence, numerical
timer accuracy and voice flow were not explicitly checked. The user also
confirmed the Filter by Agent menu label on G2.

2026-11-02 beta **1.0.7** uploaded/promoted and channel verified (47,887 bytes).
Adds framed compact conversation, visible Braille spinner, five-second working
words/animated dots, and a right-aligned provider-reported elapsed duration before
the input hint. Includes Filter Agents rename.62 tests/build/doctor pass; native
simulator verifies visuals and live Codex activity returns its actual duration.
G2 validation pending. See docs/session-reader.md for provider/source limitations.

2026-11-02 update availability report: user cannot see the1.0.6 update and has
not checked the new menu on G2. CLI recheck confirms version1.0.6 assigned beta,
signed account eugene8080@gmail.com, tester roster still Invited. Earlier user
acceptance/installations do not resolve that server mismatch; do not dismiss it
as proven cosmetic. App listing was renamed Orca Glass (without Windows).
Asked user to reopen phone app and report Me→Beta tester listing/details version.
No reinvitation, membership removal, reinstall, beta-channel mutation or code
change performed for this report. Native-menu regression scope remains pending.

2026-11-02 latest beta is **1.0.6** (46,466 bytes), channel verified. App display
name is now **Orca Glass** in manifest and portal. Added native View options >
only on the sessions list, opening persisted provider filters; session Menu keeps
OS-owned Display off/Brightness/Close.56 tests/build/doctor pass; native simulator
menu/filter/context checks passed. Firmware system rows, close wording and ✓
glyph appearance require G2 verification. The SDK cannot customize system slot
ordering or exact close toast. See docs/context-menu.md. No public publication.

2026-11-02 spacing fix (server-only): user reported restarted or displayed as
restartedor. cleanScreen's heuristic concatenated full-width terminal rows after
stripping whitespace. A synthetic two-row example reproduced that exact string.
Removed heuristic unwrapping; preserve newline boundaries instead of guessing
whether a wrap split a word or replaced a separator. Internal spaces are retained.
53 tests and doctor pass; bridge restarted and HTTPS200 verified. No beta update
or reader/scroll/voice-layout change. Original phrase was no longer in the current
pc-settings output, so this is a reproduced mechanism, not a captured original
render. Simulator fixture was stopped; automatic relaunch rejected blocked by
policy. No new simulator screenshot or G2 verification performed.

2026-11-02 later hardware report: user saw Working after initially reporting it
stayed on Waiting; both states are now user-observed on G2. User also reported
needing Resume latest output to refresh text. That symptom remains distinct and
unresolved: current code intentionally pauses body updates on scrolling or voice
cancel, while activity continues; sending/resuming re-enables following. No
evidence yet that text stalled without such a pause. No app change made.

2026-11-02 latest hardware confirmation: after close/reopen guidance, user
reported the G2 footer now displays Waiting for input. Bottom review and chat
position were already confirmed stable by the user. No additional beta or code
change was made. Do not infer the exact cause of the preceding unavailable
display from this recovery. A complete working→waiting transition on G2 has not
yet been explicitly reported; both states were verified in the simulator.

2026-11-02 hardware follow-up: user confirms restored bottom review and stable
chat position in1.0.5, but footer still reports Status unavailable. This remains
open despite simulator success. Added local activity trace (time, handle suffix,
origin and state only; no credentials/transcript). After bridge restart, the
phone's origin http://127.0.0.1:44253 repeatedly requested the selected e4c9a8
session and received working. Other desktop checks returned working/waiting200.
Downloaded beta1.0.5 package SHA256 exactly matches the locally tested package.
Asked user to confirm installed version; not yet answered. A read-only real-client
simulator launch was rejected by execution review (blocked by policy); it did not
run. No new beta uploaded, no further layout/scroll changes, no claimed fix.

2026-11-02 latest beta is **1.0.5** (46,075 bytes), upload/promotion verified.
User rejected line-by-line chat scrolling and asked to remove the separate review
page. Native chat scrolling remains. Recording/review/Send/Cancel update only the
bottom panel; a rejected panel no longer triggers a full-page fallback. Draft
review does not separately capture native swipes. Status now fetches immediately
and uses only valid native text-update fields; unsupported layout fields caused
the simulator's frozen/unavailable status.50 tests/build/doctor pass.

Desktop-session official simulator checks: visually confirmed Working→Waiting,
live reply after source fallback, no chat rebuild/body rewrite during voice flow,
exactly one full fake transcript send. Reader pixel crop (excluding scrollbar)
was identical before recording, during review, after cancel and after send.
Hardware appearance remains pending; update the phone beta to1.0.5. The1.0.4
review-screen behavior described below is historical and superseded.

2026-11-02 latest: beta channel is now **1.0.4** (46,426 bytes), verified after
upload/promotion. Install/update through the phone's Beta tester entry. This build
adds activity status in the reserved bottom voice area while reading. Working…
and Waiting for input come from Orca's exact-pane agent state, not terminal titles.
Unrecognized state/request failure displays Status unavailable; blocked/error
state displays Needs attention. Polling continues when conversation text is paused,
without replacing that text. Recording/review temporarily owns the panel;
Send/Cancel restores status and Cancel keeps text paused. 50 tests/build/doctor
pass, including paused-reader updates and late-status/voice protection. Live
HTTPS activity verified working for this session and waiting for completed
sessions. Hardware appearance and phone update remain pending; no public release.

This version also repairs saved-history source loss: a reader formerly locked
to codex-transcript now switches to the live screen when the bridge returns
terminal-buffer or cannot load saved history. Live native text updates must be
acknowledged before the UI records them as displayed; rejected uploads retry.
The current session's history endpoint was observed returning terminal-buffer,
confirming the previously ignored transition. These fixes do not remove the
intentional pause while reading older conversation text; click and choose Resume
latest output to follow again after scrolling.

Voice review now uses a dedicated full-screen transcript page. Up/down moves
through every line of the draft; click sends the full text once, double cancels.
The background chat cannot capture review scrolling. Capture/previews still use
the reserved bottom panel. Returning from review rebuilds the selected chat block;
the SDK does not expose the exact native scroll offset for restoration. This
supersedes older no-rebuild-at-review notes. Hardware review scrolling and live
reply behavior remain pending. Tests cover long drafts, no send while scrolling,
one full-text send, lost-history fallback and rejected-upload retry.

Version 1.0.2 is packaged in ignored `.local/orca-glass-1.0.2.ehpk`.
38 automated tests, beta packing, ordinary build and doctor passed.
2026-11-02: signed in as eugene8080@gmail.com; registered
`com.eugene8080.orcaglass`, uploaded version 1.0.2 (45,776 bytes), and
promoted it to beta. Server listing confirms channels=[beta]. User confirmed
accepting the tester invitation; their phone screenshot shows Orca Glass Windows
installed with a Beta badge on the home screen. CLI still reported Invited, so
that status conflicts with observed installation. Beta launch/G2 behavior remains
unverified. No public submission or publication performed.

## Stable bridge

Beta builds connect to `https://pscap11.tailf91bf7.ts.net:8443`, explicitly
allowed by `app/app.json`. Phone Tailscale must be connected to the same tailnet.
The existing signed Quick Tunnel discovery remains available in prototype builds.
Beta packages contain no pairing credential. Enter the existing connection code
once on the phone; `npm run pair` copies it to the PC clipboard.

Configured and checked on 2026-11-02:

```powershell
tailscale serve --bg --https=8443 http://127.0.0.1:8787
```

This is tailnet-only. The pre-existing port443 Funnel to port8600 is untouched.
HTTPS health and frontend returned HTTP200. The bridge still needs to run;
automatic sign-in startup is configured below. To remove only this proxy:
`tailscale serve --https=8443 off`.

## Windows automatic startup

2026-11-02: registered Task Scheduler task **Orca Glass Bridge** for PSCAP11's
`eugen` user, triggered at that user's Windows sign-in. It runs PowerShell and the
existing bridge/tunnel supervisor hidden, with normal user privileges, no stored
password, no execution time limit, and no battery restriction. Failure recovery
is configured for 999 retries one minute apart. Duplicate task instances are
ignored; a named mutex prevents duplicate launcher instances. An occupied bridge
port is left untouched. Orca itself must still be running for session access.

Reinstall/update the task with `scripts/install-windows-startup.ps1`.
Its launcher is `scripts/start-windows.ps1`; private logs are in
`.local/startup.log`, `.local/custom-output.log`, and `.local/custom-error.log`.
It starts after sign-in following power-up/reboot, not before Windows sign-in.

Verified by terminating only the process tree of the inspected old Orca Glass
supervisor, starting the scheduled task, checking task state Running and settings,
and receiving authenticated HTTP200 for local/HTTPS capabilities and HTTPS session
listing (two Codex sessions). No input was sent. A real reboot/sign-in trigger
and failure-recovery timing were not tested. No change to native Even Terminal,
existing Tailscale routes, or provider restrictions.

To disable startup: `Disable-ScheduledTask -TaskName 'Orca Glass Bridge'`.
This disables future starts; it does not terminate the running bridge.

## First registration

Sign in with the same Even Realities account used on Android:

```powershell
cd D:\dev\orca-glass\app
.\node_modules\.bin\evenhub.cmd login
.\node_modules\.bin\evenhub.cmd self-check --json
.\node_modules\.bin\evenhub.cmd ls --json
```

Check ownership and whether `com.eugene8080.orcaglass` already exists before
creating it. If absent:

```powershell
.\node_modules\.bin\evenhub.cmd create ..\.local\orca-glass-1.0.2.ehpk --name "Orca Glass Windows" --tagline "Read and reply to your Orca Codex sessions"
.\node_modules\.bin\evenhub.cmd promote 1.0.2 --to beta
.\node_modules\.bin\evenhub.cmd testers add <phone-account-email>
.\node_modules\.bin\evenhub.cmd ls com.eugene8080.orcaglass
.\node_modules\.bin\evenhub.cmd testers
```

Accept the tester invitation email. Verify both beta channel and Active tester
membership, then install through Even Realities → Me → Beta tester. Uploading
or promoting is not proof of installation. Public marketplace submission is
not requested and must not be performed.

## Later code updates

2026-11-02 Codex usage repair supersedes earlier usage403 notes: Orca account
list still reports HTTP403 from the OpenAI usage endpoint, while a read-only
request through the current PcSettings proxy succeeds. Bridge now prefers a
successful Orca usage result; otherwise it reads the selected route from
LOCALAPPDATA/PcSettings/AiRouting/route.json and launches a scoped Node
--use-env-proxy subprocess. It verifies api.ipify.org against expectedExitIp
before reading the first-party usage endpoint with the existing local Codex
ChatGPT login (CODEX_HOME or user .codex). No login tokens are returned or logged.
No global proxy changes, Orca restart, inference or Claude interaction.

Responses are cached for60 seconds and concurrent fallback calls share one
request. Map windows by duration: OpenAI returned only a weekly primary window,
so no5h figure is invented. Installed beta HTTPS usage returned status=ok,
weekly44%, reset2d17h after scheduled bridge restart. 44 tests/build/doctor pass;
actual phone display remains unverified. Reopen Usage; no beta update required.
The underlying Orca usage routing issue remains outside this bridge repair.

2026-11-02 idle-name correction supersedes tab-only naming below: user confirmed
the tab also resets to Codex ready while idle. Bridge now prefers worktree ps
conversationName by exact workspace/pane, and retains a last meaningful name
per running incarnation when idle metadata is missing. Cache is bounded and
in-memory; it does not survive bridge restarts. Renames replace cached names;
new incarnations cannot inherit them. 42 tests pass, including both titles
resetting, missing metadata, rename and incarnation isolation. HTTPS names checked
after restart. Actual post-turn idle transition and phone display remain unverified.

2026-11-02 session names: bridge uses Orca visual-layout tab titles (or explicit
pane titles), keyed by exact workspace/tab identity, instead of transient program
status such as Codex ready. Auto-generated worker-task tab IDs retain the more
descriptive program title. HTTPS verified orca-glass beta and Audit Orca VPN
preflight checks after restart; 40 tests/build/doctor pass. Refresh sessions on
the phone to replace its currently displayed list. No beta update required.

2026-11-02 existing-session scope: bridge lists all connected, non-orphaned local
terminals across providers, including child workers. Read/history/reply guards
accept those terminals too. Verified three sessions and OpenCode screen/history
via authenticated HTTPS after scheduled bridge restart. Refresh sessions in the
installed app; no beta reinstall is required for this server-only change.
No input sent and no Claude interaction tested. New-session creation and separate
native AI routing remain Codex-only. Usage is separately unavailable because
Orca's OpenAI usage request returns HTTP403; no proxy changes made for that issue.

Increase `version` in `app/app.json` for each upload. From the repository root:

```powershell
npm test
npm run beta:update -- "Describe this update"
```

This command checks authentication/ownership, builds, packs, uploads and promotes
the manifest version to beta, then lists server state. Install the update on the
phone. Existing active tester membership carries forward. `npm run beta:pack`
only builds/packages locally and performs no upload. These commands build into
`app/dist`; run `npm --prefix app run build` afterwards if continuing the old
public QR prototype without phone Tailscale.

References: [CLI](https://hub.evenrealities.com/docs/cli),
[beta testing](https://hub.evenrealities.com/docs/test/beta-testing),
[network allowlist](https://hub.evenrealities.com/docs/build/networking).
