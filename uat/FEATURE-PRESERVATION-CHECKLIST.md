# R.Pharmacy: feature preservation checklist (Concept D UI)

**Baseline:** dev copy `dev/proprietor-hub.html` (version 27), captured 19 Nov 2026 with fictional seed data. The baseline screenshots and UI inventory are in `uat/baseline/`.
**Target:** `uat/app/rpharmacy-uat-v28-conceptD.html`.
**Rule:** the new UI is a presentation layer. Business logic, compliance content, scheduling, storage and permissions are reused unchanged.

Status key: **Kept** (same control, restyled) · **Moved** (same function, new place) · **New** (added view; reads existing data, writes nothing new) · **Not built** (needs your decision).

## 1. Shell and navigation
| Existing feature | Where it is now | In Concept D | How it's tested |
|---|---|---|---|
| Sidebar nav: Overview, Audits, Tasks, Staff & credentials, Policies & documents, Meetings, Services, History, Pharmacy setup | Left sidebar (`body>nav`) | **Moved:** same buttons as top tabs on desktop, plus a new Calendar tab | Click every tab; check the page heading |
| Mobile bottom bar (Overview, Audits, Tasks, More) | `.mobilebar` | **Kept, restyled** | Tap each at 390px |
| Brand and caption | `body>header` | **Kept** in the new top bar | Visual |
| "Recording as" chip (current reviewer) | Header | **Kept** in the top bar | Visual; opens the existing chooser |
| Pharmacy switching (separate stores, switching reloads the app) | Overview site selector and Setup | **Kept**, plus a header switcher using the existing `chooseSite()` | Two fictional sites; switch; check name and data |
| "All pharmacies" combined view | Doesn't exist | **Not built.** New functionality; listed under decisions | — |
| Detail dialog (`#editor`, modal) | Centred modal | **Kept, restyled** as a right-hand side pane on desktop and a full sheet on mobile; still modal, same focus handling | Open several editors; close with the button and Esc |

## 2. Today / Overview
| Existing feature | In Concept D | Test |
|---|---|---|
| Setup progress card and "Continue setup" | Kept, restyled | Visible on an incomplete setup |
| Summary counts (Overdue, Upcoming, Open Tasks, Need a date, To verify) | Kept, restyled as a status line with coloured words | Counts match baseline values |
| Priority checks list with filter, area and quick filters (All / Overdue / Next 30 days) | Kept, restyled as a hairline queue | Filters still change the list |
| Context panel for the selected row | Kept, restyled as D's detail pane | Select a row; the panel opens |
| Overview site selector | Kept | Visible |

## 3. Audits and reviews
| Existing feature | In Concept D | Test |
|---|---|---|
| Tabs: Due Now, Upcoming, Completed, All Audits, Calendar | Kept. "Calendar" stays and also links to the new Calendar page | Each tab renders |
| Search, Filters (include inactive services) | Kept | Search narrows the list |
| "Need a date" list (never reviewed) | Kept | Present |
| Adjust audit intervals | Kept | Opens |
| Review editor (`reviewEditor`), drafts and amend review | Kept | Open a review; save a draft |
| Due-date change with reason (`RPH.schedule.dialog`) | Kept; also reachable from the new Calendar | Open from the Calendar; rules apply |
| OTP monthly check-in, OTP comprehensive review, OTP daily-volume threshold | Kept (catalogue unchanged) | Listed |
| S8 stock check (proprietor review) and S8 evidence | Kept | Listed |
| DAA in-house packing review | Kept | Listed |

## 4. Calendar (changed as you asked)
| Existing feature | In Concept D | Test |
|---|---|---|
| Month grid (`drawMonth`), day list, Previous/Today/Next | Kept inside Audits; **New** Month tab on the Calendar page using the same grid data | Navigate months; select a day |
| Schedule meeting on a day | Kept; also on the Month tab | Opens the existing dialog |
| Weekly breakdown (This week / Next week / later) | **New** view of `entries()` and the meeting schedule | Items appear in the right week |
| Year plan grid (row per review × 12 months) | **New** view from the schedule and completed reviews | Done, overdue and planned marks match the data |
| Plain-words box (screenshot 3) | **New**: finds a matching item and date, then opens the existing date dialog prefilled. Never saves on its own | No record changes until you confirm |
| "Busy month" note (screenshot 2) | **New**, informational only. Each item links to the existing date dialog | No automatic changes |

## 5. Tasks / Actions
| Existing feature | In Concept D | Test |
|---|---|---|
| Counts (Outstanding, Overdue, Completed), search, advanced filters, Add Task | Kept, restyled | Add a task; filter |
| Task editor, linked source, open existing task, View in Tasks | Kept | Open a task |
| Raised once, de-duplicated, not re-raised after completion | Unchanged logic | Existing test suite |

## 6. Staff assurance (Concept B style, as you asked)
| Existing feature | In Concept D | Test |
|---|---|---|
| Staff summaries (Active, Needs review, Coming up), other staff views, find staff, Add staff member | Kept; register restyled with B-style status columns | Add a fictional person; the row appears |
| Person record (`openStaff`), credentials (`credentialEditor`), verification (`verificationForm`) | Kept | Open a person; add a credential |
| Annual assurance, change-triggered reviews (Review a change), departure checklist | Kept | Buttons present and open |
| Expiry monitoring (`checkStaffExpiry`), staff tasks | Unchanged logic | An expired credential shows its status |

## 7. Policies and documents
| Existing feature | In Concept D | Test |
|---|---|---|
| Tabs: Policies & procedures, Forms & templates, Official guidance, Audit evidence | Kept, restyled | Each tab renders |
| Sub-tabs: My Procedures, Template Library, Procedure checklist, Supporting records | Kept | Each renders |
| Add Policy, Annual policy reviews, status filters, search, category | Kept | Filters work |
| Procedure builder, export (.docx), print this version, versions | Kept | Opens |
| Service setup wizards (17 services) | Kept, unchanged | walk-all suite: 17/17 |

## 8. Meetings, History, Services, Setup, Backups
| Existing feature | In Concept D | Test |
|---|---|---|
| Meetings: list, Add/New meeting, duplicate agenda, minutes export, print | Kept, restyled | Open the meetings page and a new meeting |
| History: filters (8 fields), CSV export, private JSON export, record open | Kept, restyled | Filters present; export buttons present |
| Services: library, configure, disable, software register | Kept, restyled | Configure opens |
| Pharmacy setup: steps, service selection, intervals, sites, holders | Kept; service step restyled as tiles with "Your plan so far" | Setup runs end to end |
| Backup: download and restore (`backupPanel`, `validateBackup`) | Kept | Panel present; account backup test passes |

## 9. Rules that must not change
- Proprietor-only; "Recording as" reviewer attribution.
- Nothing is approved, completed or closed automatically.
- Due dates change only through the existing dialogs, which require a reason where the rules say so.
- Compliance content and sources are unchanged; no new legal requirements are added.
- Storage format and keys are unchanged (IndexedDB `rph-fresh-start`, the same state shape). The UI layer adds no new saved fields.

## 10. Results (19 Nov 2026)
Every row above marked **Kept**, **Moved** or **New** was checked by automated tests at laptop and phone sizes (see `TEST-RESULTS.md`):
- **Kept:** the control inventory matches v27 on all 8 pages. The 7 existing suites produce identical output, and the 17/17 service walk-throughs are identical.
- **Moved:** navigation and the editor pane, checked by the functional and second-verification tests.
- **New:** the Calendar tabs, plain-words box, busy-month note, staff matrix and pane, onboarding tiles and plan, header switcher and jump search. Tested, and none of them saves data on its own.
- **Not built:** the "All pharmacies" view, onboarding presets, "Why it's here", and the J/K and 1–4 keys. See `OUTSTANDING-DECISIONS.md`.
- **Rule check:** the "Rules that must not change" (section 9) all held in testing. One pre-existing gap was found: the S8 3-month limit isn't applied in the due-date dialog (`KNOWN-ISSUES.md` K-01). It wasn't changed.
