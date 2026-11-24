// Backup works after real setup in Express, in Detailed, and halfway through Express (found 20 Nov 2026: Express drafts made backups fail). Fictional data.
const { chromium } = require('playwright');
const APP='file:///home/user/rpharmacy/uat/app/'+(process.env.FILE||'rpharmacy-uat-testing.html');
const res=[];const ok=(n,p,d='')=>res.push({n,p:!!p,d:String(d).slice(0,300)});
async function run(b,mode,stopAfter,multi){
 const p=await b.newPage({viewport:{width:1280,height:860}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto(APP);await p.waitForTimeout(1500);await p.evaluate(()=>{if(D.phone){D.applyView(false);render();}});
 await p.locator('main button',{hasText:'Set up your pharmacy'}).click();await p.waitForTimeout(300);
 await p.fill('#editor input >> nth=0','Harbourview Test Pharmacy');await p.fill('#editor input >> nth=1','1 Test Street');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(300);
 await p.fill('#editor input >> nth=0','Alex Owner');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(300);
 if(mode==='Detailed')await p.evaluate(()=>RPH.express.set(false));
 for(const s of (multi?['Dose administration aids','Home delivery','Vaccination','Medicines review']:['Dose administration aids','Home delivery']))await p.locator('#editor .d-tiles>label',{hasText:s}).first().click();
 await p.locator('#editor button',{hasText:'Save service selection'}).click();await p.waitForTimeout(400);
 let guard=0,answered=0;
 while(guard++<120){const x=await p.evaluate(()=>{const ed=$('editor');if(!ed.open)return{closed:true};return{t:ed.querySelector('#dialog-title')?.textContent||'',opts:[...ed.querySelectorAll('.fresh-option')].map(b=>b.textContent.trim()),checks:ed.querySelectorAll('.rph-question label.fresh-option:not(:has(+ #qm-describe-Other)) input[type=checkbox]').length,inputs:[...ed.querySelectorAll('input:not([type=checkbox]):not([type=radio]),textarea')].filter(i=>i.offsetParent&&!i.closest('.uat-q')).length,buttons:[...ed.querySelectorAll('button')].map(b=>b.textContent.trim())};});
  if(x.closed||/Pharmacy setup complete/.test(x.t))break;if(stopAfter&&answered>=stopAfter)break;
  if(x.buttons.includes('Start')){await p.locator('#editor button',{hasText:/^Start$/}).click();await p.waitForTimeout(250);continue;}
  if(x.buttons.some(y=>/That.s how we do it/.test(y))){await p.locator('#editor button',{hasText:/That.s how we do it/}).click();await p.waitForTimeout(250);continue;}
  if(/Service setup complete/.test(x.t)){const nx=x.buttons.find(y=>/Continue to next section|Finish pharmacy setup/.test(y));await p.locator('#editor button',{hasText:nx}).first().click();await p.waitForTimeout(250);continue;}
  answered++;
  if(x.checks){await p.evaluate(m=>{const c=$('editor').querySelectorAll('.rph-question label.fresh-option:not(:has(+ #qm-describe-Other)) input[type=checkbox]');c[0].click();if(m&&c[1])c[1].click();},!!multi);}
  else if(x.opts.length){const pick=x.opts.find(o=>/Draft it for me/.test(o))||x.opts.find(o=>!/Needs verification|Different local|Other|Someone else|our own/.test(o))||x.opts[0];await p.locator('#editor .fresh-option',{hasText:pick}).first().click();await p.waitForTimeout(200);continue;}
  else if(x.inputs){await p.evaluate(()=>{for(const i of [...$('editor').querySelectorAll('input:not([type=checkbox]):not([type=radio]),textarea')].filter(i=>i.offsetParent&&!i.closest('.uat-q'))){i.value='Test value';i.dispatchEvent(new Event('input',{bubbles:true}));}});}
  const c=x.buttons.find(y=>/^(Continue|Save|Next)/.test(y));if(!c)break;await p.locator('#editor button',{hasText:c}).first().click();await p.waitForTimeout(200);}
 const r=await p.evaluate(()=>{try{const b=portableBackup();validateBackup(b);return 'valid';}catch(e){return e.message;}});
 const bad=await p.evaluate(()=>{const b=portableBackup();const c=Object.values(b.data.serviceConfig).find(x=>x.procedureProfile?.answers);if(!c)return 'no answers';const k=Object.keys(c.procedureProfile.answers).find(k=>!sopIsSoftware(k)&&(sopFieldsFor(c.serviceId).find(f=>f[0]===k)||[])[2]);c.procedureProfile.answers[k]='Made-up answer';try{validateBackup(b);return 'accepted';}catch(e){return e.message;}});
 if(bad!=='no answers')res.push({n:mode+(multi?' (several ticks)':'')+': a made-up answer is still rejected',p:/Invalid service procedure configuration/.test(bad),d:bad});
 await p.close();return {r,errs};
}
(async()=>{const b=await chromium.launch();
 const e=await run(b,'Express');ok('backup is valid after Express setup',e.r==='valid',e.r);
 const d=await run(b,'Detailed');ok('backup is valid after Detailed setup',d.r==='valid',d.r);
 const m=await run(b,'Detailed',0,true);ok('backup is valid after Detailed setup with several boxes ticked (DAA, delivery, vaccination, reviews)',m.r==='valid',m.r);
 const h=await run(b,'Express',2);ok('backup is valid halfway through Express setup',h.r==='valid',h.r);
 ok('no script errors',![...e.errs,...d.errs,...h.errs,...m.errs].length,[...e.errs,...d.errs,...h.errs,...m.errs].join(' | '));
 for(const x of res)console.log((x.p?'PASS ':'FAIL ')+x.n+(x.p?'':' · '+x.d));console.log(res.filter(x=>x.p).length+'/'+res.length+' passed');await b.close();})();
