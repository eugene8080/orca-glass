#!/usr/bin/env bash
# Install, remove or inspect the LaunchAgent that keeps the bridge running.
set -euo pipefail
LABEL='com.quietsignal.orca-glass.bridge'
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
START="$ROOT/scripts/start-macos.sh"

usage() {
  echo "Usage: $0 {install|uninstall|status}"
}

write_plist() {
  mkdir -p "$HOME/Library/LaunchAgents" "$ROOT/.local"
  cat >"$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${START}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${ROOT}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${ROOT}/.local/launchd-output.log</string>
  <key>StandardErrorPath</key>
  <string>${ROOT}/.local/launchd-error.log</string>
</dict>
</plist>
EOF
}

case "${1:-}" in
  install)
    write_plist
    launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
    launchctl bootstrap "gui/$(id -u)" "$PLIST"
    launchctl enable "gui/$(id -u)/${LABEL}"
    launchctl kickstart -k "gui/$(id -u)/${LABEL}"
    echo "Installed ${LABEL}"
    ;;
  uninstall)
    launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
    rm -f "$PLIST"
    echo "Removed ${LABEL}"
    ;;
  status)
    launchctl print "gui/$(id -u)/${LABEL}" 2>/dev/null || echo "Not loaded"
    lsof -nP -iTCP:8787 -sTCP:LISTEN 2>/dev/null || echo "Port 8787 is free"
    ;;
  *) usage; exit 2 ;;
esac
