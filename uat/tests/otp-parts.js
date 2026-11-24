// OTP procedure parts screen, one OTP action, setup actions due in 30 days, compact activity history, previews. Fictional data.
const { chromium, devices } = require('playwright');
const APP='file:///home/user/rpharmacy/uat/app/'+(process.env.FILE||'rpharmacy-uat-testing.html');
const res=[];const ok=(n,p,d='')=>res.push({n,p:!!p,d:String(d).slice(0,300)});
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPhone 13']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto(APP);await p.waitForTimeout(1500);
 await p.locator('main button',{hasText:'Set up your pharmacy'}).click();await p.waitForTimeout(300);
 await p.fill('#editor input >> nth=0','Harbourview Test Pharmacy');await p.fill('#editor input >> nth=1','1 Test Street');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(300);
 await p.fill('#editor input >> nth=0','Alex Owner');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(300);
 for(const s of ['Opioid Treatment Program','Vaccination'])await p.locator('#editor .d-tiles>label',{hasText:s}).first().click();
 await p.locator('#editor button',{hasText:'Save service selection'}).click();await p.waitForTimeout(400);
 let guard=0,sawPreview='',sawResp=false;
 while(guard++<80){const x=await p.evaluate(()=>{const ed=$('editor');if(!ed.open)return{closed:true};return{t:ed.querySelector('#dialog-title')?.textContent||'',lab:ed.querySelector('.sq-label')?.textContent||'',opts:[...ed.querySelectorAll('.fresh-option')].map(b=>b.textContent.trim()),checks:ed.querySelectorAll('.rph-question label.fresh-option input[type=checkbox]').length,inputs:[...ed.querySelectorAll('input:not([type=checkbox]):not([type=radio]),textarea')].filter(i=>i.offsetParent&&!i.closest('.uat-q')).length,buttons:[...ed.querySelectorAll('button')].map(b=>b.textContent.trim()),sum:!!ed.querySelector('.hy-sum')};});
  if(x.closed||/Pharmacy setup complete/.test(x.t))break;
  if(/Who runs your services|Who is responsible/.test(x.lab))sawResp=true;
  if(x.buttons.includes('Start')){await p.locator('#editor button',{hasText:/^Start$/}).click();await p.waitForTimeout(250);continue;}
  if(x.sum){if(x.buttons.includes('Preview')){await p.locator('#editor .hy-acts button',{hasText:'Preview'}).first().click();sawPreview+=' | '+await p.evaluate(()=>[...document.querySelectorAll('#editor .hy-prev')].find(e=>!e.hidden)?.textContent||'');}
   await p.locator('#editor button',{hasText:/That.s how we do it/}).click();await p.waitForTimeout(300);continue;}
  if(/Service setup complete/.test(x.t)){const nx=x.buttons.find(y=>/Continue to next section|Finish pharmacy setup/.test(y));await p.locator('#editor button',{hasText:nx}).first().click();await p.waitForTimeout(250);continue;}
  if(x.checks){await p.evaluate(()=>$('editor').querySelector('.rph-question label.fresh-option input[type=checkbox]').click());}
  else if(x.opts.length){const pick=x.opts.find(o=>/Draft it for me/.test(o))||x.opts.find(o=>!/Needs verification|Different local|Other|Someone else|our own/.test(o))||x.opts[0];await p.locator('#editor .fresh-option',{hasText:pick}).first().click();await p.waitForTimeout(200);continue;}
  else if(x.inputs){await p.evaluate(()=>{for(const i of [...$('editor').querySelectorAll('input:not([type=checkbox]):not([type=radio]),textarea')].filter(i=>i.offsetParent&&!i.closest('.uat-q'))){i.value='Test value';i.dispatchEvent(new Event('input',{bubbles:true}));}});}
  const c=x.buttons.find(y=>/^(Continue|Save|Next)/.test(y));if(!c)break;await p.locator('#editor button',{hasText:c}).first().click();await p.waitForTimeout(200);}
 ok('no "who is responsible" question in setup',!sawResp);
 ok('"Draft it for me" lines have a Preview: drafted steps for vaccination; OTP parts say they go on your OTP list',/We’ll draft: [^|]*anaphylaxis/i.test(sawPreview)&&/goes on your “Your OTP procedure” list/.test(sawPreview),sawPreview);
 const s=await p.evaluate(()=>{const t=Object.values(state.taskLedger||{}).filter(t=>t.status==='Outstanding');return{otp:t.filter(x=>/OTP/.test(x.text)).map(x=>[x.text,x.due]),today:today(),lead:sopValues('otp').incidents,allDue:t.map(x=>x.due),dbg:t.map(x=>[x.text.slice(0,60),x.due,JSON.stringify(x.sources)])};});
 ok('setup raises ONE OTP procedure action (not one per part)',s.otp.length===1&&/Finish your OTP procedure/.test(s.otp[0][0]),JSON.stringify(s.otp));
 ok('setup actions are due in 30 days, not today',s.allDue.every(d=>d>s.today),JSON.stringify(s.dbg));
 await p.evaluate(()=>{if($('editor').open)$('editor').close();CD.st.f.today='all';CD.go('overview');});await p.waitForTimeout(300);
 const row=await p.evaluate(()=>CD.todayRows().find(r=>/Finish your OTP procedure/.test(r.item))?.item);
 ok('Today shows how many Standards parts are left to write',/Finish your OTP procedure · \d+ of 7 Standards parts to write/.test(row||''),row);
 await p.evaluate(()=>CD.todayRows().find(r=>/Finish your OTP procedure/.test(r.item)).open());await p.waitForTimeout(300);
 const scr=await p.evaluate(()=>({t:$('editor').querySelector('#dialog-title')?.textContent,rows:document.querySelectorAll('#editor .otp-parts .hy-list li:not(.otp-hd)').length,st:document.querySelector('#editor .otp-parts p[role=status]')?.textContent}));
 ok('it opens "Your OTP procedure" listing all 7 Standards parts plus your own parts',scr.t==='Your OTP procedure'&&scr.rows>=9,JSON.stringify(scr));
 await p.evaluate(()=>{const lis=[...document.querySelectorAll('#editor .otp-parts .hy-list li:not(.otp-hd)')];for(const li of lis.slice(0,3))[...li.querySelectorAll('button')].find(b=>b.textContent==='Written').click();});
 await p.locator('#editor button',{hasText:/^Save$/}).click();await p.waitForTimeout(400);
 const after=await p.evaluate(()=>({g:sopValues('otp').otpGovernance,st:document.querySelector('#editor .otp-parts p[role=status]')?.textContent,open:Object.values(state.taskLedger).find(t=>/Finish your OTP procedure/.test(t.text))?.status}));
 ok('marking parts "Written" saves them; the action stays open for you to close',after.g.split(',').length===3&&after.open==='Outstanding',JSON.stringify(after));
 // activity history is compact
 await p.evaluate(()=>{fsClose&&fsClose();const t=Object.values(state.taskLedger).find(t=>/Finish your OTP procedure/.test(t.text));taskEditor(t.id);});await p.waitForTimeout(400);
 const act=await p.evaluate(()=>({rows:document.querySelectorAll('#task-activity .act-row').length,long:[...document.querySelectorAll('#task-activity .act-msg')].some(m=>m.textContent.length>160),more:document.querySelectorAll('#task-activity .act-more').length,btn:!!document.querySelector('#editor .otp-open')}));
 ok('activity history: one short line per event, long ones behind "Show more"',act.rows>=1&&!act.long,JSON.stringify(act));
 ok('the action window has "Open your OTP procedure parts"',act.btn);
 ok('backup still valid',await p.evaluate(()=>{try{validateBackup(portableBackup());return true;}catch(e){return e.message;}})===true);
 ok('no script errors',!errs.length,errs.join(' | '));
 for(const x of res)console.log((x.p?'PASS ':'FAIL ')+x.n+(x.p?'':' · '+x.d));console.log(res.filter(x=>x.p).length+'/'+res.length+' passed');await b.close();})();
