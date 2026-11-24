const { chromium } = require('playwright');const M=require('./make-demo.js');const {completeReview}=require('./review-filler.js');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1280,height:900}})).newPage();p.on('dialog',d=>d.accept());
 await p.clock.install({time:M.at(-365)});await p.addInitScript(`window.__tf=${M.tfSource};`);await M.setup(p,{evidence:true});await p.clock.setFixedTime(M.at(-335));
 const val=()=>p.evaluate(()=>{try{validateBackup(portableBackup());return 'valid';}catch(e){return e.message;}});
 console.log('after setup',await val());
 const r=await completeReview(p,'service-otp',{date:M.iso(-335)});console.log('otp',JSON.stringify(r),await val(),await p.evaluate(()=>Object.keys(state.taskLedger).length));
 await p.clock.setFixedTime(M.at(-275));
 console.log('visit',await p.evaluate(()=>{const its=RPH.sv.items();const dd={v:3,date:today(),items:{},vacc:{event:'no',sighted:'yes',auditDate:addInterval(today(),-60,'days')},notes:'x',nextDate:'',nextTouched:false};for(const it of its)dd.items[it.key]={status:'ok',text:''};return RPH.sv.commit(false,dd,its,today(),addInterval(today(),90,'days'),'x');}),await val(),await p.evaluate(()=>JSON.stringify(state.reviews.at(-1).serviceAssurance||null).slice(0,400)));
 await b.close();})();
