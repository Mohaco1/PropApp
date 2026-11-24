# Prompt for Gemini: critical review of R.Pharmacy

Paste everything below the line into Gemini, with this zip attached.

---

You are a senior product reviewer brought in to tear apart an app before real users see it. Be blunt and specific. Praise only what you can show is working. I'd rather hear an uncomfortable truth than a polite summary.

## The app
R.Pharmacy is a phone-first web app for the **proprietor (owner) of an NSW community pharmacy**. Its job is to help the owner do their legal and best-practice obligations without a barrage of information.

Principles:
- It's a helper, not a policeman.
- Proprietor only, with no staff logins.
- It isn't a QSPP accreditation tool, a drug register or a clinical record.
- It stores no patient data.
- The pharmacist in charge changes day to day, so the app deliberately doesn't track that role; the responsibility is the proprietor's.

## What's in the zip
1. **`app/rpharmacy-uat-testing.html`:** the whole app in one file.
   - Open it in Chrome. Use phone size (DevTools device mode, for example iPhone 13), because the owner mainly uses a phone.
   - To see a pharmacy that has been running for a year: tap **UAT notes** (bottom right) → **Open the example pharmacy**. It's Wattle Grove Pharmacy, all fictional.
   - Also set up a brand-new pharmacy from the first screen, so you experience onboarding as a new owner would. "Reset test data on this device" in UAT notes starts over.
2. **Briefs:** `HANDOFF-FOR-GEMINI-2026-11-24.md` (start here), then `HANDOFF-FOR-AI-2026-11-24.md`, `UAT-PROGRESS.md` (every version and decision) and `KNOWN-ISSUES.md`.
3. **Product notes:** `uat-notes-archive/` has the owner's own test notes, and `research/` plus `NSW-HEALTH-GAP-ANALYSIS.md` have the sources the app relies on.
4. **Code:** `layers/`, `build-uat.js` and `tests/` (Playwright), with the engine in `dev/proprietor-hub.html`. Read them if you want to check how something really behaves.

## How to work
- **Use the app hands-on before you judge it.** Do real tasks, as an owner would:
  - set up a new pharmacy with 3–4 services;
  - in the example pharmacy, work out what needs doing this week;
  - do a quarterly site visit and resume the extra one in progress;
  - close the fridge-log action;
  - mark an action as waiting on someone;
  - record a staff member's annual check;
  - find what is overdue for the S8 rules;
  - look at a procedure draft and what blocks approval;
  - export History.
- For each task, record the clicks it took, where you hesitated, and anything confusing, slow, hidden or broken.
- Separate what you **saw** from what you **infer**. Name the screen and the exact words on it. If you couldn't test something (for example, downloads, a real phone, a screen reader), say so; don't guess.
- Don't re-raise anything already listed in the handoff as known, decided or deferred, unless you think that decision is wrong. If so, argue it.

## Look at it from every angle
1. **First use and onboarding:**
   - Can a busy owner get set up in one sitting?
   - Is the length of setup honest?
   - What could be asked later?
2. **Daily and weekly use:**
   - Does Today tell me what matters in 10 seconds?
   - Does it nag?
   - What would make me stop opening it after week three?
3. **Workflow and information architecture:**
   - Do reviews, actions, staff checks, procedures and calendar fit together?
   - Are there duplicate paths, dead ends or circular navigation?
   - Is there one obvious place for each job?
4. **UI and visual design on a phone:**
   - hierarchy, density, tap targets, consistency, typography, empty states, error states, loading;
   - the bottom bar;
   - does it feel like a modern app or like a form?
5. **Words:** plain English, consistency of terms (action, task, review, check, visit), tone (helper, not policeman), jargon, length.
6. **Legal and best-practice coverage for an NSW proprietor:**
   - What obligations are missing, wrong, out of date or overstated?
   - Check against the sources in `research/`, and mark anything you can't verify against a primary source.
   - Watch for the app implying compliance it can't prove.
7. **Trust and data:**
   - records only in the browser;
   - backups and restore;
   - what happens if the phone is lost or the browser is cleared;
   - inspector-readiness of the History and exports;
   - privacy (is any patient data invited by free-text boxes?).
8. **Accessibility:** large text, screen readers, colour contrast, one-handed use, interruptions (a phone call mid-visit).
9. **Multi-site and edge cases:**
   - two pharmacies;
   - changing services;
   - a staff member leaving;
   - a locum;
   - a review done late or early;
   - the pharmacist in charge changing day to day.
10. **Engineering health:**
    - The app is one 1.9 MB HTML file with layers patching an engine. Is that a risk?
    - Look at test coverage, fragility and performance on a cheap phone.
11. **Commercial and adoption:**
    - Would an owner pay for this, and what's the one thing that would make them recommend it?
    - Who are the competitors or substitutes (paper, spreadsheets, existing pharmacy software, QCPP tools)?

## Challenge the previous AI
The app was built by Claude, working with the owner over many sessions. Its own view of the state of things is in the handoff files and `UAT-PROGRESS.md`. Challenge it directly:
- List what Claude **missed**, **got wrong**, or **claimed works but doesn't**, with evidence for each.
- Point out where it over-built (complexity the owner didn't need) or under-built (something essential treated as done).
- Call out any owner decision Claude accepted that you would push back on, and why.
- Put questions to Claude it should have asked the owner and didn't.

## What to hand back
1. **Verdict:** 5 lines. Is this ready for a real proprietor to trial for a month? If not, what blocks it?
2. **Findings table**, one row per finding:
   - ID;
   - area (from the list above);
   - what you saw (screen + exact words);
   - why it matters to the owner;
   - severity: Blocker, High, Medium or Low;
   - effort: S, M or L;
   - suggested fix.
   - Sort the table by severity.
3. **Top 10 gaps**: what's missing entirely, not just rough.
4. **Challenges for Claude**: numbered, each one answerable.
5. **Roadmap:**
   - **Now:** the next 2 weeks, to get to a safe one-month trial.
   - **Next:** 1–3 months, to get to a paid pilot with 3–5 pharmacies.
   - **Later:** 3–12 months.
   - For each item, say why it's in that slot, what it depends on, and how we'd know it worked (a measurable signal).
6. **Kill list**: features or screens you'd remove or merge to make it simpler.
7. **What you couldn't test**, and how to test it.

Keep it concrete. No generic advice like "improve UX". Every point should name a screen, a flow or a file.
