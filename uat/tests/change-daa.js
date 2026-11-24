// Tell me once: DAA packing moves to an outside packer. Inherited facts on a first visit. Fictional data only.
const { chromium, devices } = require('playwright');
const res=[];const ok=(n,p,d='')=>res.push({n,p:!!p,d:String(d).slice(0,300)});
const APP='file:///home/user/rpharmacy/uat/app/rpharmacy-uat-testing.html';
const bkv=()=>{const c=JSON.parse(JSON.stringify(state));try{validateBackup({format:backupFormat,version:2,data:c,drafts:{}});return 'ok';}catch(e){return e.message;}};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({...devices['iPhone 13']})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto(APP);await p.waitForTimeout(1500);await p.evaluate(require('./showcase-seed.js'));await p.waitForTimeout(600);
 const pre=await p.evaluate(`(()=>{if($('editor').open)$('editor').close();if(!state.active.includes('daa'))return 'no daa';const n=clone();n.flags=Object.assign({},n.flags,{house:true,routeA:false,routeB:false});commit(n,'test: in-house');return {arr:RPH.chg.now(),kept:RPH.chg.kept(),bk:(${bkv})(),tasks:Object.keys(state.taskLedger).length,sched:JSON.stringify(state.schedule)};})()`);
 ok('test pharmacy runs DAA in-house to start',pre.arr&&pre.arr.join()==='house',JSON.stringify(pre));
 await p.evaluate(()=>{CD.go('services');CD.st.sel.services='daa';CD.st.expanded=true;render();});await p.waitForTimeout(250);
 ok('Services · DAA shows "How it runs" and "Change how this service runs"',await p.evaluate(()=>/How it runs/.test($('cd-view').textContent)&&[...document.querySelectorAll('#cd-view button')].some(b=>b.textContent==='Change how this service runs')));
 await p.evaluate(()=>[...document.querySelectorAll('#cd-view button')].find(b=>b.textContent==='Change how this service runs').click());await p.waitForTimeout(250);
 ok('it opens "What’s changing?" with the current arrangement ticked',await p.evaluate(()=>$('editor').querySelector('#dialog-title')?.textContent==='What’s changing?'&&$('editor').querySelector('.chg-opts input[value=house]').checked));
 await p.locator('#chg-next').click();await p.waitForTimeout(100);
 ok('choosing the same arrangement is refused with a plain message',/same as now/.test(await p.evaluate(()=>$('chg-msg').textContent)));
 await p.locator('#editor .chg-opts input[value=house]').uncheck();await p.locator('#editor .chg-opts input[value=routeA]').check();
 await p.locator('#chg-next').click();await p.waitForTimeout(100);
 ok('the packer name is asked for',/packer or pharmacy name/.test(await p.evaluate(()=>$('chg-msg').textContent)));
 await p.fill('#chg-packer','Northside Packing Co (fictional)');await p.evaluate(()=>{$('chg-from').value=addInterval(today(),7,'days');});
 await p.locator('#chg-next').click();await p.waitForTimeout(250);
 const cmp=await p.evaluate(()=>({t:$('editor').querySelector('#dialog-title')?.textContent,x:$('editor').querySelector('.chg-cmp')?.textContent||''}));
 ok('Before and after shows who packs and what changes for patients',cmp.t==='Before and after'&&/An outside packer/.test(cmp.x)&&/Ask before a third party packs/.test(cmp.x),JSON.stringify(cmp));
 await p.locator('#chg-save').click();await p.waitForTimeout(400);
 const s=await p.evaluate(()=>({t:$('editor').querySelector('#dialog-title')?.textContent,items:[...$('editor').querySelectorAll('.chg-items li')].map(li=>li.dataset.key+'|'+li.querySelector('.chg-tag').textContent),flags:state.flags,n:(state.serviceChanges||[]).length,kept:$('editor').querySelector('.chg-kept')?.textContent||''}));
 ok('saving records one change and switches the DAA arrangement the same way the Services page does',s.n===1&&s.flags.house===false&&s.flags.routeA===true&&!s.flags.routeB,JSON.stringify(s.flags));
 ok('only the dependent items are listed, each labelled law / check / recommended / procedure',JSON.stringify(s.items)===JSON.stringify(['instructions|Required by law','reference|Required by law','supplier|Required by law','licence|Check','consent3p|Recommended','procedure|Your procedure']),JSON.stringify(s.items));
 ok('the TGA licence is "Check", not "Required by law" (NSW Health DAA page says ask the TGA)',s.items.includes('licence|Check'));
 const after=await p.evaluate(`(()=>({kept:RPH.chg.kept(),bk:(${bkv})(),tasks:Object.keys(state.taskLedger).length,sched:JSON.stringify(state.schedule)}))()`);
 ok('open DAA actions, past reviews and review dates are unchanged',JSON.stringify(after.kept)===JSON.stringify(pre.kept)&&after.sched===pre.sched&&after.tasks===pre.tasks,JSON.stringify({pre:pre.kept,after:after.kept}));
 ok('“Kept as it is” says so',/stay|keep how things were done/.test(s.kept)&&/unchanged/.test(s.kept),s.kept);
 ok('backups validate the same after the change',after.bk===pre.bk,after.bk+' vs '+pre.bk);
 // Later → one action, never two
 await p.locator('#editor li[data-key=consent3p] .chg-later').click();await p.waitForTimeout(300);
 const l1=await p.evaluate(()=>{const c=state.serviceChanges[0];return {st:c.items.consent3p.status,tid:c.items.consent3p.taskId,t:state.taskLedger[c.items.consent3p.taskId]?.text,n:Object.keys(state.taskLedger).length};});
 ok('"Later" raises one ordinary action for that item',l1.st==='later'&&/Ask patients before a third party packs · DAA change/.test(l1.t||'')&&l1.n===after.tasks+1,JSON.stringify(l1));
 await p.evaluate(()=>RPH.chg.mark(state.serviceChanges[0].id,'consent3p','later'));
 ok('pressing Later again does not make a second action',await p.evaluate(n=>Object.keys(state.taskLedger).length===n,l1.n));
 // Done with a note
 await p.locator('#editor li[data-key=licence] .chg-done').click();await p.waitForTimeout(150);
 await p.fill('#editor li[data-key=licence] .chg-note','Supplier folder, office (fictional)');await p.locator('#editor li[data-key=licence] button.primary').click();await p.waitForTimeout(300);
 ok('Done on the licence item asks where the copy is kept and records it with the date',await p.evaluate(()=>{const i=state.serviceChanges[0].items.licence;return i.status==='done'&&/Supplier folder/.test(i.note)&&!!i.at;}));
 // Re-open: same change, no duplicate
 await p.evaluate(()=>{$('editor').close();CD.go('services');CD.st.sel.services='daa';CD.st.expanded=true;render();});await p.waitForTimeout(200);
 const btn=await p.evaluate(()=>[...document.querySelectorAll('#cd-view button')].map(b=>b.textContent).find(t=>/Continue the change|Change how/.test(t)));
 ok('Services now says "Continue the change (N left)" and shows the change line',/^Continue the change \(5 left\)$/.test(btn||'')&&await p.evaluate(()=>/Changed .* from /.test($('cd-view').textContent)),btn);
 await p.evaluate(()=>RPH.chg.start());await p.waitForTimeout(200);
 ok('continuing opens the same change, not a new one',await p.evaluate(()=>/DAA change from/.test($('editor').querySelector('#dialog-title').textContent)&&state.serviceChanges.length===1));
 // procedure opens existing DAA setup, returns to the change
 await p.locator('#editor li[data-key=procedure] .chg-proc').click();await p.waitForTimeout(500);
 const inSetup=await p.evaluate(()=>$('editor').open&&/Dose administration|DAA/i.test($('editor').textContent)&&!$('editor').classList.contains('chgdlg'));
 ok('"Open DAA setup" opens the existing DAA setup questions',inSetup);
 await p.evaluate(()=>$('editor').close());await p.waitForTimeout(400);
 ok('closing it returns to the change screen',await p.evaluate(()=>$('editor').open&&/DAA change from/.test($('editor').querySelector('#dialog-title')?.textContent||'')));
 await p.evaluate(()=>$('editor').close());
 // Inherited facts on a first visit (fresh page)
 const q=await (await b.newContext({...devices['iPhone 13']})).newPage();q.on('pageerror',e=>errs.push(e.message));q.on('dialog',d=>d.accept());
 await q.goto(APP);await q.waitForTimeout(1500);await q.evaluate(require('./showcase-seed.js'));await q.waitForTimeout(600);
 await q.evaluate(()=>{if($('editor').open)$('editor').close();const n=clone();n.inherited=true;n.flags=Object.assign({},n.flags,{house:true,routeA:false,routeB:false});commit(n,'test: just bought');RPH.visit.prep(false);});await q.waitForTimeout(400);
 const ib=await q.evaluate(()=>({rows:[...$('editor').querySelectorAll('.inh-row b')].map(x=>x.textContent),lbl:$('editor').querySelector('.inh-lbl')?.textContent}));
 ok('a just-bought pharmacy’s visit screen lists up to 3 inherited facts to confirm, DAA first',ib.rows.length>=1&&ib.rows.length<=3&&/DAAs: we pack on site/i.test(ib.rows[0])&&/previous owner/.test(ib.lbl||''),JSON.stringify(ib));
 await q.locator('#editor .inh-row').first().locator('button',{hasText:'Confirm'}).click();await q.waitForTimeout(400);
 const cf=await q.evaluate(()=>({c:(state.serviceChanges||[]).filter(x=>x.type==='confirm').length,flags:state.flags,rows:[...$('editor').querySelectorAll('.inh-row b')].map(x=>x.textContent)}));
 ok('Confirm records who confirmed it and when, changes nothing else, and the DAA row goes',cf.c===1&&cf.flags.house===true&&!cf.rows.some(r=>/^DAAs/.test(r)),JSON.stringify(cf));
 await q.evaluate(()=>{$('editor').close();CD.go('services');CD.st.sel.services='daa';CD.st.expanded=true;render();});await q.waitForTimeout(200);
 ok('Services · DAA shows "Packing arrangement confirmed <date> by <owner>"',await q.evaluate(()=>/Packing arrangement confirmed/.test($('cd-view').textContent)));
 // Correct → Tell me once
 await q.evaluate(()=>{const n=clone();n.serviceChanges=[];commit(n,'test reset');RPH.visit.prep(false);});await q.waitForTimeout(400);
 await q.locator('#editor .inh-row').first().locator('button',{hasText:'Correct'}).click();await q.waitForTimeout(400);
 ok('Correct opens the Tell me once flow',await q.evaluate(()=>$('editor').querySelector('#dialog-title')?.textContent==='What’s changing?'));
 await q.evaluate(()=>$('editor').close());await q.waitForTimeout(400);
 ok('closing it returns to the visit screen',await q.evaluate(()=>$('editor').open&&$('editor').querySelector('#dialog-title')?.textContent==='Start a visit'));
 ok('no page errors',!errs.length,errs.join(' | '));
 await b.close();const f=res.filter(r=>!r.p);for(const r of res)console.log((r.p?'PASS ':'FAIL ')+r.n+(r.p?'':' :: '+r.d));console.log(res.length-f.length+'/'+res.length);process.exit(f.length?1:0);})();
