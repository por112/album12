'use strict';
/* error banner (also lives in index.html; this copy covers an old index.html paired with this file) */
(function(){const b=m=>{let d=document.getElementById('errbar');if(!d){d=document.createElement('div');d.id='errbar';d.style.cssText='position:fixed;left:0;right:0;top:0;z-index:99;background:#b00020;color:#fff;padding:10px 14px;font:14px/1.4 system-ui,sans-serif;white-space:pre-wrap';document.body.appendChild(d)}if(!d.textContent.includes(m))d.textContent+=m+'\n'};
window.addEventListener('error',e=>{if(e.target!==window)return;b('เกิดข้อผิดพลาด: '+e.message+(e.filename?' ('+e.filename.split('/').pop()+':'+e.lineno+')':'')+'\nถ้าเพิ่งอัปเดต ให้แน่ใจว่าอัปโหลดทุกไฟล์ใหม่ทับของเดิมทั้งหมด (โดยเฉพาะ index.html) แล้วกด Ctrl+Shift+R')})})();
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const COV=['#e0567a','#f4a261','#e9c46a','#2a9d8f','#4a90d9','#7b5ea7','#3d3d4e','#f2b5c4','linear-gradient(135deg,#f6d365,#fda085)','linear-gradient(135deg,#a1c4fd,#c2e9fb)','linear-gradient(135deg,#667eea,#764ba2)','linear-gradient(135deg,#43e97b,#38f9d7)'];
const TXT=['#ffffff','#3a2e2a','#ffe27a','#ffd6e5'];
const FONTS=[['Mali','น่ารัก'],['Kanit','เท่'],['Sriracha','ลายมือ']];
const STK=['🌸','⭐','❤️','🌈','🎀','🦋','☀️','🌙','✨','🎈','🐶','🐱','🍓','🌻','🎂','✈️','📷','🏖️','🎵','👑','🍀','🎉'];
const PGBG=['#ffffff','#fff1e6','#e8f5e9','#e3f2fd','#f3e5f5','#fff9c4','#fce4ec','#263238','radial-gradient(#f3c9d5 2px,transparent 2px) 0 0/18px 18px #ffffff','repeating-linear-gradient(45deg,#ffffff,#ffffff 10px,#fdf0e6 10px,#fdf0e6 20px)'];
const FRM=[['0','เรียบ'],['1','โพลารอยด์'],['2','ทอง'],['3','มน'],['4','เส้นประ']];
const COV_MAX=6;

/* ---- storage (IndexedDB, in-memory fallback) ---- */
let mem={};
const idb=new Promise((res,rej)=>{try{const r=indexedDB.open('albumapp',1);r.onupgradeneeded=()=>r.result.createObjectStore('a',{keyPath:'id'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}});
idb.catch(()=>{});
const tx=async(m,f)=>{const d=await idb;return new Promise((res,rej)=>{const t=d.transaction('a',m),q=f(t.objectStore('a'));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error)})};
const put=async a=>{mem[a.id]=a;try{await tx('readwrite',s=>s.put(a))}catch(e){}};
const del=async id=>{delete mem[id];try{await tx('readwrite',s=>s.delete(id))}catch(e){}};
const mine=async()=>{let l;try{l=await tx('readonly',s=>s.getAll())}catch(e){l=Object.values(mem)}return l.filter(a=>a.email===me).map(norm)};
let me='';try{me=localStorage.getItem('albumMe')||''}catch(e){}
const clone=o=>typeof structuredClone==='function'?structuredClone(o):JSON.parse(JSON.stringify(o));

/* ---- helpers ---- */
let tt;const toast=t=>{const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('on'),2200)};
const show=id=>{$$('section').forEach(s=>s.classList.toggle('on',s.id==='v-'+id));window.scrollTo(0,0);if(id==='home')$('#who').textContent='👋 '+me;if(id==='list')renderList();if(id==='trash')renderTrash()};
$$('.bk').forEach(b=>b.onclick=()=>show('home'));
const LO={1:[[1]],2:[[1,1],[2]],3:[[1,2],[2,1],[1,1,1],[3]],4:[[2,2],[1,3],[3,1]],5:[[2,3],[3,2],[1,2,2]],6:[[3,3],[2,2,2],[1,2,3]],7:[[3,2,2],[2,2,3],[1,3,3]],8:[[3,3,2],[2,3,3],[2,2,2,2]],9:[[3,3,3],[2,2,2,3],[3,2,2,2]]};
const norm=a=>{if(!a.pgs){const L=a.layout,c=+a.pages||4;a.pgs=Array.from({length:c},(_,p)=>({n:L==='mix'?[4,3,2,1][p%4]:(+L||4),v:0}))}if(a.folder===undefined)a.folder=null;if(!a.cov)a.cov={n:0,v:0,photos:{}};if(!a.cov.photos)a.cov.photos={};if(!a.photos)a.photos={};return a};
const fKey=()=>'albumFolders:'+me;
const getFolders=()=>{try{return JSON.parse(localStorage.getItem(fKey())||'[]')}catch(e){return[]}};
const saveFolders=arr=>{try{localStorage.setItem(fKey(),JSON.stringify(arr))}catch(e){}};
let curFolder='all';
const total=a=>a.pgs.reduce((t,g)=>t+g.n,0);
const rowsOf=(n,v)=>{const V=LO[n];return V[(v||0)%V.length]};

/* Photo value: {u:dataURL, s:zoom(1-4), px,py:0..1 focal point}.  px,py=.5 is centred.
   Rendered as object-fit:cover + object-position + transform-origin, so a crop never
   shows blank edges even if the album layout (slot shape) is changed later. */
const pval=v=>{if(!v)return null;if(typeof v==='string')return{u:v,s:1,px:.5,py:.5};const s=v.s||1;
if(v.px!==undefined)return{u:v.u,s,px:clamp(v.px,0,1),py:clamp(v.py,0,1)};
const f=x=>s>1?clamp(.5-(x||0)*s/100/(s-1),0,1):.5; /* migrate old translate% model */
return{u:v.u,s,px:f(v.tx),py:f(v.ty)}};
const imgStyle=v=>`object-position:${v.px*100}% ${v.py*100}%;transform-origin:${v.px*100}% ${v.py*100}%;transform:scale(${v.s})`;
const slotInner=(v,ed)=>v?`<img class="ph" alt="" src="${v.u}" style="${imgStyle(v)}">`:(ed?'<div class="ph e"><span>📷</span>แตะเพื่อใส่รูป</div>':'<div class="ph e"><span>📷</span></div>');
const photoMap=(a,key)=>key.startsWith('cov-')?a.cov.photos:a.photos;

function cover(a,ed){const cn=(a.cov&&a.cov.n)||0;let layer='';
if(cn>0){const rows=rowsOf(cn,a.cov.v);let i=0,cells='';
rows.forEach((k,r)=>{for(let j=0;j<k;j++,i++){const key='cov-'+i;cells+=`<div class="slot cslot" data-k="${key}" style="grid-column:span ${6/k};grid-row:${r+1}">${slotInner(pval(a.cov.photos[key]),ed)}</div>`}});
layer=`<div class="covph" style="grid-template-rows:repeat(${rows.length},1fr)">${cells}</div>`}
return `<div class="cover ${cn>0?'hasph':''}" style="background:${a.color};color:${a.tc};font-family:'${a.font}','Mali',sans-serif">${layer}<div class="ct">${esc(a.title||'อัลบั้มของฉัน')}</div><div class="cs">${esc(a.sub||'')}</div>${a.st.map((s,i)=>`<b class="stk" data-i="${i}" style="left:${s.x}%;top:${s.y}%;font-size:${s.z}cqw">${s.e}</b>`).join('')}</div>`}
function pageHTML(a,p,ed){const g=a.pgs[p],rows=rowsOf(g.n,g.v);let i=0,h=`<div class="page d${g.n>=7?2:g.n>=4?1:0}" style="background:${a.bg};grid-template-rows:repeat(${rows.length},1fr)">`;
rows.forEach((k,r)=>{for(let j=0;j<k;j++,i++){const key=p+'-'+i;h+=`<div class="slot f${a.frame}" data-k="${key}" style="grid-column:span ${6/k};grid-row:${r+1}">${slotInner(pval(a.photos[key]),ed)}</div>`}});
return h+`<div class="pn">${p+1}</div></div>`}

/* ---- login / home ---- */
const enter=()=>{const v=$('#em').value.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))return toast('กรุณากรอกอีเมลให้ถูกต้อง');me=v;try{localStorage.setItem('albumMe',v)}catch(e){}purge();show('home')};
$('#lg').addEventListener('click',enter);
/* NOTE: use addEventListener — an inline `onkeydown=e=>cond&&fn()` returns false for every non-Enter key,
   which cancels the keystroke and made the email field impossible to type in. */
$('#em').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();enter()}});
$('#out').onclick=()=>{me='';try{localStorage.removeItem('albumMe')}catch(e){}$('#em').value='';show('login')};
$('#mList').onclick=()=>show('list');$('#mTrash').onclick=()=>show('trash');
async function purge(){for(const a of await mine())if(a.status==='trash'&&Date.now()-a.del>=15*864e5)await del(a.id)}

/* ---- lists ---- */
function folderChips(all){const folders=getFolders(),cnt={};all.forEach(a=>{const k=a.folder||'__none__';cnt[k]=(cnt[k]||0)+1});
let h=`<button class="chip ${curFolder==='all'?'on':''}" data-f="all">ทั้งหมด (${all.length})</button>`;
folders.forEach(f=>h+=`<button class="chip ${curFolder===f?'on':''}" data-f="${esc(f)}">📁 ${esc(f)} (${cnt[f]||0})</button>`);
if(cnt.__none__)h+=`<button class="chip ${curFolder==='__none__'?'on':''}" data-f="__none__">ไม่มีหมวดหมู่ (${cnt.__none__})</button>`;
if(folders.includes(curFolder))h+=`<button id="delF">🗑️ ลบโฟลเดอร์นี้</button>`;
h+=`<button id="nfBtn">＋ โฟลเดอร์ใหม่</button>`;return h}
function card(a){const fs=getFolders();return `<div class="card" data-id="${a.id}"><div class="cvw">${cover(a,false)}</div><b>${esc(a.title)}</b><small class="mut">${a.status==='draft'?'⏳ ยังใส่รูปไม่ครบ':'✅ '+new Date(a.created).toLocaleDateString('th-TH')}</small>
<select class="fsel" data-id="${a.id}" onclick="event.stopPropagation()"><option value="">— ไม่มีหมวดหมู่ —</option>${fs.map(f=>`<option value="${esc(f)}" ${a.folder===f?'selected':''}>📁 ${esc(f)}</option>`).join('')}</select>
<button class="ecard" data-e="${a.id}">🎨 แก้ไขปก/เลย์เอาท์</button></div>`}
async function renderList(){const all=(await mine()).filter(a=>a.status!=='trash').sort((a,b)=>b.created-a.created);
$('#fRow').innerHTML=folderChips(all);
const l=curFolder==='all'?all:all.filter(a=>(a.folder||'__none__')===curFolder);
$('#gList').innerHTML=l.length?l.map(card).join(''):'<p class="mut">ยังไม่มีอัลบั้มในหมวดนี้</p>';
$('#gList').onclick=e=>{if(e.target.closest('select'))return;
const eb=e.target.closest('.ecard');if(eb){enterDesign(all.find(a=>a.id===eb.dataset.e),'list');return}
const c=e.target.closest('.card');if(!c)return;openBook(all.find(a=>a.id===c.dataset.id))};
$('#gList').onchange=async e=>{const s=e.target.closest('.fsel');if(!s)return;const a=all.find(x=>x.id===s.dataset.id);if(!a)return;a.folder=s.value||null;await put(a);renderList()};
$('#fRow').onclick=async e=>{const t=e.target;
if(t.dataset.f){curFolder=t.dataset.f;renderList();return}
if(t.id==='nfBtn'){$('#fRow').innerHTML=`<input id="nfIn" type="text" maxlength="24" placeholder="ชื่อโฟลเดอร์ใหม่" style="max-width:200px;display:inline-block;margin:0 6px 6px 0"><button id="nfOk" class="btn">สร้าง</button><button id="nfX">ยกเลิก</button>`;$('#nfIn').focus();return}
if(t.id==='nfOk'){const v=$('#nfIn').value.trim(),fs=getFolders();if(!v)return toast('กรุณาใส่ชื่อโฟลเดอร์');if(fs.includes(v))return toast('มีโฟลเดอร์นี้อยู่แล้ว');if(fs.length>=20)return toast('สร้างโฟลเดอร์ได้สูงสุด 20 โฟลเดอร์');fs.push(v);saveFolders(fs);curFolder=v;renderList();return}
if(t.id==='nfX'){renderList();return}
if(t.id==='delF'){if(!t.dataset.s){t.dataset.s=1;t.textContent='กดอีกครั้งเพื่อยืนยัน';return}saveFolders(getFolders().filter(f=>f!==curFolder));for(const a of all.filter(a=>a.folder===curFolder)){a.folder=null;await put(a)}curFolder='all';renderList()}};
$('#fRow').onkeydown=e=>{if(e.target.id==='nfIn'&&e.key==='Enter')$('#nfOk').click()}}
async function renderTrash(){const l=(await mine()).filter(a=>a.status==='trash');$('#gTrash').innerHTML=l.length?l.map(a=>{const d=Math.max(0,15-Math.floor((Date.now()-a.del)/864e5));return`<div class="card"><div class="cvw">${cover(a,false)}</div><b>${esc(a.title)}</b><small class="mut">เหลืออีก ${d} วัน</small><div class="row" style="margin-top:8px"><button data-r="${a.id}">กู้คืน</button><button data-x="${a.id}">ลบถาวร</button></div></div>`}).join(''):'<p class="mut">ถังขยะว่างเปล่า</p>';
$$('[data-r]').forEach(b=>b.onclick=async()=>{const a=l.find(x=>x.id===b.dataset.r);a.status=Object.keys(a.photos).length>=total(a)?'saved':'draft';delete a.del;await put(a);toast('กู้คืนแล้ว');renderTrash()});
$$('[data-x]').forEach(b=>b.onclick=async()=>{if(!b.dataset.s){b.dataset.s=1;b.textContent='กดอีกครั้งเพื่อยืนยัน';return}await del(b.dataset.x);toast('ลบถาวรแล้ว');renderTrash()})}

/* ---- photo picking + crop editor (shared by book view and designer previews) ---- */
let pending=null;            /* {obj,key,after} — slot waiting for a file */
const shrink=f=>new Promise((res,rej)=>{const u=URL.createObjectURL(f),i=new Image();i.onerror=()=>{URL.revokeObjectURL(u);rej()};i.onload=()=>{const s=Math.min(1,1400/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*s);c.height=Math.round(i.height*s);c.getContext('2d').drawImage(i,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c.toDataURL('image/jpeg',.85))};i.src=u});
function pickFor(obj,key,after){pending={obj,key,after};$('#file').click()}
$('#file').onchange=async e=>{const f=e.target.files[0];e.target.value='';const p=pending;if(!f||!p)return;
let du;try{du=await shrink(f)}catch(x){return toast('ไฟล์นี้ใช้ไม่ได้ ลองรูปอื่นนะ')}
photoMap(p.obj,p.key)[p.key]={u:du,s:1,px:.5,py:.5};await p.after('add')};
/* empty slot -> pick a photo; filled slot -> editor (zoom / crop / change / remove) */
function onSlot(obj,slotEl,after){const key=slotEl.dataset.k;if(pval(photoMap(obj,key)[key]))openEditor(obj,key,slotEl,after);else pickFor(obj,key,after)}

let zT=null,zS=1,zPx=.5,zPy=.5,zSrc='',zRi=1;
const zBox=$('#zBox'),zImg=$('#zImg');
function applyZ(){zImg.style.objectPosition=`${zPx*100}% ${zPy*100}%`;zImg.style.transformOrigin=`${zPx*100}% ${zPy*100}%`;zImg.style.transform=`scale(${zS})`;$('#zRange').value=zS}
function openEditor(obj,key,slotEl,after){const v=pval(photoMap(obj,key)[key]);if(!v)return;
zT={obj,key,after};zS=v.s;zPx=v.px;zPy=v.py;zSrc=v.u;
const r=slotEl.getBoundingClientRect(),maxW=Math.min(340,innerWidth*.85),maxH=innerHeight*.5;
let w=maxW,h=w*(r.height/r.width);if(h>maxH){h=maxH;w=h*(r.width/r.height)}
zBox.style.width=w+'px';zBox.style.height=h+'px';
zImg.onload=()=>{zRi=zImg.naturalWidth/zImg.naturalHeight||1};zImg.src=zSrc;zRi=zImg.naturalWidth?zImg.naturalWidth/zImg.naturalHeight:1;
$('#zDel').textContent='🗑️ ลบรูปนี้';$('#zDel').dataset.s='';
applyZ();$('#zoomModal').style.display='flex'}
const closeEditor=()=>{$('#zoomModal').style.display='none';zT=null};
/* how far (px) the picture can travel on each axis at the current zoom */
const travel=()=>{const W=zBox.clientWidth,H=zBox.clientHeight,cw=Math.max(W,H*zRi),ch=Math.max(H,W/zRi);return{x:zS*cw-W,y:zS*ch-H}};
const zp=new Map();let zPinch=0,zPinchS=1;
const setZoom=s=>{zS=clamp(s,1,4);applyZ()};
zBox.addEventListener('pointerdown',e=>{zp.set(e.pointerId,{x:e.clientX,y:e.clientY});zBox.setPointerCapture(e.pointerId);
if(zp.size===2){const[a,b]=[...zp.values()];zPinch=Math.hypot(a.x-b.x,a.y-b.y)||1;zPinchS=zS}});
zBox.addEventListener('pointermove',e=>{const p=zp.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
if(zp.size===2){const[a,b]=[...zp.values()];setZoom(zPinchS*Math.hypot(a.x-b.x,a.y-b.y)/zPinch);return}
const t=travel();if(t.x>1)zPx=clamp(zPx-dx/t.x,0,1);if(t.y>1)zPy=clamp(zPy-dy/t.y,0,1);applyZ()});
['pointerup','pointercancel'].forEach(t=>zBox.addEventListener(t,e=>{zp.delete(e.pointerId)}));
zBox.addEventListener('wheel',e=>{e.preventDefault();setZoom(zS*(e.deltaY<0?1.1:1/1.1))},{passive:false});
$('#zRange').oninput=e=>setZoom(+e.target.value);
$('#zReset').onclick=()=>{zS=1;zPx=.5;zPy=.5;applyZ()};
$('#zX').onclick=closeEditor;
$('#zOk').onclick=async()=>{const t=zT;if(!t)return;photoMap(t.obj,t.key)[t.key]={u:zSrc,s:zS,px:zPx,py:zPy};closeEditor();await t.after('crop')};
$('#zChange').onclick=()=>{const t=zT;if(!t)return;closeEditor();pickFor(t.obj,t.key,t.after)};
$('#zDel').onclick=async e=>{const t=zT;if(!t)return;if(!e.target.dataset.s){e.target.dataset.s=1;e.target.textContent='กดอีกครั้งเพื่อยืนยันลบ';return}
delete photoMap(t.obj,t.key)[t.key];closeEditor();await t.after('del')};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('#zoomModal').style.display==='flex')closeEditor();$('#expModal').style.display='none'}});

/* ---- designer ---- */
let D,dp=0,sel=-1,editingExisting=false,designFrom='home',origAlbum=null;
const DEF=()=>({id:'a'+Date.now()+Math.random().toString(36).slice(2,6),email:me,title:'',sub:'',color:COV[0],tc:'#ffffff',font:'Mali',st:[],frame:'1',bg:PGBG[0],pgs:Array.from({length:4},()=>({n:4,v:0})),all:true,folder:null,cov:{n:0,v:0,photos:{}},photos:{},status:'draft',created:Date.now()});
/* editing works on a COPY, so "back" really cancels and nothing is lost */
function enterDesign(existing,from){origAlbum=existing||null;D=existing?clone(existing):DEF();editingExisting=!!existing;designFrom=from||'home';dp=0;sel=-1;show('design');$('#go').textContent=editingExisting?'💾 บันทึกการเปลี่ยนแปลง':'✨ เริ่มสร้างอัลบั้มของฉัน';buildCtl();updPrev()}
$('#v-design .bk').onclick=()=>{if(editingExisting&&designFrom==='book')openBook(origAlbum);else if(editingExisting)show('list');else show('home')};
$('#mNew').onclick=()=>enterDesign(null);
const sw=(k,list,cur)=>`<div class="row">${list.map(v=>`<button class="sw ${v===cur?'on':''}" data-k="${k}" data-v="${v}" style="background:${v}"></button>`).join('')}</div>`;
const chips=(k,list,cur)=>`<div class="row">${list.map(([v,t])=>`<button class="chip ${String(cur)===v?'on':''}" data-k="${k}" data-v="${v}">${t}</button>`).join('')}</div>`;
const stp=(id,v,mn,mx)=>`<div class="st"><button data-st="${id}" data-d="-1" ${v<=mn?'disabled':''}>−</button><b>${v}</b><button data-st="${id}" data-d="1" ${v>=mx?'disabled':''}>＋</button></div>`;
const thumbBtn=(attr,rows,on,v)=>`<button class="lt ${on?'on':''}" data-${attr}="${v}"><div class="mg" style="grid-template-rows:repeat(${rows.length},1fr)">${rows.map(k=>Array.from({length:k},()=>`<i style="grid-column:span ${6/k}"></i>`).join('')).join('')}</div></button>`;
function buildCtl(){const pg=D.pgs[dp],vs=LO[pg.n],ds=sel<0?'disabled':'',cn=D.cov.n,cvs=cn>0?LO[cn]:null;
$('#ctl').innerHTML=`<h2>🎨 ตกแต่งหน้าปก</h2>
<h3>ชื่ออัลบั้ม</h3><input type="text" id="iT" maxlength="40" value="${esc(D.title)}" placeholder="เช่น ทริปเชียงใหม่ 2026">
<h3>ข้อความรอง</h3><input type="text" id="iS" maxlength="50" value="${esc(D.sub)}" placeholder="เช่น กับครอบครัว">
<h3>สีปก</h3>${sw('color',COV,D.color)}<h3>สีตัวอักษร</h3>${sw('tc',TXT,D.tc)}<h3>ฟอนต์</h3>${chips('font',FONTS,D.font)}
<h3>จำนวนรูปบนปก (0 = ไม่ใส่รูป)</h3>${stp('covn',cn,0,COV_MAX)}
<p class="mut">แตะช่องบน "ตัวอย่างปก" ด้านบนเพื่อใส่รูป — แตะรูปที่ใส่แล้วเพื่อซูม/ครอบตัด/เปลี่ยน/ลบ${editingExisting&&cn>0?' · ถ้าลดจำนวนช่อง รูปในช่องที่เกินจะถูกลบตอนบันทึก':''}</p>
${cvs?`<h3>เลย์เอาท์รูปปก</h3><div class="row">${cvs.map((r,i)=>thumbBtn('cvr',r,i===(D.cov.v||0)%cvs.length,i)).join('')}</div>`:''}
<h3>สติ๊กเกอร์ — ลากไปวางบนปกด้านบนได้เลย</h3><div class="row">${STK.map(e=>`<button class="em1" data-add="${e}">${e}</button>`).join('')}</div>
<div class="row" style="margin-top:8px"><button data-act="big" ${ds}>＋ ใหญ่ขึ้น</button><button data-act="small" ${ds}>－ เล็กลง</button><button data-act="del" ${ds}>🗑️ ลบอันที่เลือก</button></div>
<h2>📄 ตกแต่งหน้าอัลบั้ม</h2>
<h3>จำนวนหน้าทั้งหมด</h3>${stp('pages',D.pgs.length,1,30)}
<h3>เลือกหน้าที่จะตั้งค่า (ดูตัวอย่างด้านบน)</h3><div class="row">${D.pgs.map((_,i)=>`<button class="chip ${i===dp?'on':''}" data-pick="${i}">${i+1}</button>`).join('')}</div>
<label class="mut" style="display:block;margin-top:8px"><input type="checkbox" id="all" ${D.all?'checked':''}> ตั้งค่าเหมือนกันทุกหน้า</label>
<h3>จำนวนรูปในหน้า ${dp+1}</h3>${stp('n',pg.n,1,9)}
<h3>เลย์เอาท์ของหน้า ${dp+1}</h3><div class="row">${vs.map((r,i)=>thumbBtn('vr',r,i===pg.v%vs.length,i)).join('')}</div>
<h3>กรอบรูป</h3>${chips('frame',FRM,D.frame)}<h3>พื้นหลังหน้า</h3>${sw('bg',PGBG,D.bg)}
${editingExisting?'<p class="mut">💡 เปลี่ยนเลย์เอาท์ได้อิสระ รูปเดิมจะอยู่ตามลำดับช่อง ถ้าลดจำนวนช่องลง รูปในช่องที่เกินจะถูกลบตอนกดบันทึก (ยังไม่บันทึก = ยังไม่หาย กด ← กลับ เพื่อยกเลิกได้)</p>':''}`}
const designRefresh=()=>updPrev();
function updPrev(){$('#pvC').innerHTML=cover(D,true);$('#pvP').innerHTML=pageHTML(D,dp,true)+`<div class="nav"><button data-pg="-1" ${dp<1?'disabled':''}>‹</button><span class="mut">หน้า ${dp+1}/${D.pgs.length}</span><button data-pg="1" ${dp>=D.pgs.length-1?'disabled':''}>›</button></div>`;if(sel>=0){const e=$(`#pvC .stk[data-i="${sel}"]`);e&&e.classList.add('sel')}}
$('#pvP').addEventListener('click',e=>{const b=e.target.closest('[data-pg]');if(b){if(!b.disabled){dp+=+b.dataset.pg;buildCtl();updPrev()}return}
const s=e.target.closest('.slot');if(s)onSlot(D,s,designRefresh)});
$('#pvC').addEventListener('click',e=>{const s=e.target.closest('.slot');if(s)onSlot(D,s,designRefresh)});
$('#ctl').addEventListener('input',e=>{const t=e.target;if(t.id==='iT')D.title=t.value;else if(t.id==='iS')D.sub=t.value;else return;updPrev()});
$('#ctl').addEventListener('change',e=>{if(e.target.id!=='all')return;D.all=e.target.checked;if(D.all)D.pgs=D.pgs.map(()=>({...D.pgs[dp]}));buildCtl();updPrev()});
$('#ctl').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset,tg=D.all?D.pgs:[D.pgs[dp]];
if(d.k)D[d.k]=d.v;
else if(d.st==='pages'){if(+d.d>0)D.pgs.push({...D.pgs[D.pgs.length-1]});else D.pgs.pop();dp=Math.min(dp,D.pgs.length-1)}
else if(d.st==='n'){const n=D.pgs[dp].n+ +d.d;tg.forEach(p=>{p.n=n;p.v=0})}
else if(d.st==='covn'){D.cov.n=clamp(D.cov.n+ +d.d,0,COV_MAX);D.cov.v=0}
else if(d.pick!==undefined)dp=+d.pick;
else if(d.vr!==undefined)tg.forEach(p=>p.v=+d.vr);
else if(d.cvr!==undefined)D.cov.v=+d.cvr;
else if(d.act&&sel>=0){if(d.act==='del'){D.st.splice(sel,1);sel=-1}else D.st[sel].z=clamp(D.st[sel].z+(d.act==='big'?4:-4),6,50)}
else return;
buildCtl();updPrev()});
/* drag sticker from palette onto cover */
$('#ctl').addEventListener('pointerdown',e=>{const b=e.target.closest('[data-add]');if(!b)return;e.preventDefault();const g=document.createElement('div');g.className='ghost';g.textContent=b.dataset.add;document.body.appendChild(g);
const at=ev=>{g.style.left=ev.clientX+'px';g.style.top=ev.clientY+'px'};at(e);const sx=e.clientX,sy=e.clientY;
const up=ev=>{['pointermove','pointerup','pointercancel'].forEach((t,i)=>document.removeEventListener(t,i?up:at));g.remove();const r=$('#pvC .cover').getBoundingClientRect();let x=(ev.clientX-r.left)/r.width*100,y=(ev.clientY-r.top)/r.height*100;
if(Math.hypot(ev.clientX-sx,ev.clientY-sy)<=8){x=50;y=60}else if(x<0||x>100||y<0||y>100)return;
if(D.st.length>=30)return toast('สติ๊กเกอร์เต็มแล้ว');D.st.push({e:b.dataset.add,x,y,z:16});sel=D.st.length-1;buildCtl();updPrev()};
document.addEventListener('pointermove',at);document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up)});
/* move sticker already on cover */
$('#pvC').addEventListener('pointerdown',e=>{const s=e.target.closest('.stk');if(!s)return;const i=+s.dataset.i,r=s.parentElement.getBoundingClientRect();sel=i;s.setPointerCapture(e.pointerId);
const mv=ev=>{D.st[i].x=clamp((ev.clientX-r.left)/r.width*100,0,100);D.st[i].y=clamp((ev.clientY-r.top)/r.height*100,0,100);s.style.left=D.st[i].x+'%';s.style.top=D.st[i].y+'%'};
const up=()=>{s.removeEventListener('pointermove',mv);s.removeEventListener('pointerup',up);buildCtl();updPrev()};s.addEventListener('pointermove',mv);s.addEventListener('pointerup',up)});
function cleanupOrphanPhotos(a){const validPage=new Set();a.pgs.forEach((g,p)=>{for(let i=0;i<g.n;i++)validPage.add(p+'-'+i)});Object.keys(a.photos).forEach(k=>{if(!validPage.has(k))delete a.photos[k]});
const cn=(a.cov&&a.cov.n)||0,validCov=new Set();for(let i=0;i<cn;i++)validCov.add('cov-'+i);if(a.cov)Object.keys(a.cov.photos).forEach(k=>{if(!validCov.has(k))delete a.cov.photos[k]})}
$('#go').onclick=async()=>{D.title=D.title.trim()||'อัลบั้มของฉัน';cleanupOrphanPhotos(D);
if(editingExisting){const filled=Object.keys(D.photos).length;if(D.status==='saved'&&filled<total(D))D.status='draft';await put(D);toast('บันทึกการเปลี่ยนแปลงแล้ว');openBook(D)}
else{D.status='draft';await put(D);openBook(D)}};

/* ---- book ---- */
let A,pi=0,opened=false,covEdit=false;
const nPages=()=>A.pgs.length;
const HINT_CLOSED='👆 แตะที่อัลบั้มเพื่อเปิดปก',HINT_EDIT='🖼️ แตะช่องรูปบนปกเพื่อใส่/แก้ไข · แตะบริเวณขอบปกเพื่อเปิดอัลบั้ม';
function showCover(edit){covEdit=!!edit;opened=false;$('#cv').innerHTML=cover(A,covEdit);$('#cv').classList.remove('open');$('#hint').textContent=covEdit?HINT_EDIT:HINT_CLOSED;$('#hint').style.display='';$('#nav').style.display='none'}
function openBook(a){A=a;pi=0;$('#bt').textContent=a.title;show('book');showCover(false);drawPage();prog()}
function drawPage(){$('#pg').innerHTML=pageHTML(A,pi,true);$('#pi').textContent=`หน้า ${pi+1} / ${nPages()}`;$('#pp').disabled=pi===0;$('#pn').disabled=pi===nPages()-1}
function prog(){const f=Object.keys(A.photos).length,t=total(A);$('#prog').textContent=`ใส่รูปแล้ว ${f} / ${t} ช่อง`;$('#keep').style.display=A.status==='draft'?'':'none';$('#keep').disabled=f<t;$('#keep').title=f<t?'ใส่รูปให้ครบทุกหน้าก่อน':''}
async function bookRefresh(kind){if(A.status==='saved'&&Object.keys(A.photos).length<total(A))A.status='draft';await put(A);
if(!opened)$('#cv').innerHTML=cover(A,covEdit);drawPage();prog();
if(kind==='add'&&A.status==='draft'&&Object.keys(A.photos).length>=total(A))toast('ครบทุกหน้าแล้ว! กด "เก็บอัลบั้ม" ได้เลย 🎉')}
$('#cv').onclick=e=>{const s=e.target.closest('.cslot');if(s&&covEdit){onSlot(A,s,bookRefresh);return}if(opened)return;opened=true;covEdit=false;$('#cv').classList.add('open');$('#hint').style.display='none';$('#nav').style.display='flex';toast('แตะที่กรอบรูปเพื่อใส่ / แก้ไขรูป')};
$('#backCover').onclick=()=>showCover(false);
$('#editCover').onclick=()=>showCover(true);
$('#editLayout').onclick=()=>enterDesign(A,'book');
$('#pp').onclick=()=>{pi--;drawPage()};$('#pn').onclick=()=>{pi++;drawPage()};
$('#pg').onclick=e=>{const s=e.target.closest('.slot');if(!s||!opened)return;onSlot(A,s,bookRefresh)};
$('#keep').onclick=async()=>{A.status='saved';await put(A);toast('เก็บอัลบั้มแล้ว 🎉');show('list')};
$('#trash').onclick=async()=>{A.status='trash';A.del=Date.now();await put(A);toast('ย้ายไปถังขยะแล้ว (เก็บไว้ 15 วัน)');show('home')};

/* ============ export image / PDF — drawn directly with Canvas 2D (no external libraries, works offline) ============ */
const imgCache=new Map();
const loadImg=u=>{if(!imgCache.has(u))imgCache.set(u,new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=u}));return imgCache.get(u)};
const mkCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=Math.round(w);c.height=Math.round(h);return c};
function rrPath(g,x,y,w,h,r){const[a,b,c,d]=Array.isArray(r)?r:[r,r,r,r];g.beginPath();g.moveTo(x+a,y);g.lineTo(x+w-b,y);g.arcTo(x+w,y,x+w,y+b,b);g.lineTo(x+w,y+h-c);g.arcTo(x+w,y+h,x+w-c,y+h,c);g.lineTo(x+d,y+h);g.arcTo(x,y+h,x,y+h-d,d);g.lineTo(x,y+a);g.arcTo(x,y,x+a,y,a);g.closePath()}
/* same maths as the CSS grid (6 columns, span 6/k, percentage gaps, equal rows) */
function gridRects(rows,bx,by,bw,bh,gp){const gx=bw*gp,gy=bh*gp,n=rows.length,rh=(bh-gy*(n-1))/n,cw=(bw-5*gx)/6,out=[];
rows.forEach((k,r)=>{const span=6/k;for(let j=0;j<k;j++){out.push({x:bx+j*span*(cw+gx),y:by+r*(rh+gy),w:span*cw+(span-1)*gx,h:rh})}});return out}
const coverRects=(a,W,H)=>gridRects(rowsOf(a.cov.n,a.cov.v),.11*W,.04*H,.84*W,.92*H,.02);
const pageRects=(a,p,W,H)=>{const g=a.pgs[p];return gridRects(rowsOf(g.n,g.v),.06*W,.06*W,.88*W,H-.12*W,.03)};
function paintBg(c,css,x,y,w,h,k){c.save();
if(css.startsWith('linear-gradient')){const m=css.match(/linear-gradient\((-?\d+)deg,\s*(#[0-9a-f]{3,8}),\s*(#[0-9a-f]{3,8})\)/i);
if(m){const th=m[1]*Math.PI/180,dx=Math.sin(th),dy=-Math.cos(th),len=Math.abs(w*dx)+Math.abs(h*dy),cx=x+w/2,cy=y+h/2;
const g=c.createLinearGradient(cx-dx*len/2,cy-dy*len/2,cx+dx*len/2,cy+dy*len/2);g.addColorStop(0,m[2]);g.addColorStop(1,m[3]);c.fillStyle=g}else c.fillStyle='#fff';c.fillRect(x,y,w,h)}
else if(css.startsWith('radial-gradient')){c.fillStyle='#fff';c.fillRect(x,y,w,h);c.fillStyle='#f3c9d5';const t=18*k;c.beginPath();for(let yy=y+t/2;yy<y+h+t;yy+=t)for(let xx=x+t/2;xx<x+w+t;xx+=t){c.moveTo(xx+2*k,yy);c.arc(xx,yy,2*k,0,7)}c.fill()}
else if(css.startsWith('repeating-linear-gradient')){const th=Math.PI/4,len=Math.abs(w*Math.sin(th))+Math.abs(h*Math.cos(th));
c.beginPath();c.rect(x,y,w,h);c.clip();c.fillStyle='#fff';c.fillRect(x,y,w,h);c.translate(x+w/2,y+h/2);c.rotate(th);c.fillStyle='#fdf0e6';
for(let t=10*k;t<len+20*k;t+=20*k)c.fillRect(-len,len/2-t-10*k,2*len,10*k)}
else{c.fillStyle=css;c.fillRect(x,y,w,h)}
c.restore()}
/* identical to the on-screen model: cover-fit, object-position(px,py), then scale(s) about (px,py) */
function drawPhoto(g,img,v,x,y,w,h,r){const iw=img.naturalWidth,ih=img.naturalHeight,sc=Math.max(w/iw,h/ih),cw=iw*sc,ch=ih*sc,ox=v.px*w,oy=v.py*h;
g.save();rrPath(g,x,y,w,h,r||0);g.clip();g.translate(x+ox,y+oy);g.scale(v.s,v.s);g.translate(-ox,-oy);g.drawImage(img,-v.px*(cw-w),-v.py*(ch-h),cw,ch);g.restore()}
const segmenter=window.Intl&&Intl.Segmenter?new Intl.Segmenter('th',{granularity:'word'}):null;
function wrapText(g,text,maxW){const toks=segmenter?[...segmenter.segment(text)].map(s=>s.segment):[...text],lines=[];let cur='';
const push=()=>{if(cur.trim())lines.push(cur.trim());cur=''};
for(const tk of toks){if(g.measureText(cur+tk).width<=maxW){cur+=tk;continue}push();
if(g.measureText(tk).width<=maxW){cur=tk.trimStart();continue}
for(const ch of tk){if(g.measureText(cur+ch).width>maxW&&cur)push();cur+=ch}}push();return lines}
async function drawSlotPhoto(g,a,key,rect,r){const v=pval(photoMap(a,key)[key]);
if(!v){g.fillStyle='rgba(128,128,128,.2)';rrPath(g,rect.x,rect.y,rect.w,rect.h,r||0);g.fill();return}
drawPhoto(g,await loadImg(v.u),v,rect.x,rect.y,rect.w,rect.h,r)}
async function drawCoverCv(a,W,H){const c=mkCanvas(W,H),g=c.getContext('2d'),k=W/360,u=W/100,hasph=a.cov.n>0;
g.fillStyle='#fff';g.fillRect(0,0,W,H);g.save();rrPath(g,0,0,W,H,[6*k,14*k,14*k,6*k]);g.clip();
paintBg(g,a.color,0,0,W,H,k);
if(hasph){const rs=coverRects(a,W,H);for(let i=0;i<rs.length;i++)await drawSlotPhoto(g,a,'cov-'+i,rs[i],0)}
g.fillStyle=a.tc;g.textAlign='center';g.textBaseline='middle';
if(hasph){g.shadowColor='rgba(0,0,0,.65)';g.shadowBlur=8*k;g.shadowOffsetY=2*k}
const fam=`'${a.font}','Mali','Kanit',sans-serif`,cx=W*.53,mw=W*.82;
g.font=`600 ${9*u}px ${fam}`;wrapText(g,a.title||'อัลบั้มของฉัน',mw).forEach((l,i)=>g.fillText(l,cx,H*.14+(i+.5)*1.2*9*u,mw));
g.globalAlpha=.9;g.font=`400 ${5*u}px ${fam}`;wrapText(g,a.sub||'',mw).forEach((l,i)=>g.fillText(l,cx,H*.38+(i+.5)*1.2*5*u,mw));g.globalAlpha=1;
g.shadowColor='transparent';g.shadowBlur=0;g.shadowOffsetY=0;
for(const s of a.st){g.font=`${s.z*u}px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif`;g.fillText(s.e,W*s.x/100,H*s.y/100)}
g.fillStyle='rgba(0,0,0,.2)';g.fillRect(0,0,W*.07,H);
const lw=.6*u;g.save();g.globalAlpha=hasph?.85:.5;g.strokeStyle=a.tc;g.lineWidth=lw;g.setLineDash([3*lw,3*lw]);rrPath(g,.11*W+lw/2,.04*H+lw/2,.84*W-lw,.92*H-lw,3*u);g.stroke();g.restore();
g.restore();return c}
async function drawFramedSlot(g,a,key,r,k){const f=String(a.frame);
if(f==='0'){await drawSlotPhoto(g,a,key,r,8*k)}
else if(f==='1'){g.save();g.shadowColor='rgba(0,0,0,.27)';g.shadowBlur=8*k;g.shadowOffsetY=3*k;g.fillStyle='#fff';g.fillRect(r.x,r.y,r.w,r.h);g.restore();
await drawSlotPhoto(g,a,key,{x:r.x+5*k,y:r.y+5*k,w:r.w-10*k,h:r.h-27*k},0)}
else if(f==='2'){g.fillStyle='#fffbe8';g.fillRect(r.x,r.y,r.w,r.h);g.strokeStyle='#c9a227';g.lineWidth=5*k/3;
g.strokeRect(r.x+5*k/6,r.y+5*k/6,r.w-5*k/3,r.h-5*k/3);g.strokeRect(r.x+5*k-5*k/6,r.y+5*k-5*k/6,r.w-10*k+5*k/3,r.h-10*k+5*k/3);
await drawSlotPhoto(g,a,key,{x:r.x+9*k,y:r.y+9*k,w:r.w-18*k,h:r.h-18*k},0)}
else if(f==='3'){g.save();g.shadowColor='rgba(0,0,0,.27)';g.shadowBlur=8*k;g.shadowOffsetY=3*k;g.fillStyle='#fff';rrPath(g,r.x,r.y,r.w,r.h,24*k);g.fill();g.restore();
await drawSlotPhoto(g,a,key,{x:r.x+4*k,y:r.y+4*k,w:r.w-8*k,h:r.h-8*k},20*k)}
else{g.strokeStyle='#e0567a';g.lineWidth=3*k;g.setLineDash([6*k,4*k]);rrPath(g,r.x+1.5*k,r.y+1.5*k,r.w-3*k,r.h-3*k,4*k);g.stroke();g.setLineDash([]);
await drawSlotPhoto(g,a,key,{x:r.x+8*k,y:r.y+8*k,w:r.w-16*k,h:r.h-16*k},0)}}
async function drawPageCv(a,p,W,H){const c=mkCanvas(W,H),g=c.getContext('2d'),k=W/360;
g.fillStyle='#fff';g.fillRect(0,0,W,H);g.save();rrPath(g,0,0,W,H,12*k);g.clip();paintBg(g,a.bg,0,0,W,H,k);
const rs=pageRects(a,p,W,H);for(let i=0;i<rs.length;i++)await drawFramedSlot(g,a,p+'-'+i,rs[i],k);
g.fillStyle='#888';g.font=`400 ${3*W/100}px 'Mali','Kanit',sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(String(p+1),W/2,H*.99-2.25*W/100);g.restore();return c}
const drawAny=(a,idx,W,H)=>idx===0?drawCoverCv(a,W,H):drawPageCv(a,idx-1,W,H);   /* idx 0 = cover, 1..n = pages */
async function prepFonts(a){try{await Promise.all([document.fonts.load(`600 40px "${a.font}"`),document.fonts.load('400 40px "Mali"')])}catch(e){}}
const fname=t=>((t||'album').replace(/[\\/:*?"<>|]+/g,'_').trim()||'album');
function download(blob,name){const u=URL.createObjectURL(blob),l=document.createElement('a');l.href=u;l.download=name;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),5000)}
const toBlob=(c,type,q)=>new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('toBlob')),type,q));

/* minimal PDF writer: one full-page JPEG per page */
async function buildPDF(pages,title){const enc=new TextEncoder(),parts=[],offs=[];let off=0;
const push=d=>{const b=typeof d==='string'?enc.encode(d):d;parts.push(b);off+=b.length};
const PW=540,PH=720,n=pages.length,hex=[...('\uFEFF'+title)].map(ch=>{let s='';for(let i=0;i<ch.length;i++)s+=ch.charCodeAt(i).toString(16).padStart(4,'0');return s}).join('');
push('%PDF-1.4\n');
const obj=(id,body)=>{offs[id]=off;push(`${id} 0 obj\n`);body();push('\nendobj\n')};
obj(1,()=>push('<< /Type /Catalog /Pages 2 0 R >>'));
obj(2,()=>push(`<< /Type /Pages /Count ${n} /Kids [${pages.map((_,i)=>`${4+i*3} 0 R`).join(' ')}] >>`));
obj(3,()=>push(`<< /Title <${hex}> /Producer (Photo Album) >>`));
pages.forEach((pg,i)=>{const P=4+i*3,C=5+i*3,I=6+i*3,cs=`q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`;
obj(P,()=>push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 ${I} 0 R >> >> /Contents ${C} 0 R >>`));
obj(C,()=>push(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`));
obj(I,()=>{push(`<< /Type /XObject /Subtype /Image /Width ${pg.w} /Height ${pg.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.bytes.length} >>\nstream\n`);push(pg.bytes);push('\nendstream')})});
const xo=off,N=4+n*3;push(`xref\n0 ${N}\n0000000000 65535 f \n`);for(let i=1;i<N;i++)push(String(offs[i]).padStart(10,'0')+' 00000 n \n');
push(`trailer\n<< /Size ${N} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xo}\n%%EOF`);return new Blob(parts,{type:'application/pdf'})}

let busy=false;
async function runExport(fn){if(busy)return toast('กำลังส่งออกอยู่ รอสักครู่นะ');busy=true;try{await prepFonts(A);await fn()}catch(e){console.error(e);toast('ส่งออกไม่สำเร็จ ลองใหม่อีกครั้ง')}finally{imgCache.clear();busy=false}}
async function exportPDF(){await runExport(async()=>{const W=1080,H=1440,list=[],cnt=1+A.pgs.length;
for(let i=0;i<cnt;i++){toast(`กำลังสร้าง PDF... ${i+1}/${cnt}`);const c=await drawAny(A,i,W,H),b=await toBlob(c,'image/jpeg',.9);list.push({w:c.width,h:c.height,bytes:new Uint8Array(await b.arrayBuffer())});c.width=c.height=1;await new Promise(r=>setTimeout(r))}
download(await buildPDF(list,A.title||'album'),fname(A.title)+'.pdf');toast('ดาวน์โหลด PDF แล้ว')})}
async function exportPNG(mode){await runExport(async()=>{toast('กำลังสร้างรูปภาพ...');
if(mode==='one'){const idx=opened?pi+1:0,c=await drawAny(A,idx,1080,1440);download(await toBlob(c,'image/png'),fname(A.title)+(idx?`-หน้า${idx}`:'-ปก')+'.png')}
else{const cnt=1+A.pgs.length,big=cnt>12,cw=big?480:540,ch=big?640:720,cols=cnt<=2?cnt:cnt<=4?2:big?4:3,rows=Math.ceil(cnt/cols),gap=20,pad=20;
const sheet=mkCanvas(pad*2+cols*cw+(cols-1)*gap,pad*2+rows*ch+(rows-1)*gap),g=sheet.getContext('2d');g.fillStyle='#fff7f0';g.fillRect(0,0,sheet.width,sheet.height);
for(let i=0;i<cnt;i++){toast(`กำลังสร้างรูปภาพ... ${i+1}/${cnt}`);const c=await drawAny(A,i,cw,ch);g.drawImage(c,pad+(i%cols)*(cw+gap),pad+Math.floor(i/cols)*(ch+gap));await new Promise(r=>setTimeout(r))}
download(await toBlob(sheet,'image/png'),fname(A.title)+'-ทั้งเล่ม.png')}
toast('ดาวน์โหลดรูปภาพแล้ว')})}
$('#expImg').onclick=()=>{$('#expOne').textContent=opened?`หน้า ${pi+1} (ภาพความละเอียดสูง)`:'หน้าปก (ภาพความละเอียดสูง)';$('#expModal').style.display='flex'};
$('#expOne').onclick=()=>{$('#expModal').style.display='none';exportPNG('one')};
$('#expAll').onclick=()=>{$('#expModal').style.display='none';exportPNG('all')};
$('#expX').onclick=()=>{$('#expModal').style.display='none'};
$('#expPdf').onclick=exportPDF;

/* ---- start ---- */
purge();me?show('home'):show('login');

/* ---- PWA: service worker + install prompt ---- */
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}
let dfi=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();dfi=e;$('#inst').style.display='inline-block'});
window.addEventListener('appinstalled',()=>{$('#inst').style.display='none'});
$('#inst').onclick=async()=>{if(!dfi)return;dfi.prompt();await dfi.userChoice;dfi=null;$('#inst').style.display='none'};
