# NSW Health Pharmaceutical Services site vs the app: gap analysis (20 Nov 2026)

**Source:** health.nsw.gov.au/pharmaceutical (every page) plus the pharmacist-immuniser section of /immunisation, read 20 Nov 2026.
**Coverage:**
- 189 pages crawled (172 loaded; 17 old links are retired, 401/404).
- 112 attachments downloaded: 111 PDFs, of which about 24 are scanned images. The scanned ones were checked on the Orders & Exemptions page, and the relevant ones were opened.
- Not opened: 10 translations of one s100 factsheet, 1 internal-only PDF and 1 ACI PDF (unreachable).

**Method:**
- Pages for pharmacists, and anything placing obligations on a pharmacy, were read in full.
- Every other page (prescribers, patients, hospitals, wholesalers, vets, SafeScript set-up) was swept for sentences that put an obligation on a pharmacist or pharmacy. Pages with hits were then read.

**Raw notes:** scratchpad `nswh/FINDINGS.md`.

**Ground rules kept:**
- The app is the proprietor's oversight tool, not the drug register and not a clinical record.
- No patient data.
- Nothing is marked done for the owner.
- The app is not a QSPP tool.

---

## 1. Where the app already matches the site
- **S8 inventory:** every 3 months (s 111). Enforced on dates, with the owner as the person responsible (s 108(1)(i)).
- **S8 storage:**
  - The pharmacist in charge is now recorded (s 122).
  - The S8 page now has NSW Health's steps for:
    - missing or stolen S8;
    - a lost drug register;
    - destruction.
- **OTP Standards items 1–7:** the parts screen and the OTP reviews.
- **DAA labels:** Appendix L, date packed and date of birth (s 136). Third-party packing (s 137).
- **S8 by courier** (s 190–191).
- **Vaccination readiness:** the immuniser's authority, training, CPR, fridge and logger, anaphylaxis kit, AIR, and the annual storage self-audit. The eligibility table matches NSW Health's.
- **Prescribing readiness and reviews:** authority, credentials, room, consent, records and listing are covered in general terms.
- **Records:** retention of at least 2 years (s 185). No patient identifiers in the app.

## 2. Corrections: things in the app that the site shows are wrong or out of date

| # | Where | Now | Should be (source) |
|---|---|---|---|
| C1 | Prescribing options | UTI, contraception, some skin conditions. "Expanded scope" left open. | **NSW-trained:**<br>• UTI (female, 18–65)<br>• Contraception continuation (18–49): OCP ≤35 µg EE, vaginal ring (supply only), DMPA (needs the injection course)<br>• Atopic dermatitis (2–65)<br>• Shingles (18+)<br>• Impetigo (2+)<br>• Psoriasis (18+)<br><br>**Queensland-trained (QUT/JCU) only, after the NSW "intention" form**, five more:<br>• Musculoskeletal pain (18+)<br>• GORD (18–50)<br>• Rhinitis (6+)<br>• Acne (12+)<br>• Nausea and vomiting (18+)<br><br>(p026, p010) |
| C2 | Vaping procedure | Steps marked "— verify" | Verified by NSW Health (p062) and NSW's own self-assessment tool:<br>• S3 supply: 18+, sight ID and age, ≤1 month, once a month, ≤20 mg/mL<br>• SAS Category C notification within 28 days<br>• Adverse events to TGA and sponsor within 15 days<br>• No advertising, behind the counter<br>• Devices go to e-waste (not the RUM bin) |
| C3 | Cannabis procedure | Steps marked "— verify" | Verified (p013, p087):<br>• No stock of unregistered cannabis unless TGA-approved for that patient<br>• No substitution<br>• No strength ranges or categories on scripts<br>• No emergency supply<br>• No exclusive arrangements with prescribers<br>• Tell patients about driving with THC |
| C4 | Vaccination record | Record the GP | **Sources disagree.** The pharmacist Standards (5 Nov 2026) still list "primary medical practitioner". The "Legislation changes for pharmacists" page says this is no longer required. Keep it as a question for NSW Health; don't change it yet. |
| C5 | S8 review (B1) | 3 general questions | Too thin against the mandatory Medicine Storage Standards and drug register rules. See G1. |
| C6 | S8 prescription copies | "Kept separately" | Only **paper** S8 and AAS copies are kept separately. Clear scans (including dispensing stickers) are allowed. Copies are kept on the premises for 2 years. Repeats can go back to the patient, except OTP. |
| C7 | Vaping and cannabis sources | "Owner's research, verify" | Cite NSW Health pages (current Aug and Nov 2026). |

## 3. Gaps: what the site requires or expects that the app doesn't cover yet

Priority:
- **Must:** law or a mandatory Standard.
- **Should:** NSW Health tool or guidance.
- **Nice:** helpful.

### G1. S8 storage and drug register (Must, every pharmacy)
- **Safe built to the Medicine Storage Standards (Part 1.1):**
  - 9 mm mild steel with continuous welds;
  - flush 9 mm door with ≤1.5 mm clearance;
  - welded locking bar;
  - five-lever lock.
- **Fixed with "robust fastening":**
  - masonry: ≥12×50 mm expanding bolts;
  - timber: 10 mm coach screws;
  - otherwise: 10 mm steel cable or 5 mm chain.
  - Not accessible to the public.
- **S8 fridge:** locked; holds only scheduled items that need refrigeration; fixed in place.
- **Codes:** changed at regular intervals. Personal codes or biometrics removed when someone leaves.
- **Keys:** on a pharmacist while open; off the premises or in another safe when closed. Never tell non-pharmacists the code.
- **Register:**
  - kept on the premises;
  - entries the same day;
  - a page per brand and strength;
  - patient-held and expired stock included (expired on a separate page);
  - the owner makes sure staff comply.
- **Orders and receipts:**
  - order received in writing within 14 days;
  - receipt signed and the supplier told within 24 hours (s 194);
  - stock straight into the safe.
- **If an electronic register is used (Standards + Guideline):**
  - unique logins;
  - leavers removed;
  - access reviewed regularly;
  - audit logs reviewed (monthly if busy) by someone who doesn't make entries;
  - downtime uses a bound book;
  - the responsible person is recorded.
- **Proposal:** expand B1 into an "S8 storage and register" review with these checks, owner-marked. Add an e-register section shown only if "electronic register" is chosen.

### G2. Prescriptions and dispensing records (Must, every pharmacy)
- **Verification:**
  - required for a new patient with an unknown prescriber;
  - if verification isn't possible and nothing is suspicious, at most 2 days' supply, keeping the script;
  - contact details come from another source;
  - check the lost, stolen and forged list.
- **Forged script:**
  - don't dispense;
  - keep the paper script, or cancel or disable the e-token;
  - report to Pharmaceutical Services (form) and the police;
  - e-script fraud also goes to the Digital Health Agency.
- **Phone, fax or email direction:** the script must arrive within 14 days, otherwise email Pharmaceutical Services.
- **Records:**
  - dispensed scripts, emergency supplies, urgent-use orders, wholesale and borrowing records, and S8/AAS copies: 2 years, on the premises, produced without delay;
  - scans allowed if they're complete.
- **Urgent-use supply to practitioners:** a signed, dated written order; ARTG products only; not in the prescriber's name.
- **Proposal:**
  - a site review, "Prescriptions and records" (quarterly);
  - an incident card, "Suspected forged prescription", on Today and on the S8 page.

### G3. Pharmacist prescribing (Must, if offered)
- **Consulting room:**
  - fully enclosed (a curtain or divider is not acceptable);
  - used for nothing else;
  - light, temperature, sanitiser, hand washing;
  - room for the patient plus a companion.
- The consulting pharmacist's name, as on Ahpra, is displayed at or near the room.
- Patient and pharmacist both physically present.
- **Clinical records:**
  - secure digital software, kept ≥7 years (under 18: until 25);
  - include the pharmacist's HPI-I.
  - (They live in the clinical software, not this app.)
- **Sharing:** a record goes to the GP within a week (with consent); upload to My Health Record unless the patient objects.
- **Adverse events:** to the TGA and the GP.
- **healthdirect Service Finder:** a current listing is a **legal condition**, with the exact offering terms, hours, booking and fee.
- **Per pharmacist:**
  - condition-specific training;
  - the DMPA injection course plus indemnity check;
  - Working with Children Check where needed;
  - mandatory reporter.
- Financial consent before the consult.
- **Key date: all prescribing authorities expire 4 Nov 2027.**
- **Proposal:**
  - rebuild "Pharmacist prescribing readiness" with these lines;
  - a per-pharmacist "conditions trained for" list in Staff;
  - an expiry reminder.

### G4. Vaccination (Must, if offered)
- **Fridge:** min, max and current recorded **twice daily** every open day. Logger at 5-minute intervals, reviewed **weekly**.
- A named vaccine coordinator **and a backup**.
- **All storage staff** complete the NSW Health cold-chain module, with certificates kept (2 are needed for a VAN).
- **Each immuniser:**
  - completes the **NSW Pharmacist Immuniser Declaration Form**, kept on the premises for audit;
  - holds a certificate per vaccine;
  - holds a CPR certificate under 12 months old (paediatric if giving vaccines under 14);
  - does an annual best-practice review.
- NIP/state and private stock kept separately and labelled.
- A power-failure plan that has been **practised**. Domestic fridges prohibited.
- **Breach:** quarantine at 2–8 °C labelled "Do not use"; call the public health unit on 1300 066 055 (NIP/state stock) or the manufacturer (private stock).
- **AEFI:** to the public health unit immediately, next business day at the latest.
- **Errors:** disclose to the patient, record on AIR, report to the public health unit.
- **AIR:** checked before vaccinating; reported preferably within 24 hours, within 10 business days at most; pregnancy status included.
- **Consent:** written, or documented verbal, every time. Kept 7 years (or until 25).
- **Room:**
  - not the dispensary, with no access to S3/S4/S8 on the way;
  - 2 chairs (not a stool or wheeled chair);
  - space to lie down; stretcher access;
  - fridge locked if the public can reach it.
- **Ownership change:** a new AIR provider number **and** a new VAN.
- **Key date: the vaccination Standards and authorities expire 4 Nov 2028.**
- **Proposal:** add the missing lines to vacc-ready and service-vaccination; add the immuniser declaration and cold-chain certificates to Staff.

### G5. Vaping (Must, if offered)
- Replace the vaping review with **NSW Health's own "Pharmacy self-assessment tool"** (June 2026), line for line. This is better than our own wording, because it's the official checklist.

### G6. OTP (Must, if offered)
- **A new OTP registration** whenever ownership, address or **trading name** changes. Order stock first.
- **Proprietor undertaking:** they and **all pharmacists employed** have read and understood the OTP Standards. This is a staff acknowledgement to record.
- **When selling:** tell the new owner ≥2 weeks before; the new owner emails Pharmaceutical Services ≥7 working days before takeover.
- Dosing point details kept current in SafeScript.
- NSW Health's OTP self-audit tool (Pharmacy Incentive Scheme): link it as the source for the OTP comprehensive review.
- Support contacts: DASAS 1800 023 687; pharmacist advice line 1300 369 772.

### G7. DAA (Must, if offered)
- A third-party packer must hold a **TGA GMP licence**. The manufacturing instructions match the prescription and are kept 2 years by both sides.
- Patient consent for third-party packing.
- Consent **before** transferring scripts to another pharmacy, which then becomes the supplying pharmacy.

### G8. Aged care supply (Must, if offered)
- **Urgent-use stock:**
  - only on a DON- or care-manager-signed order;
  - original pack;
  - from the NSW-approved list (15 items with limits) or MAC-approved;
  - after-hours arrangements in place.
- Urgent-use S8 is destroyed **on the facility premises**; it can't come back to the pharmacy.
- **Paper NRMC:** the duplicate is kept current; each supply recorded on it; "CANCELLED" on final supply; kept 2 years.
- **Key date: the eNRMC transition ends 31 Mar 2027.**

### G9. Ownership change, closure, emergencies (Must, when it happens)
- **Checklist:**
  - new OTP registration and notice;
  - new AIR number and new VAN;
  - healthdirect listing;
  - Pharmacy Council (collection units);
  - records kept 2 years from the last transaction;
  - S8 inventory on taking control (s 111(3)).
- **Emergency closure:** what staff may move. Temporary NSW Health emergency authorities.
- **Proposal:** one "Change of ownership or closure" checklist in Setup.

### G10. Other (Should / Nice)
- **Collection units or after-hours lockers:** only approved models; Pharmacy Council notified before installing; no S8; logged.
- **s100 co-payment:** sight the 3-year consent form each time; register on the Guild portal; display the poster.
- **SafeScript:** not mandatory, but encouraged. Readiness question: are all pharmacists registered?
- **Restriction orders:** an optional check that an engaged pharmacist's S8 authority isn't restricted (Guild guide or Pharmaceutical Services list).
- **Pharmaceutical Services' risk matrix** (likelihood × consequence → Low, Medium, High, Extreme): show it on actions so high-risk items are fixed first.
- **"New laws, 5 Nov 2026" readiness checklist**, from the site's own list of changes:
  - S3 instructions;
  - no pseudoephedrine record;
  - repeats can be returned;
  - S4D scripts valid 12 months;
  - no approval numbers for psychostimulants;
  - 3-monthly balance;
  - no S8/S4D samples;
  - nitrous oxide rules;
  - Appendix L labels.
- **Key dates panel:**
  - prescribing authorities expire 4 Nov 2027;
  - vaccination Standards and authorities expire 4 Nov 2028;
  - collection unit exemptions expire Jun/Jul 2028;
  - eNRMC transition ends 31 Mar 2027;
  - old instruments lapse by 5 Nov 2028.
- **Contacts card:**
  - Pharmaceutical Services email and online forms;
  - public health unit 1300 066 055;
  - DASAS;
  - OTP advice line;
  - healthdirect 1800 022 222;
  - Prescription Shopping Information Service 1800 631 181.

## 4. Still to verify (not on this site)
- **Pharmacy Board guidelines on compounding:** NSW Health points to them but doesn't restate them.
- **Strive for 5 details:** NSW repeats the main points.
- **PSA DAA guidelines; TGA "Supplying therapeutic vapes in pharmacies":** NSW summarises them.
- **Not covered by NSW Health:** needle and syringe program; absence-from-work certificates (Fair Work).

## 5. Suggested order of work (each step tested, then published to the same link)
1. **Fix C2, C3 and C7:** replace the vaping and cannabis "verify" markers with the NSW-sourced wording; update sources.
2. **G5:** the vaping review becomes NSW Health's self-assessment tool.
3. **G1:** expanded S8 storage and register review (+ e-register section).
4. **G2:** "Prescriptions and records" review + forged-prescription incident card.
5. **C1 + G3:** prescribing options and readiness; per-pharmacist conditions; authority expiry.
6. **G4:** vaccination additions; declaration and cold-chain certificates in Staff.
7. **G6–G8:** OTP, DAA and aged care additions.
8. **G9 + G10:** change-of-ownership checklist; key dates; contacts; risk matrix on actions.
9. **C4:** ask NSW Health (online enquiry) whether the GP must still be recorded for vaccinations.
