// Today guide, grouping, plain words, landing and end-of-setup (design review #1, #3, #4, #6, #7). Display only. Fictional data.
const { chromium } = require('playwright');
const APP='file:///home/user/rpharmacy/uat/app/'+(process.env.FILE||'rpharmacy-uat-testing.html');
const res=[];const ok=(n,p,d='')=>res.push({n,p:!!p,d:String(d).slice(0,300)});
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:860}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto(APP);await p.waitForTimeout(1500);await p.evaluate(()=>{if(D.phone){D.applyView(false);render();}});
 const land=await p.evaluate(()=>$('main').innerText);
 ok('landing says what it does, how long setup takes and where records are kept',/What it does/.test(land)&&/15–20 minutes/.test(land)&&/you, the owner/.test(land)&&/In this browser on this device/.test(land),land.slice(0,300));
 const before=await p.evaluate(()=>JSON.stringify({t:state.taskLedger,s:state.schedule,r:state.reviews.length}));
 await p.evaluate(require('./showcase-seed.js'));await p.waitForTimeout(600);
 const seeded=await p.evaluate(()=>JSON.stringify({t:state.taskLedger,s:state.schedule,h:state.history.length}));
 await p.evaluate(()=>{if($('editor').open)$('editor').close();CD.st.f.today='all';CD.go('overview');});await p.waitForTimeout(400);
 const t=await p.evaluate(()=>({start:[...document.querySelectorAll('#cd-view .start3 .s3row .nm')].map(x=>x.textContent),txt:document.querySelector('#cd-view .status')?.innerText,groups:[...document.querySelectorAll('#cd-view tr[data-row^="today:group/"] .nm')].map(x=>x.textContent),badge:document.querySelector('header .c, .c')?.textContent}));
 ok('Today shows one card on top (no "Start with these 3")',t.start.length===0&&await p.evaluate(()=>document.querySelectorAll('#cd-view .main > .ob-card, #cd-view .main > .vcard, #cd-view .main > .bkline, #cd-view .main > .howcard, #cd-view .main > .ob-ready').length<=1),JSON.stringify(t.start));
 ok('actions about the same person are grouped as "Priya Nair’s checks" (with what is due now underneath)',t.groups.some(g=>/^Priya Nair’s checks$/.test(g)),JSON.stringify(t.groups));
 ok('the summary is the date and one sentence naming where to start',/3 things are overdue\. Start with “Proprietor site visit”/.test(t.txt),t.txt);
 ok('header badge says what it counts',/^\d+ overdue$/.test(t.badge||''),t.badge);
 // Show / hide a group
 await p.evaluate(()=>{const r=document.querySelector('#cd-view tr[data-row^="today:group/Priya Nair"]');r.click();});await p.waitForTimeout(300);
 await p.locator('#cd-view .pane button',{hasText:/^Show all/}).click();await p.waitForTimeout(300);
 const shown=await p.evaluate(()=>[...document.querySelectorAll('#cd-view tr[data-row^="today:"] .nm')].filter(x=>/Priya Nair$/.test(x.textContent)).length);
 ok('Show lists each grouped action again',shown>=3,shown);
 await p.locator('#cd-view .pane button',{hasText:'Hide them'}).click();await p.waitForTimeout(300);
 ok('Hide folds them again',await p.evaluate(()=>{const g=RPH.guide.group(CD.todayRows()).find(x=>x.subject==='Priya Nair');const shownIds=[...document.querySelectorAll('#cd-view tr[data-row^="today:"]')].map(r=>r.dataset.row.slice(6));return g&&g.members.every(m=>!shownIds.includes(m.id));}));
 ok('grouping and showing change no data',await p.evaluate(s=>JSON.stringify({t:state.taskLedger,s:state.schedule,h:state.history.length})===s,seeded));
 // Words
 const w=await p.evaluate(()=>{CD.go('overview');return document.body.innerText;});
 ok('no "Task"/"Tasks", "Audit" or "Cadence" on Today',!/\bTasks?\b|\bAudits?\b|Cadence/.test(w),(w.match(/.{0,30}(\bTasks?\b|\bAudits?\b|Cadence).{0,30}/)||[''])[0]);
 await p.evaluate(()=>{gotoPage('audits');RPH.sv.open(false);});await p.waitForTimeout(500);
 const rv=await p.evaluate(()=>$('editor').innerText);
 ok('review buttons read Next, Finish later, Finish review',/\bNext\b/.test(rv)&&/Finish later/.test(rv)&&/Finish review/.test(rv)&&!/Save and next|Review & complete/.test(rv));
 ok('review answer "Verify" reads "Check later"',/Check later/.test(rv)&&!/\bVerify\b/.test(rv));
 ok('"Before you start" leads with what is open from earlier visits (no "Tasks")',/Before you start · (\d+ open from earlier visits|nothing open from earlier visits)/.test(rv)&&!/Task/.test(rv),rv);
 await p.evaluate(()=>{if($('editor').open)$('editor').close();});
 // Typed text is never rewritten
 await p.evaluate(()=>{taskEditor();});await p.waitForTimeout(200);
 await p.evaluate(()=>{const i=[...$('editor').querySelectorAll('input[type=text],input:not([type]),textarea')].find(x=>x.offsetParent);i.value='Task for audit';i.dispatchEvent(new Event('input',{bubbles:true}));window.__i=i;});await p.waitForTimeout(200);
 ok('text you type is never changed',await p.evaluate(()=>window.__i.value==='Task for audit'));
 await p.evaluate(()=>{if($('editor').open)$('editor').close();});
 ok('no script errors',!errs.length,errs.join(' | '));
 for(const x of res)console.log((x.p?'PASS ':'FAIL ')+x.n+(x.p?'':' · '+x.d));console.log(res.filter(x=>x.p).length+'/'+res.length+' passed');await b.close();})();
