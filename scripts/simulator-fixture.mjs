// Real SDK/rendering, isolated fake sessions/audio: never submit agent input.
import { createServer } from '../app/node_modules/vite/dist/node/index.js';
import { fileURLToPath } from 'node:url';

const fixture = {
  state: 'working', source: 'codex-transcript',
  text: Array.from({ length: 35 }, (_, i) => `Chat line ${i + 1}: native reader scroll retention check.`).join('\n'),
  transcript: Array.from({ length: 30 }, (_, i) => `Draft line ${i + 1}: review this transcription.`).join('\n'),
  sends: [],
  usage: {
    codex: { provider: 'codex', status: 'ok', weekly: { usedPercent: 63, resetDescription: 'Thursday' } },
    claude: { provider: 'claude', status: 'ok', session: { usedPercent: 3, resetDescription: '9:50 AM' }, weekly: { usedPercent: 2, resetDescription: '1:00 PM' } },
    cursor: { provider: 'cursor', status: 'ok', monthly: { usedPercent: 2.02, resetDescription: 'Nov 5' } },
  },
};
const api = `
const request=async()=>{const r=await fetch('/__fixture');return r.json();};
export const setDemo=()=>{},setApiLang=()=>{},setConnection=()=>{};
export const currentBase=()=> 'isolated simulator';
export const api={
  threads:async()=>[{handle:'fixture',title:'Simulator conversation',agent:'codex',state:'busy'}],
  thread:async()=>({text:(await request()).text}),history:async()=>{const s=await request();return {text:s.text,source:s.source};},
  activity:async()=>({state:(await request()).state}),
  health:async()=>({ok:true}),capabilities:async()=>({voice:true}),
  usage:async()=>(await request()).usage,
  transcribe:async()=>({text:(await request()).transcript}),
  say:async(handle,text)=>{await fetch('/__fixture/send',{method:'POST',body:JSON.stringify({handle,text})});return {sent:text};}
};`;
const shim = `<script>
const timer=setInterval(()=>{
 const host=window.flutter_inappwebview;if(!host?.callHandler)return;clearInterval(timer);
 const original=host.callHandler.bind(host);
 host.callHandler=async(name,...args)=>{
  let p;try{p=typeof args[0]==='string'?JSON.parse(args[0]):args[0];}catch{}
  if(p?.method)console.log('Native call',JSON.stringify(p));
  if(new URLSearchParams(location.search).has('rejectAligned') && p?.method==='rebuildPageContainer' && p.data?.textObject?.some(c=>c.containerName==='menu-right'))return false;
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
  define: { __BRIDGE_ORIGIN__: '""', __APP_VERSION__: JSON.stringify(JSON.parse((await import('node:fs')).readFileSync(new URL('../app/app.json', import.meta.url), 'utf8')).version) },
  server: { host: '127.0.0.1', port: 8791, strictPort: true },
  plugins: [{
    name: 'isolated-native-simulator', enforce: 'pre',
    resolveId(id) { if (id === './api') return '\0fixture-api'; },
    load(id) { if (id === '\0fixture-api') return api; },
    transformIndexHtml(html) { return html.replace('<head>', '<head>' + shim); },
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/__fixture')) return next();
        try {
          if (req.method === 'POST') {
            let body = ''; for await (const part of req) body += part;
            const data = JSON.parse(body);
            if (req.url === '/__fixture/send') fixture.sends.push(data);
            else {
              if (data.usage && typeof data.usage === 'object') fixture.usage = data.usage;
              for (const key of ['state', 'text', 'source', 'transcript']) {
                if (typeof data[key] === 'string') fixture[key] = data[key];
              }
            }
          }
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(fixture));
        } catch (error) { res.statusCode = 400; res.end(JSON.stringify({ error: error.message })); }
      });
    },
  }],
});
await server.listen();
console.log('Isolated simulator fixture: http://127.0.0.1:8791/?code=demo&lang=en');
