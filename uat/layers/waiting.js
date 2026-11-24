/* ===== Waiting on someone · an action's full history (owner, 24 Nov 2026) =====
 * 1. On any open action (including a staff check), the owner can note what they asked for and a check-back date:
 *    "Asked 24 Nov · check back Fri 28 Nov". The action's due date and any expiry never move. It stays open and
 *    unverified. On the check-back date Today shows "Check back today", and the visit suggestions list it.
 * 2. "Full history" on an action shows, in order: the original finding and the review it came from, every update,
 *    the asks and check-backs, closure and reopening. It can be copied or saved as text on its own.
 * Stored on the action itself (t.waiting) plus an entry in its activity list, so backups keep it.
 */
RPH.wait={};
const wEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wPretty=d=>{try{return RPH.shortDate?RPH.shortDate(d):pretty(d);}catch{return d||'';}};
const wDay=d=>{try{return new Date(d+'T00:00').toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'});}catch{return d;}};
RPH.wait.of=id=>{const t=state.taskLedger?.[id];return t&&t.status==='Outstanding'&&t.waiting&&t.waiting.checkBack?t.waiting:null;};
RPH.wait.friday=()=>{const d=new Date(today()+'T00:00');const add=(5-d.getDay()+7)%7||7;return addInterval(today(),add,'days');};
RPH.wait.save=function(id,what,checkBack){
 const actor=(()=>{try{return RPH.actor().name;}catch{return '';}})();
 return fsChange('Waiting on · '+String(what).slice(0,50),n=>{const t=n.taskLedger[id];if(!t)throw new Error('This action is no longer here.');
  t.waiting={what:String(what).trim(),asked:today(),checkBack};
  (t.activity??=[]).push({at:new Date().toISOString(),by:actor,message:'Asked for: '+String(what).trim()+' · check back '+wPretty(checkBack)});});};
RPH.wait.clear=function(id,why){
 const actor=(()=>{try{return RPH.actor().name;}catch{return '';}})();
 return fsChange('No longer waiting',n=>{const t=n.taskLedger[id];if(!t||!t.waiting)return;const w=t.waiting;delete t.waiting;
  (t.activity??=[]).push({at:new Date().toISOString(),by:actor,message:(why||'Stopped waiting')+(w.what?': '+w.what:'')});});};
/* ---------- inside the action window ---------- */
RPH.wait.decorate=function(id){
 const ed=$('editor');if(!ed.open||!ed.querySelector('#task-form')||ed.querySelector('.wt-box'))return;
 const t=state.taskLedger?.[id];if(!t)return;
 const box=D.el('section',{class:'wt-box'});
 const draw=()=>{box.replaceChildren();const w=t.status==='Outstanding'?(state.taskLedger[id]?.waiting||null):null;
  if(t.status!=='Outstanding'){box.hidden=true;return;}
  if(w){
   const late=w.checkBack<=today();
   box.append(D.el('b',{text:late?'Check back '+(w.checkBack===today()?'today':'· was due '+wPretty(w.checkBack)):'Waiting on someone'}),
    D.el('p',{text:'Asked '+wPretty(w.asked)+' for: '+w.what+'. Check back '+wDay(w.checkBack)+'.'}),
    D.el('p',{class:'sub',text:'This stays open and unverified until you record what you saw. Its due date hasn’t moved'+(t.due?' ('+wPretty(t.due)+')':'')+'.'}));
   const acts=D.el('div',{class:'wt-acts'});
   const got=D.el('button',{type:'button',class:'primary',text:'It’s arrived · record it'});got.onclick=()=>{RPH.wait.clear(id,'Received');setTimeout(()=>{taskEditor(id);setTimeout(()=>$('editor').querySelector('#task-form textarea, #task-form input:not([type=hidden])')?.focus(),60);},0);};
   const later=D.el('button',{type:'button',text:'Still waiting · new date'});later.onclick=()=>ask(true);
   const stop=D.el('button',{type:'button',class:'rph-link',text:'Not waiting any more'});stop.onclick=()=>{RPH.wait.clear(id);setTimeout(()=>taskEditor(id),0);};
   acts.append(got,later,stop);box.append(acts);
  }else{
   const open=D.el('button',{type:'button',class:'wt-open',text:'Waiting on someone? Note what you asked for'});open.onclick=()=>ask(false);box.append(open);}
 };
 const ask=again=>{box.replaceChildren();
  const w=state.taskLedger[id]?.waiting;
  const what=D.el('input',{type:'text',id:'wt-what',value:w?.what||(/certificate|CPR|first aid|registration|WWCC|declaration/i.test(t.text)?'Updated certificate':''),placeholder:'e.g. updated CPR certificate'});
  const date=D.el('input',{type:'date',id:'wt-date',value:RPH.wait.friday()});
  const quick=D.el('div',{class:'wt-quick'});
  for(const [l,d] of [['Friday',RPH.wait.friday()],['In a week',addInterval(today(),7,'days')],['In 2 weeks',addInterval(today(),14,'days')]]){const b=D.el('button',{type:'button',text:l});b.onclick=()=>{date.value=d;};quick.append(b);}
  const save=D.el('button',{type:'button',class:'primary',text:'Save'});const msg=D.el('p',{class:'sub',role:'status'});
  save.onclick=()=>{if(!what.value.trim()){msg.textContent='Say what you asked for.';what.focus();return;}if(!date.value||date.value<today()){msg.textContent='Choose a check-back date from today on.';date.focus();return;}
   if(RPH.wait.save(id,what.value,date.value)!==false)setTimeout(()=>taskEditor(id),0);};
  const cancel=D.el('button',{type:'button',class:'rph-link',text:'Cancel'});cancel.onclick=draw;
  box.append(D.el('b',{text:again?'Still waiting':'Waiting on someone'}),
   D.el('label',{for:'wt-what'},'What did you ask for?'),what,D.el('label',{for:'wt-date'},'Check back on'),quick,date,
   D.el('p',{class:'sub',text:'The due date stays '+(t.due?wPretty(t.due):'as it is')+'. This is only your reminder to follow up.'}),D.el('div',{class:'wt-acts'},save,cancel),msg);
  what.focus();};
 draw();
 const links=ed.querySelector('#task-links');(ed.querySelector('#task-form')).before(box);
 const hist=D.el('button',{type:'button',class:'wt-histbtn',text:'Full history'});hist.onclick=()=>{RPH.visit&&(RPH.visit.ret=()=>taskEditor(id));ed.close();setTimeout(()=>RPH.wait.history(id),0);};
 (links||box).append(hist);
};
const wTask=taskEditor;
taskEditor=function(id=''){const r=wTask.apply(this,arguments);if(id)setTimeout(()=>{try{RPH.wait.decorate(id);}catch(e){console.warn(e);}},0);return r;};
/* ---------- Today: show the ask on the row; bring it back on the check-back date ---------- */
const wRows=CD.todayRows;
CD.todayRows=function(){const rows=wRows.apply(this,arguments);
 for(const r of rows){if(r.type!=='Action'&&r.type!=='Staff')continue;const id=String(r.id).split('/').pop();const w=RPH.wait.of(id);if(!w)continue;
  r.waiting=w;r.type=(w.checkBack<=today()?'Check back today':'Waiting · check back '+wDay(w.checkBack))+' · asked '+wPretty(w.asked);
  if(w.checkBack<=today()){r.act='Check back';if(r.k!=='overdue'){r.k='task';}}}
 return rows;};
/* Visit suggestions: things you asked for that are due back by the visit come first after earlier findings. */
if(RPH.visit){const wSug=RPH.visit.suggest;RPH.visit.suggest=function(){const out=wSug.apply(this,arguments);
 for(const s of out)s.rank=s.rank;
 for(const t of Object.values(state.taskLedger||{})){const w=RPH.wait.of(t.id);if(!w||w.checkBack>today())continue;
  const i=out.findIndex(x=>x.title===(CD.actionTitle?CD.actionTitle(t):t.text)||x.title===t.text);if(i>=0)out.splice(i,1);
  out.push({rank:0.5,date:w.checkBack,title:w.what+' · '+(CD.actionTitle?CD.actionTitle(t):t.text),why:'You asked on '+wPretty(w.asked)+' · check back '+(w.checkBack===today()?'today':wPretty(w.checkBack)),open:()=>taskEditor(t.id)});}
 return out.sort((a,b)=>a.rank-b.rank||String(a.date||'9999').localeCompare(String(b.date||'9999')));};}
/* More filters: "Waiting on someone". */
if(CD.todayFilt){const wFilt=CD.todayFilt;CD.todayFilt=function(opts){let n=0;try{n=CD.todayRows().filter(r=>r.waiting).length;}catch{}return wFilt.call(this,n?[...opts,['waiting','Waiting on someone',n]]:opts);};}
/* A person's folded staff group says how many are waiting or due a check-back. */
const wGroup=RPH.guide.group;
RPH.guide.group=function(list){const out=wGroup.apply(this,arguments);
 for(const g of out){if(!g.members||CD.st.openGroup[g.subject])continue;const w=g.members.filter(m=>m.waiting),back=w.filter(m=>m.waiting.checkBack<=today());
  if(w.length)g.type=(g.type?g.type+' · ':'')+(back.length?back.length+' to check back':w.length+' waiting');}
 return out;};
/* ---------- Full history ---------- */
RPH.wait.events=function(id){
 const t=state.taskLedger?.[id];if(!t)return [];const ev=[];
 const f=Object.values(state.findingLedger||{}).find(x=>x&&x.taskId===id);
 if(f){const r=(state.reviews||[]).find(x=>x.id===f.source?.reviewId);
  ev.push({at:(r?.at||t.createdAt||''),day:f.source?.date||r?.date||'',kind:'Found',text:(f.kind||'Finding')+' at the '+(f.source?.label||'review')+(f.itemLabel?' · '+f.itemLabel:'')+': '+(f.text||'')});}
 else if(t.sources?.[0])ev.push({at:t.createdAt||'',day:(t.createdAt||'').slice(0,10),kind:'Raised',text:'From '+(t.sources[0].type||'')+(t.sources[0].issue?': '+t.sources[0].issue:'')});
 for(const a of t.activity||[]){if(f&&/^Created from /.test(a.message))continue;if(/^Created (action|task)\b/i.test(a.message)){ev.push({at:a.at,day:String(a.at||'').slice(0,10),kind:'Action raised',text:(f?'Follow-up action created':'Action created')+(a.by?' · '+a.by:'')});continue;}ev.push({at:a.at,day:String(a.at||'').slice(0,10),kind:/^Asked for/.test(a.message)?'Asked':/^Received/.test(a.message)?'Received':/reopen/i.test(a.message)?'Reopened':/^(Completed|Closed)\b/.test(a.message)?'Closed':'Update',text:a.message+(a.by?' · '+a.by:'')});}
 if(t.status==='Completed'&&t.completedAt&&!ev.some(e=>e.kind==='Closed'))ev.push({at:t.completedAt,day:t.completedAt.slice(0,10),kind:'Closed',text:'Closed'+(t.outcome?' · '+t.outcome:'')});
 ev.sort((a,b)=>String(a.at).localeCompare(String(b.at)));
 return ev;};
RPH.wait.text=function(id){const t=state.taskLedger[id];const title=CD.actionTitle?CD.actionTitle(t):t.text;
 return [state.pharmacyName||'',title,'Status: '+(t.status==='Outstanding'?'Open':'Closed')+(t.due?' · due '+wPretty(t.due):''),''].concat(RPH.wait.events(id).map(e=>wPretty(e.day)+' · '+e.kind+' · '+e.text)).join('\n');};
RPH.wait.history=function(id){const t=state.taskLedger?.[id];if(!t)return;const ev=RPH.wait.events(id),title=CD.actionTitle?CD.actionTitle(t):t.text,w=RPH.wait.of(id);
 openDialog(`<h2 id="dialog-title">${wEsc(title)}</h2><p class="sub">${wEsc(state.pharmacyName||'')} · ${t.status==='Outstanding'?'<b class="wt-open-s">Still open</b>':'<b>Closed</b>'}${t.due?' · due '+wEsc(wPretty(t.due)):''}${w?' · waiting on: '+wEsc(w.what):''}</p>
 <ol class="wt-tl">${ev.map(e=>`<li class="wt-${e.kind.toLowerCase()}"><span class="wt-day">${wEsc(wPretty(e.day))}</span><b>${wEsc(e.kind)}</b><span>${wEsc(e.text)}</span></li>`).join('')}</ol>
 <div class="wt-acts"><button type="button" class="primary" id="wt-copy">Copy this history</button><button type="button" id="wt-save">Save as text</button><span class="sub" id="wt-st" role="status"></span></div>`);
 $('wt-copy').onclick=async()=>{try{await navigator.clipboard.writeText(RPH.wait.text(id));$('wt-st').textContent='Copied.';}catch{$('wt-st').textContent='Copy didn’t work here. Use Save as text.';}};
 $('wt-save').onclick=()=>download('action-history-'+today()+'.txt',RPH.wait.text(id),'text/plain');};
