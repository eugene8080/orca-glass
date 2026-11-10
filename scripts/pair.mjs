// 接続コード eho1.<トピック>.<トークン> を表示し、macOS ならクリップボードにも入れる
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { clipboardCommand } from '../bridge/platform.mjs';

const dir = fileURLToPath(new URL('../bridge/', import.meta.url));
for (const f of ['.token', '.topic']) {
  if (!existsSync(dir + f)) {
    console.error(`bridge/${f} がありません。先に npm start で一度起動してください。`);
    process.exit(1);
  }
}
const code = `eho1.${readFileSync(dir + '.topic', 'utf8').trim()}.${readFileSync(dir + '.token', 'utf8').trim()}`;
const clipboard = clipboardCommand();
try {
  if (!clipboard) throw new Error('clipboard unavailable');
  execFileSync(clipboard, { input: code, windowsHide: true });
  console.log('Pairing code copied. Paste it into Orca Glass in the Even Realities app on your phone.');
} catch {
  console.log('Pairing code (paste into Orca Glass on your phone):');
  console.log(code);
}
