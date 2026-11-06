// Dev-only phone page preview: the app's own Vite config with the Even Hub SDK
// replaced by scripts/phone-preview-sdk.ts. Open http://127.0.0.1:8796/?code=demo
// at phone width. Run it in a named Orca terminal tab ("Phone Preview").
// Vite is installed under app/ only; resolve it from there.
const { createServer } = await import(new URL('../app/node_modules/vite/dist/node/index.js', import.meta.url).href);
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PHONE_PREVIEW_PORT || 8796);
const server = await createServer({
  root: fileURLToPath(new URL('../app', import.meta.url)),
  configFile: fileURLToPath(new URL('../app/vite.config.ts', import.meta.url)),
  resolve: { alias: { '@evenrealities/even_hub_sdk': fileURLToPath(new URL('./phone-preview-sdk.ts', import.meta.url)) } },
  server: { host: '127.0.0.1', port, strictPort: true, fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] } },
});
await server.listen();
console.log(`Phone preview: http://127.0.0.1:${port}/?code=demo`);
