# Feature inventory of the current app (v41.1)

This is the checklist the rebuild must match before the old app is retired (rule in `/CLAUDE.md`). Each line is something the current app does, sourced from the layers, the engine and the 25 Nov audit. `[ ]` means not yet in the rebuild. Tick it only when it works in the new app at phone size and has a test.

## 1. First use and setup
- [ ] Welcome screen. Rebuild: wordmark, one line and one button (owner's note).
- [ ] Core setup: pharmacy details (name, address, region, identifier) → proprietors (one or more, with financial-interest holders) → services.
- [ ] Setup can be stopped and resumed (fresh-resume).
- [ ] Express setup: assumed standard answers are marked "Assumed – confirm". Evidence and record questions default to "Needs verification".
- [ ] Detailed setup per service: question cards with single choice, multi-tick (with Select all) and "Other (describe)". Free text up to 220 characters.
- [ ] "Draft it for me" vs "We have our own procedure (where kept)".
- [ ] Record locations: multi-tick (paper, electronic, both, other) plus detail. "Mark as needs verification" on any answer.
- [ ] The "Who runs your services day to day" lead question, asked once and reused.
- [ ] Vaccines offered: 21 vaccines in 4 groups with Select all; government-funded vaccines.
- [ ] Optional evidence and record questions, now or later.
- [ ] Per-service "what happens next": its reviews, how often, a suggested first due date ("Save these dates"), its procedure (Create this draft, Preview), and what's left to check.
- [ ] Service checklist after core setup (rebuild: To do / In progress / Done).
- [ ] Today setup checklist ("Finish setting up · N left") and a one-time "set up" message.
- [ ] Review due dates screen: set or change first dates; moving a date needs a reason.
- [ ] Review intervals (Adjust intervals), with the S8 legal limit enforced (s 111: 3 months after the latest stock-check date, unless NSW Health approved otherwise).
- [ ] Setup answers to verify: a list on Policies and Today ("to check later").

## 2. Today
- [ ] Status line: the date and one sentence (overdue count, where to start), plus "N need a date".
- [ ] One top card, by priority: visit in progress → setup unfinished → backup reminder → set up message → how the app works (first week) → Start a visit.
- [ ] Filters with counts: Overdue / Today / Started / All. More filters: Upcoming (7 days), Actions only, No date yet, To check, Waiting on someone.
- [ ] Rows: reviews, actions, staff credential expiries (expired = overdue), annual staff checks, drafts in progress, setup items to verify, check-back dates.
- [ ] Grouping (rebuild): one row per person and one per obligation. "Required by law" first. One S8 row.

## 3. Site visit (Q1)
- [ ] Start a visit: quarterly or extra (an extra visit keeps the quarterly date). Up to 3 "worth seeing" items with reasons; "View all".
- [ ] Copy a list for the pharmacist on duty (copy only).
- [ ] Checks: 11 core items (premises, storage, incidents, …) plus service sections (DAA, vaccination, staged supply, OTP), with a guide for each.
- [ ] Answers: Satisfactory / Issue / Check later / N/A. An issue raises a follow-up (new action, or link an existing one; owner and due date).
- [ ] Before you start: open items from earlier visits. Last time: the previous issue and when its fix closed.
- [ ] Still open from an earlier visit: "Seen the fix? Close it".
- [ ] Vaccination panel: cold-chain or equipment event, self-audit sighted plus its date.
- [ ] Service evidence: DAA operational sample (verified review), staged and vaccination evidence status plus reference.
- [ ] Visit note and next visit date.
- [ ] Finish review lists every item still needed, with "Go to".
- [ ] Draft saves as you go. Resume. Drafts never overwrite newer copies (conflict copy kept).
- [ ] Rebuild: quarterly and extra drafts kept fully separate, and both can be started.
- [ ] Displayed names check (Council Guide Note 24): owner names at the entrance, and today's pharmacist's name by the dispensary.

## 4. Reviews (33 types in the catalog)
- [ ] S8 stock check · proprietor review (B1): the underlying stock-check date and pharmacist; exceptions; the storage construction checks only every 12 months or after a change; register, keys and codes every quarter; the s 111 rule.
- [ ] Meetings: Staff safety meeting (M1), Proprietor check-in (M2), Proprietor governance meeting (Q4). Attendees, minutes, pre-fill of the next meeting, schedule the next one.
- [ ] Staff assurance (A1): see Staff.
- [ ] Governance, access and continuity (A3). Premises registration renewal (CO-P, with Council receipt). Financial interest declaration (CO-F).
- [ ] Service reviews:
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
- [ ] Applicability rules: a review only applies when its service or arrangement applies. Otherwise it's "Preview only".
- [ ] Each review: date, recorded as (current proprietor), legal or interval line, questions (Checked / Issue / N/A / Needs verification), notes, related procedure, next due date.
- [ ] Issues raise actions linked to the review. Review results show "N open actions" or "follow-up closed".
- [ ] Event-only (extra) reviews.
- [ ] Review history (Completed tab) and review detail with a download.
- [ ] Reviews list: filters (All / Overdue / Due soon / On track / No date / Required by law / Completed), search, include inactive, detail pane (how often, last done, set by, why it's here).

## 5. Actions
- [ ] List: Open / Overdue / Completed / All, plus search.
- [ ] Action: title, source (finding, review or staff), due date, status, progress note, evidence reference, resolution, completion confirmation.
- [ ] Phone action screen: "Seen the fix · close it", Full history, Waiting on someone, Edit details.
- [ ] Waiting on someone: what was asked, a check-back date; It's arrived / Still waiting · new date / Not waiting any more. The due date never moves.
- [ ] Full history timeline (finding → updates → asks → closure or reopening), with copy.
- [ ] Add action manually. Link several sources. Reopen.
- [ ] OTP procedure parts screen: one action, 7+2 parts marked Written or To write.
- [ ] Inherited items from a previous owner ("Check later · from previous owner").

## 6. Staff
- [ ] Register: Active / Needs review / Coming up / Locum / Former, plus search.
- [ ] Profile: name, role, engagement, start, annual due date, services performed.
- [ ] Requirements by role and service:
  - induction;
  - role description;
  - Ahpra registration;
  - indemnity;
  - CPD and competence;
  - supervision;
  - service-specific training (OTP, DAA, staged, vaccination, delivery, S2/S3 referral).
- [ ] Credentials with expiry, reference and method. Suggested credentials for their services (CPR, immuniser, …).
- [ ] Annual assurance (rebuild: quick confirm), targeted verification, "Review a change" (role or engagement change triggers a recheck).
- [ ] Departure checklist: keys, IT access, handover. Rebuild adds personal S8 codes or biometrics removed and e-register access removed.
- [ ] Staff actions raised for gaps, with credential expiry kept visible.
- [ ] Rebuild: locum quick check.

## 7. Procedures (Policies)
- [ ] Generated SOP drafts from setup answers for DAA, OTP, vaccination, staged supply, delivery and the other services, citing sources. "[Confirm: …]" markers are listed.
- [ ] Versions (0.1, 0.2, -r2…), local amendment, "Edit draft wording", "Record that I reviewed", Adopt (blocked while markers remain), annual policy reviews, linked actions.
- [ ] Template library and document references (title, link, reference, version, owner, review date).
- [ ] Policy status in plain words. Procedures speak to "the pharmacist on duty".

## 8. Calendar
- [ ] This week and next (overdue from earlier weeks, this week, next week).
- [ ] Year plan with expected repeats and completed marks. Month view. Plan in plain words (find a date).
- [ ] Includes dated open actions, staff annual checks and (rebuild) credential expiries.
- [ ] Schedule a meeting.
- [ ] Rebuild: calendar feed (.ics) — owner decision.

## 9. History and exports
- [ ] History: every record (reviews, actions, meetings, setup changes), filters (pharmacy, search, source, record type, review, from and through dates), page through.
- [ ] Print or save a filtered PDF. Download a filtered CSV. Rebuild: readable rows with title, status, due date, resolution and who.
- [ ] Review detail download. Full history text per action.
- [ ] My log: what the owner reported or sent (date, what, to whom, reference).

## 10. Law and inspections
- [ ] S8 at a glance: inventory (s 111), who the law puts it on (s 108, s 122), where records are, S8 setup answers, open S8 actions, last checks, last sighted.
- [ ] Legal obligations: one line per Regulation section that applies, with where the evidence is kept and when last sighted.
- [ ] NSW Health dates and contacts. Sources screen (every rule's source).
- [ ] Incident steps (lost or stolen drugs, S8 destruction) from NSW Health pages.
- [ ] Evidence locations.

## 11. Pharmacy setup (settings)
- [ ] Pharmacy details. Proprietors and oversight (recording as …, switch reviewer). Services and configuration.
- [ ] Bought, selling or closing (what NSW Health requires). First visit after buying: inherited facts to confirm.
- [ ] Tell me once: a change to how DAAs are packed (in-house / outside packer / another pharmacy) shows only the dependent items, each Done or Later.
- [ ] Settings: last backup and changes since; backup download; restore with a receipt; storage status.
- [ ] More than one pharmacy on a device (switch, add). Directory of sites.
- [ ] Account or sign-in placeholders (not live).

## 12. Data protection
- [ ] Local storage (IndexedDB) and flush before reload. Cross-tab sync.
- [ ] Strict backup validation. Restore never silently replaces another pharmacy.
- [ ] Draft integrity: no overwrite by stale copies, conflict copies kept, an untouched session writes nothing.
- [ ] Every change goes to history (who, when, what). Configuration history.

## 13. UAT-only (not in the real app)
- [ ] UAT notes (page notes, setup question marks, synced to the UAT page).
- [ ] Example pharmacy (Wattle Grove, fictional), dates shifted to today.
- [ ] Reset test data.
