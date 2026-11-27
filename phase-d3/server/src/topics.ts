// The 10 NSW law topics the app can refresh from the server (Nov 2026). Every line is taken from the app's own
// checked content (app/src/content/law.json, sources.js, updates.js, onboard.js), which was read against primary
// sources on 20–26 Nov 2026 (uat/research). Nothing here is new law: if a line changes, change the app content first.
// Each topic carries a precomputed SHA-256 ETag of its exact JSON body.
import { createHash } from 'node:crypto';

const NSWH = 'https://www.health.nsw.gov.au';
const REG = 'Medicines, Poisons and Therapeutic Goods Regulation 2026 (NSW)';
const src = (title: string, url: string) => ({ title, url });
const S = {
  reg: src(REG, 'https://legislation.nsw.gov.au/view/html/inforce/current/sl-2026-0330'),
  hpr: src('Health Practitioner Regulation (New South Wales) Regulation 2025', 'https://legislation.nsw.gov.au/view/html/inforce/current/sl-2025-0430'),
  nswlaw: src('NSW Health: medicines, poisons and therapeutic goods legislation overview', NSWH + '/pharmaceutical/Pages/medicines-poisons-laws-overview.aspx'),
  nswpharm: src('NSW Health: legislation changes for pharmacists', NSWH + '/pharmaceutical/Pages/medicine-laws-pharmacists.aspx'),
  mss: src('NSW Medicine Storage Standards', NSWH + '/pharmaceutical/Pages/medicine-storage-standards.aspx'),
  edr: src('NSW Electronic Drug Register Standards', NSWH + '/pharmaceutical/Pages/electronic-register-standards.aspx'),
  otp: src('NSW Health: OTP information for pharmacists (registration)', NSWH + '/pharmaceutical/pharmacists/Pages/opioid-treatment-pharmacist-info.aspx'),
  otpStd: src('NSW OTP Standards (PDF)', NSWH + '/pharmaceutical/Publications/opioid-treatment-program-standards.pdf'),
  vaccstd: src('NSW Pharmacist Vaccination Standards (5 Nov 2026)', NSWH + '/immunisation/Documents/pharmacist-new-standard.pdf'),
  coldchain: src('NSW Health: Vaccine storage and cold chain management', NSWH + '/immunisation/Pages/cold-chain-management.aspx'),
  s45: src('Strive for 5 (national vaccine storage guidelines)', 'https://www.health.gov.au/resources/publications/national-vaccine-storage-guidelines-strive-for-5'),
  ca: src('NSW pharmacist prescribing Class Authorities (expanded scope)', NSWH + '/pharmaceutical/Pages/expanded-scope-pharmacists-information.aspx'),
  intent: src('NSW Health: Intention to provide expanded community pharmacy services', NSWH + '/pharmaceutical/Pages/expanded-services-application.aspx'),
  ocp: src('NSW Health: Initiation of the oral contraceptive pill', NSWH + '/pharmaceutical/pharmacists/Documents/protocol-initiation-oral-contraceptive-pill.pdf'),
  ocpInfo: src('NSW Health: Oral contraceptive pill initiation (information for pharmacists)', NSWH + '/pharmaceutical/pharmacists/Pages/oral-contraceptive-pill-initiation.aspx'),
  daa: src('NSW Health, Dose administration aids', NSWH + '/pharmaceutical/pharmacists/Pages/dose-administration-aids.aspx'),
  ppaDaa: src('PPA, Dose Administration Aids', 'https://www.ppaonline.com.au/programs/medication-adherence-programs-2/dose-administration-aids'),
  vape: src('NSW Health vaping requirements and self-assessment', NSWH + '/pharmaceutical/Pages/nicotine-vaping.aspx'),
  tgavape: src('TGA: supplying therapeutic vapes in pharmacies', 'https://www.tga.gov.au/resources/guidance/supplying-therapeutic-vapes-pharmacies'),
  cann: src('NSW Health Cannabis medicines', NSWH + '/pharmaceutical/Pages/cannabis-medicines.aspx'),
  tgaCann: src('TGA, Medicinal cannabis product list', 'https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub/medicinal-cannabis-product-list'),
  rcf: src('NSW Health, Residential care facilities', NSWH + '/pharmaceutical/Pages/residential-care-facilities.aspx'),
  enrmc: src('Department of Health: eNRMC implementation extended to 31 March 2027', 'https://www.health.gov.au/news/electronic-national-residential-medication-charts-enrmc-implementation-timeframes-extended-to-31-march-2027'),
  pba: src('Pharmacy Board of Australia: Guidelines on the safe provision of pharmacy services including medicines and advice (1 Oct 2026)', 'https://www.pharmacyboard.gov.au/Codes-Guidelines'),
  coi: src('National Boards: Managing financial and commercial conflicts of interest (interim guidance)', 'https://www.ahpra.gov.au/Resources/Managing-financial-or-commercial-conflicts-of-interest'),
  council: src('Pharmacy Council of NSW (premises, ownership, proprietor oversight)', 'https://www.hpca.nsw.gov.au/councils/pharmacy'),
  pcComp: src('Pharmacy Council, Ten tips for quality compounding', 'https://www.hpca.nsw.gov.au/resources/ten-tips-quality-compounding'),
  mhract: src('My Health Records Act 2012 (s 75 data breaches)', 'https://www.legislation.gov.au/C2012A00063/latest/text'),
  mhrrules: src('My Health Records Rules 2026 (security and access policy)', 'https://www.legislation.gov.au/F2026L00392/latest/text'),
  privacy: src('Privacy Act 1988 and NSW HRIP Act', 'https://www.oaic.gov.au/privacy/notifiable-data-breaches'),
};

export interface Topic { id: string; title: string; effective: string; verified: string; lawLine: string; points: string[]; sources: { title: string; url: string }[] }

const RAW: Topic[] = [
  {
    id: 's8-storage-register', title: 'S8 storage, drug register and inventory', effective: '2026-11-05', verified: '2026-11-27',
    lawLine: REG + ' s 108–111, s 122, s 194',
    points: [
      'A drug register for S8 substances: a bound book with numbered pages (or an approved electronic register), a separate page for each substance, brand, strength and form, with every transaction entered on the day it happens, kept on the premises where the S8 is stored (NSW Health).',
      'An accurate inventory of all S8 substances every 3 months (unless NSW Health approved other times), entered in the drug register under the last entry for each substance with the quantity held and the date, and signed. You, as proprietor, must ensure it is made (s 111(1)).',
      'Anyone who takes control of the pharmacy for 1 month or more must have an S8 inventory made in the drug register immediately on taking control (s 111(3)).',
      'S8 kept in a dedicated, locked room, receptacle or fridge, on its own (except with S9, or in a fridge holding only scheduled substances), fixed to the premises and not accessible to the public. Keys kept on a pharmacist or in a separately locked receptacle only a pharmacist can open; codes never told to anyone who is not a pharmacist (s 122).',
      'S8 received: sign and date the receipt, and give the supplier written notice of receipt (electronic or paper) within 24 hours (s 194).',
      'The Medicine Storage Standards (S8 and S4D) and the Electronic Drug Register Standards are mandatory from 5 November 2026.',
    ],
    sources: [S.reg, S.nswlaw, S.nswpharm, S.mss, S.edr],
  },
  {
    id: 'otp-standards-2026', title: 'Opioid treatment (OTP) standards', effective: '2026-11-05', verified: '2026-11-27',
    lawLine: 'NSW OTP Standards (mandatory from 5 Nov 2026); ' + REG + ' s 81',
    points: [
      'Dispensing methadone or buprenorphine under an OTP registration in line with the NSW OTP Standards.',
      'Registered before supplying; a new application for any change of owner, address or trading name.',
      'The proprietor and every pharmacist employed have read and understood the OTP Standards (record each pharmacist’s acknowledgement).',
      'At 80 or more supervised dosing patients on any given day, the amenity plan, proprietor staffing declaration and annual review apply.',
    ],
    sources: [S.otp, S.otpStd, S.nswlaw],
  },
  {
    id: 'vaccination-standards-2026', title: 'Pharmacist vaccination standards', effective: '2026-11-05', verified: '2026-11-27',
    lawLine: 'NSW Pharmacist Vaccination Standards (5 Nov 2026)',
    points: [
      'People: a named vaccine coordinator and a backup; at least two staff who manage vaccines have completed the NSW Health Vaccine Storage and Cold Chain Management module, with certificates kept; each immuniser’s NSW Pharmacist Immuniser Declaration Form is kept on the premises.',
      'Room (part D): not the dispensary, with no patient access to S3, S4 or S8 medicines on the way in or out; two chairs (the patient’s is not a stool or on wheels); space to lie down; stretcher access; the fridge is locked if the public can reach it.',
      'Consent and records (part F): consent recorded for every vaccination and kept 7 years (or until 25 for under-18s); AIR checked before and updated within 10 business days (mpox: unless the patient opts out).',
      'Reporting (part G): adverse events reported to the public health unit (1300 066 055) straight after the response and by the next business day; administration errors disclosed to the patient, recorded on AIR and reported to the public health unit.',
    ],
    sources: [S.vaccstd, S.coldchain, S.s45],
  },
  {
    id: 'pharmacist-prescribing-2026', title: 'Pharmacist prescribing and OCP initiation', effective: '2026-11-05', verified: '2026-11-27',
    lawLine: 'NSW Class Authorities and Practice Standards (5 Nov 2026 to 4 Nov 2027); MPTG Reg 2026 s 37A and NSW OCP Protocol',
    points: [
      'Class Authorities and Practice Standards apply from 5 November 2026; the authorities expire on 4 November 2027.',
      'Contraception continuation includes vaginal ring supply (supply only) and DMPA (give the injection only with the PSA injection course; check indemnity).',
      'OCP initiation: approved pharmacists (a graduate certificate from James Cook University, the University of Newcastle or UTS) who have submitted the Intention form can start, change or resupply the pill for low-risk women aged 18–39. The pill itself is at private (non-PBS) cost: tell patients all costs first.',
      'Every service: a private consulting room, the GP sent a record within a week (with consent), digital records kept 7 years (under 18: until 25), and the healthdirect listing kept current. A Working with Children Check may be needed.',
    ],
    sources: [S.ca, S.intent, S.ocp, S.ocpInfo],
  },
  {
    id: 'daa-supply-qspp', title: 'Dose administration aids and QSPP', effective: '2027-07-01', verified: '2026-11-27',
    lawLine: REG + ' s 136–137; PPA DAA Program Rules',
    points: [
      'DAA labels (date packed, date of birth, Appendix L information, no oral and external-use medicines together) and label records kept by the pharmacist and the packer.',
      'Third-party packing: the packer holds a TGA GMP licence; manufacturing instructions match the prescription and both sides keep them 2 years; patient consent to third-party packing recorded.',
      'Transfer: patient consent obtained before prescriptions are transferred; the packing pharmacy is the supplying pharmacy.',
      'From 1 July 2027, providers in the PPA DAA Program must hold current QSPP accreditation (PPA).',
    ],
    sources: [S.daa, S.ppaDaa, S.reg],
  },
  {
    id: 'vaping-therapeutic-goods', title: 'Therapeutic vaping goods', effective: '2026-11-05', verified: '2026-11-27',
    lawLine: 'NSW Health vaping self-assessment; TGA',
    points: [
      'Products: every vaping good sold is on the TGA list of notified vapes.',
      'Storage: all vaping goods are behind the counter; no self-selection. No advertisements for vaping goods inside or outside the pharmacy.',
      'Pathway: a prescription is needed for vaping substances over 20 mg/mL, or for patients under 18; every supply of a vaping substance is through the TGA Authorised Prescriber scheme or a SAS pathway (this applies to vaping substances, not to vaping devices on their own).',
      'Schedule 3 supply: purpose is quitting or nicotine dependence; patient 18 or over with identity and age sighted; informed consent; SAS Category C notification within 28 days; no more than one month at a time and one supply per patient per month.',
      'Adverse effects and faulty goods are reported to the TGA and the sponsor within 15 calendar days (NSW Health).',
    ],
    sources: [S.vape, S.tgavape],
  },
  {
    id: 'medicinal-cannabis-scheduling', title: 'Medicinal cannabis', effective: '2026-11-05', verified: '2026-11-20',
    lawLine: 'NSW Health, Cannabis medicines',
    points: [
      'No stock of an unregistered cannabis medicine unless the TGA approved it for a particular patient.',
      'No substitution of product or strength.',
      'No emergency supply of unregistered S8 cannabis.',
      'No exclusive supply arrangements.',
    ],
    sources: [S.cann, S.tgaCann],
  },
  {
    id: 'aged-care-enrmc', title: 'Aged care and eNRMC', effective: '2027-03-31', verified: '2026-11-26',
    lawLine: 'NSW Health, Residential care facilities; eNRMC transition to 31 March 2027',
    points: [
      'Unwanted urgent-use S8 is destroyed at the facility, not taken back to the pharmacy.',
      'Paper medication chart duplicates are kept current, each supply recorded, marked CANCELLED on final supply and kept 2 years.',
      'Electronic residential medication chart transition ends on 31 March 2027: only fully conformant eNRMC systems after this date.',
    ],
    sources: [S.rcf, S.enrmc],
  },
  {
    id: 'pba-safe-services-governance', title: 'Safe pharmacy services and premises', effective: '2026-10-01', verified: '2026-11-27',
    lawLine: 'Pharmacy Board guidelines (1 Oct 2026); Health Practitioner Regulation (New South Wales) Regulation 2025 s 11(1)(e), s 11(2), Sch 4 s 1',
    points: [
      '“Guidelines on the safe provision of pharmacy services including medicines and advice” apply from 1 October 2026. Proprietors can’t delegate their legal or professional responsibilities, wherever they are.',
      'Risks to safe services are assessed systematically and written down; the Board may ask to see the assessment.',
      'Patient choice: no patient is told they must use the pharmacy because of an arrangement, and consent to exclusive dispensing can be withdrawn at any time.',
      'Practitioners should be able to show that financial or commercial interests didn’t influence clinical decisions (National Boards’ interim guidance).',
      'Premises equipment (Health Practitioner Regulation (New South Wales) Regulation 2025 s 11(1)(e), Sch 4 s 1; Council Guide): purpose-built vaccine fridge, dispensing balance, scales to 1 kg, 200/100/10/5 mL measures, funnel, 2 mortars and pestles (1 glass), stirring rod, 2 spatulas, ointment slab, counting tray; scales and measures stamped.',
      'Dispensary (Health Practitioner Regulation (New South Wales) Regulation 2025 s 11(2); Council Guide): lit and ventilated; impervious sink with hot and cold running water; bench at least 40 cm wide with 1 m² of clear working space; a barcode scanner at every dispensing station.',
      'Compounding: even a small quantity or a familiar ingredient can need specialist complex-compounding facilities (Pharmacy Board compounding guidelines); confirm the Pharmacy Council’s premises triggers and equipment standards for your range before spending fit-out money (Council Guide; Ten tips for quality compounding).',
    ],
    sources: [S.pba, S.coi, S.hpr, S.council, S.pcComp],
  },
  {
    id: 'mhr-privacy-breach-2026', title: 'My Health Record, privacy and data breaches', effective: '2026-10-01', verified: '2026-11-27',
    lawLine: 'My Health Records Rules 2026 r 21, 43–45, 72(3); My Health Records Act 2012 s 75',
    points: [
      'The My Health Records Rules 2026 replaced the My Health Records Rule 2016 on 1 April 2026. For pharmacies already registered, the security and access policy rule (r 21) applies from 1 October 2026 (r 72(3)).',
      'Staff are trained before they get access to My Health Record, then every year, and after any significant change to the law or the system (r 21).',
      'Keep each version of the policy for 5 years (r 43). Keep records of user accounts and of training for 5 years, and records of your breach processes and security measures for 2 years (r 45).',
      'If the System Operator asks for your security and access policy, give it within 7 days (r 44).',
      'A compromised account is suspended as soon as practicable (r 21), and a data breach is notified under s 75 of the Act.',
      'Privacy (Privacy Act 1988 APP 11; NSW HRIP Act s 25): health records are kept at least 7 years after the last service (or until 25 for a child), and a suspected data breach is assessed within 30 days and notified if eligible.',
    ],
    sources: [S.mhrrules, S.mhract, S.privacy],
  },
];

export interface TopicEntry { topic: Topic; body: string; etag: string }
const ENTRIES = new Map<string, TopicEntry>(RAW.map(t => {
  const body = JSON.stringify(t);
  return [t.id, { topic: t, body, etag: '"' + createHash('sha256').update(body).digest('hex') + '"' }];
}));

export const TOPICS: readonly Topic[] = Object.freeze(RAW.map(t => Object.freeze(t)));
export const getTopic = (topicId: string): TopicEntry | undefined => ENTRIES.get(topicId);
