const { chromium } = require('playwright');const M=require('./make-demo.js');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1280,height:900}})).newPage();p.on('dialog',d=>d.accept());
 await p.clock.install({time:M.at(-365)});await p.addInitScript(`window.__tf=l=>'Fictional answer';`);await M.setup(p);await p.clock.setFixedTime(M.at(-330));
 for(const id of ['daa-house','service-vaccination','vacc-storage']){
 await p.evaluate(id=>{if($('editor').open)$('editor').close();reviewEditor(id);},id);await p.waitForTimeout(500);
 console.log(id,(await p.evaluate(()=>$('editor').innerText.slice(0,700))).replace(/\n+/g,' | '));if(0)console.log(id,await p.evaluate(()=>{const ed=$('editor');const cur=ed.querySelector('.cd-cur,fieldset:not([hidden])')||ed;return JSON.stringify({cls:ed.className,forms:[...ed.querySelectorAll('form')].map(f=>f.id),first:(ed.querySelector('fieldset')?.outerHTML||'').slice(0,900),segs:ed.querySelectorAll('.rph-seg button').length,radios:ed.querySelectorAll('input[type=radio]').length,checks:ed.querySelectorAll('input[type=checkbox]').length,sel:ed.querySelectorAll('select').length,sub:[...ed.querySelectorAll('button[type=submit],input[type=submit]')].map(b=>b.textContent||b.value)});}).then(s=>s.slice(0,1600)));}
 await b.close();})();
