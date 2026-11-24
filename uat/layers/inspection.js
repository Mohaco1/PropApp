/* ===== Inspection readiness (owner, 20 Nov 2026 · "imagine you're a PRU officer", top 3) =====
 * 1. "S8 at a glance": one screen for S8: inventory (s 111), who the law puts it on (s 108, s 122), where the
 *    records are, S8 answers from service setup, open S8 actions and the last S8 checks.
 * 2. "Legal obligations": one line per Regulation section that applies, with who it falls on, where the
 *    evidence is kept and when the owner last sighted it. Only the owner fills these in; nothing is assumed.
 * 3. "Pharmacist in charge": recorded with a start date (s 122(2) puts S8 storage on them). Changes keep history.
 * 4. Approval guard: a procedure can't be approved or reviewed while its text still has "[Confirm: …]" or
 *    "— verify" markers.
 * Incident steps and drug-register details: NSW Health Pharmaceutical Services pages (current 5 and 18 Nov 2026):
 *  lost-stolen-drugs.aspx, lost-stolen-drug-register.aspx, schedule-8-medicines.aspx, schedule8-destruction.aspx.
 * Source for every line: Medicines, Poisons and Therapeutic Goods Regulation 2026 (NSW) (2026-330), text supplied
 * by the owner and checked section by section. Summaries, not the law itself: each line says to read the section.
 */
RPH.insp={};
RPH.insp.REG='Medicines, Poisons and Therapeutic Goods Regulation 2026 (NSW)';
/* [key, section, title, requirement (plain summary of the text), falls on, services (empty = every pharmacy keeping S8)] */
RPH.insp.OBL=[
 ['s108','s 108–110','S8 drug register','A drug register for S8 substances: a bound book with numbered pages (or an approved electronic register), a separate page for each substance, brand, strength and form, with every transaction entered on the day it happens, kept on the premises where the S8 is stored (NSW Health).','The responsible person for a pharmacy is the holder of a financial interest in it: the proprietor (s 108(1)(i))',[]],
 ['s111','s 111','S8 inventory every 3 months','An accurate inventory of all S8 substances every 3 months (unless NSW Health approved other times), entered in the drug register under the last entry for each substance with the quantity held and the date, and signed.','The responsible person (the proprietor) must ensure it is made',[]],
 ['s111-3','s 111(3)','Inventory on taking control','Anyone who takes control of the pharmacy for 1 month or more must have an S8 inventory made in the drug register immediately on taking control.','The person taking control',[]],
 ['s122','s 122','S8 storage','S8 kept in a dedicated, locked room, receptacle or fridge, on its own (except with S9, or in a fridge holding only scheduled substances), fixed to the premises and not accessible to the public. Keys kept on a pharmacist or in a separately locked receptacle only a pharmacist can open; codes never told to anyone who is not a pharmacist.','You (the Regulation names the pharmacist in charge on the day, s 122(2))',[]],
 ['s148','s 148','S8 destruction at the pharmacy','Destroyed in front of an eligible witness (a pharmacist not employed at or financially interested in the pharmacy and not family, or a medical or nurse practitioner who is not family), and recorded in the drug register: date, substance and quantity, both names, registration numbers and signatures.','The pharmacist destroying it',[]],
 ['s194','s 194','Receipt of S8 orders','Written notice of receipt to the supplier within 24 hours of receiving an S8 order.','The person who ordered and received it',[]],
 ['s56','s 56','Verify S8 prescriptions','No more than 2 days’ supply of an S8 on prescription until the prescription is verified with the prescriber (unless the pharmacist knows the handwriting or the patient).','The supplying pharmacist',[]],
 ['s57','s 57','Copies of S8 prescriptions','Keep a copy of every S8 (and Schedule 4D anabolic steroid) prescription supplied, kept separately from other prescriptions (not needed for conformant electronic prescriptions).','The supplying pharmacist',[]],
 ['s115','s 115','Dispensing records','For every supply on prescription: date, the prescription details, the supplying pharmacist’s name and the prescription reference number.','The supplying pharmacist',[]],
 ['s185','s 185','Keeping records','No false entries; corrections only by a dated, initialled margin note or footnote; records kept at least 2 years and shown on demand to an authorised officer or police.','Everyone who must keep a record under the Regulation',[]],
 ['s81','s 81','OTP Standards','Dispensing methadone or buprenorphine under an OTP registration in line with the NSW OTP Standards.','The dispensing pharmacist',['otp']],
 ['s136','s 136–137','Dose administration aids','DAA labels (date packed, date of birth, Appendix L information, no oral and external-use medicines together) and label records kept by the pharmacist and the packer; third-party packing follows the prescription.','The pharmacist and the packer',['daa','daa-external-b']],
 ['s190','s 190–191','Delivering S8','S8 delivered personally (signed, dated receipt), by registered mail, or by carrier (written evidence of consignment; carrier gets a signed receipt; opaque, properly addressed, marked contents list inside).','The supplying pharmacist',['delivery','aged']],
 ['s70','s 70','Vaccination records','Vaccines given under a Health Secretary authority and the approved standards, with the patient, vaccine (brand, batch, expiry), site, date, place, reference number and pharmacist recorded; training evidence kept if the authority requires it.','The vaccinating pharmacist',['vaccination']],
 ['s33','s 33–35','Supply without a prescription','Emergency and continued-supply rules (for example s 33: up to 7 days’ treatment or the smallest pack, not again within 30 days) and their records.','The supplying pharmacist',['prescribing','prescribing-ready']],
 ['s12','s 12','Urgent supply to aged care','Urgent wholesale supply to a residential care facility only on a signed written order, in the original pack, approved by the facility’s medicines governance committee or the Health Secretary, with a supply record.','The supplying pharmacist',['aged']],
 ['s134','s 134','Labelling','Supplied scheduled substances labelled as the Poisons Standard requires, with the pharmacy’s name and contact details as the dispenser.','The supplying pharmacist',['simple','complex']]
];
RPH.insp.applies=o=>!o[5].length||o[5].some(s=>state.active.includes(s));
RPH.insp.ev=(k,n=state)=>n.legalEvidence?.[k]||{};
/* ---------- Pharmacist in charge ---------- */
RPH.insp.pic=(n=state)=>(n.pharmacistInCharge||[]).find(p=>!p.end)||null;
RPH.insp.picScreen=function(){
 const b=fsOpen('Pharmacist in charge');b.classList.add('insp');const cur=RPH.insp.pic();
 peLine(b,'The pharmacist in charge must make sure S8 substances are stored as the Regulation requires (s 122(2)). Recording who it is, and from when, answers the first question an inspector asks.');
 const st=D.el('p',{class:'insp-cur',role:'status'});st.textContent=cur?'Current: '+cur.name+' · since '+pretty(cur.start):'Not recorded yet.';b.append(st);
 const name=peField(b,cur?'New pharmacist in charge':'Pharmacist in charge (name)');name.maxLength=120;name.autocomplete='off';
 const start=peField(b,'From');start.type='date';start.value=today();
 peLine(b,'Anyone who takes control of the pharmacy for 1 month or more must have an S8 inventory made immediately on taking control (s 111(3)). If that applies, plan it in Calendar. Nothing is planned for you.').classList.add('insp-note');
 const msg=D.el('p',{class:'sd-msg',role:'status'});
 fbtn(b,'Save',()=>{const nm=name.value.trim(),d=start.value;if(!nm){msg.textContent='Enter a name.';return;}if(!/^\d{4}-\d{2}-\d{2}$/.test(d)){msg.textContent='Enter the date they started.';return;}
  if(cur&&d<cur.start){msg.textContent='The date can’t be before '+pretty(cur.start)+', when '+cur.name+' started.';return;}
  if(fsChange('Recorded pharmacist in charge · '+nm+' from '+pretty(d),n=>{const list=n.pharmacistInCharge??=[];const c=list.find(p=>!p.end);if(c)c.end=d;list.push({id:'pic-'+crypto.randomUUID(),name:nm,start:d,at:new Date().toISOString(),by:RPH.actor(n).name});})){
   msg.textContent='Saved.';name.value='';st.textContent='Current: '+nm+' · since '+pretty(d);draw();}}).classList.add('primary');
 b.append(msg);
 const hist=D.el('div',{class:'insp-hist'});b.append(hist);
 const draw=()=>{hist.replaceChildren();const list=[...(state.pharmacistInCharge||[])].reverse();if(list.length<1)return;hist.append(D.el('h4',{text:'History'}));const ul=D.el('ul');for(const p of list)ul.append(D.el('li',{text:p.name+' · '+pretty(p.start)+' to '+(p.end?pretty(p.end):'now')}));hist.append(ul);};draw();
 fbtn(b,'S8 at a glance',()=>RPH.insp.s8()).classList.add('quiet');
 fbtn(b,'Close',()=>fsClose()).classList.add('quiet');
};
/* ---------- Evidence rows (where kept + last sighted), shared by both screens ---------- */
RPH.insp.rows=function(parent,keys){const inputs=[];
 const ul=D.el('ul',{class:'insp-list'});parent.append(ul);
 for(const o of RPH.insp.OBL.filter(o=>keys.includes(o[0]))){const e=RPH.insp.ev(o[0]);const li=D.el('li');
  const top=D.el('div',{class:'insp-top'});top.append(D.el('span',{class:'insp-sec',text:o[1]}),D.el('b',{text:o[2]}));li.append(top);
  li.append(D.el('p',{class:'insp-req',text:o[3]}),D.el('p',{class:'insp-who',text:'Falls on: '+o[4]}));
  const g=D.el('div',{class:'insp-ev'});
  const w=D.el('input',{type:'text',maxLength:160,'aria-label':'Where it’s kept · '+o[2],placeholder:'Where it’s kept (e.g. register in the S8 safe)'});w.value=e.where||'';
  const dl=D.el('label',{class:'insp-d'});dl.append(D.el('span',{text:'Last sighted'}));const d=D.el('input',{type:'date','aria-label':'Last sighted · '+o[2]});d.value=e.date||'';d.max=today();dl.append(d);
  g.append(w,dl);li.append(g);
  li.append(D.el('small',{class:'insp-state',text:e.date?'Last sighted '+pretty(e.date)+(e.by?' by '+e.by:''):'Not sighted yet'}));
  ul.append(li);inputs.push([o[0],w,d]);}
 return inputs;};
RPH.insp.saveRows=function(inputs,msg,label){
 const changed=inputs.filter(([k,w,d])=>{const e=RPH.insp.ev(k);return (w.value.trim()!==(e.where||''))||(d.value!==(e.date||''));});
 if(!changed.length){msg.textContent='Nothing changed.';return false;}
 if(changed.some(([,,d])=>d.value&&d.value>today())){msg.textContent='“Last sighted” can’t be in the future.';return false;}
 const ok=fsChange(label+' · '+changed.length+' updated',n=>{const m=n.legalEvidence??={};const by=RPH.actor(n).name,at=new Date().toISOString();for(const [k,w,d] of changed)m[k]={where:w.value.trim(),date:d.value,by,at};});
 msg.textContent=ok?'Saved.':'Not saved.';return ok;};
/* ---------- S8 at a glance ---------- */
RPH.insp.S8RX=/\bS8\b|Schedule 8|drug register|controlled/i;
RPH.insp.s8=function(){
 const b=fsOpen('S8 at a glance');b.classList.add('insp');
 peLine(b,'Everything about Schedule 8 in one place. Summaries of the '+RPH.insp.REG+'; read the section before relying on it.');
 // inventory
 const s1=D.el('section',{class:'sd-sec'});s1.append(D.el('h4',{text:'S8 inventory · s 111'}));
 const meta=RPH.schedule.meta('B1'),last=meta.lastCompleted||[...state.reviews].filter(r=>r.audit==='B1').map(r=>r.date).sort().pop()||'',next=state.schedule?.B1||'';
 const kv=D.el('div',{class:'insp-kv'});const add=(a,v,cls)=>{kv.append(D.el('span',{text:a}),D.el('b',{text:v,class:cls||''}));};
 add('Last recorded check',last?pretty(last):'None recorded in the app');add('Next due',next?pretty(next):'No date yet',next&&next<today()?'w-late':'');
 if(meta.approvedTimes)add('NSW Health approved times',meta.approvedTimes.reference);
 s1.append(kv);if(typeof RPH.schedule.dialog==='function')fbtn(s1,next?'Change the date':'Plan the inventory',()=>RPH.schedule.dialog('B1')).classList.add('quiet');b.append(s1);
 // people
 const s2=D.el('section',{class:'sd-sec'});s2.append(D.el('h4',{text:'Who the law puts it on'}));const kv2=D.el('div',{class:'insp-kv'});
 const owners=RPH.currentProprietors().map(o=>o.name).join(', ')||'No proprietor recorded',pic=RPH.insp.pic();
 kv2.append(D.el('span',{text:'Drug register and inventory (s 108–111)'}),D.el('b',{text:owners+' (proprietor)'}),D.el('span',{text:'S8 storage (s 122)'}),D.el('b',{text:'You make sure it’s done · the Regulation names the pharmacist in charge on the day'}));
 s2.append(kv2);b.append(s2);
 // records
 const s3=D.el('section',{class:'sd-sec'});s3.append(D.el('h4',{text:'S8 records and rules'}),D.el('p',{class:'sd-note',text:'Record where each is kept and when you last saw it. Only you fill these in.'}));
 const inputs=RPH.insp.rows(s3,['s108','s111','s122','s148','s194','s56','s57']);const msg=D.el('p',{class:'sd-msg',role:'status'});
 fbtn(s3,'Save',()=>RPH.insp.saveRows(inputs,msg,'Updated S8 records')).classList.add('primary');s3.append(msg);b.append(s3);
 // service answers
 const svc=[];for(const id of state.active){let v,f;try{v=sopValues(id);f=fsFields(id,v);}catch{continue;}
  for(const r of f){const lab=RPH.qm.metaFor?.(id,r[0])?.label||r[1];const val=v[r[0]];if(val&&(RPH.insp.S8RX.test(lab)||RPH.insp.S8RX.test(String(r[1]))))svc.push([serviceName(id),lab,String(val)]);}}
 if(svc.length){const s4=D.el('section',{class:'sd-sec'});s4.append(D.el('h4',{text:'S8 in your services (from setup)'}));const ul=D.el('ul',{class:'insp-ans'});
  for(const [s,l,v] of svc){const li=D.el('li');li.append(D.el('b',{text:s+' · '+l}),D.el('span',{text:v==='Needs verification'?'To check later':v.replace(/,/g,', ')}));ul.append(li);}s4.append(ul);b.append(s4);}
 // open actions
 const acts=taskRows().filter(t=>t.status==='Outstanding'&&RPH.insp.S8RX.test(t.text||''));
 const s5=D.el('section',{class:'sd-sec'});s5.append(D.el('h4',{text:'Open S8 actions ('+acts.length+')'}));
 if(acts.length){const ul=D.el('ul');for(const t of acts)ul.append(D.el('li',{text:t.text+(t.due?' · due '+pretty(t.due):'')}));s5.append(ul);}else s5.append(D.el('p',{class:'sd-note',text:'None open.'}));b.append(s5);
 // if something goes wrong (NSW Health, current Nov 2026)
 const s6=D.el('section',{class:'sd-sec insp-inc'});s6.append(D.el('h4',{text:'If something goes wrong'}));
 const card=(t,steps,src,url)=>{const d=D.el('details');d.append(D.el('summary',{text:t}));const ol=D.el('ol');for(const x of steps)ol.append(D.el('li',{text:x}));d.append(ol);const a=D.el('a',{href:url,target:'_blank',rel:'noopener',text:src});const sm=D.el('small');sm.append('Source: ',a);d.append(sm);s6.append(d);};
 card('S8 or S4D missing or stolen',['Unexplained loss or theft: notify NSW Pharmaceutical Services immediately, using their online form for lost or stolen S8 and S4D medicines.','Keep a copy of the submitted form.','Record the loss in the drug register.','If more details come to light, submit the form again with them.','An explained loss (for example dead space in a syringe, or a witnessed spill) is recorded in the drug register; it is not notified.'],'NSW Health · Notifying the loss or theft of medicines','https://www.health.nsw.gov.au/pharmaceutical/Pages/lost-stolen-drugs.aspx');
 card('Drug register lost or destroyed',['This includes missing pages, or an electronic register you can no longer open (for example after a system failure or ransomware).','Notify NSW Pharmaceutical Services immediately, in writing, with what happened (s 112). Keep a copy.','Make an accurate inventory of all S8 held and enter it in a new drug register (s 112).','Try to find out what happened and recover the register or pages if you can.','If S8 is also missing, notify that separately using the lost or stolen form.'],'NSW Health · Loss or destruction of a drug register','https://www.health.nsw.gov.au/pharmaceutical/Pages/lost-stolen-drug-register.aspx');
 card('Destroying S8 at the pharmacy',['Use an independent witness: a pharmacist, medical practitioner or nurse practitioner who is not employed at the pharmacy, not a family member, and (if a pharmacist) has no financial interest in it (s 148).','Patient returns go in the register on receipt; expired stock is moved to a separate “for destruction” page.','Render it unusable (never down a sink or toilet) and record the date, medicine and quantity, and both names, registration numbers and signatures.'],'NSW Health · Destruction of S8 medicines at community pharmacies','https://www.health.nsw.gov.au/pharmaceutical/pharmacists/Pages/schedule8-destruction.aspx');
 b.append(s6);
 fbtn(b,'All legal obligations',()=>RPH.insp.legal()).classList.add('quiet');
 fbtn(b,'Close',()=>fsClose()).classList.add('quiet');
};
/* ---------- Legal obligations by section ---------- */
RPH.insp.legal=function(){
 const b=fsOpen('Legal obligations');b.classList.add('insp');
 const list=RPH.insp.OBL.filter(RPH.insp.applies),seen=list.filter(o=>RPH.insp.ev(o[0]).date).length;
 const st=D.el('p',{role:'status',class:'insp-cur'});st.textContent=seen+' of '+list.length+' sighted';b.append(st);
 peLine(b,'The sections of the '+RPH.insp.REG+' that apply to the services you run, in plain words. They are summaries: read the section itself before relying on it. Other law also applies (the Act, the Poisons Standard, Pharmacy Board guidelines, program rules).');
 /* Owner, 24 Nov: the pharmacist in charge changes day to day (rostered); the app no longer asks the owner to record one. */
 const inputs=RPH.insp.rows(b,list.map(o=>o[0]));const msg=D.el('p',{class:'sd-msg',role:'status'});
 fbtn(b,'Save',()=>{if(RPH.insp.saveRows(inputs,msg,'Updated legal obligations')){const n2=list.filter(o=>RPH.insp.ev(o[0]).date).length;st.textContent=n2+' of '+list.length+' sighted';}}).classList.add('primary');b.append(msg);
 fbtn(b,'S8 at a glance',()=>RPH.insp.s8()).classList.add('quiet');
 fbtn(b,'Close',()=>fsClose()).classList.add('quiet');
};
/* ---------- Pharmacy setup: three new rows ---------- */
const inspSite=siteSetup;
siteSetup=function(){inspSite.apply(this,arguments);const list=$('main')?.querySelector('.rph-menu');if(!list||list.querySelector('[data-insp]'))return;
 const add=(label,detail,fn,k)=>{const x=RPH.el('button',{type:'button',class:'rph-menu-row'},RPH.el('strong',{text:label}),RPH.el('small',{text:detail}));x.dataset.insp=k;x.onclick=fn;list.append(x);};
 const pic=RPH.insp.pic(),l=RPH.insp.OBL.filter(RPH.insp.applies);
 /* Pharmacist in charge row removed from setup (owner, 24 Nov: rostered day to day; responsibility sits with the proprietor). The screen and any saved history are kept. */
 add('S8 at a glance','Inventory, storage, records and S8 actions',()=>RPH.insp.s8(),'s8');
 add('Legal obligations',l.filter(o=>RPH.insp.ev(o[0]).date).length+' of '+l.length+' sighted · by Regulation section',()=>RPH.insp.legal(),'legal');};
/* ---------- Approval guard ---------- */
RPH.insp.MARK=/\[Confirm:[^\]]*\]|[^\n.]*—\s*verify[^\n.]*/g;
RPH.insp.markers=function(d){const out=[];const walk=v=>{if(typeof v==='string'){for(const m of v.match(RPH.insp.MARK)||[])out.push(m.trim());}else if(v&&typeof v==='object')for(const [k,x] of Object.entries(v))if(k!=='versions')walk(x);};
 walk({body:d?.body,openDraft:d?.openDraft,engine:d?.engine});return [...new Set(out)];};
const inspReview=procedureReview;
procedureReview=function(d,noChange){const m=RPH.insp.markers(d);if(!m.length)return inspReview.apply(this,arguments);
 const box=peDialog('Not ready to approve');box.classList.add('insp');
 peLine(box,'This procedure still has '+m.length+' item'+(m.length===1?'':'s')+' to confirm or verify. Resolve each in the procedure text, then approve. Nothing is approved while these remain.');
 const ul=D.el('ul',{class:'insp-marks'});for(const x of m.slice(0,30))ul.append(D.el('li',{text:x}));if(m.length>30)ul.append(D.el('li',{text:'…and '+(m.length-30)+' more'}));box.append(ul);
 fbtn(box,'Close',()=>fsClose());};
