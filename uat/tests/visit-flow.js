// Start a visit, Last time, return to the same check, and staff checks that say what's due now. Fictional data only.
const { chromium, devices } = require('playwright');
const res=[];const ok=(n,p,d='')=>res.push({n,p:!!p,d:String(d).slice(0,300)});
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({...devices['iPhone 13']})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto('file:///home/user/rpharmacy/uat/app/rpharmacy-uat-testing.html');await p.waitForTimeout(1500);await p.evaluate(require('./showcase-seed.js'));await p.waitForTimeout(600);
 await p.evaluate(()=>{if($('editor').open)$('editor').close();setDraft('Q1',null);setDraft('event-audit/Q1',null);CD.go('overview');});await p.waitForTimeout(300);
 ok('starting the site visit from Today opens the Start a visit screen first',await p.evaluate(()=>{const r=CD.todayRows().find(x=>x.id==='review/Q1');if(!r)return false;r.open();return $('editor').open&&$('editor').querySelector('#dialog-title')?.textContent==='Start a visit';}));
 const prep=await p.evaluate(()=>({t:$('editor').querySelector('#dialog-title')?.textContent,items:[...$('editor').querySelectorAll('.vp-item b')].map(x=>x.textContent),reasons:[...$('editor').querySelectorAll('.vp-item small')].map(x=>x.textContent),q:$('editor').querySelector('[data-kind="q"]').getAttribute('aria-checked')}));
 ok('the prepare screen names the visit and lists at most three suggestions, each with a reason',prep.t==='Start a visit'&&prep.items.length>=1&&prep.items.length<=3&&prep.reasons.every(r=>r.length>3),JSON.stringify(prep));
 ok('staff records are one combined suggestion, not one per person',prep.items.filter(x=>/records/.test(x)).length<=1,JSON.stringify(prep.items));
 const dueBefore=await p.evaluate(()=>state.schedule.Q1);
 await p.locator('#editor [data-kind="x"]').click();await p.waitForTimeout(200);
 ok('choosing Extra visit says the quarterly date stays put',await p.evaluate(()=>/stays due/.test($('editor').querySelector('.vp-kindnote').textContent)&&$('editor').querySelector('[data-kind="x"]').getAttribute('aria-checked')==='true'));
 // a suggestion opens, and closing it comes back to the prepare screen
 await p.locator('#editor .vp-item').nth(1).click();await p.waitForTimeout(400);
 const side=await p.evaluate(()=>$('editor').open&&!$('editor').classList.contains('vprep'));
 await p.evaluate(()=>$('editor').close());await p.waitForTimeout(400);
 ok('opening a suggestion goes to it, and closing it returns to the prepare screen',side&&await p.evaluate(()=>$('editor').open&&$('editor').querySelector('#dialog-title')?.textContent==='Start a visit'&&$('editor').querySelector('[data-kind="x"]').getAttribute('aria-checked')==='true'));
 await p.locator('#editor .vp-go').click();await p.waitForTimeout(600);
 ok('"Start the checks" opens the site visit as an extra visit',await p.evaluate(()=>!!$('editor').querySelector('#sv-root')&&RPH.visit.cur.event===true));
 await p.locator('#editor .sv-item.cd-cur .rph-seg button[data-value="ok"]').first().click();await p.waitForTimeout(400);
 await p.evaluate(()=>$('editor').close());await p.waitForTimeout(300);
 const res1=await p.evaluate(()=>({card:document.querySelector('#cd-view .vcard')?.textContent||'',q1:state.schedule.Q1}));
 ok('after an interruption Today offers "Resume visit" with progress, and the quarterly date has not moved',/Resume visit/.test(res1.card)&&/Extra visit · 1 of \d+ checked/.test(res1.card)&&res1.q1===dueBefore,JSON.stringify(res1));
 await p.evaluate(()=>{setDraft('event-audit/Q1',null);});
 // Last time: a previous visit found an issue on storage, and its follow-up was closed.
 await p.evaluate(()=>{const items=RPH.sv.items();const d={v:3,date:addInterval(today(),-90,'days'),items:{}};for(const it of items)d.items[it.key]={status:it.key==='storage'?'issue':'ok',text:it.key==='storage'?'Fridge log gaps (fictional)':'',follow:it.key==='storage'?{mode:'new',owner:'You',due:addInterval(today(),-80,'days')}:undefined};
  RPH.sv.commit(false,d,items,d.date,addInterval(today(),1,'days'),'');const t=Object.values(state.taskLedger).find(t=>/Fridge log gaps \(fictional\)/.test(t.text));const n=clone();Object.assign(n.taskLedger[t.id],{status:'Completed',completedAt:addInterval(today(),-85,'days')+'T09:00:00.000Z',outcome:'Seen the new log (fictional)'});commit(n,'test close');});
 await p.evaluate(()=>{if($('editor').open)$('editor').close();RPH.sv.open(false);});await p.waitForTimeout(500);
 const last=await p.evaluate(()=>document.querySelector('#editor .sv-item[data-key="storage"] .vlast')?.textContent||'');
 ok('a check found with an issue last time shows "Last time" with the closed follow-up, and the answer starts blank',/Last time/.test(last)&&/Fridge log gaps/.test(last)&&/Follow-up closed/.test(last)&&await p.evaluate(()=>!document.querySelector('#editor .sv-item[data-key="storage"] [role=radio][aria-checked=true]')),last);
 ok('checks with nothing relevant last time show no "Last time" block',await p.evaluate(()=>document.querySelectorAll('#editor .vlast').length===1));
 // Return to the same check after closing a still-open follow-up from inside the visit.
 await p.evaluate(()=>{$('editor').close();const items=RPH.sv.items();const d={v:3,date:addInterval(today(),-5,'days'),items:{}};for(const it of items)d.items[it.key]={status:it.key==='premises'?'issue':'ok',text:it.key==='premises'?'Door lock (fictional)':'',follow:it.key==='premises'?{mode:'new',owner:'You',due:addInterval(today(),9,'days')}:undefined};RPH.sv.commit(false,d,items,d.date,addInterval(today(),80,'days'),'');setDraft('Q1',null);RPH.sv.open(false);});await p.waitForTimeout(500);
 const key='premises';
 await p.evaluate(k=>{const its=[...document.querySelectorAll('#editor .sv-item')];CD.svIdx=its.findIndex(x=>x.dataset.key===k);CD.svSteps();},key);
 const hasBtn=await p.evaluate(k=>!!document.querySelector(`#editor .sv-item[data-key="${k}"] .cx-open-row button`),key);
 if(hasBtn){await p.evaluate(k=>document.querySelector(`#editor .sv-item[data-key="${k}"] .cx-open-row button`).click(),key);await p.waitForTimeout(400);
  const inTask=await p.evaluate(()=>$('editor').open&&!$('editor').querySelector('#sv-root'));await p.evaluate(()=>$('editor').close());await p.waitForTimeout(500);
  ok('closing a follow-up opened from the visit returns to the same check',inTask&&await p.evaluate(k=>!!$('editor').querySelector('#sv-root')&&document.querySelector('#editor .sv-item.cd-cur')?.dataset.key===k,key));}
 else ok('closing a follow-up opened from the visit returns to the same check',false,'no open follow-up button on '+key);
 await p.evaluate(()=>{$('editor').close();setDraft('Q1',null);CD.go('overview');});await p.waitForTimeout(300);
 // Staff checks
 const g=await p.evaluate(()=>{const x=RPH.guide.group(CD.todayRows()).find(x=>x.what==='staff checks');return x?{item:x.item,type:x.type,now:x.now.length,all:x.members.length,s:x.subject}:null;});
 ok('a person’s grouped checks say how many are due now and upcoming',g&&g.item===g.s+'’s checks'&&new RegExp('^'+g.now+' due now').test(g.type),JSON.stringify(g));
 await p.evaluate(s=>RPH.visit.work(s),g.s);await p.waitForTimeout(400);
 const first=await p.evaluate(()=>$('editor').open);await p.evaluate(()=>$('editor').close());await p.waitForTimeout(500);
 const ban=await p.evaluate(()=>document.querySelector('#cd-view .vqueue')?.textContent||'');
 ok('"Review the due now" opens the first check; after closing it, Today shows the next one with Next and Stop',first&&/0 of \d+ done/.test(ban)&&/Next:/.test(ban)&&/Stop/.test(ban),ban);
 await p.evaluate(()=>[...document.querySelectorAll('#cd-view .vqueue button')].find(b=>b.textContent==='Next').click());await p.waitForTimeout(400);
 ok('Next opens the following check',await p.evaluate(()=>$('editor').open));
 await p.evaluate(()=>$('editor').close());await p.waitForTimeout(400);
 await p.evaluate(()=>[...document.querySelectorAll('#cd-view .vqueue button')].find(b=>b.textContent==='Stop').click());await p.waitForTimeout(200);
 ok('Stop ends the run and nothing was completed for the owner',await p.evaluate(()=>!document.querySelector('#cd-view .vqueue')));
 ok('no page errors',!errs.length,errs.join(' | '));
 await b.close();const f=res.filter(r=>!r.p);for(const r of res)console.log((r.p?'PASS ':'FAIL ')+r.n+(r.p?'':' :: '+r.d));console.log(res.length-f.length+'/'+res.length);process.exit(f.length?1:0);})();
