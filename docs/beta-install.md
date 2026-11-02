# Personal beta installation
Updated: 2026-11-02

## Current state

Version 1.0.2 is packaged in ignored `.local/orca-glass-1.0.2.ehpk`.
38 automated tests, beta packing, ordinary build and doctor passed.
2026-11-02: signed in as eugene8080@gmail.com; registered
`com.eugene8080.orcaglass`, uploaded version 1.0.2 (45,776 bytes), and
promoted it to beta. Server listing confirms channels=[beta]. Invited the same
account as tester; server status is Invited. User must accept the email invitation
before installation through Me → Beta tester. Phone installation and G2 behavior
are unverified. No public submission or publication performed.

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
no Windows automatic-start service was installed. To remove only this proxy:
`tailscale serve --https=8443 off`.

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
