const { chromium } = require('playwright');const M=require('./make-demo.js');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1280,height:900}})).newPage();p.on('dialog',d=>d.accept());const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.clock.install({time:M.at(-365)});await p.addInitScript(`window.__tf=${M.tfSource};`);await M.setup(p,{evidence:true});await p.clock.setFixedTime(M.at(-275));
 const val=()=>p.evaluate(()=>{try{validateBackup(portableBackup());return 'valid';}catch(e){return e.message;}});
 await p.evaluate(()=>{if($('editor').open)$('editor').close();RPH.sv.open(false);});await p.waitForTimeout(600);
 const n=await p.evaluate(()=>document.querySelectorAll('#editor .sv-item').length);
 for(let i=0;i<n;i++){await p.keyboard.press('1');await p.waitForTimeout(120);if(i<n-1){await p.locator('#editor .cd-svnav button').nth(1).click();await p.waitForTimeout(120);}}
 // answer any follow-up prompts on service checks with No
 for(let k=0;k<6;k++){const still=await p.evaluate(()=>[...document.querySelectorAll('#editor .cd-blockers li span')].map(x=>x.textContent));if(!still.length)break;
  await p.locator('#editor .cd-blockers button').first().click();await p.waitForTimeout(200);const no=p.locator('#editor .sv-item.cd-cur .sv-item-body button',{hasText:/^No$/});const c=await no.count();for(let j=0;j<c;j++){await no.nth(j).click();await p.waitForTimeout(120);}}
 await p.locator('#editor .cd-svnav button').nth(1).click().catch(()=>{});await p.waitForTimeout(300);
 if(!(await p.evaluate(()=>!!document.querySelector('#editor .sv-confirm'))))await p.locator('#editor #sv-complete').click().catch(()=>{});await p.waitForTimeout(300);
 await p.locator('#editor button',{hasText:'Complete visit'}).click().catch(e=>console.log('no complete',e.message.slice(0,80)));await p.waitForTimeout(500);
 console.log('UI visit saved:',await p.evaluate(()=>state.reviews.filter(r=>r.audit==='Q1').length),'serviceAssurance:',await p.evaluate(()=>JSON.stringify(state.reviews.at(-1)?.serviceAssurance||null)),'backup:',await val(),errs);
 await b.close();})();
