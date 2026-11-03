import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
const manifest = JSON.parse(readFileSync(new URL('./app.json', import.meta.url), 'utf8'));

// .ehpk として Even App 内から開かれる時もファイルを辿れるよう相対パスで出力する
export default defineConfig({
  base: './',
  plugins: [{
    name: 'include-upstream-license',
    // The distributable must retain the upstream copyright and MIT terms, not
    // only link back to a repository that might later move or disappear.
    generateBundle() {
      this.emitFile({
        type: 'asset', fileName: 'LICENSE.txt',
        source: readFileSync(new URL('../LICENSE', import.meta.url), 'utf8'),
      });
      this.emitFile({
        type: 'asset', fileName: 'ATTRIBUTION.txt',
        source: 'Independent Windows/Android fork of Orca Glass by 2ero20ne.\n'
          + 'Original project: https://github.com/2ero20ne/orca-glass\n'
          + 'Fork: https://github.com/eugene8080/orca-glass\n'
          + 'Copyright (c) 2026 2ero20ne\n'
          + 'Used under the MIT License; see LICENSE.txt.\n',
      });
    },
  }],
  // Match the simulator's explicit IPv4 URL; Windows localhost may bind ::1 only.
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  define: { __BRIDGE_ORIGIN__: JSON.stringify(process.env.ORCA_GLASS_BRIDGE_ORIGIN || ''), __APP_VERSION__: JSON.stringify(manifest.version) },
});
