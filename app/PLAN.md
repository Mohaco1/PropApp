# Rebuild plan (living document)

Inputs:
- the 25 Nov phone audit (`uat/audit-2026-11-25/`);
- Gemini's critique (24 Nov);
- Gemini's research doc "Product Lead Research: UI, Workflow & Cross-Niche Playbook" (24 Nov, owner's Drive).

Standing rules are in `/CLAUDE.md`.

## How the app is organised: four modes
Taken from Gemini's research.

| Mode | The owner's job | Main screens |
|---|---|---|
| 1. Weekly glance | "Is anything legally overdue or expiring this week?" in 10 seconds | Today, Calendar, calendar feed |
| 2. Site visit | Walk the pharmacy, check last time's fixes, note issues, survive a phone call | Start a visit, visit steps, inline action close |
| 3. Life happens | Someone leaves, a locum covers, a service starts or stops, the premises change | Staff, Services, Setup |
| 4. Proof | Show an inspector clean, chronological proof of oversight | History, export |

The mental model behind it: **Rules → Checks → Fixes → Proof**:
- Law and inspections;
- Reviews and Staff;
- Actions;
- History.

## Adopted from Gemini's research
- **Today:**
  - one data selector powers every count;
  - "Required by law" pinned first;
  - one card per person;
  - one S8 row;
  - a strict 7-day Upcoming filter.
- **Setup:**
  - core setup in 3 short steps;
  - then a separate service checklist (To do / In progress / Done), with each service showing its own progress. This matches the owner's own UAT note.
- **Actions:**
  - tapping a row opens the action sheet directly;
  - "Seen the fix · close it" shows only Resolution + Save.
- **Annual staff check:** quick confirm. Each item comes pre-filled with last time's result, then Still current / Update / Issue.
- **Procedures:** two buttons only, Edit draft and Adopt. A "[Confirm: …]" blocker jumps straight to the field or setup question.
- **Site visit:**
  - quarterly and extra visits stored separately;
  - close an earlier action inline during the walk;
  - auto-save that survives a phone call.
- **Staff leaving:** the existing departure checklist (keys; IT access; handover) gains the S8 items from the NSW Medicine Storage Standards. Personal safe codes or biometrics are removed, and electronic drug register access is removed (`uat/NSW-HEALTH-GAP-ANALYSIS.md` G1).
- **Locum quick check:** register checked, temporary register access, keys or codes returned at the end.
- **Calendar:** staff credential expiries appear in Calendar as well as Today.
- **Export:** plain-English History CSV and print, with:
  - title;
  - type;
  - recorded by;
  - status;
  - due date;
  - completed date;
  - resolution.
  No internal codes.
- **Craft:**
  - 44 px targets;
  - bottom-bar icons plus labels;
  - one date style;
  - one vocabulary (Extra visit, Today, Annual check);
  - "No patient names or identifiers" under every free-text box.
- **Reminders:** a private calendar feed (owner decision: yes).

## Adjusted
- **The pharmacist-in-charge sign.** The site visit already checks displayed names (Council Guide Note 24: owner names at the entrance, the on-duty pharmacist's name by the dispensary). It stays a premises check: "the sign shows today's pharmacist". There's **no** roster field. Owner decision: the proprietor is responsible whoever is on duty, so the app doesn't track who was in charge.
- **Voice notes.** The phone keyboard's dictation already works in every text box, so nothing to build. Make text boxes large enough to dictate into.
- **"Tell me once" for starting or stopping any service.** Build after parity. The owner previously said "only if asked", so it waits for the owner's go.

## Not now
- **Photo attachments.** A photo of a fridge log or shelf can easily capture patient labels, which breaks the no-patient-data rule. Photos also don't fit in browser-only storage. Revisit after sign-in and hosting (D3), with a clear warning. A link to an existing Drive or SharePoint folder is fine now.
- **Pharmacy Council notification triggers** (renovation, name change, ownership change). Add only after checking each trigger against the Council's own pages.
- **Monday email digest and co-owner logins.** These need a server (D3).
- **Pricing (A$39–69/month).** Not a build decision. The figure is anchored on a UK hospitality app.

## Corrections to the research doc
- **Departure checklist.** It says moving someone to Former should bring up a checklist. One already exists (Staff → person → Departure checklist). It just lacks the S8 and electronic register items.
- **Unverified claims.** Its competitor descriptions (StrongER, PracticeHub, ClinicComply, Mitti, Trail and others) are unverified here. Treat them as background, not facts to rely on.
