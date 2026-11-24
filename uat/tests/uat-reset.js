// UAT reset: clears this browser's test data, keeps the view preference and (local) notes.
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:860}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.dismiss());await p.addInitScript(()=>{window.confirm=()=>false;});
await p.goto('file:///home/user/rpharmacy/uat/app/rpharmacy-uat-testing.html');await p.waitForTimeout(1500);
await p.evaluate(require('./showcase-seed.js'));await p.evaluate(()=>{D.applyView(false);UAT.addNote({kind:'note',page:'Today',text:'keep me'});});await p.waitForTimeout(400);
const before=await p.evaluate(()=>({n:state.pharmacyName,staff:(state.staff||[]).length,sites:siteDirectory().sites.length}));
await p.click('#uat-btn');await p.waitForTimeout(200);
await Promise.all([p.waitForNavigation({timeout:15000}).catch(()=>null),p.evaluate(()=>{const b=document.querySelector('#uat-dlg .uat-reset-btn');b.click();window.__armed=b.textContent;b.click();})]);await p.waitForTimeout(2000);
const after=await p.evaluate(()=>({fresh:state.freshSite,n:state.pharmacyName||'',staff:(state.staff||[]).length,landing:[...$('main').querySelectorAll('button')].some(b=>/Set up your pharmacy/.test(b.textContent)),view:D.phone,notes:UAT.count()}));
const res=[['before reset there is test data',before.n&&before.staff===4],['after reset the app is back at first use',!after.fresh&&!after.n&&after.staff===0&&after.landing],['laptop/phone view choice is kept',after.view===false],['UAT notes are kept',after.notes>=1],['no script errors',!errs.length]];
for(const [n,ok] of res)console.log((ok?'PASS ':'FAIL ')+n+(ok?'':' · '+JSON.stringify({before,after,errs})));console.log(res.filter(x=>x[1]).length+'/'+res.length+' passed');await b.close();})();
