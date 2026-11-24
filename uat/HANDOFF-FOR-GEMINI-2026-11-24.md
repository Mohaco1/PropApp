# R.Pharmacy: handoff for Gemini (24 Nov 2026)

You are picking up a working UAT build of a phone-first web app for the **proprietor (owner) of an NSW community pharmacy**. This brief stands on its own. A longer technical brief is in `HANDOFF-FOR-AI-2026-11-24.md`, and every version is logged in `UAT-PROGRESS.md`.

## 1. What the product is, in the owner's words
- "An app where a proprietor can do all their legal and best practice obligations, but super mobile friendly, good UI/UX and not a barrage of information."
- **A helper, not a policeman.** No risk ratings, no blame, no "who is responsible" questions.
- **Proprietor only.** No staff logins. All responsibilities sit with the proprietor.
- **The pharmacist in charge is not a role the app tracks.** It changes day to day (for example, A on Mon–Wed, B on Thu–Sat, the Sunday pharmacist on Sunday). Procedures say "the pharmacist on duty".
- **Not** a QSPP accreditation app, a drug register, a clinical record, or a store of patient data.

## 2. Rules you must keep (owner's standing instructions)
- Never automatically approve procedures, complete reviews, close actions or fabricate compliance. The owner closes things themselves.
- Never remove existing functionality. Never change a compliance obligation without checking the source.
- Fictional data only. Never copy real pharmacy names, contacts or staff. Collect no identifiable patient data.
- Don't modify the owner's Google Drive files without explicit permission.
- Don't overwrite or delete the design studio, past designs or past feedback (`../design-studio`).
- Don't deploy to production. Don't overwrite real user data. Don't run destructive migrations. Stop and ask before anything irreversible.
- Don't claim something works unless you have tested it.
- Keep it simple ("don't complicate it").
- Don't reverse an owner decision without asking. See §7.

## 3. Where things are
| Path | What |
|---|---|
| `dev/proprietor-hub.html` (one level up, in `../dev/`) | The original engine (v27). **Never edit it.** |
| `layers/*.js` | All UAT behaviour. Each layer wraps or reassigns global functions in the engine. |
| `build-uat.js` | Joins engine + layers into `app/rpharmacy-uat-testing.html` and prints the build id and SHA-256. |
| `app/rpharmacy-uat-testing.html` | The single-file app the owner tests (about 1.9 MB). |
| `tests/*.js` | Playwright suites. Run one with `node tests/<name>.js`. `tests/lib-setup.js` does a real pharmacy setup. |
| `demo/` | The example pharmacy generator and its output (§5). |
| `uat-notes-archive/` | Copies of the owner's UAT notes. The live copies are on the UAT page (§4). |
| `research/`, `NSW-HEALTH-GAP-ANALYSIS.md` | Sources (NSW Regulation 2026, NSW Health, Pharmacy Council, Pharmacy Board). |

**Layer order:** conceptD-ui-layer, conceptD-frontend (CSS + JS), s8-rule, express, review-finish, setup-questions, procedures, service-done, otp-parts, tidy, backup-fix, confirm-fallback, inspection, nsw-health, helpers, today-guide, words, codex-fixes, visit, waiting, change, retest-fixes, onboard, calm, integrity, uat-tools, **example-site (new)**.

**Build and check:**
```
cd uat && node build-uat.js
node tests/example-site.js
```
Every suite in `tests/` except the known-stale `uat-functional.js` is expected to pass.

**Technical traps:**
- **Namespace clashes.** `RPH.bk` belongs to backup-fix and `RPH.rf` to review-finish. Grep before you name any new `RPH.*`.
- **Click handlers.** `CD.act` is cleared on every repaint, so register handlers with `CD.a(fn)` inside templates.
- **Creating tasks.** Use `taskNew(n,id,{text,owner,due},source)`.
- **Backups are strict.** `validateBackup` rejects unknown shapes.
- **Drafts.** The integrity guard only counts trusted events (real clicks or key presses) as owner edits. In tests, use `p.fill`, clicks or `keyboard.press`, not dispatched events.
- **Storage.** It's in the browser: a localStorage proxy backed by IndexedDB. Each pharmacy has its own slot, listed in `r-pharmacy-sites-v1`. Drafts are stored under `<slot>-draft-<id>`.
- **The `#service-assurance` box.** `commit()` attaches the evidence from any `#service-assurance` box left in the dialog to the next Q1 or OTP review. If you save a review from a script, clear `#editor` first (the real screens always replace it).

## 4. Live UAT
- **Link:** https://claude.ai/artifact/Vnn6KXsNkkEe7Ywc3DbnWN. Records are stored in the owner's browser on that device.
- **UAT notes:** the "UAT notes" button saves to the page's shared store, in the collections `uatnotes` and `uatquestions`. The build id shows at the top of that panel.
- **Downloads:** backup and CSV downloads don't work inside the claude.ai viewer. Use a local copy of the HTML file for those.

### Current owner notes (walkthrough, 24 Nov): captured, NOT yet actioned
The owner asked for these to be summarised only; fixes come later. All 7 are Open.
1. **Welcome screen:**
   - too information-heavy;
   - wants a wordmark, one line, and one "Set up your pharmacy" button;
   - detail moves into the steps;
   - a logo is worth exploring.
2. **Setup progress:**
   - "Step 4 of 4 · Service 1 of 17 · Question 1 of 12" is confusing;
   - suggestion: a separate service checklist after core setup (To do / In progress / Complete, and pick up where you left off), with each service showing only its own progress.
3. **"Where is this kept?" (3 overlapping notes, DAA questions 7 and 9):**
   - ask the filing location inline when a record is "kept on file" (consent forms, packing records, collection/delivery logs);
   - keep the multi-select checkboxes (Electronic / Paper / Both / Other) plus an optional folder or system name, and reuse it if already entered;
   - use it in the drafted procedure;
   - if collection and delivery both apply, ask whether they use the same location.
4. **Grammar (2 notes):**
   - DAA question 13 title "External packer · new rules from 5 Nov 2026";
   - question 14 title (likely "DAA labels and records · new rules from 5 Nov 2026").
   - The exact fix wanted **still needs the owner's confirmation**. Note that the app has two wordings for these titles ("new rules from 5 Nov 2026" and "rules from 5 November 2026").

**Gaps in the notes:**
- Three notes were cut off at the 600-character limit of the setup-screen note box, so their endings are missing.
- The one question mark (`daa/deliveryEvidence`, "Where are pack collection or delivery records kept?") has no choice selected.

## 5. Example pharmacy: Wattle Grove Pharmacy (fictional)
- **How to open it:** UAT notes → "Example pharmacy" → **Open the example pharmacy**. It opens as a separate pharmacy; the owner's own pharmacy and notes are not touched. The same place offers **Back to my pharmacy**, and the header pharmacy switcher also works.
- **Details:** 48 Wattle Grove Road, Fictional Heights NSW 2999. Proprietor Jordan Avery. Services: DAA, staged supply, OTP, vaccination, home delivery.
- **How the data is made:**
  - `demo/build-demo.js` runs the real app in Playwright with the clock stepped through a year. It uses the app's own screens or the functions those screens call (setup, reviews, staff profiles and annual checks, the site visit save, actions, Waiting on someone).
  - Output: `demo/wattle-grove.json`, a validated backup, which `build-uat.js` embeds as `window.RPH_EXAMPLE`.
  - `layers/example-site.js` moves every yyyy-mm-dd date by (today − generated date), writes a new slot plus drafts, and switches to it.
- **What it contains:**
  - **Reviews:** 34 over the year, including:
    - OTP monthly check-ins (one recorded 4 days after it was done);
    - OTP six-monthly reviews (one with an issue, resolved), plus one six-monthly saved part-way;
    - an early S8 review and a late home delivery review;
    - three quarterly site visits: one satisfactory, one with a premises issue later closed, and one with a fridge-log issue still open;
    - an extra visit in progress.
  - **Staff:** 4 people:
    - Ahpra registrations expire about 6 days from today;
    - Tom's immuniser item expires in about 19 days and his annual check is due in about 9;
    - recent starter Ben Carter, whose 4 checks are open.
  - **Actions:** a manual action with Waiting on someone.
  - **Procedures:** 4 drafts (DAA, OTP, vaccination, staged supply). The DAA draft carries a "[Confirm: where pack collection or delivery records are kept]" marker, and that setup answer is marked "to verify".
- **To regenerate:** `node demo/build-demo.js` (takes a few minutes), then `node build-uat.js`.
- **Test:** `tests/example-site.js` (22 checks). It covers:
  - the example opens as a separate pharmacy;
  - dates move;
  - it passes the backup check;
  - Today, Actions, Calendar, History and the CSV export all show its records;
  - back to the owner's pharmacy with its storage byte-for-byte unchanged;
  - UAT notes unchanged;
  - reopening doesn't duplicate it.

### What the example couldn't show (by design of the current build)
- Separate DAA, vaccination and staged supply service reviews are "preview only" in a new pharmacy; their oversight happens inside the site visit. No standalone records exist for them.
- Home delivery has no one-tap procedure draft; it uses the template library.
- The "saved" times inside records follow the clock used when generating. Words in free text keep their wording; only yyyy-mm-dd dates in them move.

### Observations found while building it (product, not fixed: owner said fixes later)
- **Staff actions stay open after verification.** Verifying a check as Verified at an annual check doesn't close the matching "Review … · person" action, so the owner closes each one by hand. The generator did this for the first three staff.
- **Procedure dates missing the year.** The Policies list shows "Draft · updated 27 Nov" for a draft from last year.
- **Vaccination credential warning doesn't clear.** "Vaccination active · no staff with relevant credentials recorded" stays in "to verify" after a pharmacist with vaccination and a verified immuniser item is added.

## 6. Quality state
- Automated: all suites pass (see the latest `UAT-PROGRESS.md` entry), including axe-core accessibility (WCAG 2.2 AA) at phone size and 320 px with large text.
- **Still needs a person:**
  - a real phone;
  - VoiceOver/TalkBack;
  - restore in a clean browser end to end;
  - most services set up by hand.

## 7. Owner decisions (don't reverse without asking)
- **Staff checks:** they live in Staff and show as one Today job per person; a separate action only for a gap.
- **Meeting minutes:** they pre-fill the next meeting.
- **Deferred:**
  - inspector pack;
  - multi-store summary;
  - push reminders;
  - Monday plan;
  - buyer/selling features.
- **Leave as it is:** the vaccination "record the GP" wording.
- **Open decision D3, sign-in and hosting:** the recommendation is a managed back end in Sydney; see the decision doc https://claude.ai/artifact/MnhrUaU5u1TxWgTuTHJu3P.
- **Old notes:** the 9 older UAT notes are archived in `uat-notes-archive/2026-11-24/` and are to be disregarded.

## 8. Suggested next work
1. Agree the four note groups in §4 with the owner (especially the grammar fix), then build them on the UAT copy with tests. Mock-ups first for the welcome screen and the service checklist; the owner likes seeing a mock-up before a build.
2. Raise the setup-screen note limit (600) so notes don't get cut off.
3. Ask the owner whether the three observations in §5 should be fixed.
4. Then D3 step 1 (own address, emailed-link sign-in, saving in Sydney).
