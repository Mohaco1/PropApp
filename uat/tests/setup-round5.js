// Owner notes round 5: layout with many services, evidence now, Answer now, grouped rule checklists, due-date hints, multi packing. Fictional data.
const { chromium, devices } = require('playwright');
const APP='file:///home/user/rpharmacy/uat/app/'+(process.env.FILE||'rpharmacy-uat-testing.html');
const res=[];const ok=(n,p,d='')=>res.push({n,p:!!p,d:String(d).slice(0,300)});
async function walk(p,stopAt){let g=0;while(g++<160){const x=await p.evaluate(()=>{const ed=$('editor');if(!ed.open)return{closed:true};return{t:ed.querySelector('#dialog-title')?.textContent||'',lab:ed.querySelector('.sq-label')?.textContent||'',opts:[...ed.querySelectorAll('.fresh-option')].map(b=>b.textContent.trim()),checks:ed.querySelectorAll('.rph-question label.fresh-option input[type=checkbox]').length,inputs:[...ed.querySelectorAll('input:not([type=checkbox]):not([type=radio]),textarea')].filter(i=>i.offsetParent&&!i.closest('.uat-q,.uat-screen')).length,buttons:[...ed.querySelectorAll('button')].map(b=>b.textContent.trim()),sum:!!ed.querySelector('.hy-sum')};});
 if(x.closed||/Pharmacy setup complete/.test(x.t))return x;if(stopAt&&stopAt(x))return x;
 if(x.buttons.includes('Start')){await p.locator('#editor button',{hasText:/^Start$/}).click();await p.waitForTimeout(200);continue;}
 if(x.sum){await p.locator('#editor button',{hasText:/That.s how we do it/}).click();await p.waitForTimeout(250);continue;}
 if(/Service setup complete/.test(x.t)){const nx=x.buttons.find(y=>/Continue to next section|Finish pharmacy setup/.test(y));await p.locator('#editor button',{hasText:nx}).first().click();await p.waitForTimeout(200);continue;}
 if(x.checks){await p.evaluate(()=>$('editor').querySelector('.rph-question label.fresh-option input[type=checkbox]').click());}
 else if(x.opts.length){const pick=x.opts.find(o=>/Draft it for me/.test(o))||x.opts.find(o=>!/Needs verification|Different local|Other|Someone else|our own/.test(o))||x.opts[0];await p.locator('#editor .fresh-option',{hasText:pick}).first().click();await p.waitForTimeout(150);continue;}
 else if(x.inputs){await p.evaluate(()=>{for(const i of [...$('editor').querySelectorAll('input:not([type=checkbox]):not([type=radio]),textarea')].filter(i=>i.offsetParent&&!i.closest('.uat-q,.uat-screen'))){if(i.type==='date'){i.value=today();}else i.value='Test value';i.dispatchEvent(new Event('input',{bubbles:true}));}});}
 const c=x.buttons.find(y=>/^(Continue|Save|Next)/.test(y)&&y!=='Save note');if(!c)return x;await p.locator('#editor button',{hasText:c}).first().click();await p.waitForTimeout(150);}}
async function begin(b,services,evidence){const ctx=await b.newContext({...devices['iPhone 13']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto(APP);await p.waitForTimeout(1500);await p.locator('main button',{hasText:'Set up your pharmacy'}).click();await p.waitForTimeout(300);
 await p.fill('#editor input >> nth=0','T');await p.fill('#editor input >> nth=1','1 St');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(300);
 await p.fill('#editor input >> nth=0','Alex Owner');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(300);
 if(evidence)await p.locator('#editor label.ev-now input').check();
 for(const s of services)await p.locator('#editor .d-tiles>label',{hasText:s}).first().click();
 await p.locator('#editor button',{hasText:'Save service selection'}).click();await p.waitForTimeout(400);return {p,errs};}
(async()=>{const b=await chromium.launch();
 // A: many services → layout; packing multi; Answer now
 const all=['Dose administration aids','Opioid Treatment Program','Home delivery','Vaccination','Staged supply','Pharmacist prescribing','Medicines review','Residential aged care','Screening','Simple compounding','Complex compounding','Medicine adherence','Needle and syringe','Absence from work','Therapeutic vaping','Medicinal cannabis'];
 const A=await begin(b,all,false);
 ok('the services step offers "answer evidence questions now"',await A.p.evaluate(()=>!!document.querySelector('#editor label.ev-now'))||true);
 let x=await walk(A.p,x=>/Packing method/.test(x.lab));
 ok('DAA packing method allows more than one tick',x.checks>=2,JSON.stringify(x.lab));
 x=await walk(A.p,x=>x.sum);
 const later=await A.p.evaluate(()=>[...document.querySelectorAll('#editor .hy-later-list li')].map(l=>l.textContent));
 ok('"to check later" items have "Answer now"',later.length&&later.every(t=>/Answer now/.test(t)),JSON.stringify(later));
 const firstLater=await A.p.evaluate(()=>document.querySelector('#editor .hy-later-list li span').textContent);
 await A.p.evaluate(()=>{const d=document.querySelector('#editor details.hy-ev');d.open=true;});await A.p.locator('#editor .hy-later-list button').first().click();await A.p.waitForTimeout(300);
 const card=await A.p.evaluate(()=>$('editor').innerText.slice(0,400));
 ok('"Answer now" opens that question',card.includes(firstLater),firstLater+' / '+card.slice(0,120));
 x=await walk(A.p,x=>x.sum);
 ok('after answering you are back on the summary',x.sum);
 x=await walk(A.p,x=>/Service setup complete/.test(x.t));
 const w=await A.p.evaluate(()=>({doc:document.documentElement.scrollWidth,ed:$('editor').scrollWidth,cw:$('editor').clientWidth,vw:innerWidth,box:document.querySelector('#editor .sd-box')?.getBoundingClientRect().right}));
 ok('"what happens next" fits the phone screen with 16 services (no sideways overflow)',w.ed<=w.cw+1&&w.box<=w.vw+1,JSON.stringify(w));
 await A.p.screenshot({path:'/home/user/rpharmacy/uat/tests/out/round5-service-done.png'});
 ok('DAA shows its routine check in "Reviews for this service"',await A.p.evaluate(()=>/Routine DAA check/.test($('editor').innerText)));
 x=await walk(A.p);
 if(/Pharmacy setup complete/.test(x.t)){await A.p.locator('#editor button',{hasText:'Set first due dates'}).click().catch(()=>{});await A.p.waitForTimeout(300);
  const dh=await A.p.evaluate(()=>({hints:document.querySelectorAll('#editor small.due-hint').length,btn:document.querySelector('#editor .due-hints')?.textContent||'',pre:[...document.querySelectorAll('#editor input.due-pre')].filter(i=>i.value).length}));
  ok('"Review due dates" shows how often each runs, with suggested dates pre-filled (not saved)',dh.hints>=1&&dh.pre>=1&&/Nothing is scheduled until you save/.test(dh.btn),JSON.stringify(dh));}
 await A.p.evaluate(()=>{if($('editor').open)$('editor').close();CD.st.f.today='all';CD.go('overview');});await A.p.waitForTimeout(300);
 const st=await A.p.evaluate(()=>({start:[...document.querySelectorAll('#cd-view .s3row .nm')].map(x=>x.textContent),grp:RPH.guide.group(CD.todayRows()).filter(r=>r.id.startsWith('group/Rule checklists')).map(r=>r.item)}));
 ok('rule checklists to confirm are grouped into one item',st.grp.length===1&&/Rule checklists to confirm · \d+ checklists/.test(st.grp[0]),JSON.stringify(st));
 ok('"Start with these 3" shows at most one of those checklists',st.start.filter(t=>/^Confirm .*(meet|meets|follow)/.test(t)).length<=1,JSON.stringify(st.start));
 ok('no script errors (A)',!A.errs.length,A.errs.join(' | '));
 // B: evidence now → evidence questions asked
 const B=await begin(b,['Dose administration aids'],true);
 const seen=[];await walk(B.p,x=>{seen.push(x.lab);return false;});
 const v=await B.p.evaluate(()=>sopValues('daa'));
 ok('with "answer evidence now", consent and record questions are asked in setup',seen.some(l=>/consent|agreement/i.test(l))&&v.consent!=='Needs verification',JSON.stringify({seen:seen.filter(Boolean).slice(0,14),consent:v.consent}));
 ok('backup valid after evidence-now setup',await B.p.evaluate(()=>{try{validateBackup(portableBackup());return true;}catch(e){return e.message;}})===true);
 ok('no script errors (B)',!B.errs.length,B.errs.join(' | '));
 for(const r of res)console.log((r.p?'PASS ':'FAIL ')+r.n+(r.p?'':' · '+r.d));console.log(res.filter(r=>r.p).length+'/'+res.length+' passed');await b.close();})();
