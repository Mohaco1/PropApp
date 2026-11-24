// Inspection readiness: pharmacist in charge, S8 at a glance, legal obligations, approval guard, preloaded due dates. Fictional data.
const { chromium, devices } = require('playwright');
const APP='file:///home/user/rpharmacy/uat/app/'+(process.env.FILE||'rpharmacy-uat-testing.html');
const res=[];const ok=(n,p,d='')=>res.push({n,p:!!p,d:String(d).slice(0,300)});
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPhone 13']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto(APP);await p.waitForTimeout(1500);
 await p.locator('main button',{hasText:'Set up your pharmacy'}).click();await p.waitForTimeout(300);
 await p.fill('#editor input >> nth=0','Harbourview Test Pharmacy');await p.fill('#editor input >> nth=1','1 Test Street');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(300);
 await p.fill('#editor input >> nth=0','Alex Owner');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(300);
 for(const s of ['Opioid Treatment Program','Home delivery'])await p.locator('#editor .d-tiles>label',{hasText:s}).first().click();
 await p.locator('#editor button',{hasText:'Save service selection'}).click();await p.waitForTimeout(400);
 await p.evaluate(()=>{if($('editor').open)fsClose();});
 // setup menu rows
 await p.evaluate(()=>{state.freshSite=true;siteSetup();});
 const rows=await p.evaluate(()=>[...document.querySelectorAll('main [data-insp] strong')].map(x=>x.textContent));
 ok('Pharmacy setup lists S8 at a glance and Legal obligations, and no longer asks for a pharmacist in charge (rostered day to day)',['S8 at a glance','Legal obligations'].every(x=>rows.includes(x))&&!rows.includes('Pharmacist in charge'),rows.join('|'));
 // legal obligations
 await p.evaluate(()=>RPH.insp.legal());await p.waitForTimeout(300);
 const lg=await p.evaluate(()=>({t:$('editor').querySelector('#dialog-title')?.textContent,secs:[...document.querySelectorAll('#editor .insp-sec')].map(x=>x.textContent),st:document.querySelector('#editor .insp-cur')?.textContent,warn:!!document.querySelector('#editor .insp-note.w-soon'),w:document.documentElement.scrollWidth<=window.innerWidth+1}));
 ok('Legal obligations lists the sections that apply: S8 ones, OTP (s 81) and delivery (s 190–191), not vaccination (s 70)',lg.t==='Legal obligations'&&lg.secs.includes('s 111')&&lg.secs.includes('s 122')&&lg.secs.includes('s 81')&&lg.secs.includes('s 190–191')&&!lg.secs.includes('s 70'),JSON.stringify(lg));
 ok('nothing is marked as sighted for you, and nothing nags about recording a pharmacist in charge',/^0 of \d+ sighted/.test(lg.st)&&!lg.warn,lg.st);
 ok('fits a phone screen (no sideways scroll)',lg.w);
 await p.evaluate(()=>{const li=[...document.querySelectorAll('#editor .insp-list li')].find(l=>l.querySelector('.insp-sec').textContent==='s 111');const [w,d]=li.querySelectorAll('input');w.value='Drug register, S8 safe';d.value=today();});
 await p.locator('#editor button',{hasText:/^Save$/}).click();await p.waitForTimeout(400);
 const lg2=await p.evaluate(()=>({ev:state.legalEvidence?.s111,st:document.querySelector('#editor .insp-cur')?.textContent,h:state.history.at(-1)?.message||state.history[0]?.message}));
 ok('saving records where it is kept, the date sighted and who recorded it, with a history line',lg2.ev?.where==='Drug register, S8 safe'&&lg2.ev?.date&&lg2.ev?.by&&/^1 of/.test(lg2.st),JSON.stringify(lg2));
 const fut=await p.evaluate(()=>{const li=[...document.querySelectorAll('#editor .insp-list li')][1];const d=li.querySelectorAll('input')[1];d.value=addInterval(today(),3,'days');[...document.querySelectorAll('#editor button')].find(x=>x.textContent==='Save').click();return document.querySelector('#editor .sd-msg')?.textContent;});
 ok('a "last sighted" date in the future is refused',/can’t be in the future/.test(fut),fut);
 // pharmacist in charge
 await p.evaluate(()=>RPH.insp.picScreen());await p.waitForTimeout(300);
 await p.fill('#editor input >> nth=0','Sam Pharmacist');await p.locator('#editor button',{hasText:/^Save$/}).click();await p.waitForTimeout(300);
 await p.fill('#editor input >> nth=0','Jo Locum');await p.evaluate(()=>{$('editor').querySelectorAll('input')[1].value=addInterval(today(),1,'days');});await p.locator('#editor button',{hasText:/^Save$/}).click();await p.waitForTimeout(300);
 const pic=await p.evaluate(()=>({list:state.pharmacistInCharge,cur:RPH.insp.pic()?.name,hist:document.querySelectorAll('#editor .insp-hist li').length,note:/s 111\(3\)/.test($('editor').textContent)}));
 ok('pharmacist in charge is recorded with a start date; a change ends the previous one and keeps history',pic.cur==='Jo Locum'&&pic.list.length===2&&pic.list[0].end===pic.list[1].start&&pic.hist===2,JSON.stringify(pic));
 ok('it reminds about the inventory on taking control (s 111(3)) without planning anything',pic.note);
 // S8 at a glance
 await p.evaluate(()=>fsChange('test answer',n=>{sopSet(n,'delivery',{...sopValues('delivery',n),controlled:'Yes'});}));
 await p.evaluate(()=>RPH.insp.s8());await p.waitForTimeout(300);
 const s8=await p.evaluate(()=>({t:$('editor').querySelector('#dialog-title')?.textContent,txt:$('editor').textContent,secs:[...document.querySelectorAll('#editor .insp-sec')].map(x=>x.textContent),ans:document.querySelectorAll('#editor .insp-ans li').length,w:document.documentElement.scrollWidth<=window.innerWidth+1}));
 ok('S8 at a glance shows the inventory, the proprietor (register) and that the owner makes sure storage is done (s 122 names the pharmacist in charge on the day)',s8.t==='S8 at a glance'&&/S8 inventory · s 111/.test(s8.txt)&&/Alex Owner \(proprietor\)/.test(s8.txt)&&/You make sure it’s done/.test(s8.txt)&&/pharmacist in charge on the day/.test(s8.txt),s8.txt.slice(0,300));
 ok('it lists the S8 records (register, inventory, storage, destruction, receipt, verify, copies)',['s 108–110','s 111','s 122','s 148','s 194','s 56','s 57'].every(x=>s8.secs.includes(x)),s8.secs.join(','));
 ok('it shows S8 answers from service setup',s8.ans>=1,s8.ans);
 ok('S8 at a glance fits a phone screen',s8.w);
 ok('it has the NSW Health steps for missing or stolen S8, a lost drug register and destruction, with sources',/S8 or S4D missing or stolen/.test(s8.txt)&&/Drug register lost or destroyed/.test(s8.txt)&&/NSW Health · Notifying the loss or theft/.test(s8.txt));
 // backup still valid
 const bk=await p.evaluate(()=>{try{validateBackup({format:backupFormat,version:2,data:JSON.parse(JSON.stringify(state)),drafts:{}});return 'ok';}catch(e){return e.message;}});
 ok('a backup with these records is still valid',bk==='ok',bk);
 // approval guard
 const g=await p.evaluate(()=>{const d={id:'t1',title:'Test',body:'Step one. Call the prescriber [Confirm: who calls]. Use a sealed bag — verify with your supplier.\nDone.'};procedureReview(d,false);return{t:$('editor').querySelector('#dialog-title')?.textContent,n:document.querySelectorAll('#editor .insp-marks li').length,m:RPH.insp.markers({body:'Clean text.'}).length};});
 ok('approval is blocked while a procedure still has [Confirm] or "verify" markers, listing them',g.t==='Not ready to approve'&&g.n===2,JSON.stringify(g));
 ok('a procedure with no markers goes to the normal approval path',g.m===0);
 ok('no page errors',!errs.length,errs.join(' | '));
 await b.close();const f=res.filter(r=>!r.p);for(const r of res)console.log((r.p?'PASS ':'FAIL ')+r.n+(r.p?'':' :: '+r.d));console.log(res.length-f.length+'/'+res.length);process.exit(f.length?1:0);})();
