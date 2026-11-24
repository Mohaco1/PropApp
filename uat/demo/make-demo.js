// Builds the fictional example pharmacy by driving the real app (setup, reviews, actions, staff) with the browser clock
// stepped through a year. Output: demo/wattle-grove.json (state + drafts + the date it was generated). Fictional data only.
const { chromium } = require('playwright');const fs=require('fs');
const APP='file:///home/user/rpharmacy/uat/app/rpharmacy-uat-testing.html';
const DAY=864e5;const T0=new Date(process.env.DEMO_TODAY||new Date().toISOString().slice(0,10));T0.setUTCHours(0,0,0,0);
const at=(d,h=10)=>new Date(T0.getTime()+d*DAY+h*36e5-10*36e5);           // day offset from "today" (Sydney ~10am → UTC 0)
const iso=d=>new Date(T0.getTime()+d*DAY).toISOString().slice(0,10);
const TEXT=[[/pharmacy name/i,'Wattle Grove Pharmacy'],[/address/i,'48 Wattle Grove Road, Fictional Heights NSW 2999'],[/proprietor name/i,'Jordan Avery'],
 [/consent/i,'DAA consent folder, dispensary shelf 2 (paper) and scanned to the PharmaDesk patient file'],[/collection or delivery records|delivery records|delivery evidence|handover/i,'Delivery and collection log book, front counter drawer'],
 [/packing record|signoff|sign-off/i,'Packing sign-off sheets, DAA bench binder'],[/provider|packer|agreement/i,'Northside Packing Co (fictional) · service agreement in the office filing cabinet'],
 [/software|system/i,'PharmaDesk (fictional dispensing system)'],[/fridge|temperature|logger/i,'Vaccine fridge log, clipboard on the fridge; logger downloads in the shared drive “Vaccines/Logger”'],
 [/OTP|dosing|methadone|buprenorphine/i,'OTP dosing book and OTP folder in the locked dispensary cabinet'],[/staged/i,'Staged supply register, dispensary drawer 3'],
 [/record|kept|location|where/i,'Office filing cabinet, drawer 1 (fictional)']];
const textFor=l=>{for(const [re,v] of TEXT)if(re.test(l))return v;return 'Fictional answer';};
const NV=[/Where are pack collection or delivery records kept/i];   // one detail left for verification
async function setup(p,opts={}){
 await p.goto(APP);await p.waitForTimeout(1500);await p.evaluate(()=>{if(D.phone){D.applyView(false);render();}});
 await p.locator('main button',{hasText:'Set up your pharmacy'}).click();await p.waitForTimeout(300);
 await p.fill('#editor input >> nth=0','Wattle Grove Pharmacy');await p.fill('#editor input >> nth=1','48 Wattle Grove Road, Fictional Heights NSW 2999');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(300);
 await p.fill('#editor input >> nth=0','Jordan Avery');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(400);
 for(const s of ['Dose administration aids','Staged supply','Opioid','Vaccination','Home delivery'])await p.locator('#editor .d-tiles>label',{hasText:s}).first().click();
 if(opts.evidence)await p.evaluate(()=>{const c=[...$('editor').querySelectorAll('input[type=checkbox]')].find(i=>/Also answer evidence/i.test(i.closest('label')?.textContent||''));if(c&&!c.checked)c.click();});
 await p.locator('#editor button',{hasText:'Save service selection'}).click();await p.waitForTimeout(500);
 let guard=0,nvDone=false;
 while(guard++<400){
  const x=await p.evaluate(()=>{const ed=$('editor');if(!ed.open)return {closed:true};const vis=e=>e.offsetParent&&!e.closest('.uat-screen,.uat-strip');
   return {t:ed.querySelector('#dialog-title')?.textContent||'',q:(ed.querySelector('.rph-question')?.innerText||'').split('\n').find(l=>l.trim().length>8&&!/^Step|^Question/.test(l))||'',
    btns:[...ed.querySelectorAll('button')].filter(vis).map(b=>b.textContent.trim()).filter(Boolean),
    opts:[...ed.querySelectorAll('.fresh-option')].filter(vis).map(o=>o.textContent.trim()),
    checks:[...ed.querySelectorAll('.rph-question input[type=checkbox]')].filter(vis).length,
    inputs:[...ed.querySelectorAll('.rph-question input:not([type=checkbox]):not([type=radio]),.rph-question textarea')].filter(vis).map(i=>(i.closest('label')?.textContent||i.placeholder||'').trim()+'|'+i.value)};});
  if(x.closed||/Pharmacy setup complete/.test(x.t))break;
  if(x.btns.includes('Start')){await p.locator('#editor button',{hasText:/^Start$/}).click();await p.waitForTimeout(250);continue;}
  if(x.btns.some(y=>/That.s how we do it/.test(y))){await p.locator('#editor button',{hasText:/That.s how we do it/}).first().click();await p.waitForTimeout(250);continue;}
  if(/Service setup complete/.test(x.t)){const nx=x.btns.find(y=>/Continue to next section|Finish pharmacy setup|Next service/.test(y));if(!nx){console.log('end?',x.btns);break;}await p.locator('#editor button',{hasText:nx}).first().click();await p.waitForTimeout(300);continue;}
  if(!nvDone&&NV.some(r=>r.test(x.q))&&x.btns.includes('Mark as needs verification')){nvDone=true;await p.locator('#editor button',{hasText:'Mark as needs verification'}).first().click();await p.waitForTimeout(300);continue;}
  if(x.checks){await p.evaluate(()=>{const c=[...$('editor').querySelectorAll('.rph-question input[type=checkbox]')].filter(e=>e.offsetParent);const lab=i=>i.closest('label')?.textContent||'';
    const want=c.filter(i=>/COVID|Influenza|Pneumococcal|Zoster|dTpa|RSV|Paper|Electronic|National Immunisation|NSW state|Machine|Manual|Pharmacists|Technicians|Aged|Community|Collected|Delivered|Methadone|Buprenorphine|Pharmacist/.test(lab(i)));(want.length?want:c.slice(0,1)).forEach(i=>{if(!i.checked)i.click();});});}
  else if(x.opts.length){const pick=x.opts.find(o=>/Draft it for me/.test(o))||x.opts.find(o=>!/Needs verification|Different local|^Other|Someone else|our own|Not offered|No$/i.test(o))||x.opts[0];
   await p.locator('#editor .fresh-option',{hasText:pick}).first().click();await p.waitForTimeout(220);
   const still=await p.evaluate(()=>[...$('editor').querySelectorAll('button')].some(b=>b.offsetParent&&/^(Continue|Save|Next)/.test(b.textContent.trim())&&b.textContent.trim()!=='Save note'));if(!still)continue;}
  if(x.inputs.length){await p.evaluate(m=>{const vis=e=>e.offsetParent&&!e.closest('.uat-screen,.uat-strip');for(const i of [...$('editor').querySelectorAll('.rph-question input:not([type=checkbox]):not([type=radio]),.rph-question textarea')].filter(vis)){if(i.value)continue;const l=(i.closest('label')?.textContent||i.placeholder||'')+' '+($('editor').querySelector('.rph-question')?.innerText||'');i.value=window.__tf(l);i.dispatchEvent(new Event('input',{bubbles:true}));}},null);}
  const c=await p.evaluate(()=>[...$('editor').querySelectorAll('button')].filter(b=>b.offsetParent&&!b.closest('.uat-screen')).map(b=>b.textContent.trim()).find(y=>/^(Continue|Save|Next)/.test(y)&&y!=='Save note'));
  if(!c){console.log('stuck',JSON.stringify(x).slice(0,400));break;}
  await p.locator('#editor button',{hasText:c}).first().click();await p.waitForTimeout(220);}
 await p.evaluate(()=>{if($('editor').open)$('editor').close();});
}
const tfSource=`l=>{const T=${JSON.stringify(TEXT.map(([r,v])=>[r.source,r.flags,v]))};for(const [s,f,v] of T)if(new RegExp(s,f).test(l))return v;return 'Office filing cabinet, drawer 1 (fictional)';}`;
module.exports={setup,at,iso,T0,DAY,APP,textFor,tfSource};
if(require.main===module)(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();p.on('dialog',d=>d.accept());const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.clock.install({time:at(-365)});
 await p.exposeFunction('__tfx',l=>textFor(l));await p.addInitScript(`window.__tf=l=>{const T=${JSON.stringify(TEXT.map(([r,v])=>[r.source,r.flags,v]))};for(const [s,f,v] of T)if(new RegExp(s,f).test(l))return v;return 'Fictional answer';};`);
 await setup(p);
 console.log(await p.evaluate(()=>JSON.stringify({today:today(),name:state.pharmacyName,active:state.active,pending:fsPending(),docs:procedureDocs().map(d=>d.title||d.name||d.id).slice(0,10),cat:catalog().filter(a=>!a.service||state.active.includes(a.service)).map(a=>a.id+'|'+(a.frequency||'')+(a.eventOnly?'|event':'')),unknowns:fsUnknowns().map(u=>u.label)})));
 console.log('errs',errs);await b.close();})();
