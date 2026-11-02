# Personal beta installation
Updated: 2026-11-02

## Current state

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
