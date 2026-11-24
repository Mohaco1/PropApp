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

**v41 retirement gate.** Gate 1 (P-01 to P-05 green) is done. Gates 2–5 need the owner's own phone:
- backup and restore;
- Print to PDF outside claude.ai;
- calendar file import;
- airplane-mode reload.
Gate 6 (archive v41) follows those.
