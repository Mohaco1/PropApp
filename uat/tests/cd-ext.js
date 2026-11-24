const { chromium } = require('playwright');
const O='/home/user/rpharmacy/uat/tests/out/cd/';
(async()=>{const b=await chromium.launch();
for(const [dev,w,h] of [['desktop',1280,860],['mobile',390,844]]){const p=await b.newPage({viewport:{width:w,height:h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/user/rpharmacy/uat/app/rpharmacy-uat-v36-conceptD.html');await p.waitForTimeout(1500);await p.evaluate(()=>{if(D.phone)D.applyView(false);});
await p.screenshot({path:O+dev+'-x-landing.png'});
await p.evaluate(()=>{const n=clone();Object.assign(n,{freshSite:true,onboarded:true,freshProprietors:true,pharmacyName:'Harbourview Pharmacy',proprietors:[{id:'p1',name:'Alex Owner',primary:true}],currentReviewer:'p1'});commit(n,'fictional');fsServicesSelect();const s=$('status');if(s)s.style.setProperty('display','none','important');});
await p.waitForTimeout(400);await p.screenshot({path:O+dev+'-x-onboarding.png'});
await p.evaluate(()=>$('editor').close());await p.evaluate(require('./showcase-seed.js'));
for(const pg of ['meetings','services','history','setup','staff-profile','library','calendar-weekly','calendar-year']){await p.evaluate(x=>{if(x==='staff-profile'){profileId='s1';gotoPage('staff-profile');}else if(x==='library'){CD.st.lib=true;gotoPage('documents');}else if(x.startsWith('calendar')){CD.st.lib=false;CD.st.cal=x.endsWith('weekly')?'Weekly':'Year';CD.go('planner');}else gotoPage(x);},pg);await p.waitForTimeout(400);await p.screenshot({path:O+dev+'-x-'+pg+'.png'});}
console.log(dev,errs);await p.close();}
await b.close();})();
