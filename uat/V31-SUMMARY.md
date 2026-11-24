# UAT v31: Concept D throughout (overnight 19 Nov 2026)

**Link:** https://claude.ai/artifact/GJdNKqu2XqNjUWJT1CD1M1. It's new and private. v30 and v29 keep their own links and test data.
**Built from:** v27 engine (unchanged) and `uat/layers/`. Git branch `conceptd-frontend`, with commits for each step.

## What changed since v30
| Area | v30 | v31 |
|---|---|---|
| Today, Reviews, Actions, Calendar, Staff, Policies | Concept D pages, with the old screens still drawn hidden underneath | **Concept D only.** The old screens are no longer drawn for these pages. |
| Meetings, Services, History | Old screens in the Concept D style | **Concept D pages** (table and detail pane), calling the existing editors directly |
| Staff record | Old screen | **Concept D page**: requirements, credentials, history, and all actions (Annual assurance, Review a change, Edit profile, Departure checklist, Verify, Add credential) |
| Hidden-screen workarounds | "Adjust intervals" and "Schedule meeting" worked by clicking buttons on the hidden old screen | Both removed. They now call the real functions (`openIntervals`, and the same meeting dialog code) |

**Still using their existing screens** (in the Concept D frame and style):
- **Pharmacy setup**, because its forms are complex. The next candidate.
- **The policy template library.**
- **History · "Filters, exports & backup"**, which keeps every export exactly as in v27.

## Fixes from my design review
I compared every page against the prototype with matching example data, with test notifications hidden. Fixes made:
- **One line per row** on a laptop, with fixed columns: names cut short with "…", and the full text in the detail pane.
- **Columns line up** between sections; short values no longer wrap.
- Today has the prototype's **"Pharmacies" summary table**, and the setup progress is now a slim line.
- **Wording:**
  - "Your plan" instead of "Your schedule".
  - "Unselected proprietor" no longer appears in Last done.
  - Duplicate dates removed.
  - "Due 29 Dec 26" capitalised correctly.
- **Actions:** empty groups hidden, and long notes in the trail limited to three lines.
- **Policies:** the line under each procedure shows status and next review instead of the file location.
- **Calendar Month:** when the chosen day is empty, the detail pane lists what needs planning, with Plan / Set date.
- **Year plan** fits all 12 months without sideways scrolling.
- **Phone:** a single pharmacy shows compactly beside "R." instead of taking a whole row.
- **Bugs found and fixed:**
  - The phone bottom bar stayed disabled after setup.
  - A closed Site visit window stayed visible (from v29).

## Tests (all on v31)
| Test | Result |
|---|---|
| `tests/cd-functional.js`: every journey at laptop and phone size (setup, navigation, reviews with keys, due dates and reason rule, plain words, meetings, actions add/close, staff list and record and all its actions, policies, services activate/disable, history and exports, search, recording-as, pharmacy switching, no sideways scroll, old screens not drawn) | **116/116** |
| `tests/uat-phoneview.js` | **9/9** |
| Original v27 suites (check-buttons, labels, records, doc, acct, multi) | **Identical to v27** (check-ui differs only in colours) |
| 17 service setup walk-throughs | **Identical to v27** |
| `tests/engine-side-effects.js`: opening pages changes no saved data | **No changes** |

Comparison images (prototype on the left, app on the right, laptop and phone): `uat/comparison/v31/`.

## Waiting for you
- **S8 rule:** the exact wording of s 111 and the proposed fix are in `S8-RULE-FOR-APPROVAL.md`. Nothing has been changed yet.
- **Decisions D-1 to D-8** and the reviewer's NEW-1 to NEW-3. You said you'd accept the reviewer's recommendations, so I've followed them; nothing has been decided against them.
- **Real phone and laptop test.**

## Next (my suggestion)
1. Approve the S8 fix, which I'll then build and test across every way of changing a date.
2. Pharmacy setup as a Concept D page.
3. The extra safety tests the reviewer listed: amendments, reopening, backup/restore, two pharmacies.
4. Your UAT on a real phone.
