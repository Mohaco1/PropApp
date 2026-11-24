// UAT-only tester tools: question strip, notes, copy text, and no effect on app data.
const { chromium } = require('playwright');
const res=[];const ok=(n,p,d='')=>res.push({n,p:!!p,d:String(d).slice(0,300)});
(async()=>{const b=await chromium.launch();
for(const [dev,w,h] of [['laptop',1280,860],['phone',390,844]]){const p=await b.newPage({viewport:{width:w,height:h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto('file:///home/user/rpharmacy/uat/app/rpharmacy-uat-testing.html');await p.waitForTimeout(1500);await p.evaluate(()=>{if(D.phone){D.applyView(false);render();}});
ok(dev+' UAT notes button is shown',await p.evaluate(()=>!!document.getElementById('uat-btn')));
await p.evaluate(()=>{const n=clone();Object.assign(n,{freshSite:true,onboarded:true,freshProprietors:true,freshSelection:true,pharmacyName:'X',proprietors:[{id:'p1',name:'Alex Owner',primary:true}],currentReviewer:'p1',active:['daa']});n.serviceConfig={...(n.serviceConfig||{}),daa:{...(n.serviceConfig?.daa||{}),procedureProfile:{answers:{routes:'house',packing:'Manual Webster packs',population:'Community patients',preparation:'Pharmacists'}}}};commit(n,'t');RPH.express.set(false);fsCard('daa','listCheck');});await p.waitForTimeout(400);
const strip=await p.evaluate(()=>({has:!!document.querySelector('#editor .uat-strip'),says:document.querySelector('#editor .uat-says')?.textContent}));
ok(dev+' each setup question shows the UAT strip with what Express does',strip.has&&/Setup now shows this on “What most pharmacies do” as: Pharmacist verifies before packing/.test(strip.says),JSON.stringify(strip));
const before=await p.evaluate(()=>JSON.stringify(state));
await p.locator('#editor .uat-chip',{hasText:'Must always be asked'}).click();await p.fill('#editor .uat-note','Pharmacies differ here (test)');await p.waitForTimeout(900);
ok(dev+' marking a question changes no app data',before===await p.evaluate(()=>JSON.stringify(state)));
ok(dev+' the mark is kept in UAT notes only',await p.evaluate(()=>{const d=UAT.data();const q=d.questions['daa/listCheck'];return q&&q.choice==='ask'&&q.note==='Pharmacies differ here (test)'&&!JSON.stringify(portableBackup()).includes('Pharmacies differ here');}));
await p.evaluate(()=>{$('editor').close();CD.go('staff');});await p.waitForTimeout(200);
await p.click('#uat-btn');await p.waitForTimeout(200);
await p.fill('#uat-dlg .uat-new','Staff table feels busy (test)');await p.click('#uat-dlg .uat-add');await p.waitForTimeout(200);
const txt=await p.evaluate(()=>document.querySelector('#uat-dlg .uat-out').value);
ok(dev+' a general note is tagged with the page',/\[Staff\] Staff table feels busy/.test(txt),txt);
ok(dev+' copy text lists question marks and notes',/MUST ASK/.test(txt)&&/GENERAL NOTES/.test(txt),txt.slice(0,200));
await p.evaluate(()=>document.querySelector('#uat-dlg .uat-x').click());
ok(dev+' notes survive a reload',await (async()=>{await p.reload();await p.waitForTimeout(1500);return p.evaluate(()=>UAT.count()===2);})());
ok(dev+' no script errors',!errs.length,errs.join(' | '));await p.close();}
for(const x of res)console.log((x.p?'PASS ':'FAIL ')+x.n+(x.p?'':' · '+x.d));console.log(res.filter(x=>x.p).length+'/'+res.length+' passed');await b.close();})();
