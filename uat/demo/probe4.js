const { chromium } = require('playwright');const M=require('./make-demo.js');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1280,height:900}})).newPage();p.on('dialog',d=>d.accept());
 await p.clock.install({time:M.at(-365)});await p.addInitScript(`window.__tf=l=>'Fictional answer';`);await M.setup(p);
 console.log(await p.evaluate(()=>JSON.stringify({flags:state.flags,app:catalog().filter(a=>a.service&&state.active.includes(a.service)).map(a=>a.id+':'+(isActive(a)?'on':'PREVIEW')+(a.flag?'('+a.flag+')':'')+(a.flags?'('+JSON.stringify(a.flags)+')':''))})));
 console.log(await p.evaluate(()=>String(applicable).slice(0,700)));
 await b.close();})();
