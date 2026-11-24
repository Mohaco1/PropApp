/* ===== Design review fixes 1–8 (owner approved the mock-up, 24 Nov 2026) =====
 * 1+3 Calm Today: one card on top (visit in progress → setup unfinished → backup old → "set up" message → how the app
 *     works in the first week → Start a visit). Counts live on the four filter buttons; the status line is the date and
 *     one sentence; the header no longer repeats the overdue count. "Start with these 3" is gone; the list starts at once.
 * 2   One way into a site visit: starting the quarterly site visit always opens the Start a visit screen first
 *     (a visit already in progress resumes directly).
 * 4   One set of words: Action (not "Task details" / "Action details"), "Action raised", "Check later · from previous owner".
 * 5   Lighter action screen on a phone: title as text, then "Seen the fix · close it", Waiting on someone, Full history;
 *     the form sits under "Edit details". Closing still goes through the form and asks what you saw.
 * 6   Short "Saved…" confirmations appear at the bottom and leave after 3 seconds; warnings stay where they were.
 * 7   Bottom bar: Today, Reviews, Actions, Staff, More (Calendar moves into More).
 * 8   Polish: short dates (year only when not this year), no "Item / Due" header on the phone list, the site visit's
 *     "Before you start" leads with what's open from earlier visits.
 */
RPH.calm={};
const clEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* ---------- 8. short dates ---------- */
RPH.shortDate=function(d){if(!d)return '';const s=String(d).slice(0,10);try{const dt=new Date(s+'T00:00'),now=new Date(today()+'T00:00');const diff=Math.round((dt-now)/864e5);
 const o=dt.getFullYear()===now.getFullYear()?{day:'numeric',month:'short'}:{day:'numeric',month:'short',year:'numeric'};
 if(diff===0)return 'today';if(diff===1)return 'tomorrow';if(diff>1&&diff<7)return dt.toLocaleDateString('en-AU',{weekday:'short'})+' '+dt.toLocaleDateString('en-AU',o);
 return dt.toLocaleDateString('en-AU',o);}catch{return s;}};
/* ---------- 1+3. one card on top ---------- */
RPH.calm.firstSeenKey='rph-first-seen';
try{if(!localStorage.getItem(RPH.calm.firstSeenKey))localStorage.setItem(RPH.calm.firstSeenKey,today());}catch{}
RPH.calm.firstWeek=()=>{try{const f=localStorage.getItem(RPH.calm.firstSeenKey);return !f||f>=addInterval(today(),-7,'days');}catch{return true;}};
RPH.calm.slot=function(){
 try{if(RPH.visit&&RPH.visit.draft())return RPH.visit.card();}catch(e){console.warn(e);}
 try{if(RPH.ob&&RPH.ob.steps().some(s=>!s.done))return RPH.ob.card();}catch(e){console.warn(e);}
 try{const l=RPH.rec&&RPH.rec.todayLine();if(l)return l;}catch(e){console.warn(e);}
 try{const r=RPH.ob&&RPH.ob.card();if(r)return r;}catch(e){console.warn(e);}
 try{if(RPH.calm.firstWeek()&&RPH.calm.howCard){const h=RPH.calm.howCard();if(h)return h;}}catch(e){console.warn(e);}
 try{if(RPH.visit)return RPH.visit.card();}catch(e){console.warn(e);}
 return '';};
RPH.calm.howCard=RPH.guide.howCard;RPH.guide.howCard=()=>'';
RPH.guide.startCard=function(){return RPH.calm.slot();};
/* Status line: the date and one sentence. */
RPH.calm.sentence=function(){let items=[];try{items=CD.todayRows();}catch{}
 let jobs=[];try{jobs=RPH.guide.rank(RPH.guide.jobs(items));}catch{jobs=items;}
 const over=jobs.filter(x=>RPH.guide.bucket(x)===0),due=jobs.filter(x=>x.date===today()),nodate=jobs.filter(x=>x.k==='nodate').length;
 const name=x=>'“'+clEsc(x.item)+'”';let s;
 if(over.length)s=`<b class="w-overdue">${over.length} thing${over.length===1?' is':'s are'} overdue.</b> Start with ${name(over[0])}.`;
 else if(due.length)s=`Nothing overdue. <b>${due.length} due today</b>, starting with ${name(due[0])}.`;
 else{const nx=jobs.find(x=>x.date);s=nx?`Nothing overdue. Next: ${name(nx)}, ${RPH.shortDate(nx.date)}.`:'Nothing overdue.';}
 const d=new Date().toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'});
 return `<p class="status cl-status">${d} · ${s}${nodate?` <button class="verb cd-nodate" data-f="today:nodate">${nodate} need${nodate===1?'s':''} a date</button>`:''}</p>`;};
const clToday=CD.V.today;
CD.V.today=function(){const h=clToday.apply(this,arguments);try{return h.replace(/<p class="status">[\s\S]*?<\/p>/,RPH.calm.sentence());}catch(e){console.warn(e);return h;}};
/* ---------- 2. one way into a site visit ---------- */
const clReview=reviewEditor;
reviewEditor=function(id,event=false){
 if(id==='Q1'&&!event&&!RPH.calm.direct&&RPH.visit){let d=null;try{d=readDraft(RPH.sv.draftId(false));}catch{}if(!d)return RPH.visit.prep(false);}
 return clReview.apply(this,arguments);};
/* ---------- 4. words ---------- */
RPH.words.RULES.push([/^Action details$/,'Action'],[/^Task details$/,'Action'],[/\bCorrective Action created\b/g,'Action raised']);
for(const r of RPH.words.RULES)if(String(r[0])==='/^Check later$/'){r[1]=()=>state.inherited?'Check later · from previous owner':'Check later';}
/* ---------- 5. lighter action screen on a phone ---------- */
RPH.calm.action=function(id){const ed=$('editor');const form=ed?.querySelector('#task-form');if(!form||!CD.isM()||ed.querySelector('.cl-head'))return;
 const t=state.taskLedger?.[id];if(!t)return;
 const f=Object.values(state.findingLedger||{}).find(x=>x&&x.taskId===id);
 const title=(CD.actionTitle?CD.actionTitle(t):t.text)||t.text;
 const meta=[f?.source?.date?'Found at the '+RPH.shortDate(f.source.date)+' '+(f.source.label||'visit').toLowerCase():'',f?.itemLabel||'',t.due?(t.status==='Outstanding'&&t.due<today()?'overdue since ':'due ')+RPH.shortDate(t.due):''].filter(Boolean).join(' · ');
 const head=D.el('div',{class:'cl-head'});head.append(D.el('h3',{class:'cl-title',text:title}));if(meta)head.append(D.el('p',{class:'cl-meta',text:meta}));
 const det=document.createElement('details');det.className='cl-edit';const sm=document.createElement('summary');sm.textContent='Edit details';det.append(sm);
 if(t.status==='Outstanding'){
  const close=D.el('button',{type:'button',class:'primary cl-close',text:'Seen the fix · close it'});
  close.onclick=()=>{det.open=true;const sel=[...form.querySelectorAll('select')].find(s=>[...s.options].some(o=>/Completed/.test(o.value||o.textContent)));
   if(sel){const o=[...sel.options].find(o=>/Completed/.test(o.value||o.textContent));sel.value=o.value;sel.dispatchEvent(new Event('change',{bubbles:true}));sel.dispatchEvent(new Event('input',{bubbles:true}));}
   setTimeout(()=>{const labs=[...form.querySelectorAll('label')];const lab=labs.find(l=>/resolution|what you saw|outcome/i.test(l.textContent))||labs.find(l=>/progress note/i.test(l.textContent));const inp=lab?.querySelector('textarea,input')||form.querySelector('textarea');inp?.scrollIntoView({block:'center'});inp?.focus();},60);};
  head.append(close);}
 else det.open=true;
 form.before(head);
 const hist=ed.querySelector('.wt-histbtn');if(hist){hist.classList.add('cl-hist');head.append(hist);}
 const wt=ed.querySelector('.wt-box');if(wt)head.after(wt);
 form.before(det);det.append(form);};
const clTask=taskEditor;
taskEditor=function(id=''){const r=clTask.apply(this,arguments);if(id)setTimeout(()=>{try{RPH.calm.action(id);}catch(e){console.warn(e);}},0);return r;};
/* ---------- 6. short confirmations at the bottom, for 3 seconds ---------- */
const clNotice=displayNotice;
displayNotice=function(){const r=clNotice.apply(this,arguments);try{const box=$('status');const first=notices[0];box.classList.toggle('cl-ok',!!first&&!!first.success);
 if(first&&first.success){clearTimeout(noticeTimer);noticeTimer=setTimeout(nextNotice,3000);}}catch(e){}return r;};
/* ---------- 7. bottom bar ---------- */
CD.MOB=[['overview','Today'],['audits','Reviews'],['actions','Actions'],['staff','Staff'],['more','More']];
const clMore=CD.V.more;
CD.V.more=function(){const h=clMore.apply(this,arguments);return h.replace('<tr><td><button data-go="staff"','<tr><td><button data-go="planner" style="width:100%;text-align:left;min-height:44px"><span class="nm">Calendar</span><div class="sub">This week, the year plan and the month</div></button></td></tr><tr hidden><td><button data-go="staff"');};
/* ---------- 8. site visit: lead with what's open from earlier visits ---------- */
new MutationObserver(()=>{const ctx=document.querySelector('#editor .sv-context');if(!ctx||ctx.dataset.cl)return;const sm=ctx.querySelector('summary');if(!sm)return;ctx.dataset.cl='1';
 let open=[];try{open=Object.values(state.findingLedger||{}).filter(f=>f&&String(f.itemKey||'').startsWith('Q1/')&&f.taskId&&state.taskLedger?.[f.taskId]?.status==='Outstanding');}catch{}
 const ver=(sm.textContent.match(/(\d+) to verify/)||[])[1];
 sm.textContent='Before you start · '+(open.length?open.length+' open from earlier visits':'nothing open from earlier visits')+(ver&&ver!=='0'?' · '+ver+' to check':'');
 if(open.length){const ul=D.el('ul',{class:'cl-open'});for(const f of open.slice(0,5)){const t=state.taskLedger[f.taskId];ul.append(D.el('li',{text:(f.text||f.itemLabel)+(t.due?' · due '+RPH.shortDate(t.due):'')}));}sm.after(ul);}
}).observe($('editor'),{childList:true,subtree:true});
