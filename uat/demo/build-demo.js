// Builds "Wattle Grove Pharmacy" (fictional) by running the real app with the browser clock stepped through a year,
// then saves its records and drafts to demo/wattle-grove.json. Every record is made by the app's own screens or the
// save functions those screens call. Fictional people and places only.
const { chromium } = require('playwright');const fs=require('fs');const path=require('path');
const M=require('./make-demo.js');const {completeReview}=require('./review-filler.js');
const log=[];const note=(...a)=>{const s=a.join(' ');log.push(s);console.log(s);};
(async()=>{
 const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1280,height:900}})).newPage();
 const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
 const T=M.TEXTMAP;
 await p.clock.install({time:M.at(-365)});
 await p.addInitScript(`window.__tf=${M.tfSource};`);
 const clock=async d=>{await p.clock.setFixedTime(M.at(d));await p.waitForTimeout(30);};
 const ev=(fn,arg)=>p.evaluate(fn,arg);
 // 1. Setup a year ago (evidence and filing questions answered now; one location left "needs verification").
 await M.setup(p,{evidence:true});note('setup',await ev(()=>state.pharmacyName+' · '+state.active.join(',')));
 // 2. First due dates (what "Review due dates" saves).
 await clock(-364);
 await ev(o=>fsChange('Review due dates saved',n=>{for(const [k,d] of Object.entries(o))n.schedule[k]=d;}),{Q1:M.iso(-275),B1:M.iso(-280),'service-otp':M.iso(-335),'otp-full':M.iso(-340),'service-delivery':M.iso(-340),A3:M.iso(-300),M1:M.iso(-335),M2:M.iso(-335),Q4:M.iso(-275)});
 // 3. Procedure drafts, created with "Create this draft".
 await clock(-362);
 for(const id of ['daa','otp','vaccination','delivery','staged']){await ev(id=>{if($('editor').open)$('editor').close();try{RPH.cx.draftFor(id);}catch(e){}},id);await p.waitForTimeout(300);
  const sd=p.locator('#editor button',{hasText:/^Save draft$/});if(await sd.count()){await sd.first().click();await p.waitForTimeout(300);}else note('no Save draft for',id);
  await ev(()=>{if($('editor').open)$('editor').close();});}
 note('procedure drafts',await ev(()=>procedureDocs().length));
 // 3b. Setup follow-ups dealt with in the first month (one closed late, one rescheduled when the OTP procedure stalled).
 const editTask=async(d,re,fn)=>{await clock(d);const id=await ev(re=>Object.values(state.taskLedger).find(t=>t.status==='Outstanding'&&new RegExp(re,'i').test(t.text))?.id,re);if(!id){note('no setup action',re);return;}
  await ev(id=>{if($('editor').open)$('editor').close();taskEditor(id);},id);await p.waitForTimeout(250);await fn();
  await p.locator('#task-form button',{hasText:'Save action'}).click();await p.waitForTimeout(250);await ev(()=>{if($('editor').open)$('editor').close();});note(M.iso(d),'setup action',re,await ev(id=>state.taskLedger[id].status+' due '+state.taskLedger[id].due,id));};
 // 4. Vaccination readiness before launch.
 await clock(-360);note('vacc-ready',JSON.stringify(await completeReview(p,'vacc-ready',{date:M.iso(-360)})));
 // 5. Staff and their first annual assurance.
 const addStaff=async s=>{await ev(()=>{if($('editor').open)$('editor').close();staffEditor('');});await p.waitForTimeout(250);
  await p.fill('#editor [name=person]',s.person);await p.selectOption('#editor [name=role]',s.role);await p.selectOption('#editor [name=engagement]','Regular');
  await p.fill('#editor [name=start]',s.start);await p.fill('#editor [name=annualDue]',s.annualDue);
  await ev(sv=>{for(const c of $('editor').querySelectorAll('[name=service]'))if(sv.some(x=>c.closest('label').textContent.includes(x))&&!c.checked)c.click();},s.services||[]);
  await p.locator('#editor button',{hasText:'Save profile'}).click();await p.waitForTimeout(300);await ev(()=>{if($('editor').open)$('editor').close();});
  return ev(n=>state.staff.find(x=>x.person===n)?.id,s.person);};
 const assure=async(id,o)=>{await ev(id=>{if($('editor').open)$('editor').close();staffAssurance(false,id);},id);await p.waitForTimeout(300);
  await p.fill('#assurance-date',o.date);await p.fill('#assurance-next',o.next);
  await ev(o=>{const ed=$('editor');const blocks=[...ed.querySelectorAll('select[name=outcome]')];
   for(const s of blocks){const box=s.closest('fieldset,section,div.card,li')||s.parentElement.parentElement;const label=box.textContent;
    s.value='Verified';s.dispatchEvent(new Event('change',{bubbles:true}));
    const m=box.querySelector('select[name=method]');if(m){const op=[...m.options].find(x=>/register/i.test(x.textContent)&&/Ahpra/.test(label))||[...m.options].find(x=>/sighted/i.test(x.textContent))||[...m.options].find(x=>x.value);m.value=op.value;m.dispatchEvent(new Event('change',{bubbles:true}));}
    const ex=box.querySelector('input[name=expiry]');for(const [re,d] of o.expiry){if(new RegExp(re,'i').test(label)&&ex){ex.value=d;ex.dispatchEvent(new Event('input',{bubbles:true}));}}
    const ref=box.querySelector('input[name=reference]');if(ref&&/registration/i.test(label)){ref.value='Ahpra register checked (fictional)';ref.dispatchEvent(new Event('input',{bubbles:true}));}
    if(ref&&/immuniser|vaccination/i.test(label)){ref.value='Immuniser certificate · staff file, office cabinet drawer 2';ref.dispatchEvent(new Event('input',{bubbles:true}));}}},o);
  await p.locator('#editor button',{hasText:'Complete review'}).click();await p.waitForTimeout(400);
  const ok=await ev(()=>!$('editor').open);
  const ids=await ev(id=>Object.values(state.taskLedger).filter(t=>t.status==='Outstanding'&&t.sources?.some(s=>s.type==='Staff'&&s.id===id)).map(t=>t.id),id);
  for(const tid of ids){await ev(t=>{if($('editor').open)$('editor').close();taskEditor(t);},tid);await p.waitForTimeout(200);
   await p.selectOption('#task-form [name=status]','Completed');await p.fill('#task-form [name=outcome]','Verified at the annual assurance check on '+o.date+'.');
   await p.locator('#task-form button',{hasText:'Save action'}).click();await p.waitForTimeout(200);await ev(()=>{if($('editor').open)$('editor').close();});}if(!ok){note('assurance not closed:',await ev(()=>($('status')?.querySelector('span')?.textContent||'')+' '+$('editor').innerText.slice(0,200)));await ev(()=>$('editor').close());}};
 await clock(-360);
 const staff={};
 staff.priya=await addStaff({person:'Priya Sharma',role:'Pharmacist manager',start:M.iso(-1100),annualDue:M.iso(-358),services:['Dose administration aids','Opioid','Staged','Home delivery']});
 staff.tom=await addStaff({person:'Tom Nguyen',role:'Pharmacist',start:M.iso(-800),annualDue:M.iso(-358),services:['Vaccination','Opioid']});
 staff.grace=await addStaff({person:'Grace Li',role:'Dispensary technician / assistant',start:M.iso(-600),annualDue:M.iso(-358),services:['Dose administration aids','Home delivery']});
 await clock(-358);
 await assure(staff.priya,{date:M.iso(-358),next:M.iso(45),expiry:[['registration',M.iso(6)]]});
 await assure(staff.tom,{date:M.iso(-358),next:M.iso(9),expiry:[['registration',M.iso(6)],['vaccination',M.iso(19)]]});
 await assure(staff.grace,{date:M.iso(-358),next:M.iso(120),expiry:[]});
 note('staff',await ev(()=>state.staff.map(s=>s.person).join(', ')));
 // 6. A year of reviews, in date order.
 const R=async(d,id,o={})=>{await clock(d);const r=await completeReview(p,id,{date:M.iso(o.done??d),...o});note(M.iso(d),id,JSON.stringify(r).slice(0,160));return r;};
 const visit=async(d,o)=>{await clock(d);const r=await ev(o=>{if($('editor').open)$('editor').close();$('editor').replaceChildren();const its=RPH.sv.items();const dd={v:3,date:today(),items:{},vacc:{event:'no',sighted:'yes',auditDate:o.vaccAudit},notes:o.notes,nextDate:'',nextTouched:false};
   for(const it of its){const iss=o.issues[it.key];dd.items[it.key]=iss?{status:'issue',text:iss.text,follow:{mode:'new',owner:iss.owner||'You',due:iss.due}}:{status:'ok',text:''};}
   const ok=RPH.sv.commit(false,dd,its,today(),o.next,o.notes);return ok?'saved':'failed';},o);note(M.iso(d),'site visit',r);};
 await editTask(-350,'DAA labels',async()=>{await p.selectOption('#task-form [name=status]','Completed');await p.fill('#task-form [name=outcome]','Checked a sample of packs and the label record against the 2026 Regulation with Priya; labels show all required details.');});
 await editTask(-330,'S8 deliveries',async()=>{await p.selectOption('#task-form [name=status]','Completed');await p.fill('#task-form [name=outcome]','S8 items are not sent with home delivery; drivers told and the delivery procedure says so.');});
 await editTask(-300,'OTP procedure',async()=>{await p.fill('#task-form [name=due]',M.iso(14));});
 await R(-340,'otp-full');
 await R(-335,'service-otp');await R(-335,'M2');await R(-334,'M1');
 await R(-320,'service-delivery');                                                  // 20 days late
 await R(-305,'service-otp');await R(-300,'A3');
 await R(-280,'B1');await R(-276,'service-otp');
 await visit(-275,{notes:'Walked the dispensary with Priya. DAA bench tidy; OTP dosing area clean. Fridge log complete.',next:M.iso(-185),vaccAudit:M.iso(-282),issues:{}});
 await R(-274,'Q4');
 await R(-245,'service-otp');
 await R(-212,'service-otp',{done:-216});                                           // done 16th, recorded 4 days later
 await R(-191,'B1');                                                                // a few days before it was due
 await visit(-185,{notes:'Spoke with Grace about DAA sign-off. Back door closer slow to latch.',next:M.iso(-95),vaccAudit:M.iso(-190),issues:{premises:{text:'Back door closer slow to latch',due:M.iso(-170)}}});
 await R(-183,'service-otp');
 await R(-165,'otp-full',{issue:4,issueText:'Two take-away authorisations not filed with the OTP records'});
 // resolve two actions
 const resolve=async(d,re,outcome)=>{await clock(d);const id=await ev(re=>Object.values(state.taskLedger).find(t=>t.status==='Outstanding'&&new RegExp(re,'i').test(t.text))?.id,re);if(!id){note('no action for',re);return;}
  await ev(id=>{if($('editor').open)$('editor').close();taskEditor(id);},id);await p.waitForTimeout(300);
  await p.selectOption('#task-form [name=status]','Completed');await p.fill('#task-form [name=outcome]',outcome);
  await p.locator('#task-form button',{hasText:'Save action'}).click();await p.waitForTimeout(300);await ev(()=>{if($('editor').open)$('editor').close();});
  note(M.iso(d),'closed action',re,await ev(id=>state.taskLedger[id].status,id));};
 await resolve(-160,'Back door closer','Door closer adjusted by the landlord’s handyman; latches every time (sighted).');
 await R(-152,'service-otp');
 await resolve(-150,'take-away authorisations','Both authorisations filed in the OTP folder; checked at the next monthly review.');
 await R(-148,'CO-P',{notes:'Annual premises renewal filed with the Pharmacy Council · receipt PC-RN-20417 (fictional)'});await R(-148,'CO-F');
 await R(-122,'service-otp');await R(-100,'Q4');await R(-98,'B1');
 await visit(-95,{notes:'Weekend fridge min/max readings missing on two weekends in the log. Discussed with Tom.',next:M.iso(-5),vaccAudit:M.iso(-100),issues:{storage:{text:'Fridge min/max readings not recorded on two weekends',due:M.iso(-60)}}});
 await R(-91,'service-otp');await R(-61,'service-otp');await R(-60,'M2');await R(-45,'M1');await R(-30,'M2');await R(-26,'service-otp');
 // 7. Recent starter.
 await clock(-18);staff.ben=await addStaff({person:'Ben Carter',role:'Pharmacy assistant',start:M.iso(-18),annualDue:M.iso(347),services:['Home delivery']});note('recent starter Ben Carter',!!staff.ben);
 // 8. A manual action you're waiting on someone for.
 await clock(-10);
 await ev(()=>{if($('editor').open)$('editor').close();taskEditor();});await p.waitForTimeout(300);
 await p.fill('#task-form [name=text]','Service the dispensary fire extinguisher (tag expired)');await p.fill('#task-form [name=owner]','You');await p.fill('#task-form [name=due]',M.iso(9));
 await p.locator('#task-form button',{hasText:'Save action'}).click();await p.waitForTimeout(300);await ev(()=>{if($('editor').open)$('editor').close();});
 await clock(-3);
 await ev(o=>{const t=Object.values(state.taskLedger).find(t=>/fire extinguisher/.test(t.text));if(t)RPH.wait.save(t.id,'Service date from FireSafe Services (fictional)',o);},M.iso(2));
 // 9. An extra visit in progress (answered with real key presses, so it saves as a draft).
 await clock(-2);
 await ev(()=>{if($('editor').open)$('editor').close();RPH.sv.open(true);});await p.waitForTimeout(500);
 for(let i=0;i<4;i++){await p.keyboard.press('1');await p.waitForTimeout(150);await p.locator('#editor .cd-svnav button',{hasText:/^Next$/}).click();await p.waitForTimeout(150);}
 await p.locator('#editor .cd-audit-top button').first().click();await p.waitForTimeout(400);
 note('extra visit draft',await ev(()=>{const d=readDraft('event-audit/Q1');return d?Object.values(d.items||{}).filter(s=>s&&s.status).length+' checks answered':'none';}));
 // 10. The six-monthly OTP review saved part-way.
 await clock(-1);
 await ev(()=>{if($('editor').open)$('editor').close();reviewEditor('otp-full');});await p.waitForTimeout(500);
 for(let i=0;i<2;i++){await p.keyboard.press('1');await p.waitForTimeout(150);const nx=p.locator('#editor button',{hasText:/^(Next|Save and next)$/});if(await nx.count())await nx.first().click();await p.waitForTimeout(150);}
 await p.locator('#editor .cd-audit-top button').first().click().catch(()=>p.evaluate(()=>$('editor').close()));await p.waitForTimeout(400);
 note('otp-full draft',await ev(()=>readDraft('otp-full')?'saved':'none'));
 // 11. Save: records + drafts, exactly as a backup holds them.
 await p.clock.setFixedTime(M.at(0,9));
 const out=await ev(()=>{const b=portableBackup();validateBackup(b);return b;});
 const summary=await ev(()=>({name:state.pharmacyName,reviews:state.reviews.length,actions:Object.values(state.taskLedger).map(t=>t.status+' · '+t.text.slice(0,60)),staff:state.staff.map(s=>s.person),docs:procedureDocs().map(d=>d.title||d.name),schedule:state.schedule,drafts:Object.keys(portableBackup().drafts)}));
 fs.writeFileSync(path.join(__dirname,'wattle-grove.json'),JSON.stringify({generated:M.iso(0),backup:out}));
 fs.writeFileSync(path.join(__dirname,'wattle-grove-summary.json'),JSON.stringify({summary,log,errs},null,1));
 note('saved',JSON.stringify(summary).slice(0,1500));note('errs',errs.length,errs.slice(0,3).join(' | '));
 await b.close();})();
