/* ===== Today for someone new (design review #1 and #7, owner approved 20 Nov 2026) =====
 * Display only. No dates, actions or records are changed.
 *  - "Start with these 3": the three most urgent items, so a new proprietor knows where to begin.
 *  - Actions about the same person or service (3 or more) show as one row, e.g. "Priya Nair · 6 staff checks";
 *    "Show" lists them, "Hide" folds them again. Counts on the tabs still count every action.
 *  - Landing explains what the app does, how long setup takes and where the data is kept.
 *  - The end of setup lists the first 3 things and says the rest is planned in the calendar.
 */
RPH.guide={};CD.st.openGroup??={};
RPH.guide.rank=items=>{const pr={overdue:0,legal:1,soon:2,task:3,verify:4,nodate:5};
 return [...items].sort((a,b)=>(pr[a.k]-pr[b.k])||String(a.date||'9999').localeCompare(String(b.date||'9999')));};
/* Codex R06 order: overdue (oldest first) → due today → in progress → future by date → no date; ties by date then id. */
RPH.guide.bucket=x=>{const t=today();if(x.k==='overdue'||(x.date&&x.date<t))return 0;if(x.date===t)return 1;if(/Resume/i.test(x.act||''))return 2;if(x.date)return 3;return 4;};
RPH.guide.rank=items=>[...items].sort((a,b)=>(RPH.guide.bucket(a)-RPH.guide.bucket(b))||String(a.date||'9999').localeCompare(String(b.date||'9999'))||String(a.id).localeCompare(String(b.id)));
/* Jobs: a group (e.g. one person's checks) counts once, whether it's folded or open. */
RPH.guide.jobs=list=>RPH.guide.group(list).filter(x=>!x.inGroup);
RPH.guide.count=list=>RPH.guide.jobs(list).length;
RPH.guide.top3=()=>{try{return RPH.guide.rank(RPH.guide.jobs(CD.todayRows())).slice(0,3);}catch{return [];}};
RPH.guide.startCard=function(items){
 if(RPH.guide.count(items)<=8)return '';
 const jobs=RPH.guide.jobs(items),top=RPH.guide.rank(jobs).slice(0,3);
 return `<div class="start3"><div class="sec">Start with these 3</div>${top.map((x,i)=>`<div class="s3row"><span class="s3n">${i+1}</span><span class="s3t"><span class="nm">${cdE(RPH.guide.phrase(x))}</span><span class="sub">${cdE(x.type)} · </span>${CD.word(CD.KW[x.k][1],x.due)}</span>${CD.btn(x.act==='Start'?'Start':x.act,x.open,i===0)}</div>`).join('')}<p class="sub s3foot">${jobs.length-3} other job${jobs.length-3===1?'':'s'} below. Nothing is late until it says Overdue.</p></div>`;
};
RPH.guide.subject=x=>{if(/^Confirm .*\b(meet|meets|follows?)\b/.test(x.item))return 'Rule checklists to confirm';const i=x.item.lastIndexOf(' · ');return i>0?x.item.slice(i+3).trim():'';};
RPH.guide.group=function(list){
 const staff=new Set((state.staff||[]).map(p=>p.person||p.name).filter(Boolean)),by={};
 for(const x of list)if(x.k==='task'){const s=RPH.guide.subject(x);if(s)(by[s]??=[]).push(x);}
 const out=[],done=new Set();
 for(const x of list){
  const s=x.k==='task'?RPH.guide.subject(x):'',g=s&&by[s]?.length>=(s==='Rule checklists to confirm'||staff.has(s)?2:3)?by[s]:null;
  if(!g){out.push(x);continue;}
  if(done.has(s))continue;done.add(s);
  const open=!!CD.st.openGroup[s],first=[...g].sort((a,b)=>String(a.date||'9999').localeCompare(String(b.date||'9999')))[0];
  const what=staff.has(s)?'staff checks':s==='Rule checklists to confirm'?'checklists':'actions';
  out.push({id:'group/'+s,k:'task',item:staff.has(s)?'Review '+s+'’s checks · '+g.length+' checks':s+' · '+g.length+' '+what,type:open?'Showing all · tap to hide':g.length+' items · tap to see',due:first.due,date:first.date,owner:'You',act:open?'Hide':'Show',
   open:()=>{CD.st.openGroup[s]=!open;render();},members:g,subject:s,what});
  if(open)out.push(...g.map(m=>({...m,inGroup:true})));
 }
 return out;
};
const tgDetail=CD.todayDetail;
CD.todayDetail=function(s){
 if(!s.id.startsWith('group/'))return tgDetail(s);
 const open=!!CD.st.openGroup[s.subject];
 return `<div class="lbl">${s.what==='staff checks'?'Staff checks':'Actions'} · ${cdE(state.pharmacyName||'')}</div><h2>${cdE(s.item)}</h2>${CD.word(CD.KW.task[1],'First due '+s.due)}<div class="blk"><ul class="grp">${s.members.map(m=>`<li>${cdE(m.item.slice(0,m.item.lastIndexOf(' · ')))} <span class="sub">· ${cdE(m.due)}</span></li>`).join('')}</ul></div><div class="blk"><div class="lbl" style="margin-bottom:4px">Why it’s grouped</div><p style="margin:0">These ${s.members.length} ${s.what} are about the same ${s.what==='staff checks'?'person':'thing'}, so they’re shown together. Each one is still its own action.</p></div><div class="blk acts">${CD.btn(open?'Hide them':'Show all '+s.members.length,s.open,true)}</div>`;
};
/* Landing: what it is, how long, where the data lives. */
const tgLanding=fsLanding;
fsLanding=function(){tgLanding();const m=$('main');const old=[...m.querySelectorAll('p.muted')].find(p=>/proprietor oversight record/.test(p.textContent));
 const box=document.createElement('div');box.className='land3';
 for(const [h,t] of [['What it does','Helps you, the owner, keep on top of your legal and best-practice duties in one place: reviews, staff checks, procedures and S8. It tells you what’s due next, in plain words, with the source for every rule.'],['How long setup takes','About 15–20 minutes. You answer a few questions per service; anything you’re unsure of can wait. You can stop and carry on later.'],['Where your records are kept','In this browser on this device. Nothing is sent anywhere unless you choose Save to account.']]){
  const d=document.createElement('div');const b=document.createElement('b');b.textContent=h;const p=document.createElement('p');p.textContent=t;d.append(b,p);box.append(d);}
 const note=document.createElement('p');note.className='muted';note.textContent='For one NSW community pharmacy. Use fictional data in this test version.';
 if(old)old.replaceWith(box,note);else m.append(box,note);};
/* End of setup. If reviews still have no due date, that is the last step (owner decision 20 Nov 2026);
   otherwise the first 3 things and "Go to Today" (the main button). */
RPH.guide.phrase=x=>x.k==='verify'?'Confirm: '+x.item:x.k==='nodate'?'Set a date: '+x.item:x.item;
RPH.guide.finish=function(){const ed=$('editor');if(!ed?.open||ed.querySelector('.first3,.last-step'))return;
 if((ed.querySelector('#dialog-title')?.textContent||'').trim()!=='Pharmacy setup complete')return;
 const dates=[...ed.querySelectorAll('button')].find(b=>/^Set first due dates$/.test(b.textContent.trim()));
 const go=[...ed.querySelectorAll('button')].find(b=>/Open dashboard|Go to Today/.test(b.textContent));
 if(dates){
  const call=[...ed.querySelectorAll('p.rph-callout')].find(p=>/no due date yet/.test(p.textContent));
  const box=document.createElement('div');box.className='last-step';
  const h=document.createElement('p');h.className='f3h';h.textContent='Last step · first due dates';
  const t=document.createElement('p');t.textContent=(call?call.textContent+' ':'')+'Enter the dates you know; leave the rest blank and add them later from Today.';
  box.append(h,t);call?.remove();
  if(go){go.before(box);box.after(dates);dates.after(go);go.textContent='Skip for now';go.classList.remove('primary');go.classList.add('quiet');}
  else ed.append(box);
  dates.classList.add('primary');return;}
 const top=RPH.guide.top3();const box=document.createElement('div');box.className='first3';
 const h=document.createElement('p');h.className='f3h';h.textContent='Your first 3 things';box.append(h);
 const ol=document.createElement('ol');for(const x of top){const li=document.createElement('li');li.textContent=RPH.guide.phrase(x)+' · '+x.due;ol.append(li);}box.append(ol);
 const p=document.createElement('p');p.className='muted';p.textContent='Everything else is planned in your calendar. Today always shows what needs you next.';box.append(p);
 if(go){go.textContent='Go to Today';go.classList.add('primary');go.before(box);}else ed.append(box);};
new MutationObserver(()=>RPH.guide.finish()).observe($('editor'),{childList:true,subtree:true,attributes:true,attributeFilter:['open']});

/* "How this app works": four lines for a new owner, on Today until dismissed (per device; works without storage). */
RPH.guide.howKey='rph-how-dismissed';
RPH.guide.howHidden=()=>{try{return localStorage.getItem(RPH.guide.howKey)==='1';}catch{return !!RPH.guide._how;}};
RPH.guide.howCard=function(){if(RPH.guide.howHidden())return '';
 const rows=[['Today','What to do next, most urgent first.'],['Reviews','Your regular checks, like the S8 inventory and site visit.'],['Actions','Fixes to finish. Only you close them.'],['Policies','Your written procedures, drafted from your answers for you to approve.']];
 return `<div class="howcard"><div class="sec">How this app works</div>${rows.map(([a,b])=>`<p><b>${a}</b> · ${b}</p>`).join('')}<button class="verb" data-act="howDismiss">Got it</button></div>`;};
CD.act.howDismiss=()=>{RPH.guide._how=true;try{localStorage.setItem(RPH.guide.howKey,'1');}catch{}render();};
