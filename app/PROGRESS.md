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
