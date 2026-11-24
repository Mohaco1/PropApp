// Complete an S8 review through its real form (keys 1–4), checking the guard doesn't block a normal completion.
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:860}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto('file:///home/user/rpharmacy/uat/app/rpharmacy-uat-testing.html');await p.waitForTimeout(1500);
await p.evaluate(()=>{if(D.phone)D.applyView(false);const n=clone();Object.assign(n,{freshSite:true,onboarded:true,freshProprietors:true,freshSelection:true,pharmacyName:'X',proprietors:[{id:'p1',name:'Alex Owner',primary:true}],currentReviewer:'p1',active:['daa']});n.schedule.B1=addInterval(today(),5,'days');commit(n,'t');reviewEditor('B1');});
await p.waitForTimeout(400);
const kb=await p.evaluate(()=>[...$('editor').querySelectorAll('label.cd-opt')].map(l=>l.textContent.trim()));console.log('options with keys:',kb.join(' | '));
await p.evaluate(()=>document.querySelector('#editor input[name=q0]').focus());await p.keyboard.press('1');await p.waitForTimeout(150);
await p.locator('#editor .cd-revnav button',{hasText:/^Next$/}).click();await p.waitForTimeout(150);await p.keyboard.press('1');await p.waitForTimeout(150);
const ans=await p.evaluate(()=>[...$('editor').querySelectorAll('input[type=radio]:checked')].map(r=>r.name+'='+r.value).join(', '));console.log('answers:',ans);
console.log('visible fields now:',await p.evaluate(()=>[...$('editor').querySelectorAll('input,select,textarea')].filter(e=>e.offsetParent&&e.type!=='radio').map(e=>e.id||e.name).join(', ')));
await p.evaluate(()=>{const f=(id,v)=>{const e=$(id);if(e){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}};f('stock-date',addInterval(today(),-1,'days'));f('stock-pharmacist','Sam Taylor (fictional)');f('notes','Fictional test');});
const nd=await p.evaluate(()=>$('next-date')?.value);console.log('default next date:',nd,'limit:',await p.evaluate(()=>RPH.s8.limit()));
await p.evaluate(()=>{const names=[...new Set([...$('editor').querySelectorAll('input[type=radio]')].map(r=>r.name))].filter(n=>/^q([3-9]|1\d)$/.test(n));for(const n of names){const r=$('editor').querySelector('input[type=radio][name="'+n+'"]');if(r&&!$('editor').querySelector('input[name="'+n+'"]:checked')){r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}));}}});
await p.evaluate(()=>[...$('editor').querySelectorAll('button')].find(b=>/Complete review/.test(b.textContent)).click());await p.waitForTimeout(500);
const r=await p.evaluate(()=>({open:$('editor').open,reviews:state.reviews.filter(r=>r.audit==='B1').length,B1:state.schedule.B1,exp:addInterval(addInterval(today(),-1,'days'),3,'months'),sc:state.s8StorageChecked}));
const out=[['key hints restart at 1 for each question',kb[3]==='No1'&&kb[5]==='Addressed1'],['key 1 answers the question shown, step by step',ans==='q0=Completed, q1=No'],['next date follows the stock-check date',nd===r.exp],['an S8 review completes normally with the guard on',!r.open&&r.reviews===1&&r.B1===r.exp],['completing it records the yearly safe/fridge check date',!!r.sc],['no script errors',!errs.length]];
for(const [n,ok] of out)console.log((ok?'PASS ':'FAIL ')+n);console.log(out.filter(x=>x[1]).length+'/'+out.length+' passed');
await b.close();})();
