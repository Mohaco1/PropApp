# Outstanding decisions

| ID | Question | Options | Current UAT behaviour |
|---|---|---|---|
| D-1 | "All pharmacies" combined view (Concept D's scope switch) | **Decided 19 Nov:** later, after the pilot | Not built. Switch one pharmacy at a time from the header. |
| D-2 | Plain-words "Add": should it ever save directly? | **Decided 19 Nov:** keep confirm-first | Opens the existing dialog prefilled; you confirm. |
| D-3 | Year plan: show expected future repeats? | Next due only / add "Expected" marks | Next due only. |
| D-4 | Busy-month note: when should it appear, and should it suggest dates? | **Decided 19 Nov:** keep as is (5+ reviews; lists items with Change date; never suggests or moves dates) | Appears at 5+ reviews, or 4+ and 1.5× the average. Only lists items with "Change date". |
| D-5 | Onboarding presets: which presets and which services? | **Decided 19 Nov:** no presets (Express onboarding instead) | Not built, by decision |
| D-6 | S8 date limit in the date dialog (Suggestion C-1) | **Decided:** approved, with a 7-day planning window when overdue | Built in v32 |
| D-9 | s 111(3): reminder when a new person takes control for a month or more | **Decided:** yes; trigger to be decided later | Deferred, not built |
| D-7 | "Why it's here" wording (Suggestion R-1) | **Decided 19 Nov:** check during testing | Built (factual lines); review in UAT |
| D-8 | Carried over: QSPP proposals Q-01 to Q-05, pick-lists, storage-blocked screen | **Decided 19 Nov:** move to Phase 3 | Unchanged; parked for Phase 3 |
| D-10 | Year plan expected repeats (Phase 2) | **Decided 19 Nov:** show "Expected" marks, clearly labelled | Built in v35 |
| D-11 | One question at a time in every review (Phase 2) | **Decided 19 Nov:** all reviews where it suits, keeping drafts and amendments | Built in v35 |
| D-12 | Express onboarding (Phase 2, after testing) | Build / don't | **Agreed in principle (19 Nov):** pharmacy-specific questions only; standard arrangements filled in and marked "Assumed – confirm", never recorded as compliant; procedures can't be approved until confirmed; one "assumptions to confirm" item on Today; switch any service to Detailed. **19 Nov: owner asked Claude to decide the question list and defaults and add Express to UAT for one large test.** Built in v35 (see V35-PHASE2.md); defaults to be source-checked in Phase 3 |

**Phase 2 status (19 Nov 2026):** every decision is made and built, or parked on purpose. The Express assumption list is approved for UAT; its defaults are source-checked in Phase 3.

## Parked from UAT notes (19 Nov 2026)
- P-1 Google address lookup on Pharmacy details: Phase 5. Needs online hosting, a Google API key and sends the typed address to Google; blocked by the app's no-outside-connections rule today.
- P-2 Landing page: redesign via a design brainstorm before the next rebuild.
- P-3 Download backup on the artifact link: viewer blocks file downloads; add the downloads capability or rely on Save to account (Phase 3).
- P-4 Pharmacist prescribing services list: update from the new pharmacist prescriber course (owner to supply the list).
- P-5 Source-check in Phase 3: OTP file-review interval, compounding categories, screening checks list, drafted procedure steps (S8 delivery, anaphylaxis, aged care handover, sharps, certificates, vaping).

## P-6 (20 Nov 2026) Vaccination record: is the patient's GP still required?
- **The two sources disagree:**
  - The NSW Pharmacist Vaccination Standards (5 Nov 2026) still list "primary medical practitioner" in the record, citing the old 2008 Regulation clause 48A.
  - NSW Health's "Legislation changes for pharmacists" page says this is no longer required.
- **Suggestion:** ask NSW Health through the online enquiry form. The app is unchanged until then.
