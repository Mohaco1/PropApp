/* ===== UAT-only tester tools (not part of the app) =====
 * For the owner's UAT: notes on any page, and on every setup question a choice of
 * "Could be a usual arrangement" / "Must always be asked" / "No opinion" with an optional note.
 * Stored only in this browser under its own key; never written to the pharmacy's records, backups or history.
 * Remove this layer from the build for any real release.
 */
const UAT={key:'rph-uat-tester-v1',remote:null,cache:{questions:{},notes:[]},live:false};
/* Notes are saved in the UAT page's shared store on claude.ai (synced between your computers, readable by Claude),
   or in this browser only when that store isn't available (e.g. a local copy). */
UAT.local=()=>{try{const d=JSON.parse(localStorage.getItem(UAT.key)||'{}');d.questions??={};d.notes??=[];return d;}catch{return {questions:{},notes:[]};}};
UAT.saveLocal=d=>{try{localStorage.setItem(UAT.key,JSON.stringify(d));return true;}catch{notify('UAT notes could not be saved in this browser.');return false;}};
UAT.data=()=>UAT.live?UAT.cache:UAT.local();
UAT.qid=k=>'q_'+k.replace(/[^a-zA-Z0-9_-]/g,'_');
UAT.connect=async function(){
 try{const db=await window.claude?.use?.('db');if(!db)return;const user=await window.claude.use('user');UAT.uid=user?await user.id():'';
  UAT.remote={notes:db.collection('uatnotes'),questions:db.collection('uatquestions')};
  const done={n:false,q:false};const ready=()=>{if(done.n&&done.q){UAT.live=true;UAT.badge();UAT.refresh();}};
  const t=setTimeout(()=>{if(!UAT.live)notify('UAT notes: shared store not reached; notes stay in this browser for now.');},10000);
  UAT.remote.notes.onSnapshot(q=>{clearTimeout(t);UAT.cache.notes=q.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));done.n=true;ready();UAT.badge();UAT.refresh();},()=>{});
  UAT.remote.questions.onSnapshot(q=>{UAT.cache.questions=Object.fromEntries(q.docs.map(d=>[d.data().key,d.data()]));done.q=true;ready();UAT.badge();},()=>{});
 }catch(e){}
};
UAT.setQuestion=async function(key,patch){
 if(UAT.live){const cur=UAT.cache.questions[key]||{};const v={...cur,...patch,key,updatedAt:new Date().toISOString()};UAT.cache.questions[key]=v;try{await UAT.remote.questions.doc(UAT.qid(key)).set(v);}catch(e){notify('UAT note not saved: '+(e?.code||e?.message||e));}}
 else{const d=UAT.local();d.questions[key]={...(d.questions[key]||{}),...patch,key,updatedAt:new Date().toISOString()};UAT.saveLocal(d);}
 UAT.badge();
};
UAT.addNote=async function(n){n={...n,status:'Open',fix:'',createdAt:new Date().toISOString(),by:UAT.uid||''};
 if(UAT.live){try{await UAT.remote.notes.add(n);}catch(e){notify('UAT note not saved: '+(e?.code||e?.message||e));}}else{const d=UAT.local();d.notes.push({...n,id:'l'+Date.now()});UAT.saveLocal(d);}UAT.badge();};
UAT.patchNote=async function(id,patch){if(UAT.live){try{await UAT.remote.notes.doc(id).update(patch);}catch(e){notify('UAT note not saved: '+(e?.code||e?.message||e));}}else{const d=UAT.local();const n=d.notes.find(x=>x.id===id);if(n)Object.assign(n,patch);UAT.saveLocal(d);}};
UAT.delNote=async function(id){if(UAT.live){try{await UAT.remote.notes.doc(id).delete();}catch(e){notify('Not deleted: '+(e?.code||e?.message||e));}}else{const d=UAT.local();d.notes=d.notes.filter(x=>x.id!==id);UAT.saveLocal(d);}UAT.badge();};
UAT.count=()=>{const d=UAT.data();return d.notes.filter(n=>n.status!=='Closed'&&n.status!=='Parked').length+Object.values(d.questions).filter(q=>q.choice||q.note).length;};
UAT.refresh=()=>{const dl=document.getElementById('uat-dlg');if(dl&&dl.open&&!dl.contains(document.activeElement))UAT.open();};
UAT.pageName=()=>{const k=CD.key&&CD.key();return ({today:'Today',reviews:'Reviews',actions:'Actions',calendar:'Calendar',staff:'Staff',person:'Staff record',policies:CD.st.lib?'Policy library':'Policies',meetings:'Meetings',services:'Services',history:'History',setup:CD.st.setupHost?'Locations, backup & restore':'Pharmacy setup',more:'More'})[k]||(state.freshSite?page:'First use / onboarding');};
UAT.expressSays=function(id,k){
 const f=sopFieldsFor(id).find(x=>x[0]===k);if(!f)return '';
 const c=RPH.express.cat(id,f),o=RPH.express.opts(f);
 return c==='assume'?'Setup now shows this on “What most pharmacies do” as: '+(o&&o[0]):c==='verify'?'Setup now puts this on “to check later” (evidence; never filled in)':c==='later'?'Setup now puts this on “to check later”':'Setup now asks this as its own question';
};
/* Which question is on the card: match the card's text against this service's question labels. */
UAT.cardKey=function(ed){
 const id=readDraft('fresh-resume')?.id;if(!id||!state.active.includes(id))return null;
 const text=ed.textContent;let best=null,len=0;
 for(const f of sopFieldsFor(id)){const label=(RPH.qm.metaFor(id,f[0])?.label||f[1]||'');if(label&&text.includes(label)&&label.length>len){best=f[0];len=label.length;}}
 return best?{id,k:best,label:(RPH.qm.metaFor(id,best)?.label||sopFieldsFor(id).find(f=>f[0]===best)?.[1])}:null;
};
UAT.decorateCard=function(){
 const ed=$('editor');if(!ed.open)return;const form=ed.querySelector('.fresh-form.rph-question,.rph-question');if(!form||form.querySelector('.uat-strip')||form.matches('.hy-intro,.hy-sum,.otp-parts'))return;
 const q=UAT.cardKey(ed);if(!q)return;
 const d=UAT.data(),key=q.id+'/'+q.k,cur=d.questions[key]||{};
 const box=document.createElement('div');box.className='uat-strip';
 box.innerHTML='<div class="uat-tag">UAT · for you only · not part of the app</div><div class="uat-says"></div><div class="uat-choices" role="radiogroup" aria-label="Express suggestion"></div><input class="uat-note" type="text" maxlength="300" placeholder="Optional note about this question">';
 box.querySelector('.uat-says').textContent=UAT.expressSays(q.id,q.k);
 const ch=box.querySelector('.uat-choices');
 for(const [v,l] of [['standard','Could be a usual arrangement'],['ask','Must always be asked'],['','No opinion']]){const b=document.createElement('button');b.type='button';b.className='uat-chip';b.textContent=l;b.setAttribute('aria-pressed',String((cur.choice||'')===v));b.onclick=()=>{UAT.setQuestion(key,{service:serviceName(q.id),question:q.label,choice:v});for(const x of ch.children)x.setAttribute('aria-pressed',String(x===b));};ch.append(b);}
 const note=box.querySelector('.uat-note');note.value=cur.note||'';let tm;note.oninput=()=>{clearTimeout(tm);tm=setTimeout(()=>UAT.setQuestion(key,{service:serviceName(q.id),question:q.label,note:note.value}),600);};
 form.append(box);
};
/* A note about the screen you're on, on every window (setup intro, usual arrangements, what happens next, reviews…). */
UAT.decorateScreen=function(){const ed=$('editor');if(!ed.open||ed.querySelector('.uat-screen'))return;
 const host=ed.querySelector('.fresh-form')||ed.querySelector('#pe-content')||ed;
 const title=(ed.querySelector('#dialog-title')?.textContent||'').trim(),sub=(ed.querySelector('.rph-question p[role=status], .sq-label')?.textContent||'').trim();
 const d=document.createElement('details');d.className='uat-screen';
 d.innerHTML='<summary>UAT note about this screen</summary><textarea rows="3" maxlength="600" placeholder="What looks wrong, confusing or missing here?"></textarea><div class="uat-row"><button type="button" class="uat-save">Save note</button><span class="uat-msg" role="status"></span></div>';
 d.querySelector('.uat-save').onclick=async()=>{const ta=d.querySelector('textarea'),t=ta.value.trim();if(!t)return;
  await UAT.addNote({kind:'note',page:'Setup · '+[title,sub].filter(Boolean).join(' · '),text:t,type:''});ta.value='';d.querySelector('.uat-msg').textContent='Saved to UAT notes.';UAT.badge&&UAT.badge();};
 host.append(d);};
new MutationObserver(()=>{UAT.decorateCard();UAT.decorateScreen();}).observe($('editor'),{childList:true,subtree:true});
/* Floating notes button and panel (its own dialog, separate from the app's editor). */
UAT.text=function(){
 const d=UAT.data(),lines=['R.Pharmacy UAT notes · '+new Date().toLocaleString('en-AU'),''];
 const qs=Object.entries(d.questions).filter(([,v])=>v.choice||v.note);
 if(qs.length){lines.push('SETUP QUESTIONS');for(const [k,v] of qs)lines.push('- '+v.service+' · '+v.question+' → '+(v.choice==='standard'?'COULD BE STANDARD':v.choice==='ask'?'MUST ASK':'no opinion')+(v.note?' · note: '+v.note:''));lines.push('');}
 if(d.notes.length){lines.push('GENERAL NOTES');for(const n of d.notes)lines.push('- ['+(n.status||'Open')+'] ['+n.page+'] '+n.text+(n.kind?' ('+n.kind+')':'')+(n.fix?' · fix: '+n.fix:''));}
 if(!qs.length&&!d.notes.length)lines.push('No notes yet.');
 return lines.join('\n');
};
UAT.open=function(){
 let dl=document.getElementById('uat-dlg');if(!dl){dl=document.createElement('dialog');dl.id='uat-dlg';document.body.append(dl);}
 const d=UAT.data(),qs=Object.entries(d.questions).filter(([,v])=>v.choice||v.note);
 dl.innerHTML='<div class="uat-head"><b>UAT notes</b><span class="uat-build" style="font-size:11px;color:#5b6476;margin-left:8px">Build '+(window.RPH_BUILD||'?')+'</span><span class="uat-tag">For you only · not part of the app · '+(UAT.live?'synced to your claude.ai UAT page · Claude can read them':'this browser only')+'</span><button type="button" class="uat-x">Close</button></div>'+
 '<label class="uat-l">Note about <b class="uat-pg"></b><textarea class="uat-new" rows="3" maxlength="800" placeholder="What did you expect, and what happened?"></textarea></label><div class="uat-row"><select class="uat-kind"><option value="">Type</option><option>Looks wrong</option><option>Works wrong</option><option>Wording</option><option>Idea</option></select><button type="button" class="uat-add">Add note</button></div>'+
 '<div class="uat-list"></div><label class="uat-l">Copy all notes (select and copy, then paste to Claude)<textarea class="uat-out" rows="8" readonly></textarea></label><div class="uat-row"><button type="button" class="uat-copy">Copy</button><button type="button" class="uat-clear">Clear all notes</button></div><div class="uat-reset"><b>Start fresh on this device</b><p>Deletes every test pharmacy, record and setting in this browser for this UAT page, then reloads to the first-use screen. Your UAT notes and anything saved to your account are kept.</p><button type="button" class="uat-reset-btn">Reset test data on this device</button></div>';
 dl.querySelector('.uat-pg').textContent=UAT.pageName();
 const list=dl.querySelector('.uat-list');
 list.innerHTML='<div class="uat-sub">'+qs.length+' setup question'+(qs.length===1?'':'s')+' marked · '+d.notes.length+' general note'+(d.notes.length===1?'':'s')+'</div>';
 for(const n of [...d.notes].reverse()){const r=document.createElement('div');r.className='uat-item';const t=document.createElement('div');t.innerHTML='<span class="uat-st"></span> ';t.firstChild.textContent=n.status||'Open';t.firstChild.dataset.s=n.status||'Open';t.append('['+n.page+'] '+n.text+(n.kind?' ('+n.kind+')':''));if(n.fix){const f=document.createElement('div');f.className='uat-fix';f.textContent='Fix: '+n.fix;t.append(f);}r.append(t);const acts=document.createElement('div');acts.className='uat-acts';
  const btn=(l,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=l;b.onclick=fn;acts.append(b);};
  if(n.status==='Fixed – retest'){btn('Retested · close',async()=>{await UAT.patchNote(n.id,{status:'Closed',closedAt:new Date().toISOString()});UAT.open();UAT.badge();});btn('Still wrong',async()=>{await UAT.patchNote(n.id,{status:'Open'});UAT.open();UAT.badge();});}
  else if(n.status==='Parked'){btn('Reopen',async()=>{await UAT.patchNote(n.id,{status:'Open'});UAT.open();UAT.badge();});}
  else if(n.status==='Closed')btn('Reopen',async()=>{await UAT.patchNote(n.id,{status:'Open'});UAT.open();UAT.badge();});
  btn('Delete',async e=>{UAT.twoTap(e.currentTarget,'Tap again to delete',async()=>{await UAT.delNote(n.id);UAT.open();});});r.append(acts);list.append(r);}
 dl.querySelector('.uat-out').value=UAT.text();
 dl.querySelector('.uat-x').onclick=()=>dl.close();
 dl.querySelector('.uat-add').onclick=async()=>{const t=dl.querySelector('.uat-new').value.trim();if(!t)return;await UAT.addNote({kind:'note',page:UAT.pageName(),text:t,type:dl.querySelector('.uat-kind').value});dl.querySelector('.uat-new').value='';UAT.open();};
 dl.querySelector('.uat-copy').onclick=async()=>{const ta=dl.querySelector('.uat-out');ta.select();try{await navigator.clipboard.writeText(ta.value);notify('UAT notes copied.');}catch{try{document.execCommand('copy');notify('UAT notes copied.');}catch{notify('Select the text and copy it.');}}};
 dl.querySelector('.uat-clear').onclick=()=>{if(UAT.live){notify('Delete notes one by one, or ask Claude to clear them.');return;}if(confirm('Clear all UAT notes in this browser? This only affects your test notes, not the app.')){UAT.saveLocal({});UAT.open();UAT.badge();}};
 dl.querySelector('.uat-reset-btn').onclick=e=>UAT.twoTap(e.currentTarget,'Tap again to delete all test data',()=>UAT.reset());
 if(!dl.open)dl.showModal();
};
/* Two taps instead of the browser's confirm box: the artifact viewer blocks confirm() (it returns false silently). */
UAT.twoTap=function(btn,ask,run){if(btn.dataset.armed==='1'){btn.dataset.armed='';run();return;}
 const orig=btn.dataset.orig||btn.textContent;btn.dataset.orig=orig;btn.dataset.armed='1';btn.textContent=ask;btn.classList.add('uat-armed');
 clearTimeout(btn._t);btn._t=setTimeout(()=>{btn.dataset.armed='';btn.textContent=orig;btn.classList.remove('uat-armed');},6000);};
UAT.reset=async function(){
 if(!window.RPHStore){notify('Reset is not available in this copy.');return;}
 let view=null;try{view=localStorage.getItem('rph-uat-view');}catch{}
 const notes=UAT.live?null:(()=>{try{return localStorage.getItem(UAT.key);}catch{return null;}})();
 RPHStore.clear();try{if(view)localStorage.setItem('rph-uat-view',view);if(notes)localStorage.setItem(UAT.key,notes);}catch{}
 try{await RPHStore.flush();}catch{}
 location.reload();
};
UAT.badge=function(){let b=document.getElementById('uat-btn');if(!b){b=document.createElement('button');b.id='uat-btn';b.type='button';b.onclick=()=>UAT.open();document.body.append(b);}b.textContent='UAT notes'+(UAT.count()?' · '+UAT.count():'');};
(function(){const s=document.createElement('style');s.textContent=`
#uat-btn{position:fixed;left:12px;bottom:12px;z-index:31;min-height:40px;border:1px dashed #a35a00;border-radius:20px;background:#fff8ec;color:#5b3a00;padding:0 14px;font:600 13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 4px 16px #0c111c1f;cursor:pointer}
@media (max-width:899px){#uat-btn{bottom:76px}}
html.d-phone-view #uat-btn{left:calc(50% - 183px);bottom:76px}
@media (min-width:700px){html.d-phone-view #uat-btn{left:auto;right:calc(50% + 207px);bottom:12px}}
.uat-strip{margin-top:14px;border:1px dashed #a35a00;border-radius:10px;background:#fff8ec;padding:10px 12px;display:grid;gap:8px}
.uat-tag{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#a35a00}
.uat-says{font-size:13px;color:#5b3a00}
.uat-choices{display:flex;flex-wrap:wrap;gap:6px}
html body #editor .uat-chip,.uat-chip{min-height:36px;border:1px solid #e0c9a6!important;border-radius:999px!important;background:#fff!important;color:#5b3a00!important;font-size:13px;font-weight:600;padding:0 12px;text-align:center!important;width:auto!important;justify-self:auto!important;min-width:0!important}
html body #editor .uat-chip[aria-pressed=true]{background:#5b3a00!important;color:#fff!important;border-color:#5b3a00!important}
html body #editor .uat-note{min-height:38px;border:1px solid #e0c9a6;border-radius:8px;padding:0 10px;font:inherit;font-size:14px;background:#fff}
#uat-dlg{border:1px dashed #a35a00;border-radius:12px;padding:16px 18px;width:min(560px,94vw);max-height:90dvh;overflow:auto;font:14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#0c111c;background:#fffdf8}
#uat-dlg .uat-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}
#uat-dlg .uat-head b{font-size:17px}
#uat-dlg .uat-x{margin-left:auto}
#uat-dlg button{min-height:38px;border:1px solid #e0c9a6;border-radius:9px;background:#fff;padding:0 12px;font-weight:600;cursor:pointer}
#uat-dlg .uat-add,#uat-dlg .uat-copy{background:#5b3a00;color:#fff;border-color:#5b3a00}
#uat-dlg .uat-l{display:grid;gap:6px;margin:10px 0;font-weight:600;font-size:13px}
#uat-dlg textarea,#uat-dlg select{font:inherit;border:1px solid #e0c9a6;border-radius:8px;padding:8px 10px;background:#fff;width:100%;box-sizing:border-box}
#uat-dlg select{width:auto;min-height:38px}
#uat-dlg .uat-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
#uat-dlg .uat-sub{font-size:12px;color:#7a5a20;margin-top:12px}
#uat-dlg .uat-item{display:flex;justify-content:space-between;gap:8px;align-items:center;border-bottom:1px solid #f0e2c8;padding:6px 0;font-size:13px}
#uat-dlg .uat-st{display:inline-block;font-size:11px;font-weight:700;border-radius:4px;padding:1px 6px;background:#f6f7f9;color:#5b6476}
#uat-dlg .uat-st[data-s="Open"]{background:#fdeceb;color:#c0281b}
#uat-dlg .uat-st[data-s="Fixed – retest"]{background:#fff3e0;color:#a35a00}
#uat-dlg .uat-st[data-s="Closed"]{background:#e9f6ee;color:#1c7a3e}
#uat-dlg .uat-st[data-s="Parked"]{background:#eef0f4;color:#5b6476}
#uat-dlg .uat-fix{font-size:12px;color:#1c7a3e;margin-top:2px}
#uat-dlg .uat-item{align-items:flex-start}
#uat-dlg .uat-acts{display:flex;gap:6px;flex-wrap:wrap;flex:0 0 auto}
#uat-dlg .uat-reset{margin-top:16px;border-top:1px solid #f0e2c8;padding-top:12px}
#uat-dlg .uat-reset p{margin:4px 0 8px;font-size:13px;color:#5b3a00}
html body #editor details.uat-screen{margin:14px 0 4px;border:1px dashed #d9a441;border-radius:12px;background:#fff8eb;padding:8px 12px}
html body #editor details.uat-screen summary{cursor:pointer;font-weight:700;font-size:13px;color:#7a4b00}
html body #editor details.uat-screen textarea{width:100%;box-sizing:border-box;margin:8px 0;border:1px solid #e5c98f;border-radius:8px;padding:8px;font:inherit}
html body #editor details.uat-screen .uat-row{display:flex;gap:10px;align-items:center}
html body #editor details.uat-screen .uat-save{min-height:36px;padding:0 12px;border-radius:8px;border:1px solid #7a4b00;background:#fff;color:#7a4b00;font-weight:600;width:auto!important}
html body #editor details.uat-screen .uat-msg{font-size:13px;color:#7a4b00}
#uat-dlg .uat-reset-btn{border-color:#c0281b!important;color:#c0281b}
#uat-dlg .uat-armed{background:#c0281b!important;color:#fff!important;border-color:#c0281b!important}
#uat-dlg .uat-acts button{min-height:32px;font-size:12px;padding:0 8px}
`;document.head.append(s);UAT.badge();UAT.connect();})();
