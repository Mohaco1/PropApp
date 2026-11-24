# R.Pharmacy UAT v28 · Concept D: implementation summary

**UAT file:** `uat/app/rpharmacy-uat-v28-conceptD.html` (browser tab title "R.Pharmacy UAT v28")
**Built from:** `dev/proprietor-hub.html` (v27, unchanged) plus one presentation layer, `uat/layers/conceptD-ui-layer.js`.
**Rebuild:** `node uat/build-uat.js`. It copies v27 and inserts the layer before the app's final `render()`.
**Not touched:** dev v27, the original, the Design Studio and its notes, Google Drive, and the published dev and original artifacts.

## How it was built
The new look is one layer on top of the existing app. It changes how things look and adds read-only views. Every save still goes through the app's existing functions: the due-date dialog, the meeting dialog, the staff editor and the service setup. The layer adds no saved fields, and the automated tests confirm this.

## What changed
### Look and navigation (Concept D)
- White surfaces, hairline lists, and a status word next to every status dot. Red means Overdue, amber Due soon, blue In progress, green Completed or Current.
- The left sidebar is replaced by a **top bar** and **tabs**:
  - The top bar holds the brand, the pharmacy name, **Search or jump to… (Ctrl/⌘ K)** and **Recording as**.
  - The tabs are: Overview, Audits, **Calendar** (new), Tasks, Staff & credentials, Policies & documents, Meetings, Services, History and Pharmacy setup.
- On a phone the bottom bar is the same (Home, Audits, Tasks, More), restyled. Calendar is under More.
- **Pharmacy switcher** in the top bar. It only appears when there's more than one pharmacy and uses the existing switching, which reloads the app and keeps each pharmacy's data separate.
- **Detail editors** open as a right-hand side pane on a laptop and a full-screen sheet on a phone. They're still modal, and Esc and Close still work.
- **Jump search** only opens pages, reviews and staff records. It never changes data.
- Notifications float in the top right on a laptop and above the bottom bar on a phone.

### Calendar (new page, three tabs)
All three tabs read the same data: active reviews, annual assurance per staff member, and scheduled meetings. That's the same set the Audits "Calendar" tab uses. Each item appears once, and no tab changes a date.
1. **Weekly breakdown**, after C's "Path ahead": Overdue from earlier weeks, This week, Next week, the following weeks, Later and No date yet. Status words are Overdue, Due soon, Upcoming, In progress and Completed. Reviews recorded this week show as Completed. A § marks a legal or external date.
2. **Year plan**, after F2: one row per review, Jan–Dec, marked Done, Overdue or Planned, with year navigation.
   - A **"<Month> looks heavy"** note appears when one month has 5 or more planned reviews, or 4 or more and 1.5× the average. It's informational only. Each item has a "Change date" button that opens the existing dialog.
3. **Month**, after N10: the existing month grid, the selected day's list and "Schedule meeting on…", plus **Plan in plain words**.
   - Type, for example, "S8 check 1st Dec morning" and choose Find. It shows the match and the date. **Add** opens the existing *Change due date* dialog with the date filled in.
   - Nothing is saved until you press Save there. The existing rules still apply: a reason is needed to push a date later, and an overdue date can't be removed. The time of day isn't stored, and it tells you so.

### Staff & credentials (Concept B style)
- The register is a **credentials matrix**: Person, Role, Registration, Credentials, Training, Annual assurance and Status.
  - The cell words are Current, To verify, Expires <date>, Expired, Overdue, Due <date> and —, all calculated by the existing staff logic.
- Clicking a row opens a **detail pane** with every requirement and its status, plus "Open staff record". Clicking the name opens the full record directly, as before.
- On a phone, the matrix shows Person and Status, with the issues listed under the name.
- Filters, find staff, Add staff member, the person record, credentials, verification, annual and change-triggered reviews, departure and expiry monitoring are unchanged.

### Onboarding (service step, after N1)
- The services question shows **tiles**, a **progress bar** (Step 3 of 3, then set up each service) and **"Your plan so far"**, which lists the reviews each chosen service adds.
- Ticking a tile saves nothing. "Save service selection" runs the existing save, which activates services and schedules exactly as before. No field became mandatory.
- **Presets were not built**; this is an outstanding decision.

## Files
| File | Purpose |
|---|---|
| `app/rpharmacy-uat-v28-conceptD.html` | The UAT app |
| `layers/conceptD-ui-layer.js` | The only new code |
| `build-uat.js` | Rebuilds the UAT app from dev v27 |
| `FEATURE-PRESERVATION-CHECKLIST.md` | Every existing feature mapped to the new UI, with results |
| `AGREED-FEATURES-REVIEW.md` | Status of previously agreed features |
| `TEST-RESULTS.md` | What was tested and how |
| `KNOWN-ISSUES.md`, `SUGGESTIONS.md`, `OUTSTANDING-DECISIONS.md` | Issues, ideas and decisions for you |
| `UAT-WALKTHROUGH.md` | The script for your UAT session |
| `UAT-PROGRESS.md` | Tracker for what you find |
| `HANDOFF.md` | How to resume on another computer |
| `tests/` | Automated tests and screenshots |
| `baseline/` | v27 screenshots and the control inventory before the change |

## v29 (19 Nov 2026): every page in Concept D, plus phone view
Published to the same UAT link, as version 2: https://claude.ai/artifact/TCsSGa9P6CfcmvDpR9M9TS. Your test data in that browser is kept.

**Look and layout**
- **Today page** (was "Your oversight"):
  - one line of coloured counts that you can still click
  - a slim setup progress line
  - a table with the columns Check, Why it's here, Due and Status
  - the detail panel docked on the right on a laptop
- The "Why it's here" text is built only from the item's own date, its legal or external basis (from the existing due-date rules), its review frequency or its task owner. No new wording about requirements was added.
- **All pages:**
  - the same buttons, fields, underlined tabs and hairline rows throughout
  - a status word on every list row
  - the services list as plain rows
  - an orange bar on the Policies tabs (a v27 style bug) is fixed
- **First-use and setup:** a clean landing page, and setup steps with a dark "Continue" or "Save" button. Answer options stay white with a tick box, so they still look different from action buttons (agreed in UAT-003).

**Phone view (UAT only)**
- On a laptop the app opens at phone width by default. "Laptop view" (bottom right) switches back, and the browser remembers the choice.
- On a real phone the button doesn't appear.
- It changes only how the page is laid out, never any data.

**Tested**
- 7 existing suites: 6 give identical output; check-ui differs only in the new colours.
- 17/17 service walk-throughs identical to v27.
- 45/45 functional and 36/36 second-verification checks.
- 9/9 phone-view checks.
- Visible controls in 7 dialogs and 8 pages are the same as v27. The only differences are the reworded Overview count labels and row text.
