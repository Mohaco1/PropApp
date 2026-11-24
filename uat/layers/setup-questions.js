/* ===== Setup questions, round 2 (owner UAT notes, 20 Nov 2026) =====
 * 1. Procedures ("file called X"): the owner chooses "Draft it for me" (the steps are written into this
 *    service's draft procedure in Policies) or "We already have our own" (say where it is kept).
 * 2. Record locations: pick where the records live (tick all that apply) instead of an empty box.
 * 3. "Who is responsible": asked once ("Who runs your services day to day?") and reused for every service.
 * 4. Tick-more-than-one: HMR/RMMR reviewers and referrals, routine DAA check, government-funded vaccines,
 *    vaccines offered (21 vaccines from the NSW Health pharmacist vaccination table the owner supplied, 20 Nov 2026).
 * 5. The optional "how many packs" question is removed; the DAA check interval is the pharmacy's own choice.
 * Draft text stays a draft: nothing is approved, and every drafted section lists what to confirm.
 */
RPH.sq={};
const SQ_DRAFT='Draft it for me',SQ_OWN='We have our own procedure';
RPH.sq.PROC={
 delivery:{controlledRef:{label:'Controlled-medicine (S8) delivery procedure',text:'For Schedule 8 medicines: a pharmacist checks and seals the package; it is handed only to the patient or an authorised adult after an identity check, with a signed record; undelivered S8 medicines come back to the pharmacy the same day and are recorded and returned to the S8 safe. [Confirm: these steps match the pharmacy’s S8 procedure and the 2026 Regulation checklist]'}},
 vaccination:{emergency:{label:'Emergency (anaphylaxis) procedure',text:'Keep an anaphylaxis response kit with in-date adrenaline at the vaccination area; observe patients after vaccination; if anaphylaxis occurs, give adrenaline as per the Australian Immunisation Handbook, call 000 and stay with the patient; record the event and report it as an adverse event following immunisation. [Confirm: steps match the current Handbook and NSW guidance]'}},
 aged:{handover:{label:'Handover and escalation procedure',text:'Urgent medication issues are escalated to the facility’s registered nurse in charge and the prescriber on the same day, and the communication is recorded. [Confirm: contacts and timeframes agreed with each facility]'}},
 certificates:{scopeEvidence:{label:'Assessment and referral procedure',text:'The pharmacist assesses the person in person, issues a certificate only for conditions within pharmacist scope and for the period the pharmacist can attest to, and refers the person to a doctor when symptoms are serious or outside scope. A record of each certificate is kept. [Confirm: steps match current professional guidance]'}},
 vaping:{scopeEvidence:{label:'Vape supply procedure',text:'Therapeutic vapes are supplied only under the current pathway the pharmacy uses (prescription or pharmacist supply after consultation), with the age, consultation and record requirements of that pathway. [Confirm: steps match current TGA and NSW requirements]'}},
 nsp:{safety:{label:'Sharps and needlestick procedure',text:'Use approved sharps containers and never recap needles; after a needlestick or exposure, wash the area, seek same-day medical assessment and record and report the incident. [Confirm: steps match the pharmacy’s infection-control arrangements]'}}
};
RPH.sq.REC_BASE=['Dispensing or clinical software','Paper folder in the pharmacy','Shared drive or cloud storage','Other'];
RPH.sq.REC={vaccination:['air','cold'],staged:['consent'],delivery:['paperwork'],daa:['deliveryEvidence'],complex:['validation'],aged:['agreement','records'],screening:['qc'],cannabis:['scopeEvidence'],prescribing:['authority']};
for(const id of RPH.qm.genericIds)(RPH.sq.REC[id]??=[]).includes('records')||RPH.sq.REC[id].push('records');
RPH.sq.LEAD={delivery:['escalation'],staged:['exceptions'],adherence:['interruption']};
for(const id of RPH.qm.genericIds)(RPH.sq.LEAD[id]??=[]).push('responsibility');
RPH.sq.isLead=(id,k)=>(RPH.sq.LEAD[id]||[]).includes(k);
RPH.sq.lead=(n=state)=>n.serviceLead||'';
const SQ_ROLE={options:['Pharmacist in charge','Designated pharmacist','Proprietor','Someone else'],display:{'Someone else':'Someone else (describe)'},describe:['Someone else']};
const SQ_VACCINES=['COVID-19','Diphtheria/tetanus/pertussis (e.g. dTpa or ADT)','Hepatitis A','Hepatitis B','Human papillomavirus (HPV)','Haemophilus influenzae type b (Hib)','Influenza','Japanese encephalitis','Measles/mumps/rubella (MMR)','Meningococcal ACWY','Meningococcal B','Meningococcal C','Mpox (JYNNEOS; authorised settings only)','Poliomyelitis','Typhoid (oral or injection)','Cholera (oral)','Varicella (chickenpox)','Zoster (Shingrix only)','Pneumococcal (Capvaxive or Prevenar 20)','RSV (Arexvy or Abrysvo)','Rabies (pre-exposure)','Other'];

(()=>{
 const M=RPH.qm.meta,add=(id,k,m)=>{M[id]??={};M[id][k]={...(M[id][k]||{}),...m};Object.assign(RPH.qm.displayMap,m.display||{});};
 for(const [id,keys] of Object.entries(RPH.sq.PROC))for(const [k,p] of Object.entries(keys)){
  const row=(sopFields[id]||[]).find(f=>f[0]===k);if(row)row[2]=[SQ_DRAFT,SQ_OWN];
  RPH.express&&(RPH.express.ASSUME[id]??=[]).push(k);
  add(id,k,{type:'',label:p.label,options:[SQ_DRAFT,SQ_OWN],display:{[SQ_DRAFT]:'Draft it for me (added to this service’s procedure for you to review)',[SQ_OWN]:'We already have our own (say where it is kept)'},describe:[SQ_OWN],
   note:'If you already have your own, choose that and say where it is. Otherwise we draft the steps into this service’s procedure in Policies. Nothing is approved for you.'});
 }
 for(const [id,keys] of Object.entries(RPH.sq.REC))for(const k of keys){
  const opts=k==='air'?['Australian Immunisation Register (AIR) portal',...RPH.sq.REC_BASE]:RPH.sq.REC_BASE;
  add(id,k,{type:'multi',options:opts,display:{Other:'Other (describe)'},describe:['Other'],note:'Tick where these records are kept. R.Pharmacy doesn’t hold them; it records where they are so a review can find them.'});
 }
 add('daa','sampleReviewer',{type:'multi',...SQ_ROLE});
 add('daa','sampleFrequency',{note:'This is your own quality check. R.Pharmacy hasn’t found a fixed legal interval for it; choose what suits your pharmacy (check program rules if packs are PPA-funded).'});
 add('daa','sampleMethod',{showIf:()=>false});add('otp','sampleMethod',{showIf:()=>false});
 for(const p of ['HMR','RMMR'])for(const x of ['reviewer','referral']){const row=sopFields.reviews.find(f=>f[0]===p+x);add('reviews',p+x,{type:'multi',options:(row?.[2]||[]).filter(v=>v!=='Needs verification')});}
 add('vaccination','funding',{type:'multi',label:'Which government-funded vaccine programs do you take part in?',options:['National Immunisation Program (NIP)','NSW state-funded vaccines','Private (paid) vaccines only'],legacy:{Participating:'National Immunisation Program (NIP)','Private only':'Private (paid) vaccines only'}});
 const vrow=sopFields.vaccination.find(f=>f[0]==='vaccines');if(vrow)vrow[2]=null;
 add('vaccination','vaccines',{type:'multi',options:SQ_VACCINES,display:{Other:'Other (describe)'},describe:['Other'],source:'List from the NSW Health table of vaccines pharmacist immunisers may give (provided by the owner, 20 Nov 2026). Ages, brands and funded eligibility apply: see the NSW Pharmacist Vaccination Standards and the Australian Immunisation Handbook. Each immuniser needs accredited training for each vaccine.'});
 add('delivery','failure',{note:'This becomes a step in your Home delivery procedure (Policies).'});
})();

/* "Who runs services": the first lead question asked becomes the pharmacy-wide answer; the others are filled from it. */
const sqFields=fsFields;
fsFields=function(id,a){const lead=RPH.sq.lead();return sqFields(id,a).filter(f=>!(lead&&RPH.sq.isLead(id,f[0])));};
const sqMetaFor=RPH.qm.metaFor;
RPH.qm.metaFor=(id,k)=>{const m=sqMetaFor(id,k);if(RPH.sq.isLead(id,k))return{...m,...SQ_ROLE,type:'role',label:'Who runs your services day to day?',note:'We’ll use this answer for all your services, so you’re only asked once.'};return m;};
const sqSet=sopSet;
sopSet=function(n,id,values){const v={...values};
 for(const k of RPH.sq.LEAD[id]||[]){if(!n.serviceLead&&v[k]&&v[k]!=='Needs verification')n.serviceLead=v[k];if(n.serviceLead&&!v[k])v[k]=n.serviceLead;}
 return sqSet(n,id,v);};

/* Procedure drafts: "Draft it for me" writes the steps; "our own" points to it. Lists read naturally. */
const sqText=(id,k,v)=>{const p=RPH.sq.PROC[id]?.[k];if(!p||typeof v!=='string')return null;
 if(v===SQ_DRAFT)return p.text;if(v.startsWith(SQ_OWN))return 'Follow the pharmacy’s own '+p.label.toLowerCase()+(v.includes(':')?' ('+v.slice(v.indexOf(':')+1).trim()+')':'')+'.';return null;};
for(const id of Object.keys(RPH.sop.templates)){const orig=RPH.sop.templates[id];
 RPH.sop.templates[id]=(a,c)=>orig(a,(k,fn,what)=>{const t=sqText(id,k,a[k]);if(t)return t;
  const m=RPH.qm.metaFor(id,k);
  if(m.type==='role')return c(k,v=>fn(RPH.qm.showFor(id,k,v).replace(/^Someone else: /,'')),what);return c(k,fn,what);});}
const sqSentence=sopSentence;sopSentence=function(key,value,label,options){
 for(const id of Object.keys(RPH.sq.PROC)){const t=sqText(id,key,value);if(t)return (RPH.sq.PROC[id][key].label)+' · '+t;}
 return sqSentence(key,value,label,options);};

/* Card notes: one line under the question explaining what happens with the answer. */
const sqCard=fsCard;
fsCard=function(id,move=''){const r=sqCard(id,move);
 try{const box=$('editor').querySelector('.rph-question');const stl=box?.querySelector(':scope>p[role=status]');if(stl&&!stl.dataset.svc){const done=state.active.filter(x=>state.serviceConfig?.[x]?.complete&&x!==id).length;stl.dataset.svc='1';let q=stl.textContent;const cur=RPH.hy?.cur;if(cur&&cur.id===id&&RPH.express.detail!==id&&!RPH.hy.editing&&cur.key!=='routes'){const i=cur.keys.indexOf(cur.key);if(i>=0)q='Question '+(i+1)+' of '+cur.keys.length;}stl.textContent='Step 4 of 4 · Service '+Math.min(done+1,state.active.length)+' of '+state.active.length+' · '+q;}const lp=stl?.nextElementSibling;if(lp?.tagName==='P')lp.classList.add('sq-label');
 if(box&&!box.querySelector('.sq-note,.sq-src')){
  const ps=[...box.querySelectorAll(':scope>p')];
  for(const f of sopFieldsFor(id)){const m=RPH.qm.metaFor(id,f[0]),lab=m.label||f[1],anchor=ps.find(p=>p.textContent===lab);if(!anchor)continue;
   if(m.note){const n=document.createElement('p');n.className='sq-note muted';n.textContent=m.note;anchor.after(n);}
   if(m.source&&m.type==='multi'){const opt=[...box.querySelectorAll(':scope>label.fresh-option')].at(-1);if(opt){const n=document.createElement('p');n.className='sq-src muted';n.textContent=m.source;opt.after(n);}}
   break;}}}catch(e){console.warn(e);}
 return r;};

/* ===== Round 3 (owner notes after finishing Detailed setup, 20 Nov 2026) ===== */
(()=>{
 const M=RPH.qm.meta,add=(id,k,m)=>{M[id]??={};M[id][k]={...(M[id][k]||{}),...m};Object.assign(RPH.qm.displayMap,m.display||{});};
 const drop=(id,keys)=>{sopFields[id]=sopFields[id].filter(f=>!keys.includes(f[0]));};
 /* Cannabis and vaping are supplied on scripts or pharmacist supply: records are the normal dispensing records.
    Prescriber approvals (SAS / Authorised Prescriber) belong to the prescriber, so the "access pathway" question goes.
    One useful question stays: THC-containing products are Schedule 8 (S8 storage and register apply). */
 drop('cannabis',['records','scopeEvidence']);drop('vaping',['records']);
 sopFields.cannabis.push(['thc','Do you supply THC-containing (Schedule 8) medicinal cannabis products?',['Yes','No','Needs verification'],'Scope']);
 add('cannabis','thc',{note:'Products containing THC are Schedule 8, so your S8 storage and register apply. CBD-only products are not S8.'});
 /* NSP is anonymous: no service records question. */
 drop('nsp',['records']);
 /* Plain tick lists instead of empty boxes. */
 add('simple','preparations',{type:'multi',label:'What do you compound?',options:['Creams, ointments and gels','Oral liquids and suspensions','Capsules','Other'],display:{Other:'Other (describe)'},describe:['Other'],note:'Simple compounding is making a medicine in the pharmacy from a recipe, e.g. a cream or an oral liquid, when no suitable product is available.'});
 add('complex','preparations',{type:'multi',label:'What complex preparations do you make?',options:['Sterile preparations (e.g. eye drops, injections)','Hormone preparations','Hazardous medicines (e.g. cytotoxic)','Other'],display:{Other:'Other (describe)'},describe:['Other'],note:'Complex compounding needs special facilities or training, e.g. sterile or hazardous preparations.'});
 add('screening','tests',{type:'multi',label:'Which health checks do you offer?',options:['Blood pressure','Blood glucose','Cholesterol','Weight and BMI','Diabetes risk check (AUSDRISK)','Other'],display:{Other:'Other (describe)'},describe:['Other'],note:'Screening and risk assessment means health checks done in the pharmacy, such as a blood pressure or blood glucose check, or a risk questionnaire.'});
 for(const id of ['simple','complex','screening']){const row=sopFields[id].find(f=>['preparations','tests'].includes(f[0]));if(row)row[2]=null;}
 /* OTP: LAIB is one of the medicines, not a separate question. */
 const LAIB='Long-acting injectable buprenorphine (LAIB)';
 add('otp','medicines',{options:['Methadone oral liquid','Buprenorphine/naloxone sublingual films',LAIB],note:'Tick LAIB if your pharmacists give the injections here.'});
 add('otp','laib',{showIf:()=>false});
 add('otp','approvalConditions',{label:'Does your pharmacy’s NSW Health approval to dose OTP patients have any special conditions? (optional)',note:'Only if your approval letter lists extra conditions, e.g. a maximum number of patients. Leave blank if none.'});
 add('otp','fileFrequency',{note:'R.Pharmacy hasn’t found a fixed legal interval for this review; choose what suits your pharmacy. (To be source-checked against the NSW OTP guidance.)'});
 /* OTP procedures: same choice as elsewhere. No "done but not written down". */
 const proc={incidents:'missed doses and intoxicated patients',incidentProcess:'reporting and notifying OTP incidents',films:'supervising film doses',takeawayControls:'authorised take-away doses',maintenance:'pump cleaning, calibration and maintenance'};
 for(const [k,what] of Object.entries(proc)){
  add('otp',k,{options:[SQ_DRAFT,SQ_OWN],display:{[SQ_DRAFT]:'Draft it for me (a section to complete in your OTP procedure)',[SQ_OWN]:'We already have our own (say where it is kept)'},describe:[SQ_OWN],
   legacy:{'Documented local procedure':SQ_OWN,'Done, not written down':SQ_DRAFT,'No documented procedure yet':SQ_DRAFT},task:{[SQ_DRAFT]:'Complete the '+what+' section of your OTP procedure'},
   note:'R.Pharmacy adds this section to your OTP procedure with a Task to complete it. Clinical steps aren’t written for you here because they must follow the current NSW OTP guidance.'});
  (RPH.sq.PROC.otp??={})[k]={label:'Procedure for '+what,text:'[Confirm: write the steps for '+what+', following the current NSW OTP guidance]'};
  const row=sopFields.otp.find(f=>f[0]===k);if(row)row[2]=[SQ_DRAFT,SQ_OWN];
  RPH.express&&(RPH.express.ASSUME.otp??=[]).push(k);
 }
})();
/* LAIB answer follows the medicines answer (one question instead of two). */
RPH.sq.laibFrom=a=>{const m=a.medicines;if(!m||m==='Needs verification')return a.laib;return RPH.qm.has(m,'Long-acting injectable buprenorphine (LAIB)')?'Yes':'No';};
const sqFields2=fsFields;fsFields=function(id,a){return sqFields2(id,id==='otp'?{...a,laib:RPH.sq.laibFrom(a)}:a);};
const sqSet2=sopSet;sopSet=function(n,id,values){const v={...values};if(id==='otp'&&v.medicines){const l=RPH.sq.laibFrom(v);if(l)v.laib=l;}return sqSet2(n,id,v);};
const sqMigrate=RPH.qm.migrate;RPH.qm.migrate=(id,values)=>{const out=sqMigrate(id,values);
 if(id==='otp'&&out.laib==='Yes'&&out.medicines&&out.medicines!=='Needs verification'&&!RPH.qm.has(out.medicines,'Long-acting injectable buprenorphine (LAIB)'))out.medicines+=',Long-acting injectable buprenorphine (LAIB)';return out;};

/* HMR / RMMR: referral and claim questions follow who performs the review (owner, 20 Nov 2026).
   Pharmacy's own credentialed pharmacist only → the pharmacy receives referrals and submits claims (filled in, not asked).
   An external credentialed pharmacist does some or all reviews → ask who receives referrals and who claims. */
RPH.sq.reviewOwn=(a,p)=>{const r=a[p+'reviewer'];return !!r&&r!=='Needs verification'&&!RPH.qm.has(r,'External credentialed pharmacist');};
for(const p of ['HMR','RMMR'])for(const x of ['referral','claimant']){const m=RPH.qm.meta.reviews[p+x],prev=m.showIf;
 m.showIf=a=>(!prev||prev(a))&&!!a[p+'reviewer']&&!RPH.sq.reviewOwn(a,p);
 m.note='Asked because an external credentialed pharmacist does some or all of your '+p+'s.';}
const sqSet3=sopSet;sopSet=function(n,id,values){const v={...values};
 if(id==='reviews')for(const p of ['HMR','RMMR'])if(RPH.sq.reviewOwn(v,p))for(const x of ['referral','claimant'])if(!v[p+x])v[p+x]='The pharmacy';
 return sqSet3(n,id,v);};

/* ===== Round 4 (owner notes on the one-flow setup, 20 Nov 2026) ===== */
(()=>{
 const M=RPH.qm.meta,setItem=(id,k,v,t)=>{const it=M[id]?.[k]?.items?.find(i=>i.v===v);if(it){it.t=t;RPH.qm.displayMap[v]=t;}};
 // "Schedule thing": S8 = Schedule 8; the capitals are the marking the Regulation requires on the contents list.
 setItem('daa','labels2026','S8 courier rules','Schedule 8 (S8) packs sent by courier: opaque packaging with nothing outside showing it holds S8; the contents list is marked “SCHEDULE 8/9 — CHECK CAREFULLY” (wording the Regulation requires); the signed receipt comes back');
 setItem('delivery','s8Delivery2026','Courier packaging','Courier packaging for Schedule 8 (S8): opaque, nothing outside showing it holds S8, and the contents list marked “SCHEDULE 8/9 — CHECK CAREFULLY” (wording the Regulation requires)');
 M.delivery.s8Delivery2026.label='Schedule 8 (S8) deliveries · new rules from 5 Nov 2026';
 // Verified against the Regulation 2026 text (owner-supplied, SL 2026-330): s 136(1)(a) Appendix L; s 191(2) marking size and address.
 const L=M.daa.labels2026.items;if(!L.some(i=>i.v==='Appendix L information'))L.unshift({v:'Appendix L information',t:'Labels carry the information required by the Poisons Standard, Appendix L (s 136(1)(a))'});RPH.qm.displayMap['Appendix L information']=L[0].t;
 setItem('daa','labels2026','S8 courier rules','Schedule 8 (S8) packs sent by courier: opaque packaging with nothing outside showing it holds S8, properly addressed; inside, a contents list with “SCHEDULE 8/9—CHECK CAREFULLY” in bold capitals at least 12.5 mm high; the signed, dated receipt comes back (s 190, s 191)');
 setItem('delivery','s8Delivery2026','Courier packaging','Courier packaging for Schedule 8 (S8): opaque, nothing outside showing it holds S8, properly addressed; inside, a contents list with “SCHEDULE 8/9—CHECK CAREFULLY” in bold capitals at least 12.5 mm high (s 191)');
 M.daa.labels2026.label='DAA labels and records · new rules from 5 Nov 2026';
 if(M.daa.thirdParty2026)M.daa.thirdParty2026.label='External packer · new rules from 5 Nov 2026';
 // "Secured transport" defined.
 Object.assign(M.delivery.transport,{display:{...(M.delivery.transport.display||{}),'Secured transport':'Secured: sealed, tamper-evident and never left unattended','Temperature-controlled transport':'Temperature-controlled for fridge (cold-chain) items'},
  note:'Secured means the package is sealed so tampering shows, kept locked and out of sight in the vehicle, and never left unattended. Tick both if you deliver fridge items.'});
 Object.assign(RPH.qm.displayMap,M.delivery.transport.display);
})();
/* Decision 1: no "who is responsible" questions. Procedures name the pharmacist in charge. */
RPH.sq.LEAD.daa=[...(RPH.sq.LEAD.daa||[]),'sampleReviewer'];
const sqFields4=fsFields;fsFields=function(id,a){return sqFields4(id,a).filter(f=>!RPH.sq.isLead(id,f[0]));};
const sqSet4=sopSet;sopSet=function(n,id,values){const v={...values};for(const k of RPH.sq.LEAD[id]||[])if(!v[k])v[k]=n.serviceLead||'Pharmacist in charge';return sqSet4(n,id,v);};
/* Vaccines in groups, each with "Select all". */
RPH.sq.VGROUPS=[['Seasonal and adult',['COVID-19','Influenza','Pneumococcal (Capvaxive or Prevenar 20)','Zoster (Shingrix only)','RSV (Arexvy or Abrysvo)','Diphtheria/tetanus/pertussis (e.g. dTpa or ADT)']],
 ['Catch-up and childhood',['Measles/mumps/rubella (MMR)','Poliomyelitis','Varicella (chickenpox)','Human papillomavirus (HPV)','Meningococcal ACWY','Meningococcal B','Meningococcal C','Haemophilus influenzae type b (Hib)','Hepatitis A','Hepatitis B']],
 ['Travel',['Typhoid (oral or injection)','Cholera (oral)','Japanese encephalitis','Rabies (pre-exposure)']],
 ['Special programs',['Mpox (JYNNEOS; authorised settings only)']]];
RPH.sq.groupVaccines=function(){const box=$('editor')?.querySelector('.rph-question');if(!box||box.querySelector('.vgroup'))return;
 const labels=[...box.querySelectorAll(':scope>label.fresh-option')];if(!labels.some(l=>/Japanese encephalitis/.test(l.textContent)))return;
 const byText=t=>labels.find(l=>l.textContent.trim()===t);let anchor=labels[0].previousElementSibling;
 for(const [name,list] of RPH.sq.VGROUPS){const g=D.el('section',{class:'vgroup'});const head=D.el('div',{class:'vg-head'});head.append(D.el('b',{text:name}));
  const all=D.el('button',{type:'button',class:'vg-all',text:'Select all'});
  all.onclick=()=>{const boxes=list.map(byText).filter(Boolean).map(l=>l.querySelector('input'));const on=boxes.every(b=>b.checked);for(const b of boxes)if(b.checked===on)b.click();all.textContent=on?'Select all':'Clear';};
  head.append(all);g.append(head);for(const t of list){const l=byText(t);if(l)g.append(l);}
  anchor.after(g);anchor=g;}
 const other=byText('Other (describe)');if(other)anchor.after(other);};
const sqCard4=fsCard;fsCard=function(id,move=''){const r=sqCard4(id,move);if(id==='vaccination')RPH.sq.groupVaccines();return r;};

/* ===== Round 5 (owner notes, 20 Nov 2026 evening) ===== */
(()=>{const M=RPH.qm.meta,setItem=(id,k,v,t)=>{const it=M[id]?.[k]?.items?.find(i=>i.v===v);if(it){it.t=t;RPH.qm.displayMap[v]=t;}};
 // Packing method can be more than one (e.g. a machine plus manual packs).
 Object.assign(M.daa.packing,{type:'multi',note:'Tick all that apply.'});
 // Plainer S8 courier sentences (Reg s 190, s 191).
 setItem('delivery','s8Delivery2026','Courier packaging','S8 sent by courier: opaque packaging, properly addressed, nothing outside showing it’s S8. Inside: a contents list headed “SCHEDULE 8/9—CHECK CAREFULLY” in bold capitals at least 12.5 mm high');
 setItem('daa','labels2026','S8 courier rules','S8 packs sent by courier: opaque packaging, properly addressed, nothing outside showing it’s S8. Inside: a contents list headed “SCHEDULE 8/9—CHECK CAREFULLY” in bold capitals at least 12.5 mm high. The signed, dated receipt comes back');
 // What the PPA DAA rules say about the routine check.
 M.daa.sampleFrequency.note='PPA DAA Program Rules (Sept 2026): monitoring and follow-up must follow the PSA DAA guidelines and Pharmacy Board guidelines; the rules don’t set a fixed interval. Choose what suits your pharmacy.';
})();
/* Option to answer evidence and record-location questions during setup instead of later. */
RPH.sq.evidenceNow=()=>{try{return !!readDraft('setup-evidence')?.on;}catch{return false;}};
const sqCat5=RPH.express.cat;
RPH.express.cat=function(id,f){const c=sqCat5(id,f);return c==='verify'||c==='later'?(RPH.sq.evidenceNow()?'ask':c):c;};
const sqServices5=fsServicesSelect;
fsServicesSelect=function(){sqServices5();const box=$('editor')?.querySelector('#setup-how');if(!box||box.querySelector('.ev-now'))return;
 const l=D.el('label',{class:'ev-now'});const c=D.el('input',{type:'checkbox'});c.checked=RPH.sq.evidenceNow();c.onchange=()=>setDraft('setup-evidence',c.checked?{on:true}:null);
 l.append(c,D.el('span',{text:'Also answer evidence and record questions now (consents, registrations, where records are kept). About 1–2 extra minutes a service. Leave unticked to do them later from Today.'}));box.append(l);};
/* "Review due dates": how often each review runs, and a suggested date to fill. */
RPH.sq.dueHints=function(){const ed=$('editor');if(!ed?.open||ed.querySelector('.due-hints'))return;
 if((ed.querySelector('#dialog-title')?.textContent||'').trim()!=='Review due dates')return;
 const form=ed.querySelector('.fresh-form')||ed;const rows=[];
 for(const a of catalog().filter(x=>isActive(x))){const lab=[...form.querySelectorAll('label')].find(l=>l.firstChild?.textContent?.trim()===a.name||l.textContent.trim().startsWith(a.name));const i=lab?.querySelector('input[type=date]');if(!i)continue;
  const m=RPH.sd?.months(a)||0;lab.append(D.el('small',{class:'due-hint',text:'How often: '+(a.frequency||'—')+(m&&!i.value?' · suggested '+pretty(addInterval(today(),m,'months')):'')}));if(m&&!i.value&&!i.disabled)rows.push([i,addInterval(today(),m,'months')]);}
 /* Owner note (20 Nov): preload the dates. Suggested dates are filled in on open; nothing is saved until the owner
    taps Save, and "Clear suggested dates" empties them again. */
 for(const [i,v] of rows){i.value=v;i.classList.add('due-pre');i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));}
 const b=D.el('div',{class:'due-hints',role:'status'});
 if(rows.length){b.append(D.el('span',{text:rows.length+' suggested date'+(rows.length>1?'s':'')+' filled in from how often each review runs. Change any, then save. Nothing is scheduled until you save.'}));
  const c=D.el('button',{type:'button',class:'due-clear',text:'Clear suggested dates'});c.onclick=()=>{for(const [i,v] of rows)if(i.value===v){i.value='';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));}c.disabled=true;c.textContent='Cleared';};b.append(c);}
 const first=form.querySelector('label');if(rows.length)(first||form).before(b);else b.remove();};
new MutationObserver(()=>RPH.sq.dueHints()).observe($('editor'),{childList:true,subtree:true});
