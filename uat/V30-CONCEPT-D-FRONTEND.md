# UAT v30: the Concept D frontend (19 Nov 2026)

**Link:** https://claude.ai/artifact/TCsSGa9P6CfcmvDpR9M9TS is **not** this version; v29 stays there.
**v30 link:** https://claude.ai/artifact/D8UZBRAfsknuF68zy964jM (new and private; its test data is separate from v29's).
**Blueprint:** `design-studio/round3/concept-d.html`. Its CSS, header, tabs, tables, detail pane, phone details, calendar and audit screen were copied into `layers/conceptD-frontend.css` and `layers/conceptD-frontend.js`. Inter is replaced by the system font because the app's security policy blocks web fonts.
**Engine:** dev v27, unchanged. Every save goes through the app's own editors and rules.
**Safety:**
- Checkpoint: `checkpoints/v29-before-conceptD-frontend/`, and git in `uat/` (branch `main` = v29, branch `conceptd-frontend` = v30).
- No production deployment; no real data touched.

## What changed from v29
v29 restyled the old screens. v30 replaces the frontend with the prototype's own structure.

| Section | Concept D prototype | Working app (v30) |
|---|---|---|
| Header | R. · pharmacy switch · search · initials · tabs | The same. Tabs are Today, Reviews, Actions, Calendar, Staff, Policies, then Meetings, Services, History and Setup (extended in the same style). The switch lists your real pharmacies. The initials open "Who is recording?". |
| Today | Status line, filters, queue table, detail pane with "Why it's here" | The same. Items come from the app's own oversight list, plus reviews with no date and answers to verify. The pane buttons open the existing review, task, staff or date dialogs. |
| Reviews | Table: cadence, last, next due, source; pane with last three results | The same, from the real schedule and records. Also: search, Completed, Include inactive and Adjust intervals. |
| Audit screen | Steps list, one check at a time, answer rows with keys 1–4, Previous / Save and next | **Site visit:** one check at a time, as in the prototype, with keys 1–4, a steps list, and drafts saved as you go by the app. **Other reviews** (S8 and others): the same screen with option rows, keys 1–4 and steps, with all questions on one page. |
| Actions | Grouped tables, trail, close/reopen | Grouped as Overdue, Open and Completed, from the real tasks, with the real activity trail. Add, update and close all use the existing task form. |
| Calendar | Month grid, pane, next four weeks | **Three tabs, as you asked:** This week & next (the default), Year plan, and Month. Month has the prototype's grid, day pane, Plan in plain words and Next four weeks. |
| Staff | Credentials matrix and pane (Concept B data) | Matrix columns: Registration, Credentials, Training, Annual and Status. Filters, find staff and Add staff member. The pane has Open record, Annual assurance and Add credential. |
| Policies | Procedures table, answers to verify | The same, from your real procedures. "Template library & documents" opens the full existing library (Forms, Guidance, Evidence, Template Library, checklist). |
| Phone | Bottom bar, details opening in place | The same. More lists the other sections. Phone view on a laptop is kept. |
| Not in the prototype | — | Meetings, Services, History, Setup and staff records keep their existing screens inside the new header, tabs and style. |

## Preserved functionality (tested; see `tests/out/cd-functional-results.json`)
**First use and setup**
- First-use landing, then setup: pharmacy details, proprietors, service tiles, and activation through the existing flow.

**Navigation**
- Every tab, the phone bottom bar and More.
- Ctrl+K search.
- "Who is recording?".
- Pharmacy switching between two fictional pharmacies.

**Reviews and the calendar**
- Today lists every item from the app's data, and its filters work.
- Opening a review, answering with keys, moving to the next check, and closing with the draft kept.
- The S8 review form.
- Plan a date uses the existing due-date dialog, and pushing a date later still needs a reason.
- Plain words fills in the date in that dialog; an earlier date saves and is logged.
- Schedule meeting opens the existing meeting dialog.

**Actions, staff and policies**
- Add an action, then close it; it moves to Completed.
- The staff matrix; Open record opens the staff profile; Add staff member.
- Policies: answers to verify, the library and Add policy.

**Other pages and data**
- History exports present; Meetings and Services work.
- No sideways scrolling, and no script errors.
- Viewing pages changes no data.

**Results**
- 90/90 at laptop and phone sizes, and 9/9 phone-view checks.
- Original v27 suites: 6 identical; check-ui differs only in colours.
- All 17 service walk-throughs identical to v27.
- Dialog fields are identical to v27, apart from the added steps list and key hints on reviews.

## Visual comparison
Screenshots in `uat/comparison/` show the prototype on the left and the working app on the right, at the same sizes: laptop 1280×860 and phone 390×844. They cover Today, Reviews, the audit screen, Actions, Calendar, Staff and Policies.

Differences that remain, on purpose:
- **Real data instead of the prototype's examples:** names, counts, wording of items, and "Needs review" where a test staff member has nothing verified yet.
- **Calendar opens on This week & next**, as you asked. The prototype's month view is the Month tab.
- **No "All pharmacies" view.** Decision D-1 is still open, so the switch shows only your pharmacies.
- **Extra controls the app needs:** search boxes, Add buttons, Completed and Include inactive.
- **Two Today filters are relabelled:** "Your check" is "Actions" and "Due soon" uses your reminder window. The app has no separate "waiting for your check" state.
- The prototype's suggested booking dates ("Tue 24 Nov fits") aren't built: the app has no rule for suggesting dates (new logic, needs your decision).
- On the audit screen, the prototype's "Open actions in this area" box isn't built. The app's "Before you start · open Tasks" line sits in the steps pane instead.

## Not yet done or tested
- Not tried on a real phone, Safari or a screen reader.
- Downloads are blocked inside the claude.ai viewer (as before).
- In other reviews (not the site visit), the questions stay on one page rather than one at a time.
- One small UI-only side effect: review answer labels now include their key number in the page text. Saved values are unchanged (walk-through tests identical).
