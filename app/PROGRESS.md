# PropApp rebuild: progress log

## Milestone 1 · 24 Nov 2026 · build f7894bf161
Live test link (private to the owner): https://claude.ai/artifact/5fKsJBkM1Jq35fGrAjqqq6. The current app stays at its own link, unchanged.

**How it's built:**
- plain modules in `app/src`, bundled into one file by `node app/tools/build.js` (add `--uat` for the UAT notes button);
- one data model (`model.js`) and one module for every count (`summary.js`);
- rule content pulled word for word from the current app (`tools/extract-content.js`);
- the procedure generator and setup-question rules copied as source (`tools/extract-procgen.js`), with `tools/check-procgen.js` proving the DAA, OTP, staged supply, vaccination and home delivery drafts for the example pharmacy are identical, character for character.

**Old backups:** they open in the new app (`legacy.js`), including the Wattle Grove example, its drafts in progress, procedures, staff checks, actions with full history, My log and evidence locations.

**Fixes from the audit and Gemini:**
- quarterly and extra visits are separate and can both be in progress (F-03);
- one row per person and one S8 row on Today (F-05, F-10);
- one set of counts (F-07);
- Upcoming means 7 days (F-06);
- an inspector-readable History CSV (F-02);
- action close in 2 taps plus what you saw (F-17);
- no "Responsible person" field (F-12);
- quick annual check (F-09);
- procedure screen with Edit and Adopt only, with gaps linking to their question (F-08);
- 44 px targets;
- bottom bar with icons;
- one date style;
- "No patient names" hints;
- calendar feed (.ics);
- leaving checklist with S8 codes and e-register items;
- locum quick check;
- first-dates planning;
- the S8 3-month limit enforced on every date.

**Tests** (real taps, phone size, any console error fails):
- `tests/core.js`: visit flow, action raised and closed;
- `tests/screens.js`: 44 screens, no sideways scroll;
- `tests/setup-questions.js`: vaccine groups, DAA packing choices.

All pass.

**Not yet in the rebuild** (old app still has them; see `uat/FEATURE-INVENTORY.md`):
- Express setup (replaced by "Check later" on every question, to confirm with the owner);
- the year plan as a grid (shown as a month-by-month list);
- account placeholders.
- procedures for the 12 services the example pharmacy doesn't offer use the same copied generator, but only the 5 it does offer have been compared word for word so far;
- a screen for draft conflict copies (they are kept, but not yet shown).

## Sprint 1 and 2 from Gemini's review · 24 Nov 2026 · build 81a46c3cfa
Earlier builds this day: c6e264fe91 (milestone 1b, the one Gemini reviewed), 419d55f9a2 (Sprint 1).

| ID | Status | What changed |
|---|---|---|
| N-01 | Fixed | Adopt asks once on the page ("Adopt version 1.0 for use here?"), records who and when, sets version 1.0, and survives a reload. Before, it needed a second tap, and the only hint was a short message. |
| N-02 | Fixed | Search works as you type, for reviews, actions, staff, procedures, services and rules. Before, it updated only when you left the box. Actions and History search the same way. |
| N-03 | Fixed | Issue stays on the check and asks what you found, a fix-by date, and whether it is already an open action (link instead of raising a new one). The jump came from a resumed visit having no saved position. |
| N-04 | Fixed | A strict Content Security Policy sits in the standalone file's head (no network connections). The claude.ai copy has no head of its own; the viewer applies its own policy there. |
| N-05 | Fixed | The Calendar uses the same items as Today: one row per person, and visits in progress in their own section. Overdue counts agree (tested). |
| N-06 | Fixed | The annual check lists expired or expiring-soon credentials first, with "Valid until" dates. "Confirm these N unchanged" covers only the others. |
| N-07 | Fixed | "Change how DAAs are packed" is on the DAA service page (it is also still in Bought, selling or closing). |
| N-08 | Fixed | Legal items come first within each group. A DAA review appears only after the packing question is answered. |
| N-09 | Fixed | Contact phone numbers and emails are tap-to-call and tap-to-email. The text stays too. |
| N-10 | Fixed | S8 rows in Legal obligations show the last S8 review date; nothing is marked as seen for you. My log entries are in History and the CSV. |
| N-11 | Fixed | The status sentence is plain text, with no small duplicate link. |
| N-12 | Fixed | Reviews shows the quarterly visit as overdue while only an extra visit is open. Drafts say "adopt it in Procedures"; this is the only wording change from the current app's generator (check-procgen applies the same change). |
| N-13 | Fixed | Open actions show who raised them in the CSV, the title is R.Pharmacy, confirmations clear when you move on, there's room above the UAT notes pill, and build IDs are logged here. |
| N-14 | Fixed | The question counter says "more may follow, depending on your answers" when later questions depend on earlier ones. |
| N-15 | Fixed | "What happens next" shows its reviews with suggested first dates to change, then "Save dates and finish". An answered service shows "Answered · tap to finish". |
| N-16 | Fixed | "(Policies)" now reads "(Procedures)" in setup text. |
| N-17 | Fixed | Finishing a service returns to Services with "Next: <service>" and "Back to Today". |
| N-18 | Fixed | Finishing writes the draft procedure (0.1), as the screen says. |
| N-19 | Fixed | Add staff shows "Choose a role." under the field. |
| N-20 | Fixed | Tapping the pharmacy name in the header opens Pharmacies, with each site's overdue count. |

**Also done:**
- Today has 4 views (Overdue, This week, Waiting · to confirm, All) plus a quiet "no date yet" line.
- Edit has moved into the action header.
- A procedure gap opens its exact question; "Save and back to the procedure" redrafts it.
- Real answers replace "Check later" (a bug found while testing this).
- Date range, print and My log are in History.
- The visit card is warm-tinted, numbers line up, and Staff has a proper empty state.

**Not done, with reasons:**
- A teal brand colour: the owner approved the Concept D black-and-white look, so changing it is the owner's call.
- Splitting each service into "essentials" and "record locations": the honest counter and "Check later" cover the friction for now.

**Tests:** sprint1 (19 checks), sprint2 (17), core (11), screens (44 screens), setup-questions (6) and extras (5). All are real taps at 390×844 and all pass, with no console errors.

## Overnight brief, Sprints 3–5 · 25 Nov 2026 · final build 383803d03e
Commits: Sprint 3 b875cfb · Sprint 4 58c9c87 and 972bb31 · Sprint 5 (this commit).

| ID | Status | What was done | Test |
|---|---|---|---|
| S3-01 | Done | When DAA is packed on site, its checks happen at the site visit, so "What happens next" offers the site visit's first date (labelled "DAA is checked here"). A service with no dates gets "Finish setup". | sprint2, sprint3 |
| S3-02 | Done | Tests hardened as specified: the DAA packing change flow, the CSV downloaded and parsed (My log rows, "Recorded or closed by" on open actions), no link in the status sentence, no "(Policies)" in setup, a finished service raising the 2026 action. The calendar file is parsed, "Still waiting" keeps the due date, and leaving and locum checks are tested. Small targets and repeated sentences are now hard failures. There's a 320×568 pass on the 5 main tabs. Search is typed, not blurred. | all |
| S3-03 | Done | Core setup and each service's question position survive a reload. Today shows "Finish setting up · N left" as a checklist, then a one-time "All set up". | sprint3 |
| S3-04 | Done | Record-location questions come last, as one optional step: "Where you keep records · optional now", with "Answer now" or "Skip for now". Skipped questions are listed under "To confirm" and in the procedure's confirm list. | sprint3 |
| S3-05 | Done | Site visit service evidence: DAA operational sample, and staged supply and vaccination evidence status, each with a reference. Saved to the visit record and History; survives a reload. | sprint3 |
| S4-01 | Done | Procedure lifecycle: version history, "Record that I reviewed" (date and who; the version doesn't change), local amendment, annual procedure review on Today and the Calendar, linked actions, document reference library. All 17 services' drafts are word-for-word identical to the current app's (`tools/check-procgen-all.js`), apart from "adopt it in Procedures". | sprint4, check-procgen-all |
| S4-02 | Done | Reviews: 7 filters, live search, "Include reviews not in your plan", and a detail view (how often, last done, set by, why it's here). | sprint4 |
| S4-03 | Done | Calendar: Weeks, Month (grid; tap a day) and Year plan (12 months: ● due, ○ expected repeat, ✓ done; scrolls inside its own box). "Find a date" in plain words. "Schedule a meeting" updates the Calendar, Today and the calendar file. | sprint4 |
| S4-04 | Done | "If something goes wrong": the current app's three cards word for word, with sources, plus relevant contacts as tap-to-call and tap-to-email. | sprint4 |
| S4-05 | Done | Evidence locations: one directory built from setup answers and legal obligations. Editable; it updates the underlying answer and is logged in History. | sprint4 |
| S5-01 | Done | "Download summary" and "Copy as text" on a completed review; "Copy full history" and "Download" on an action. Printing History hides the bottom bar, the header and the UAT pill. | sprint5 |
| S5-02 | Done | Untouched sessions write nothing (tested). Each save now checks storage first: if the stored draft is newer, it's kept, and this phone's copy becomes a conflict copy. Conflict copies are listed under Backup and devices (copy or dismiss). Storage status shows there. A timing bug found by the full run (a draft change arriving mid-save) is fixed. | sprint5 |
| S5-03 | Done | UAT tools: marks on each setup question, Copy all, Clear all and Reset test data, each with a second-tap confirmation. | sprint5 |
| S5-04 | Done | Full gate: core, sprint1–5, screens (390 and 320), setup-questions and extras all pass, with no console errors. 135 checks. Both procedure checks pass. The feature list has been re-audited, with tests referenced. | all |

**Judgement calls:**
- **S3-01:** for DAA packed on site, the current app checks it inside the site visit, so the date offered is the site visit's. No new separate DAA review was invented.
- **S4-04:** the brief mentions phone links for Pharmaceutical Services, but no phone number for them is in our sources. The screen lists the sourced numbers instead: the public health unit and indemnity incident advice, plus emails.
- **Still deferred, per the brief:** Express setup, and account or sign-in placeholders.

## Post-parity polish brief (P-01 to P-06) · 25 Nov 2026 · build 246a96f3c1
Brief: "PropApp — Post-Parity Polish & Lock-In Brief (For Claude)" and its tracker sheet (owner's Drive, read only).

| ID | Status | What was done | Test |
|---|---|---|---|
| P-01 | Done | The one leftover, the Home delivery setup note, now says "(Procedures)". It is fixed at the source in `tools/extract-procgen.js` (one rename, so a re-extract can't bring it back). The bundle has 0 matches for "(Policies)" in both files. | sprint2 (bundle grep, both files), polish |
| P-02 | Done | Year plan: the review-name column is fixed at 140 px and long names wrap (CSS `max-width` alone is ignored on table cells, so the table uses fixed layout with 34 px month columns). 6 months are fully in view at 390 px. "Find a date" placeholder is now "e.g. 1 Dec, next Friday" and fits. | polish (measured) |
| P-03 | Done | See the audit below. 0 "Responsible person" fields on any Action, Review, Staff or Visit form. | sprint2 (bundle grep) |
| P-04 | Done | With the UAT pill showing, toasts sit above it (12 px clear, measured on the DAA "Skip for now" toast). FEATURE-INVENTORY.md line 139 now says storage status is shown. | polish |
| P-05 | Done | All 4 blind spots closed (below). | sprint2, sprint5, screens, handoff-overnight |
| P-06 | Waiting | Waiting for the owner to pick a look in the Grand Finale Studio. Nothing changed. | — |

**P-03 audit: "Responsible person or role".** The brief counted 32. The extracted content actually had 28, all in `src/content/reviews.json`, and none in the procedure generator. Each was the label of the old app's follow-up "owner" text box on a review form (`forms.<id>.fields[n]`, id `owner`), in:
- B1 and A3;
- CO-P and CO-F;
- 16 service reviews (service-otp, -staged, -vaccination, -prescribing, -reviews, -delivery, -simple, -complex, -aged, -screening, -nsp, -certificates, -vaping, -cannabis, -funding, and annual-adherence);
- otp-full, otp-amenity, daa-house, daa-external, daa-external-b, vacc-ready, vacc-storage and prescribing-ready.

None of the 28 is shown in the rebuild: review forms use their own short field list, and issues ask "What needs fixing?" and "Fix by" (a date). None is SOP text either. All 28 were renamed "Who follows it up" (in `tools/extract-content.js` and the JSON), which is also the label an imported v41 record with that field now shows.

Four "responsible person" phrases remain, all in `src/content/law.json`. They are the Regulation's own words (s 108 and s 122) on S8 at a glance and Legal obligations, and stay word for word (CLAUDE.md: obligations keep their exact wording).

Elsewhere in the old app the phrase was on the task form and the task filter. Those were replaced in the rebuild, where actions have no person field.

**P-05: the 4 blind spots.**
1. sprint2 greps both bundle files for "(Policies)" and "Responsible person or role" (0 each). That covers all 17 services' setup notes and drafts.
2. sprint5 checks every Copy button against a clipboard stand-in (a file:// page can't use the real clipboard):
   - review "Copy as text";
   - action "Copy full history";
   - conflict copy "Copy its answers";
   - UAT "Copy all".
   Each checks the text copied and the "Copied" confirmation.
3. handoff-overnight takes `8-conflict-copies.png` with an active conflict copy, before anything is dismissed.
4. screens checks at 320×568, beyond the 5 tabs:
   - Site visit with the service evidence panel open;
   - Backup and devices with a conflict copy;
   - Evidence locations.
   Each checks for no sideways scroll and nothing past the edge.

**Two real bugs the new tests found, both fixed:**
- **Copy buttons showed no confirmation.** They copied the text, but "Copied" never appeared, because a toast only showed on the next re-render. Toasts now show straight away.
- **A conflict copy only appeared after a reload.** When a save kept a conflict copy, the open screen kept showing this phone's older copy, and Backup didn't list it until reload. The store now tells the app straight away.

**Tests:** full run on build 246a96f3c1: core, sprint1–5, screens (390 and 320), setup-questions, extras and polish. 156 checks pass, with no console errors (`handoff/logs/playwright.log`). Both procedure checks pass: all 17 services are identical.

**v41 retirement gate.** Gate 1 (P-01 to P-05 green) is done. Gates 2–5 need the owner's own phone:
- backup and restore;
- Print to PDF outside claude.ai;
- calendar file import;
- airplane-mode reload.
Gate 6 (archive v41) follows those.

## P-06 E+++ Coastal Precision and F-P06-01 · 25 Nov 2026 · build e6d038b7c7
Brief: "PropApp — P-06 E+++ Coastal Precision & Final Lock-In Brief (For Claude)" (owner's Drive, read only). It confirms gate 1 of the v41 retirement gate is met for build 246a96f3c1.

| ID | Status | What was done | Test |
|---|---|---|---|
| F-P06-01 | Done | One `copyText` helper (`src/clip.js`) behind all 6 Copy buttons. It tries the clipboard API first. If that's missing or refused (the app file opened from a phone's files), it uses a hidden text box and the older copy command, then removes the box. "Copied" shows either way. | theme (clipboard API removed; checks the copied text, the "Copied" message and that the box is removed) |
| P-06 | Done | E+++ tokens for light and night mode, exactly as specified, in one block at the end of `src/styles.css`. | theme |

**What P-06 changed on screen:**
1. **Header:** white, with the 3.5 px teal-to-ocean strip and a 22×22 "R." badge.
2. **Site switch:**
   - more than one pharmacy: an ocean pill on a soft track, with a 44 px tap area;
   - one pharmacy: no pill and no ▾. The name stays as plain text, and tapping it still opens Pharmacies (rule 2 keeps the pharmacy name in the header).
3. **Today:**
   - the date is a 600-weight editorial heading;
   - the Overdue and This week counts are tinted;
   - all numbers use tabular figures.
4. **Lists:**
   - 14 px cards with inset dividers;
   - a 3 px urgency rail only on overdue (#B81D3A) and due-soon (#A84B00) rows;
   - open items get status pills;
   - "Done" is quiet muted text.
5. **Type:** fonts in the order Public Sans, Inter, then the system font. Nothing heavier than 600.
6. **Bottom bar:**
   - icon strokes of 1.85;
   - a 22×2.5 gradient pill above the active tab;
   - all 5 tabs are at least 44 px.

**Two markup touches, both presentation only:**
- the site-switch markup (pill only when there are several pharmacies);
- Today's status line, where the " · " after the date was dropped now the date sits on its own line.
No data, storage keys, wording or workflow changed.

**Judgement calls:**
- Public Sans and Inter aren't bundled: the strict CSP allows no font downloads. Phones use their system font (San Francisco or Roboto) until a font file is embedded.
- Tabular figures are on dates, counts and year-plan cells, but not on review names: in the fallback font they spread the hyphens ("check - in").
- Hover tints now apply only on devices with a mouse. A tapped row on a phone no longer stays grey.

**Tests:** theme (new, 26 checks) covers:
- the tokens, strip, badge and font stack;
- the site switch with one pharmacy and with two;
- the date heading, tinted chips and tabular figures;
- the rails, the bottom bar and the weight limit;
- the Copy fallback;
- the year plan;
- 320×568 on all 5 tabs.
**Full run on build e6d038b7c7:** 11 suites, 178 checks, all pass with no console errors (`handoff/logs/playwright.log`). check-procgen-all: all 17 services identical.

**After this, gates 2–5 of the v41 retirement gate are the owner's checks on their own phone.**

Night mode was also looked at by eye. Screenshots for the brief: `01_today_390px.png`, `02_site_visit_evidence.png`, `03_year_plan_390px.png` and `04_actions_view.png`.

## Content v2 (part 1) and F-P06-02/03 · 25 Nov 2026 · build 1edd311f09
Brief: "PropApp — Content v2 Brief: NSW Prescribing, 2026 Law Updates & Clinical Upgrades (For Claude)" (owner's Drive, read only). It signs off P-06 and F-P06-01 on e6d038b7c7 and approves the four judgement calls.

**How the law content was checked.** CLAUDE.md says no obligation changes without the primary source. This session couldn't reach the official sites: the fetch tool and the permission check both blocked them. So every line added comes from the pages we read on 20–21 Nov 2026 (`uat/research/`). Anything only in Gemini's brief is held back, listed below.

| ID | Status | What was done | Test |
|---|---|---|---|
| F-P06-02 | Done | The copy box is off-screen (left −9999 px) at 16 px, not transparent or 1 px. It is editable while copying, then removed. | theme |
| F-P06-03 | Done | Night-mode tokens are asserted (--bg #0D151C, --surface #15202B, --primary #62B8F6, --on-primary #0D151C), plus a `05_today_dark_390px.png` screenshot. | theme |
| C2-01 | Done (verified links only) | Sources screen, rebuilt from v41 (it was missing in the rebuild, although the inventory ticked it): 20 sources, each with "Last read", where it's used here, "Open source ↗" (new tab, rel="noopener noreferrer"), and "This source changed", which raises one action due in 30 days. Added the NSW Health law overview, changes for pharmacists, the FAQ and the Intention form pages (all in the 20 Nov crawl). Incident cards already link their NSW Health pages. | content2 |
| C2-02 | Held | The My Health Record breach card. Not in our sources: Gemini's "Rule 21 replaces Rule 42", the 5-year retention, the 7-day production deadline, and the s 75 steps. Incident steps must be exact, so it waits for the pages to be read. | — |
| C2-03 | Already in | The A3 review already cites the Board guideline from 1 Oct 2026: resources and risk, people, learning from mistakes, privacy and patient choice. Cultural safety and the conflicts-of-interest interim guidance aren't in our notes, so they're held. | — |
| C2-04 | Done (verified rows) | "Law and practice updates" under More, plus a one-line "N law updates to read" on Today. Three entries: the NSW laws from 5 Nov 2026, the Board guideline from 1 Oct 2026, and prescribing authorities. Each has What changed, No longer required, where it shows in the app, and source links. "I've read this" is saved per pharmacy, survives a reload and is logged in History. Held rows: ADHA/My Health Record and the expanded-scope trial. | content2 |
| C2-05 | Done (corrected) | Gemini's Tier 2 doesn't match NSW Health. The extra 5 conditions (musculoskeletal pain, reflux, rhinitis, acne, nausea and vomiting) are for **Queensland-trained** pharmacists who have submitted the "Intention to provide expanded community pharmacy services" form. It isn't a Grad Cert tier, and OCP initiation isn't among them. Added as options marked "Queensland-trained pharmacists only". The readiness checklist gains: contraception limits (vaginal ring supply only; DMPA only with the PSA injection course and indemnity), Working with Children Check, the Intention form, and the Class Authority expiry (4 Nov 2027). The v41 items and options are unchanged, and all 17 drafts are still identical. Held: Tier 3 (the Sep 2026 trial) and OCP initiation. | content2, check-procgen-all |
| C2-06 | Already in | The cannabis review already covers independence, patient choice and conflicts (q1), and no stock of unregistered products unless the TGA approved it for a patient. "No approval number for compounded or psychostimulant S8" is in the updates feed. Held: Gemini's "clinical trial S8 still needs approval" (not in our notes) and a separate S8 spot-audit tool (the S8 review already covers register checks). | — |

**Not built, per the brief:** QSPP/8CPA accreditation, and Payday Super, payroll or HR.

**Owner decision respected:** "No longer need to record the GP when vaccinating" is in the NSW notes, but the owner decided to leave the vaccination "record the GP" wording as it is. So it isn't in the updates feed.

**Full run on build 1edd311f09:** 12 suites (adding theme and content2), 201 checks, all pass with no console errors. check-procgen-all: all 17 services identical.

## Content v2 (part 2) and V3-02 calendar file · 25 Nov 2026 · build 76de97c792
Gemini's feedback: "PropApp — v3 Roadmap & Architecture Brief" (owner's Drive, read only). Section 0 signs off part 1 on 1edd311f09 and agrees the Tier 2 correction.

| Item | Status | What was done |
|---|---|---|
| 5 · Clinical trial S8 | Done | The "no longer required" approval-number line adds: an unregistered S8 medicine in a clinical trial still needs NSW Health approval. It's a caution, from the NSW Health pharmacists FAQ as cited by the review. |
| 6 · TGA vapes | Done | Both TGA links are added to Sources. The vaping review already had all four checks, word for word from NSW Health's self-assessment (TGA notified list, the over-20 mg/mL prescription pathway, S3 18+ with a SAS C notification, adverse event reporting), so no wording changed. |
| 7 · eNRMC | Done | The Department of Health link is added to Sources (the 31 March 2027 date was already shown). |
| 1 · My Health Record card and update | Held | The review gives wording and links but no quotes. The claims are specific: "My Health Records Rules 2026", Rules 21/43/44/45, 5- and 2-year retention, and 7 days. Incident steps must be exact, so they wait until the pages can be read. |
| 2 · Cultural safety, conflicts of interest | Held | The Ahpra link given (`/sitecore/content/medical/…`) doesn't look like a real public page. It waits for the guidance's exact title and URL. |
| 3 · Ear, wound and chronic illness trial | Held | Gemini agrees: there are no protocols yet. |
| 4 · OCP initiation (JCU-trained) | Held | This page wasn't among the 174 NSW Health pages crawled on 20 Nov, and the "5,000 funded consultations" detail needs the page itself. |

**Honest labelling:** the three new links (2 TGA, 1 eNRMC) say "Link from the 25 Nov review, not yet checked" on Sources, not "Last read".

**V3-02, calendar file:**
- Every event now has a week-before and a day-before reminder.
- On phones that support it, the file opens the share sheet (on iPhone, tap Calendar).
- **Bug found by the new check:** a person with several items due the same day got events with the same UID, so a phone calendar kept only one. Each part now has its own UID.

**v3 items waiting for owner decisions:**
- **V3-01:** static hosting on GitHub Pages (deployment, and the D3 hosting decision).
- **V3-03:** the evidence pack (the inspector pack is deferred).
- **V3-04:** the multi-pharmacy summary (deferred).
- **V3-05:** clinical content; it needs the pages read first.

**Full run on build 76de97c792:** 12 suites, 202 checks, all pass with no console errors. check-procgen-all: all 17 services identical.

## Content v2 (part 3): held items, now primary-sourced · 25 Nov 2026 · build 5828ff53c0
**Owner, 25 Nov:**
- allowed web access;
- un-deferred the evidence pack and the multi-site view;
- asked for the installable app to be prepared but not deployed (CLAUDE.md updated).

The pages were read directly. Exact quotes are in `uat/research/content-v2-sources-2026-11-25.md`. tga.gov.au, health.gov.au and digitalhealth.gov.au fail through the egress proxy (502), and OAIC shows a bot check. The My Health Record law was read on the Federal Register of Legislation instead.

| Item | Status | What was done | Primary source |
|---|---|---|---|
| 1 · My Health Record | Done | A 4th incident card, "Privacy or My Health Record data breach": contain it; notify both the System Operator and the OAIC as soon as practicable; ask the System Operator to notify affected people; for the pharmacy's own records, assess within 30 days, then a statement to the Commissioner and notice to the people affected; note it in My log without names. A 4th update, "My Health Record: new security and access policy rules" (from 1 Oct 2026). **Correction to Gemini:** rule 45 keeps user-account and training records 5 years, and breach-process and security-measure records 2 years (Gemini grouped "access logs" with 2 years; the rule's example lists access logs without assigning them, so the app follows the rule's own grouping). | My Health Records Act 2012 s 75; My Health Records Rules 2026 rr 21, 43, 44, 45, 72; Privacy Act 1988 ss 26WH–26WL |
| 2 · Cultural safety, conflicts of interest | Done | 2 questions added at the end of the governance review (A3), so existing answers keep their places. 2 lines added to the Board update. **Correction:** the interim guidance is on ahpra.gov.au/Resources/Managing-financial-or-commercial-conflicts-of-interest, not Gemini's link. | Pharmacy Board newsletter, Oct 2026; Ahpra interim guidance page |
| 4 · OCP initiation | Done | A prescribing option, "Initiation of the oral contraceptive pill (JCU-trained pharmacists only)", plus a checklist item (JCU Grad Cert, Intention form, fee and private-cost disclosure) and a line in the prescribing update. The page is "current as at 24 Aug 2026" and cites the 2008 Regulation (cl 48B), so the update says to check the page for the current authority. | NSW Health OCP initiation page |
| 5 · Clinical trial S8 | Confirmed | The wording added in part 2 matches the FAQ word for word. | NSW Health pharmacists FAQ, 20 Nov 2026 |
| 3 · Trial | Still held | The release says eligible pharmacists "will be invited" and that safeguards "will be put in place". | Ministerial release, 10 Sep 2026 |
| 6, 7 · TGA, eNRMC links | Unchanged | Still marked "not yet checked": those sites can't be reached from here. | — |

**Full run on build 5828ff53c0:** 12 suites, 206 checks, all pass with no console errors. check-procgen-all: all 17 services identical.

## v3 batch: evidence pack, multi-site view, installable app (prepared) · 25 Nov 2026 · build 67c049eff2
From Gemini's "v3 Roadmap" brief, with the owner's decisions of 25 Nov: the evidence pack and multi-site view were un-deferred; the installable app is prepared but not deployed.

| ID | Status | What was done | Test |
|---|---|---|---|
| V3-03 | Done | **More → Evidence pack**, a de-identified 12-month summary that shows on screen what it prints. A header (pharmacy, proprietors, period, "no patient information", today's overdue count) and 7 sections: reviews/visits/meetings (with issue counts), S8 stock checks, open actions, closed actions (what was seen), staff (annual check due, next expiry, items to look at), legal obligations (where the evidence is kept, last seen), and procedures (version, adopted, last reviewed). "Print or save as PDF" prints on A4: white page and dark ink even from night mode, repeating table headers, rows that don't split, and all buttons and navigation hidden. Opening it changes nothing. | v3 (makes a real A4 PDF: `handoff/evidence-pack-example.pdf`) |
| V3-04 | Done (view only) | With 2 or more pharmacies: Today shows "N overdue across your M pharmacies · see all", and Pharmacies gains an "All pharmacies" row. The screen lists each pharmacy's overdue and this-week items, using the same counting function as its own Today (a new shared `inWeek` in summary.js; Today now uses it too). Tapping an item switches to that pharmacy and opens it. With one pharmacy nothing changes. **Not built:** Gemini's "copy templates to site 2" and cross-site staff records. They change the data model, and the brief asks for no data model changes in this layer; they need their own design. | v3 |
| V3-01 | Prepared, not deployed | `dist/pwa/`: index.html with a same-origin CSP (worker-src, connect-src and manifest-src 'self'), manifest.webmanifest (standalone, relative paths, #005792), sw.js, and the R. icons (180, 192, 512). The worker caches the app shell only (the page is network-first; icons are cache-first). It never touches IndexedDB or localStorage, and a new version deletes only old `propapp-shell-*` caches. After the first saved change it asks the browser to keep the records (`navigator.storage.persist`). In a browser tab only: a dismissible Today line, "Add R.Pharmacy to your Home Screen before you enter records", and a "This device" card in Backup and devices explaining how to install and that iPhone keeps Home Screen records separate from Safari (back up first, then restore there). The single-file app and the claude.ai page are unchanged. | pwa (local server: manifest, worker, offline reload with records, worker update keeps records) |
| V3-02 | Done earlier | Calendar file: a week-before and a day-before reminder, the share sheet where supported, and unique UIDs. | extras |
| V3-05 | Next | Clinical content (vaccination, OTP/LAIB, SafeScript, eNRMC). Every line will be checked against the pages first. | — |

**Example data note:** in the evidence pack, the S8 "Pharmacist" column for Wattle Grove shows "Office filing cabinet, drawer 1 (fictional)". The v41 example generator (`uat/demo`) put a location in the stock-check pharmacist field. The pack reads the right field. `uat/` stays untouched, so this wasn't changed.

**Full run on build 67c049eff2:** 14 suites (adding v3 and pwa), 230 checks, all pass with no console errors. check-procgen-all: all 17 services identical.

## Audit Wave 1 (Codex R01–R08) · 25 Nov 2026 · build c5cf5012fe
Brief: "PropApp — Audit Fixes (Wave 1 & Wave 2) + V3-05 Clinical Brief" (owner's Drive, read only). Findings come from Codex's read-only code audit and Gemini's visual and PDF audit. The brief asks for Wave 1 first, then commit, push and hand off.

| ID | Status | What was done | Test |
|---|---|---|---|
| R01 | Fixed | A restore is now checked in full before anything is written: id, name, records, actions, staff, procedures, history, services, each entry's shape, and the drafts. This applies to both PropApp and old R.Pharmacy backups. The receipt is built from the checked backup first. The pharmacy, drafts and directory are then queued together, so they're written in one storage transaction. A damaged file reads "This backup is damaged (…). Nothing was changed." | wave1 (a damaged copy with Wattle Grove's id is refused; after reload, everything is untouched) |
| R02 | Fixed | An "Incomplete" S8 check no longer asks for a stock-check date and never counts toward the 3-month deadline (`stockIncomplete`; `latestStockCheck` skips it). The finish screen says the deadline stays 3 months after the last completed check. A future stock-check date is refused. | wave1 |
| R05 | Fixed | The finish screen and the save used `new Date().setMonth` (local time). Both now use the one UTC calendar-month `addMonths`: 30 Nov 2026 → 28 Feb 2027; 30 Nov 2027 → 29 Feb 2028; 15 Jul → 15 Oct. | wave1 |
| R03 | Fixed | One shared rule (`src/issues.js`) for History, the CSV and the evidence pack. New answers save an explicit `isIssue` from the question's own definition: reviews, visits, annual checks, locum and leaving checks. Older answers are judged against their review's own questions. "Yes" is never an issue just by being "Yes". | wave1 (fridge records: "Yes" = 0 issues, "No" = 1, in both the pack and the CSV) |
| R04 | Fixed | The new and edit action forms say "No patient names. For example: 'Check fridge log' or 'Service fire extinguisher'." The calendar file shows actions as "PropApp action due · pharmacy", never their own words. The pack says "Designed for de-identified proprietor records: check your notes before sharing." | wave1 |
| R08 | Fixed | A conflict copy this window saw and dismissed isn't merged back when saving. One it never saw is still kept. | wave1 (dismiss → another save → reload → still gone) |
| R06 | Fixed | **Pharmacy saves:** if storage changed since this window last read or wrote it (another tab), the save now does a three-way merge (`merge3`): per field, and per record, action and staff member by id. It no longer overwrites. A message from another tab no longer replaces this window's unsaved change. **Header:** it shows the real state: "Saving…", "Saved" once the write has finished, or "Save failed · retrying", with a retry after 1, 2, 4… up to 30 seconds and a toast. | wave1 (two tabs add different actions; a stale write underneath is merged; Saving… → Saved) |

**A bug the new test found:** the S8 finish screen never redrew when the stock-check date changed, because the handler checked the form's name instead of the field's. So the "latest date" line and the "still needed" note went stale. Fixed.

**Remaining:** Wave 2 (R07, R09–R12, F-V3-01 to F-V3-06) and Wave 3 (marking the TGA and eNRMC links checked, and the V3-05 clinical content) are not started.

**Full run on build c5cf5012fe:** 15 suites (adding wave1), 250 checks, all pass with no console errors. check-procgen-all: all 17 services identical. Wave 1 code is in commit 43e824c on Mohaco1/PropApp main. **Next session:** start at Wave 2 (R07 first) from that commit.

## Audit Wave 2 · 25 Nov 2026 · build a687563fdd · commits 592c9b1, 5c593d7
| ID | Status | What was done | Test |
|---|---|---|---|
| R07 | Fixed | With 2 or more pharmacies, New action, the action screen and review screens show the pharmacy's name under the title (plain text, not a switch). | wave2 |
| R09 | Fixed | Review notes and issue text are saved as they're typed (\`inputs\`), without redrawing the screen. Opening a screen moves focus to its heading. Back returns focus to the row you came from. That row is remembered from the tap, because iPhone Safari doesn't focus tapped buttons. | wave2 (typed text survives a reload; Back focuses the row) |
| R10 | Fixed | Calendar file lines are folded at 75 bytes (UTF-8, never splitting a character), and the file ends with CRLF. An open action's UID is now its id, not its date, so a new due date moves the event instead of duplicating it. | wave2, extras |
| R11, F-V3-05 | Fixed | The worker refreshes the cached app page only from a good response (\`res.ok\`), only for the app page itself, and inside \`e.waitUntil\`. | pwa |
| R12 | Fixed | The UAT notes button is now a 44 px "UAT" button in each screen's header bar. With no header (Welcome) it sits top right. Nothing floats over rows. The extra bottom padding and toast offset it needed are gone. | wave2 |
| F-V3-01 | Fixed | Incident links use rel="noopener noreferrer". | wave2 |
| F-V3-02 | Fixed | "By" on closed actions comes from the close itself, or from the action's log for older records. The column is left out if no row has a value. | wave2 |
| F-V3-03 | Fixed | Routine staff-check actions are one line per person under "Staff checks closed". "Actions closed" now shows the real fixes. | wave2 |
| F-V3-04 | Fixed | The pack's period and made-on dates carry the year. It gains a framing line ("Proprietor oversight record only: statutory S8 registers, dispensing records and cold-chain logs stay in their primary pharmacy systems.") and "law and practice updates read: N of 4". | wave2 |
| F-V3-06 | Fixed | The manifest lists the icons as "any" and "maskable" (the icon is full-bleed), and the page has the Apple status-bar meta. | pwa |

**Remaining:** Wave 3, which marks the TGA and eNRMC links as checked from Gemini's quotes, and builds the V3-05 clinical content (each line read against its page first).

**Full run on build a687563fdd:** 16 suites (adding wave2), 265 checks, all pass with no console errors. check-procgen-all: all 17 services identical. **Next session:** Wave 3, from the latest commit on main.

## Consolidated brief, Sections 1–3 · 25 Nov 2026 · build a6c2a18fad
Brief: "PropApp — Consolidated 1:51 PM Resume Brief" (owner's Drive, read only). It combines Codex's and Gemini's live walkthroughs with the owner's Section 2 decisions. Section 1 is commit b38327c; Section 2 and the gates are the next commit.

| Item | Status | What was done | Test (gates.js unless noted) |
|---|---|---|---|
| Bug 1 (Codex #01, F-W1-01, F-W1-02) | Fixed | Each save now reads, merges and writes inside **one** IndexedDB read-write transaction. Browsers run those one at a time across tabs, so two tabs can't both read the old copy. A confirmed restore uses a new replace path (`savePharmacy(ph, { replace: true })`, and the same for drafts), so nothing from another tab is blended in. Storage-full stops retrying after 5 attempts and shows "Storage full · back up now" with a toast. Saves within one window are queued in order. | two tabs save at the same moment → both actions in both tabs; a restore after another tab's edit replaces cleanly |
| Bug 2 (Codex #03) | Fixed | The toast reads "Backup download requested"; the screens read "Last requested 25 Nov" and "N changes since last request". A note says the browser can't confirm the file was saved, and the preview notice is reconciled. **Found by the gate:** the date showed the UTC day (24 Nov) in Sydney's morning. See the date fix below. | toast and wording |
| Bug 3 (Codex #02, #04, #05) | Fixed | The pack's S8 section shows every entry with an Outcome column (Completed stocktake / Incomplete review), headed e.g. "S8 stock checks · 4 completed stocktakes · 1 incomplete review". The S8 detail shows "Last proprietor review" (marking an incomplete stock check) and "Last completed stocktake" separately. The pack reads next-due dates from the record itself as well as its fields, so a site visit's date appears. | pack split and labels; detail lines; visit next due matches; also in the A4 PDF |
| Bug 4 (F-LIVE-01) | Fixed | An active tile with no tint of its own (Waiting, All) no longer picks up the old solid ocean fill under dark text. It uses the soft tint with ocean text. | 0-overdue pharmacy, active All tile: light 14.9:1 / 6.6:1, dark 12.1:1 / 6.3:1 |
| Bug 5 (F-LIVE-06) | Fixed | "Filled in from your last meeting" shows only when an attendee still on staff or some discussion text really carried over. | no banner when nothing carried over; banner when notes carried over |
| F-LIVE-05 | Fixed | "This source changed" raises "Re-check after a change to …" with a short title. The places to re-check are listed on the action ("What to look at again"). Titles in lists and search are clamped to 3 lines. | |
| F-LIVE-08 | Fixed | An adopted version shows "Adopted procedure (version 1.0, adopted 25 Nov), prepared from …" instead of "Draft generated from …". This changes the display only; the stored text is untouched. | |
| Codex #07 | Fixed | "No patient names or identifiers." sits beside the incidents and patient-safety box of every meeting (once, per "say it once"). | |
| Codex #08 | Fixed | A started review with no due date shows "In progress", not "Started · No date". | |
| F-LIVE-09 | Fixed | The year plan legend shows a red dot for overdue and a blue one for due, and the last month column has right padding. | |
| F-LIVE-10 | Fixed | (a) "R.Pharmacy backup" everywhere; (b) an empty "What the section says about who" is hidden; (c) "Got it · close it"; (d) arriving at "Who runs your services" from a service shows "Asked once for all your services. Then you'll carry on with …". | |
| F-LIVE-07 (owner approved) | Built | Pharmacies → "Archive or delete a pharmacy". **Archive:** any pharmacy except the open one; it leaves switching, All pharmacies and counts, keeps every record, and can be unarchived from Pharmacies. **Delete:** only test or fictional pharmacies (name has "(fictional)", "test" or "UAT"), or ones with no records, actions or staff. It asks for a second tap and offers "Download its backup" first, then `store.removePharmacy`. | archive, unarchive, delete |
| Demo seed (owner approved) | Fixed | Wattle Grove's three S8 pharmacist entries read "Priya Sharma (fictional)". The generator's fallback text also filled the A3 continuity exercise scenario and outcome with a cupboard, so those now hold fictional drill text. `uat/demo/make-demo.js` gains label rules so a regenerated example matches. The other 9 "Office filing cabinet" entries are genuine "where it's kept" answers. | pack shows Priya Sharma |
| Codex #06 | Fixed | The contraception item (vaginal ring and DMPA), the OCP initiation item and the Queensland Intention-form item show only for their pathway. The remaining items are conditions common to every Class Authority, per our 20 Nov notes ("Owner-level conditions common to all authorities"; WWCC from the p108 "ALL services" list). | content2: UTI only → those 3 hidden, shared items stay |
| PWA | Undeployed | `dist/pwa` stays local only. | pwa |

**Date bug class (found by the Bug 2 gate):** timestamps are saved in UTC. Slicing the first 10 characters shows yesterday in Sydney until 10 or 11 am. A new `day()` helper in `src/dates.js` gives the local day and replaces every such slice: backup dates, adopted procedure dates, history timeline, CSV print date, conflict-copy dates, and procedure review due dates.

**Section 3 gates (gates.js):**
1. A damaged backup is refused and everything is intact after reload; an export → restore round trip gives the same records, actions and staff.
2. Fridge records: "Yes" = 0 issues and "No" = 1, in the pack and the CSV (wave1).
3. `evidence-pack-example.pdf` is regenerated and checked as text: the S8 split header and labels, the visit next due, "Staff checks closed", "made 25 Nov 2026".
4. Dark sweep: Today (0 overdue), Reviews and More have no text below AA, and the 0-overdue All tile passes in both modes. Screenshots: `05_today_dark_390px.png`, `13_today_zero_overdue_390px.png`.

**Full run on build a6c2a18fad (commit 9159fcf):** 17 suites (adding gates), 301 checks, all pass with no console errors. check-procgen-all: all 17 services identical. Sections 1–3 were committed and pushed before Section 4 started, as the brief asks.

## Consolidated brief, Section 4 (Wave 3 / V3-05) · 25 Nov 2026 · build 1cb60e8784
Each line was read on its primary page today. Quotes are in `uat/research/content-v2-sources-2026-11-25.md`. tga.gov.au and health.gov.au still can't be reached from this session.

| Item | Status | What was done |
|---|---|---|
| 4A TGA vapes x2, eNRMC | Labelled honestly | Sources says "Quoted by the 25 Nov independent review (this site blocks automated reading here)". The review's quotes are saved in research. The app's vaping and eNRMC obligations already rest on NSW Health pages that were read: the vaping self-assessment, and the RCF page (31 March 2027). |
| B1 Vaccination: fridge, logger, anaphylaxis | Refined | The vaccination readiness question now says "continuous temperature data logger set to alarm outside +2°C to +8°C" and "twice-daily temperature recording" (Vaccination Standards I; NSW cold chain page). The anaphylaxis kit was already a question. |
| B2 Self-audit, PHU breach, "Do not use" | Already in | Already in the readiness, storage and service reviews, and in the procedure (1300 066 055, quarantine at +2 to +8 °C, labelled "Do not use"). |
| B3 Cold-chain module | **Corrected** | The old question said "every staff member handling vaccine storage has completed" the module. NSW Health requires **at least two staff who manage vaccines**, and only recommends it for everyone. The wording now says exactly that. |
| B4, B5, B6 OTP and LAIB | Already in | The OTP procedure and the amenity review already cover: the amenity plan and signed staffing declaration at 80 or more patients, the nominated dosing point, repeats, directions straight from the prescriber, and LAIB training and room (checked against the OTP Standards PDF). |
| B7 SafeScript | Added | A governance question (A3, #12): own logins with multi-factor authentication, no shared logins, penalties for unauthorised access, use or disclosure, and overseas logins blocked. The NSW laws update gains "Pharmacists can now see NSW Health medicine approvals in SafeScript NSW…". |
| B8 eNRMC | Already in | The aged care review already asks about electronic charts being conformant after 31 March 2027, and NSW Health dates shows the date. |
| F-LIVE-11 | Done | The procedures no longer say "per your research" or "per your plan". The one claim that could be checked (no advertising of medicinal cannabis) now cites "NSW Health, Cannabis medicines FAQ". The rest keep "— verify", so adoption still waits for the owner, but with honest wording: "source to confirm with NSW Health or the TGA" and "Strive for 5 / NSW Health — check against the current edition". The procedures' own "to confirm" list follows the new wording. Drafts stored from the old app keep their text until the owner taps "Update the draft". |
| New sources | Added | NSW Pharmacist Vaccination Standards, NSW cold chain management, and SafeScript NSW privacy and security. |

**Tests:** wave3 (new), check-procgen and check-procgen-all (all 17 identical apart from the intended wording, which the checks now expect).

**Full run on build 1cb60e8784:** 18 suites (adding wave3), 311 checks, all pass with no console errors. content2 was re-run after its expected question count went from 11 to 12 (SafeScript added). check-procgen and check-procgen-all: all 17 identical. dist/pwa stays undeployed.

## Locked pre-trial brief, Tracks A–E · 25 Nov 2026 · build 79d8e858d3
From Gemini's "Locked Pre-Trial Brief & Claude Prompts" and the "Final Pre-Beta Polish & UX Brief". Track A and B3–B6 were committed first, in 6ca162a.

**A1 Backup**
- A nudge on Today after 7 days and 10 changes. It can be snoozed.
- Backups go to the phone's share sheet where it can.
- Storage-keep status is shown in Backup and devices on every build.
- After a restore, every count (drafts and staff checks included) is checked against the file.

**A2 Today and More**
- Today has one notice slot. Law updates are a "N new" badge on More.
- More has sections Plan, Rules, Proof and Pharmacy, with "Law and sources" (updates and sources) folded into one entry.
- "No date" reviews stay where they were (owner override).
- `tests/pretrial.js` fails if the first action on any primary screen isn't fully visible at 390 × 844. It checks 14 screens.

**B1 and E1 Evidence pack**
- A period choice: 12 months (the default), 24 months or All.
- Six section checkboxes above Print, on by default only where something is recorded.
- Incomplete S8 reviews say "(incomplete)" in the Reviews table.
- Unrecorded obligations collapse to one footer line.

**B2 Calendar**
- The setup card offers "Add due dates to your phone calendar", with "Not now".
- The .ics has the prescribing (4 Nov 2027) and vaccination (4 Nov 2028) authority expiries, for pharmacies with those services, with reminders 30 days and 7 days before.

**B3–B6**
- The "no date" line is hidden under All. A cold-start hint shows when there are no records.
- The item in the top sentence is tappable. An extra visit is one line while a legal item is overdue.
- Clean answers move to the next question by themselves; Issue and Incomplete pause.
- C-01: the pharmacy directory is merged inside the save transaction.
- C-02: title clamps apply in Search only; toasts are single-line.
- C-08: no duplicated date; "1 action".
- C-09: the lead question comes first.

**B7 Procedures: no "— verify" left in any of the 17 drafts**
- Each step was checked and re-cited (NSW Health cold-chain page, NSW Pharmacist Vaccination Standards, NSW Health NSP outlets, Fair Work Act s 97).
- Where no reachable source states it, the step is labelled "(your pharmacy's practice)" and no longer claims a source.
- The list is `src/content/verified-steps.json`. It applies to both apps in `check-procgen.js` and `check-procgen-all.js`, and all 17 drafts are still identical.
- "[Confirm: …]" items that come from the owner's own answers still block Adopt, by design.

**Track C (best practice, no legal claim)**
- An equipment calibration block in the visit's premises check, with the OTP pump line only when OTP is offered.
- Expiry rotation on the recalls check.
- An IT backup restore test in the governance review.
- Shared safe, alarm and door codes in Staff leaving.
- A de-identified complaints and feedback themes section in the quarterly governance meeting.

**E2 and E3**
- The S8 review asks for a wholesaler invoice spot-check (Pharmacy Council S8 resources, a recommendation) and whether destruction was witnessed and recorded (NSW Health).
- Evidence locations has PBS (2 years, Regulations s 59) and PPA (7 years, DAA Program Rules s 9) archive pointers, which also appear in the pack.

**Track D (verified items only)**
- Built:
  - the Pharmacy Council's 14-day Notice of Completion and Notice of Disposal, plus a note that agreements are lodged;
  - an Ahpra mandatory notifications card listing the four concerns;
  - in the data breach card, that the small-business exemption doesn't apply (s 6D(4)(b));
  - workers compensation (icare: wages declared at renewal) in the governance review.
- Not built, because they can't be verified from here (details in `uat/research/pretrial-b7-sources-2026-11-25.md`):
  - PBS approval, PRODA, HPI-O and NASH expiries: health.gov.au and servicesaustralia.gov.au can't be reached;
  - the unlawful financial interest case: only secondary sources;
  - the SafeWork sharps line: not found on the page.

**Tests**
- New suite `tests/pretrial.js`, plus updated counts: governance has 14 questions, the S8 review 9, and there are 5 incident cards.

## Final micro-patch (on 79d8e858d3) · 25 Nov 2026 · build 153a40378e
**1. Align to 4 quarters (Calendar › Year plan)**
- One button moves upcoming due dates to the first Monday of Feb, May, Aug or Nov:
  - S8, site visit and governance meeting every quarter;
  - staff annual checks in Feb;
  - the governance review in May;
  - service annual reviews in Aug.
- The S8 review (B1) is never moved past its s 111 limit; if the next anchor is later, it stays where it is.
- It never touches:
  - overdue or undated items;
  - premises renewal and the financial-interest declaration;
  - monthly or six-monthly reviews;
  - procedure reviews.
- It's logged in History and can be undone with one tap. The previous dates are kept in `flags.alignUndo`.
- Nov has no item of its own, because there's no equipment or year-ahead review to move.

**2. Three Track D lines**
- **PBS approval and PRODA/HPOS/HPI-O on takeover:** owner-supplied source, which couldn't be read from here.
- **Unlawful financial interest (Blooms [2025] NSWSC 1211):** via the King & Wood Mallesons summary.
- **NASH and PRODA B2B expiry:** governance review question 15.
- **SafeWork UN3291 clinical waste and sharps bins:** added to the site visit block "Equipment and clinical waste". Verified.

**Tests:** `tests/pretrial.js` checks the alignment (the B1 limit with a stock check on 20 Oct, dates landing on anchors, overdue dates left alone, Undo) and the new lines. The governance review now has 15 questions.

## Sigil brief (rebrand, Quarter Balancer, ease of use) · 25 Nov 2026 · build b6ec378b23
**Rebrand**
- R.Pharmacy/PropApp is now **Sigil**: the S. badge and icons, the title, the installable-app name, Welcome with the tagline "Built for the owner's side of the counter.", the pack footer, calendar labels and the restore wording.
- Storage keys (`propapp:*`) and the backup marker (`app: 'PropApp', format 1`, now with `product: 'Sigil'`) are unchanged, so every earlier backup and saved pharmacy still opens.

**Quarter Balancer (Calendar › Year plan)**
- Service annual reviews are spread evenly over Feb, May, Aug and Nov: 12 services gives 3·3·3·3.
- Seasonal defaults: PPA supply programs in May; NSP, vaping and cannabis in Nov. Vaccination and prescribing reviews are quarterly, so they aren't moved.
- Each quarter shows its load count. You move a service by tapping it and picking a quarter from a 1-tap bar, or by dragging it on a desktop. Moves are saved and logged.
- "Align" uses these quarters. S8, the site visit and the governance meeting stay in every quarter, and S8 still never goes past s 111.

**Ease of use**
1. **Copy setup from another pharmacy** (on setup's Services step): copies services, setup answers and the quarter rhythm. Procedures come across as drafts for you to adopt here, never adopted for you. Records, staff, actions and S8 dates start empty.
2. **"Copy summary for the pharmacist on duty"** on Actions and on the finished site visit. It's de-identified and ends with the no-patient-names reminder. The label says "pharmacist on duty", not "PIC" (design rule 6).
3. **"+3 days"** on Today, only on overdue or due-today rows that aren't required by law. Never on S8; `deferItem` also refuses anything past the S8 limit. A deferred action's log says so.
4. **Evidence pack › "Show on screen (read-only)"**: the Inspector view, with no edit controls or tab bar.
5. **Last time**:
   - Review questions show last time's answer and note, with nothing selected, plus a one-tap "Use last time's note".
   - Evidence locations show "Last saved".
   - Nothing is completed or saved for you.

**Tests:** new suite `tests/sigil.js` (rebrand, backup compatibility, balancer spread, tap and drag moves, clone, copy summaries, defer and the S8 guard, Inspector view, last time).

## Owner trial fix · 26 Nov 2026 · build 8131823503
- **Ticks that wouldn't stay ticked:** setup options whose name contains a comma (e.g. "Creams, ointments and gels", the "stuck" checkboxes in the trial notes) were read back split in two, so their tick vanished. They're now matched against the whole stored answer. Regression test added in `tests/sigil.js` (real touch taps).
- **Rebrand leftover:** "R.Pharmacy" in setup and procedure text is now "Sigil". The parity checks apply the same change to the old app's text, and all 17 drafts are still identical.
- The phone app files in `docs/` are refreshed.

## Trial batch 1 (Gemini brief on 8131823503) · 26 Nov 2026 · build 07775c5947
**Real bug behind the "stuck" questions**
- "Software" questions (Staged supply Q2, Vaccination Q3, OTP dose and file software) were drawn as a text box but saved as if they had options, so the typed name was lost and Next stayed put.
- A typed box also redrew the screen as it lost focus, which swallowed the tap on Next.
- Now typed answers save without a redraw, Next saves what's in the box first, and one tap moves on. Touch-tap regression test in `tests/batch1.js`.

**Ease of use**
- Places & systems chips under every software or "where exactly" box, from what's already typed for this pharmacy. A tap fills the box and saves it; nothing fills itself.
- A visible Move button on each Quarter Balancer service.
- Procedures shown as tappable sections (first open, "Open all sections"), with "to confirm" items at the top. The wording is unchanged.
- "Answer as a list" for reviews: one tap per question, nothing pre-answered, and an issue goes to that question's step view.
- "Legal items first · do the rest later" on the setup card.
- A one-line subtitle on Reviews and Calendar.

**Wording**
- "Why we ask" lines on OTP special conditions (reworded), dose and file software, the day-to-day lead, and OTP file reviews.
- "What this is" for medicine adherence support.
- Governance Q1 and Q4 rewritten as concrete checks.

**Content**
- Queensland-pathway prescribing conditions are hidden unless a pharmacist holds that training.
- OTP file reviews list Quarterly first as the suggestion; nothing is pre-selected.
- CBD scheduling corrected: Category 1 is S4; others are S8; plus the S3 note.
- PRODA reactivation wording.

Several sources were supplied by Gemini and not read by Claude (see `uat/research/pretrial-b7-sources-2026-11-25.md`).

**Logo:** the S-loop (deep teal on off-white) in the header, on Welcome, on the evidence pack and as the phone icons.

## Chaos test fixes (Codex: 108 randomised phone sessions on 07775c5947) · 26 Nov 2026 · build 9344592463
1. **Instant reload after Next lost the typed answer and step:** every pharmacy and draft change is now also journalled synchronously to localStorage until the IndexedDB save completes, and startup replays any leftover. Next also saves straight away.
2. **Queensland gate:** switching to No removes any Queensland-only conditions already ticked.
3. **Spaces-only owner (or pharmacy) name:** refused with a message (it used to crash Finish setup).
4. **"Other (describe)" text with commas:** read back whole, not cut at the first comma.
5. **Today across midnight:** redraws on the new day (checked every 30 s and on return to the app; only while Today is showing).
6. **Toasts:** `pointer-events: none`, so they never swallow a tap.
7. **Staff form:** a failed Save keeps everything typed.
8. **Spaces-only staff name:** refused.
9. **650 unbroken characters:** wrap; the staff and action pages stay 390 px wide.
10. **Rapid double tap on Next:** moves one question. The second tap within 400 ms is ignored only if nothing was answered in between.

**Tests:** new suite `tests/chaos.js` (one check per fix, touch taps at 390 × 844). All 22 suites pass, and check-procgen-all is identical across 17.

## Final pre-trial hardening (Gemini/Codex brief on 9344592463) · 26 Nov 2026 · build d226200c70
Fixed:
- **Previous straight after Next:** the double-tap guard now applies only to forward moves; Previous always works on the first tap.
- **No record resurrection after a restore (two tabs):** a restore stamps the pharmacy. Any other tab's save, or leftover recovery copy, that was based on data read before the restore is dropped, so the restore always wins.
- **Recovery copies redesigned:** they're written only when a page is hidden or closed, per tab, including saves still in progress. They carry their base copy, and two tabs' leftovers merge on the next load.
  - The first design (a copy on every change) made the two-tab restore check in `gates.js` fail 2 times in 3. That was the flake the brief noticed. With the redesign it passes every time (3 of 3, then the full run).
- **Final buttons:** a second tap on the same final button (Save review, Save visit, Save action, Close action) within 0.8 s is ignored, unless a validation message is showing so the owner can correct and retry.
- **Cold start:** Today says "No overdue items with known dates." with "Add your last S8 stocktake date" when there's no S8 date.

Checked and already passing:
- **Item 4:** switching pharmacy mid-form never carries a note across, and the draft resumes under the right pharmacy.
- **Item 5:** the S8 deadline, S8 at a glance, the calendar file and the evidence pack all use the completed stocktake. The incomplete review stays visible, a future stocktake date isn't saved, and S8 can't be deferred.
- **Item 6:** a corrected answer after Previous survives a reload; a cleared software name stays clear.
- **Item 7:** upgrading from 07775c5947 with an open action and a half-finished visit, then reopening offline: new build, records intact, visit resumes at the same check.

**Earlier flakiness:**
- The S8 future-date and two-tab restore runs used fixed short waits under load.
- The S8 loop in `hardening.js` now waits for each question to change.
- `hardening.js` crashed once in 9 early runs without a log; it then passed 5 of 5 with logs.

**Tests:** new suites `tests/hardening.js` and `tests/upgrade.js`. All 24 suites passed in one run on this build, and check-procgen-all is identical across 17.
