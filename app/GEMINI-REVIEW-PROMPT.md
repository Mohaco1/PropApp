# Prompt for Gemini: review of the rebuilt app (milestone 1)

Paste everything below the line into Gemini, with the zip attached.

---

You reviewed R.Pharmacy on 24 Nov 2026 and found real problems. The app has since been rebuilt from scratch as "PropApp". Review the rebuild with the same rigour.

## Files
- `propapp-rebuild.html`: the new app, one file. Open it in Chrome at phone size (390 × 844).
  - **Example pharmacy:** "Look around an example pharmacy (fictional)" opens Wattle Grove, with a year of fictional records.
  - **New owner:** "Set up your pharmacy" walks through setup.
- `rpharmacy-old.html`: the previous app, for comparison.
- `CLAUDE.md`: the owner's standing rules and decisions. Don't re-raise anything decided there unless you think the decision is wrong.
- `PLAN.md`: what was adopted from your research, what was adjusted, and what was deferred.
- `PROGRESS.md`: what's done, and what's still missing.
- `FEATURE-INVENTORY.md`: every feature of the old app. The rebuild must have all of them before the old app is retired.
- `your-critique.md`: your previous review.

## What to do
1. **Re-run your earlier findings.** Take each of your 20 findings (F-01 to F-20) and record:
   - Fixed, Partly fixed or Not fixed;
   - the screen you checked and the exact words you saw.
2. **Do the same 9 owner tasks as last time, on the new app.** Count the taps for each and note where you hesitated:
   - set up a new pharmacy with 3–4 services;
   - find what needs doing this week;
   - do a quarterly site visit while an extra visit is in progress;
   - close an action;
   - mark an action as waiting on someone;
   - a staff annual check;
   - S8 at a glance;
   - adopt a procedure;
   - export History.
3. **Check feature parity.** Go through `FEATURE-INVENTORY.md` and list anything ticked [x] that doesn't work in the new app, and anything unticked that the new app already does.
4. **Check against the 12 design rules in `CLAUDE.md`.** Name the screen and the rule for every breach.
5. **Look for new problems the rebuild introduced.** Pay special attention to:
   - the setup questions: options, "Check later", record locations, vaccine groups;
   - procedures: wording identical to the old app for the same answers;
   - opening an old R.Pharmacy backup ("Restore a backup").
6. **Challenge Claude.** List what it got wrong, over-built or still missed, each with evidence.

## What to hand back
1. **Verdict:** 5 lines. Is the rebuild better than the old app for a real proprietor, and is it ready for a one-month trial?
2. **Your earlier findings:** a table of F-01 to F-20 with status and evidence.
3. **New findings:** a table with:
   - ID;
   - screen;
   - exact words;
   - why it matters;
   - severity (Blocker, High, Medium or Low);
   - suggested fix.
4. **Parity gaps:** what's missing compared with the old app.
5. **Challenges for Claude:** numbered.
6. **The next 3 things to build:** each with a reason.

Be concrete: name the screen, use the exact words, and give the tap counts.
