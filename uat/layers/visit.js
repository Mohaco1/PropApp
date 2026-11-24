/* ===== Start a visit · Last time · staff checks that say what's due now (owner, 24 Nov 2026) =====
 * From the agency roadmap the owner asked Claude to apply. Built on the existing site visit, actions and findings:
 * no new record types, nothing completed or closed for the owner.
 *  1. Today has a "Start a visit" card (or "Resume visit" when a visit draft exists). It opens a short prepare screen:
 *     which pharmacy, quarterly or extra visit (an extra visit keeps the quarterly date), and up to three things worth
 *     looking at while there, each with a reason. "Start the checks" opens the existing site visit.
 *  2. Opening a follow-up or suggestion from the visit returns you to where you were when you close it.
 *  3. A site-visit check shows "Last time" when the previous visit found an issue there that has since been closed.
 *  4. A person's grouped staff checks say "2 due now · 6 upcoming"; "Review the 2 due now" opens them one after another.
 */
RPH.visit={ret:null,cur:{event:false}};
const vEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const vPretty=d=>{try{return RPH.shortDate?RPH.shortDate(d):pretty(d);}catch{return d||'';}};
/* Remember which kind of visit is open, so a return lands in the same one. */
const vOpen=RPH.sv.open;
RPH.sv.open=function(event=false){RPH.visit.cur={event:!!event};return vOpen.apply(this,arguments);};
/* When a visit window closes, Today redraws so "Resume visit" and its progress are current. */
new MutationObserver(()=>{const ed=$('editor');if(ed.open){if(ed.querySelector('#sv-root'))RPH.visit.wasOpen=true;return;}if(!RPH.visit.wasOpen)return;RPH.visit.wasOpen=false;setTimeout(()=>{if(!$('editor').open&&typeof page!=='undefined'&&page==='overview'){const y=window.scrollY;render();window.scrollTo(0,y);}},80);}).observe($('editor'),{attributes:true,attributeFilter:['open'],childList:true});
/* Return after a side trip: when the editor closes and stays closed, run the saved return. */
new MutationObserver(()=>{const ed=$('editor');if(ed.open||!RPH.visit.ret)return;setTimeout(()=>{if($('editor').open||!RPH.visit.ret)return;const r=RPH.visit.ret;RPH.visit.ret=null;try{r();}catch(e){console.warn(e);}},60);}).observe($('editor'),{attributes:true,attributeFilter:['open']});
RPH.visit.backToCheck=(key,event)=>()=>{RPH.sv.open(event);setTimeout(()=>{try{const its=[...document.querySelectorAll('#editor #sv-root .sv-item')];const i=its.findIndex(x=>x.dataset.key===key);if(i>=0){CD.svIdx=i;CD.svSteps();its[i].querySelector('[role=radio]')?.focus();}}catch{}},80);};
/* ---------- visit state ---------- */
RPH.visit.draft=()=>{for(const ev of [false,true]){let d=null;try{d=readDraft(RPH.sv.draftId(ev));}catch{}if(d&&d.items){const n=Object.values(d.items).filter(s=>s&&s.status).length;let total=0;try{total=RPH.sv.items().length;}catch{}return {event:ev,n,total,date:d.date||'',saved:d.savedAt||d.updatedAt||''};}}return null;};
RPH.visit.due=()=>state.schedule?.Q1||'';
RPH.visit.defaultExtra=()=>{const d=RPH.visit.due();if(!d)return false;try{return d>addInterval(today(),30,'days');}catch{return false;}};
/* Up to three things worth seeing in person, with a reason. Earlier-visit follow-ups first, then overdue and soon. */
RPH.visit.suggest=function(){
 const out=[],seen=new Set(),soon=(()=>{try{return addInterval(today(),14,'days');}catch{return '9999';}})();
 for(const f of Object.values(state.findingLedger||{})){const t=f&&f.taskId&&state.taskLedger?.[f.taskId];if(!t||t.status!=='Outstanding'||!String(f.itemKey||'').startsWith('Q1/'))continue;seen.add(t.id);
  const from=f.source?.date?vPretty(f.source.date):'an earlier visit';
  out.push({rank:0,date:t.due||'',title:(CD.actionTitle?CD.actionTitle(t):t.text),why:'Found at the '+from+' visit · see if it’s fixed',open:()=>taskEditor(t.id)});}
 let rows=[];try{rows=CD.todayRows();}catch{}
 let jobs=[];try{jobs=RPH.guide.rank(RPH.guide.jobs(rows));}catch{jobs=rows;}
 const staffNow=[];
 for(const j of jobs){
  if(j.members&&j.what==='staff checks'){const now=j.members.filter(m=>m.date&&m.date<=today());if(now.length)staffNow.push({subject:j.subject,n:now.length,date:[...now].sort((a,b)=>String(a.date).localeCompare(String(b.date)))[0].date});continue;}
  if(j.members){const now=j.members.filter(m=>m.date&&m.date<=today());const first=[...(now.length?now:j.members)].sort((a,b)=>String(a.date||'9999').localeCompare(String(b.date||'9999')))[0];
   if(!now.length&&!(first?.date&&first.date<=soon))continue;
   out.push({rank:now.length?1:2,date:first?.date||'',title:j.what==='staff checks'?'Ask to see '+j.subject+'’s records':j.subject,why:now.length?now.length+' due now'+(j.what==='staff checks'?' · certificates you can sight on site':''):'First due '+vPretty(first.date),open:()=>first?.open?.()});continue;}
  if(j.k==='verify'){out.push({rank:3,date:'',title:j.item,why:state.inherited?'From the previous owner · to check':'Marked “check later” in setup',open:j.open});continue;}
  if(j.k!=='task'&&j.k!=='overdue')continue;
  if(j.type!=='Action')continue;
  const tid=String(j.id).split('/').pop();if(seen.has(tid))continue;
  if(!j.date||j.date>soon)continue;
  out.push({rank:j.date<today()?1:2,date:j.date,title:j.item,why:j.date<today()?'Overdue since '+vPretty(j.date):j.date===today()?'Due today':'Due '+vPretty(j.date),open:j.open});}
 if(staffNow.length){const n=staffNow.reduce((a,x)=>a+x.n,0);staffNow.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  out.push({rank:1,date:staffNow[0].date,title:staffNow.length===1?'Ask to see '+staffNow[0].subject+'’s records':'Staff records to sight',why:(staffNow.length===1?'':staffNow.map(x=>x.subject).join(', ')+' · ')+n+' check'+(n===1?'':'s')+' due now',open:()=>RPH.visit.work(staffNow[0].subject)});}
 // Setup items marked "check later" are listed last: some can only be confirmed away from the pharmacy.
 return out.sort((a,b)=>a.rank-b.rank||String(a.date||'9999').localeCompare(String(b.date||'9999')));
};
/* ---------- Today card ---------- */
RPH.visit.card=function(){
 const d=RPH.visit.draft(),name=vEsc(state.pharmacyName||'this pharmacy');
 if(d)return `<div class="vcard vcard-resume"><div class="vtx"><div class="vlbl">Visit in progress · ${name}</div><b>${d.event?'Extra visit':'Quarterly visit'} · ${d.n} of ${d.total} checked</b><span class="sub">${d.date?'Visit date '+vEsc(vPretty(d.date))+' · ':''}your answers are saved on this device</span></div>${CD.btn('Resume visit',()=>RPH.sv.open(d.event),true)}</div>`;
 const n=RPH.visit.suggest().length;
 return `<div class="vcard"><div class="vtx"><div class="vlbl">At ${name} today?</div><b>Start a visit</b><span class="sub">${n?`${n} thing${n===1?'':'s'} worth seeing while you’re there, then the site visit checks.`:'Run the site visit checks on your phone as you walk around.'}</span></div>${CD.btn('Start a visit',()=>RPH.visit.prep(),true)}</div>`;
};
const vStart=RPH.guide.startCard;
RPH.guide.startCard=function(items){let c='';try{c=RPH.visit.card();}catch(e){console.warn(e);}return c+vStart.apply(this,arguments);};
/* ---------- Prepare screen ---------- */
RPH.visit.prep=function(extra){
 if(extra===undefined)extra=RPH.visit.defaultExtra();
 const all=RPH.visit.suggest(),top=all.slice(0,3),due=RPH.visit.due(),showAll=RPH.visit.showAll;
 const list=showAll?all:top;
 openDialog(`<h2 id="dialog-title">Start a visit</h2>
 <p class="vp-where"><b>${vEsc(state.pharmacyName||'This pharmacy')}</b> · ${vEsc(vPretty(today()))}</p>
 <div class="rph-seg vp-kind" role="radiogroup" aria-label="Which visit"><button type="button" role="radio" data-kind="q" aria-checked="${!extra}">Quarterly visit</button><button type="button" role="radio" data-kind="x" aria-checked="${!!extra}">Extra visit</button></div>
 <p class="sub vp-kindnote">${extra?'An extra visit is saved on its own. Your quarterly visit stays due '+(due?vEsc(vPretty(due)):'when it’s set')+'.':'This counts as your quarterly site visit'+(due?' (due '+vEsc(vPretty(due))+')':'')+'. The next one is set when you finish.'}</p>
 <h3 class="vp-h">Worth seeing while you’re there</h3>
 ${list.length?`<ul class="vp-list">${list.map((s,i)=>`<li><button type="button" class="vp-item" data-i="${all.indexOf(s)}"><span class="vtx"><b>${vEsc(s.title)}</b><small>${vEsc(s.why)}</small></span><span class="cd-chev" aria-hidden="true">›</span></button></li>`).join('')}</ul>`:'<p class="sub">Nothing open needs looking at. Just run the checks.</p>'}
 ${all.length>3?`<button type="button" class="rph-link vp-all">${showAll?'Show the top 3':'View all '+all.length}</button>`:''}
 <p class="sub vp-hint">Opening one takes you to it; closing it brings you back here. These are suggestions. The site visit checks are the same as always.</p>
 <div class="vp-acts"><button type="button" class="primary vp-go">Start the checks</button></div>`);
 const ed=$('editor');ed.classList.add('vprep');
 ed.querySelectorAll('.vp-kind [data-kind]').forEach(b=>b.onclick=()=>RPH.visit.prep(b.dataset.kind==='x'));
 ed.querySelector('.vp-all')?.addEventListener('click',()=>{RPH.visit.showAll=!showAll;RPH.visit.prep(extra);});
 ed.querySelectorAll('.vp-item').forEach(b=>b.onclick=()=>{const s=all[+b.dataset.i];RPH.visit.ret=()=>RPH.visit.prep(extra);ed.close();setTimeout(()=>{try{s.open();}catch(e){RPH.visit.ret=null;notify(e.message);}},0);});
 ed.querySelector('.vp-go').onclick=()=>{RPH.visit.showAll=false;ed.classList.remove('vprep');ed.close();setTimeout(()=>RPH.sv.open(!!extra),0);};
 new MutationObserver((m,o)=>{if(!ed.open){ed.classList.remove('vprep');o.disconnect();}}).observe(ed,{attributes:true,attributeFilter:['open']});
};
/* ---------- Inside the visit: return to the same check; "Last time" ---------- */
RPH.visit.lastFor=function(key){
 const rs=(state.reviews||[]).filter(r=>r.audit==='Q1'&&Array.isArray(r.answers)&&r.answers.some(a=>a.itemKey===key)).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
 const r=rs[0];if(!r)return null;const a=r.answers.find(x=>x.itemKey===key);if(!a||!['Issue','Needs verification'].includes(a.answer))return null;
 const f=a.findingId&&state.findingLedger?.[a.findingId];const t=f?.taskId&&state.taskLedger?.[f.taskId];
 if(t&&t.status==='Outstanding')return null; // shown as "Still open" instead
 return {date:r.date,answer:a.answer,note:a.note||f?.text||'',closed:t&&t.status==='Completed'?(t.completedAt||'').slice(0,10):'',hasTask:!!t};
};
RPH.visit.decorate=function(){const root=$('editor')?.querySelector('#sv-root');if(!root)return;
 for(const it of root.querySelectorAll('.sv-item')){const key=it.dataset.key;if(!key)continue;
  // Follow-ups opened from the visit come back to this check.
  for(const b of it.querySelectorAll('.cx-open-row button')){if(b.dataset.vret)continue;b.dataset.vret='1';const orig=b.onclick;b.onclick=e=>{RPH.visit.ret=RPH.visit.backToCheck(key,RPH.visit.cur.event);orig&&orig.call(b,e);};}
  if(it.querySelector('.vlast'))continue;const l=RPH.visit.lastFor(key);if(!l)continue;
  const box=D.el('div',{class:'vlast'});box.append(D.el('b',{text:'Last time · '+vPretty(l.date)}));
  box.append(D.el('span',{text:(l.answer==='Issue'?'Issue':'Needed verification')+(l.note?' — '+l.note:'')+'.'+(l.closed?' Follow-up closed '+vPretty(l.closed)+'.':l.hasTask?'':'')}));
  box.append(D.el('small',{text:'What did you see this time? Your answer starts blank.'}));
  (it.querySelector('.cx-open')||it.querySelector('.sv-item-top')||it.firstChild)?.after(box);}
};
new MutationObserver(()=>RPH.visit.decorate()).observe($('editor'),{childList:true,subtree:true});
/* ---------- Staff checks: say what's due now, and work through them ---------- */
const vGroup=RPH.guide.group;
RPH.guide.group=function(list){const out=vGroup.apply(this,arguments);
 for(const g of out){if(!g.members||g.what!=='staff checks')continue;
  const now=g.members.filter(m=>m.date&&m.date<=today()),later=g.members.length-now.length;g.now=now;
  g.item=g.subject+'’s checks';
  if(!CD.st.openGroup[g.subject])g.type=(now.length?now.length+' due now':'')+(now.length&&later?' · ':'')+(later?later+' upcoming':'');
  g.act=now.length?'Review '+(now.length===1?'the 1':'the '+now.length)+' due now':g.act;}
 return out;};
RPH.visit.queue=null;
RPH.visit.work=function(subject){let g=null;try{g=RPH.guide.group(CD.todayRows()).find(x=>x.subject===subject&&x.members);}catch{}if(!g)return;
 const ids=[...(g.now&&g.now.length?g.now:g.members)].sort((a,b)=>String(a.date||'9999').localeCompare(String(b.date||'9999'))).map(m=>m.id);
 RPH.visit.queue={subject,ids,done:0,total:ids.length};RPH.visit.next();};
RPH.visit.next=function(){const q=RPH.visit.queue;if(!q)return;
 let rows=[];try{rows=CD.todayRows();}catch{}
 while(q.ids.length){const id=q.ids.shift();const m=rows.find(r=>r.id===id);if(!m)continue;
  RPH.visit.ret=()=>{if(RPH.visit.queue){const still=CD.todayRows().some(r=>r.id===id);if(!still)RPH.visit.queue.done++;render();}};
  try{m.open();}catch(e){RPH.visit.ret=null;notify(e.message);}return;}
 RPH.visit.queue=null;render();};
RPH.visit.stop=()=>{RPH.visit.queue=null;render();};
RPH.visit.banner=function(){const q=RPH.visit.queue;if(!q)return '';
 let rows=[];try{rows=CD.todayRows();}catch{}const nextRow=q.ids.map(id=>rows.find(r=>r.id===id)).find(Boolean);
 if(!nextRow){RPH.visit.queue=null;return `<div class="vqueue vqueue-done"><b>${vEsc(q.subject)}’s checks · finished this round</b><span class="sub">${q.done} of ${q.total} recorded. Anything you skipped is still in the list.</span></div>`;}
 const label=nextRow.item.lastIndexOf(' · ')>0?nextRow.item.slice(0,nextRow.item.lastIndexOf(' · ')):nextRow.item;
 return `<div class="vqueue"><div class="vtx"><b>${vEsc(q.subject)}’s checks · ${q.done} of ${q.total} done</b><span class="sub">Next: ${vEsc(label)}</span></div>${CD.btn('Next',()=>RPH.visit.next(),true)}${CD.btn('Stop',()=>RPH.visit.stop())}</div>`;};
const vToday=CD.V.today;
CD.V.today=function(){const h=vToday.apply(this,arguments);let b='';try{b=RPH.visit.banner();}catch{}return b?h.replace('<h1>Today</h1>','<h1>Today</h1>'+b):h;};
/* Group detail: lead with the decision. */
const vDetail=CD.todayDetail;
CD.todayDetail=function(s){
 if(!s.id?.startsWith('group/')||s.what!=='staff checks')return vDetail(s);
 const now=s.now||[],open=!!CD.st.openGroup[s.subject],row=m=>`<li>${vEsc(m.item.slice(0,m.item.lastIndexOf(' · ')))} <span class="sub">· ${vEsc(m.due)}</span></li>`;
 const later=s.members.filter(m=>!now.includes(m));
 return `<div class="lbl">Staff checks · ${vEsc(state.pharmacyName||'')}</div><h2>${vEsc(s.subject)}’s checks</h2>
 ${now.length?`<div class="blk"><div class="lbl" style="margin-bottom:4px">Due now · ${now.length}</div><ul class="grp">${now.map(row).join('')}</ul></div>`:''}
 ${later.length?`<div class="blk"><div class="lbl" style="margin-bottom:4px">Upcoming · ${later.length}</div><ul class="grp">${later.map(row).join('')}</ul></div>`:''}
 <div class="blk acts">${CD.btn(now.length?'Review the '+now.length+' due now':'Review the first one',()=>RPH.visit.work(s.subject),true)}${CD.btn(open?'Hide them':'Show all '+s.members.length,s.open)}</div>
 <p class="sub" style="margin:0">Each check opens on its own and keeps its own evidence. When you close one, the next is ready.</p>`;
};
/* ---------- PIC prep list (Codex review, 24 Nov): optional, the owner decides whether to send it ---------- */
RPH.visit.prepText=function(date){
 const name=state.pharmacyName||'the pharmacy',s=RPH.visit.suggest().filter(x=>x.rank<3);
 const when=date===today()?'today':(()=>{try{return new Date(date+'T00:00').toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'short'});}catch{return date;}})();
 const lines=s.map(x=>/^Ask to see (.+)’s records$/.test(x.title)?'Current certificates and records for '+x.title.match(/^Ask to see (.+)’s records$/)[1]:x.title==='Staff records to sight'?'Current certificates and records for '+(x.why.split(' · ')[0]||'staff'):/see if it’s fixed/.test(x.why)?'Show me the fix for: '+x.title:x.title);
 return 'Hi, I’m visiting '+name+' '+when+'. Could you please have these ready?\n'+(lines.length?lines.map(l=>'• '+l).join('\n'):'• Nothing special. I’ll run the usual site visit checks.')+'\nThanks.';
};
RPH.visit.copyPrep=function(){
 const ed=$('editor');let box=ed.querySelector('.vp-copy');
 if(!box){box=D.el('div',{class:'vp-copy'});const lab=D.el('label',{class:'vp-copydate'},'Visit date ');const di=D.el('input',{type:'date',value:today()});lab.append(di);
  const ta=D.el('textarea',{rows:'6','aria-label':'Message for the pharmacist on duty'});ta.value=RPH.visit.prepText(today());di.onchange=()=>{ta.value=RPH.visit.prepText(di.value||today());};
  const btn=D.el('button',{type:'button',class:'primary',text:'Copy message'});const st=D.el('span',{class:'sub vp-copied',role:'status'});
  btn.onclick=async()=>{try{await navigator.clipboard.writeText(ta.value);st.textContent='Copied. Paste it into a text or email if you want to send it.';}catch{ta.focus();ta.select();st.textContent='Select all and copy, then paste it where you like.';}};
  box.append(D.el('b',{text:'For the pharmacist on duty (optional)'}),lab,ta,D.el('div',{class:'vp-copyacts'},btn,st),D.el('p',{class:'sub',text:'Nothing is sent from the app. Edit it as you like.'}));
  ed.querySelector('.vp-acts')?.before(box);}
 box.querySelector('textarea').focus();};
new MutationObserver(()=>{const ed=$('editor');if(!ed.classList.contains('vprep')||ed.querySelector('.vp-prepbtn'))return;const a=ed.querySelector('.vp-acts');if(!a)return;
 const b=D.el('button',{type:'button',class:'vp-prepbtn',text:'Copy a list for the pharmacist on duty'});b.onclick=()=>RPH.visit.copyPrep();a.prepend(b);}).observe($('editor'),{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
/* ---------- Recovery (Codex review): when was the last backup file made, and what did a restore bring back ---------- */
RPH.rec={};
RPH.rec.key=()=>{let id='here';try{id=siteDirectory().active||id;}catch{}return 'rph-last-backup:'+id;};
RPH.rec.get=()=>{try{return JSON.parse(localStorage.getItem(RPH.rec.key())||'null');}catch{return null;}};
RPH.rec.set=(at)=>{try{localStorage.setItem(RPH.rec.key(),JSON.stringify({at,n:(state.history||[]).length}));}catch{}};
RPH.rec.status=function(){const b=RPH.rec.get();if(!b)return ['soon','No backup file yet'];
 const days=Math.floor((Date.now()-Date.parse(b.at))/864e5),ch=Math.max(0,(state.history||[]).length-b.n),d=vPretty(String(b.at).slice(0,10));
 return [days>14&&ch?'soon':'staff','Last backup '+d+(ch?' · '+ch+' change'+(ch===1?'':'s')+' since':' · up to date')];};
const bkDown=RPH.downloadBackup;
RPH.downloadBackup=function(){const before=document.querySelectorAll('.notify,.toast').length;const r=bkDown.apply(this,arguments);try{validateBackup(portableBackup());RPH.rec.set(new Date().toISOString());}catch{}return r;};
const bkRestore=restoreBackup;
restoreBackup=function(input,expected){const r=bkRestore.apply(this,arguments);
 try{const b=typeof input==='string'?JSON.parse(input):input;const d=b.data||{};const tasks=Object.values(d.taskLedger||{});const drafts=Object.keys(b.drafts||{});
  const hist=(d.history||[]).map(h=>h.at).filter(Boolean).sort();
  localStorage.setItem('rph-restore-receipt',JSON.stringify({made:b.exportedAt||'',name:d.pharmacyName||'',reviews:(d.reviews||[]).length,open:tasks.filter(t=>t.status==='Outstanding').length,visit:drafts.some(k=>k==='Q1'||k==='event-audit/Q1'),drafts:drafts.length,last:hist.at(-1)||''}));}catch{}
 return r;};
RPH.rec.receipt=function(){let x=null;try{x=JSON.parse(localStorage.getItem('rph-restore-receipt')||'null');}catch{}if(!x)return;try{localStorage.removeItem('rph-restore-receipt');}catch{}
 RPH.rec.set(x.made||new Date().toISOString());
 const li=t=>'<li>'+vEsc(t)+'</li>';
 openDialog(`<h2 id="dialog-title">Restored ${vEsc(x.name||'your pharmacy')}</h2><p>From a backup file made <b>${vEsc(x.made?vPretty(x.made.slice(0,10))+' at '+new Date(x.made).toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'}):'on an unknown date')}</b>.</p>
 <ul class="bk-list">${li(x.reviews+' completed review'+(x.reviews===1?'':'s'))}${li(x.open+' open action'+(x.open===1?'':'s'))}${li(x.visit?'An unfinished visit · Resume it from Today':'No unfinished visit')}${li(x.drafts+' saved draft'+(x.drafts===1?'':'s')+' in all')}${x.last?li('History up to '+vPretty(x.last.slice(0,10))):''}</ul>
 <p class="sub">Anything recorded after the file was made isn’t in it. If you did work after that, record it again.</p><div class="vp-acts"><button type="button" class="primary" id="bk-ok">Got it</button></div>`);
 $('bk-ok').onclick=()=>$('editor').close();};
setTimeout(()=>{try{RPH.rec.receipt();}catch(e){console.warn(e);}},900);
/* Today: a quiet reminder only when the last backup is old and things have changed since. */
RPH.rec.todayLine=function(){const s=RPH.rec.status();if(s[0]!=='soon')return '';if(!(state.reviews||[]).length&&!Object.keys(state.taskLedger||{}).length)return '';
 return `<div class="bkline"><span>${vEsc(s[1])}. Keep a copy off this phone in case it’s lost.</span>${CD.btn('Download backup',()=>{RPH.downloadBackup();render();})}</div>`;};
const bkStart=RPH.guide.startCard;
RPH.guide.startCard=function(items){let l='';try{l=RPH.rec.todayLine();}catch{}return l+bkStart.apply(this,arguments);};
