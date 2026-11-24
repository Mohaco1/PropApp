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
