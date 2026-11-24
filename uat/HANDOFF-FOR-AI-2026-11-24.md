# R.Pharmacy: handoff brief for another AI or developer (24 Nov 2026)

Replaces HANDOFF-FOR-AI-2026-11-21.md (kept for history). That one described version 24; this describes **version 39** (v38 onboarding checklist and v39 design-review fixes are noted in UAT-PROGRESS.md).

## What the product is
- A **phone-first web app** that helps the **proprietor (owner) of an NSW community pharmacy** meet legal and best-practice obligations, in plain words, without a barrage of information.
- **A helper, not a policeman.** No patient data, not a drug register, not a clinical record, **not a QSPP accreditation tool**.
- **Proprietor only.** No staff logins. All responsibilities sit with the proprietor.
- **Nothing is approved, completed, closed or ticked off for the owner automatically.**
- **Live UAT:** https://claude.ai/artifact/Vnn6KXsNkkEe7Ywc3DbnWN (version 37).
  - Fictional data only.
  - Records are stored in the browser on that device.
  - There's a built-in "UAT notes" button.
  - Downloads (backup, CSV) don't work inside the claude.ai viewer; use a local copy.
- **Other pages:**
  - What's new walkthrough (phone screenshots): https://claude.ai/artifact/DF3upq1xeikd7vy4fnp57k
  - Tell me once mock-up: https://claude.ai/artifact/V2JphFVVfKZiaRd2YBQSqB
  - Sign-in and hosting options (decision doc): https://claude.ai/artifact/MnhrUaU5u1TxWgTuTHJu3P

## How it's organised (owner's view)
- **Today:**
  - a "Start a visit" card (or "Resume visit · N of M checked");
  - a quiet backup reminder only when needed;
  - "Start with these 3";
  - four filter buttons with counts: Overdue / Today / Started / All;
  - **More filters:** Upcoming (next 7 days, dates shown), Actions only, No date yet, To check, Waiting on someone;
  - a person's staff checks show as one job: "<name>’s checks · 2 due now · 6 upcoming".
- **Start a visit:**
  - Quarterly or Extra visit; an extra visit keeps the quarterly date.
  - Up to 3 things worth seeing, each with a reason. Earlier-visit follow-ups come first, then staff records (combined), then overdue and soon-due actions.
  - "Copy a list for the pharmacist on duty". It's copy only; nothing is sent.
  - Inside the site visit: **Last time** (the previous visit's issue and when its follow-up closed) and **Still open from an earlier visit** (with "Seen the fix? Close it").
  - Closing a side trip returns to the same check.
- **Reviews:** S8 inventory every 3 months (s 111); site visit; service reviews; annual governance; premises renewal.
- **Actions:** fixes the owner closes themselves.
  - **Waiting on someone:** what was asked for, plus a check-back date. The due date and status never change.
  - **Full history:** a timeline from the original finding to now, which can be copied.
- **Calendar:** weekly, year plan, month.
- **Staff:** credentials with expiry. An expired credential linked to an action keeps its expiry visible.
- **Policies:** procedures drafted from setup answers, citing sources.
  - Approval is blocked while "[Confirm]" or "— verify" markers remain.
  - Procedures speak to "the pharmacist on duty". Saved answers keep their validated value "Pharmacist in charge".
- **Services → DAA → Tell me once:**
  - record a change in how packs are made (in-house / outside packer / another pharmacy), with packer and start date;
  - before/after, then only the dependent items, tagged Required by law / Check / Recommended / Your procedure, with sources;
  - each item is Done, or Later (raises one ordinary action);
  - "Kept as it is": open actions, past reviews and dates are untouched;
  - reopening resumes the same change.
- **Pharmacy setup:** a phone list with icons.
  - **Your pharmacy:** details, proprietors, services, review due dates, "Bought, selling or closing".
  - **Law and inspections:** S8 at a glance, Legal obligations, NSW Health dates and contacts, Sources.
  - **Records:** My log, evidence locations.
  - **Settings:** includes "Last backup <date> · N changes since".
  - **The pharmacist in charge is not asked for.** It's rostered day to day, and the responsibility is the proprietor's. The law's mention (s 122) is kept as a source note.
- **First visit after buying** (state.inherited): "From the previous owner · confirm while you're here". The owner deprioritised buyer features; leave them as they are.

## Owner decisions (don't reverse without asking)
- **Overall approach:** helpful, not policing. No risk ratings. No "who is responsible" questions. Fictional data only. Never copy real pharmacy names, contacts or staff from the owner's Drive.
- **Pharmacist in charge:** not a proprietor-facing role. Not recorded, no "Tell me once" for it.
- **Staff checks:** stay in Staff, shown as one Today job per person. A separate action only for a gap (D1).
- **Meeting minutes:** pre-fill the next meeting (D2).
- **Deferred:**
  - inspector pack / inspection-day mode;
  - multi-store summary;
  - push reminders;
  - Monday plan;
  - buyer features.
- **Leave as is:** the vaccination "record the GP" wording conflict.
- **Open:** sign-in and hosting (D3). See the decision doc; Claude recommends a managed back end in Sydney.
- **Old UAT notes:** 9 notes on the link are to be disregarded. Don't action them, don't delete them.

## Sources applied (see uat/research/ and the Sources screen)
- **Medicines, Poisons and Therapeutic Goods Regulation 2026 (NSW):**
  - s 108–112 (register; responsible person = financial-interest holder);
  - s 111 (S8 inventory every 3 months);
  - s 122 (S8 storage; names the pharmacist in charge);
  - s 136–137 (DAA labelling and third-party packing);
  - s 185 (records 2 years);
  - and others.
- **NSW Health Pharmaceutical Services site** (crawled 20 Nov). The **Dose Administration Aids page was re-read live 24 Nov** (current as at 4 Sep 2026):
  - reference number on third-party packs;
  - manufacturing instructions;
  - consent "should" for third-party packing, "must" before prescriptions move to another pharmacy;
  - TGA licence: "contact the TGA". The FAQ says packers need a GMP licence, so the app shows this as **Check**.
- **Pharmacy Council of NSW:** proprietor duties; premises standards; displayed names (Guide Note 24): owner names at the entrance, and the name of the pharmacist in charge on duty next to the dispensary.
- **Pharmacy Board:** Guidelines on the safe provision of pharmacy services (1 Oct 2026); compounding; CPD.
- **Codex-researched:** TGA, OAIC/IPC privacy, Strive for 5, Fair Work. Already applied.

## Quality state
- **Every bug from Codex's v27 retest is fixed** (v33). One test per case: tests/retest-fixes.js.
- **Automated accessibility:** axe-core WCAG 2.0/2.1/2.2 A and AA on 10 pages and 5 windows at phone size, with zero violations (tests/a11y.js).
- **320 px with large text:** no sideways scroll (tests/small-screen.js).
- **All suites pass** except the known-stale uat-functional.js.
- **Still needs a person:**
  - a real phone;
  - VoiceOver/TalkBack;
  - restore in a clean browser end to end;
  - the 11 other services by hand;
  - timing an ordinary month.

## Technical notes (for a coding agent)
- **Repo and engine:**
  - Repo: /home/user/rpharmacy/uat, branch conceptd-frontend. There's no remote, so commits are local.
  - Engine: dev/proprietor-hub.html (v27). **Never edit it.** All behaviour comes from layers that reassign globals.
  - Build: `node build-uat.js` writes app/rpharmacy-uat-testing.html and prints the build id and SHA-256. Log both in UAT-PROGRESS.md for every publish.
- **Layer order:** conceptD-frontend (CSS + JS), s8-rule, express, review-finish, setup-questions, procedures, service-done, otp-parts, tidy, backup-fix, confirm-fallback, inspection, nsw-health, helpers, today-guide, words, codex-fixes, **visit, waiting, change, retest-fixes, onboard, calm**, integrity, uat-tools.
- onboard.js: setup map on the first screen, step counters, Today setup checklist (`RPH.ob`). calm.js: one top card, status sentence, one way into a visit, phone action screen, bottom confirmations, bottom bar, short dates (`RPH.calm`, `RPH.shortDate`).
- **Newer layers:**
  - **visit.js:** Start a visit, the pharmacist-on-duty list, Last time, the staff queue, backup status and restore receipt (`RPH.visit`, `RPH.rec`).
  - **waiting.js:** Waiting on someone and Full history (`RPH.wait`; stored as `t.waiting` plus activity entries).
  - **change.js:** Tell me once for DAA, and inherited facts (`RPH.chg`; stored in `state.serviceChanges`).
  - **retest-fixes.js:** export correction from each record, credential expiry, In progress drafts, history verbs, on-duty wording (`RPH.rtf`).
  - **integrity.js:** draft guard, plus the "untouched session writes nothing" rule (`RPH.ig.touched`, trusted events only).
- **Namespace clashes have bitten twice.** `RPH.bk` belongs to backup-fix and `RPH.rf` to review-finish. Grep before naming a new `RPH.*`.
- **`CD.act` is cleared on every repaint.** Register click handlers with `CD.a(fn)` inside templates.
- **Tasks:** must be created with `taskNew(n,id,{text,owner,due},source)`. Backups validate strictly. Tasks may carry extra fields; setup answers may not.
- **Tests:**
  - Playwright suites in uat/tests/*.js, run with `node tests/<name>.js`.
  - Shared helper: tests/lib-setup.js (a real setup, so backups validate). The showcase seed itself does not validate for backups.
  - Simulate typing with `p.fill` or clicks. Script-dispatched events no longer count as owner edits.
- **Docs:** UAT-PROGRESS.md (every version), GAMEPLAN-CODEX.md, KNOWN-ISSUES.md, ASSESSMENTS-2026-11-21.md, NSW-HEALTH-GAP-ANALYSIS.md, research/.
- **Design studio:** /home/user/rpharmacy/design-studio (and the zip). The live frontend is Concept D. Don't overwrite the studio or delete past designs or feedback.

## Useful next work
1. Decide D3, then build step 1 of the recommended path (own address, emailed-link sign-in, saving to Sydney) on the UAT copy.
2. The owner's own live run and fresh UAT notes.
3. Only if asked: "Tell me once" for starting or stopping a service.
