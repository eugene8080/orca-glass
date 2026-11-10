// Render the real app and native SDK with synthetic data for store screenshots.
// No real bridge, credentials, agent process, or microphone is used.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from '../app/node_modules/vite/dist/node/index.js';

const version = JSON.parse(readFileSync(new URL('../app/app.json', import.meta.url), 'utf8')).version;
const samples = [
  { handle: 'store-a12c34', title: 'Polish search UI', agent: 'cursor', state: 'busy', workspaceId: 'site', workspaceName: 'website' },
  { handle: 'store-b56d78', title: 'Review project', agent: 'pi', state: 'idle', workspaceId: 'docs', workspaceName: 'docs' },
  { handle: 'store-c90e12', title: 'Release notes', agent: 'claude', state: 'idle', workspaceId: 'glass', workspaceName: 'orca-glass' },
  { handle: 'store-d34f56', title: 'Simplify sign-in', agent: 'codex', state: 'idle', workspaceId: 'app', workspaceName: 'sample-app' },
  { handle: 'store-e78a90', title: 'Fix flaky tests', agent: 'opencode', state: 'busy', workspaceId: 'app', workspaceName: 'sample-app' },
  { handle: 'store-f12g34', title: 'Refactor module', agent: 'openclaude', state: 'idle', workspaceId: 'glass', workspaceName: 'orca-glass' },
  { handle: 'store-g56h78', title: 'API sketch', agent: 'claude', state: 'idle', workspaceId: 'archive', workspaceName: 'archive' },
  { handle: 'hermes:r4f2a1', title: 'Research notes', agent: 'hermes', state: 'idle', workspaceId: 'hermes-bot:research', workspaceName: 'Research bot', hermesGroup: 'bot' },
  { handle: 'hermes:s7d3b9', title: 'Plan next steps', agent: 'hermes', state: 'idle', workspaceId: 'hermes-session:desktop', workspaceName: 'Desktop', hermesGroup: 'session' },
  { handle: 'hermes:j9c8e5', title: 'Morning summary', agent: 'hermes', state: 'idle', workspaceId: 'hermes-job:summary', workspaceName: 'Morning summary', hermesGroup: 'job' },
];
const workspaces = [
  { id: 'app', name: 'sample-app', lastActivityAt: 500 },
  { id: 'glass', name: 'orca-glass', lastActivityAt: 400 },
  { id: 'site', name: 'website', lastActivityAt: 300 },
  { id: 'docs', name: 'docs', lastActivityAt: 200 },
  { id: 'archive', name: 'archive', lastActivityAt: 100 },
  { id: 'hermes-bot:research', name: 'Research bot', hermes: 'bot' },
  { id: 'hermes-session:desktop', name: 'Desktop', hermes: 'session' },
  { id: 'hermes-job:summary', name: 'Morning summary', hermes: 'job' },
];
const nativeText = '/ Simplify sign-in and keep the existing behavior.\n> The sign-in flow now shares one session check.\n  Changes ready for review:\n  - Expired sessions show a clear message.\n  - Existing sessions stay signed in.\n  - The reset link works with keyboard input.\n  Validation:\n  1. All 42 tests pass.\n  2. No new dependencies.\n  3. Ready for your review.';
const tableText = '/ Plan the rollout steps.\n> Here is a compact checklist:\n  | Step        | Owner  | Status |\n  |-------------|--------|--------|\n  | Unit tests  | Agent  | Pass   |\n  | Docs update | You    | Ready  |\n  | Beta upload | Script | Done   |\n  Notes:\n  - Table columns stay aligned in every pixel font.\n  - Wrapped lines hang under the text after a marker, so long list items stay easy to follow on the glasses.\n  Next: confirm on G2 with fictional data only.';
const choiceMenu = {
  id: 'store-choice-1',
  question: 'How should we ship this UI refresh?',
  options: [
    { value: '1', label: 'Beta channel first' },
    { value: '2', label: 'Wait for G2 checks' },
    { value: '3', label: 'Type something' },
  ],
};
const byHandle = Object.fromEntries([
  ['store-a12c34', { text: nativeText, model: 'Composer 2.5', menu: null, progress: 'Editing files' }],
  ['store-b56d78', { text: nativeText, model: 'Qwopus-Pi-128k', menu: null }],
  ['store-c90e12', { text: nativeText, model: 'Opus 5.5', menu: choiceMenu }],
  ['store-d34f56', { text: tableText, model: 'GPT-6.1-Sol low', menu: null }],
  ['store-e78a90', { text: nativeText, model: 'Qwopus3.8-27B-Coder-Flash', menu: null, progress: 'Running tests' }],
  ['store-f12g34', { text: nativeText, model: 'GPT-5.6 Sol high', menu: null }],
  ['store-g56h78', { text: nativeText, model: 'Opus 5.5', menu: null }],
  ['hermes:r4f2a1', { text: '/ Summarize the competitor notes.\n> Three themes stand out: pricing, onboarding and offline use.', model: 'Hermes Auto', menu: null }],
  ['hermes:s7d3b9', { text: '/ Draft the afternoon plan.\n> Focus on store screenshots, then description.', model: 'Hermes Auto', menu: null }],
  ['hermes:j9c8e5', { text: '/ Morning summary\n> Overnight tests passed. No live sessions touched.', model: 'Hermes Auto', menu: null }],
]);
const defaultThread = { text: nativeText, model: 'GPT-6.1-Sol low', menu: null };
const working = new Set(['store-a12c34', 'store-e78a90']);
const limit = (usedPercent, minutes) => ({ usedPercent, resetsAt: Date.now() + minutes * 60000, computerResetDescription: 'Fri 9:00 AM', resetDescription: 'Fri 9:00 AM' });
const usage = {
  codex: { provider: 'codex', status: 'ok', session: limit(18, 135), weekly: limit(35, 6120) },
  claude: { provider: 'claude', status: 'ok', session: limit(12, 180), weekly: limit(28, 4320) },
  cursor: { provider: 'cursor', status: 'ok', monthly: limit(24, 20160) },
};
const api = `
const byHandle = ${JSON.stringify(byHandle)};
const defaultThread = ${JSON.stringify(defaultThread)};
const working = new Set(${JSON.stringify([...working])});
export const setDemo=()=>{},setApiLang=()=>{},setConnection=()=>{};
export const currentBase=()=> 'store preview (sample data)';
export const api={
  threads:async()=>${JSON.stringify(samples)},
  thread:async(handle)=>{const row=byHandle[handle]||defaultThread;return {text:row.text,menu:row.menu??null,progress:row.progress??'',model:row.model};},
  history:async(handle)=>{const row=byHandle[handle]||defaultThread;return {text:row.text,source:'codex-transcript',model:row.model};},
  activity:async(handle)=>({state:working.has(handle)?'working':'waiting',elapsedSeconds:working.has(handle)?83:null}),
  health:async()=>({ok:true}),capabilities:async()=>({voice:true}),
  transcribe:async()=>({text:'Looks good. Add a test for expired sessions, then show me the diff before merging.'}),
  say:async()=>{throw new Error('Store preview: sending is disabled.');},
  choice:async()=>{throw new Error('Store preview: choices are disabled.');},
  usage:async()=>(${JSON.stringify(usage)}),
  providers:async()=>[{id:'codex',models:['default'],ok:true,note:'Ready'}],
  workspaces:async()=>${JSON.stringify(workspaces)},
  prompts:async()=>['Start without a prompt','Run tests and report','Summarize changes'],
  startSession:async()=>{throw new Error('Store preview: launching is disabled.');},
};`;
// Intercept only microphone requests. Native rendering and gestures stay real.
const shim = `<script>
const timer=setInterval(()=>{
 const host=window.flutter_inappwebview;if(!host?.callHandler)return;clearInterval(timer);
 const original=host.callHandler.bind(host);
 host.callHandler=async(name,...args)=>{
  let p;try{p=typeof args[0]==='string'?JSON.parse(args[0]):args[0];}catch{}
  if(p?.method)console.log('Native call',JSON.stringify(p));
  // The app reads its language from storage, not the URL: seed it once from ?lang=ja|en.
  if(p?.method==='getLocalStorage'&&['ja','en'].includes(new URLSearchParams(location.search).get('lang'))&&JSON.stringify(p.data).includes('"lang"')&&!window.__langSeeded){
   window.__langSeeded=true;
   const q={...p,method:'setLocalStorage',data:{...p.data,value:new URLSearchParams(location.search).get('lang')}};
   await original(name,typeof args[0]==='string'?JSON.stringify(q):q,...args.slice(1));
  }
  if(p?.method==='audioControl'){
   if(JSON.stringify(p.data).includes('true'))setTimeout(()=>window.dispatchEvent(new CustomEvent('evenHubEvent',{detail:{audioEvent:{audioPcm:Array(32000).fill(0)}}})),100);
   return true;
  }
  return original(name,...args);
 };
},10);
</script>`;
const server = await createServer({
  root: fileURLToPath(new URL('../app/', import.meta.url)), configFile: false,
  define: { __BRIDGE_ORIGIN__: '""', __APP_VERSION__: JSON.stringify(version) },
  server: { host: '127.0.0.1', port: 8792, strictPort: true },
  plugins: [{
    name: 'store-sample-data', enforce: 'pre',
    resolveId(id) { if (id === './api') return '\0store-api'; },
    load(id) { if (id === '\0store-api') return api; },
    transformIndexHtml(html) { return html.replace('<head>', '<head>' + shim); },
  }],
});
await server.listen();
console.log(`Orca Glass ${version} store preview: http://127.0.0.1:8792/?code=demo&lang=en`);
console.log('Japanese preview URL: http://127.0.0.1:8792/?code=demo&lang=ja');
console.log('Synthetic data only. Sending and session creation are disabled.');
