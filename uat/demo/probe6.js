const { chromium } = require('playwright');const M=require('./make-demo.js');const {completeReview}=require('./review-filler.js');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1280,height:900}})).newPage();p.on('dialog',d=>d.accept());
 await p.clock.install({time:M.at(-365)});await p.addInitScript(`window.__tf=${M.tfSource};`);await M.setup(p,{evidence:true});await p.clock.setFixedTime(M.at(-335));
 await p.evaluate(()=>{reviewEditor('service-otp');});await p.waitForTimeout(500);
 console.log(await p.evaluate(()=>[...$('editor').querySelectorAll('select')].map(s=>(s.id||s.name)+'='+[...s.options].map(o=>o.value).join('/')).join('\n')));
 await p.evaluate(()=>$('editor').close());
 const r=await completeReview(p,'service-otp',{date:M.iso(-335)});
 console.log(JSON.stringify(r),await p.evaluate(()=>{const r=state.reviews.at(-1);let v='ok';try{validateBackup(portableBackup());}catch(e){v=e.message;}return JSON.stringify({sa:r.serviceAssurance,tasks:Object.values(state.taskLedger).map(t=>t.text.slice(0,90)),v});}));
 await b.close();})();
