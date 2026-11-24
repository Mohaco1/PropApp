// Example pharmacy (UAT only): opens as a separate pharmacy, dates sit around today, the owner's pharmacy and UAT notes
// are untouched, and the main pages, history and exports show its records. Fictional data only.
const { chromium } = require('playwright');const setupPharmacy=require('./lib-setup.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
 await p.clock.install({time:new Date('2026-12-04T09:00:00')});   // ten days after the example was made
 await setupPharmacy(p);
 const mine=await p.evaluate(()=>({id:state.taskPharmacyId,name:state.pharmacyName,reviews:state.reviews.length,tasks:Object.keys(state.taskLedger).length,raw:localStorage.getItem(key)}));
 await p.evaluate(()=>{localStorage.setItem(UAT.key,JSON.stringify({...UAT.data(),notes:[...UAT.data().notes,{id:'n-keep',page:'Today',text:'keep me',status:'Open'}]}));});
 const notesBefore=await p.evaluate(()=>localStorage.getItem(UAT.key));
 await p.evaluate(()=>{if($('editor').open)$('editor').close();});await p.locator('#uat-btn').click();await p.waitForTimeout(300);   // the real button, as the owner taps it
 ok(await p.locator('#uat-dlg .uat-example-btn',{hasText:'Open the example pharmacy'}).count()===1,'UAT window offers "Open the example pharmacy"');
 await Promise.all([p.waitForNavigation(),p.locator('#uat-dlg .uat-example-btn').click()]);await p.waitForTimeout(1500);
 const ex=await p.evaluate(()=>({name:state.pharmacyName,reviews:state.reviews.length,staff:state.staff.map(s=>s.person),dir:readSites().sites.length,open:Object.values(state.taskLedger).filter(t=>t.status==='Outstanding').length,done:Object.values(state.taskLedger).filter(t=>t.status==='Completed').length,
   last:state.reviews.map(r=>r.date).sort().at(-1),schedQ1:state.schedule.Q1,drafts:Object.keys(localStorage).filter(k=>k.startsWith(draftKey(''))).map(k=>k.slice(draftKey('').length))}));
 console.log(JSON.stringify(ex));
 ok(ex.name==='Wattle Grove Pharmacy','switched to Wattle Grove Pharmacy');
 ok(ex.dir===2,'two pharmacies in this browser');
 ok(ex.reviews>=30&&ex.staff.length===4,'a year of reviews and four staff');
 ok(ex.open>=3&&ex.done>=3,'open and closed actions');
 ok(ex.last===await p.evaluate(()=>addInterval(today(),-26,'days')),'dates moved by ten days (last OTP review 26 days ago)');
 ok(ex.drafts.includes('event-audit/Q1')&&ex.drafts.includes('otp-full'),'extra visit and six-monthly OTP drafts present');
 ok(await p.evaluate(()=>{try{validateBackup(portableBackup());return true;}catch(e){return e.message;}})===true,'example passes the backup check');
 const today=await p.evaluate(()=>{CD.go('overview');return document.body.innerText;});
 ok(/Resume visit|visit in progress|Extra/i.test(today),'Today shows the visit in progress');
 ok(/overdue/i.test(today),'Today shows something overdue');
 const acts=await p.evaluate(()=>{CD.go('actions');return document.body.innerText;});
 ok(/Fridge min\/max/.test(acts)&&/fire extinguisher/i.test(acts),'Actions lists the visit follow-up and the waiting action');
 const cal=await p.evaluate(()=>{CD.go('planner');return document.body.innerText;});ok(cal.length>200,'Calendar renders');
 const hist=await p.evaluate(()=>{gotoPage('history');return document.body.innerText;});ok(/Site visit|site visit|Premises/i.test(hist),'History shows site visits');
 const csv=await p.evaluate(()=>new Promise(res=>{const d=download;download=(n,t)=>{download=d;res({n,len:String(t).length,has:/Wattle Grove/.test(t)});};try{const b=document.getElementById('hist-csv');b?b.click():res({n:'no button'});}catch(e){res({n:e.message});}setTimeout(()=>res({n:'timeout'}),2000);}));
 console.log('export',JSON.stringify(csv));ok(/\.csv$/.test(csv.n)&&csv.len>500,'History export produces a CSV');
 // back to my pharmacy
 await p.evaluate(()=>{if($('editor').open)$('editor').close();});await p.locator('#uat-btn').click();await p.waitForTimeout(300);
 ok(await p.locator('#uat-dlg .uat-example-btn',{hasText:'Back to my pharmacy'}).count()===1,'UAT window offers "Back to my pharmacy"');
 await Promise.all([p.waitForNavigation(),p.locator('#uat-dlg .uat-example-btn').click()]);await p.waitForTimeout(1500);
 const back=await p.evaluate(()=>({id:state.taskPharmacyId,name:state.pharmacyName,reviews:state.reviews.length,tasks:Object.keys(state.taskLedger).length,raw:localStorage.getItem(key)}));
 ok(back.id===mine.id&&back.name===mine.name&&back.reviews===mine.reviews&&back.tasks===mine.tasks,'own pharmacy back, same records');
 ok(back.raw===mine.raw,'own pharmacy storage byte-for-byte unchanged');
 ok(await p.evaluate(()=>localStorage.getItem(UAT.key))===notesBefore,'UAT notes unchanged');
 // reopening switches, does not duplicate
 await p.evaluate(()=>UAT.open());await p.waitForTimeout(200);
 ok(await p.locator('#uat-dlg .uat-example-btn',{hasText:'Open the example pharmacy again'}).count()===1,'second time says "Open the example pharmacy again"');
 await Promise.all([p.waitForNavigation(),p.locator('#uat-dlg .uat-example-btn').click()]);await p.waitForTimeout(1500);
 ok(await p.evaluate(()=>state.pharmacyName==='Wattle Grove Pharmacy'&&readSites().sites.length===2),'reopens the same example, no duplicate');
 ok(errs.length===0,'no page errors '+errs.slice(0,2).join(' | '));
 await b.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
