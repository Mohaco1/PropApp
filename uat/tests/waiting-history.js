// Waiting on someone (check-back date separate from the due date) and an action's full history. Fictional data.
const { chromium, devices } = require('playwright');
const res=[];const ok=(n,p,d='')=>res.push({n,p:!!p,d:String(d).slice(0,300)});
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPhone 13']});await ctx.grantPermissions(['clipboard-read','clipboard-write']);const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto('file:///home/user/rpharmacy/uat/app/rpharmacy-uat-testing.html');await p.waitForTimeout(1500);await p.evaluate(require('./showcase-seed.js'));await p.waitForTimeout(600);
 // a staff check (one of a person's grouped checks)
 const pick=await p.evaluate(()=>{if($('editor').open)$('editor').close();const g=RPH.guide.group(CD.todayRows()).find(x=>x.what==='staff checks');const m=g.members[0];const id=String(m.id).split('/').pop();return {id,subject:g.subject,due:state.taskLedger[id].due,text:state.taskLedger[id].text};});
 await p.evaluate(id=>taskEditor(id),pick.id);await p.waitForTimeout(300);
 ok('an open action shows "Waiting on someone? Note what you asked for"',await p.evaluate(()=>!!$('editor').querySelector('.wt-open')));
 await p.locator('#editor .wt-open').click();await p.waitForTimeout(150);
 await p.fill('#wt-what','Updated CPR certificate (fictional)');
 await p.locator('#editor .wt-quick button',{hasText:'Friday'}).click();
 await p.locator('#editor .wt-box button.primary',{hasText:'Save'}).click();await p.waitForTimeout(400);
 const saved=await p.evaluate(id=>({w:state.taskLedger[id].waiting,due:state.taskLedger[id].due,status:state.taskLedger[id].status,act:state.taskLedger[id].activity.at(-1)?.message,box:$('editor').querySelector('.wt-box')?.textContent||''}),pick.id);
 ok('saving records what was asked and a check-back date, with an activity entry',saved.w&&/CPR/.test(saved.w.what)&&saved.w.asked&&/Asked for: Updated CPR/.test(saved.act||''),JSON.stringify(saved));
 ok('the due date and status do not change (still open, unverified)',saved.due===pick.due&&saved.status==='Outstanding',JSON.stringify(saved));
 ok('the action window now says "Waiting on someone · Asked … Check back …"',/Waiting on someone/.test(saved.box)&&/Check back/.test(saved.box),saved.box);
 ok('backups still validate with the waiting note on an action',await p.evaluate(()=>{try{const b={format:backupFormat,version:2,data:JSON.parse(JSON.stringify(state)),drafts:{}};const before=(()=>{const c=JSON.parse(JSON.stringify(state));for(const t of Object.values(c.taskLedger))delete t.waiting;try{validateBackup({format:backupFormat,version:2,data:c,drafts:{}});return 'ok';}catch(e){return e.message;}})();let after;try{validateBackup(b);after='ok';}catch(e){after=e.message;}return before===after;}catch(e){return false;}}));
 await p.evaluate(()=>$('editor').close());await p.evaluate(()=>CD.go('overview'));await p.waitForTimeout(250);
 const grp=await p.evaluate(s=>RPH.guide.group(CD.todayRows()).find(x=>x.subject===s)?.type,pick.subject);
 ok('the person’s folded group says "1 waiting"',/1 waiting/.test(grp||''),grp);
 const row=await p.evaluate(id=>CD.todayRows().find(r=>String(r.id).endsWith(id)),pick.id);
 ok('Today shows the row as "Waiting · check back <day> · asked <date>"',/^Waiting · check back/.test(row?.type||''),row?.type);
 // check-back day arrives
 await p.evaluate(id=>{const n=clone();n.taskLedger[id].waiting.checkBack=today();commit(n,'test: check-back today');CD.go('overview');},pick.id);await p.waitForTimeout(200);
 const back=await p.evaluate(id=>({row:CD.todayRows().find(r=>String(r.id).endsWith(id)),grp:RPH.guide.group(CD.todayRows()).find(x=>x.members&&x.members.some(m=>String(m.id).endsWith(id)))?.type,sug:RPH.visit.suggest().slice(0,2).map(s=>s.title+' | '+s.why)}),pick.id);
 ok('on the check-back day the row says "Check back today" with a Check back action',/^Check back today/.test(back.row?.type||'')&&back.row?.act==='Check back',JSON.stringify(back.row&&{t:back.row.type,a:back.row.act}));
 ok('the group says "1 to check back"',/1 to check back/.test(back.grp||''),back.grp);
 ok('the visit suggestions list it near the top: "You asked on …"',back.sug.some(s=>/You asked on/.test(s)),JSON.stringify(back.sug));
 // filter
 await p.evaluate(()=>{CD.st.f.today='waiting';render();});await p.waitForTimeout(200);
 const fl=await p.evaluate(()=>({rows:[...document.querySelectorAll('#cd-view .main tr[data-row^="today:"]')].length,chip:document.querySelector('#cd-view .cd-fchip')?.textContent||''}));
 ok('"Waiting on someone" filter shows just those, labelled',fl.rows>=1&&/Waiting on someone/.test(fl.chip),JSON.stringify(fl));
 await p.evaluate(()=>{CD.st.f.today='all';render();});
 // It arrived
 await p.evaluate(id=>taskEditor(id),pick.id);await p.waitForTimeout(300);
 await p.locator('#editor .wt-box button',{hasText:'arrived'}).click();await p.waitForTimeout(400);
 const got=await p.evaluate(id=>({w:state.taskLedger[id].waiting,status:state.taskLedger[id].status,act:state.taskLedger[id].activity.at(-1)?.message,open:$('editor').open}),pick.id);
 ok('"It’s arrived · record it" clears the wait, keeps the action open for the owner to record and close',!got.w&&got.status==='Outstanding'&&/^Received/.test(got.act)&&got.open,JSON.stringify(got));
 // Full history of a site-visit action
 await p.evaluate(()=>{$('editor').close();const items=RPH.sv.items();const d={v:3,date:addInterval(today(),-30,'days'),items:{}};for(const it of items)d.items[it.key]={status:it.key==='storage'?'issue':'ok',text:it.key==='storage'?'Fridge log gaps (fictional)':'',follow:it.key==='storage'?{mode:'new',owner:'You',due:addInterval(today(),-20,'days')}:undefined};RPH.sv.commit(false,d,items,d.date,addInterval(today(),60,'days'),'');});
 const tid=await p.evaluate(()=>Object.values(state.taskLedger).find(t=>/Fridge log gaps \(fictional\)/.test(t.text)).id);
 await p.evaluate(id=>{RPH.wait.save(id,'New fridge log page (fictional)',addInterval(today(),3,'days'));taskEditor(id);},tid);await p.waitForTimeout(300);
 await p.locator('#editor .wt-histbtn').click();await p.waitForTimeout(300);
 const h=await p.evaluate(()=>({t:$('editor').querySelector('#dialog-title')?.textContent,items:[...$('editor').querySelectorAll('.wt-tl li')].map(li=>li.textContent)}));
 ok('Full history shows the original finding first, then the ask, and says it is still open',h.items.length>=2&&/^.*Found.*Fridge log gaps/.test(h.items[0])&&h.items.some(x=>/Asked.*New fridge log page/.test(x))&&await p.evaluate(()=>/Still open/.test($('editor').textContent)),JSON.stringify(h));
 await p.locator('#editor #wt-copy').click();await p.waitForTimeout(200);
 ok('Copy this history copies the sequence as text',/Copied|didn’t work/.test(await p.evaluate(()=>$('wt-st').textContent))&&/Found ·/.test(await p.evaluate(id=>RPH.wait.text(id),tid)));
 await p.evaluate(()=>$('editor').close());await p.waitForTimeout(400);
 ok('closing Full history returns to the action',await p.evaluate(()=>$('editor').open&&!!$('editor').querySelector('#task-form')));
 ok('no page errors',!errs.length,errs.join(' | '));
 await b.close();const f=res.filter(r=>!r.p);for(const r of res)console.log((r.p?'PASS ':'FAIL ')+r.n+(r.p?'':' :: '+r.d));console.log(res.length-f.length+'/'+res.length);process.exit(f.length?1:0);})();
