'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const storageKey = 'chronicle-prototype-v1';
const names = {wide:'A · Wide', anna:'B · Anna', david:'C · David', key:'Insert · Key'};
const spots = {door:[-1.9,-1.3], table:[-.75,.65], window:[1.6,-1.25]};
const initial = {version:1,stage:'develop',layout:'space',location:'kitchen',yaw:.65,selected:'anna',camera:'wide',active:0,cut:0,actors:{anna:[-1.9,-1.3],david:[.9,-.4]},beats:[
 {id:'enter',title:'Anna enters',actor:'anna',type:'move',destination:'table',camera:'wide',duration:4},
 {id:'key',title:'Sets down the key',actor:'anna',type:'place',destination:'table',camera:'key',duration:2},
 {id:'question',title:'“You kept it?”',actor:'anna',type:'speak',destination:'table',camera:'anna',duration:3},
 {id:'reply',title:'“I said I would.”',actor:'david',type:'speak',destination:'table',camera:'david',duration:3}
],order:['enter','key','question','reply'],cuts:{}};
let state=structuredClone(initial),storageAvailable=true;
try{const saved=JSON.parse(localStorage.getItem(storageKey));if(saved?.version===1 && saved.beats?.length && saved.actors && saved.order && saved.cuts)state=saved;}catch{storageAvailable=false;}
const media=new Map(); let timer=null,playing=null,projection=null,hits=[];
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const beat = ()=>state.beats[state.active];
const cutBeat=()=>state.beats.find(b=>b.id===state.order[state.cut]);
function save(){try{localStorage.setItem(storageKey,JSON.stringify(state));storageAvailable=true;}catch{storageAvailable=false;}$('#save-status').textContent=storageAvailable?'Saved on this device':'Storage unavailable · export to keep changes';}
function stop(){clearTimeout(timer);timer=null;playing=null;$('#play').textContent='▶ Walk through';$('#play-cut').textContent='▶ Preview sequence';const v=$('#assembly-media video');if(v)v.pause();}
function stage(name){stop();state.stage=name;render();save();}
function selectBeat(i){stop();state.active=i;state.camera=beat().camera;render();save();}
function positionsAt(index,progress=1){const actors=structuredClone(state.actors);for(let i=0;i<=index;i++){const b=state.beats[i];if(b.type==='move'){const p=spots[b.destination],from=actors[b.actor];const t=i===index?progress:1;actors[b.actor]=from.map((v,j)=>v+(p[j]-v)*t);}}return actors;}
function render(){
 const s=state.stage,b=beat();
 $$('[data-stage]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.stage===s));
 ['develop','produce','assemble'].forEach(id=>$('#'+id).hidden=id!==s);
 $('#stage-title').textContent={develop:'Direct the moment.',produce:'From intention to image.',assemble:'Find the rhythm.'}[s];
 $('#next-stage').textContent={develop:'Review shots →',produce:'Open assembly →',assemble:'Return to direction ↗'}[s];
 $('#context-label').textContent={develop:`Scene direction / Action ${String(state.active+1).padStart(2,'0')}`,produce:'Shot plan / Local media',assemble:'Storyboard / Scene 01'}[s];
 $('#location').value=state.location;
 $('#director').classList.toggle('camera-first',state.layout==='camera');
 $$('[data-layout]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.layout===state.layout));
 $$('[data-camera]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.camera===state.camera));
 $('#camera-name').textContent='Camera '+names[state.camera];
 $('#actor').value=state.selected;
 const pos=state.actors[state.selected];$('#pos-x').value=pos[0];$('#pos-z').value=pos[1];
 const matched=Object.keys(spots).find(k=>Math.hypot(spots[k][0]-pos[0],spots[k][1]-pos[1])<.05);$('#position').value=matched||'';
 $('#beats').innerHTML=state.beats.map((b,i)=>`<button class="beat" data-beat="${i}" aria-pressed="${i===state.active}"><span class="beat-top"><span>${String(i+1).padStart(2,'0')}</span><span>${escapeHTML(b.type)} · ${b.duration}s</span></span><span class="beat-name">${escapeHTML(b.title)}</span><span class="beat-bottom">${escapeHTML(names[b.camera])} / ${escapeHTML(b.actor)}</span></button>`).join('');
 $('#beat-title').value=b.title;$('#beat-actor').value=b.actor;$('#beat-type').value=b.type;$('#beat-destination').value=b.destination;$('#beat-camera').value=b.camera;$('#beat-duration').value=b.duration;
 $('#destination-wrap').hidden=b.type!=='move';
 $('#beat-earlier').disabled=state.active===0;$('#beat-later').disabled=state.active===state.beats.length-1;
 if(s==='develop'){draw($('#set'),'orbit',state.active,0);draw($('#frame'),state.camera,state.active,0);}
 if(s==='produce')renderShots();
 if(s==='assemble')renderCut();
}
function draw(canvas,camera,index,progress=1){
 const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
 const dpr=Math.min(devicePixelRatio||1,2),w=rect.width,h=rect.height;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.fillStyle='#232922';ctx.fillRect(0,0,w,h);
 const actors=positionsAt(index,progress),a=actors.anna,d=actors.david;
 const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),norm=a=>{let l=Math.hypot(...a)||1;return a.map(v=>v/l);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 let eye,target,fov=1;
 if(camera==='orbit'){eye=[Math.sin(state.yaw)*8,6,Math.cos(state.yaw)*8];target=[0,.6,0];fov=1.4;}
 else if(camera==='wide'){eye=[2.8,1.8,4.6];target=[0,1,-.4];fov=.95;}
 else if(camera==='key'){eye=[1.2,1.9,1.8];target=[0,.87,.1];fov=.8;}
 else{const p=actors[camera];eye=[p[0]+(camera==='anna'?1:-1),1.6,p[1]+2.7];target=[p[0],1.1,p[1]];fov=.83;}
 const forward=norm(sub(target,eye)),right=norm(cross(forward,[0,1,0])),up=norm(cross(right,forward)),focal=Math.min(w,h)*fov;
 function project(p){const v=sub(p,eye),z=dot(v,forward);return{x:w/2+dot(v,right)*focal/z,y:h/2-dot(v,up)*focal/z,z};}
 const faces=[];
 function paintFace(f){ctx.beginPath();f.p.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=f.color;ctx.fill();ctx.fillStyle=`rgba(0,0,0,${1-f.light})`;ctx.fill();}
 function face(points,color,light=1){const p=points.map(project);if(p.some(p=>p.z<.1))return;faces.push({p,color,light,z:p.reduce((s,v)=>s+v.z,0)/p.length});}
 function box(x,y,z,sx,sy,sz,c){const p=[[x-sx/2,y,z-sz/2],[x+sx/2,y,z-sz/2],[x+sx/2,y,z+sz/2],[x-sx/2,y,z+sz/2]],top=p.map(v=>[v[0],v[1]+sy,v[2]]);for(let i=0;i<4;i++)face([p[i],p[(i+1)%4],top[(i+1)%4],top[i]],c,.65+i*.07);face(top,c);}
 function person(p,c){box(p[0]-.12,0,p[1],.15,.7,.2,c);box(p[0]+.12,0,p[1],.15,.7,.2,c);box(p[0],.65,p[1],.49,.62,.3,c);box(p[0],1.3,p[1],.27,.3,.27,'#bbb29a');box(p[0]-.3,.66,p[1],.13,.5,.13,c);box(p[0]+.3,.66,p[1],.13,.5,.13,c);}
 face([[-3,0,-2.2],[3,0,-2.2],[3,0,2.5],[-3,0,2.5]],'#555747');
 face([[-3,0,-2.2],[3,0,-2.2],[3,2.8,-2.2],[-3,2.8,-2.2]],'#74786a');
 face([[-2.65,0,-2.18],[-1.4,0,-2.18],[-1.4,2.2,-2.18],[-2.65,2.2,-2.18]],'#2c352c');
 faces.splice(0).forEach(paintFace);
 box(1.7,.9,-2.12,1.5,1.35,.08,'#9d9277');box(1.7,1,-2.05,1.3,1.15,.03,'#c0c9ae');box(1.7,1,-2,.04,1.15,.04,'#8a806b');box(1.7,1.55,-2,1.3,.04,.04,'#8a806b');
 if(state.location==='diner'){box(0,0,-1.6,2.1,.45,.7,'#69775d');box(0,.45,-1.95,2.1,.65,.2,'#69775d');}
 for(const x of [-.55,.55])for(const z of [-.3,.3])box(x,0,z,.08,.85,.08,'#b09c78');box(0,.84,0,1.5,.09,.95,'#b09c78');
 person(a,'#82947b');person(d,'#b0ac96');
 if(state.beats.slice(0,index+1).some(b=>b.type==='place'))box(0,.94,.1,.19,.025,.07,'#dbc087');
 faces.sort((a,b)=>b.z-a.z).forEach(paintFace);
 if(camera==='orbit'){
  hits=[];projection=project;
  ctx.strokeStyle='#d1dcc4';ctx.globalAlpha=.12;ctx.lineWidth=.6;
  for(let i=-2;i<=2;i++){for(const pts of [[[i,.01,-2],[i,.01,2]],[[-3,.01,i],[3,.01,i]]]){const [a,b]=pts.map(project);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}ctx.globalAlpha=1;
  const b=state.beats[index];if(b.type==='move'){const p=actors[b.actor],t=spots[b.destination],a=project([p[0],.06,p[1]]),e=project([t[0],.06,t[1]]);ctx.strokeStyle='#d5e7ae';ctx.lineWidth=2;ctx.setLineDash([4,5]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(e.x,e.y);ctx.stroke();ctx.setLineDash([]);}
  for(const [id,p] of Object.entries(actors)){const pt=project([p[0],1.88,p[1]]),body=project([p[0],.8,p[1]]);ctx.font='11px -apple-system,sans-serif';const tw=ctx.measureText(id).width+20;ctx.fillStyle=state.selected===id?'#d5e7ae':'#30392e';ctx.fillRect(pt.x-tw/2,pt.y-13,tw,24);ctx.fillStyle=state.selected===id?'#20281b':'#e8eae1';ctx.textAlign='center';ctx.fillText(id[0].toUpperCase()+id.slice(1),pt.x,pt.y+3);hits.push({id,x:pt.x,y:pt.y},{id,x:body.x,y:body.y});}
 }else{ctx.strokeStyle='rgba(230,240,220,.13)';ctx.lineWidth=.5;for(const n of [1,2]){ctx.beginPath();ctx.moveTo(w*n/3,0);ctx.lineTo(w*n/3,h);ctx.stroke();ctx.beginPath();ctx.moveTo(0,h*n/3);ctx.lineTo(w,h*n/3);ctx.stroke();}}
}
function attachMedia(container,b,withControls=false){
 const item=media.get(b.id);if(!item){const c=document.createElement('canvas');c.setAttribute('aria-label',`Blocking preview: ${b.title}`);container.append(c);draw(c,b.camera,state.beats.indexOf(b));return;}
 const el=document.createElement(item.type==='video'?'video':'img');el.src=item.url;el.setAttribute('aria-label',item.name);if(item.type==='image')el.alt=item.name;else{el.controls=withControls;el.muted=true;el.playsInline=true;el.preload='metadata';}container.append(el);
}
function renderShots(){
 $('#shots').replaceChildren();
 state.beats.forEach((b,i)=>{const article=document.createElement('article');article.className='shot';const preview=document.createElement('div');article.append(preview);const info=document.createElement('div');info.className='shot-info';const m=media.get(b.id);info.innerHTML=`<div class="shot-source">${m?'IMPORTED MEDIA':'BLOCKING PREVIEW'}</div><h2>${String(i+1).padStart(2,'0')} · ${escapeHTML(b.title)}</h2><p>${escapeHTML(names[b.camera])} · ${b.duration}s · ${escapeHTML(b.actor)}${b.type==='move'?' → '+escapeHTML(b.destination):''}</p><label>${m?'Replace media':'Import image or video'}<input aria-label="Import for ${escapeHTML(b.title)}" type="file" accept="image/*,video/*"></label>${m?`<p>${escapeHTML(m.name)}</p><button data-clear="${b.id}">Use blocking preview</button>`:b.filename?`<p>Reimport: ${escapeHTML(b.filename)}</p>`:''}`;article.append(info);$('#shots').append(article);attachMedia(preview,b,true);
 info.querySelector('input').onchange=async e=>{const file=e.target.files[0];if(!file)return;if(!/^(image|video)\//.test(file.type)){alert('Choose an image or video file.');return;}const url=URL.createObjectURL(file),kind=file.type.startsWith('video')?'video':'image';const probe=document.createElement(kind==='video'?'video':'img');probe.src=url;if(kind==='video')probe.preload='metadata';const valid=await new Promise(resolve=>{probe[kind==='video'?'onloadedmetadata':'onload']=()=>resolve(true);probe.onerror=()=>resolve(false);});if(!valid){URL.revokeObjectURL(url);alert('This browser could not open that media file. Try a JPEG, PNG or MP4.');return;}if(media.has(b.id))URL.revokeObjectURL(media.get(b.id).url);media.set(b.id,{url,type:kind,name:file.name});b.filename=file.name;save();renderShots();};
 const clear=info.querySelector('[data-clear]');if(clear)clear.onclick=()=>{URL.revokeObjectURL(media.get(b.id).url);media.delete(b.id);delete b.filename;save();renderShots();};
 });
}
function renderCut(){
 const b=cutBeat();$('#assembly-media').replaceChildren();attachMedia($('#assembly-media'),b,true);
 $('#assembly-title').textContent=b.title;$('#assembly-detail').textContent=names[b.camera]+' · '+(media.has(b.id)?media.get(b.id).name:'Blocking preview');
 $('#cut-duration').value=state.cuts[b.id]??b.duration;
 $('#cut-earlier').disabled=state.cut===0;$('#cut-later').disabled=state.cut===state.order.length-1;
 const total=state.order.reduce((n,id)=>{const b=state.beats.find(b=>b.id===id);return n+(state.cuts[id]??b.duration);},0);$('#runtime').textContent=`${state.order.length} shots · ${total} seconds`;
 $('#timeline').innerHTML=state.order.map((id,i)=>{const b=state.beats.find(b=>b.id===id);return `<button data-cut="${i}" aria-pressed="${i===state.cut}" style="flex-grow:${state.cuts[id]??b.duration}"><span>${String(i+1).padStart(2,'0')} / ${state.cuts[id]??b.duration}s</span>${escapeHTML(b.title)}</button>`;}).join('');
}
$$('[data-stage]').forEach(el=>el.onclick=()=>stage(el.dataset.stage));
$('#next-stage').onclick=()=>stage({develop:'produce',produce:'assemble',assemble:'develop'}[state.stage]);
$$('[data-layout]').forEach(el=>el.onclick=()=>{state.layout=el.dataset.layout;render();save();});
$$('[data-camera]').forEach(el=>el.onclick=()=>{state.camera=el.dataset.camera;render();save();});
$('#location').onchange=e=>{state.location=e.target.value;render();save();};
$('#actor').onchange=e=>{state.selected=e.target.value;render();save();};
$('#position').onchange=e=>{state.actors[state.selected]=[...spots[e.target.value]];render();save();};
for(const [sel,axis] of [['#pos-x',0],['#pos-z',1]])$(sel).oninput=e=>{state.actors[state.selected][axis]=Number(e.target.value);render();save();};
$('#beats').onclick=e=>{const el=e.target.closest('[data-beat]');if(el)selectBeat(Number(el.dataset.beat));};
$('#beat-type').onchange=e=>$('#destination-wrap').hidden=e.target.value!=='move';
$('#action-editor').onsubmit=e=>{e.preventDefault();stop();Object.assign(beat(),{title:$('#beat-title').value.trim()||'Untitled action',actor:$('#beat-actor').value,type:$('#beat-type').value,destination:$('#beat-destination').value,camera:$('#beat-camera').value,duration:Number($('#beat-duration').value)});state.camera=beat().camera;render();save();};
$('#add-beat').onclick=()=>{stop();const b={id:crypto.randomUUID(),title:'A moment of silence',actor:'anna',type:'wait',destination:'table',camera:'wide',duration:2};state.beats.push(b);state.order.push(b.id);selectBeat(state.beats.length-1);$('#beat-title').focus();};
function reorderBeat(delta){const i=state.active,j=i+delta;if(j<0||j>=state.beats.length)return;stop();[state.beats[i],state.beats[j]]=[state.beats[j],state.beats[i]];state.active=j;state.camera=beat().camera;render();save();}
$('#beat-earlier').onclick=()=>reorderBeat(-1);$('#beat-later').onclick=()=>reorderBeat(1);
$('#timeline').onclick=e=>{const el=e.target.closest('[data-cut]');if(el){stop();state.cut=Number(el.dataset.cut);renderCut();save();}};
$('#cut-duration').onchange=e=>{const n=Number(e.target.value);if(!Number.isFinite(n)||n<1||n>30){e.target.value=state.cuts[cutBeat().id]??cutBeat().duration;return;}stop();state.cuts[cutBeat().id]=n;renderCut();save();};
function reorderCut(d){const i=state.cut,j=i+d;if(j<0||j>=state.order.length)return;stop();[state.order[i],state.order[j]]=[state.order[j],state.order[i]];state.cut=j;renderCut();save();}
$('#cut-earlier').onclick=()=>reorderCut(-1);$('#cut-later').onclick=()=>reorderCut(1);
$('#play').onclick=()=>{if(playing){stop();render();return;}playing='beats';state.active=0;$('#play').textContent='■ Stop';let start=performance.now();function tick(){if(playing!=='beats')return;const t=Math.min(1,(performance.now()-start)/(beat().duration*1000));state.camera=beat().camera;draw($('#set'),'orbit',state.active,t);draw($('#frame'),state.camera,state.active,t);$$('[data-beat]').forEach(el=>el.setAttribute('aria-pressed',Number(el.dataset.beat)===state.active));$('#camera-name').textContent='Camera '+names[state.camera];if(t>=1){if(state.active===state.beats.length-1){stop();render();save();return;}state.active++;start=performance.now();}timer=setTimeout(tick,30);}tick();};
$('#play-cut').onclick=()=>{if(playing){stop();return;}playing='cut';state.cut=0;$('#play-cut').textContent='■ Stop';function advance(){if(playing!=='cut')return;renderCut();const v=$('#assembly-media video');if(v)v.play().catch(()=>{});const b=cutBeat();timer=setTimeout(()=>{if(v)v.pause();if(state.cut>=state.order.length-1){stop();save();return;}state.cut++;advance();},(state.cuts[b.id]??b.duration)*1000);}advance();};
let drag=null;const canvas=$('#set');
canvas.onpointerdown=e=>{stop();const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,hit=hits.find(p=>Math.hypot(p.x-x,p.y-y)<27);drag={x:e.clientX,y:e.clientY,yaw:state.yaw,id:hit?.id,pos:hit?[...state.actors[hit.id]]:null,project:projection};if(hit)state.selected=hit.id;canvas.setPointerCapture(e.pointerId);};
canvas.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(drag.id){const p=drag.pos,origin=drag.project([p[0],0,p[1]]),px=drag.project([p[0]+.1,0,p[1]]),pz=drag.project([p[0],0,p[1]+.1]);const ax=(px.x-origin.x)*10,ay=(px.y-origin.y)*10,bx=(pz.x-origin.x)*10,by=(pz.y-origin.y)*10,det=ax*by-ay*bx;if(Math.abs(det)>.01)state.actors[drag.id]=[Math.max(-2.5,Math.min(2.5,p[0]+(dx*by-dy*bx)/det)),Math.max(-1.8,Math.min(2,p[1]+(ax*dy-ay*dx)/det))];}else state.yaw=drag.yaw+dx*.008;render();};
function endDrag(){if(drag){drag=null;save();}}canvas.onpointerup=endDrag;canvas.onpointercancel=endDrag;
$('#export').onclick=()=>{save();const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='chronicle-the-spare-key.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
new ResizeObserver(()=>{if(!playing)render();}).observe($('.workspace'));
window.addEventListener('pagehide',()=>{stop();media.forEach(m=>URL.revokeObjectURL(m.url));});
render();if(!storageAvailable)$('#save-status').textContent='Storage unavailable · export to keep changes';
