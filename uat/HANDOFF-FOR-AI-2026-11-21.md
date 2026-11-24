# R.Pharmacy: handoff brief for another AI reviewer (21 Nov 2026)

## What the product is
- **Purpose:** a mobile-first web app that helps the **proprietor (owner) of an NSW community pharmacy** meet their legal and best-practice obligations, in plain words and without a barrage of information.
- **It is a helper, not a policeman.** It is not a drug register, not a clinical record, holds no patient data, and is **not a QSPP accreditation tool**.
- **Proprietor-only:** there are no staff logins.
- **Nothing is approved, completed or marked for the owner automatically.**
- **Live UAT:** https://claude.ai/artifact/Vnn6KXsNkkEe7Ywc3DbnWN (version 24). It is private to the owner, uses fictional data only, and stores everything in the browser on this device. There's a built-in "UAT notes" button for feedback.

## How it's organised (owner's view)
- **Today:** what's next.
  - "How this app works" card (dismissible).
  - "Start with these 3".
  - Then a list (8 items on phone, with "Show all").
- **Reviews:** regular checks, for example:
  - S8 inventory every 3 months (Regulation s 111);
  - proprietor site visit (quarterly);
  - service reviews;
  - annual governance;
  - premises renewal.
- **Actions:** fixes the owner closes themselves.
- **Calendar:** weekly, month and year plan.
- **Staff:** credentials with expiry dates, with suggestions per service (CPR, first aid, immuniser declaration, OTP Standards read, prescribing training, Ahpra and CPD).
- **Policies:** procedures drafted from setup answers, citing sources. Approval is blocked while any "[Confirm]" or "— verify" marker remains (approval also needs sign-in, which doesn't exist yet).
- **Pharmacy setup, grouped:**
  - **Your pharmacy:** details, proprietors, pharmacist in charge, services, review due dates, "Bought, selling or closing".
  - **Law and inspections:** S8 at a glance, Legal obligations, NSW Health dates and contacts.
  - **Records:** My log, evidence locations.
  - **Settings.**
- **Setup flow (one hybrid flow per service):**
  - intro;
  - a few honest questions;
  - "What most pharmacies do", with That's how we do it / Change / Check later;
  - an optional full question set;
  - "What happens next" (review dates, procedure preview);
  - first due dates (pre-filled, saved only on tap).

## Services covered
DAA, staged supply, vaccination, OTP, pharmacist prescribing, medicine reviews (HMR/RMMR), home delivery, simple and complex compounding, residential aged care supply, screening, adherence, NSP, absence-from-work certificates, therapeutic vaping, medicinal cannabis, other funded programs.

## Sources already read in full and applied (20–21 Nov 2026)
- **Medicines, Poisons and Therapeutic Goods Regulation 2026 (NSW)**, in force 5 Nov 2026. Key sections:
  - s 12, s 33–35, s 48, s 56–57, s 70, s 81;
  - s 108–112 (drug register; the responsible person for a pharmacy is the financial-interest holder);
  - s 115, s 122 (S8 storage, on the pharmacist in charge), s 134, s 136–137 (DAA), s 148 (S8 destruction);
  - s 185 (records 2 years), s 190–191 (S8 delivery), s 194 (S8 receipt within 24 h).
- **NSW Health Pharmaceutical Services website** (189 pages, 111 PDFs), including:
  - the Medicine Storage Standards (safe specification and fixing);
  - the Electronic Drug Register Standards;
  - the OTP Standards and OTP pharmacy registration;
  - the NSW Pharmacist Vaccination Standards and authorities (expire 4 Nov 2028);
  - the prescribing Class Authorities (expire 4 Nov 2027);
  - the vaping self-assessment tool (used verbatim as the vaping review);
  - cannabis rules; forged-prescription steps; RCF urgent-use list; collection-unit exemptions.
- **Pharmacy Council of NSW** (hpca.nsw.gov.au/councils/pharmacy):
  - proprietor oversight duties, with no silent partners;
  - suggested audit areas;
  - premises standards (Health Practitioner Regulation (NSW) 2025 Sch 5): equipment, references, dispensary sink and bench, barcode scanners, displayed names;
  - notices (closure within 14 days, ownership, name, renovations);
  - 30 June premises renewal and financial-interest declaration;
  - inspections every 18 months.
- **Pharmacy Board of Australia:**
  - *Guidelines on the safe provision of pharmacy services* (1 Oct 2026). These replaced the proprietor, dispensing, DAA and practice-specific guidelines.
  - Compounding guidelines (Oct 2024).
  - CPD: 40 credits per year, to 30 September.
- **NSW Health Guideline GL2023_002:** Needle and Syringe Program.
- **PPA Program Rules:** DAA, Staged Supply, HMR, RMMR, MedsCheck.

## Not yet verified (sites blocked from the tool)
- **TGA:** vaping guidance details, recalls, advertising.
- **Privacy:** OAIC (Privacy Act, notifiable data breaches); IPC NSW (HRIP Act).
- **Strive for 5:** the full document (NSW Health summaries are applied).
- **Fair Work:** absence-from-work certificates.

Steps relying on these are marked "— verify" in procedures.

## Owner decisions (don't reverse without asking)
- Remove all "who is responsible" questions.
- Keep the app helpful, not policing.
- No risk ratings.
- Inspector pack: later.
- Sign-in and hosting: assess later.
- Vaccination "record the GP" conflict (Standards vs NSW explainer page): leave as is.
- Express mode was replaced by the hybrid flow.
- Fictional data only.
- Never copy real pharmacy names, contacts or staff from the owner's Drive documents.

## Design studio (visual design history)
- **Where:**
  - folder /home/user/rpharmacy/design-studio;
  - zipped copy /home/user/rpharmacy/R-Pharmacy-Design-Studio.zip.
  - Open `index.html` in Chrome or Edge; nothing to install. Keep the folder together.
- **What it is:**
  - a local tool for comparing every R.Pharmacy design section by section;
  - notes per design (Like, Dislike, Keep, Change, Remove, Comment);
  - picking parts into a "super design";
  - exporting a Claude Code handoff, the full spec, open questions, or a JSON backup.
  - Notes save in the browser; move them between computers with the backup file.
- **Round 1:** the earlier designs.
  - Screenshots of the v27 app (`designs/current-app/`).
  - UI Trials mockups, Designs 1–6, key flows and award-inspired designs (`designs/mockups/`).
  - A screenbook.
- **Round 2:** five clickable concepts (phone and laptop, seven areas), with a brief, evaluation and scores in `round2/brief.html`:
  - A Quiet Precision;
  - B Command Centre;
  - C Guided Path;
  - D Editorial;
  - E The Floor.
- **Round 3:** five finalists, with the rationale in `round3/rationale.html`:
  - A, B and C (unchanged);
  - D Precision Command (A + B);
  - E Guided Precision (A + C, with some of B).
- **What was built:** the live app's frontend is **Concept D**, taken from design-studio/round3/concept-d.html and implemented in uat/layers/conceptD-frontend.*.
- **Rule:** don't overwrite the original design studio or delete previous designs or feedback.

## Known gaps and ideas for the next reviewer
1. Records live in one browser with no sign-in. This is the main risk before real use.
2. Inspector pack: a dated PDF of the S8 page, legal obligations, last visit, open legal actions and staff checks.
3. The Reviews page summary sentence is long; Reviews vs Actions could be explained where they appear.
4. Reminders by push or email; multiple users with roles; export.
5. Apply the blocked sources once their documents are provided.
6. PPA proposals waiting on owner approval: DAA claim reminders, RMMR agreements, MedsCheck options (see PROGRAM-RULES-REVIEW.md).

## Useful perspectives for a fresh review
- An experienced pharmacy owner with several stores.
- A pharmacist in charge who isn't the owner.
- A Pharmacy Council inspector.
- An accessibility specialist (screen reader, contrast, large text).
- A privacy and security reviewer.
- An accountant or business adviser (time cost per month).
- A brand-new graduate owner.

## Technical notes (for a coding agent)
- **Repo:** /home/user/rpharmacy/uat, branch conceptd-frontend.
- **Engine:** dev/proprietor-hub.html (v27), never edited directly.
- **Behaviour:** comes from layers in uat/layers/*.js and conceptD-frontend.css, concatenated by `node build-uat.js` into app/rpharmacy-uat-testing.html.
- **Key layers:**
  - express.js (setup flow);
  - setup-questions.js;
  - procedures.js;
  - inspection.js (S8 page, legal obligations, pharmacist in charge, approval guard);
  - nsw-health.js (NSW, Council and Board review lines, dates, ownership list);
  - helpers.js (My log, staff suggestions, S8 yearly checks);
  - today-guide.js; words.js;
  - uat-tools.js (UAT only).
- **Tests:** Playwright suites in uat/tests/*.js, e.g. `node tests/nsw-health.js`. All pass except the stale uat-functional.js.
- **Research notes:** uat/research/; NSW-HEALTH-GAP-ANALYSIS.md; ASSESSMENTS-2026-11-21.md; GAMEPLAN-NEXT.md; UAT-PROGRESS.md.
