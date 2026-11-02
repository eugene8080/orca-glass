import { readFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const app = join(root, 'app');
const manifest = JSON.parse(readFileSync(join(app, 'app.json'), 'utf8'));
const allowed = manifest.permissions.find(p => p.name === 'network')?.whitelist ?? [];
const origin = process.env.ORCA_GLASS_BRIDGE_ORIGIN || allowed.find(u => u !== 'https://ntfy.sh');
if (!origin || new URL(origin).origin !== origin || !origin.startsWith('https://') || !allowed.includes(origin)) {
  throw new Error('Beta bridge must be an HTTPS origin explicitly listed in app/app.json');
}
const output = join(root, '.local', `orca-glass-${manifest.version}.ehpk`);
mkdirSync(join(root, '.local'), { recursive: true });

function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: app, stdio: 'inherit',
    env: { ...process.env, ORCA_GLASS_BRIDGE_ORIGIN: origin },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Beta build step failed: ${args[0]} (exit ${result.status})`);
}

// Call Node entrypoints directly so Windows needs no shell argument expansion.
run([join(app, 'node_modules/typescript/bin/tsc')]);
run([join(app, 'node_modules/vite/bin/vite.js'), 'build']);
const cli = JSON.parse(readFileSync(join(app, 'node_modules/@evenrealities/evenhub-cli/package.json'), 'utf8'));
const executable = typeof cli.bin === 'string' ? cli.bin : cli.bin.evenhub;
run([join(app, 'node_modules/@evenrealities/evenhub-cli', executable),
  'pack', 'app.json', 'dist', '-o', output, '--sdk-ver', manifest.min_sdk_version]);
console.log(`Beta package: ${output}\nBridge: ${origin}\nPairing credential is entered once on the phone; it is not bundled.`);
