import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const app = join(root, 'app');
const manifest = JSON.parse(readFileSync(join(app, 'app.json'), 'utf8'));
const pkg = join(app, 'node_modules/@evenrealities/evenhub-cli');
const cli = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8'));
const executable = join(pkg, typeof cli.bin === 'string' ? cli.bin : cli.bin.evenhub);
const changelog = process.argv.slice(2).join(' ').trim();
if (!changelog || changelog.length > 500) {
  throw new Error('Supply a changelog of 1–500 characters: npm run beta:update -- "What changed"');
}
const run = args => execFileSync(process.execPath, args, { cwd: app, stdio: 'inherit' });
// Authentication and ownership must succeed before uploading any new build.
run([executable, 'self-check']);
run([executable, 'ls', manifest.package_id]);
run([join(root, 'scripts/build-beta.mjs')]);
run([executable, 'upload', join(root, '.local', `orca-glass-${manifest.version}.ehpk`),
  '--package-id', manifest.package_id, '-m', changelog]);
run([executable, 'promote', manifest.version, '--to', 'beta', '--package-id', manifest.package_id]);
run([executable, 'ls', manifest.package_id]);
