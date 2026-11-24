// Codex v27 retest cases, one by one. Fictional data only.
const { chromium, devices } = require('playwright');const fs=require('fs');
const res=[];const ok=(n,p,d='')=>res.push({n,p:!!p,d:String(d).slice(0,300)});
const APP='file:///home/user/rpharmacy/uat/app/rpharmacy-uat-testing.html';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPhone 13'],acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto(APP);await p.waitForTimeout(1500);await p.evaluate(require('./showcase-seed.js'));await p.waitForTimeout(600);
 await p.evaluate(()=>{if($('editor').open)$('editor').close();});
 // R04 older-format draft: open and close unchanged keeps it byte for byte
 const oldRaw=await p.evaluate(()=>{const old={date:addInterval(today(),-3,'days'),notes:'Older note (fictional)',evidenceRef:'EV-OLD-1',items:{premises:{status:'ok'}}};localStorage.setItem(draftKey('Q1'),JSON.stringify(old));return localStorage.getItem(draftKey('Q1'));});
 await p.evaluate(()=>RPH.sv.open(false));await p.waitForTimeout(500);await p.locator('#editor .cd-audit-top button').first().click();await p.waitForTimeout(400);
 ok('R04: an older-format draft opened and closed without changes is left exactly as it was (date, note, extra field)',await p.evaluate(()=>localStorage.getItem(draftKey('Q1')))===oldRaw);
 await p.evaluate(()=>setDraft('Q1',null));
 // R05 S8 date follows a corrected stock-check date
 await p.evaluate(()=>{reviewEditor('B1');});await p.waitForTimeout(500);
 const s8=await p.evaluate(async()=>{const st=$('stock-date'),nx=$('next-date');const set=v=>{st.value=v;st.dispatchEvent(new Event('input',{bubbles:true}));return nx.value;};
  const a=addInterval(today(),-20,'days'),b=addInterval(today(),-5,'days');const r1=set(a),r2=set(b),r3=set('');return {r1,e1:addInterval(a,3,'months'),r2,e2:addInterval(b,3,'months'),r3};});
 ok('R05: the suggested next S8 date follows the stock-check date when it is corrected, and clears when it is cleared',s8.r1===s8.e1&&s8.r2===s8.e2&&s8.r3==='',JSON.stringify(s8));
 const own=await p.evaluate(()=>{const st=$('stock-date'),nx=$('next-date');st.value=addInterval(today(),-20,'days');st.dispatchEvent(new Event('input',{bubbles:true}));return nx.value;});
 await p.locator('#next-date').fill(await p.evaluate(()=>addInterval(today(),20,'days')));
 const kept=await p.evaluate(()=>{const st=$('stock-date');st.value=addInterval(today(),-10,'days');st.dispatchEvent(new Event('input',{bubbles:true}));return $('next-date').value===addInterval(today(),20,'days');});
 ok('R05: a next date the owner typed themselves is kept when the stock-check date changes',kept);
 await p.evaluate(()=>{$('editor').close();});await p.waitForTimeout(300);
 // R06 credential linked to an action keeps its expiry on Today
 const cr=await p.evaluate(()=>{for(const per of activeTeam())for(const i of staffItems(per)){if(!i.expiry)continue;
   const n=clone();const id='cr-'+Math.random().toString(36).slice(2,8);taskNew(n,id,{text:'Get updated certificate · '+per.person,owner:'You',due:addInterval(today(),9,'days')},{type:'Staff',id:per.id,issue:i.id});commit(n,'test link');
   const t=state.taskLedger[id];if(!t||!t.sources.some(s=>s.type==='Staff'))return {skip:'no staff source',src:JSON.stringify(t?.sources)};
   const row=CD.todayRows().find(r=>r.id==='task/'+id);return {exp:i.expiry,row:row&&{date:row.date,type:row.type,k:row.k}};}return {skip:'no credential with expiry'};});
 ok('R06: an action linked to a staff credential still shows the credential’s expiry on Today (and sorts by the earlier date)',cr.row&&/credential (expired|expires)/.test(cr.row.type)&&cr.row.date<=cr.exp,JSON.stringify(cr));
 // R06/R07 two checks for one person = one job
 const g2=await p.evaluate(()=>{const s=(state.staff||[])[0];const who=s?.person||s?.name;const rows=[{id:'task/x1',k:'task',item:'A check · '+who,date:today(),type:'Action'},{id:'task/x2',k:'task',item:'B check · '+who,date:today(),type:'Action'}];return RPH.guide.count(rows);});
 ok('R06/R07: two checks for the same person count as one job',g2===1,g2);
 // R06/R07 an opened group shows its checks even when the phone list is capped at 8
 const og=await p.evaluate(()=>{CD.st.f.today='all';CD.st.allToday=false;CD.go('overview');const top=RPH.guide.top3?RPH.guide.top3().map(x=>x.id):[];const g=RPH.guide.rank(RPH.guide.jobs(CD.todayRows())).find(x=>x.members&&x.members.length>=2);if(!g)return {skip:true};
  CD.st.openGroup[g.subject]=true;render();const ids=[...document.querySelectorAll('#cd-view .main tr[data-row^="today:"]')].map(r=>r.dataset.row.slice(6));const shown=g.members.filter(m=>ids.includes(m.id)).length;const visibleGroup=ids.includes(g.id)||top.includes(g.id);CD.st.openGroup[g.subject]=false;render();return {shown,n:g.members.length,visibleGroup,featured:top.includes(g.id)};});
 ok('R06/R07: opening a group (featured or listed) shows its checks straight away, not only after "Show more"',og.skip||!og.visibleGroup||og.shown===og.n,JSON.stringify(og));
 // R04 resume lands on an earlier missing reason
 await p.evaluate(()=>{const its=RPH.sv.items();const d={v:3,date:today(),items:{}};its.forEach((it,i)=>{d.items[it.key]=i===0?{status:'na',reason:''}:i===1?{status:''}:{status:'ok'};});d.vacc={};d.notes='';d.nextDate='';d.nextTouched=false;setDraft('Q1',d);RPH.sv.open(false);});await p.waitForTimeout(500);
 const rs=await p.evaluate(()=>({cur:document.querySelector('#editor .sv-item.cd-cur')?.dataset.key,first:RPH.sv.items()[0].key}));
 ok('R04: Resume opens an earlier check that still needs a reason before a later unanswered one',rs.cur===rs.first,JSON.stringify(rs));
 await p.evaluate(()=>{$('editor').close();});await p.waitForTimeout(300);
 // R04 In progress includes far-future and event-only drafts
 const ip=await p.evaluate(()=>{const far=catalog().find(a=>a.id!=='Q1'&&a.id!=='B1'&&!a.eventOnly&&state.schedule[a.id]&&state.schedule[a.id]>addInterval(today(),60,'days'));if(far)localStorage.setItem(draftKey(far.id),JSON.stringify({v:1,answers:{}}));
  localStorage.setItem(draftKey('event-audit/Q1'),JSON.stringify({v:3,date:today(),items:{}}));
  const rows=CD.todayRows().filter(x=>/Resume/i.test(x.act||''));return {far:far?.id,ids:rows.map(r=>r.id)};});
 ok('R04: In progress lists a far-future review draft and an extra (event) site-visit draft',ip.ids.includes('draft/event-audit/Q1')&&(!ip.far||ip.ids.some(i=>i.endsWith(ip.far))),JSON.stringify(ip));
 // R01–R03 counts via taskLinks and verbs
 const fv=await p.evaluate(()=>{const t=Object.values(state.taskLedger).find(t=>t.status==='Outstanding');return {link:CD.resultFollow({taskLinks:[t.id]}),reopen:CD.histVerb({type:'Task update',record:{message:'Status changed from Completed to Outstanding'}}),close:CD.histVerb({type:'Task completed',record:{message:'Status changed from Outstanding to Completed'}}),note:CD.histVerb({type:'Task update',record:{message:'Progress note: awaiting completion of the form'}})};});
 ok('R01–R03: a review linked only through taskLinks shows its open action count',fv.link===' · 1 open action',fv.link);
 ok('R01–R03: History says "Action reopened" for a reopen, "Action closed" for a close, and a note mentioning completion is just "Action updated"',fv.reopen==='Action reopened'&&fv.close==='Action closed'&&fv.note==='Action updated',JSON.stringify(fv));
 // R03 exports: quoted pharmacy name; two visits with the same saved time; owner text kept
 await p.evaluate(()=>{for(const k of Object.keys(localStorage))if(k.startsWith(draftKey('')))localStorage.removeItem(k);const n=clone();n.pharmacyName='Harbour "View" Pharmacy';commit(n,'test name');});
 const two=await p.evaluate(()=>{const items=RPH.sv.items().filter(i=>i.core);const mk=(st)=>{const d={v:3,date:today(),items:{}};items.forEach((it,i)=>d.items[it.key]={status:i===2?st:'ok',text:st==='verify'?'Fictional verify':'',reason:st==='na'?'Fictional reason':''});return d;};
  RPH.sv.commit(false,mk('verify'),items,today(),addInterval(today(),3,'months'),'Owner typed: check the Task list in the office');const r1=state.reviews.at(-1);
  RPH.sv.commit(false,mk('na'),items,today(),addInterval(today(),3,'months'),'');const r2=state.reviews.at(-1);
  const n=clone();n.reviews.find(r=>r.id===r2.id).at=r1.at;commit(n,'test same time');return {at:r1.at,id1:r1.id};});
 await p.evaluate(()=>{gotoPage('history');});await p.waitForTimeout(300);
 const [c]=await Promise.all([p.waitForEvent('download',{timeout:5000}).catch(()=>null),p.evaluate(()=>$('hist-csv').click())]);
 const csv=c?fs.readFileSync(await c.path(),'utf8'):'';const lines=csv.split('\n').filter(l=>l.includes(two.at)&&l.includes('"Review"'));
 ok('R03: with a quote in the pharmacy name, the CSV still shows "Needs verification" exactly',lines.some(l=>/Section 3: Needs verification/.test(l))&&!lines.some(l=>/Rating unconfirmed/.test(l)),lines.join(' || ').slice(0,300));
 ok('R03: two visits saved at the same moment each keep their own answer (one Needs verification, one N/A)',lines.length===2&&lines.some(l=>/Section 3: Needs verification/.test(l))&&lines.some(l=>/Section 3: N\/A/.test(l)),lines.length);
 const txt=await p.evaluate(id=>{const r=state.reviews.find(x=>x.id===id);return RPH.cx.plainWords('Proprietor site visit\n'+reviewText(r));},two.id1);
 ok('R03: the review-detail export keeps the owner’s own words ("Task list" stays as typed)',/check the Task list in the office/.test(txt),txt.slice(0,200));
 // R04 restore receipts: two genuine restores both stay; a retry duplicate collapses
 const q=await (await b.newContext({viewport:{width:1280,height:860}})).newPage();q.on('pageerror',e=>errs.push(e.message));q.on('dialog',d=>d.accept());
 await require('./lib-setup.js')(q);await q.evaluate(()=>{if($('editor').open)$('editor').close();});
 const rr=await q.evaluate(()=>{const b=portableBackup();const h=b.data.history;const base=h.at(-1)||{};
  h.push({...base,id:'h-r1',message:'Restored from backup',at:'2026-11-01T09:00:00.000Z',by:'Alex Owner'});h.push({...base,id:'h-r2',message:'Restored from backup',at:'2026-11-10T09:00:00.000Z',by:'Sam Partner'});
  h.push({...base,id:'h-r3',message:'Restored from backup',at:'2026-11-10T09:00:20.000Z',by:'Sam Partner'});
  try{restoreBackup(b,localStorage.getItem(currentSlot()));}catch(e){return e.message;}return 'ok';});
 await q.reload();await q.waitForTimeout(2000);
 const rc=await q.evaluate(()=>{if($('editor').open)$('editor').close();return state.history.filter(h=>/^Restored from backup/.test(h.message)).map(h=>h.at+' '+(h.by||''));});
 ok('R04: two genuine restores on different dates by different people both stay; a retry 20 seconds later collapses',rr==='ok'&&rc.some(x=>/2026-11-01/.test(x))&&rc.filter(x=>/2026-11-10/.test(x)).length===1,JSON.stringify({rr,rc}));
 const od=await p.evaluate(()=>{const c=(k,fn)=>fn(k==='escalation'||k==='exceptions'?'Pharmacist in charge':'Fictional');const d=JSON.stringify(RPH.sop.templates.delivery({},c)),st=JSON.stringify(RPH.sop.templates.staged({},c));return {d:/Delivery incidents are reported to the pharmacist on duty\./.test(d),s:/Missed collections are reviewed by the pharmacist on duty/.test(st),cite:RPH.rtf.onDuty('the pharmacist in charge (s 122) must')==='the pharmacist in charge (s 122) must',left:/pharmacist in charge/i.test(d+st)};});
 ok('procedures say "the pharmacist on duty" (delivery incidents, missed collections); legal citations stay as written',od.d&&od.s&&od.cite&&!od.left,JSON.stringify(od));
 ok('no page errors',!errs.length,errs.join(' | '));
 await b.close();const f=res.filter(r=>!r.p);for(const r of res)console.log((r.p?'PASS ':'FAIL ')+r.n+(r.p?'':' :: '+r.d));console.log(res.length-f.length+'/'+res.length);process.exit(f.length?1:0);})();
