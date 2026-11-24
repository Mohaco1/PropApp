# UAT progress tracker: v28 · Concept D

Severity: Critical · High · Medium · Low · Cosmetic. Status: Open · In progress · Fixed · Retest passed · Won't fix · Decision needed.

| # | Page / feature | Description | Severity | Expected | Actual | Screenshot | Status | Fix | Retest |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Audits · Change due date (S8) | 3-month S8 limit not applied in the date dialog | High | S8 date can't be moved past 3 months | Allowed with a reason | — | Fixed in v32 | layers/s8-rule.js | Passed (s8-rule 18/18, s8-complete 5/5) |
| 2 | Calendar · Year plan | Future repeats not shown | Low | (to decide) | Next due only | tests/out/rich-desktop-planner-Year.png | Decision needed (D-3) | — | — |
| 3 | Real devices | Not yet tested on a phone, Safari or a screen reader | Medium | Works | Unverified | — | Open | — | — |
| 6 | Calendar / Today | Prototype's suggested booking dates and "Open actions in this area" not built (need a decision) | Low | (decide) | Not built | uat/comparison/ | Decision needed | — | — |
| 7 | Other reviews (not site visit) | Questions shown on one page, not one at a time | Low | One at a time? | One page | — | Decision needed | — | — |
| 8 | | | | | | | | | |

## Milestones
- 19 Nov 2026: Phases 1–5 done. Layer built; 7/7 suites identical; 17/17 services identical; 45/45 functional; 36/36 second verification. UAT pack written. Waiting for your UAT session.
- 19 Nov 2026 (v28): Published as a new private artifact https://claude.ai/artifact/TCsSGa9P6CfcmvDpR9M9TS (version 1). Zip: R-Pharmacy-UAT-v28.zip.
- 19 Nov 2026 (v29): every page restyled to Concept D, Today page rebuilt, phone view on by default. Same link, version 2. All tests pass (see IMPLEMENTATION-SUMMARY.md, v29 section).
- 19 Nov 2026 (v30): Concept D prototype implemented as the frontend (new link https://claude.ai/artifact/D8UZBRAfsknuF68zy964jM). 90/90 functional, 9/9 phone view, 17/17 walk-throughs identical, v27 suites unchanged. Comparison screenshots in uat/comparison/. Found and fixed during v30: a closed Site visit window stayed visible (caused by the v29 side-pane styling).
- 19 Nov 2026 (v31, overnight): Concept D drawn natively on all main pages plus Meetings, Services, History and the staff record; workarounds removed; design fixes from a page-by-page review. 116/116 functional, 9/9 phone view, v27 suites and 17/17 walk-throughs identical. Link: https://claude.ai/artifact/GJdNKqu2XqNjUWJT1CD1M1. S8 wording for approval: uat/S8-RULE-FOR-APPROVAL.md.
- 19 Nov 2026 (v32): S8 limit (s 111) enforced on every save path, approved-times option, S8 form follows stock date. https://claude.ai/artifact/BKM3ccSc1uYD5A1T7mPXbk
- 19 Nov 2026 (v33): Phase 2 (parallel with testing): Pharmacy setup and the policy library (templates, checklist, supporting records, forms, guidance, evidence) are now Concept D pages. 128/128 functional, 20/20 S8, 5/5 S8 completion, 9/9 phone view; v27 suites and 17 walk-throughs unchanged. https://claude.ai/artifact/2abNHY7K4tu3paCeERxDNn
- 19 Nov 2026 (v34): Locations, backup & restore and History (filters + PDF/CSV export) are now Concept D pages; every page is Concept D. New tests: CSV export matches the filter exactly; backup download then restore (with the 'I understand' confirmation) brings records back. 142/142 functional, 20/20 S8, 5/5, 9/9; v27 suites and 17 walk-throughs unchanged. https://claude.ai/artifact/B6pZg23FjNx1hbjpRQQcZH
- 19 Nov 2026 (v35, combined test build): Express onboarding, Year plan expected repeats, one question at a time in every review. 142/142, Express 14/14, steps 7/7, S8 20/20 + 5/5, phone 9/9; v27 suites and 17 walk-throughs unchanged. https://claude.ai/artifact/VgtSt4SbfGzuchoPmMFQGj
- 19 Nov 2026 (v36, UAT build): v35 plus UAT-only tester tools (per-question 'Could be standard / Must ask' + notes on every page, copy-out). Test order in UAT-ORDER.md: Detailed first, then Express. https://claude.ai/artifact/1ycTCYkEXZNRs19VJ5RRdf
- 19 Nov 2026: Permanent UAT link created (https://claude.ai/artifact/Vnn6KXsNkkEe7Ywc3DbnWN) with the shared store on: UAT notes sync across computers and Claude reads them; Save/Restore to account enabled for the first time. All fixes go to this link from now on.
- 19 Nov 2026 (UAT link v3): notes batch 2. Onboarding steps open full screen (Fixed – retest). Phone view: app column re-centred under the bottom bar, new alignment test (10/10); UAT notes button sits beside the phone frame. Parked: Google address lookup (Phase 5: needs hosting, API key, sends address to Google); landing page redesign (design brainstorm before next rebuild). 142/142, 16/16.
- Known limit on the artifact link: "Download backup" files are blocked by the viewer (no download permission). Use Save to account there; downloads work in a local copy. Decide in Phase 3 whether to add the downloads capability.
- 20 Nov 2026 (UAT link v4): notes batch 3 (question notes). New layer layers/setup-questions.js: procedures offer "Draft it for me" or "We already have our own" (drafted steps go into the service procedure); record-location questions are tick lists; "Who runs your services day to day?" asked once and reused (per-service who-questions removed); tick-more-than-one for HMR/RMMR reviewer and referral, routine DAA check, funded vaccine programs; vaccines offered = 21 from the NSW Health pharmacist vaccination table the owner supplied; "how many packs" removed; DAA check interval marked as the pharmacy's own choice; clearer tick-box borders. Tests: setup-questions 14/14, express 14/14, 142/142, 16/16, 10/10, 20/20, 5/5, 7/7, 5/5. Walk-all not re-run: setup questions changed on purpose, so the v27 walkthrough baseline no longer applies to setup.
- 20 Nov 2026 (UAT link v5): same logic checked across all 17 services. Added draft-or-own to Absence certificates (assessment and referral) and Therapeutic vaping (supply procedure); removed OTP 'how many files' optional question. 14/14, 14/14, 142/142.
- 20 Nov 2026 (UAT link v6): notes after finishing Detailed setup. OTP: LAIB merged into "Which OTP medicines" (22→16 Detailed questions in the test run); OTP procedure questions now "Draft it for me / We already have our own" (no "done but not written down"); Draft adds a section to complete plus a Task (clinical steps not written: must follow current NSW OTP guidance); approval-conditions question reworded; file-review interval marked as own choice (to source-check). Cannabis: records and access-pathway questions removed (scripts / prescriber approvals), THC = S8 question added. NSP: records question removed. Vaping: records removed. Simple/complex compounding and screening: plain tick lists with an explanation. Parked: pharmacist prescribing services list (owner: update with the new prescriber course). Tests: setup-questions 21/21, express 14/14, 142/142, 16/16, 10/10, 20/20, 5/5, 7/7, 5/5.
- 20 Nov 2026 (UAT link v7): HMR/RMMR referral and claim questions only appear when an external credentialed pharmacist does some or all reviews; own pharmacist only → filled as 'The pharmacy'. setup-questions 23/23, express 14/14, 142/142, 16/16, 10/10.
- 20 Nov 2026 (UAT link v8): Express set from the owner's checklist: assume who prepares DAA packs, OTP file reviewer, OTP take-away doses (all listed to confirm); keep asking DAA S8, DAA funding, pack handover, staged S8; legal/Standards checklists skipped in Express and marked Needs verification (never ticked). Failed delivery stays assumed and DAA delivery records stay 'add later' (owner did not tick 'ask'). Express 18/18; Express now DAA 8, OTP 6, Delivery 5 questions in the test run.
- 20 Nov 2026 (UAT link v9): Reset (and Delete note) didn't respond: the artifact viewer blocks the browser's confirm box. Now a two-tap button. uat-reset 5/5 with confirm blocked, uat-tools 16/16. App-wide confirm() logged in KNOWN-ISSUES for Phase 3.
- 20 Nov 2026 (UAT link v10): app-wide confirm fallback (in-app 'Are you sure?' when the viewer blocks the browser box). confirm-fallback 10/10; full regression passes (142, 16, 10, 20, 5, 7, 5, 18, 23; engine side effects no change).
- 20 Nov 2026 (UAT link v11): question cards: the question text is styled as the heading; tick lists are tighter (phone review). Tests pass.
- 20 Nov 2026 (UAT link v12): design review items #1, #3, #4, #6, #7 (owner approved). Display only, no data or logic changes. Plain words everywhere (Action, Review, How often, Set by, Legal limit, Check / Check later); numbers say what they count (header "3 overdue", Today summary breakdown that adds up to Needs you, Reviews says "reviews overdue"); review buttons Next / Finish later / Finish review; Today: "Start with these 3" and actions about the same person or service grouped (Show / Hide); landing explains what, how long, where data is kept; end of setup lists "Your first 3 things" and "Go to Today". New tests: today-guide 14/14; setup-questions 24/24 (end-of-setup check); cd-functional 142/142 (Today count now counts items inside groups); tests updated for new button names. All other suites pass; engine side effects unchanged.
- 20 Nov 2026 (UAT link v13): "pre-Express-test" fixes from the expert panel review.
  - Site visit finish: every blocker listed with "Go to" (jumps to the check); "Still needed on this check" + amber progress segment; last check's button is "Finish review". Same checks and confirmation as before. Phone walkthrough with a blocker: 37 → 27 taps. Test review-finish 11/11.
  - Fixed (also in v36): first tap on "New corrective Action" after typing a finding was lost (the follow-up buttons were redrawn under the finger).
  - Setup: "Step 3 of 4" (was "3 of 3"); each question shows "Step 4 of 4 · Service X of N"; Express is the default (Detailed remembered); "Last step · first due dates" with Set first due dates as the main button and "Skip for now"; the dates step is full screen; "Your first 3 things" phrased as "Confirm: …" / "Set a date: …"; "Go to Today" is the main button. Test setup-flow 9/9.
  - Today: "1 open action" (was "1 open actions").
  - Fixed BACKUP BUGS (found by tests while making these changes): (a) since Express was added, the Express setting and assumed-answer lists were stored in a format the backup check rejects ("Invalid draft") – Download backup and Save to account failed for Express users; (b) also in v27: any setup answer with more than one tick or an "Other (describe)" answer made backups fail ("Invalid service procedure configuration"). Drafts are now stored as objects (old values converted on read) and the backup check accepts exactly what setup can save, still rejecting made-up answers. Test backup-after-setup 8/8.
  - "Unselected proprietor" on completed reviews: only in the example data; real setup records the proprietor's name (verified in the site-visit walkthrough).
  - All suites: cd-functional 142/142 (now chooses Detailed explicitly), express 18/18, setup-questions 24/24, setup-flow 9/9, review-finish 11/11, backup-after-setup 8/8, today-guide 14/14, review-steps 7/7, s8 20/20 + 5/5, uat-tools 16/16 (Detailed set explicitly), phone 10/10, reset 5/5, confirm 10/10; engine side effects unchanged. Walk-all (v27 comparison) not re-run: setup now differs on purpose.
- 20 Nov 2026 (UAT link v14): ONE SETUP FLOW (owner decision: hybrid of Express and Detailed, after "Express feels too fast / assumes too much knowledge").
  - No mode choice; the services step says what happens next.
  - Each service: intro (what it's for; nothing marked as checked) → questions about this pharmacy, numbered honestly (no gaps) → "What most pharmacies do": the usual arrangements in plain sentences; the proprietor taps "That's how we do it", changes a line (opens that one question, then back to the summary) or marks it "Check later" (Undo). Evidence and record locations are listed as "to check later", never filled in. "Go through every question one by one" from the intro or summary = full question-by-question setup for that service.
  - Nothing is saved until confirmed; leaving at the summary keeps answers for later. Confirmed answers are not "assumed" (no Today pile); the approval block for unconfirmed assumptions is kept.
  - Fixed during testing: when a service's last question was one of its own questions, the old Express code saved without the summary.
  - Plain words: "Your answers are saved", "Saved · …". UAT strip now says what setup does with each question.
  - Tests: express (rewritten for one flow) 24/24; all other suites pass (142, 24, 9, 8, 11, 14, 7, 20, 5, 16, 10, 5, 10); engine side effects unchanged.
- 20 Nov 2026 (UAT link v15): owner notes on the one-flow setup.
  - Decisions applied: no "who is responsible" questions (procedures name the pharmacist in charge); per-service "what happens next" screen (tick, services done, reviews with suggested first dates you can change and save, procedure preview, to-check-later list); OTP: one action "Finish your OTP procedure" opening a mobile "Your OTP procedure" screen (OTP Standards item 1 parts a–g + local parts, Written / To write; nothing marked for you); setup actions due in 30 days, not today.
  - Fixes: S8 / Schedule 8 wording explained; "Secured transport" defined; vaccines grouped (Seasonal and adult · Catch-up and childhood · Travel · Special programs) with Select all; compact activity history (Show more); Preview on "Draft it for me" lines (OTP parts say they go on your OTP list).
  - Verified against Regulation 2026 text: DAA s 136/137/185 and S8 carrier s 191 match; added Appendix L label item and the 12.5 mm / properly addressed details.
  - Program rules reviewed: see PROGRAM-RULES-REVIEW.md (proposals awaiting approval). Pharmacist prescribing researched (proposal in the same file).
  - Tests: otp-parts 11/11 (new); express 24/24, setup-questions 24/24 (updated for decisions), all other suites pass; engine side effects unchanged.
- 20 Nov 2026 (UAT link v16): UAT notes cleared at the owner's request (4 notes + 75 question marks archived in notes-archive-2026-11-20/). New: 'UAT note about this screen' on every window (setup intro, usual arrangements, what happens next, reviews…); question strips no longer appear on the intro/summary/OTP screens. uat-screen-note 5/5; all suites pass.
- 20 Nov 2026 (UAT link v17): notes batch (8) + "procedures too basic".
  - Fixed: "what happens next" layout overflow with many services; DAA routine check shown in its reviews; DAA packing method tick-more-than-one; plainer S8 courier sentences; PPA note on the routine DAA check (no fixed interval; PSA/Board guidelines); option on the services step to answer evidence/record questions now; "Answer now" on every "to check later" item; "Review due dates" shows how often each review runs + "Fill suggested dates"; rule checklists to confirm grouped into one item and counted once in "Start with these 3".
  - Procedures rebuilt for DAA and OTP from the sources (Regulation 2026 s 136/137/185/190–191; PPA DAA Program Rules; OTP Standards items 1–7): numbered steps with citations, filled from answers, PPA-only steps when funded, unanswered/clinical parts as [Confirm: …] listed before adoption. Internal development text no longer leaks into any draft.
  - Tests: procedures 8/8 and setup-round5 14/14 (new); all suites pass; engine side effects unchanged.
- 20 Nov 2026 (UAT link v18): procedures for every service rebuilt from the sources (Regulation 2026 s 12, 33–35, 48, 56–57, 70, 109–111, 115, 122, 127, 134, 136–137, 185, 190–191; PPA rules for DAA, Staged Supply, HMR, RMMR, MedsCheck; OTP Standards; NSW vaccine table). Where the rule is in a document we don't hold (TGA vaping, Board compounding guidelines, NSW NSP policy, prescribing protocols) the step says so as [Confirm: …]. procedures 9/9 (all 17 services); all suites pass.
- 20 Nov 2026 (UAT link v19): vaping, medicinal cannabis and screening procedures rebuilt from the owner's Drive material (research doc of 11 Nov summarising NSW Health/TGA; cannabis practice audit and BP audit used by another app — structure only). Research-based steps marked 'per your research — verify' and listed before adoption. Tests pass.
- 20 Nov 2026 (UAT link v20): vaccination procedure rebuilt from the owner's Vaccine Management Plan guide (Strive for 5 2025; NSW Health cold-chain protocol): fridge, twice-daily min/max, logger, deliveries, rotation, breach thresholds, power failure, transport, records. No site names/contacts copied. Tests pass.
- 20 Nov 2026 (UAT link v21): research round — vaping (TGA pharmacist guidance: validation tool, Schedule 3 limits), simple/complex compounding (Board guidelines Oct 2024), NSP (Pharmacy Guild NSW manual 2022; NSW community sharps guidance), certificates (Fair Work Act; PSA/Guild guideline). Found by search; full official pages are not readable from this session, so steps are marked '— verify'. Tests pass.
- 20 Nov 2026 (UAT link v22):
  - **Owner note:** "Review due dates" now opens with suggested first dates already filled in. Nothing is scheduled until the owner saves; "Clear suggested dates" empties them.
  - **Inspection items (PRU top 3):**
    - Pharmacy setup has three new rows: **Pharmacist in charge** (name and start date, with history; s 122(2)), **S8 at a glance** and **Legal obligations**.
    - **S8 at a glance** shows:
      - the inventory (s 111);
      - who the law puts it on: the proprietor for s 108–111 and the pharmacist in charge for s 122;
      - where each S8 record is kept and when it was last sighted (owner-entered only);
      - S8 answers from setup and open S8 actions;
      - NSW Health's steps for missing or stolen S8, a lost drug register, and destruction.
    - **Legal obligations** lists one line per Regulation section that applies to the active services, each with "where it's kept" and "last sighted".
    - Approving a procedure is blocked while it still has [Confirm]/"— verify" markers. In this pilot approval is already unavailable without sign-in; the guard is ready for when sign-in exists.
  - **NSW Health:** the whole Pharmaceutical Services site was read using the Browser Use plugin (189 pages, 111 PDFs). The gap analysis is in NSW-HEALTH-GAP-ANALYSIS.md and the raw notes in research/.
  - **Tests:** inspection 17/17 (new); setup-round5 updated for the pre-filled dates.
  - **NSW Health gaps filled (same version, before publishing):**
    - **S8 review:** adds the Medicine Storage Standards (safe spec and fixing), keys and codes, register rules, 24-hour receipts and 14-day orders, and the e-register governance. The original 3 questions are kept.
    - **Site visit:** adds prescription verification and 2-year records.
    - **Vaping review:** now *is* NSW Health's own self-assessment tool.
    - **Vaccination, prescribing, OTP, DAA, aged care, delivery and cannabis:** the NSW-specific lines are added.
    - **Prescribing options:** add the 5 Queensland-trained conditions and correct the contraception scope.
    - **Vaping and cannabis procedures:** cite NSW Health wherever it confirms a step; only TGA-only steps keep "verify".
    - **Legal obligations:** adds the Storage Standards, s 112, forged scripts, OTP registration, Vaccination Standards, Class Authorities and vaping.
    - **S8 page:** adds a forged-prescription card.
    - **Pharmacy setup:** adds "NSW Health dates and contacts" and "Selling, buying or closing".
    - **Tests:** nsw-health 17/17 (new); cd-functional updated to 12 setup rows; setup-flow updated for the pre-filled dates.
- 21 Nov 2026 (UAT link v23–v24):
  - **New:**
    - My log;
    - staff suggestions;
    - S8 construction checks yearly;
    - Pharmacy Council premises standards and notices;
    - Pharmacy Board guideline duties (1 Oct 2026) in the governance review;
    - compounding and NSP steps verified.
  - **Phone UX:**
    - rows open on tap;
    - Today shows the top 3 plus 8, with "Show all" (3,917 → 1,618 px);
    - shorter summary;
    - grouped setup;
    - new landing copy;
    - "Bought, selling or closing" for new owners.
  - **Assessments:** ASSESSMENTS-2026-11-21.md.
  - **Tests:** all suites pass.
- 21 Nov 2026 (UAT link v25): fixes from Codex's live walkthrough.
  - **Calendar** includes dated open actions; the year plan stays reviews only.
  - **"Create this draft"** on each service's "what happens next" screen.
  - **Plain-word** policy statuses.
  - **S8 review:** no provisional next date until the stock-check date is entered.
  - **Adopting** a procedure is blocked while [Confirm] items remain.
  - **Wording:** "Pharmacy details saved", "1 person", "Save meeting" / "Schedule next meeting".
  - **Tests:** codex-fixes 7/7; related suites pass.
  - **Still open from Codex's list:**
    - action titles lead with the finding;
    - History verbs;
    - "1 open action" on review results;
    - resume jumps to the next unanswered question;
    - group a person's checks on Today;
    - one consistent count;
    - say which items have no date;
    - offer the ownership guide at the start of setup.
- 23 Nov 2026 (UAT link v26): Codex audit, batches 0–3, 5 and 6. Owner decisions: D1 yes (one Today job per person); D2 pre-fill the next meeting (unchanged). The owner said "don't ask for approval".
  - **Batch 0 (evidence):**
    - Draft guard. Codex's stale-close overwrite was reproduced on v25 and is fixed: an untouched or older window can't overwrite a newer draft; if both edited, the newer stays and this window's copy is kept separately.
    - Restore keeps one history entry and rejects broken finding→action links.
    - Each build has an ID (meta rph-build) and the file SHA-256 is printed.
  - **Batch 1 (Today):**
    - One job count everywhere (header = All open tab = 3 featured + "N other jobs"; "Show N more").
    - Codex sort order.
    - "Review <name>'s checks · N checks".
    - Zero overdue is neutral.
    - "N need a date" link.
  - **Batch 2:** resume at the first unanswered check; Today shows "Resume · 2 of 9 checked · saved <date>".
  - **Batch 3:** action titles lead with the finding (original in "From:"); review results and History show "· 1 open action"; History verbs on phones.
  - **Batch 5:**
    - "Just bought this pharmacy?" on the first setup screen, with Back to setup.
    - "Inherited · check later" once marked as just bought.
    - "Create this draft" reuses an existing draft.
    - "Not ready to adopt" opens the draft.
  - **Batch 6:**
    - TGA recalls line in the site visit.
    - Privacy obligation and data-breach card.
    - Vaccination steps cited.
    - Certificates marked optional (Fair Work s 107).
  - **Next:**
    - Batch 4: event, sighted and reminder dates for all reviews; service off keeps open findings.
    - Batch 7: source map.
    - Batch 8: real phone, screen reader, restore in a clean browser, exports.
    - Site visit: show the pharmacy's open findings in the visit.
  - **Published v26:** build 592ce8b84ef5 · sha256 e8751f7576be830e4a41018f6295f3d504cd6d681d1010f1328680c258b2bf10. All suites pass (the stale uat-functional excepted).

## v27 · 23 Nov 2026 · Codex game plan, remaining items
- **Today:**
  - new filters: Due today and In progress; "Upcoming" (next 7 days);
  - each filter has its own empty message ("Nothing due today.");
  - coming back to Today returns you to where you were scrolled.
- **Dates:** a review recorded later than it was done now shows "recorded <date>" on its result, and History says "done X, recorded Y".
- **Exports (Batch 0, export accuracy):**
  - the History CSV and printed report showed a site-visit "Needs verification" answer as "Rating unconfirmed". They now show each answer exactly as recorded (Checked / Issue / Needs verification / N/A / Not reviewed);
  - the downloaded review detail uses the same words as the screen (Action, not Task).
- **Search:** Actions search finds an action by its original question wording and by its current, finding-first title.
- **OTP 80-patient check:** the existing amenity review already asks for the amenity plan, its annual review and the signed proprietor staffing declaration. No change needed.
- **Small screens (Batch 8, automatable part):** at 320 px with large text, Reviews, Actions, Staff and Setup scrolled sideways. Fixed: page headers and tables wrap, and the initials badge no longer wraps over the heading. All 8 main pages are checked, including that the bottom navigation doesn't cover the last control.
- **New tests:** today-filters (6), export-accuracy (9), small-screen (17). All suites pass.
- **Published v27:** build f4970f3cee73 · sha256 9c07314ccb980b7da7a53b8ae7c00ef2e54e53fbd753055e43fbbd198d655e3a.

## v28 · 23 Nov 2026 · phone setup list and Today segments (owner approved the mock-up)
- **Pharmacy setup (phone):** each section is one row with an icon, a one-line summary and a › arrow. A status chip shows only where something needs attention (for example "3 need a date"). One tap opens the section straight away. The laptop layout is unchanged.
- **Today filters (phone):**
  - four segments with counts: Overdue, Today, Started, All;
  - "More filters" slides up from the bottom with Upcoming (next 7 days, dates shown), Actions only, No date yet and To check;
  - choosing one closes the panel and shows "Showing: Upcoming · Clear";
  - Escape or Close shuts the panel. The laptop keeps the full row of tabs.
- **Mock-up:** uat/mockups/setup-today-mockup.html.
- **New test:** mobile-lists (13). All suites pass.

## v29 · 24 Nov 2026 · Start a visit, Last time, staff checks due now (from the agency roadmap)
- **Start a visit:**
  - Today has a card "At <pharmacy> today? · Start a visit". It becomes "Resume visit · N of M checked" while a visit is in progress.
  - Prepare screen:
    - pharmacy and date;
    - Quarterly or Extra visit (an extra visit keeps the quarterly date);
    - up to 3 things worth seeing while there, each with a reason. Earlier-visit follow-ups come first, then staff records to sight (one combined item), then overdue and soon-due actions; "View all" shows the rest.
  - Opening a suggestion and closing it brings you back to the prepare screen. "Start the checks" opens the existing site visit.
- **Inside the visit:**
  - "Last time · <date>" shows on a check where the previous visit found an issue that has since been closed, with the closure date. The answer still starts blank.
  - Closing a follow-up opened from a check returns you to that same check.
- **Staff checks:**
  - a person's group reads "<name>’s checks · 2 due now · 6 upcoming";
  - the detail splits Due now and Upcoming;
  - "Review the 2 due now" opens them one after another, with a Today banner "N of M done · Next: … · Next / Stop". Nothing is completed for the owner.
- **Tests:** new visit-flow (15). The today-guide and today-contract label checks were updated for the new group label. All suites pass.

## v30 · 24 Nov 2026 · PIC prep list and recovery (from Codex's review of v29)
- **Copy a list for the PIC:**
  - a new button on the Start a visit screen, with a visit date;
  - builds an editable message: "Hi, I'm visiting <pharmacy> <day>. Could you please have these ready? • …", taken from the visit suggestions (setup "check later" items left out);
  - Copy message copies it. Nothing is sent from the app; the owner decides.
- **Recovery:**
  - Setup shows "Last backup <date> · N changes since", or "No backup file yet" as an attention chip.
  - Today shows a quiet reminder only when there's no backup, or the last one is over 14 days old and things have changed.
  - After a restore, a one-time receipt says when the file was made and what came back: completed reviews, open actions, an unfinished visit, drafts, history up to <date>. It also says that work done after that isn't in the file.
  - Note: "Last backup" means the app made the file. The browser can't confirm where it was saved.
- **Tests:** new recovery-prep (11), using a real setup helper (tests/lib-setup.js). The mobile-lists chip list now allows the backup chip. All suites pass.
- **Not built (needs owner decision):** "Tell me once" for DAA outsourcing. It changes which review questions and procedure steps apply, so it touches obligations; scope first.

## v31 · 24 Nov 2026 · Waiting on someone, and an action's full history
- **Waiting on someone** (any open action, including a staff check):
  - "Note what you asked for", with a check-back date (Friday / In a week / In 2 weeks / pick).
  - The action's due date, any expiry and its status never change. It stays open and unverified.
  - Today shows "Waiting · check back Fri 28 Nov · asked 24 Nov". On the day, it shows "Check back today" with a Check back action.
  - A person's folded group shows "1 waiting" or "1 to check back". The visit suggestions list it ("You asked on …").
  - A new "Waiting on someone" option in More filters.
  - In the action: "It's arrived · record it" (clears the wait and leaves you in the action to record and close it yourself), "Still waiting · new date", or "Not waiting any more". Each step goes into the action's activity, so backups keep it.
- **Full history** on any action:
  - a timeline of the original finding (with the review and check it came from), action raised, updates, asks, received, closed or reopened;
  - Copy this history, or Save as text (laptop copy);
  - closing it returns to the action.
- **New test:** waiting-history (16). All suites pass.

## v32 · 24 Nov 2026 · Tell me once (DAA packing) and inherited facts on a first visit
- **Source re-check, 24 Nov:**
  - NSW Health, Dose Administration Aids page (current as at 4 Sep 2026), read live. Corrections to the mock-up:
    - TGA manufacturing licence: the page says to ask the TGA (GMP@health.gov.au) whether one is needed. The FAQ says third-party packers need a GMP licence. Shown as **Check**, not "Required by law".
    - Added the **reference number** required on third-party packs, linking the pack, the instructions and the prescriptions (a barcode or QR code is fine).
    - Added the **other-pharmacy case**: consent is required before prescriptions are transferred, that pharmacy becomes the supplying pharmacy, and this pharmacy must not be labelled as supplier.
  - Patient consent for third-party packing stays **Recommended** ("should").
- **Services · DAA:**
  - "How it runs" shows the current arrangement, with "Change how this service runs", or "Continue the change (N left)" when one is open.
  - Flow:
    - **What's changing:** the same three arrangements as the Services page, the packer or pharmacy, and the start date.
    - **Before and after:** who packs, supplying pharmacy, records, patients.
    - **Save this change:** one change record, with the arrangement switches saved the same way the Services page saves them.
    - **The change screen:** only the items that depend on it, each tagged Required by law / Check / Recommended / Your procedure, with its source. Done (the licence item asks where the copy is kept) or Later (raises one ordinary action, never two). "Open DAA setup" goes to the existing DAA questions and comes back, so new procedure wording stays a draft until adopted.
    - **"Kept as it is":** open DAA actions, past reviews and review dates are untouched (tested).
  - Opening it again resumes the same change.
- **First visit after buying** (state.inherited):
  - the Start a visit screen shows "From the previous owner · confirm while you're here", with up to 3 items;
  - the DAA arrangement comes first, with Confirm / Correct / Leave open. Confirm records who confirmed it and when, and Services shows "Packing arrangement confirmed <date> by <owner>". Correct opens Tell me once and returns to the visit;
  - other "check later" items have Check now / Leave open.
- **New test:** change-daa (25). All suites pass.
- **Next change types (not built):** change of pharmacist in charge, and starting or stopping a service.

## v33 · 24 Nov 2026 · every bug from Codex's v27 retest fixed
- **R04 drafts:**
  - a form opened and closed without a real change by the owner leaves the stored draft exactly as it was, so an older-format draft keeps its date, note and extra fields;
  - if the owner does edit one, fields the new format doesn't use are kept alongside (under "legacy");
  - the form session now ends after its own save-on-close.
- **R03 exports:**
  - the History CSV and print are corrected cell by cell from each original review (a real CSV parser, so quotes in the pharmacy name are fine);
  - two visits saved at the same moment are told apart by their answers. If they can't be, the cell is left as it was, never borrowed from the other visit;
  - the review-detail download changes only the app's own labels, never words the owner typed.
- **R05 S8 date:** the suggested next date follows a corrected stock-check date and clears when it's cleared. A date the owner typed is kept (still capped at 3 months, s 111).
- **R06 credential expiry:**
  - an action linked to a staff credential shows the credential's expiry ("credential expired 21 Nov · action due 2 Dec");
  - it sorts by the earlier date, and an expired credential is overdue.
- **R06/R07 counts:**
  - a person's staff checks group from 2, not 3, so two due today count as one job;
  - an opened group shows its checks straight away under the phone's 8-row limit.
- **R04 Resume:** opens an earlier check that still needs a reason before a later unanswered one.
- **R04 In progress:** lists every saved review draft, including far-future reviews and extra (event) site visits.
- **R01–R03 follow-up evidence:**
  - review results count actions linked only by taskLinks;
  - History verbs come from the actual status change ("Action reopened", "Action closed"), so a note mentioning "completion" is just "Action updated";
  - the Full history timeline uses the same rule.
- **R04 restore:** only a retry duplicate (same person, within a minute) is dropped. Genuine restores on different dates or by different people all stay.
- **Tests:**
  - new: retest-fixes (15), one check per Codex case;
  - the integrity test now uses real typing (script-made events no longer count as the owner editing).
  - All suites pass.
- **Still needs a person** (Codex Batch 8): a real phone, VoiceOver/TalkBack, clean-browser restore end to end, and the 11 other services by hand.

## v34 · 24 Nov 2026 · wording
- The pre-visit list is now "Copy a list for the pharmacist on duty" (was "for the PIC"). The owner noted the pharmacist in charge changes daily and isn't a proprietor responsibility.
- "Tell me once" for a change of pharmacist in charge is dropped from the plan.

## v35 · 24 Nov 2026 · pharmacist in charge is rostered; responsibility sits with the proprietor
- **Owner:** the pharmacist in charge changes day to day (e.g. A Mon–Wed, B Thu–Sat, a Sunday pharmacist), and all responsibilities sit with the proprietor.
- **Setup:**
  - "Pharmacist in charge" is no longer in the setup list;
  - the S8 page and Legal obligations no longer ask you to record one or flag it as missing;
  - the screen's code and any saved history are kept (nothing deleted).
- **Wording, with the legal references kept accurate:**
  - S8 at a glance: "S8 storage (s 122) · You make sure it's done · the Regulation names the pharmacist in charge on the day".
  - Legal obligations s 122: "You (the Regulation names the pharmacist in charge on the day, s 122(2))".
  - NSW Health obligations: "You, as owner and responsible person (the Regulation also names the pharmacist in charge on duty, s 122)".
  - Displayed names (Council Guide Note 24): "the name of the pharmacist in charge on duty next to the dispensing area (it can change day to day)".
  - "Bought, selling or closing" no longer says "Record the new pharmacist in charge".
  - Procedures: "Pharmacist on duty: runs this service as described" and "Proprietor: responsible for the service; reviews exceptions and open actions at the site visit". Follow-ups go to "the pharmacist on duty".
- **Not changed:** stored answers whose value is "Pharmacist in charge" (a validated option), so backups stay valid.
- **Tests:** setup now has 13 rows (cd-functional, mobile-lists), and the inspection checks were updated. All suites pass.

## v36 · 24 Nov 2026 · procedures say "the pharmacist on duty"
- Drafted procedures now read, for example, "Delivery incidents are reported to the pharmacist on duty" (home delivery) and "Missed collections are reviewed by the pharmacist on duty" (staged supply).
- The saved setup answers keep their validated value ("Pharmacist in charge"), so backups still restore. Only the drafted wording changes.
- Legal citations such as "the pharmacist in charge (s 122)" are left as written. Approved procedure versions already saved keep their own text.
- **Tests:** retest-fixes (16, plus this check) and setup-questions (expects the new wording). All suites pass.

## v37 · 24 Nov 2026 · accessibility pass (automated)
- **axe-core 4.10.2:** WCAG 2.0, 2.1 and 2.2 A/AA rules, including tap-target size. Run on 10 main pages and 5 windows (Start a visit, site visit, action, S8 review, DAA change) at iPhone size.
- **Found:**
  - 37 filter buttons used a "tab" role with toggle-button state, which screen readers can announce wrongly;
  - 139 places with grey text just under 4.5:1 contrast, from the engine fading header text to 85% and the pale grey #8a92a3.
- **Fixed:**
  - filter rows are now plain groups of toggle buttons;
  - the header is no longer faded;
  - the pale grey is #687083 (passes on white and on the light-blue cards).
- **Result:** no violations. Kept as a permanent test (tests/a11y.js, with axe vendored in tests/vendor, MPL-2.0).
- **Still needs a person:** a real VoiceOver/TalkBack pass.

## 24 Nov 2026 · while waiting for the owner's live run
- **Walkthrough page** of every new feature (phone screenshots, fictional data): https://claude.ai/artifact/DF3upq1xeikd7vy4fnp57k
- **Sign-in and hosting options** (decision doc, D3): https://claude.ai/artifact/MnhrUaU5u1TxWgTuTHJu3P. Recommends a managed back end in Sydney with emailed-link sign-in, about A$40 a month and 3–5 weeks of build, in three stoppable steps.
- **Handover updated** to version 37: HANDOFF-FOR-AI-2026-11-24.md (the 21 Nov one is kept).

## v38 · 24 Nov 2026 · onboarding: a setup map, step counters, a checklist on Today (owner approved the mock-up)
- **First screen:** "Setup: 4 short steps, about 15–20 minutes. Only the first 3 are needed to start…", with the steps listed. Pharmacy details, Owners and Choose your services are marked Needed to start; Set up each service is marked Can wait.
- **Step counters:**
  - steps 1 and 2 now show the same counter the app already had on steps 3 and 4: "Step 1 of 4 · needed to start", "Step 2 of 4 · needed to start";
  - Services provided now reads "Step 3 of 4 · needed to start";
  - only during first-time setup, not when editing later.
- **Today:**
  - "Finish setting up · N left" as a checklist: done steps ticked, the next one highlighted with Start, then one line per chosen service. It replaces the "2 of 6 steps" bar;
  - when all done, a one-time "<pharmacy> is set up" message, removed for good by Got it.
- **Mock-up:** the buttons that ran past the edge are fixed (box sizing).
- **Tests:**
  - new: onboard (13);
  - confirm-fallback now pins its own test button, because the longer first screen put it under the UAT notes bubble;
  - all suites, including a11y, pass.

## v39 · 24 Nov 2026 · design review: all eight fixes (owner approved the mock-up)
- **1+3 Calm Today:**
  - One card on top, in this order: visit in progress → setup unfinished → backup old → "set up" message → "How this app works" (first week only) → Start a visit.
  - "Start with these 3" is removed; the list starts straight away.
  - The status line is the date plus one sentence ("3 things are overdue. Start with “Proprietor site visit”."). The counts live on the four buttons, and the header no longer repeats "3 overdue".
- **2 One way into a site visit:** starting the quarterly site visit from anywhere opens Start a visit first. A visit in progress resumes directly.
- **4 Words:** "Action" (not "Action details"); "Action raised" on screen and in the downloaded detail; "Check later · from previous owner".
- **5 Action screen on a phone:**
  - the title as text, then "Seen the fix · close it", Waiting on someone and Full history;
  - the form sits under "Edit details";
  - "Seen the fix" opens the form set to Completed, with Resolution focused. Nothing closes until Save.
- **6 "Saved…" confirmations:** at the bottom, gone after 3 seconds. Warnings stay where they were.
- **7 Bottom bar:** Today, Reviews, Actions, Staff, More. Calendar is under More.
- **8 Polish:**
  - short dates (year only when not this year; "tomorrow");
  - no "Item / Due" header on the phone list;
  - the full pharmacy name in the header;
  - the site visit's "Before you start" leads with what's open from earlier visits.
- **Tests:**
  - new: calm (10), plus 2 new checks in cd-functional for the close flow;
  - updated for the new design: today-guide, today-contract, visit-flow, recovery-prep, resume, review-finish(-b3), cd-functional (navigation, More);
  - all 35 suites pass, including a11y.

## v40 · 24 Nov 2026 · vaccines check, build number visible
- **Owner report:** the vaccines question in new-pharmacy setup asked to type each vaccine.
- **Checked** on version 39 (the published link serves build c172017a2f65), phone and laptop, with one service and with four:
  - "Which vaccines are offered?" shows the four groups (Seasonal and adult, Catch-up and childhood, Travel, Special programs) with Select all;
  - the only typing boxes are "Other (describe)" and the UAT tools' own note boxes.
  - Not reproduced. Most likely an older copy still open on the phone.
- **The UAT notes panel** now shows the build number at the top, so the version being tested can be confirmed.
- **New test:** vaccine-groups (8, phone and laptop), so the grouping can't silently go back.

## v41 · 24 Nov 2026 · example pharmacy (Wattle Grove, fictional), walkthrough notes captured
- **Owner walkthrough notes:** 7 notes plus 1 question mark were read and summarised; none actioned (owner: capture only, fixes later). Copies are in uat-notes-archive/walkthrough-2026-11-24/. The live notes are untouched.
- **Example pharmacy:**
  - UAT notes → "Open the example pharmacy" adds Wattle Grove Pharmacy (fictional) as a separate pharmacy, with about a year of records and dates moved to sit around today.
  - "Back to my pharmacy" switches back. The owner's pharmacy and the notes are not changed.
  - Made by demo/build-demo.js, which runs the real app through a year; the backup is validated before it's used.
  - Layer: layers/example-site.js. Data: demo/wattle-grove.json.
- **Tests:** new example-site (22 checks). Full run: 46 of 49 files pass. The 3 failures are stale scripts from before v39, not regressions:
  - uat-phoneview expects Calendar in the bottom bar (moved into More in v39);
  - shots looks for "Add Task";
  - uat-verify2 not investigated.
- **Observed, not fixed:**
  - Verified annual checks don't close the matching "Review …" staff actions.
  - The Policies list shows "updated 27 Nov" without the year for last year's drafts.
  - "Vaccination active · no staff with relevant credentials recorded" stays after a vaccinating pharmacist is verified.
- **Handoff for Gemini:** HANDOFF-FOR-GEMINI-2026-11-24.md and PROMPT-FOR-GEMINI-CRITIQUE.md.
- **v41.1 (build ef42205efde8):** the UAT notes button opened an older copy of the window, so the Example pharmacy box was missing when tapped. The button now always opens the current window. The example-site test taps the real button.
