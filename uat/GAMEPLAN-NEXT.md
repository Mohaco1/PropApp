# Game plan (owner, 20 Nov 2026). Resume here after a usage break.

**Goal:** an app where a proprietor can meet all their legal and best-practice obligations. It must be super mobile-friendly, with good UI/UX and not a barrage of information. The owner has given free rein to make fixes that fit this goal.

## Steps
1. **Finish the current work:** crawl the missing sources and fold the findings in simply.
   - [x] NSW Health (done, v22)
   - [x] Pharmacy Council of NSW (done, applied)
   - [x] Pharmacy Board of Australia (done, applied; the new safe-provision guideline applies from 1 Oct 2026)
   - [blocked] TGA: the site refuses the browser tool. The owner could drop the PDFs into Drive.
   - [blocked] Privacy: OAIC (Cloudflare) and IPC NSW refuse the browser tool.
   - [blocked] Strive for 5: health.gov.au refuses the browser tool. The NSW Health summaries are already applied.
   - [x] NSP (NSW Health GL2023_002, applied)
   - [blocked] Absence-from-work certificates: Fair Work refuses the browser tool.
   - PPA proposals: still waiting on owner approval (PROGRAM-RULES-REVIEW.md).
2. **Assess as a PRU officer again.**
3. **Assess as a UI/UX designer again.**
4. **Assess as a workflow / SaaS expert.**
5. **Apply fixes** where they fit the goal.
6. **Assess as a first-time proprietor** who just bought a pharmacy.
7. **Make and apply the changes** that assessment suggests.
8. **Own assessment:** what I think.

## Owner decisions already made (20 Nov)
- The app helps; it doesn't police.
- **My log:** built (v23, unpublished).
- **Per-person staff records:** built (suggestions plus expiry reminders).
- **S8 review split:** construction checks once a year; register, keys and codes quarterly. Built.
- **Inspector pack:** later.
- **Risk rating:** not wanted.
- **Vaccination GP wording:** not a big deal; leave it.
- **Sign-in and hosting:** assess later.

## Working rules
- Fictional data only. No patient data.
- Proprietor only. Not a QSPP tool.
- Nothing is approved or completed automatically.
- Test with Playwright suites, commit, then publish to https://claude.ai/artifact/Vnn6KXsNkkEe7Ywc3DbnWN.
- Mark UAT notes "Fixed – retest".

## Status 21 Nov 2026 (v24 published)
- Steps 1–8 done in a first pass. See ASSESSMENTS-2026-11-21.md.
- **Applied:**
  - phone UX (rows open on tap; Today top 3 + 8; grouped setup; shorter summary);
  - new landing copy;
  - "Bought, selling or closing" for new owners;
  - "How this app works" card;
  - plainer labels.
- **Next candidates:**
  - shorten the Reviews summary sentence;
  - explain Reviews vs Actions inline;
  - optional: hide table column headings on phones;
  - provide documents from blocked sites (TGA, OAIC/IPC, Strive for 5, Fair Work).
- **Owner later:** inspector pack; sign-in and hosting.
