# PropApp (R.Pharmacy): standing rules

Read this before any work. These are the owner's instructions and decisions. Don't reverse them without asking the owner.

## What the product is
- A phone-first web app that helps the **proprietor of an NSW community pharmacy** keep on top of their legal and best-practice obligations. Owner's words: "super mobile friendly, good UI/UX and not a barrage of information".
- **A helper, not a policeman.** No risk ratings, no blame.
- **Proprietor only.** No staff logins.
- **The proprietor is responsible overall, whoever is on duty.** The pharmacist in charge changes day to day. The app does not record or ask for it, and never asks "who is responsible". When an inspector finds a problem, it's the proprietor's responsibility regardless of who was there.
- **It is not:** a QSPP accreditation tool, a drug register, a clinical record, or a store of patient data.

## Never
- Approve procedures, complete reviews, close actions or tick anything off for the owner automatically, or fabricate compliance.
- Remove existing functionality without the owner's explicit OK. The rebuild must reach feature parity, checked against `uat/FEATURE-INVENTORY.md`, before the old app is retired.
- Change a compliance obligation without checking the primary source (see `uat/research/`). Changing how it is *shown* is fine; its wording stays exact under "Why?".
- Use real pharmacy names, contacts or staff. Fictional data only. Collect no identifiable patient data, and nudge against it in free-text boxes.
- Modify the owner's Google Drive files unless authorised.
- Overwrite or delete `design-studio/`, past designs or past feedback.
- Deploy to production, overwrite real user data, or run destructive migrations. Stop and ask before anything irreversible.
- Claim something works without testing it in a real browser at phone size.

## Owner decisions
- **Reminders:** yes. Build a calendar feed so due dates can appear in the owner's phone calendar.
- **Rebuild:** a full rebuild in `app/` with every feature brought across, taking the time it needs. Nothing is dropped. The current app in `uat/` stays the untouched reference until the rebuild matches it.
- **Staff checks:** they live in Staff and show as one Today row per person.
- **Meeting minutes:** they pre-fill the next meeting.
- **Deferred:**
  - inspector pack;
  - multi-store summary;
  - push notifications;
  - Monday plan.
  Buyer features stay as they are.
- **Leave as it is:** the vaccination "record the GP" wording.
- **Sign-in and hosting (D3):** a managed back end in Sydney, emailed-link sign-in. Not yet built.
- **Look (P-06, 24 Nov):** the owner picked "E+++ Coastal Precision" from the Grand Finale Studio. It is a token and theme layer at the end of `app/src/styles.css`: a white header with a teal-to-ocean strip, ocean primary (#005792), weights 400/500/600, and urgency rails only on overdue and due-soon rows. Change colours there, not in the screens.
- **The owner leads on product decisions.** Claude leads the build and shouldn't ask about things it can decide. When something is needed from Gemini (an independent review), give the owner a ready-to-paste prompt.

## Design rules (from the 25 Nov audit: `uat/audit-2026-11-25/`)
1. **First screen, first job.** The first thing to do is visible without scrolling at 390 × 844. At most one screen of reading before you can act.
2. **Say it once.** No sentence twice on a screen. One saved indicator, in one place. The pharmacy name only in the header.
3. **Law in one line.** Each screen shows its legal basis in one line; the full wording sits under "Why?", word for word. Warnings that matter get a short amber note.
4. **One shell.** Every review, form and window has the same frame: back, title, saved state, the same side margins, full phone width.
5. **One way to answer.** One control per question. Answers are big rows you tap.
6. **Proprietor words.** No "responsible person" and no pharmacist-in-charge fields. Use "the pharmacist on duty" only where a procedure needs it.
7. **The main job gets the main button.** One primary button per screen. "Add" is a small + button.
8. **One set of counts.** Every count comes from one function, so all screens agree. Correct singular and plural.
9. **One date style.** "21 Aug" this year, "21 Aug 2025" otherwise. No times unless they mean something.
10. **Today by person and duty.** One row per person and one per obligation. "Required by law" first.
11. **Built for thumbs.** Every tap target at least 44 px. Nothing cut off, no sideways scroll.
12. **Short forms.** Long forms become steps or a quick confirm list.

## How to work
- **Every build ends with phone screenshots of the changed screens, looked at as pictures,** and the screenshot page is updated for the owner.
- **Tests tap real buttons**, not internal functions. They fail on any console error. No hardcoded absolute paths.
- **Commit and push to GitHub** (`Mohaco1/PropApp`) at the end of each piece of work.
- **Log every version in `uat/UAT-PROGRESS.md`** (or `app/PROGRESS.md` for the rebuild), with its build id.
- **Before naming a new global in `uat/` layers, grep for it first.** `RPH.bk` and `RPH.rf` are taken, and `UAT.open` must be called through a function, not captured.

## Where things are
| Path | What |
|---|---|
| `uat/` | Current app v41.1: engine in `dev/proprietor-hub.html`, layers in `uat/layers/`, build with `node uat/build-uat.js`. Live UAT link: https://claude.ai/artifact/Vnn6KXsNkkEe7Ywc3DbnWN |
| `uat/demo/` | Wattle Grove Pharmacy (fictional) example generator |
| `uat/research/`, `uat/NSW-HEALTH-GAP-ANALYSIS.md` | Sources |
| `uat/audit-2026-11-25/` | Phone screen audit (page: https://claude.ai/artifact/DKoGzqaxmksAR5Xh8gFzzn) |
| `app/` | The rebuild (in progress) |
