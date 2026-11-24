# Previously agreed features: status in UAT v28

Sources: `records/UAT-FEEDBACK-REGISTER.md`, your Round 2 and 3 notes, and the app itself. I haven't added or reinterpreted any decisions.

| Area | Status | Notes |
|---|---|---|
| Proprietor-only access | **Implemented** | Agreed 18 Nov. "Recording as" chooses which proprietor is recording; it isn't a sign-in. There are no staff or manager roles. |
| Action-first dashboard | **Implemented**, one part **partial** | Priority checks, coloured counts, filters and the detail panel are all there. Concept D's one-line **"Why it's here"** reason under each item was **not built**: it needs new wording for every item type (see suggestions). |
| Audits and reviews | **Implemented** | Due Now, Upcoming, Completed, All Audits and Calendar; drafts; amending a review; adjusting intervals. |
| OTP monthly check-in and comprehensive review | **Implemented** | Both are in the review list, along with the OTP daily-volume threshold review. OTP setup walks all 22 screens. |
| S8 stock check | **Implemented**, one **gap** | The legal basis is s 111 (every 3 months). The gap: the 3-month limit is checked when you complete a review, but **not** in the "Change due date" dialog, so a due date can be moved more than 3 months out (with a reason). This was already the case in v27. See Known issues K-01. |
| DAA | **Implemented** | 19-screen setup, Regulation 2026 checklists, tasks raised once. |
| Staff assurance | **Implemented** and restyled | Annual assurance, individual checks, credential expiry, change-triggered reviews, departure, evidence and history. |
| Policies and procedures | **Implemented** | My Procedures, Template Library, the procedure builder, .docx export, annual policy reviews. |
| Meetings and check-ins | **Implemented** | Staff safety meeting, Proprietor check-in and governance meeting scheduling; minutes; duplicate agenda. |
| Calendar recurrence and due dates | **Implemented** | The next date is set when a review is completed. Changing a date needs a reason when it's pushed later, and an overdue date can't be removed. The Year plan shows only real dates (recorded and next due). Projecting future repeats is **undecided**. |
| Tasks and actions | **Implemented** | Raised once, no duplicates, not raised again after completion unless the answer changes. |
| History and evidence | **Implemented** | 8 filters, records open, evidence locations. |
| Exports | **Implemented** | History CSV and private JSON, procedure .docx, meeting copies, review text, backup file. Downloads are blocked inside the claude.ai viewer (as before), so use a local copy for exports. |
| Pharmacy switching | **Implemented** | One pharmacy at a time, with a new header switcher. An **"All pharmacies" combined view** (shown in Concept D) is **not built** and needs your decision. |
| Mobile usability | **Implemented (automated only)** | No sideways scrolling, 44px+ targets in the new parts, full-screen editor. **Not yet tried on a real phone.** |
| Keyboard shortcuts J/K and 1–4 (Concept D) | **Not built** | Only Ctrl/⌘K was added. The audit editor is unchanged. Listed as optional. |
| Earlier open items still open | **Undecided** | QSPP proposals Q-01 to Q-05 (staging copy only); vaccine, screening and compounding pick-lists; the "storage blocked" screen. All are unchanged by this work. |
