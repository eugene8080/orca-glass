// Fresh isolated simulator 9900 + standard fixture 8791 only; no live agent input.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base='http://127.0.0.1:9900';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const calls=async()=> (await (await fetch(base+'/api/console')).json()).entries.filter(e=>e.message.startsWith('Native call ')).map(e=>JSON.parse(e.message.slice(12)));
const input=async action=>{assert.ok((await fetch(base+'/api/input',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action})})).ok);await wait(250)};
await mkdir('.local/book-reader-preview',{recursive:true});
const source='> Synthetic list review\n' + Array.from({length:19},(_,i)=>`  ${i+1}. Item ${i+1}: this complete number and sentence must survive every page flip.`).join('\n')+'\n  - Parent group\n    - Nested bullet\n    1. Nested ordered one\n    2. Nested ordered two';
assert.ok((await fetch('http://127.0.0.1:8791/__fixture',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:source,state:'waiting',progress:'',source:'claude-transcript',menu:null,transcript:'A reviewed voice draft. Cancel preserves the current book page.'})})).ok);
await input('down'); await input('down'); await input('click'); await wait(900);
let all=await calls();const open=all.findLast(c=>c.method==='rebuildPageContainer').data;
let body=open.textObject.find(c=>c.containerName==='body').content;
if(!body)body=all.findLast(c=>c.method==='textContainerUpgrade'&&c.data.containerName==='body').data.content;
const heading=open.textObject.find(c=>c.containerName==='hint').content.trim();
const m=heading.match(/Page (\d+) of (\d+)$/);assert.ok(m,heading);assert.equal(m[1],m[2]);
const count=Number(m[2]);const seen=[body];
for(let i=count-1;i>=1;i--){await input('up');all=await calls();seen.unshift(all.findLast(c=>c.method==='textContainerUpgrade'&&c.data.containerName==='body').data.content);assert.match(all.findLast(c=>c.method==='textContainerUpgrade'&&c.data.containerName==='hint').data.content,new RegExp(`Page ${i} of ${count}$`));}
assert.equal(seen.join('').replaceAll('\n',''),source.replaceAll('\n',''));
for(let i=1;i<=19;i++)assert.ok(seen.join('\n').includes(`  ${i}. Item ${i}:`));
assert.ok(seen.join('\n').includes('    - Nested bullet'));
const before=(await calls()).length;await input('up');assert.equal((await calls()).slice(before).filter(c=>c.method==='textContainerUpgrade'&&c.data.containerName==='body').length,0);
for(let i=1;i<count;i++)await input('down');
// Leave a middle page visible with two-digit item numbers for user inspection.
await input('up');await input('up');
const beforeVoice=(await calls()).length;
await input('long_press');await wait(200);await input('long_press_release');await wait(700);await input('double_click');
const afterVoice=(await calls()).slice(beforeVoice);
assert.equal(afterVoice.filter(c=>c.method==='rebuildPageContainer'||(c.method==='textContainerUpgrade'&&c.data.containerName==='body')).length,0);
assert.match(afterVoice.findLast(c=>c.method==='textContainerUpgrade'&&c.data.containerName==='hint').data.content,new RegExp(`Page ${count-2} of ${count}$`));
const shot=await fetch(base+'/api/screenshot/glasses');await writeFile('.local/book-reader-preview/native-page.png',Buffer.from(await shot.arrayBuffer()));
await writeFile('.local/book-reader-preview/native-calls.json',JSON.stringify(await calls(),null,2));
console.log(JSON.stringify({nativePages:count,allNumbers1to19:true,nestedStructurePreserved:true,forwardAndReverse:true,previewLeftOpen:true}));
