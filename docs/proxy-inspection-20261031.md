# Even Terminal proxy inspection
Updated: 2026-10-31

Read-only inspection requested by Eugene. No Claude process was launched,
no Claude API request or input was sent, and no proxy/runtime configuration
was changed. No model inference test was performed for either provider.

## Findings

- Read the actual x64 Windows process environments through OpenProcess,
  NtQueryInformationProcess and ReadProcessMemory, printing only an allow-list
  of proxy/config fields. The full environments were not saved.
- Even Terminal PID47132 and its Codex app-server PID46928 have no HTTP_PROXY,
  HTTPS_PROXY, ALL_PROXY, NO_PROXY (including lowercase variants) configured.
- Neither Windows user-level nor machine-level environment defines those four
  uppercase variables. The shell wrapper sets them for an agent launch and
  restores its previous environment afterward.
- The selected local routing configuration points at localhost port18889.
  That listener exists. Listener presence does not verify upstream egress.
- Claude's user settings contain HTTP_PROXY, HTTPS_PROXY and ALL_PROXY pointing
  to that same localhost proxy, with loopback-only NO_PROXY. The pc-settings
  incident record dates that repair to 2026-10-30.
- Even Terminal0.10.5's Claude SDK query explicitly loads user and project
  settings. Its host has no CLAUDE_CONFIG_DIR override. No proxy override was
  found in this repository's Claude settings; other session project roots were
  not audited.
- The established-socket snapshot showed Even Terminal connected to its local
  Codex server and a Tailscale peer, and Codex connected locally to Even Terminal.
  It did not show a provider connection and cannot establish historical egress.

## Interpretation

Claude has a user-settings proxy path independent of shell inheritance. The
earlier statement that bypassing the PowerShell wrapper necessarily loses its
proxy configuration was incomplete. Static settings indicate a configured route,
not proof for an existing process, an older session, or a project override.

Even Terminal's running Codex app-server lacks the explicit proxy environment
used by the normal Codex launcher. The PC's separately selected Tailscale exit
node can still route its internet traffic; that is not the same as proving use
of the selected dedicated proxy. No repair or restart was requested or performed.

References inspected: installed Even Terminal dist/claude/session.js,
dist/startup/common.js and dist/util/spawn-shim.js; pc-settings
scripts/Codex-Vps.ps1 and
maintenance/incidents/2026-10-30-claude-background-proxy-gap.md.
