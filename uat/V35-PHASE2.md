# UAT v35: Phase 2 features for one combined test (19 Nov 2026)

**Link:** https://claude.ai/artifact/VgtSt4SbfGzuchoPmMFQGj. Built on v34; the v27 engine is unchanged.

## New
1. **Express onboarding** (`layers/express.js`). Choose "Express" or "Detailed" on the services step. Express asks only what's specific to your pharmacy:
   - **Always asked:** which arrangements, medicines, programs and funding; yes/no scope questions; who does what; providers; software.
   - **Assumed standard arrangement, marked "Assumed – confirm":** OTP LAIB area and storage, take-away preparation, dosing area; DAA list check, final check, medication changes, S8 placement and storage; delivery failure and escalation; staged supply missed collections; adherence interruptions.
   - **Never assumed, marked "Needs verification":** anything that claims evidence (registration, PBS approval, documented procedures, consent, claims).
   - **Left to add later, marked "Needs verification":** record locations and references.
   - **Afterwards:** assumed answers appear on Today (To verify) and Policies, each with **Confirm** or **Change answer**. **A procedure can't be approved while its service has unconfirmed assumptions.**
   - **Measured:** for DAA, OTP and Home delivery, Express asked **26 questions instead of 50**.
   - The defaults must be source-checked in Phase 3.
2. **Year plan "Expected" repeats.** A quiet ring marks each later repeat, worked out from the review's own interval; it's never a set date. Solid marks stay for real dates. The busy-month note counts real dates only.
3. **One question at a time in every review**, not just the site visit. Each step has Previous / Save and next, keys 1–4 and a steps list. Date, notes and next-date fields stay visible. If you press Complete with a question unanswered on a hidden step, the screen jumps to that step.

## Decisions recorded
| Decision | Answer |
|---|---|
| Presets | No presets |
| "Why it's here" wording | Check during testing |
| Handover trigger | Decide later |
| Express | Built as above |

## Tests (v35)
| Test | Result |
|---|---|
| `cd-functional.js` | 142/142 |
| `express.js` | 14/14 |
| `review-steps.js` | 7/7 |
| `s8-rule.js` | 20/20 |
| `s8-complete.js` | 5/5 |
| `uat-phoneview.js` | 9/9 |
| v27 suites | identical (check-ui colours only) |
| 17 service walk-throughs | identical to v27 |
| Opening pages | changes no data |

## Known limits
- **Change answer** on an assumed answer opens that question and then continues through the rest of that service's questions before saving. This is the same as v27's verify flow.
- **Back during Express** skips over the assumed questions.
