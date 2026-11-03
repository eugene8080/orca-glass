import { defineConfig } from 'vite';

// .ehpk として Even App 内から開かれる時もファイルを辿れるよう相対パスで出力する
export default defineConfig({
  base: './',
  // Match the simulator's explicit IPv4 URL; Windows localhost may bind ::1 only.
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  define: { __BRIDGE_ORIGIN__: JSON.stringify(process.env.ORCA_GLASS_BRIDGE_ORIGIN || '') },
});
