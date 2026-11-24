# Game plan: cover everything Codex recommended (23 Nov 2026)

**Source:** Google Doc "R.Pharmacy | Live proprietor walkthrough and recommendations" (Codex, 21–22 Nov). IDs R01–R10 are Codex's.

**Each batch:**
- build it as a layer;
- add a Playwright test for Codex's exact acceptance case;
- run every suite;
- commit;
- publish to the same UAT link;
- note it in UAT-PROGRESS.md.

Nothing is decided for the owner. No patient data.

---

## Batch 0: protect evidence first (P0)
1. **Build identity:** record a SHA-256 hash of every published HTML file in UAT-PROGRESS.md, so any test can be matched to an exact build.
2. **Stale-draft overwrite (Codex's top finding):** two tabs, or an old copy closed without changes, must never overwrite a newer draft. Make these hold:
   - closing an unchanged form writes nothing;
   - a save checks the draft hasn't changed since it was opened; if it has, keep both and ask;
   - "Saved" shows only after the write is confirmed;
   - edited text survives a failed save;
   - the author, evidence references and unknown fields are preserved.
   - *Test:* two tabs, edit in B, close untouched A, then a cold restart; B's text must survive.
3. **Backup restore:**
   - a retried restore records one history entry, not two;
   - the selected backup is never changed;
   - finding→action links are checked before restoring (reject or flag a finding that points at a missing action);
   - Undo works after a restart.
4. **Export accuracy:** the filtered export keeps verification, issue and N/A answers exactly as recorded.

## Batch 1: Today you can trust (R06, R07)
- **One derived list per filter**, with counts that add up. For example: "54 open jobs" → 3 featured + "51 other jobs" → "Show 43 more".
- **Identity:** never deduplicate by title; a review with a draft is one job (Resume).
- **Staff checks:** grouped per pharmacy and person ("Review Rowan's credentials · 7 checks", showing the earliest expiry). Each check is completed separately, and the group leaves Today when its last check is done. *(Owner decision D1.)*
- **Sort order:** overdue (oldest first) → due today → in progress → future by date → no date. No risk scores. Legal dates are never moved by snoozing.
- **Filters:** All open · Overdue · Due today · In progress · Upcoming (next 7 days, range shown) · No date.
- **Empty states:**
  - "Nothing due today";
  - "3 jobs need a date" (the "Dates to set" link);
  - Continue setup when nothing is set up;
  - a storage error is never shown as an all-clear.
- **Phone:** one store label, one primary next action, one route to all work.
  - A single-store phone view drops the repeated store panel.
  - Coming back restores the filter, expansion and scroll position.
  - The dismissible guide sits below the next job.
- **Colour:** zero overdue shows neutral, not red.
- **Calendar summary:** say that its total includes actions while the year plan lists reviews only.
- *Tests:*
  - 61 entries → 54 jobs → 3 + 51 (and the 55-job case);
  - two stores with the same names;
  - completing the first vs the last check in a group;
  - 0, 1, 3, 8 and 9 items;
  - around Sydney midnight;
  - 320 px width with large text.

## Batch 2: resume and save integrity (R04)
- Resume opens the **first unanswered required question**; answered items and notes are kept. If everything is answered, it opens the summary, which needs an explicit Finish.
- Changing an earlier answer re-checks the questions that depend on it.
- Today shows "Resume · 2 of 5 checked · last saved 12 Oct".
- After resuming, focus moves to the question.
- Saving states: "Saving on this device" vs "Saved" vs a failure that keeps the form.
- *Tests:* refresh; switching pharmacy; a six-week-old draft; mixed answers (satisfactory, gap, blank, Verify).

## Batch 3: one follow-up, in context (R01–R03)
- **Link review → finding → action by ID.** One action can fix several linked findings. A later visit never makes an older finding look resolved unless it is explicitly linked.
- **Action titles lead with the finding** (for example "Locate the signed OTP summary"). The original question, review and wording stay in the detail. Older records keep their history.
- **Review results** show "Completed · 1 open action"; after closure they show the original finding and "follow-up closed".
- **Site visit:** shows that pharmacy's open findings in the relevant section, so the owner can record the fix was sighted and close the same action there. *(Owner decision, Codex proposal.)*
- **History entries get verbs:** Draft saved · Review completed · Action raised · Due date changed · Action closed · Reopened. Entries with the same title stay distinguishable. The export matches.
- **Search:** finds an action by its original wording as well as its current title.
- *Test:* finding → action → next visit carries it forward → close with resolution → History and export read correctly.

## Batch 4: dates that mean one thing (R05)
- **Three dates are kept separate:** when the event happened, when the owner sighted the record, and the owner's own reminder.
- Moving a reminder never moves a legal deadline (already true for S8; apply the same to other reviews where the event date matters).
- **Early, late and event-only reviews** each keep the correct next date.
- **Turning a service off:** future reminders stop, but open findings and history stay until resolved. No completion is ever made up.
- *Tests:* date moved earlier or later; closed then reopened; service turned off and on again.

## Batch 5: setup and procedures (R08, R09)
- **First setup screen:** "Just bought this pharmacy?" opens the buyer steps first. Service details become discoverable after services are chosen. Returning owners never answer the same questions twice.
- **Inherited information:** answer option "From previous owner · to check", which lists exactly what to sight.
- **"Create this draft":** reuses an existing draft for the same service instead of making a duplicate. Test cancelling, and two pharmacies with the same service.
- **"Not ready to adopt":** each listed [Confirm] item jumps to its editable wording.

## Batch 6: regulatory updates from Codex's research
- **TGA vaping:** clear the remaining vaping "verify" markers.
- **TGA recalls:** add a site-visit line ("recalls since last visit actioned and recorded"), with no invented deadlines.
- **TGA advertising:** confirm the "no advertising" lines (S4/S8 and most S3).
- **Privacy:**
  - a "Suspected data breach" card: assess quickly, within 30 days; if eligible, notify the OAIC and affected people; log it;
  - a governance line for APP 11 security and destruction;
  - the HRIP 7-year (or age 25) retention reminder for the pharmacy's own systems.
- **Strive for 5:** clear the vaccination "per your plan, verify" markers; NSW needs at least 2 trained vaccine handlers.
- **Fair Work:** the certificates procedure says the service is optional and doesn't overpromise acceptance.
- **OTP:** the 80+ patients a day trigger (amenity plan, annual review, signed staffing declaration) is checked against the existing review.
- **Council:** a store switch must never attest for another interest holder; keep the personal declaration separate.

## Batch 7: content upkeep (R10)
- A simple source map: each rule ID → the questions, due-date rules and procedure sections it drives.
- When a source changes, the app lists the affected procedures as "needs another look". Earlier approved versions and history stay.

## Batch 8: before wider use (tests, not features)
- A real phone, large text, a screen reader (focus after expanding a row), keyboard, and fixed navigation not covering the last control.
- Restore a per-pharmacy backup in a clean browser; compare drafts, links and history.
- PDF and CSV exports across a date filter and two stores.
- The remaining 11 service branches against their own service and draft mappings.
- Time an ordinary month for one owner (Codex's business-adviser check).

## Owner decisions needed
- **D1** Staff checks: keep them all in Staff, show one Today job per person, and raise a separate action only for a gap. *(Codex and Claude recommend yes.)*
- **D2** Meetings: when minutes are saved, pre-fill the next meeting (which can be cleared), or schedule only when a date is chosen?
- **D3** Sign-in, hosting and recovery for real use (owner: later).

## Order and size
- **Sessions 1–2:** Batch 0, then Batch 1.
- **Session 3:** Batch 2 and Batch 3.
- **Session 4:** Batch 4, Batch 5 and Batch 6.
- **Later:** Batch 7 and Batch 8.

---
## Status · 23 Nov 2026 (v26)
- **Batch 0: done.**
  - Draft guard. The stale-close overwrite was reproduced on v25 and is fixed, with a real two-tab test.
  - Restore: one history entry; broken links are rejected.
  - Build ID and SHA-256.
  - Export accuracy (v27): CSV, print and review detail keep Verify / Issue / N/A exactly (test export-accuracy).
- **Batch 1: done.**
  - One job count; Codex sort order; person-grouped checks.
  - Neutral zero; "N need a date"; "Show N more" reconciles.
  - v27: Due today and In progress filters, empty states per filter, scroll position restored on return.
- **Batch 2: done.** Resume at the first unanswered check; Today shows "Resume · 2 of 9 checked · saved <date>".
- **Batch 3: done.**
  - Finding-first titles; "1 open action" on results and in History.
  - History verbs on phones.
  - The site visit shows open follow-ups from earlier visits with an explicit close.
  - v27: search finds an action by its original wording and its current title.
- **Batch 4: partial.**
  - Service off keeps open actions (tested).
  - The S8 event date is separate.
  - v27: reviews recorded late show "recorded <date>" and History says "done X, recorded Y". A separate sighted-date field for every review is left out to keep forms short (owner: "dont complicate it").
- **Batch 5: done.**
  - Buyer guide on the first setup screen.
  - Inherited marking.
  - No duplicate drafts.
  - The adopt block opens the draft.
- **Batch 6: done.**
  - Recalls line; privacy obligation and data-breach card.
  - Vaccination steps cited.
  - Certificates marked optional (Fair Work).
  - OTP 80-patient detail: checked; the amenity review already covers the plan, annual review and signed staffing declaration.
- **Batch 7: done (light).** Sources screen with "This source changed", which raises one action listing what to re-check.
- **Batch 8: automatable part done (v27).** 320 px with large text on all main pages (fixed sideways scroll); exports tested. Still needs a person: real phone, screen reader, restore in a clean browser, the other 11 services by hand, timing an ordinary month.
