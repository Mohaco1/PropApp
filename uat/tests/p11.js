const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
await p.goto('file:///home/user/rpharmacy/uat/app/rpharmacy-uat-v28-conceptD.html');await p.waitForTimeout(1500);
await p.evaluate(()=>{const n=clone();Object.assign(n,{freshSite:true,onboarded:true,freshProprietors:true,freshSelection:true,pharmacyName:'X Pharmacy',proprietors:[{id:'p1',name:'T',primary:true}],currentReviewer:'p1',active:['daa']});commit(n,'t');});await p.waitForTimeout(300);
console.log(await p.evaluate(()=>{const s=document.querySelector('#cd-bar .scope');return s?[s.outerHTML.slice(0,200),JSON.stringify(s.getBoundingClientRect()),getComputedStyle(s).display]:'none'}));
await b.close();})();
