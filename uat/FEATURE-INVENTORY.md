# Feature inventory of the current app (v41.1)

Re-audited 25 Nov 2026 against rebuild build 383803d03e (overnight Sprints 3–5); rechecked after the post-parity polish (P-01–P-05). Every [x] was checked in the app at phone size; main flows are covered by tests in app/tests: core, sprint1–sprint5, setup-questions, extras; screens.js opens every screen and checks fit, repeats and 44 px targets (plus 320×568).

This is the checklist the rebuild must match before the old app is retired (rule in `/CLAUDE.md`). Each line is something the current app does, sourced from the layers, the engine and the 25 Nov audit. `[ ]` means not yet in the rebuild. Tick it only when it works in the new app at phone size and has a test.

## 1. First use and setup
- [x] Welcome screen. Rebuild: wordmark, one line and one button (owner's note).
- [x] Core setup: pharmacy details (name, address, region, identifier) → proprietors (one or more, with financial-interest holders) → services.
- [x] Setup can be stopped and resumed (fresh-resume). · test: sprint3
- [ ] (Deferred by the overnight brief: replaced by “Check later” on every question and the optional records step) Express setup: assumed standard answers are marked "Assumed – confirm". Evidence and record questions default to "Needs verification".
- [x] Detailed setup per service: question cards with single choice, multi-tick (with Select all) and "Other (describe)". Free text up to 220 characters.
- [x] "Draft it for me" vs "We have our own procedure (where kept)".
- [x] Record locations: multi-tick (paper, electronic, both, other) plus detail. "Mark as needs verification" on any answer.
- [x] The "Who runs your services day to day" lead question, asked once and reused.
- [x] Vaccines offered: 21 vaccines in 4 groups with Select all; government-funded vaccines.
- [x] Optional evidence and record questions, now or later. · test: sprint3 (S3-04: optional records step)
- [x] Per-service "what happens next": its reviews, how often, a suggested first due date ("Save these dates"), its procedure (Create this draft, Preview), and what's left to check.
- [x] Service checklist after core setup (rebuild: To do / In progress / Done).
- [x] Today setup checklist ("Finish setting up · N left") and a one-time "set up" message. · test: sprint3
- [x] Review due dates screen: set or change first dates; moving a date needs a reason.
- [x] Review intervals (Adjust intervals), with the S8 legal limit enforced (s 111: 3 months after the latest stock-check date, unless NSW Health approved otherwise).
- [x] Setup answers to verify: a list on Policies and Today ("to check later").

## 2. Today
- [x] Status line: the date and one sentence (overdue count, where to start), plus "N need a date".
- [x] One top card, by priority: visit in progress → setup unfinished → backup reminder → set up message → how the app works (first week) → Start a visit.
- [x] Filters with counts: Overdue / Today / Started / All. More filters: Upcoming (7 days), Actions only, No date yet, To check, Waiting on someone.
- [x] Rows: reviews, actions, staff credential expiries (expired = overdue), annual staff checks, drafts in progress, setup items to verify, check-back dates.
- [x] Grouping (rebuild): one row per person and one per obligation. "Required by law" first. One S8 row.

## 3. Site visit (Q1)
- [x] Start a visit: quarterly or extra (an extra visit keeps the quarterly date). Up to 3 "worth seeing" items with reasons; "View all".
- [x] Copy a list for the pharmacist on duty (copy only).
- [x] Checks: 11 core items (premises, storage, incidents, …) plus service sections (DAA, vaccination, staged supply, OTP), with a guide for each.
- [x] Answers: Satisfactory / Issue / Check later / N/A. An issue raises a follow-up (new action, or link an existing one; owner and due date).
- [x] Before you start: open items from earlier visits. Last time: the previous issue and when its fix closed.
- [x] Still open from an earlier visit: "Seen the fix? Close it".
- [x] Vaccination panel: cold-chain or equipment event, self-audit sighted plus its date.
- [x] Service evidence: DAA operational sample (verified review), staged and vaccination evidence status plus reference. · test: sprint3 (S3-05)
- [x] Visit note and next visit date.
- [x] Finish review lists every item still needed, with "Go to".
- [x] Draft saves as you go. Resume. Drafts never overwrite newer copies (conflict copy kept).
- [x] Rebuild: quarterly and extra drafts kept fully separate, and both can be started.
- [x] Displayed names check (Council Guide Note 24): owner names at the entrance, and today's pharmacist's name by the dispensary.

## 4. Reviews (33 types in the catalog)
- [x] S8 stock check · proprietor review (B1): the underlying stock-check date and pharmacist; exceptions; the storage construction checks only every 12 months or after a change; register, keys and codes every quarter; the s 111 rule.
- [x] Meetings: Staff safety meeting (M1), Proprietor check-in (M2), Proprietor governance meeting (Q4). Attendees, minutes, pre-fill of the next meeting, schedule the next one.
- [x] Staff assurance (A1): see Staff. · test: extras, sprint1 (annual check, leaving, locum)
- [x] Governance, access and continuity (A3). Premises registration renewal (CO-P, with Council receipt). Financial interest declaration (CO-F).
- [x] Service reviews:
  - OTP monthly check-in;
  - OTP comprehensive (six-monthly, with aggregate counts and the 80-a-day threshold);
  - OTP daily-volume threshold;
  - DAA in-house;
  - DAA external (we dispense / other pharmacy dispenses);
  - staged supply;
  - vaccination;
  - vaccination readiness (event);
  - vaccine storage self-audit reference;
  - prescribing;
  - prescribing readiness;
  - medicines reviews;
  - home delivery;
  - simple and complex compounding;
  - aged care;
  - screening;
  - adherence;
  - NSP;
  - certificates;
  - vaping;
  - cannabis;
  - other funded programs.
- [x] Applicability rules: a review only applies when its service or arrangement applies. Otherwise it's "Preview only".
- [x] Each review: date, recorded as (current proprietor), legal or interval line, questions (Checked / Issue / N/A / Needs verification), notes, related procedure, next due date.
- [x] Issues raise actions linked to the review. Review results show "N open actions" or "follow-up closed".
- [x] Event-only (extra) reviews.
- [x] Review history (Completed tab) and review detail with a download.
- [x] Reviews list: filters (All / Overdue / Due soon / On track / No date / Required by law / Completed), search, include inactive, detail pane (how often, last done, set by, why it's here). · test: sprint4 (S4-02)

## 5. Actions
- [x] List: Open / Overdue / Completed / All, plus search.
- [x] Action: title, source (finding, review or staff), due date, status, progress note, evidence reference, resolution, completion confirmation.
- [x] Phone action screen: "Seen the fix · close it", Full history, Waiting on someone, Edit details.
- [x] Waiting on someone: what was asked, a check-back date; It's arrived / Still waiting · new date / Not waiting any more. The due date never moves.
- [x] Full history timeline (finding → updates → asks → closure or reopening), with copy.
- [x] Add action manually. Link several sources. Reopen.
- [x] OTP procedure parts screen: one action, 7+2 parts marked Written or To write.
- [x] Inherited items from a previous owner ("Check later · from previous owner").

## 6. Staff
- [x] Register: Active / Needs review / Coming up / Locum / Former, plus search.
- [x] Profile: name, role, engagement, start, annual due date, services performed.
- [x] Requirements by role and service:
  - induction;
  - role description;
  - Ahpra registration;
  - indemnity;
  - CPD and competence;
  - supervision;
  - service-specific training (OTP, DAA, staged, vaccination, delivery, S2/S3 referral).
- [x] Credentials with expiry, reference and method. Suggested credentials for their services (CPR, immuniser, …).
- [x] Annual assurance (rebuild: quick confirm), targeted verification, "Review a change" (role or engagement change triggers a recheck).
- [x] Departure checklist: keys, IT access, handover. Rebuild adds personal S8 codes or biometrics removed and e-register access removed.
- [x] Staff actions raised for gaps, with credential expiry kept visible.
- [x] Rebuild: locum quick check.

## 7. Procedures (Policies)
- [x] Generated SOP drafts from setup answers for DAA, OTP, vaccination, staged supply, delivery and the other services, citing sources. "[Confirm: …]" markers are listed.
- [x] Versions (0.1, 0.2, -r2…), local amendment, "Edit draft wording", "Record that I reviewed", Adopt (blocked while markers remain), annual policy reviews, linked actions. · test: sprint4 (S4-01)
- [x] Template library and document references (title, link, reference, version, owner, review date). · test: sprint4 (S4-01)
- [x] Policy status in plain words. Procedures speak to "the pharmacist on duty".

## 8. Calendar
- [x] This week and next (overdue from earlier weeks, this week, next week).
- [x] Year plan with expected repeats and completed marks. Month view. Plan in plain words (find a date). · test: sprint4 (S4-03)
- [x] Includes dated open actions, staff annual checks and (rebuild) credential expiries.
- [x] Schedule a meeting. · test: sprint4 (S4-03)
- [x] Rebuild: calendar feed (.ics) — owner decision.

## 9. History and exports
- [x] History: every record (reviews, actions, meetings, setup changes), filters (pharmacy, search, source, record type, review, from and through dates), page through. Rebuild: search, record type, from and through dates; one pharmacy at a time.
- [x] Print or save a filtered PDF. Download a filtered CSV. Rebuild: readable rows with title, status, due date, resolution and who. Rebuild: print or save as PDF from the filtered list (not available inside the claude.ai preview).
- [x] Review detail download. Full history text per action. · test: sprint5 (S5-01)
- [x] My log: what the owner reported or sent (date, what, to whom, reference).

## 10. Law and inspections
- [x] S8 at a glance: inventory (s 111), who the law puts it on (s 108, s 122), where records are, S8 setup answers, open S8 actions, last checks, last sighted.
- [x] Legal obligations: one line per Regulation section that applies, with where the evidence is kept and when last sighted.
- [x] NSW Health dates and contacts. Sources screen (every rule's source).
- [x] Incident steps (lost or stolen drugs, S8 destruction) from NSW Health pages. · test: sprint4 (S4-04)
- [x] Evidence locations. · test: sprint4 (S4-05)

## 11. Pharmacy setup (settings)
- [x] Pharmacy details. Proprietors and oversight (recording as …, switch reviewer). Services and configuration.
- [x] Bought, selling or closing (what NSW Health requires). First visit after buying: inherited facts to confirm.
- [x] Tell me once: a change to how DAAs are packed (in-house / outside packer / another pharmacy) shows only the dependent items, each Done or Later.
- [x] Settings: last backup and changes since; backup download; restore with a receipt; storage status (where records are kept, conflict copies).
- [x] More than one pharmacy on a device (switch, add). Directory of sites.
- [ ] (Deferred by the overnight brief: out of scope until sign-in, D3) Account or sign-in placeholders (not live).

## 12. Data protection
- [x] Local storage (IndexedDB) and flush before reload. Cross-tab sync.
- [x] Strict backup validation. Restore never silently replaces another pharmacy.
- [x] Draft integrity: no overwrite by stale copies, conflict copies kept, an untouched session writes nothing. · test: sprint5 (S5-02: newer copy kept, conflict copy listed and dismissible)
- [x] Every change goes to history (who, when, what). Configuration history.

## 13. UAT-only (not in the real app)
- [x] UAT notes (page notes, setup question marks, synced to the UAT page). · test: sprint5 (S5-03: notes, question marks, Copy all, Clear all)
- [x] Example pharmacy (Wattle Grove, fictional), dates shifted to today.
- [x] Reset test data. · test: sprint5 (S5-03)
