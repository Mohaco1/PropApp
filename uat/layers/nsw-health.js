/* ===== NSW Health Pharmaceutical Services site — gaps filled (owner, 20 Nov 2026: "fill in the gaps") =====
 * Source: health.nsw.gov.au/pharmaceutical, read in full on 20 Nov 2026 (189 pages, 111 PDFs). See
 * NSW-HEALTH-GAP-ANALYSIS.md and research/nsw-health-site-findings-2026-11-20.md. Every line below cites where
 * it comes from. Review lines are ADDED to existing reviews (never replacing ones whose answers the engine reads
 * by position). Nothing is marked done for the owner; the app stays an oversight tool, not the drug register,
 * a clinical record or a patient record.
 */
RPH.nsw={};
RPH.nsw.MSS='Medicine Storage Standards, Part 1';
RPH.nsw.ADD={
 B1:[
  'Storage (Medicine Storage Standards, Part 1.1): S8 kept in a safe of 9 mm mild steel with continuous welds, a flush 9 mm door with no more than 1.5 mm clearance, a welded locking bar and a five-lever (or equivalent) lock, or in a Grade VII strongroom; locked when not in immediate use; not accessible to the public.',
  'Fixing (Medicine Storage Standards): the safe and any S8 fridge are fixed with robust fastening (masonry: expanding bolts at least 12 × 50 mm; timber: 10 mm coach screws; no fixing points: 10 mm steel cable or 5 mm chain). The S8 fridge holds only scheduled medicines that need refrigeration and is locked.',
  'Keys and codes (Regulation s 122; NSW Health): keys on a pharmacist while open and off the premises (or in another safe) when closed; codes known only to pharmacists, changed at regular intervals, and personal codes removed when someone leaves.',
  'Drug register (Regulation s 109–110; NSW Health): kept on the premises; entries made the same day; a page per substance, brand, strength and form; it includes patient-held and expired stock (expired on a separate page); the owner makes sure staff follow it.',
  'Orders and receipts (Regulation s 194; NSW Health): S8 received straight into the safe and entered; receipt signed and the supplier told in writing within 24 hours; phone, fax or email orders confirmed in writing within 14 days.',
  'If an electronic drug register is used (Electronic Drug Register Standards and Guideline): unique logins only, leavers removed, access reviewed, audit logs reviewed by someone who does not make entries, and a bound book used during downtime with the balance entered afterwards.'],
 Q1:[
  'Prescriptions (NSW Health): new patient with an unknown prescriber means the script is verified (contact details from another source; the lost, stolen and forged list checked); if it cannot be verified and nothing is suspicious, no more than 2 days’ supply and the script is kept.',
  'Records (Regulation s 185; NSW Health): dispensed prescriptions, emergency supplies, urgent-use orders, wholesale and borrowing records, and copies of S8 and anabolic steroid prescriptions kept 2 years on the premises and producible without delay; paper S8 copies kept separately.',
  'Phone, fax or email directions (NSW Health): any script not received within 14 days was reported to Pharmaceutical Services.'],
 'vacc-ready':[
  'People (NSW Pharmacist Vaccination Standards; NSW Health): a named vaccine coordinator and a backup; every staff member handling vaccine storage has completed the NSW Health cold-chain module, with certificates kept; each immuniser’s NSW Pharmacist Immuniser Declaration Form is kept on the premises.',
  'Stock and power (NSW Health; Safe vaccine storage checklist): NIP and state-funded stock kept apart from private stock and labelled; domestic or bar fridges not used; the power-failure plan has been practised.',
  'Room (Vaccination Standards, part D): not the dispensary, with no patient access to S3, S4 or S8 medicines on the way in or out; two chairs (the patient’s is not a stool or on wheels); space to lie down; stretcher access; the fridge is locked if the public can reach it.',
  'Consent and records (Vaccination Standards, part F): consent recorded for every vaccination and kept 7 years (or until 25 for under-18s); AIR checked before and updated within 10 business days. If ownership changes, a new AIR provider number and a new VAN are needed.'],
 'service-vaccination':[
  'Reporting (Vaccination Standards, part G): adverse events reported to the public health unit (1300 066 055) straight after the response and by the next business day; administration errors disclosed to the patient, recorded on AIR and reported to the public health unit; cold-chain breaches of NIP or state stock reported and the stock quarantined at 2–8 °C labelled “Do not use”.'],
 'prescribing-ready':[
  'Patient and pharmacist physically present; consultation records include the pharmacist’s HPI-I; records uploaded to My Health Record unless the patient objects (NSW Class Authorities and Practice Standards, 5 Nov 2026).',
  'Financial consent before the consultation; Working with Children Check held where needed; pharmacists know they are mandatory reporters (NSW Health, Expanded scope – information for pharmacists).',
  'Authorities in date: the NSW prescribing Class Authorities expire on 4 November 2027 (check the replacement is in place).'],
 'otp-full':[
  'Registration (NSW Health; Application for pharmacy OTP registration): current for this owner, address and trading name — any change needs a new application; dosing point details current in SafeScript NSW.',
  'Undertaking (Application for pharmacy OTP registration): the proprietor and every pharmacist employed have read and understood the OTP Standards (record each pharmacist’s acknowledgement).',
  'Self-audit (NSW Health): the NSW Health OTP self-audit tool for community pharmacies has been completed for this period.'],
 'daa-house':[
  'Third-party packing (NSW Health, Dose Administration Aids; Regulation s 137): any third-party packer holds a TGA GMP licence; manufacturing instructions match the prescription and both sides keep them 2 years; patient consent obtained for third-party packing.'],
 'daa-external':[
  'Third-party packer (NSW Health, Dose Administration Aids; Regulation s 137): holds a TGA GMP licence; manufacturing instructions match the prescription and both sides keep them 2 years; patient consent to third-party packing recorded; the DAA identifies this pharmacy as the supplier.'],
 'daa-external-b':[
  'Transfer (NSW Health, Dose Administration Aids): patient consent obtained before prescriptions are transferred; this pharmacy does not label the DAA as the supplier — the packing pharmacy is the supplying pharmacy.'],
 'service-aged':[
  'Urgent-use stock (Regulation s 12; NSW Health RCF page and order of 5 Nov 2026): supplied only on an order signed and dated by the Director of Nursing (or care manager), in the original pack, from the NSW list or the facility’s approved list; after-hours arrangements agreed.',
  'S8 and charts (NSW Health RCF page): unwanted urgent-use S8 destroyed at the facility, not taken back to the pharmacy; paper medication chart duplicates kept current, each supply recorded, marked CANCELLED on final supply and kept 2 years; electronic charts used only if conformant after 31 March 2027.'],
 'service-delivery':[
  'S8 and S4D by courier or post (Regulation s 190–191; NSW Health FAQ): outer packaging does not show S8 or S4D; written evidence of consignment and the signed receipt kept; Australia Post rules checked before mailing dispensed medicines.'],
 'service-cannabis':[
  'Stock and supply (NSW Health, Cannabis medicines): no stock of an unregistered cannabis medicine unless the TGA approved it for a particular patient; no substitution of product or strength; no emergency supply of unregistered S8 cannabis; no exclusive supply arrangements.']
};
/* Vaping: NSW Health's own Pharmacy self-assessment tool (June 2026), used as the review itself. */
RPH.nsw.VAPE=[
 'Products (NSW Health vaping self-assessment): every vaping good sold is on the TGA list of notified vapes.',
 'Storage (self-assessment): all vaping goods are behind the counter; no self-selection.',
 'Advertising (self-assessment): no advertisements for vaping goods inside or outside the pharmacy.',
 'Pathway (self-assessment): products over 20 mg/mL only on prescription; every supply is through the TGA Authorised Prescriber scheme or a SAS pathway.',
 'Schedule 3 supply (self-assessment): purpose is quitting or nicotine dependence; patient 18 or over with identity and age sighted; informed consent; SAS Category C notification within 28 days; no more than one month at a time and one supply per patient per month.',
 'Information to patients (self-assessment): alternatives, dose and frequency, titration and duration, interactions, quit-support contacts, and that vaping goods are not TGA-assessed.',
 'Reporting (self-assessment): adverse effects and faulty goods are reported to the TGA and the sponsor (within 15 calendar days, NSW Health).'];
const nswQ=reviewQuestions;
reviewQuestions=function(a){const rows=nswQ.apply(this,arguments);
 if(a?.id==='service-vaping')return RPH.nsw.VAPE.slice();
 const add=RPH.nsw.ADD[a?.id];return add?[...rows,...add.filter(x=>!rows.includes(x))]:rows;};

/* Prescribing: the NSW-trained list, plus the five extra conditions for Queensland-trained (QUT/JCU) pharmacists. */
(()=>{const P=RPH.qm.meta.prescribing;if(!P?.pathway)return;
 const extra={'Musculoskeletal pain':'Mild, acute musculoskeletal pain (Queensland-trained pharmacists only)','Reflux (GORD)':'Gastro-oesophageal reflux / GORD (Queensland-trained pharmacists only)','Rhinitis':'Allergic and non-allergic rhinitis (Queensland-trained pharmacists only)','Acne':'Acne (Queensland-trained pharmacists only)','Nausea and vomiting':'Acute nausea and vomiting (Queensland-trained pharmacists only)'};
 P.pathway.options=[...P.pathway.options.filter(o=>!(o in extra)),...Object.keys(extra)];
 P.pathway.display={...P.pathway.display,Contraception:'Continuation of hormonal contraception (pill up to 35 µg ethinylestradiol, vaginal ring supply only, DMPA if trained to inject)',...extra};
 const items=P.prescribing2026?.items;if(items&&!items.some(i=>i.v==='My Health Record'))items.push(
  {v:'Patient present',t:'The patient and the pharmacist are both physically present at the pharmacy for the consultation'},
  {v:'My Health Record',t:'Consultation records are uploaded to My Health Record unless the patient asks otherwise, and adverse events go to the TGA and the GP'},
  {v:'Queensland-trained form',t:'Any Queensland-trained pharmacist offering the extra conditions has lodged NSW Health’s “Intention to provide expanded community pharmacy services” form'});
})();

/* Key dates and contacts (from the site). Shown in Pharmacy setup; filtered by the services offered. */
RPH.nsw.DATES=[
 ['2027-03-31','Electronic residential medication chart transition ends: only fully conformant eNRMC systems after this date','NSW Health, Residential care facilities',['aged']],
 ['2027-11-04','NSW pharmacist prescribing Class Authorities expire (UTI, contraception, skin and the Queensland-trained conditions)','NSW Health authorities of 5 Nov 2026',['prescribing','prescribing-ready']],
 ['2028-06-20','PharmaSelf24 collection unit exemption expires (if you use one)','NSW Health, Orders and exemptions',[]],
 ['2028-07-31','BD Rowa and Meditech collection unit exemptions expire (if you use one)','NSW Health, Orders and exemptions',[]],
 ['2028-11-04','NSW pharmacist vaccination authorities and Vaccination Standards expire','NSW Health authority of 5 Nov 2026 (HA26/4735)',['vaccination']],
 ['2028-11-05','Instruments made under the old 2008 Regulation lapse (if not replaced earlier)','NSW Health, Orders and exemptions',[]]];
RPH.nsw.CONTACTS=[
 ['NSW Pharmaceutical Services (enquiries, notifications)','MOH-PharmaceuticalServices@health.nsw.gov.au · online enquiry and notification forms on the Pharmaceutical Services website'],
 ['Lost or stolen S8 or S4D; lost drug register; lost, stolen or forged prescriptions','Online notification forms, NSW Health Pharmaceutical Services'],
 ['OTP registration (pharmacy)','MOH-Inspectionsandinvestigations@health.nsw.gov.au'],
 ['Public health unit (vaccine adverse events, errors, cold-chain breaches)','1300 066 055'],
 ['Drug and Alcohol Specialist Advisory Service (24/7)','1800 023 687'],
 ['OTP pharmacist-to-pharmacist advice line','1300 369 772'],
 ['healthdirect (patients with no GP, triage)','1800 022 222'],
 ['Prescription Shopping Information Service','1800 631 181'],
 ['e-prescription fraud','fraud@digitalhealth.gov.au']];
RPH.nsw.datesScreen=function(){const b=fsOpen('NSW Health dates and contacts');b.classList.add('insp');
 peLine(b,'Dates and contacts from the NSW Health Pharmaceutical Services website (read 20 Nov 2026). Check the site for replacements before each date.');
 const s1=D.el('section',{class:'sd-sec'});s1.append(D.el('h4',{text:'Key dates'}));const ul=D.el('ul',{class:'insp-ans'});
 for(const [d,t,src,svc] of RPH.nsw.DATES){if(svc.length&&!svc.some(x=>state.active.includes(x)))continue;const li=D.el('li');li.append(D.el('b',{text:pretty(d)+(d<today()?' · passed':'')}),D.el('span',{text:t+' ('+src+')'}));ul.append(li);}
 s1.append(ul);b.append(s1);
 const s2=D.el('section',{class:'sd-sec'});s2.append(D.el('h4',{text:'Contacts'}));const ul2=D.el('ul',{class:'insp-ans'});
 for(const [t,v] of RPH.nsw.CONTACTS){const li=D.el('li');li.append(D.el('b',{text:t}),D.el('span',{text:v}));ul2.append(li);}s2.append(ul2);b.append(s2);
 fbtn(b,'Close',()=>fsClose()).classList.add('quiet');};

/* Bought, selling or closing: what NSW Health says must happen (read-only list; nothing is marked for the owner). */
RPH.nsw.OWN=[
 ['Before the takeover',[
  'OTP dosing point: tell the buyer at least 2 weeks before; the new owner applies for a new OTP registration and emails Pharmaceutical Services at least 7 working days before taking over; order enough stock first (NSW Health).',
  'Vaccination: the new owner applies for a new AIR provider number and a new VAN; never use the previous owner’s (NSW Health).',
  'Collection unit: the Pharmacy Council of NSW is told before one is installed (exemption conditions).']],
 ['On the day',[
  'S8: whoever takes control of the pharmacy for 1 month or more has an S8 inventory made in the drug register immediately (Regulation s 111(3)).',]],
 ['After',[
  'healthdirect Service Finder listing updated (a legal condition for pharmacist prescribing).',
  'Closing a pharmacy: the proprietor stays responsible for dispensing records and prescriptions for 2 years from the last transaction, available to an authorised officer (NSW Health FAQ).',
  'Emergency closure: non-pharmacist staff may, at a pharmacist’s direction, move held prescriptions and repeats (not S8 or anabolic steroids) and deliver dispensed non-S8 medicines to patients (NSW Health FAQ).']]];
RPH.nsw.ownScreen=function(){const b=fsOpen('Bought, selling or closing');b.classList.add('insp');
 peLine(b,'Just bought the pharmacy, selling it or closing it? This is what NSW Health and the Pharmacy Council require. Work through it as a list; nothing here is marked for you.');
 for(const [h,items] of RPH.nsw.OWN){const s=D.el('section',{class:'sd-sec'});s.append(D.el('h4',{text:h}));const ul=D.el('ul');for(const t of items)ul.append(D.el('li',{text:t}));s.append(ul);b.append(s);}
 fbtn(b,'Close',()=>fsClose()).classList.add('quiet');};

/* Legal obligations: add the Standards and authorities alongside the Regulation sections. */
RPH.insp.OBL.push(
 ['mss','Storage Standards','Medicine Storage Standards (S8 safe and fridge)','S8 in a safe built to the Standards (9 mm steel, welded, flush door, locking bar, five-lever lock) or a Grade VII strongroom, fixed with robust fastening; S8 fridge locked, fixed and holding only scheduled medicines; codes changed regularly and removed for leavers.','You, as owner and responsible person (the Regulation also names the pharmacist in charge on duty, s 122)',[]],
 ['s112','s 112','Drug register lost or destroyed','Written notice to the Health Secretary immediately (including missing pages or an electronic register that can’t be opened), an accurate S8 inventory, and a new register.','The responsible person (the proprietor)',[]],
 ['rx','NSW Health','Suspected forged prescriptions','Verify independently; don’t dispense a forgery; keep the paper script or cancel the e-token; report to Pharmaceutical Services and the police.','The dispensing pharmacist',[]],
 ['otpreg','OTP registration','Pharmacy OTP registration','Registered before supplying; a new application for any change of owner, address or trading name; every pharmacist has read the OTP Standards.','The proprietor',['otp']],
 ['vstd','Vaccination Standards','NSW Pharmacist Vaccination Standards','Training and CPR, fridge and logger, twice-daily temperatures, room, consent kept 7 years, AIR within 10 business days, adverse events and errors reported to the public health unit.','Each pharmacist immuniser; the pharmacy for equipment and room',['vaccination']],
 ['pauth','Class Authorities','Pharmacist prescribing Class Authorities','Approved pharmacist and approved pharmacy conditions: enclosed consulting room, name displayed, healthdirect listing, secure digital records 7 years, record to the GP within a week. Expire 4 Nov 2027.','The pharmacist; the pharmacy for the room and listing',['prescribing','prescribing-ready']],
 ['vape','NSW Health / TGA','Therapeutic vaping goods','Notified vapes only, behind the counter, no advertising; Schedule 3 limits; SAS Category C within 28 days; adverse events to the TGA and sponsor within 15 days.','The supplying pharmacist; the owner for storage and advertising',['vaping']]);
/* S8 page: add the S8 Storage Standards line and forged-prescription card. */
const nswS8=RPH.insp.s8;
RPH.insp.s8=function(){nswS8.apply(this,arguments);const b=$('editor');const rows=b?.querySelector('.insp-list');
 const inc=b?.querySelector('.insp-inc');if(inc&&!inc.querySelector('[data-forged]')){const d=D.el('details');d.dataset.forged='1';d.append(D.el('summary',{text:'Suspected forged prescription'}));const ol=D.el('ol');
  for(const x of ['Don’t dispense it. Verify with the prescriber using contact details from another source (Ahpra register, clinic website), and check NSW Health’s list of lost, stolen and forged prescriptions.','Keep a paper prescription; cancel or disable an electronic token so it can’t be used.','Report it straight away to Pharmaceutical Services (online notification form) and to the police; electronic prescription fraud also to fraud@digitalhealth.gov.au.','If it can’t be verified but nothing is suspicious, no more than 2 days’ supply, keeping the prescription (Regulation s 56).'])ol.append(D.el('li',{text:x}));
  const a=D.el('a',{href:'https://www.health.nsw.gov.au/pharmaceutical/Pages/lost-stolen-prescriptions.aspx',target:'_blank',rel:'noopener',text:'NSW Health · Lost, stolen or forged prescriptions'});const sm=D.el('small');sm.append('Source: ',a);d.append(ol,sm);inc.append(d);}
};
/* Pharmacy setup: two more rows. */
const nswSite=siteSetup;
siteSetup=function(){nswSite.apply(this,arguments);const list=$('main')?.querySelector('.rph-menu');if(!list||list.querySelector('[data-insp=dates]'))return;
 const add=(label,detail,fn,k)=>{const x=RPH.el('button',{type:'button',class:'rph-menu-row'},RPH.el('strong',{text:label}),RPH.el('small',{text:detail}));x.dataset.insp=k;x.onclick=fn;list.append(x);};
 const next=RPH.nsw.DATES.find(([d,,,svc])=>d>=today()&&(!svc.length||svc.some(x=>state.active.includes(x))));
 add('NSW Health dates and contacts',next?'Next: '+pretty(next[0]):'Key dates and who to call',()=>RPH.nsw.datesScreen(),'dates');
 add('Bought, selling or closing','What NSW Health requires',()=>RPH.nsw.ownScreen(),'own');};
/* Site visit: short titles for the added NSW lines (the full text shows as the question). */
if(RPH.sv?.coreMeta&&RPH.sv.coreMeta.length===6)RPH.sv.coreMeta.push(
 ['rxverify','Prescription verification','Ask how unknown prescribers and new patients are verified, and look at how a suspected forgery would be handled (NSW Health, Lost, stolen or forged prescriptions).'],
 ['rxrecords','Prescription records (2 years)','Ask where dispensed prescriptions, S8 copies, emergency supplies, urgent-use orders and wholesale or borrowing records are kept, and that they can be produced without delay.'],
 ['rxdirections','Phone, fax and email directions','Check any phone, fax or email directions were followed by a prescription, and late ones were reported after 14 days.']);
/* ===== Pharmacy Council of NSW (hpca.nsw.gov.au/councils/pharmacy, read 20 Nov 2026) =====
 * Proprietor guidance, routine-inspection pitfalls, The Guide (premises standards, notices, offences).
 * See research/pharmacy-council-nsw-findings-2026-11-20.md. */
RPH.nsw.ADD['CO-P']=[
 'Premises equipment (Health Practitioner Regulation (NSW) 2025 Sch 5; Council Guide): purpose-built vaccine fridge, dispensing balance, scales to 1 kg, 200/100/10/5 mL measures, funnel, 2 mortars and pestles (1 glass), stirring rod, 2 spatulas, ointment slab, counting tray; scales and measures stamped.',
 'References (Council routine inspections): current Therapeutic Guidelines (digital) and Australian Medicines Handbook readily accessible, plus the Pharmacy Board’s list of reference texts and the NSW Medicines and Poisons Schedules guide. These are the most common inspection failures.',
 'Dispensary (Regulation cl 12(2); Council Guide): lit and ventilated; impervious sink with hot and cold running water; bench at least 40 cm wide with 1 m² of clear working space; a barcode scanner at every dispensing station.',
 'Displayed names (Council Guide Note 24): owner names at or near the main entrance; the name of the pharmacist in charge on duty next to the dispensing area (it can change day to day). Prices follow the Price Information Code of Practice.',
 'Council kept up to date (Council): renovations to the dispensary or surrounds, name changes, partners added or removed, and interests acquired or disposed of were all notified.'];
RPH.nsw.ADD.Q1=[...(RPH.nsw.ADD.Q1||[]),
 'Routine reports (Pharmacy Council, proprietor oversight): owing scripts, uncollected scripts, negative stock and wholesaler invoices against the S8 register looked at since the last visit.'];
if(RPH.sv?.coreMeta)RPH.sv.coreMeta.push(['reports','Routine reports','Ask to see the owing-scripts, uncollected-scripts and negative-stock reports, and compare a few wholesaler S8 invoices with the register (Pharmacy Council, Supporting resources for proprietor oversight).']);
RPH.nsw.DATES.push(
 ['2027-06-30','Every year by 30 June: pharmacy premises registration renewal fee, and each owner’s annual financial-interest declaration (1 May–30 April)','Pharmacy Council of NSW',[]]);
RPH.nsw.DATES.sort((a,b)=>a[0]<b[0]?-1:1);
RPH.nsw.CONTACTS.push(['Pharmacy Council of NSW (premises, ownership, notices)','hpca.nsw.gov.au/councils/pharmacy · routine inspections about every 18 months'],['Professional indemnity (PDL) incident advice','1300 854 838']);
RPH.nsw.OWN[0][1].push('Pharmacy Council of NSW: the right ownership application (sole pharmacist, partnership or body corporate) or notice of acquisition or disposal of a financial interest; all owners must be registered pharmacists and no one may hold interests in more than 5 NSW pharmacies (Council Guide).');
RPH.nsw.OWN[2][1].push('Closing: lodge the Notice of closure with the Pharmacy Council within 14 days (Council Guide Note 16).','Renovating or relocating the dispensary: the Council inspects before you reopen.');
/* Pharmacist in charge: their name must be displayed next to the dispensary. */
const pcPic=RPH.insp.picScreen;
RPH.insp.picScreen=function(){pcPic.apply(this,arguments);const n=$('editor')?.querySelector('.insp-note');if(n&&!$('editor').querySelector('.pc-display'))n.after(D.el('p',{class:'insp-note pc-display',text:'Display the pharmacist in charge’s name next to the dispensing area, and the owners’ names near the main entrance (Pharmacy Council of NSW).'}));};
/* Forged prescriptions: copy first; police notification is required (Council guidance). */
RPH.nsw.forgedExtra=['Make a copy of the prescription before you talk to the person (Pharmacy Council).','Notifying NSW Police is a legal requirement (Pharmacy Council).'];
const pcS8=RPH.insp.s8;
RPH.insp.s8=function(){pcS8.apply(this,arguments);const ol=$('editor')?.querySelector('[data-forged] ol');if(ol&&!ol.querySelector('.pc-x'))for(const t of RPH.nsw.forgedExtra)ol.append(D.el('li',{class:'pc-x',text:t}));};
/* ===== Pharmacy Board of Australia: Guidelines on the safe provision of pharmacy services (1 Oct 2026) =====
 * Replaced the proprietor, dispensing, DAA and practice-specific guidelines on 1 Oct 2026. Proprietors can't
 * delegate their responsibilities, wherever they are. Guidance 1.1–1.3 added to the annual governance review. */
RPH.nsw.ADD.A3=[
 'Resources and risk (Pharmacy Board guidelines 1.1–1.2, Oct 2026): staffing, workload, equipment and references were assessed for each service, and the assessment is written down (the Board may ask to see it). A service is paused if it can’t be staffed safely.',
 'People (Pharmacy Board guideline 1.2): staff are supervised for their experience and role, the training each role needs is identified, and everyone has confirmed they’ll work to the law and the pharmacy’s procedures.',
 'Learning from mistakes (Pharmacy Board guideline 1.2): near misses and errors are recorded and reviewed as a system, and concerns raised by staff or patients are written down and answered.',
 'Privacy and choice (Pharmacy Board guidelines 2–3): staff know the privacy rules and records are kept secure; no patient is told they must use this pharmacy because of an arrangement with a prescriber or clinic.'];
RPH.nsw.CONTACTS.push(['Pharmacy Board of Australia guidelines','pharmacyboard.gov.au · Guidelines on the safe provision of pharmacy services (from 1 Oct 2026)']);

/* Pharmacy setup complete: point a new owner at the ownership list. */
RPH.nsw.doneHook=function(){const ed=$('editor');if(!ed?.open||ed.querySelector('.nsw-bought'))return;if(!/Pharmacy setup complete/.test(ed.querySelector('#dialog-title')?.textContent||''))return;
 const p=D.el('p',{class:'sd-note nsw-bought'});p.append('Just bought this pharmacy? ');const a=D.el('button',{type:'button',class:'rph-link',text:'See what to do first'});a.onclick=()=>RPH.nsw.ownScreen();p.append(a);(ed.querySelector('.fresh-form')||ed).append(p);};
new MutationObserver(()=>RPH.nsw.doneHook()).observe($('editor'),{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
/* ===== Batch 6: research Codex reached (TGA recalls, privacy) ===== */
RPH.nsw.ADD.Q1=[...(RPH.nsw.ADD.Q1||[]),'Recalls (TGA, Procedure for recalls, product alerts and product corrections): any recall or alert received since the last visit was acted on as the notice says, affected stock checked, and the response recorded.'];
if(RPH.sv?.coreMeta)RPH.sv.coreMeta.push(['recalls','Recalls and alerts','Ask to see the recall notices received since the last visit and what was done for each (TGA PRAC procedure). The sponsor’s deadlines are theirs; the pharmacy follows the notice and records its response.']);
RPH.nsw.ADD.A3=[...(RPH.nsw.ADD.A3||[]),'Privacy (Privacy Act 1988 APP 11; NSW HRIP Act s 25): patient information in the pharmacy’s own systems is kept secure, health records are kept at least 7 years after the last service (or until 25 for a child), and a suspected data breach would be assessed within 30 days and notified if eligible.'];
RPH.insp.OBL.push(['privacy','Privacy Act / HRIP Act','Patient information and data breaches','Keep patient information secure (APP 11). A suspected breach (lost device, hacked system, wrong recipient) is assessed quickly, within 30 days; an eligible breach is notified to the OAIC and the people affected. Keep health records at least 7 years after the last service, or until age 25 for information collected as a child (NSW HRIP Act s 25).','The proprietor, for the pharmacy’s own systems',[]]);
/* Data-breach card next to the S8 incident cards. */
const b6S8=RPH.insp.s8;
RPH.insp.s8=function(){b6S8.apply(this,arguments);const inc=$('editor')?.querySelector('.insp-inc');if(!inc||inc.querySelector('[data-breach]'))return;
 const d=D.el('details');d.dataset.breach='1';d.append(D.el('summary',{text:'Suspected data breach (patient information)'}));const ol=D.el('ol');
 for(const x of ['Contain it: recover the device or email if you can, change passwords, stop further access.','Assess quickly, within 30 days: is serious harm to people likely? (Privacy Act Part IIIC).','If it is an eligible breach, notify the OAIC and the people affected as soon as practicable.','Record what happened and what you did; log it in My log.'])ol.append(D.el('li',{text:x}));
 const a=D.el('a',{href:'https://www.oaic.gov.au/privacy/notifiable-data-breaches',target:'_blank',rel:'noopener',text:'OAIC · Notifiable data breaches'});const sm=D.el('small');sm.append('Source: ',a);d.append(ol,sm);
 const lb=D.el('button',{type:'button',class:'rph-link help-logbtn',text:'Log that you reported it'});lb.onclick=()=>RPH.help.logScreen({what:'Assessed a suspected data breach',kind:'Other'});d.append(lb);inc.append(d);};
