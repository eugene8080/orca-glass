// Render the real app and native SDK with synthetic data for store screenshots.
// No real bridge, credentials, agent process, or microphone is used.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from '../app/node_modules/vite/dist/node/index.js';

const version = JSON.parse(readFileSync(new URL('../app/app.json', import.meta.url), 'utf8')).version;
const samples = [
  { handle: 'store-a12c34', title: 'Polish the search UI', agent: 'cursor', state: 'busy' },
  { handle: 'store-b56d78', title: 'Review project structure', agent: 'pi', state: 'idle' },
  { handle: 'store-c90e12', title: 'Prepare release notes', agent: 'claude', state: 'idle' },
  { handle: 'store-d34f56', title: 'Refactor authentication', agent: 'codex', state: 'idle' },
  { handle: 'store-e78a90', title: 'Fix flaky tests', agent: 'opencode', state: 'busy' },
];
const text = '/ Simplify the sign-in flow.\n> Session checks now share one function.\n  Expired tokens return a clear error.\n  All 42 tests pass.\n  Ready for your review.';
const api = `
export const setDemo=()=>{},setApiLang=()=>{},setConnection=()=>{};
export const currentBase=()=> 'store preview (sample data)';
export const api={
  threads:async()=>${JSON.stringify(samples)},
  thread:async()=>({text:${JSON.stringify(text)}}),
  history:async()=>({text:${JSON.stringify(text)},source:'codex-transcript'}),
  activity:async(handle)=>({state:['store-a12c34','store-e78a90'].includes(handle)?'working':'waiting',elapsedSeconds:['store-a12c34','store-e78a90'].includes(handle)?83:null}),
  health:async()=>({ok:true}),capabilities:async()=>({voice:true}),
  transcribe:async()=>({text:'Looks good. Add a test for expired sessions, then show me the diff.'}),
  say:async()=>{throw new Error('Store preview: sending is disabled.');},
  usage:async()=>({codex:{provider:'codex',status:'ok',session:{usedPercent:18,resetDescription:'2h 15m'},weekly:{usedPercent:35,resetDescription:'4d 6h'}}}),
  providers:async()=>[{id:'codex',models:['default'],ok:true,note:'Ready'}],
  workspaces:async()=>[{id:'sample-app',name:'sample-app'},{id:'sample-site',name:'website'},{id:'sample-docs',name:'documentation'}],
  prompts:async()=>['Start without a prompt','Run tests and report','Summarize changes'],
  startSession:async()=>{throw new Error('Store preview: launching is disabled.');}
};`;
// Intercept only microphone requests. Native rendering and gestures stay real.
const shim = `<script>
const timer=setInterval(()=>{
 const host=window.flutter_inappwebview;if(!host?.callHandler)return;clearInterval(timer);
 const original=host.callHandler.bind(host);
 host.callHandler=async(name,...args)=>{
  let p;try{p=typeof args[0]==='string'?JSON.parse(args[0]):args[0];}catch{}
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
console.log('Synthetic data only. Sending and session creation are disabled.');
