// Compare visible controls in key dialogs between v27 and UAT
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const res={};
for(const [name,app] of [['dev','/home/user/rpharmacy/dev/proprietor-hub.html'],['uat','/home/user/rpharmacy/uat/app/rpharmacy-uat-v28-conceptD.html']]){
const p=await b.newPage({viewport:{width:1280,height:860}}); await p.addInitScript(()=>{try{localStorage.setItem('rph-uat-view','laptop')}catch(e){}});await p.goto('file://'+app);await p.waitForTimeout(1500); await p.evaluate(()=>{try{if(D.phone){D.applyView(false);render();}}catch(e){}});
await p.evaluate(()=>{const n=clone();Object.assign(n,{freshSite:true,onboarded:true,freshProprietors:true,freshSelection:true,pharmacyName:'X',proprietors:[{id:'p1',name:'T',primary:true}],currentReviewer:'p1',active:['daa','otp','vaccination']});n.staff=[{id:'s1',person:'Alex Fictional',role:'Pharmacist',active:true,services:['vaccination'],annualDue:'2026-11-10',credentials:[]}];commit(n,'t');});
const vis=()=>[...document.querySelectorAll('#editor input,#editor select,#editor textarea,#editor button')].filter(e=>e.offsetParent!==null||e.getClientRects().length).map(e=>(e.labels?.[0]?.textContent||e.textContent||e.name||e.type).trim().slice(0,30));
const out={};
for(const [k,fn] of [['task',()=>{gotoPage('actions');[...document.querySelectorAll('main button')].find(b=>b.textContent==='Add Task').click();}],['review',()=>reviewEditor('B1')],['otp',()=>reviewEditor('otp-full')],['staff',()=>staffEditor()],['schedule',()=>RPH.schedule.dialog('B1')],['meeting',()=>editMeeting('M2')],['assure',()=>staffAssurance(false,'s1')]]){
 try{await p.evaluate(fn);await p.waitForTimeout(300);out[k]=await p.evaluate(vis);}catch(e){out[k]='ERR '+e.message.slice(0,80);}
 await p.evaluate(()=>{if($('editor').open)$('editor').close();});}
for(const pg of ['overview','audits','actions','staff','documents','meetings','services','history']){await p.evaluate(x=>gotoPage(x),pg);await p.waitForTimeout(300);out['page:'+pg]=await p.evaluate(()=>[...document.querySelectorAll('main input,main select,main textarea,main button')].filter(e=>!e.closest('.d-qhead,.d-pane,.d-pane-empty')&&(e.getClientRects().length)).map(e=>(e.labels?.[0]?.textContent||e.getAttribute('aria-label')||e.textContent||e.type).trim().replace(/\s+/g,' ').slice(0,30)));}
res[name]=out;await p.close();}
for(const k of Object.keys(res.dev)){const norm=x=>Array.isArray(x)?[...x].map(v=>v.replace(/^(\d+)\s?/,'$1').toLowerCase().slice(0,22)).sort():x;const a=JSON.stringify(norm(res.dev[k])),c=JSON.stringify(norm(res.uat[k]));console.log(k.padEnd(9),a===c?'SAME ('+(res.dev[k].length)+' controls)':'DIFF\n dev '+a.slice(0,300)+'\n uat '+c.slice(0,300));}
await b.close();})();
