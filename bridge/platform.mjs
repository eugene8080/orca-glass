import { existsSync } from 'node:fs';
import { join, delimiter } from 'node:path';

export function executable(name) {
  const extensions = process.platform === 'win32' ? ['', '.exe', '.cmd', '.bat'] : [''];
  for (const dir of (process.env.PATH || '').split(delimiter)) {
    for (const ext of extensions) {
      const candidate = join(dir.replace(/^"|"$/g, ''), name + ext);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

export function orcaExecutable() {
  if (process.env.ORCA_BIN) return process.env.ORCA_BIN;
  if (process.env.ORCA_CLI_COMMAND) return process.env.ORCA_CLI_COMMAND;
  if (process.env.ORCA_DEV_REPO_ROOT) return 'orca-dev';
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    const installed = join(process.env.LOCALAPPDATA, 'Programs', 'orca', 'resources', 'bin', 'orca.exe');
    if (existsSync(installed)) return installed;
  }
  return 'orca';
}
