// End-to-end check of setup-questions changes through the Detailed flow (fictional data)
const { chromium } = require('playwright');
const res=[];const ok=(n,p,d='')=>res.push({n,p:!!p,d:String(d).slice(0,400)});
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto('file:///home/user/rpharmacy/uat/app/rpharmacy-uat-testing.html');await p.waitForTimeout(1500);
await p.evaluate(()=>{if(D.phone){D.applyView(false);render();}});
await p.locator('main button',{hasText:'Set up your pharmacy'}).click();await p.waitForTimeout(300);
await p.fill('#editor input >> nth=0','Test Pharmacy');await p.fill('#editor input >> nth=1','1 St');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(300);
await p.fill('#editor input >> nth=0','Alex');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(300);
await p.evaluate(()=>RPH.express.set(false));
for(const s of ['Vaccination','Home delivery','Residential aged care','Medicine adherence','Medicines review','Staged supply','Dose administration','Opioid Treatment','Medicinal cannabis','Screening','Simple compounding','Needle and syringe'])await p.locator('#editor .d-tiles>label',{hasText:s}).first().click();
await p.locator('#editor button',{hasText:'Save service selection'}).click();await p.waitForTimeout(400);
const seen=[];let guard=0;
while(guard++<300){const st=await p.evaluate(()=>{const ed=$('editor');if(!ed.open)return{closed:true};const q=ed.querySelector('.rph-question');return{t:ed.querySelector('#dialog-title')?.textContent||'',lab:q?[...q.querySelectorAll(':scope>p')].map(x=>x.textContent).slice(1,2)[0]:'',opts:[...ed.querySelectorAll('.fresh-option')].map(b=>b.textContent.trim()),checks:ed.querySelectorAll('.rph-question label.fresh-option:not(:has(+ #qm-describe-Other)) input[type=checkbox]').length,inputs:[...ed.querySelectorAll('input:not([type=checkbox]):not([type=radio]),textarea')].filter(i=>i.offsetParent&&!i.closest('.uat-q')).length,buttons:[...ed.querySelectorAll('button')].map(b=>b.textContent.trim())};});
 if(st.closed)break;
 if(/Service setup complete/.test(st.t)){const nx=st.buttons.find(x=>/Continue to next section|Finish pharmacy setup/.test(x));if(!nx)break;await p.locator('#editor button',{hasText:nx}).first().click();await p.waitForTimeout(250);continue;}
 if(/Pharmacy setup complete|first due dates|Initial review/i.test(st.t))break;
 seen.push(st.t+' | '+st.lab);
 if(st.checks){await p.evaluate(()=>{const c=$('editor').querySelectorAll('.rph-question label.fresh-option:not(:has(+ #qm-describe-Other)) input[type=checkbox]');c[0].checked||c[0].click();if(c[1]&&!c[1].checked)c[1].click();});}
 else if(st.opts.length){const pick=st.opts.find(o=>/Draft it for me/.test(o))||st.opts.find(o=>!/Needs verification|Different local|Other|Someone else|our own/.test(o))||st.opts[0];await p.locator('#editor .fresh-option',{hasText:pick}).first().click();await p.waitForTimeout(200);continue;}
 else if(st.inputs){await p.evaluate(()=>{for(const i of [...$('editor').querySelectorAll('input:not([type=checkbox]):not([type=radio]),textarea')].filter(i=>i.offsetParent&&!i.closest('.uat-q'))){i.value='Test value';i.dispatchEvent(new Event('input',{bubbles:true}));}});}
 const cont=st.buttons.find(x=>/^(Continue|Save|Next)/.test(x));if(!cont)break;await p.locator('#editor button',{hasText:cont}).first().click();await p.waitForTimeout(200);}
const fin=await p.evaluate(()=>({t:$('editor').open&&$('editor').querySelector('#dialog-title')?.textContent,text:$('editor').innerText,f3:$('editor').querySelector('.first3')?.innerText||'',btn:[...$('editor').querySelectorAll('button')].map(b=>b.textContent),primary:[...$('editor').querySelectorAll('.fresh-form button.primary')].map(b=>b.textContent).join('|')}));
ok('end of setup: if reviews have no dates, "first due dates" is the last step (main button) with "Skip for now"; otherwise the first 3 things and Go to Today',fin.t==='Pharmacy setup complete'&&((/Last step · first due dates/.test(fin.text)&&fin.primary==='Set first due dates'&&fin.btn.includes('Skip for now'))||(/Your first 3 things/.test(fin.f3)&&fin.primary==='Go to Today')),JSON.stringify(fin).slice(0,400));
const leadQs=seen.filter(x=>/Who runs your services/.test(x));
ok('no "who is responsible" question is asked at all (owner decision)',leadQs.length===0&&!seen.some(x=>/Who does the routine DAA check/.test(x)),JSON.stringify(leadQs));
ok('no other per-service "who is responsible" questions',!seen.some(x=>/Who is responsible for this service|Who receives delivery incidents|Who reviews missed collections|Who handles interrupted support/.test(x)),seen.filter(x=>/Who/.test(x)).join(' ; '));
ok('the optional "how many packs" question is gone',!seen.some(x=>/How many packs/.test(x)));
const s=await p.evaluate(()=>({lead:state.serviceLead,done:state.active.map(id=>[id,!!state.serviceConfig?.[id]?.complete]),v:sopValues('vaccination'),st:sopValues('staged'),ad:sopValues('adherence'),dl:sopValues('delivery'),vdoc:RPH.sop.document('vaccination'),ddoc:RPH.sop.document('delivery'),sdoc:RPH.sop.document('staged'),aged:sopDocument('aged')}));
ok('every service completes',s.done.every(x=>x[1]),JSON.stringify(s.done));
ok('procedures name the pharmacist in charge by default',s.st.exceptions==='Pharmacist in charge'&&s.ad.interruption==='Pharmacist in charge'&&s.dl.escalation==='Pharmacist in charge',JSON.stringify([s.st.exceptions,s.ad.interruption,s.dl.escalation]));
ok('vaccines are ticked from the list',/COVID-19/.test(s.v.vaccines),s.v.vaccines);
ok('funded programs tick more than one',s.v.funding==='National Immunisation Program (NIP),NSW state-funded vaccines',s.v.funding);
ok('record location picked from list',/AIR\) portal/.test(s.v.air),s.v.air);
ok('"Draft it for me" writes the emergency steps into the vaccination procedure',/anaphylaxis response kit/.test(s.vdoc)&&!/kept at Draft it/.test(s.vdoc),s.vdoc.split('\n').filter(l=>/naphyla|Draft it/.test(l)).join(' / '));
ok('procedure reads the lead role naturally (the pharmacist on duty)',/reported to the pharmacist on duty/.test(s.ddoc)&&/reviewed by the pharmacist on duty/.test(s.sdoc));
ok('aged care procedure gets drafted handover steps',/registered nurse in charge/.test(s.aged||''),(s.aged||'').slice(0,300));
const r3=await p.evaluate(()=>({otp:sopValues('otp'),doc:sopDocument('otp')||'',tasks:Object.values(state.taskLedger||{}).map(t=>t.text),can:sopValues('cannabis'),scr:sopValues('screening'),sim:sopValues('simple'),done:['otp','cannabis','screening','simple','nsp'].map(id=>!!state.serviceConfig?.[id]?.complete)}));
ok('round 3 services complete (OTP, cannabis, screening, compounding, NSP)',r3.done.every(Boolean),JSON.stringify(r3.done));
ok('LAIB is asked inside the medicines question, not separately',!seen.some(x=>/Do pharmacists administer long-acting/.test(x))&&seen.some(x=>/Which OTP medicines/.test(x)));
ok('OTP procedures offer Draft it for me; one action "Finish your OTP procedure" covers them',r3.otp.incidents==='Draft it for me'&&r3.tasks.filter(t=>/OTP procedure/.test(t)).length===1&&r3.tasks.some(t=>/Finish your OTP procedure/.test(t)),r3.otp.incidents+' / '+r3.tasks.filter(t=>/OTP/.test(t)).join(';'));
ok('no "done but not written down" anywhere in setup',!seen.some(x=>/not written down/i.test(x)));
ok('cannabis asks the THC (S8) question and no records or pathway questions',r3.can.thc&&!seen.some(x=>/Medicinal cannabis.*(records kept|Access pathway)/.test(x)),JSON.stringify(r3.can));
ok('screening and compounding use tick lists',/Blood pressure/.test(r3.scr.tests)&&/Creams/.test(r3.sim.preparations),r3.scr.tests+' / '+r3.sim.preparations);
ok('NSP has no records question',!seen.some(x=>/Needle and syringe.*records kept/.test(x)));
const rv=await p.evaluate(()=>{const f=a=>fsFields('reviews',a).map(x=>x[0]);const n=clone();sopSet(n,'reviews',{program:'RMMR only',RMMRreviewer:'Pharmacy credentialed pharmacist'});return{own:f({program:'HMR only',HMRreviewer:'Pharmacy credentialed pharmacist'}),ext:f({program:'HMR only',HMRreviewer:'External credentialed pharmacist'}),filled:sopValues('reviews',n)};});
ok('HMR/RMMR: own pharmacist means no referral or claim questions, filled as The pharmacy',!rv.own.includes('HMRreferral')&&!rv.own.includes('HMRclaimant')&&rv.filled.RMMRclaimant==='The pharmacy'&&rv.filled.RMMRreferral==='The pharmacy',JSON.stringify(rv));
ok('HMR/RMMR: external pharmacist means referral and claim are asked',rv.ext.includes('HMRreferral')&&rv.ext.includes('HMRclaimant'),JSON.stringify(rv.ext));
// own procedure path
await p.evaluate(()=>fsCard('vaccination','emergency'));await p.waitForTimeout(200);
await p.locator('#editor .fresh-option',{hasText:'We already have our own'}).click();await p.waitForTimeout(200);
await p.fill('#editor textarea','Red folder, dispensary shelf');await p.locator('#editor button',{hasText:/^Save$/}).click();await p.waitForTimeout(300);
for(let i=0;i<8;i++){const t=await p.evaluate(()=>$('editor').open?$('editor').querySelector('#dialog-title')?.textContent:'');if(!t||/complete/.test(t))break;const bt=await p.evaluate(()=>[...$('editor').querySelectorAll('button')].map(b=>b.textContent.trim()));const c=bt.find(x=>/^(Continue|Save)/.test(x));if(!c)break;await p.locator('#editor button',{hasText:c}).first().click();await p.waitForTimeout(200);}
const own=await p.evaluate(()=>({v:sopValues('vaccination').emergency,doc:RPH.sop.document('vaccination')}));
ok('"We already have our own" records where it is and the procedure points to it',/^We have our own procedure: Red folder/.test(own.v)&&/own emergency \(anaphylaxis\) procedure \(Red folder; dispensary shelf\)/.test(own.doc),own.v+' / '+own.doc.split('\n').find(l=>/own emergency/.test(l)));
// border on DAA routes
await p.evaluate(()=>fsCard('daa','routes'));await p.waitForTimeout(200);
const bw=await p.evaluate(()=>{const l=$('editor').querySelector('.rph-question>label.fresh-option');const cs=getComputedStyle(l);return cs.borderTopWidth+' '+cs.borderTopStyle+' '+cs.borderTopColor;});
ok('DAA packing choices have a border',/^1px solid/.test(bw),bw);await p.screenshot({path:'/home/user/rpharmacy/uat/tests/out/setup-routes.png'});
ok('no script errors',!errs.length,errs.join(' | '));
for(const x of res)console.log((x.p?'PASS ':'FAIL ')+x.n+(x.p?'':' · '+x.d));console.log(res.filter(x=>x.p).length+'/'+res.length+' passed');console.log('questions seen:',seen.length);
await b.close();})();
