// Setup journey fixes: true step count, Express is the default, "Service X of N", first due dates as the last step. Fictional data.
const { chromium, devices } = require('playwright');
const APP='file:///home/user/rpharmacy/uat/app/'+(process.env.FILE||'rpharmacy-uat-testing.html');
const res=[];const ok=(n,p,d='')=>res.push({n,p:!!p,d:String(d).slice(0,300)});
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPhone 13']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto(APP);await p.waitForTimeout(1500);
 await p.locator('main button',{hasText:'Set up your pharmacy'}).click();await p.waitForTimeout(300);
 await p.fill('#editor input >> nth=0','Harbourview Test Pharmacy');await p.fill('#editor input >> nth=1','1 Test Street');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(300);
 await p.fill('#editor input >> nth=0','Alex Owner');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(300);
 const s3=await p.evaluate(()=>({step:document.querySelector('#editor .d-progstep .eyebrow')?.textContent,how:document.querySelector('#setup-how')?.textContent||'',radios:document.querySelectorAll('#editor input[name=setup-mode]').length}));
 ok('services step says "Step 3 of 4" (step 4 sets up each service)',/^Step 3 of 4/.test(s3.step||''),s3.step);
 ok('no mode to choose: one line says what happens next',s3.radios===0&&/a few questions about how your pharmacy does it, then one screen of usual arrangements/.test(s3.how),JSON.stringify(s3));
 for(const s of ['Home delivery','Staged supply'])await p.locator('#editor .d-tiles>label',{hasText:s}).first().click();
 await p.locator('#editor button',{hasText:'Save service selection'}).click();await p.waitForTimeout(400);
 const st=await p.evaluate(()=>document.querySelector('#editor .rph-question p[role=status]')?.textContent);
 ok('each service starts with a short intro that says which service of how many',/^Step 4 of 4 · Service 1 of 2$/.test(st||'')&&await p.evaluate(()=>/Setting up Home delivery/.test($('editor').innerText)),st);
 let guard=0,sawSvc2=false;
 while(guard++<80){const x=await p.evaluate(()=>{const ed=$('editor');if(!ed.open)return{closed:true};return{t:ed.querySelector('#dialog-title')?.textContent||'',st:ed.querySelector('.rph-question p[role=status]')?.textContent||'',opts:[...ed.querySelectorAll('.fresh-option')].map(b=>b.textContent.trim()),checks:ed.querySelectorAll('.rph-question label.fresh-option:not(:has(+ #qm-describe-Other)) input[type=checkbox]').length,inputs:[...ed.querySelectorAll('input:not([type=checkbox]):not([type=radio]),textarea')].filter(i=>i.offsetParent&&!i.closest('.uat-q')).length,buttons:[...ed.querySelectorAll('button')].map(b=>b.textContent.trim())};});
  if(x.closed||/Pharmacy setup complete/.test(x.t))break;if(/Service 2 of 2/.test(x.st))sawSvc2=true;
  if(x.buttons.includes('Start')){await p.locator('#editor button',{hasText:/^Start$/}).click();await p.waitForTimeout(250);continue;}
  if(x.buttons.some(y=>/That.s how we do it/.test(y))){await p.locator('#editor button',{hasText:/That.s how we do it/}).click();await p.waitForTimeout(250);continue;}
  if(/Service setup complete/.test(x.t)){const nx=x.buttons.find(y=>/Continue to next section|Finish pharmacy setup/.test(y));await p.locator('#editor button',{hasText:nx}).first().click();await p.waitForTimeout(250);continue;}
  if(x.checks){await p.evaluate(()=>$('editor').querySelector('.rph-question label.fresh-option:not(:has(+ #qm-describe-Other)) input[type=checkbox]').click());}
  else if(x.opts.length){const pick=x.opts.find(o=>/Draft it for me/.test(o))||x.opts.find(o=>!/Needs verification|Different local|Other|Someone else|our own/.test(o))||x.opts[0];await p.locator('#editor .fresh-option',{hasText:pick}).first().click();await p.waitForTimeout(200);continue;}
  else if(x.inputs){await p.evaluate(()=>{for(const i of [...$('editor').querySelectorAll('input:not([type=checkbox]):not([type=radio]),textarea')].filter(i=>i.offsetParent&&!i.closest('.uat-q'))){i.value='Test value';i.dispatchEvent(new Event('input',{bubbles:true}));}});}
  const c=x.buttons.find(y=>/^(Continue|Save|Next)/.test(y));if(!c)break;await p.locator('#editor button',{hasText:c}).first().click();await p.waitForTimeout(200);}
 ok('the second service says "Service 2 of 2"',sawSvc2);
 const end=await p.evaluate(()=>({t:$('editor').querySelector('#dialog-title')?.textContent,text:$('editor').innerText,primary:[...$('editor').querySelectorAll('button.primary')].map(b=>b.textContent),btns:[...$('editor').querySelectorAll('button')].map(b=>b.textContent)}));
 ok('setup ends with "Last step · first due dates", Set first due dates as the main button and Skip for now',/Last step · first due dates/.test(end.text)&&end.primary.includes('Set first due dates')&&end.btns.includes('Skip for now'),JSON.stringify(end).slice(0,400));
 await p.locator('#editor button',{hasText:'Set first due dates'}).click();await p.waitForTimeout(300);
 ok('Set first due dates opens the dates step, full screen like the rest of setup',await p.evaluate(()=>$('editor').classList.contains('cd-focus')&&/Review due dates|Initial review schedules/.test($('editor').querySelector('#dialog-title')?.textContent||'')));
 const before=await p.evaluate(()=>RPH.schedule.unscheduled().length);
 await p.evaluate(()=>{const i=[...$('editor').querySelectorAll('input[type=date]')].find(x=>!x.value&&!x.disabled&&x.offsetParent);if(i){const d=new Date();d.setDate(d.getDate()+30);i.value=d.toISOString().slice(0,10);i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));}});
 const save=await p.evaluate(()=>[...$('editor').querySelectorAll('button')].map(b=>b.textContent).find(t=>/Save/.test(t)));await p.locator('#editor button',{hasText:save}).first().click();await p.waitForTimeout(400);
 const after=await p.evaluate(()=>({n:RPH.schedule.unscheduled().length,open:$('editor').open,page}));
 ok('saving the (pre-filled) dates reduces the undated reviews and returns to the app',after.n<before&&!after.open,JSON.stringify({before,after}));
 const today=await p.evaluate(()=>{CD.go('overview');return document.querySelector('#cd-view .status')?.innerText||'';});
 ok('Today wording: "open action" is singular when there is one',!/\b1 open actions\b/.test(today),today);
 ok('no script errors',!errs.length,errs.join(' | '));
 for(const x of res)console.log((x.p?'PASS ':'FAIL ')+x.n+(x.p?'':' · '+x.d));console.log(res.filter(x=>x.p).length+'/'+res.length+' passed');await b.close();})();
