/* ===== Real procedures from the sources (owner feedback 20 Nov 2026: "why are they so basic?") =====
 * DAA and OTP procedures are written as numbered steps, filled from the setup answers and cited to:
 *   - Medicines, Poisons and Therapeutic Goods Regulation 2026 (NSW), SL 2026-330 (text supplied by the owner):
 *     s 136 DAA labelling, s 137 third-party manufacture, s 185 records, s 190–191 S8 delivery/carriers.
 *   - PPA Dose Administration Aids Program Rules (September 2026), sections 3–9 (supplied by the owner).
 *   - NSW OTP Standards (November 2026), Standards for pharmacists at community pharmacy dosing points,
 *     items 1–7 (supplied by the owner).
 * Unknown answers stay as [Confirm: …] and are listed under "Confirm before adoption". Drafts stay drafts:
 * the proprietor reviews and approves them; nothing is approved for them. Clinical dosing decisions are not
 * written: the OTP parts that need clinical steps say so.
 */
RPH.proc={};
RPH.proc.REG='Regulation 2026';RPH.proc.PPA='PPA DAA Program Rules';RPH.proc.STD='OTP Standards';
RPH.proc.show=(id,k,v)=>RPH.qm.split(v).map(p=>RPH.qm.showFor(id,k,p)).join(', ');
RPH.proc.known=v=>!!v&&!['Needs verification','Evidence pending'].includes(v);
RPH.proc.build=function(id,t){
 const a=sopValues(id),confirm=[];
 const c=(k,fn,what)=>{const v=a[k];if(RPH.proc.known(v))return fn(v,RPH.proc.show(id,k,v));confirm.push(what);return '[Confirm: '+what+']';};
 const p=t(a,c),name=serviceName(id),L=[];
 const sec=(n,title,lines,num)=>{const xs=lines.filter(Boolean);if(!xs.length)return;L.push(n+'. '+title);xs.forEach((x,i)=>L.push(num?(i+1)+'. '+x:'• '+x));L.push('');};
 L.push(name+' — standard operating procedure','Draft generated from '+(state.pharmacyName||'the pharmacy')+'’s setup answers and the sources listed at the end. Review it, adjust it to how you work, and approve it in Policies. It is not legal advice.','');
 L.push('1. Purpose',p.purpose,'');
 sec(2,'Scope',p.scope);sec(3,'Responsibilities',p.roles);sec(4,'Procedure',p.steps,true);sec(5,'Records',p.records);sec(6,'Incidents and escalation',p.incidents);
 sec(7,'Proprietor oversight',p.oversight||['The proprietor reviews exceptions and open actions for this service at the site visit, and reviews this procedure at least annually or after a material change, incident or rule change.']);
 for(const m of L.join('\n').matchAll(/\[Confirm: ([^\]]+)\]/g))if(!confirm.includes(m[1]))confirm.push(m[1]);
 if(/per your research — verify/.test(L.join('\n')))confirm.push('steps marked “per your research — verify”: check each against the live NSW Health and TGA pages');
 if(/per your plan — verify/.test(L.join('\n')))confirm.push('steps marked “per your plan — verify”: check each against the current Strive for 5 and NSW Health cold-chain guidance');
 L.push('8. Confirm before adoption',...(confirm.length?confirm.map(x=>'• '+x.charAt(0).toUpperCase()+x.slice(1)):['• Nothing outstanding from setup.']),'• Check the steps match how your pharmacy works before approving.','');
 L.push('9. Sources',...p.sources.map(s=>'• '+s));
 return L.join('\n');
};
RPH.proc.templates={
 daa:(a,c)=>{
  const routes=RPH.qm.split(a.routes),house=routes.includes('house'),ext=routes.includes('routeA'),other=routes.includes('routeB');
  const ppa=RPH.qm.has(a.funded,'PPA DAA Program'),s8=a.s8==='Yes',courier=RPH.qm.has(a.handover,'Courier delivery');
  return {
   purpose:'Supply medicines in dose administration aids (DAAs) that are prepared from current prescriptions, checked by a pharmacist, labelled and supplied as the '+RPH.proc.REG+' requires'+(ppa?', and delivered under the PPA DAA Program where the patient is funded':'')+'.',
   scope:[
    'Packing: '+[house&&'on-site packing',ext&&'dispensed here and packed by an external licensed packer',other&&'dispensed and packed by another pharmacy'].filter(Boolean).join('; ')+'.',
    c('population',(v,s)=>'Patients: '+s+'.','which patients receive DAAs'),
    c('funded',(v,s)=>'Funding: '+s+'.','how DAAs are funded'),
    a.s8?(s8?'Schedule 8 medicines are packed in DAAs.':'Schedule 8 medicines are not packed in DAAs.'):null,
    ppa&&RPH.qm.has(a.population,'Residential aged care residents')?'PPA funding cannot be claimed for residents of aged care facilities ('+RPH.proc.PPA+' 3.2); their packs are supplied under other arrangements.':null],
   roles:[
    'Registered pharmacist: confirms the medication list, checks every completed pack and is responsible for the DAA supplied'+(ppa?' (the DAA must be checked by a registered pharmacist: '+RPH.proc.PPA+' 3.1)':'')+'.',
    house?c('preparation',(v,s)=>'Packs are prepared by: '+s+', under pharmacist supervision.','who prepares packs'):null,
    s8&&house?'Only a pharmacist places Schedule 8 medicines into packs.':null,
    'Proprietor: makes sure this procedure is followed, that the packing area is not accessible to the public, and reviews DAA exceptions at the site visit.'],
   steps:[
    c('consent',()=> 'Before the first pack, obtain and keep the patient’s or carer’s agreement to DAA supply.','patient or carer agreement to DAA supply')+(ppa?' For PPA-funded patients this must be written consent on the current PPA form, obtained before the service starts ('+RPH.proc.PPA+' 3.3).':''),
    ppa?'For PPA funding, confirm and record eligibility: Medicare/DVA card, current concession card, living at home in the community, and difficulty managing medicines or 5+ prescription medicines with difficulty ('+RPH.proc.PPA+' 3.2). A patient who stops being eligible can stay on the funded service for up to 4 weeks.':null,
    house?c('listCheck',v=>v==='No documented check yet'?'[Confirm: how the medication list is checked before packing]':'Before packing, a pharmacist verifies the current medication list against the prescriptions'+(ppa?' and the prescriber’s confirmation of the medicines to be packed ('+RPH.proc.PPA+' 4)':'')+'.','the medication list check before packing'):null,
    c('changes',()=> 'When medicines change, including after a hospital discharge, a pharmacist reviews the change before the next pack is prepared; superseded packs are withdrawn.','how medication changes are handled'),
    house?c('packing',(v,s)=>'Packing method: '+s+'. Packing happens in an area the public cannot access ('+(ppa?RPH.proc.PPA+' 3.1; ':'')+'storage and access requirements).','the packing method'):null,
    ext?'External packer: send manufacturing instructions that follow the prescriptions and the prescriber’s directions ('+RPH.proc.REG+' s 137(2)); the packer must be TGA-licensed to manufacture DAAs (s 137(4)).':null,
    other?'Another pharmacy dispenses and packs: get the patient’s consent before prescriptions are transferred, and packs carry the dispensing pharmacy’s details (NSW Health DAA guidance).':null,
    s8&&house?c('s8Storage',()=> 'Completed packs containing Schedule 8 medicines are stored in the locked S8 safe; other completed packs are stored separately.','storage of completed S8 packs'):null,
    house?c('finalCheck',v=>v==='No documented check yet'?'[Confirm: the final check of completed packs]':'A pharmacist checks every completed pack against the medication list before it is supplied.','the final check of completed packs'):null,
    c('signoff',(v,s)=>'The final check is recorded: '+s.toLowerCase()+'.','how the packing check is recorded'),
    'Label every pack with: the information required by the Poisons Standard, Appendix L; the date the medicines were packed; the patient’s date of birth'+(ext?'; and a reference number linking the pack, the manufacturing instructions and the prescriptions':'')+' ('+RPH.proc.REG+' s 136(1)).',
    'Never put medicines taken by mouth and medicines for external use only in the same pack ('+RPH.proc.REG+' s 136(2)).',
    c('handover',(v,s)=>'Supply: '+s.toLowerCase()+'. A pack is supplied only after it has been dispensed, packed and checked'+(ppa?' ('+RPH.proc.PPA+' 4.3)':'')+'.','how patients receive their packs'),
    s8&&courier?'Schedule 8 packs sent by courier: opaque packaging, properly addressed, nothing outside showing it holds S8; inside, a contents list headed “SCHEDULE 8/9—CHECK CAREFULLY” in bold capitals at least 12.5 mm high; keep evidence of consignment and get the signed, dated receipt back ('+RPH.proc.REG+' s 190–191).':null,
    'Monitor how each patient is managing their DAA and follow up concerns, as the PSA DAA guidelines describe'+(ppa?' ('+RPH.proc.PPA+' 4.4)':'')+'.',
    ppa?'Patient interviews are done in private, and the pharmacist doing them is not dispensing at the same time ('+RPH.proc.PPA+' 3.1).':null,
    c('sampleFrequency',(v,s)=>'Routine DAA check (a sample of packs and records): '+s.toLowerCase()+'. This is the pharmacy’s own interval; the PPA rules set none.','how often the routine DAA check is done')],
   records:[
    'Keep a record of the information on every DAA label'+(ext||other?' (the packer keeps one too)':'')+' ('+RPH.proc.REG+' s 136(3)) for at least 2 years, available for inspection ('+RPH.proc.REG+' s 185(3)).',
    'Correct a record only with a marginal note or footnote, initialled and dated; never alter or obliterate an entry ('+RPH.proc.REG+' s 185(2)).',
    ppa?'PPA-funded patients: keep the supporting documents for 7 years — consent form, eligibility, medicine lists, start dates and the checking pharmacist’s registration number ('+RPH.proc.PPA+' 8.3, 9).':null,
    ppa?'Claim each month’s services by the end of the next calendar month ('+RPH.proc.PPA+' 8.1).':null,
    c('deliveryEvidence',(v,s)=>'Pack collection and delivery records are kept in: '+s+'.','where pack collection or delivery records are kept')],
   incidents:['A wrong, missing or damaged pack: withdraw it, tell the pharmacist on duty, contact the patient (and prescriber if a dose was missed or wrong), and record what happened and what changed.','Recurring packing errors are raised at the next proprietor site visit as an action.'],
   sources:['Medicines, Poisons and Therapeutic Goods Regulation 2026 (NSW), 2026 No 330: s 136, s 137, s 185, s 190–191.',ppa?'Pharmacy Programs Administrator, Dose Administration Aids Program Rules, September 2026: sections 3–9.':'Pharmacy Programs Administrator, DAA Program Rules (September 2026), for funded patients only.','Pharmacy Board of Australia guidelines on DAAs and PSA guidelines for a DAA service (referenced by the PPA rules; not reproduced here).','NSW Health, Dose Administration Aids (pharmacist guidance).']};
 },
 otp:(a,c)=>{
  const meds=RPH.qm.split(a.medicines),laib=meds.some(m=>/LAIB/.test(m))||a.laib==='Yes',take=a.supply==='Supervised dosing and authorised take-away doses',paper=RPH.qm.has(a.records,'Paper'),busy=a.volumeBand==='Yes';
  const own=(k,label)=>c(k,v=>String(v).startsWith('We have our own')?'Follow the pharmacy’s own procedure for '+label+(v.includes(':')?' ('+v.slice(v.indexOf(':')+1).trim()+')':'')+'.':'[Confirm: write the steps for '+label+', following current NSW OTP guidance]',label+' procedure');
  return {
   purpose:'Provide opioid treatment program (OTP) dosing safely and as the NSW '+RPH.proc.STD+' (November 2026) require. Complying with the Standards is required under the '+RPH.proc.REG+'.',
   scope:[c('medicines',(v,s)=>'Medicines: '+s+'.','which OTP medicines are supplied'),take?'Supervised dosing and authorised take-away doses.':'Supervised dosing only.',busy?'80 or more patients have been dosed on one day: the amenity plan requirements apply ('+RPH.proc.STD+' 3).':null],
   roles:['Only pharmacists prepare, supply or administer OTP medicines ('+RPH.proc.STD+' 1(a)).',laib?'Pharmacists who give long-acting injectable buprenorphine (LAIB) do so within their scope, with appropriate training and demonstrated competency ('+RPH.proc.STD+' 4).':null,
    'Proprietor: keeps the pharmacy approved as a PBS (section 90) pharmacy and notifies the Pharmaceutical Services Unit of changes to the pharmacy’s name, address or ownership ('+RPH.proc.STD+' 2).',
    busy?'Proprietor: keeps a documented amenity plan, reviewed and updated every year, covering patient flow, a daily dosing plan, continuity, storage, security and staffing, with a signed staffing declaration ('+RPH.proc.STD+' 3).':null],
   steps:[
    'Dispense OTP prescriptions only if this pharmacy is the patient’s nominated dosing point. Prescriptions and directions must come directly from the prescriber, never from the patient; keep physical repeats here ('+RPH.proc.STD+' 5).',
    c('area',(v,s)=>'Supervised dosing happens in: '+s.toLowerCase()+'.','where supervised dosing happens'),
    'Record every supply in a compliant drug register, including the quantity of each observed dose, the number and quantity of take-away doses, and the days they cover ('+RPH.proc.STD+' 6).'+c('doseSystem',(v,s)=>' Doses are recorded in '+s+'.','the software used to record doses'),
    paper?'Paper subsidiary register: a bound book with numbered pages, one book per product, clear headings; record patient, prescription number, prescriber, quantity, date and take-away days; identify the dosing pharmacist; reconcile each day, sign it and enter the total in the main drug register ('+RPH.proc.STD+' 7).':null,
    take?c('takeaway',(v,s)=>'Take-away doses are prepared '+s.toLowerCase()+', labelled as Schedule 8 and supplied in child-resistant packaging ('+RPH.proc.STD+' 1(f)).','when take-away doses are prepared'):null,
    c('pump',(v,s)=>'Dosing equipment ('+s.toLowerCase()+') is maintained, cleaned and calibrated following its operating protocols ('+RPH.proc.STD+' 1(e)).','the dosing equipment'),
    'Store OTP medicines securely under the Medicine Storage Standards'+(laib?', including the Schedule 8 cold chain for LAIB':'')+' ('+RPH.proc.STD+' 1(c)).',
    'Document clinical interventions and communication with prescribers and other providers involved in the patient’s care ('+RPH.proc.STD+' 1(d)).',
    laib?'LAIB is given in a dedicated, private, clean area that is not the dispensary, storeroom or staff room, with hand hygiene, an impervious bench, two chairs (not a stool or wheeled chair for the patient), first-aid equipment, documented CPR procedures, room to perform CPR and clear access for emergency services ('+RPH.proc.STD+' 4).':null,
    own('incidents','missed doses and intoxicated patients'),
    meds.some(m=>/films/.test(m))?own('films','supervising film doses'):null],
   records:['Drug register'+(paper?' and subsidiary register':'')+' entries as above; registers and records are kept for at least 2 years and available for inspection ('+RPH.proc.REG+' s 185(3)).','Staff training records showing staff are trained for the service ('+RPH.proc.STD+' 1(g)).',c('fileSystem',(v,s)=>'Patient files are kept in '+s+'.','where OTP patient files are kept')],
   incidents:[own('incidentProcess','reporting and notifying OTP incidents'),'Register discrepancies are investigated and reported as the Regulation requires.'],
   oversight:['The proprietor checks the OTP procedure covers every part of '+RPH.proc.STD+' item 1 (see “Your OTP procedure”), reviews OTP exceptions at the site visit and the monthly OTP check-in, and reviews this procedure at least annually.'],
   sources:['NSW Opioid Treatment Program, OTP Standards (NSW Ministry of Health, November 2026): Standards for pharmacists practising at community pharmacy dosing points, items 1–7.','Medicines, Poisons and Therapeutic Goods Regulation 2026 (NSW), 2026 No 330: s 185.','Current NSW OTP clinical guidance (referenced; clinical steps are not written by R.Pharmacy).']};
 }
};
const procDoc=sopDocument;
sopDocument=function(id){
 if(RPH.proc.templates[id]&&state.active.includes(id)&&state.serviceConfig?.[id]?.complete)return RPH.proc.build(id,RPH.proc.templates[id]);
 const out=procDoc.apply(this,arguments);
 // never show internal development notes in a procedure
 return typeof out==='string'?out.split('\n').filter(l=>!/Full Draft 0\.2|workflow handover/i.test(l)).join('\n'):out;
};

/* ===== Every other service (owner, 20 Nov 2026: "vaping, medicinal cannabis etc is so basic") =====
 * Built the same way: numbered steps filled from the answers, cited where a source we hold says so
 * (Regulation 2026 text; PPA Program Rules for Staged Supply, HMR, RMMR, MedsCheck; NSW Health pharmacist
 * vaccination table). Where the rule lives in a document we don't hold (TGA vaping rules, Pharmacy Board
 * compounding guidelines, NSW NSP policy, prescribing protocols), the step says so and asks you to confirm it.
 */
(()=>{const R=RPH.proc.REG,REC='Records are kept for at least 2 years and available for inspection; corrections only by an initialled, dated marginal note ('+R+' s 185).';
 const where=(c,k,label)=>c(k,(v,s)=>label+': '+s+'.','where '+label.toLowerCase()+' are kept');
 const T=RPH.proc.templates;
 T.delivery=(a,c)=>{const s8=a.controlled==='Yes',courier=RPH.qm.has(a.provider,'External provider');return {
  purpose:'Get dispensed medicines to patients’ homes intact, to the right person, with a record of handover'+(s8?', including Schedule 8 medicines as the '+R+' requires':'')+'.',
  scope:[c('provider',(v,s)=>'Deliveries by: '+s+'.','who performs deliveries'),s8?'Includes Schedule 8 medicines.':'Schedule 8 medicines are not delivered.'],
  roles:['Pharmacist: checks the order is complete, correct and labelled for the right patient and address before it leaves.','Driver or courier: hands over only to the patient or an authorised person and records the handover.','Proprietor: reviews delivery exceptions at the site visit.'],
  steps:['A pharmacist checks each order before it leaves: right patient, address, medicines, labels and any fridge items.',
   c('transport',(v,s)=>'Pack for transport: '+s.toLowerCase()+'.','transport safeguards'),
   'Hand over only to the patient or a person they have authorised; confirm identity first.',
   c('handover',(v,s)=>'Record the handover: '+s.toLowerCase()+'.','how handover is recorded'),
   c('failure',v=>v==='Return to pharmacy and contact pharmacist'?'If delivery fails, bring the medicines back to the pharmacy the same trip and tell the pharmacist; never leave medicines unattended.':'If delivery fails, follow the documented escalation steps; never leave medicines unattended.','what happens after a failed delivery'),
   s8?'Schedule 8: get a signed and dated receipt from the person who receives it ('+R+' s 190).':null,
   s8&&courier?'Schedule 8 by courier: opaque packaging, properly addressed, nothing outside showing it holds S8; a contents list inside headed “SCHEDULE 8/9—CHECK CAREFULLY” in bold capitals at least 12.5 mm high; keep written evidence of consignment and get the courier’s signed receipt back ('+R+' s 190–191).':null,
   s8?c('controlledRef',v=>String(v).startsWith('We have our own')?'Follow the pharmacy’s own S8 delivery procedure.':'Undelivered Schedule 8 medicines come back to the pharmacy the same day, are checked against the register and returned to the S8 safe.','the S8 delivery procedure'):null],
  records:[where(c,'paperwork','Delivery records'),REC],
  incidents:['A lost, damaged or wrongly delivered package: tell the pharmacist straight away, contact the patient, record what happened; for Schedule 8, check the register and report a loss as the Regulation requires.'],
  sources:['Medicines, Poisons and Therapeutic Goods Regulation 2026 (NSW), 2026 No 330: s 185, s 190–191.']};};
 T.staged=(a,c)=>{const ppa=RPH.qm.has(a.funding,'PPA-funded');return {
  purpose:'Supply medicines in instalments exactly as the prescriber directs, with consent, secure storage and follow-up of missed collections'+(ppa?', meeting the PPA Staged Supply Program Rules for funded patients':'')+'.',
  scope:[c('funding',(v,s)=>'Funding: '+s+'.','how staged supply is funded'),a.s8==='Yes'?'Includes Schedule 8 medicines.':'Does not include Schedule 8 medicines.',ppa?'PPA funding covers patients referred by their prescriber who hold a concession card, live at home and take opioid analgesics, antipsychotics, anxiolytics, hypnotics/sedatives, antidepressants or psychostimulants; not aged care or hospital residents; up to 15 patients a month (PPA Staged Supply Rules 3.2, 6). OTP medicines are excluded.':null],
  roles:['Pharmacist: prepares, checks and supplies each instalment against the current direction.','Proprietor: reviews missed collections and exceptions at the site visit.'],
  steps:['Confirm the prescriber’s direction for staged supply before the first instalment'+(ppa?' (funded patients must be referred by their prescriber)':'')+'.',
   c('consent',()=> 'Get the patient’s or carer’s consent before starting'+(ppa?'; for PPA-funded patients this must be written consent on the current PPA form (PPA Staged Supply Rules 3.3)':'')+'.','where consent records are kept'),
   'Prepare instalments only from the current direction; record any change and where it came from.',
   'Prepare and supply instalments in the dispensary; store prepared instalments where the public can’t reach them'+(a.s8==='Yes'?', with Schedule 8 instalments in the S8 safe ('+R+' s 122)':'')+'.',
   'Supply each instalment on the directed day, record it, and give no more than directed.',
   'A missed collection: the pharmacist reviews it the same day and contacts the patient and, where needed, the prescriber.',
   ppa?'Funded patients pay no extra charge for the service (PPA Staged Supply Rules 3.1).':null],
  records:[c('fileSystem',(v,s)=>'Instalment records are kept in '+s+'.','where instalment records are kept'),ppa?'PPA: keep supporting documents for 7 years (consent, eligibility, medicines, instalment dates) and claim by the end of the next calendar month (Rules 7.1, 7.3, 8).':null,REC],
  incidents:['Wrong instalment or quantity: tell the pharmacist, contact the patient and prescriber, record and review.'],
  sources:['Medicines, Poisons and Therapeutic Goods Regulation 2026 (NSW), 2026 No 330: s 122, s 185.',ppa?'Pharmacy Programs Administrator, Staged Supply Program Rules, September 2026.':'PPA Staged Supply Program Rules (September 2026) apply to funded patients only.']};};
 T.vaccination=(a,c)=>({
  purpose:'Give vaccinations safely: the right person, the right vaccine, an unbroken cold chain, readiness for anaphylaxis and complete records, as the '+R+' and the NSW Pharmacist Vaccination Standards require.',
  scope:[c('venue',(v,s)=>'Where: '+s.toLowerCase()+'.','where vaccination is provided'),c('vaccines',(v,s)=>'Vaccines offered: '+s+'.','which vaccines are offered'),c('funding',(v,s)=>'Funded programs: '+s+'.','government-funded programs')],
  roles:['Pharmacist immuniser: gives vaccines without a prescription only under an authority from the Health Secretary and in line with the approved standards ('+R+' s 70(1)), and holds the accredited training for each vaccine given.','Pharmacist on duty: makes sure fridge monitoring and the emergency kit are checked.','Proprietor: reviews storage, incidents and the storage self-audit at the site visit.'],
  steps:['Check eligibility, age and contraindications against the NSW Pharmacist Vaccination Standards and the Australian Immunisation Handbook before vaccinating.','Get and record consent.',c('fileSystem',(v,s)=>'Record screening and consent in '+s+'.','the screening and consent record system'),
   'Record for every vaccine: the person’s name, street address, date of birth and contact details; brand, batch and expiry; the site on the body; the date; the address where it was given; a reference number; and the immuniser’s name and contact details ('+R+' s 70(2)). Keep evidence of the immuniser’s training if the authority requires it (s 70(3)).',
   'Report every vaccine to the Australian Immunisation Register.',c('air',(v,s)=>'AIR reporting evidence is kept in: '+s+'.','where AIR reporting evidence is kept'),
   'Keep vaccines in the vaccine fridge and check and record temperatures as the cold-chain procedure requires.',c('cold',(v,s)=>'Cold-chain records are kept in: '+s+'.','where cold-chain records are kept'),
   'Observe each person after vaccination; keep the anaphylaxis kit with in-date adrenaline at the vaccination area.',
   c('emergency',v=>String(v).startsWith('We have our own')?'Follow the pharmacy’s own anaphylaxis procedure.':'Anaphylaxis: give adrenaline as the Australian Immunisation Handbook directs, call 000, stay with the person, then record the event and report it as an adverse event following immunisation. [Confirm: steps match the current Handbook]','the emergency (anaphylaxis) procedure')],
  records:[REC,'Complete a vaccine storage self-audit at least every 12 months, and again after a cold-chain breach or equipment failure (NSW Health guidance for pharmacist immunisers).'],
  incidents:['A cold-chain breach: isolate the vaccines, don’t use them, record temperatures and follow the NSW Health cold-chain breach steps.','A vaccination error or adverse event: look after the person, record it, report it, and review at the site visit.'],
  sources:['Medicines, Poisons and Therapeutic Goods Regulation 2026 (NSW), 2026 No 330: s 70, s 185.','NSW Health table of vaccines pharmacist immunisers may give (supplied by the owner, 20 Nov 2026); NSW Pharmacist Vaccination Standards; Australian Immunisation Handbook (referenced).']});
 T.reviews=(a,c)=>{const p=RPH.qm.split(a.program),hmr=p.includes('HMR only'),rmmr=p.includes('RMMR only');return {
  purpose:'Provide medication reviews that meet the PPA Program Rules, with the right referral, consent and records.',
  scope:[c('program',(v,s)=>'Programs: '+s+'.','which review programs are provided')],
  roles:['Credentialed pharmacist: carries out the review.','Proprietor: makes sure referrals, agreements and claims are in order.'],
  steps:[hmr?'HMR: only on a valid written referral from a medical practitioner for a single patient (a recommendation is not a referral). The same credentialed pharmacist does the interview and the report. A further HMR is only for clinical need after 24 months, never just an anniversary. The provider named in the referral lodges the claim (PPA HMR Program Rules).':null,
   rmmr?'RMMR: have a signed service agreement with each residential care facility, uploaded to the PPA Portal before any review there; reviews are claimable only within the agreement dates (PPA RMMR Program Rules 4.1, 6).':null,
   'Get the patient’s written consent before the review.',
   'MedsCheck (if offered): in a private area, one per patient per 12 months, not if they had an HMR or RMMR in the last 12 months, and the patient must be present (PPA MedsCheck Program Rules 3.2).'],
  records:['Keep referrals, consents, reports and claim records for 7 years (PPA Program Rules).',REC],
  incidents:['A review finding that needs urgent action: contact the prescriber the same day and record it.'],
  sources:['Pharmacy Programs Administrator: HMR, RMMR, and MedsCheck and Diabetes MedsCheck Program Rules (supplied by the owner).']};};
 const gen=(id,extra)=>(a,c)=>Object.assign({purpose:'',scope:[],roles:['Pharmacist on duty: runs this service as described.','Proprietor: responsible for the service; reviews exceptions and open actions at the site visit.'],steps:[],records:[c('records',(v,s)=>'Records are kept in: '+s+'.','where this service’s records are kept'),REC],incidents:['Errors or complaints: record them, tell the pharmacist on duty, fix the cause and review at the site visit.'],sources:['Medicines, Poisons and Therapeutic Goods Regulation 2026 (NSW), 2026 No 330: s 115, s 134, s 185.']},extra(a,c));
 T.prescribing=gen('prescribing',(a,c)=>({purpose:'Provide pharmacist prescribing only within the authority, protocol and training that apply to each condition.',
  scope:[c('pathway',(v,s)=>'Conditions: '+s+'.','which prescribing services are provided')],
  steps:['Prescribe only for conditions and medicines covered by the pharmacist’s current authority and the approved protocol, and only after the required training. [Confirm: the authority and protocol for each condition]',c('authority',(v,s)=>'The authority and protocol documents are kept in: '+s+'.','where the authority and protocol are kept'),'Assess each patient against the protocol’s inclusion and exclusion criteria; refer when the protocol says to.','Record the assessment, the decision and any medicine supplied; supply on a compliant prescription record ('+R+' s 48, s 115).','Tell the patient’s GP when the protocol requires it.','Keep supply without a prescription separate: continued dispensing ('+R+' s 35) and emergency supply (s 33–34) have their own conditions and records (s 116).']}));
 T.simple=gen('simple',(a,c)=>({purpose:'Make simple compounded medicines only when no suitable registered product is available, to a consistent standard.',
  scope:[c('preparations',(v,s)=>'Preparations: '+s+'.','what is compounded')],
  steps:['Compound only when clinically justified and no suitable registered product is available.','Use a documented formula and method for each preparation; check ingredients, quantities and calculations.','A pharmacist checks the finished product before supply.','Label it as the Poisons Standard requires, with the pharmacy’s name and contact details ('+R+' s 134), plus the expiry date set from the formula.','Keep the compounding record: formula, ingredients, batch and expiry of each, quantities, who made and checked it, and the date.','[Confirm: these steps match the Pharmacy Board of Australia compounding guidelines]']}));
 T.complex=gen('complex',(a,c)=>({purpose:'Make complex compounded medicines only with the facilities, equipment and training they need.',
  scope:[c('preparations',(v,s)=>'Preparations: '+s+'.','what complex preparations are made')],
  steps:['Make complex preparations only in a facility and with equipment validated for them; follow the validation and cleaning schedule.',c('validation',(v,s)=>'Facility and validation records are kept in: '+s+'.','where facility and validation records are kept'),'Only trained staff compound; training is recorded and refreshed.','Use a documented formula and method; record every batch; a pharmacist checks before release.','Label it as the Poisons Standard requires ('+R+' s 134).','[Confirm: these steps match the Pharmacy Board of Australia compounding guidelines and any standard for sterile or hazardous work]']}));
 T.aged=gen('aged',(a,c)=>({purpose:'Supply medicines to residential aged care facilities safely, with clear agreements, communication and records.',
  steps:[c('agreement',(v,s)=>'The supply agreement with each facility is kept in: '+s+'.','where facility agreements are kept'),'Supply residents’ medicines on valid prescriptions or medication charts.','Urgent supply to a facility for its imprest stock only on a written order signed by the facility’s authorised person, in the manufacturer’s original pack, and approved by the facility’s medicines governance committee (or the Health Secretary); record date, medicine, strength, quantity, batch, expiry, pharmacist and authorised person ('+R+' s 12).','Storage at the facility is the facility’s legal responsibility ('+R+' s 127); report concerns you see.',
   c('handover',v=>String(v).startsWith('We have our own')?'Follow the pharmacy’s own handover and escalation procedure.':'Urgent medication issues are escalated to the facility’s registered nurse in charge and the prescriber the same day, and the call is recorded. [Confirm: contacts and timeframes with each facility]','the handover and escalation procedure')],sources:['Medicines, Poisons and Therapeutic Goods Regulation 2026 (NSW), 2026 No 330: s 12, s 115, s 127, s 185.']}));
 T.screening=gen('screening',(a,c)=>({purpose:'Run health checks that give reliable results and lead to the right referral.',
  scope:[c('tests',(v,s)=>'Checks offered: '+s+'.','which health checks are offered')],
  steps:['Use each device as its manufacturer directs; run and record quality-control checks.',c('qc',(v,s)=>'Quality-control records are kept in: '+s+'.','where equipment QC records are kept'),'Explain the check and get consent; do it in a private area.','Give the result in writing with what it means; refer to a GP when a result is outside the normal range or the person has symptoms.','Record the result, the advice and any referral.','[Confirm: referral thresholds for each check]']}));
 T.adherence=gen('adherence',(a,c)=>({purpose:'Help patients take their medicines as intended, and act when support is interrupted.',
  steps:['Agree the support with the patient (and carer) and record it.','Check in at the agreed times; record each contact and any concern.','If support is interrupted or the patient is struggling, the pharmacist on duty follows up and, where needed, contacts the prescriber.']}));
 T.nsp=gen('nsp',(a,c)=>({purpose:'Provide needles and syringes safely and without judgement, with safe sharps disposal.',
  steps:['Supply as the NSW Needle and Syringe Program allows; no names or records of individuals are needed. [Confirm: the current NSW Health NSP policy steps]','Offer sharps containers and information on safe disposal.',
   c('safety',v=>String(v).startsWith('We have our own')?'Follow the pharmacy’s own sharps and needlestick procedure.':'Never recap needles; use approved sharps containers. After a needlestick: wash the area, get same-day medical assessment, and record and report it. [Confirm: matches the pharmacy’s infection-control arrangements]','the sharps and needlestick procedure')],records:[REC]}));
 T.certificates=gen('certificates',(a,c)=>({purpose:'Issue absence-from-work certificates only for what the pharmacist can attest to.',
  steps:['Assess the person in person; issue a certificate only for a condition within pharmacist scope, and only for the period the pharmacist can attest to.','Refer to a doctor when symptoms are serious, unclear or outside scope.','Keep a record of each certificate: date, person, the condition as stated, the period and the issuing pharmacist.',
   c('scopeEvidence',v=>String(v).startsWith('We have our own')?'Follow the pharmacy’s own assessment and referral procedure.':'[Confirm: steps match current Pharmacy Board of Australia guidance on certificates]','the assessment and referral procedure')]}));
 T.vaping=gen('vaping',(a,c)=>({purpose:'Supply therapeutic vapes only through the pathway that applies in NSW, with a consultation, the right records and advice on quitting.',
  steps:['Supply only through the current lawful pathway: on a valid prescription ('+R+' s 48) or, if NSW permits it, pharmacist supply after a consultation. [Confirm: which pathway applies in NSW now, and the age rules]',
   'Supply only products that meet the TGA’s product standard for therapeutic vapes; check the product before supply. [Confirm: the current TGA requirements]',
   'Give advice on using the product as a quitting aid and on other options; record the consultation.',
   'Label and record the supply as for any scheduled medicine ('+R+' s 115, s 134).',
   'Store vapes out of public reach, like other prescription medicines.',
   c('scopeEvidence',v=>String(v).startsWith('We have our own')?'Follow the pharmacy’s own vape supply procedure.':'[Confirm: the full steps for your supply pathway]','the vape supply procedure')]}));
 T.cannabis=gen('cannabis',(a,c)=>{const thc=a.thc==='Yes';return {purpose:'Dispense medicinal cannabis only on valid prescriptions, with the Schedule 8 controls that THC products need.',
  scope:[thc?'THC-containing (Schedule 8) products are supplied.':c('thc',()=> 'CBD-only (not Schedule 8) products only.','whether THC-containing (Schedule 8) products are supplied')],
  steps:['Dispense only on a prescription that meets the Regulation ('+R+' s 48); check the product is the one prescribed and, for unapproved products, that the prescriber’s TGA approval or authority is referred to. [Confirm: how you check the approval]',
   thc?'Schedule 8: verify the prescription with the prescriber before supplying more than 2 days’ supply, unless you know the prescriber’s handwriting or the patient ('+R+' s 56); keep a copy of the prescription, filed separately unless it is a conformant electronic prescription (s 57).':null,
   thc?'Enter every receipt and supply in the drug register on the day ('+R+' s 109–110); include THC products in the 3-monthly S8 inventory (s 111).':null,
   thc?'Store THC products in the S8 safe or locked room, with keys or codes held only by pharmacists ('+R+' s 122).':'Store products like other prescription medicines, out of public reach.',
   'Counsel the patient on use, driving and safety; record the counselling.','Label and record each supply ('+R+' s 115, s 134).'],sources:['Medicines, Poisons and Therapeutic Goods Regulation 2026 (NSW), 2026 No 330: s 48, s 56–57, s 109–111, s 115, s 122, s 134, s 185.']};});
 T.funding=gen('funding',(a,c)=>({purpose:'Deliver other funded programs to their program rules, with consent, records and claims in order.',
  scope:[c('programs',(v,s)=>'Programs: '+s+'.','which other programs are provided')],
  steps:['Follow each program’s current rules for eligibility, consent, service delivery and claiming. [Confirm: the rules for each program listed]','Keep the records each program requires for as long as it requires.']}));
})();

/* ===== Vaping, medicinal cannabis and screening from the owner's Drive material (20 Nov 2026) =====
 * Sources: owner's research "NSW Medicinal Cannabis and Therapeutic Vaping Compliance" (11 Nov 2026), which
 * summarises NSW Health (nicotine vaping page and vaping goods self-assessment; cannabis medicines page) and TGA
 * guidance; a medicinal cannabis practice audit and a blood pressure audit used by another app (structure only,
 * not copied). Items from the research are marked "(NSW Health/TGA, per your research — verify)" until checked
 * against the live pages. Regulation 2026 citations are from the Regulation text.
 */
(()=>{const T=RPH.proc.templates,REG='Medicines, Poisons and Therapeutic Goods Regulation 2026 (NSW), 2026 No 330',RS='(NSW Health/TGA, per your research — verify)',NV='(NSW Health, Legislative requirements for vaping products, Aug 2026; Vaping goods pharmacy self-assessment, June 2026)',NC='(NSW Health, Cannabis medicines page and FAQ, Nov 2026)';
 const REC='Records are kept for at least 2 years and available for inspection; corrections only by an initialled, dated marginal note (Regulation 2026 s 185).';
 const base={roles:['Pharmacist: supplies only after their own clinical check; no sales assistant authorises supply.','Proprietor: reviews exceptions, stock status and advertising for this service at the site visit.'],incidents:[],oversight:null};
 T.vaping=(a,c)=>Object.assign({},base,{
  purpose:'Supply therapeutic vapes only for smoking cessation or nicotine dependence, through the right pathway, from a pharmacy, with a consultation and the records and notifications each pathway needs.',
  scope:['Two pathways, kept separate: pharmacist supply without a prescription (Schedule 3) and supply on a prescription (Schedule 4). Cannabis vaporisers are not part of this service.'],
  steps:['Supply only for smoking cessation or managing nicotine dependence, never as a general sale '+NV+'.',
   'Without a prescription (Schedule 3): the patient is 18 or over and you have sighted ID; nicotine is 20 mg/mL or less; the pharmacist does the consultation, considers first-line options and decides it is appropriate; tell the patient the product is not on the ARTG and get informed consent; supply no more than a month’s use and only once in a month '+NV+'.',
   'For each Schedule 3 supply, the pharmacist makes the TGA SAS Category C notification within 28 days of the supply '+NV+'. Track the due date; the person who supplies makes the notification.',
   'On a prescription (Schedule 4): a valid prescription from a medical or nurse practitioner ('+REG.replace(' (NSW), 2026 No 330','')+' s 48) and the lawful TGA access pathway for that patient and product; nicotine no more than 50 mg/mL; under-18s only on a prescription from a medical or nurse practitioner with the right TGA pathway (16–17: AP or SAS B or C; 15 and under: AP or SAS B) '+NV+'.',
   'Supply only products on the TGA notified vaping goods list; check the list and withdrawn products when stocking and when TGA updates it; finished products only, no mixing kits; remove non-compliant stock '+NV+'.',
   'Supply in person to the patient or their carer '+RS+'.',
   'Counsel on use, dose and titration, interactions, other cessation options, and give quit-service contact details '+NV+'.',
   'Keep all vapes, liquids and devices behind the counter or in a restricted area; no self-selection; away from food; child-resistant packaging '+NV+'.',
   'No advertising or display of vapes, inside or outside the pharmacy or online '+NV+'.',
   'Label and record each supply as a dispensed medicine (Regulation 2026 s 115, s 134).',
   'Used devices and batteries go to e-waste (remove and tape the battery if safe), not the RUM bin or general waste; liquids, pods and cartridges may go in the RUM bin '+NV+'.',
   c('scopeEvidence',v=>String(v).startsWith('We have our own')?'Follow the pharmacy’s own vape supply procedure as well.':null,'the vape supply procedure')],
  records:['Consultation, consent, ID check and supply are recorded in the dispensing system; patient details stay there, not in R.Pharmacy.','Schedule 3: the SAS Category C notification and its date.',REC],
  incidents:['A faulty product or adverse event: look after the patient, stop supply of that product, and report to the TGA and the sponsor within 15 calendar days '+NV+'.'],
  sources:[REG+': s 48, s 115, s 134, s 185.','NSW Health, Legislative requirements for vaping products (current 20 Aug 2026) and Vaping goods pharmacy self-assessment tool (June 2026) — read in full 20 Nov 2026. Steps still marked “verify” are TGA rules NSW Health does not restate.']});
 T.cannabis=(a,c)=>{const thc=a.thc==='Yes';return Object.assign({},base,{
  purpose:'Dispense medicinal cannabis only on valid prescriptions, with the right TGA access pathway, independent clinical checks and, for THC products, the Schedule 8 controls.',
  scope:[thc?'THC-containing (Schedule 8) and CBD (Schedule 4) products.':c('thc',()=> 'CBD-only (Schedule 4) products.','whether THC-containing (Schedule 8) products are supplied'),'Packaged products only; compounding medicinal cannabis is not part of this service.'],
  steps:['Check each prescription meets the Regulation (s 48) and names the active ingredient(s), exact strength, dose and quantity; a strength range or category alone is not enough — refer back to the prescriber '+NC+'.',
   'For unregistered products, check the prescriber’s TGA access (SAS or Authorised Prescriber) covers this product and patient, and keep the approval where it can be checked at dispensing '+NC+'. Prescriber NSW approvals for substance dependence are the prescriber’s responsibility.',
   'Do not substitute a different product, strength or combination, even in the same TGA category, without the prescriber '+NC+'.',
   'No emergency supply of unregistered Schedule 8 cannabis medicines; a valid prescription is needed first '+NC+'.',
   thc?'Schedule 8: verify the prescription with the prescriber before supplying more than 2 days’ supply unless you know the prescriber’s handwriting or the patient (Regulation 2026 s 56); keep a separate copy of the prescription unless it is a conformant electronic prescription (s 57).':null,
   'At every supply: review use with the patient, check SafeScript NSW for other monitored medicines, tell the patient the cost before ordering, and counsel on safe use. THC: tell the patient it is illegal to drive after taking THC, whatever the source '+NC+'. CBD: advise against driving if it makes them drowsy '+RS+'.',
   'Use your own clinical judgement for every prescription, including from single-condition telehealth clinics; if supply isn’t safe or appropriate, don’t supply and tell the patient and prescriber '+RS+'.',
   'Order unregistered products only for a patient with a valid prescription and TGA access in place; the pharmacy may not hold stock of an unregistered cannabis medicine unless the TGA approved it for a particular patient '+NC+'.',
   'Flower products: supply with an approved vaporiser and instructions; don’t supply if the patient intends to smoke it.',
   thc?'Store THC products in the S8 safe or locked room, keys or codes held only by pharmacists (Regulation 2026 s 122); enter every receipt and supply in the drug register on the day (s 109–110) and include them in the 3-monthly S8 inventory (s 111).':'Store products out of public reach, like other prescription medicines.',
   'No exclusive supply arrangements with a prescriber, clinic or other third party (Ahpra Shared Code of Conduct) '+NC,
   'No advertising, signage, brochures or social posts about medicinal cannabis '+RS+'.',
   'Label and record each supply (Regulation 2026 s 115, s 134).'],
  records:['Prescriptions, TGA approvals and counselling notes are kept in the dispensing system; patient details stay there.',thc?'Drug register entries and the S8 inventory; uncollected, expired or returned S8 stock is destroyed only as the Regulation allows.':null,REC],
  incidents:['An adverse effect, a recall or a product problem: follow the incident, TGA adverse-event and recall processes; an S8 loss or theft is reported as the Regulation requires.'],
  sources:[REG+': s 48, s 56–57, s 109–111, s 115, s 122, s 134, s 185.','NSW Health, Cannabis medicines (current 5 Nov 2026) and Cannabis medicines FAQ — read in full 20 Nov 2026. Steps still marked “verify” come from TGA guidance or your research and are not restated by NSW Health.','A medicinal cannabis practice audit used by another app (checks only, not copied).']});};
 T.screening=(a,c)=>Object.assign({},base,{
  purpose:'Run health checks that give reliable results, in private, and lead to the right advice and referral.',
  scope:[c('tests',(v,s)=>'Checks offered: '+s+'.','which health checks are offered')],
  steps:['Do checks in a private area.','Only trained staff do checks; training in the measuring technique is recorded.','Maintain and calibrate each device as its manufacturer directs; record it.',c('qc',(v,s)=>'Calibration and quality-control records are kept in: '+s+'.','where equipment calibration and QC records are kept'),
   RPH.qm.has(a.tests,'Blood pressure')?'Blood pressure: the person sits quietly first, arm supported at heart level, with the right cuff size for their arm.':null,
   'Explain the result and what it means, in writing where useful, and answer questions.','Follow your written thresholds for abnormal results: what to advise, when to re-check, and when to refer to a GP or urgent care. [Confirm: your thresholds for each check]','Record each result, the advice and any referral; where you track a person’s results over time, record it in the patient’s record.'],
  records:['Results and referrals stay in the pharmacy’s patient records; R.Pharmacy holds no patient details.',REC],
  incidents:['A dangerously high or low result: follow the urgent referral steps straight away and record it.'],
  sources:[REG+': s 185.','A blood pressure audit used by another app (checks only, not copied).','Device manufacturers’ instructions (referenced).']});
})();

/* ===== Vaccination, fully: from the owner's Vaccine Management Plan guide (20 Nov 2026) =====
 * The guide is built on the National Vaccine Storage Guidelines "Strive for 5" (4th ed., 2025), the NSW Health
 * cold chain breach protocol and pharmacist ordering/storage page, and a PHN VAN toolkit (Sept 2026). Site names,
 * contacts and numbers are not copied. Steps from it are marked "(Strive for 5 / NSW Health, per your plan — verify)".
 */
(()=>{const T=RPH.proc.templates,REG='Medicines, Poisons and Therapeutic Goods Regulation 2026 (NSW), 2026 No 330',V='(Strive for 5 / NSW Health, per your plan — verify)';
 T.vaccination=(a,c)=>({
  purpose:'Give vaccinations safely and keep every vaccine within +2°C to +8°C from delivery to administration, with complete records, as the Regulation 2026, the NSW Pharmacist Vaccination Standards and Strive for 5 require.',
  scope:[c('venue',(v,s)=>'Where: '+s.toLowerCase()+'.','where vaccination is provided'),c('vaccines',(v,s)=>'Vaccines offered: '+s+'.','which vaccines are offered'),c('funding',(v,s)=>'Funded programs: '+s+'.','government-funded programs'),'Covers ordering, receipt, storage, monitoring, transport, administration, incidents and records.'],
  roles:['Pharmacist immuniser: gives vaccines without a prescription only under the Health Secretary’s authority and the approved standards (Regulation 2026 s 70(1)), holds training for each vaccine, and keeps it current.','Vaccine management lead (and a trained deputy): owns ordering, temperature records, logger reviews, incidents and the annual self-audit; the roster always covers one of them.','Every staff member who handles vaccines: has completed the NSW Health cold-chain module; certificates kept '+'(NSW Health pharmacist immuniser guidance and Safe vaccine storage checklist; Strive for 5, 4th ed., §3.8, §§4.1–4.5)'+'.','Proprietor: provides the equipment, training and backup arrangements, and reviews every incident.'],
  steps:['Store vaccines only in a purpose-built vaccine fridge, never a domestic or bar fridge; keep the power outlet labelled “Do not switch off”; vaccines stay in original cartons in labelled baskets, funded and private apart, off the walls and vents; no food in the fridge '+V+'.',
   'Twice on every open day, before using any vaccine: record the current, minimum and maximum temperature with time and initials, then reset the min/max; after weekends or closures, review the logger for the unattended period first '+V+'.',
   'A data logger records continuously (5-minute intervals) and alarms outside +2°C to +8°C; download, review and save the readings and graph every week '+'(NSW Health pharmacist immuniser guidance and Safe vaccine storage checklist; Strive for 5, 4th ed., §3.8, §§4.1–4.5)'+'.',
   c('cold',(v,s)=>'Temperature charts and logger files are kept in: '+s+'.','where cold-chain records are kept'),
   'Deliveries: accept only when a trained person can unpack straight away; check the cold and heat indicators, names, quantities, batches and expiries; anything doubtful stays quarantined at +2°C to +8°C until the supplier or Public Health Unit advises '+V+'.',
   'Every month and on each delivery: rotate stock so the earliest expiry is used first and list anything expiring within 2 months; never give an expired vaccine '+V+'.',
   'Check eligibility, age, intervals, contraindications and AIR history against the NSW Pharmacist Vaccination Standards and the Australian Immunisation Handbook; get and record consent.',
   c('fileSystem',(v,s)=>'Screening and consent are recorded in '+s+'.','the screening and consent record system'),
   'Record for every vaccine: the person’s name, street address, date of birth and contact details; brand, batch and expiry; the site on the body; the date; the address where it was given; a reference number; and the immuniser’s name and contact details (Regulation 2026 s 70(2)). Keep evidence of training if the authority requires it (s 70(3)).',
   'Report every vaccine given to the Australian Immunisation Register.',c('air',(v,s)=>'AIR reporting evidence is kept in: '+s+'.','where AIR reporting evidence is kept'),
   'Vaccinate in a clean, private area with an in-date anaphylaxis kit and trained support present; observe each person afterwards and tell them what reactions to expect.',
   c('emergency',v=>String(v).startsWith('We have our own')?'Follow the pharmacy’s own anaphylaxis procedure.':'Anaphylaxis: give adrenaline as the Australian Immunisation Handbook directs, call 000 and stay with the person; record it and report it as an adverse event following immunisation. [Confirm: steps match the current Handbook]','the emergency (anaphylaxis) procedure'),
   'Off-site or emergency transport: a pre-chilled, monitored cooler with conditioned ice packs and insulation; confirm +2°C to +8°C before loading; check every 15 minutes for the first 2 hours, then hourly '+V+'.'],
  records:['Temperature charts, logger reports, cooler charts and the storage self-audit: keep at least 2 years '+'(NSW Health pharmacist immuniser guidance and Safe vaccine storage checklist; Strive for 5, 4th ed., §3.8, §§4.1–4.5)'+'; vaccination records as the Regulation requires (s 70, s 185).','Complete the national vaccine storage self-audit at least every 12 months, and after any breach or equipment change; service the vaccine fridge every 12 months '+V+'.','Training and cold-chain certificates for everyone who handles vaccines.'],
  incidents:['Below +2°C, above +12°C, or +8°C to +12°C for 15 minutes or more: a cold-chain breach. Stop using the vaccines, quarantine them (“DO NOT USE”) at +2°C to +8°C, download the logger 24 hours either side, and report funded stock to the Public Health Unit straight away; ask the manufacturer about private stock; don’t discard anything until advised '+V+'.',
   '+8°C to +12°C for under 15 minutes with a clear reason: record the deviation and cause and keep monitoring; with no clear reason, treat it as a possible fridge fault and call the Public Health Unit '+V+'.',
   'Power failure: keep the fridge closed and monitor it; before it reaches +8°C, move vaccines to a monitored cooler or an agreed alternative vaccine fridge; when power returns, check it’s stable before restocking and monitor hourly for 4 hours '+V+'.',
   'A vaccination error or adverse event: look after the person, contact the Public Health Unit for advice, report suspected adverse events as NSW requires, and review at the site visit.'],
  sources:[REG+': s 70, s 185.','National Vaccine Storage Guidelines “Strive for 5”, 4th edition (2025); NSW Health cold chain breach protocol and pharmacist vaccine ordering and storage guidance; PHN VAN toolkit (Sept 2026) — as used in your Vaccine Management Plan. Verify against the current editions before approving.','NSW Health table of vaccines pharmacist immunisers may give (supplied by the owner, 20 Nov 2026); NSW Pharmacist Vaccination Standards; Australian Immunisation Handbook.']});
})();

/* ===== Research round (20 Nov 2026): official sources found by search (full pages not readable from this session) =====
 * Marked "(per search of <source> — verify)" until the full page is checked.
 */
(()=>{const T=RPH.proc.templates;
 const vape=T.vaping,TGA='(TGA, Supplying therapeutic vapes in pharmacies, 10 Oct 2025 — verify)';
 T.vaping=(a,c)=>{const p=vape(a,c);p.steps=[...p.steps.slice(0,3),
   'Before supplying on a prescription, search the TGA SAS and Authorised Prescriber Online System to check the prescription was issued under the AP scheme or a SAS pathway (NSW Health, Legislative requirements for vaping products, Aug 2026).',
   ...p.steps.slice(3)];
  p.sources=[...p.sources,'TGA, Supplying therapeutic vapes in pharmacies (10 Oct 2025) and Vapes: information for pharmacists — found by search; confirms Schedule 3 supply to adults 18+ at 20 mg/mL or less, notified list or ARTG products only, SAS Category C notification, the validation tool, and adverse event/defect reporting to the TGA and sponsor. The 28-day SAS Category C timing is confirmed for NSW by NSW Health (Aug 2026).'];return p;};
 const gen=(fn,extra)=>(a,c)=>{const p=fn(a,c);extra(p,a,c);return p;};
 const BRD='(Pharmacy Board of Australia, Guidelines on compounding of medicines, Oct 2024)';
 T.simple=gen(T.simple,p=>{p.steps=p.steps.filter(s=>!/Pharmacy Board of Australia compounding guidelines/.test(s));p.steps.push('Simple compounding uses formulas from reputable references; pharmacists are competent for it through their pharmacy qualification '+BRD+'.','Do a self-assessment of the types of compounding the pharmacy does, and keep it '+BRD+'.','For each compounding request, document a risk assessment with the clinical justification for compounding instead of a commercial product '+BRD+'.','Anything beyond simple compounding (sterile, hazardous, specialised) is referred to a complex-compounding pharmacy.');p.sources.push('Pharmacy Board of Australia, Guidelines on compounding of medicines (October 2024) — read in full 20 Nov 2026.');});
 T.complex=gen(T.complex,p=>{p.steps=p.steps.filter(s=>!/Pharmacy Board of Australia compounding guidelines/.test(s));p.steps.push('Pharmacists doing complex compounding meet the Board’s Professional Practice Profile for complex compounding, with additional facilities, working environment and equipment '+BRD+'.','Do a self-assessment of the types of compounding the pharmacy does, and keep it '+BRD+'.','For each compounding request, document a risk assessment with the clinical justification '+BRD+'.');p.sources.push('Pharmacy Board of Australia, Guidelines on compounding of medicines (October 2024) — read in full 20 Nov 2026; and the Professional Practice Profile for complex compounding.');});
 const NSP='(Pharmacy Guild NSW Pharmacy NSP Resource Manual, July 2022; NSW Health Community Sharps Guidance — verify)';
 T.nsp=gen(T.nsp,p=>{p.steps=[ 'Supply injecting equipment with a safe disposal container '+NSP+'.','Keep the sharps disposal unit in a secure area of the pharmacy that children cannot reach '+NSP+'.','The pharmacy is responsible for managing community sharps returned on its premises; where Fitpacks are supplied, provide sharps bins for disposal '+NSP+'.','The program is confidential and anonymous: no names or personal records of people using it (NSW Health Guideline GL2023_002).','Pharmacy staff acting in the ordinary course of their work are authorised to supply injecting equipment; no individual approval is needed (GL2023_002).','Fitpacks: through the NSW Pharmacy Fitpack Scheme run by the Pharmacy Guild NSW, which approves and trains participating pharmacies; sell Fitpacks and exchange used ones free of charge. Pharmacies may also sell needles and syringes outside the scheme (GL2023_002).','Offer the peer support line 1800 644 413 (1800-PeerLine) and treat everyone without stigma (GL2023_002).',...p.steps.filter(s=>/needlestick|sharps and needlestick|own sharps/.test(s))];
  p.records=['Keep records of sharps-bin collections and any needlestick incidents; no records of the people using the program.'];
  p.sources=['NSW Health Guideline GL2023_002, NSW Needle and Syringe Program (January 2023) — read in full 20 Nov 2026.','Pharmacy Guild of Australia (NSW Branch), NSW Pharmacy Needle and Syringe Program Resource Manual (July 2022); NSW Health, NSW Community Sharps Guidance; NSW Health NSP outlets page (exempt program under the Drug Misuse and Trafficking Regulation 2021, cl 37) — found by search; verify current versions.'];});
 const FW='(Fair Work Act 2009; PSA/Pharmacy Guild guideline on absence from work certificates — verify)';
 T.certificates=gen(T.certificates,p=>{p.steps=['This is an optional service. A certificate is evidence an employer may accept under the Fair Work Act 2009 s 107 (evidence that would satisfy a reasonable person); the employer decides what evidence it accepts, and some awards (e.g. Pharmacy Industry Award 2020 cl 24.2) add conditions for longer absences. Don’t promise it will be accepted.','Issue a certificate only when the person must be absent for their own illness or injury, or to care for an ill or injured family or household member '+FW+'.','Only for illnesses or injuries the pharmacist is qualified to assess, and only if, in the pharmacist’s professional opinion, the person is unfit for work; refer to a doctor otherwise '+FW+'.','Not for pregnancy or compassionate leave; short periods only; never backdated '+FW+'.',...p.steps.filter(s=>/record of each certificate|own assessment/.test(s))];
  p.sources=['Fair Work Act 2009 (Cth) s 107(2)–(3); Pharmacy Industry Award 2020 cl 24.2 (as cited in Codex’s review of 22 Nov 2026).','Fair Work Act 2009 (Cth); Pharmaceutical Society of Australia and Pharmacy Guild of Australia, guideline on absence from work certificates (citing Pharmacy Board of Australia expectations) — found by search; verify against the current guideline.'];});
 // research-based steps join the confirm list
 const b=RPH.proc.build;RPH.proc.build=function(id,t){let out=b(id,t);if(/— verify\)/.test(out)&&!/Steps marked “— verify”/.test(out))out=out.replace('8. Confirm before adoption\n','8. Confirm before adoption\n• Steps marked “— verify”: check each against the full official document before approving\n');return out;};
})();
