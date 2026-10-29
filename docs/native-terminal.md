# Native Even Terminal on Windows
Updated: 2026-10-29

## Current route

Codex on PSCAP11 ↔ official Even Terminal 0.10.5 ↔ Tailscale ↔ Even Realities
Android app ↔ paired G2 glasses. This uses Terminal Mode, not an Even Hub plugin.
Developer Mode and a public marketplace listing are unnecessary for this route.

Installed with `npm install -g @evenrealities/even-terminal@0.10.5`.
The native host configuration is in the user's `.even-terminal/config.json`.
Default provider is `codex`, network is `tailscale`, port is `3456`, and project
directory is this repository. The pairing token is kept outside Git.

Native Even Terminal is multi-provider software. Selecting Codex is a default,
not a server-side ban on other providers. Do not select, launch, or test Claude
until Eugene explicitly authorizes it. No Claude session/test was run here.

## Phone pairing

1. Keep Tailscale connected on Android to the same tailnet as PSCAP11.
2. Enable Even Realities → Settings → Features → Terminal.
3. Open Terminal from Home, then Host setup. Set Default agent to **Codex**.
4. On Windows, run `npm run pair:native` in this repository. Open the generated
   `.local/native-pairing.html` on the PC and scan its QR using Host setup's scanner.
5. Tap Probe, then Save. Verify a session appears and can be read on the G2.

The generated QR uses the official package's URL fields: token, defaultProvider,
and name. It contains a credential and must not be committed or published.
Host on this machine: `100.115.235.106:3456`. The vendor lists G2 and R1 ring as
requirements; actual glasses/ring interaction remains to be checked by the user.

## Runtime

The host was started hidden on 2026-10-29. Its PID is in `.local/native.pid` and
its output/error logs are in `.local/native-output.log` and
`.local/native-error.log`. The output log contains a pairing token; do not share it.
No automatic startup service was installed.

To start after a reboot, run `even-terminal --provider codex --tailscale` in
PowerShell and keep it open. Do not start a second instance on port 3456 while
the current one is running. Stop a foreground instance with Ctrl+C. Before
stopping a recorded background PID, verify it still belongs to Even Terminal;
PIDs can be reused.

For a shared desktop/glasses thread, open a terminal in the desired project and
run `even-terminal codex`. It invokes the Codex CLI using `--remote` against the
same local app-server as the phone. Existing ordinary Orca terminals do not
automatically move into that app-server. Do not resume a live session concurrently
through a second execution backend. Transition a session deliberately after
stopping its original run, or create a separate test thread.

The native host can list existing Codex history. History visibility alone does
not prove that an already-running ordinary Orca terminal is synchronized.

## Verification on 2026-10-29

- Installed vendor version 0.10.5; `even-terminal --version` passed.
- Authenticated `/api/info?provider=codex` reported Codex CLI 0.163.0-alpha.11.
- Authenticated `/api/sessions?provider=codex&limit=3` returned three sessions
  through the PC's Tailscale address. This was a PC-side check, not a phone probe.
- Main listeners: loopback and Tailscale IPv4 on 3456. Codex app-server: loopback
  on 8765. No public tunnel is used by the native host.
- Source inspection confirms handlers for Codex `item/tool/requestUserInput`
  option labels and approval requests. No live choice was submitted.
- Pending: Android Probe/Save, glasses display, actual Codex numbered choice,
  shared-session behaviour, and reconnect/phone-lock behaviour.
- Claude was not launched or tested. macOS/iPhone were not tested or required.

## Termux SSH is separate

`ssh pscap11` defaults to the Termux account name. Use `ssh eugen@pscap11` for
this Windows user. Tailscale connectivity does not remove Windows OpenSSH
authentication. Passwordless SSH requires installing the phone's public key for
the Windows account. No SSH configuration was changed during this setup.

## References

- Vendor package: https://www.npmjs.com/package/@evenrealities/even-terminal
- The user's Even Android setup screens confirmed the Terminal Mode navigation
  and `even-terminal codex` shared-thread command on 2026-10-29.
