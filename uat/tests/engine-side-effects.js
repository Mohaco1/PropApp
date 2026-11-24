const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:860}});
await p.goto('file://'+(process.env.APP||'/home/user/rpharmacy/dev/proprietor-hub.html')+'');await p.waitForTimeout(1500);
await p.evaluate(()=>{const n=clone(),add=d=>addInterval(today(),d,'days');Object.assign(n,{freshSite:true,onboarded:true,freshProprietors:true,freshSelection:true,pharmacyName:'X',proprietors:[{id:'p1',name:'T',primary:true}],currentReviewer:'p1',active:['daa','otp','vaccination']});n.schedule.B1=add(-3);n.staff=[{id:'s1',person:'Sam',role:'Pharmacist',active:true,services:['vaccination'],annualDue:add(-2),credentials:[{id:'c1',title:'Cert',expiry:add(-5)}]}];commit(n,'seed');});
await p.waitForTimeout(300);
for(const pg of ['overview','audits','actions','staff','staff-profile','documents','meetings','services','history','setup','overview','staff']){
 const r=await p.evaluate(x=>{const before=JSON.stringify(state);if(x==='staff-profile'){profileId='s1';}gotoPage(x);const after=JSON.stringify(state);if(before===after)return 'no change';const a=JSON.parse(before),c=JSON.parse(after);return Object.keys(c).filter(k=>JSON.stringify(a[k])!==JSON.stringify(c[k])).join(',')+' · history+'+(c.history.length-a.history.length);},pg);
 console.log(pg.padEnd(14),r);}
await b.close();})();
