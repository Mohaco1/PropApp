// Batch 0: an older or untouched window must never overwrite a newer draft. Fictional data.
const { chromium, devices } = require('playwright');
const res=[];const ok=(n,p,d='')=>res.push({n,p:!!p,d:String(d).slice(0,300)});
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPhone 13']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto('file:///home/user/rpharmacy/uat/app/rpharmacy-uat-testing.html');await p.waitForTimeout(1500);await p.evaluate(require('./showcase-seed.js'));await p.waitForTimeout(600);
 const open=()=>p.evaluate(()=>{if($('editor').open)$('editor').close();RPH.sv.open(false);});
 const newer=()=>p.evaluate(()=>{const d=readDraft('Q1')||{v:3,date:today(),items:{},vacc:{},notes:'',nextDate:'',nextTouched:false};d.notes='NEWER note from the other window';d.items={...(d.items||{}),premises:{status:'issue',text:'Newer evidence ref EV-2'}};localStorage.setItem(draftKey('Q1'),JSON.stringify(d));});
 // 1. untouched window closes after another window saved newer work
 await p.evaluate(()=>setDraft('Q1',null));await open();await p.waitForTimeout(500);await newer();
 await p.evaluate(()=>document.querySelector('#close')?.click());await p.waitForTimeout(300);
 const a=await p.evaluate(()=>readDraft('Q1')?.notes);
 ok('closing an untouched older window keeps the newer draft (Codex stale-close case)',a==='NEWER note from the other window',a);
 // 2. both windows edited: newer stays, this window's edits kept as a separate copy, owner told
 await p.evaluate(()=>setDraft('Q1',null));await open();await p.waitForTimeout(500);await newer();
 await p.evaluate(()=>{const t=$('sv-notes');t.closest('details')?.setAttribute('open','');t.scrollIntoView();});await p.fill('#sv-notes','Edits in THIS window');await p.waitForTimeout(200);
 await p.evaluate(()=>document.querySelector('#close')?.click());await p.waitForTimeout(300);
 const c=await p.evaluate(()=>{const keys=RPHStore.keys().filter(k=>k.includes('-draft-Q1/conflict-'));return {main:readDraft('Q1')?.notes,copies:keys.map(k=>JSON.parse(localStorage.getItem(k)).notes)};});
 ok('when both windows edited, the newer draft stays and this window’s edits are kept as a separate copy',c.main==='NEWER note from the other window'&&c.copies.includes('Edits in THIS window'),JSON.stringify(c));
 // 3. normal single-window editing still saves and resumes
 await p.evaluate(()=>setDraft('Q1',null));await open();await p.waitForTimeout(500);
 await p.evaluate(()=>{const t=$('sv-notes');t.closest('details')?.setAttribute('open','');t.scrollIntoView();});await p.fill('#sv-notes','Normal edit');await p.waitForTimeout(200);
 await p.evaluate(()=>document.querySelector('#close')?.click());await p.waitForTimeout(300);
 ok('normal editing in one window still saves',await p.evaluate(()=>readDraft('Q1')?.notes)==='Normal edit');
 await open();await p.waitForTimeout(400);
 await p.evaluate(()=>{const t=$('sv-notes');t.closest('details')?.setAttribute('open','');t.scrollIntoView();});await p.fill('#sv-notes','Second edit after reopening');await p.waitForTimeout(200);
 await p.evaluate(()=>document.querySelector('#close')?.click());await p.waitForTimeout(300);
 ok('reopening and editing again saves normally (no false conflict)',await p.evaluate(()=>readDraft('Q1')?.notes)==='Second edit after reopening');
 // 4. unchanged dismissal writes nothing
 await open();await p.waitForTimeout(400);const before=await p.evaluate(()=>localStorage.getItem(draftKey('Q1')));
 await p.evaluate(()=>document.querySelector('#close')?.click());await p.waitForTimeout(300);
 ok('closing without changes leaves the stored draft byte-for-byte the same',before===await p.evaluate(()=>localStorage.getItem(draftKey('Q1'))));
 // 5. real two-page test (BroadcastChannel)
 const q=await ctx.newPage();await q.goto('file:///home/user/rpharmacy/uat/app/rpharmacy-uat-testing.html');await q.waitForTimeout(1500);
 await open();await p.waitForTimeout(400);
 await q.evaluate(()=>{const d=readDraft('Q1');d.notes='Saved in TAB B';setDraft('Q1',d);});await q.waitForTimeout(800);
 await p.evaluate(()=>document.querySelector('#close')?.click());await p.waitForTimeout(800);
 const two=await q.evaluate(()=>RPHStore.flush().then(()=>localStorage.getItem(draftKey('Q1'))));
 const synced=await p.evaluate(()=>readDraft('Q1')?.notes);
 ok('two real tabs: closing untouched tab A keeps tab B’s newer draft'+(synced!=='Saved in TAB B'?' (tabs did not sync on file://)':''),/Saved in TAB B/.test(two||'')&&synced==='Saved in TAB B',synced);
 const rb=await p.evaluate(()=>{const input={format:backupFormat,version:2,data:JSON.parse(JSON.stringify(state)),drafts:{}};input.data.findingLedger={F1:{id:'F1',taskId:'T-missing-9'}};input.data.history.push({at:new Date().toISOString(),message:'Restored from backup · test'},{at:new Date().toISOString(),message:'Restored from backup · test'});const before=JSON.stringify(input);let msg='';try{restoreBackup(input,null);}catch(e){msg=e.message;}return {msg,unchanged:before===JSON.stringify(input)};});
 ok('a backup whose finding points at a missing action is rejected, and the selected backup is not changed',/isn’t in the file/.test(rb.msg)&&rb.unchanged,JSON.stringify(rb));
 ok('no page errors',!errs.length,errs.join(' | '));
 await b.close();const f=res.filter(r=>!r.p);for(const r of res)console.log((r.p?'PASS ':'FAIL ')+r.n+(r.p?'':' :: '+r.d));console.log(res.length-f.length+'/'+res.length);process.exit(f.length?1:0);})();
