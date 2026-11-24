/* ===== Tell me once: a change to how DAAs are packed · inherited facts on a first visit (owner, 24 Nov 2026) =====
 * Sources re-checked 24 Nov 2026:
 *  - NSW Health, Dose Administration Aids (current as at 4 Sep 2026): labelling (date packed, date of birth, Appendix L,
 *    third-party reference number linking DAA, manufacturing instructions and prescriptions); manufacturing instructions
 *    (medicines, dose, directions; the pharmacist is responsible for accuracy); the supplying pharmacy stays responsible
 *    for all of dispensing and supply; consent "should" be obtained for third-party packing; consent "must" be obtained
 *    before prescriptions are transferred to another pharmacy, which then becomes the supplying pharmacy; TGA licence:
 *    "contact the TGA Manufacturing Quality Branch" for advice on whether one is required.
 *  - NSW Health Pharmacists FAQ: third-party packers need a TGA GMP licence; both keep manufacturing instructions 2 years.
 * What it does: the owner records the change once (arrangement, packer, start date). The DAA arrangement switches are
 * saved exactly as the Services page saves them. Only the items that depend on the change are listed, each marked
 * Required by law / Check / Recommended with its source. Each can be marked done (by the owner) or left for later,
 * which raises one ordinary action. Procedure wording changes go through the existing DAA setup questions, so any new
 * wording is a draft until adopted. Open actions, past reviews and review dates are not touched.
 */
RPH.chg={};
const cEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cPretty=d=>{try{return pretty(d);}catch{return d||'';}};
RPH.chg.ROUTES=[['house','We pack on site','We dispense and pack in this pharmacy'],['routeA','We dispense, an outside packer packs','The packer works from our instructions; we stay the supplying pharmacy'],['routeB','Another pharmacy dispenses and packs','That pharmacy becomes the supplying pharmacy']];
RPH.chg.SRC={daa:'NSW Health · Dose Administration Aids (4 Sep 2026)',faq:'NSW Health · Pharmacists FAQ',reg:'Medicines, Poisons and Therapeutic Goods Regulation 2026'};
RPH.chg.now=()=>{const f=state.flags||{};return RPH.chg.ROUTES.map(r=>r[0]).filter(k=>k==='house'?f.house!==false:!!f[k]);};
RPH.chg.label=ks=>ks.length?ks.map(k=>RPH.chg.ROUTES.find(r=>r[0]===k)?.[1]||k).join(' + '):'Not set';
RPH.chg.list=()=>(state.serviceChanges||[]).filter(c=>c.service==='daa');
RPH.chg.open=()=>RPH.chg.list().filter(c=>c.type==='change').find(c=>Object.values(c.items||{}).some(i=>i.status!=='done'));
/* Items that depend on the change. Only for routes that are new. */
RPH.chg.itemsFor=function(from,to){
 const add=to.filter(k=>!from.includes(k)),out=[];
 if(add.includes('routeA')){
  out.push({key:'instructions',tag:'law',title:'Packing instructions match each prescription',text:'Give the packer manufacturing instructions listing each medicine, its dose and directions. You’re responsible for their accuracy.',src:RPH.chg.SRC.daa});
  out.push({key:'reference',tag:'law',title:'Reference number on every pack',text:'Each pack needs a reference number (a barcode or QR code is fine) linking the pack, the instructions and the prescriptions, as well as the date packed and date of birth.',src:RPH.chg.SRC.daa+' · '+RPH.chg.SRC.reg+' s 136'});
  out.push({key:'supplier',tag:'law',title:'You’re still the supplying pharmacy',text:'Counselling, labelling, dispensing and packing records, and packs that name this pharmacy all stay with you.',src:RPH.chg.SRC.daa});
  out.push({key:'licence',tag:'check',title:'The packer’s TGA manufacturing licence',text:'The FAQ says third-party packers need a TGA GMP licence; the DAA page says to ask the TGA (GMP@health.gov.au) if unsure. Note where you keep a copy.',src:RPH.chg.SRC.faq+' · '+RPH.chg.SRC.daa,note:'Where the copy is kept'});
  out.push({key:'consent3p',tag:'rec',title:'Ask patients before a third party packs',text:'NSW Health says the supplying pharmacy should get patient consent.',src:RPH.chg.SRC.daa});}
 if(add.includes('routeB')){
  out.push({key:'consentRx',tag:'law',title:'Patient consent before prescriptions move',text:'Get each patient’s consent before their prescriptions go to the other pharmacy.',src:RPH.chg.SRC.daa});
  out.push({key:'label',tag:'law',title:'Don’t label as the supplying pharmacy',text:'The pharmacy that dispenses and packs becomes the supplying pharmacy. Packs must not show this pharmacy as supplier.',src:RPH.chg.SRC.daa});}
 out.push({key:'procedure',tag:'setup',title:'Update your DAA procedure answers',text:'Opens the DAA setup questions, starting with how packs are made. Any new procedure wording is a draft; your current approved version stays in use until you adopt it.',src:'Your DAA procedure'});
 return out;};
RPH.chg.kept=function(){
 const daaRev=catalog().filter(a=>a.service==='daa'&&!a.eventOnly);
 const open=Object.values(state.taskLedger||{}).filter(t=>t.status==='Outstanding'&&/\bDAA|dose administration|pack(s|ing)?\b/i.test(t.text));
 const past=(state.reviews||[]).filter(r=>daaRev.some(a=>a.id===r.audit)).length;
 const next=daaRev.map(a=>state.schedule?.[a.id]).filter(Boolean).sort()[0]||'';
 return {open:open.length,past,next};};
/* ---------- the flow ---------- */
RPH.chg.start=function(){const o=RPH.chg.open();if(o)return RPH.chg.summary(o.id);RPH.chg.choose(RPH.chg.now(),'',today());};
RPH.chg.choose=function(sel,packer,from){
 const cur=RPH.chg.now();
 openDialog(`<h2 id="dialog-title">What’s changing?</h2><p class="sub">Dose administration aids · now: ${cEsc(RPH.chg.label(cur))}</p>
 <fieldset class="chg-opts"><legend>From the date below, how are packs made? Tick all that will apply.</legend>${RPH.chg.ROUTES.map(([k,l,d])=>`<label class="chg-opt"><input type="checkbox" value="${k}" ${sel.includes(k)?'checked':''}><span><b>${cEsc(l)}</b><small>${cEsc(d)}${cur.includes(k)?' · current':''}</small></span></label>`).join('')}</fieldset>
 <label class="chg-field" id="chg-packer-l">Packer or pharmacy (name or agreement reference)<input type="text" id="chg-packer" value="${cEsc(packer)}" placeholder="e.g. Northside Packing Co"></label>
 <label class="chg-field">Starts on<input type="date" id="chg-from" value="${cEsc(from)}"></label>
 <p class="sub" id="chg-msg" role="status"></p>
 <div class="chg-acts"><button type="button" class="primary" id="chg-next">See what this changes</button></div>`);
 const ed=$('editor');ed.classList.add('chgdlg');
 const read=()=>[...ed.querySelectorAll('.chg-opts input:checked')].map(i=>i.value);
 const sync=()=>{$('chg-packer-l').hidden=!read().some(k=>k!=='house');};sync();ed.querySelector('.chg-opts').onchange=sync;
 $('chg-next').onclick=()=>{const to=read(),p=$('chg-packer').value.trim(),f=$('chg-from').value;
  if(!to.length)return $('chg-msg').textContent='Tick at least one way packs are made.';
  if(to.slice().sort().join()===cur.slice().sort().join())return $('chg-msg').textContent='That’s the same as now. Tick the arrangement that will apply.';
  if(to.some(k=>k!=='house')&&!p){$('chg-msg').textContent='Add the packer or pharmacy name.';return $('chg-packer').focus();}
  if(!f)return $('chg-msg').textContent='Choose the date it starts.';
  RPH.chg.compare(cur,to,p,f);};};
RPH.chg.compare=function(from,to,packer,start){
 const has=k=>to.includes(k);
 const row=(k,a,b)=>`<div class="k">${cEsc(k)}</div><div>${cEsc(a)}</div><div class="${a===b?'':'new'}">${cEsc(b)}</div>`;
 const who=ks=>ks.includes('routeB')&&!ks.includes('house')&&!ks.includes('routeA')?'Another pharmacy':ks.includes('routeA')?(ks.includes('house')?'Us, and an outside packer':'An outside packer'):'This pharmacy';
 const supplier=ks=>ks.includes('routeB')&&ks.length===1?'The other pharmacy':ks.includes('routeB')?'Us, or the other pharmacy for its patients':'This pharmacy';
 const recs=ks=>ks.includes('routeA')?'Dispensing and packing records, plus packing instructions':'Dispensing and packing records';
 const pts=(f,t)=>t.includes('routeB')&&!f.includes('routeB')?'Consent before prescriptions move':t.includes('routeA')&&!f.includes('routeA')?'Ask before a third party packs':'No change';
 openDialog(`<h2 id="dialog-title">Before and after</h2><p class="sub">From ${cEsc(cPretty(start))}${packer?' · '+cEsc(packer):''}</p>
 <div class="chg-cmp"><div class="h">Now</div><div class="h">From ${cEsc(cPretty(start))}</div>${row('Who packs',who(from),who(to))}${row('Supplying pharmacy',supplier(from),supplier(to))}${row('Records',recs(from),recs(to))}${row('Patients',pts(from,from),pts(from,to))}</div>
 <p class="sub">Your DAA review dates stay as they are. From now, the DAA review asks about the new arrangement. Past reviews keep how things were done then.</p>
 <div class="chg-acts"><button type="button" id="chg-back">Back</button><button type="button" class="primary" id="chg-save">Save this change</button></div>`);
 $('editor').classList.add('chgdlg');
 $('chg-back').onclick=()=>RPH.chg.choose(to,packer,start);
 $('chg-save').onclick=()=>{const id=RPH.chg.save(from,to,packer,start);if(id)RPH.chg.summary(id);};};
RPH.chg.save=function(from,to,packer,start){
 const id='chg-'+crypto.randomUUID(),items={};for(const i of RPH.chg.itemsFor(from,to))items[i.key]={status:'open'};
 const by=(()=>{try{return RPH.actor().name;}catch{return '';}})();
 const ok=fsChange('DAA change recorded · '+RPH.chg.label(to)+' from '+start,n=>{
  (n.serviceChanges??=[]).push({id,type:'change',service:'daa',from,to,packer,start,recordedAt:new Date().toISOString(),recordedBy:by,items});
  n.flags??={};for(const k of ['house','routeA','routeB'])n.flags[k]=to.includes(k);});
 return ok===false?null:id;};
RPH.chg.mark=function(cid,key,status,note){
 const by=(()=>{try{return RPH.actor().name;}catch{return '';}})();const c=RPH.chg.list().find(x=>x.id===cid);const it=c&&RPH.chg.itemsFor(c.from,c.to).find(i=>i.key===key);if(!it)return;
 const cur=c.items?.[key]||{};
 return fsChange((status==='done'?'Done · ':'Left for later · ')+it.title,n=>{const x=n.serviceChanges.find(y=>y.id===cid);const s=(x.items[key]??={status:'open'});
  if(status==='later'&&!s.taskId){const tid='chg-'+crypto.randomUUID().slice(0,12);taskNew(n,tid,{text:it.title+' · DAA change from '+cPretty(x.start),owner:'You',due:x.start>today()?x.start:addInterval(today(),14,'days')},null);s.taskId=tid;}
  s.status=status;s.at=new Date().toISOString();s.by=by;if(note)s.note=note;});};
RPH.chg.summary=function(cid){
 const c=RPH.chg.list().find(x=>x.id===cid);if(!c)return;const items=RPH.chg.itemsFor(c.from,c.to),k=RPH.chg.kept();
 const tag={law:['Required by law','law'],check:['Check','check'],rec:['Recommended','rec'],setup:['Your procedure','setup']};
 const left=items.filter(i=>(c.items[i.key]?.status||'open')!=='done').length;
 openDialog(`<h2 id="dialog-title">DAA change from ${cEsc(cPretty(c.start))}</h2>
 <p class="sub">${cEsc(RPH.chg.label(c.from))} → <b>${cEsc(RPH.chg.label(c.to))}</b>${c.packer?' · '+cEsc(c.packer):''}<br>Recorded ${cEsc(cPretty(c.recordedAt.slice(0,10)))}${c.recordedBy?' by '+cEsc(c.recordedBy):''}</p>
 <h3 class="chg-h">${left?left+' thing'+(left===1?'':'s')+' depend on this':'Everything here is done'}</h3>
 <ul class="chg-items">${items.map(i=>{const s=c.items[i.key]||{status:'open'};const t=s.taskId&&state.taskLedger?.[s.taskId];
  return `<li data-key="${i.key}" class="chg-${s.status}"><div class="chg-it"><span class="chg-tag chg-tag-${tag[i.tag][1]}">${tag[i.tag][0]}</span><b>${cEsc(i.title)}</b><small>${cEsc(i.text)}</small><small class="chg-src">${cEsc(i.src)}</small>
  ${s.status==='done'?`<span class="chg-state">Done ${cEsc(cPretty(String(s.at).slice(0,10)))}${s.note?' · '+cEsc(s.note):''}</span>`:s.status==='later'?`<span class="chg-state">Left for later · in Actions${t&&t.status==='Completed'?' (closed)':''}</span>`:''}</div>
  ${s.status!=='done'?`<div class="chg-btns">${i.key==='procedure'?'<button type="button" class="chg-proc">Open DAA setup</button>':''}<button type="button" class="chg-done">${i.key==='procedure'?'I’ve updated it':'Done'}</button>${s.status!=='later'?'<button type="button" class="chg-later">Later</button>':''}</div>`:''}</li>`;}).join('')}</ul>
 <h3 class="chg-h">Kept as it is</h3>
 <ul class="chg-kept"><li>${k.open} open DAA action${k.open===1?'':'s'} stay${k.open===1?'s':''} open</li><li>${k.past} past DAA review${k.past===1?'':'s'} keep how things were done then</li><li>${k.next?'Next DAA review '+cEsc(cPretty(k.next))+' · date unchanged':'Review dates unchanged'}</li></ul>
 <div class="chg-acts"><button type="button" class="primary" id="chg-close">Done for now</button></div>`);
 const ed=$('editor');ed.classList.add('chgdlg');$('chg-close').onclick=()=>ed.close();
 for(const li of ed.querySelectorAll('.chg-items li')){const key=li.dataset.key,it=items.find(i=>i.key===key);
  li.querySelector('.chg-later')?.addEventListener('click',()=>{RPH.chg.mark(cid,key,'later');RPH.chg.summary(cid);});
  li.querySelector('.chg-proc')?.addEventListener('click',()=>{if(RPH.visit)RPH.visit.ret=()=>RPH.chg.summary(cid);ed.close();setTimeout(()=>configureService('daa'),0);});
  li.querySelector('.chg-done')?.addEventListener('click',()=>{
   if(it.note&&!li.querySelector('.chg-note')){const inp=D.el('input',{type:'text',class:'chg-note',placeholder:it.note,'aria-label':it.note});const ok=D.el('button',{type:'button',class:'primary',text:'Save'});ok.onclick=()=>{RPH.chg.mark(cid,key,'done',inp.value.trim());RPH.chg.summary(cid);};li.querySelector('.chg-btns').replaceChildren(inp,ok);inp.focus();return;}
   RPH.chg.mark(cid,key,'done');RPH.chg.summary(cid);});}
};
/* ---------- Services page: the entry point and what happened ---------- */
const cSvc=CD.V.services;
CD.V.services=function(){const h=cSvc.apply(this,arguments);
 if(CD.st.sel.services!=='daa'||!state.active.includes('daa'))return h;
 const o=RPH.chg.open(),last=RPH.chg.list().at(-1);
 const line=last?(last.type==='confirm'?'Packing arrangement confirmed '+cPretty(last.at.slice(0,10))+(last.by?' by '+last.by:''):'Changed '+cPretty(last.recordedAt.slice(0,10))+' · '+RPH.chg.label(last.to)+' from '+cPretty(last.start)):'';
 const blk=`<div class="blk chg-blk"><div class="lbl" style="margin-bottom:4px">How it runs</div><p style="margin:0 0 8px">${cEsc(RPH.chg.label(RPH.chg.now()))}${line?`<br><span class="sub">${cEsc(line)}</span>`:''}</p><div class="acts">${CD.btn(o?'Continue the change ('+Object.values(o.items).filter(i=>i.status!=='done').length+' left)':'Change how this service runs',()=>RPH.chg.start(),true)}</div></div>`;
 return h.replace('<div class="blk acts">',blk+'<div class="blk acts">');};
/* ---------- First visit after buying: confirm inherited facts while you're there ---------- */
RPH.chg.confirm=function(){const by=(()=>{try{return RPH.actor().name;}catch{return '';}})();const arr=RPH.chg.now();
 return fsChange('Confirmed DAA packing · '+RPH.chg.label(arr),n=>{(n.serviceChanges??=[]).push({id:'chg-'+crypto.randomUUID(),type:'confirm',service:'daa',arrangement:arr,at:new Date().toISOString(),by});});};
RPH.chg.inherited=function(){
 if(!state.inherited)return [];const out=[];
 if(state.active.includes('daa')&&!RPH.chg.list().length&&!RPH.chg.skip)out.push({daa:true,title:'DAAs: '+RPH.chg.label(RPH.chg.now()).toLowerCase(),q:'Is that still how this pharmacy runs?'});
 let u=[];try{u=fsUnknowns();}catch{}
 for(const v of u.filter(v=>!(RPH.chg.skipU||[]).includes(v.id)).slice(0,3-out.length))out.push({title:v.label,q:'Recorded by the previous owner · check it while you’re here',run:v.run,id:v.id});
 return out;};
new MutationObserver(()=>{const ed=$('editor');if(!ed.classList.contains('vprep')||ed.querySelector('.inh-box'))return;const h=ed.querySelector('.vp-h');if(!h)return;
 const rows=RPH.chg.inherited();if(!rows.length)return;
 const box=D.el('div',{class:'inh-box'});box.append(D.el('div',{class:'inh-lbl',text:'From the previous owner · confirm while you’re here'}));
 const ul=D.el('ul',{class:'vp-list'});
 for(const r of rows){const li=D.el('li',{class:'inh-row'});const tx=D.el('div',{class:'inh-tx'});tx.append(D.el('b',{text:r.title}),D.el('small',{text:r.q}));const bt=D.el('div',{class:'inh-btns'});
  const reopen=()=>{ed.classList.remove('vprep');RPH.visit.prep();};
  if(r.daa){const c=D.el('button',{type:'button',text:'Confirm'});c.onclick=()=>{RPH.chg.confirm();reopen();};
   const x=D.el('button',{type:'button',text:'Correct'});x.onclick=()=>{RPH.visit.ret=()=>RPH.visit.prep();ed.close();setTimeout(()=>RPH.chg.start(),0);};
   const l=D.el('button',{type:'button',class:'rph-link',text:'Leave open'});l.onclick=()=>{RPH.chg.skip=true;reopen();};bt.append(c,x,l);}
  else{const c=D.el('button',{type:'button',text:'Check now'});c.onclick=()=>{RPH.visit.ret=()=>RPH.visit.prep();ed.close();setTimeout(()=>{try{r.run();}catch(e){RPH.visit.ret=null;notify(e.message);}},0);};
   const l=D.el('button',{type:'button',class:'rph-link',text:'Leave open'});l.onclick=()=>{(RPH.chg.skipU??=[]).push(r.id);reopen();};bt.append(c,l);}
  li.append(tx,bt);ul.append(li);}
 box.append(ul);h.before(box);}).observe($('editor'),{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
/* Visit suggestions: "check later" items move into the inherited box above while it shows them. */
if(RPH.visit){const cSug=RPH.visit.suggest;RPH.visit.suggest=function(){const out=cSug.apply(this,arguments);if(!state.inherited)return out;const ids=new Set(RPH.chg.inherited().map(r=>r.title));return out.filter(s=>!ids.has(s.title));};}
/* The change screens' styling applies only while they're open. */
new MutationObserver(()=>{const ed=$('editor');if(!ed.open)ed.classList.remove('chgdlg');}).observe($('editor'),{attributes:true,attributeFilter:['open']});
const cOpenDlg=openDialog;openDialog=function(){$('editor').classList.remove('chgdlg');return cOpenDlg.apply(this,arguments);};
