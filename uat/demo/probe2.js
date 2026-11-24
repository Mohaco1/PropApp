const { chromium } = require('playwright');const M=require('./make-demo.js');const {completeReview}=require('./review-filler.js');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1280,height:900}})).newPage();p.on('dialog',d=>d.accept());const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.clock.install({time:M.at(-365)});await p.addInitScript(`window.__tf=l=>'Fictional answer';`);await M.setup(p);
 await p.clock.setFixedTime(M.at(-330));
 for(const id of ['service-otp','otp-full','otp-amenity','service-staged','service-vaccination','service-delivery','daa-house','vacc-storage','B1','A3','CO-P','M2','M1','Q4']){const r=await completeReview(p,id,{date:M.iso(-330)});console.log(id,JSON.stringify(r).slice(0,300));}
 console.log('errs',errs.slice(0,3));await b.close();})();
