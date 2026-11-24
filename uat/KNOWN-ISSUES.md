# Known issues: UAT v28

| ID | Area | Issue | Severity | Was it in v27? | Action |
|---|---|---|---|---|---|
| K-01 | S8 stock check · Change due date | The dialog doesn't apply the 3-month limit (s 111) that the review form applies, so the next S8 date can be moved more than 3 months out with a reason. The new "Plan in plain words" reaches the same dialog. | High (compliance) | Yes | **Fixed in v32** after owner approval (see V32-S8.md). |
| K-02 | Year plan | Shows only recorded reviews and the next due date, not future repeats, so months further ahead look empty. | Low | New view | Decision D-3 |
| K-03 | Plan in plain words | Simple matching. A vague phrase can pick the wrong review, which is why it always shows the match and asks you to confirm in the date dialog. Time of day isn't stored. | Low | New | Check during UAT |
| K-04 | Staff matrix | v28–v29 matched rows to people by name. | Low | New | **Fixed from v30**: the Concept D staff page uses record IDs |
| K-05 | Onboarding | "Your plan so far" counts reviews from the review list. For some services the count is 0 until setup questions are answered. | Low | New | Check wording during UAT |
| K-06 | Notifications | Inside the services dialog, the notification bar sits at the top of the dialog, as in v27. | Cosmetic | Yes | None |
| K-07 | Downloads | Exports and backups don't download inside the claude.ai artifact viewer. | Medium | Yes | Use the laptop copy for exports |
| K-08 | Real devices | Not tested on a real phone, Safari or a screen reader. | Medium | — | UAT walkthrough |

## Browser confirm boxes are blocked in the artifact viewer (found 20 Nov 2026)
The viewer silently answers "no" to the browser's confirm() box. UAT Reset and Delete note now use a two-tap button instead (fixed, tested with confirm blocked).
The app's own 8 confirm() questions (e.g. "Close and discard your unsaved changes?") now fall back to an in-app dialog when the browser box is blocked (layers/confirm-fallback.js): Yes repeats the click or closes the window once; where the browser box works it is used as before. Fixed 20 Nov 2026, tests/confirm-fallback.js 10/10.

## Backups failed for Express users and for multi-tick answers (fixed 20 Nov 2026)
See UAT-PROGRESS v13. If you used Express before this fix, open the app once on the new version: the old draft values are converted automatically, then Download backup / Save to account work.

- (20 Nov 2026) **tests/uat-functional.js is stale.**
  - It times out on the last committed build too, so this is not a regression.
  - It isn't part of the standard suite list; the newer suites cover its flows.

- (23 Nov 2026) **tests/showcase-seed.js fails backup validation** ("Invalid service configuration").
  - This is a test fixture only. Backups made through real setup are covered by backup-after-setup.js, which passes.
  - Tests that use the seed compare validity before and after, rather than expecting "ok".
