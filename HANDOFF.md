# PharmLedger: complete handoff (27 Nov 2026)

For Codex, Gemini or a new Claude session picking this up cold. Read **`CLAUDE.md`** first: it holds the owner's standing rules and decisions, and they override anything here.

## 1. Where things stand

| | |
|---|---|
| Product | **PharmLedger**, "For the owner's side of the counter." (formerly Sigil, PropApp, R.Pharmacy) |
| What it is | A phone-first web app that helps the **proprietor** of an NSW community pharmacy keep on top of legal and best-practice obligations. Offline-first; data stays on the device. |
| Repo | `Mohaco1/PropApp`, branch `main` |
| Live | https://mohaco1.github.io/PropApp/ (GitHub Pages, served from `docs/`) |
| Preview artifact | https://claude.ai/artifact/5fKsJBkM1Jq35fGrAjqqq6 (single-file build, `app/dist/propapp.html`) |
| App build id | **`cb75c2a7e7`** (Stage 3C final bug cleanups, on top of Stage 3B) · `main` is complete and frozen for the Fold trial |
| Code commit | Stage 3C commit on `main` (code, docs/ and this file for build cb75c2a7e7) |
| Build log | `app/PROGRESS.md` (every build, newest at the bottom) |
| Reference app | `uat/` (v41.1) stays untouched until the rebuild matches it (`uat/FEATURE-INVENTORY.md`) |

## 2. Guardrails (never break these)
- **Proprietor only.** No staff logins and no pharmacist-in-charge (PIC) fields. Say "pharmacist on duty", never "PIC" or "responsible person".
- **Helper, not policeman.** Never auto-tick, auto-close, auto-approve or auto-adopt anything. No risk scores and no QSPP scoring.
- **Data.** Offline-first; nothing is sent anywhere. No patient data; free-text boxes nudge against it. Fictional names only (the example is "Wattle Grove Pharmacy (fictional)").
- **Compliance wording.** Change an obligation only after checking the primary source (`uat/research/`). Display can change; the wording under "Why?" stays exact.
- **Storage.** Keys `propapp:*` and the backup format (`app: 'PropApp'`, `format: 1`) never change. PropApp, Sigil and R.Pharmacy backups must keep restoring.
- **Layout.** One primary button per screen; tap targets 44 px or more; the first job visible at 390×844; no sideways scroll; one date style ("21 Aug", or "21 Aug 2025" in another year).
- **Owner decisions kept on purpose:** secondary grey `#526575` (contrast); "Save review" is one tap; OTP file reviews list Quarterly first but never pre-select it; the vaccination "record the GP" wording stays.
- **Never** deploy anything beyond refreshing `docs/`, overwrite real user data, or run destructive migrations without asking the owner.

## 3. How it's built
- **Source:** `app/src/`, plain ES modules bundled by esbuild (`tools/build.js`). No framework.
- **Outputs:**
  - `app/dist/propapp.html`: the preview artifact.
  - `app/dist/propapp-standalone.html`: used by the tests.
  - `app/dist/pwa/`: the installable app (index.html, sw.js, manifest, icons). Copied to `docs/`.
- **App core** (`src/app.js`):
  - Views `register(name, { render, acts, forms, inputs, changes, after, tab, noNav })`.
  - `ctx.change(fn, msg, opts)` is the only way data changes.
  - Navigation: `ctx.go/back/replace/tab` over `S.stack`.
  - Taps route through `[data-act]`, forms through `[data-form]`.
  - **Foldables:** at 700 px+ a list screen and the record it opened render side by side (`MASTER`, `SOLO`, `splitFor`, `routeFor`, `fromMaster`).
- **Storage** (`src/store.js`):
  - IndexedDB with three-way merges across tabs, and a localStorage journal written on hide.
  - A restore stamp so a restored pharmacy isn't blended with stale edits.
  - Keys being saved (`inflight`) are never reloaded under a tab: this fixed the gates two-tab flake.
- **Building blocks** (`src/ui.js`): `screen`, `btn`, `row` (optional `ic`), `section`, `field`, `note`, `why`, `sheet` (bottom sheet), `svcIcon`, `logo`/`LOGO_MARK`, `nav`.
- **Procedures:**
  - `src/procgen.js` wraps the legacy generator `src/content/legacy-procgen.js`, extracted from the old app by `tools/extract-procgen.js`.
  - `tools/check-procgen-all.js` proves every service's draft matches the old app (after the verified wording in `src/content/verified-steps.json`).
  - "[Confirm: …]" markers block adoption until the owner clears them in Edit.
- **Content:** `src/content/*.json|js` (law, reviews, services, staff, visit, updates, sources, onboard guides).
- **Look** (end of `src/styles.css`, newest layer last):
  - Coastal Precision v2: light only, weights 400/600, hairline cards.
  - Final colour: navy `#0f2942` primary, navy→teal stripe, Deep Teal `#0f766e` accent.
  - The foldable rules sit under `@media (min-width:700px)` and the hinge query.

## 4. Screens (view names)
- **Tabs:** today, reviews, actions, staff, more.
- **Under More:**
  - calendar (weeks / month / year plan with the Quarter Balancer and Align);
  - meetings, services (setup questions, the "What happens next" dates, the "You're all set" card);
  - procedures (draft → confirm → adopt in a bottom sheet);
  - obligations (legal obligations), contacts, incidents, locations, s8, history, search;
  - backup (backup, restore, install), pharmacies, allsites (2+ pharmacies), pack (inspector evidence pack, printable);
  - updates and lawsources/sources, onboard (per-service "Onboard me" guides).
- **Other:** welcome ("Centered Calm") and its 3 setup steps; visit (site visit); review/record (review forms, quick list); person/annual/leaving/locum (staff).

## 5. Commands (run from `app/`)
```bash
npm install                      # esbuild (Playwright + Chromium are pre-installed in the cloud box; elsewhere: npm i -D playwright && npx playwright install chromium)
node tools/make-icons.js         # only when the logo changes -> pwa-assets/icon-180/192/512.png
node tools/build.js --uat        # build -> dist/ (prints the build id)
tools/test-all.sh                # all 35 suites + "Check later" variant + procgen parity; one line each
node tests/visual.js             # one suite
node tools/check-procgen-all.js  # "All 17 services identical"
cp dist/pwa/* ../docs/           # deploy to Pages: then commit and push main
python3 -m http.server -d dist/pwa 8080   # look locally at http://localhost:8080/
```
After deploying, an installed phone app picks up the new version when it's reopened. If it doesn't, close it fully, reopen it, and pull down to refresh.

## 6. Tests
- Every suite opens `dist/propapp-standalone.html` in Chromium at 390×844 (foldable.js also uses 344×882, 768×882 and 882×768).
- Suites tap real buttons and fail on any console error.
- Screenshots go to `app/handoff/`, which is git-ignored.
- **Suites:**
  - Original and wave suites: core, sprint1–5, screens, setup-questions, extras, polish, theme, content2, v3, pwa, wave1, wave2, gates, wave3.
  - Briefs from this week: pretrial, sigil, batch1, batch1a, batch1b, batch2a, batch2b, chaos, hardening, upgrade, procedures-all (and `LATER=1`), onboard, pharmledger, foldable, visual, stage3a, stage3b, stage3c.
- **Latest full run on build `2dec2b5fd2`:** see section 9.
- Note: `tests/upgrade.js` opens a saved old build (07775c5947) from a fixture, so it still taps the old "Look around an example pharmacy (fictional)" label. Leave that label as it is.

## 7. What was done this week (newest first)
0. **Stage 3C · final `main` bug cleanups (27 Nov, build `cb75c2a7e7`): done. `main` is complete and frozen for the Galaxy Z Fold trial.**
   - **Vaccination review, Reporting (part G)** (`reviews.json`, `service-vaccination` question 3): "Yes" is the good answer and "No" is the issue (they were the wrong way round), so History, the CSV and the Evidence pack count it correctly.
   - **"PIC" leftovers:** the staff role and its requirements key `Pharmacist in charge (PIC)` are now `Pharmacist on duty` (`staff.json`), still hidden from the role picker; `requirements()` in `model.js` maps an older PIC role to the same checks; `legacy.js` still maps an old PIC role to Pharmacist. The meeting field "Attendees or pharmacist in charge consulted" is now "Pharmacist on duty".
   - **Site visit** (`views/visit.js`): choosing Issue saves Fix by as today + 30 in the draft (what the box shows), and `save()` falls back to + 30, so no visit action has `due: ''`. Each visit answer now stores its `actionId`; `lastVisitIssue` finds the action through it, then through the visit's `actionIds` (an action linked from an earlier visit), then by `source.recordId`.
   - **Calendar** (`align.js`, `views/more.js`): `applyAlign` remembers when a review had no scheduled date (`unset`), and `undoAlign` deletes it again instead of leaving B1 set to the s 111 limit. The Year plan no longer shows ✓ for an S8 review saved with the stock check incomplete, so an overdue B1 stays ●. `verified-steps.json` power failure (pairs[8]): the second sentence now says to put back any vaccines you moved, matching "leave them in the fridge" in the first (pharmacy practice, not a legal change).
   - Tests: `tests/stage3c.js` (in `test-all.sh`). Screenshots `app/handoff/stage3c_*.png`.
0. **Stage 3B · final `main` polish (27 Nov, build `b30f398081`): done. `main` is frozen and ready for the Galaxy Z Fold trial.**
   - **Fold cover (344 px):** `button.ph-switch.single` has `max-width:100%`, `overflow:hidden`, `text-overflow:ellipsis`, `white-space:nowrap`, so a long pharmacy name is cut with "…" and the page never gets wider than 344 px.
   - **Keyboard and ARIA:** the backup file inputs (welcome "Restore backup", Backup and devices "Choose a backup file") use the `.vh-file` visually-hidden class instead of `hidden`, so Tab reaches them; their label shows the focus ring. `.chip:has(:focus-visible)` gives radio chips a ring. The bottom `sheet()` backdrop is a plain `div` (`aria-hidden`), so there's one "Cancel" for screen readers; `app.js` (`sheetFocus`, `sheetKeys`) moves focus to the sheet's primary button when it opens, keeps Tab and Shift+Tab inside, closes on Escape (via the sheet's Cancel) and gives focus back to the button that opened it (Adopt), or the title if it's gone.
   - **Evidence keys:** `RPH.sq.REC` no longer lists `cannabis` (`scopeEvidence`, `records`), `vaping` (`records`) or `nsp` (`records`): those services don't ask where records are kept, so Evidence locations and the Evidence pack showed raw key names. Generic services get a `records` location only if they ask the question (legacy-procgen and `services.json`).
   - **"Pharmacist in charge":** the lead question and the role options now store "Pharmacist on duty" (an earlier "Pharmacist in charge" answer still shows as "The pharmacist on duty"); the lead default in drafts is "Pharmacist on duty"; `verified-steps.json` maps any older wording in drafts; the displayed-names rule (`law.json`, the site-visit question in `reviews.json`) says "the pharmacist on duty". `law.json` still quotes the Regulation's own term at s 122 (two lines); left as it is.
   - **Clinical and links:** `otp-amenity` is Annual (matches the yearly amenity-plan review in the onboarding guide and the OTP draft); vaccine cold chain says "at least two staff who manage vaccines" (NSW Health quote in `uat/research/content-v2-sources-2026-11-25.md`); the dead Community Sharps Guidance PDF link is replaced by NSW Health's Community sharps management page (`/community-sharps/Pages/default.aspx`); the adherence description agrees in onboarding and Services (DAAs and MedsCheck are their own services); the certificates step cites Fair Work Act 2009 s 97 and s 107 (evidence). **Not re-read here:** health.nsw.gov.au is blocked from this session, so the sharps page and the OTP Standards' review interval were taken from search listings and earlier research, not read today. The owner may want to open both once.
   - Tests: `tests/stage3b.js` (in `test-all.sh`). Screenshots `app/handoff/stage3b_*.png`.
0. **Stage 3A · inspector red-team and walkthrough fixes (27 Nov, build `cb301740fb`): done. Batch 3's Fold-trial readiness still stands.**
   - **Reviews** (`views/reviews.js` `changes.q`): a review question no longer moves on by itself after 600 ms. Every clean answer reveals "Note (optional)" (an issue reveals its fix box and date), so the owner stays on the question and taps Next. Onboarding's single-choice auto-advance is separate and unchanged.
   - **Dead-ends** (`views/today.js`, `views/services.js`, `views/procedures.js`): on Today's Finish setting up card each service still to set up is a 44 px row (`.checkgo`, act `setupone`) straight to its `service-setup`; "Add due dates to your phone calendar" waits until a service is set up or Today has a dated item. "You’re all set" has a "Review procedures" link. "Change my setup answer instead" only shows when `bestQuestion()` finds a question; if a marker's fix still finds none, it opens the service with a toast hint.
   - **Evidence pack** (`views/pack.js`): an S8 check with an issue answer reads "Completed with issues" (still counted as a completed stocktake). New sections My log (`ph.log`, in period) and Other documents (`ph.documents`, references only). Procedures show the version in use, "Adopted <date> by <name>" and any pending draft separately, plus a Local amendments table. Every pack date and the History print (`views/more.js`) use `fullDate()` (`dates.js`), so printed dates always carry the year.
   - **Calendar file** (`ics.js`, R04): staff expiry and annual-check events are "PharmLedger staff check due · <pharmacy>", with no name or credential.
   - Tests: `tests/stage3a.js` (31 checks, in `test-all.sh`); `pretrial.js` updated for 8 pack sections and the calendar line waiting for a date. Screenshots `app/handoff/stage3a_*.png`.
0. **Stage 2 · safe v41 parity (27 Nov, build `9b350249d1`): done. Batch 3's Fold-trial readiness still stands.**
   - **M-06 Staff** (`views/staff.js`): each credential row on a person's page opens route `cred` (id `personId~reqId`): last time's check, then Seen it · update / Issue / N/A, one Save. It saves that one check, records a one-item "Credential check" in History, raises one action for an issue, and never moves the annual check date. The Staff list has All / Needs review / Coming up chips (one line at 344 and 390 px, 44 px) and a search box. "Needs review" = expired, issue or checks not done; "Coming up" = due within 30 days (from `personStatus`).
   - **M-07 History CSV** (`export.js`): every `ph.history` event is exported as a "Change" row with a category (Procedure, Service, Evidence, DAA packing, Calendar, Staff, Setup, Action, Review, Document, Law update, Meeting, Other), except the four already exported from their own records (Recorded, Action raised/closed, My log). UTF-8 BOM first; a cell starting with = + - @ (after any spaces) or a tab/return gets a leading apostrophe. **Restore** (`views/backup.js` `checkPharmacy`): settings, schedule, obligations, flags, proprietors, documents, log, history, procedure versions, services' answers and each record answer are shape-checked; missing parts in older backups are added empty, so PropApp, Sigil and R.Pharmacy backups still restore.
   - **L-02** (`views/procedures.js`, `views/law.js`, `views/services.js` `s8Answers`): a document reference with an https link shows "kept by …" and a 44 px "Open link" (new tab, `rel="noopener noreferrer"`); non-https links are refused on save. S8 at a glance adds "Your S8 setup · n": every answered S8, drug register or controlled-medicine setup question, each opening its service.
   - Tests: `tests/parity.js` (44 checks, in `test-all.sh`). Screenshots `app/handoff/parity_*.png`.
0. **Onboarding polish (27 Nov, build `f341207867`): done. Batch 3's Fold-trial readiness still stands.**
   - **Single-choice auto-advance** (`views/services.js`, `autoAdvances`/`autoNext`): a single-choice setup answer that opens no box to type in (not "Different local arrangement", "Someone else" or "We have our own procedure") is highlighted (`.choice.picked`) and moves to the next question after 140 ms. The last question waits for Finish; "Save and back to the procedure" mode never moves on. Next and Previous stay; one Next tap within 900 ms of an automatic move, with no new answer, is ignored so a habitual tap never skips a question. Ticks and typed boxes still wait for Next. Nothing is answered for the owner.
   - **Plan card after Finish setup** (`views/welcome.js`, route `plan-ready`): the pharmacy name in the header, then "Here's your pharmacy plan": services (count and names, or "None yet. Add them any time from More → Services."), procedures to draft (or copied drafts to adopt), and the S8 stocktake (next due date, or "Every 3 months. Add your last stocktake date on Today."). One primary button, Open Today. It replaces the old Finish setup toast.
   - **Keyboard-safe buttons** (`keepButtonInView` in `welcome.js`, used by `services.js`; `styles.css`): focusing a box on a short screen scrolls just enough to show Continue / Next, never past the box's label under the header; inputs carry `scroll-margin`.
   - Tests: `tests/onboarding-polish.js` (28 checks, in `test-all.sh`). `tests/helpers.js` `tap(p, 'Finish setup')` taps through the plan card; batch3's L-01 check reads the plan card instead of the toast; pharmledger and procedures-all loops tolerate a question that has already moved on.
0. **Batch 3 (27 Nov, build `a78881bc7c`): done. Ready for the 2-week Galaxy Z Fold trial.**
   - **H-07 fold and unfold:** `app.js` reads every unsaved form field (text, date, select, radio, checkbox) before the fold/unfold redraw and puts it back afterwards with the cursor where it was (`typed`/`retype`), so folding never wipes a half-typed form. Row titles and subtitles use `overflow-wrap: break-word` (no mid-word breaks such as "administratio-n" in the ~300 px list pane; list-pane rows also get a little more room). On a hinged screen the Quarter Balancer stays 2 columns and the welcome screen and bottom sheet sit in the right segment. Reviews, Actions, Staff, Visit, Procedures and Meetings show the open pharmacy under the title when 2+ pharmacies are on the device.
   - **M-08 final colour and polish:** `--accent` and `--teal` are Deep Teal `#0f766e`, `--ocean` navy and `--tint` a navy tint; `a`/`a.btn` links use the tokens, never browser blue. Today's "Waiting · to confirm" chip wraps instead of being cut off at 344 px, and in the unfolded list pane the four filters sit 2 by 2. The record opened from Today is highlighted in Today's list. The Year plan's Align card says "the quarter shown above" only when the Quarter Balancer shows. Procedure sections, "Official source" and "Where it's used" have the same turning chevron as "Why?".
   - **L-01:** the welcome `.wm-mark` is exactly the 56 px logo and centred. "Fictional details only while testing." shows only in the UAT build. Finishing setup with no services says "Add services any time from More → Services." "Waiting · check back" and "Expired" dates use the app's date style.
   - Tests: `tests/batch3.js` (in `test-all.sh`, 31 checks), including a 768 → 390 → 768 px fold with a half-typed action. The hinge rules are checked in the stylesheet, since Playwright can't emulate two segments.
0. **Batch 2B (27 Nov, build `f43df8205e`): done.**
   - **H-05 evidence pack:** `packData` adds every active service's record locations (`locationRows` from `views/law.js`, the same rows as More → Evidence locations), so the section is filled on Wattle Grove. Pack tables sit in a `.pscroll` wrapper and wrap at word boundaries (tighter padding under 420 px); at 344 and 390 px nothing is clipped and the page never scrolls sideways. The foldable and sheet rules are now `@media screen and (min-width:700px)`, and print drops the split panes and 100vh heights, so A4 uses the full page width.
   - **H-08 calendar:** a staff action inside a person's row is redacted like any action ("PharmLedger action due · pharmacy") and keeps the action's own UID (`action/<id>`); other parts use `x.id`, not their position, so UIDs stay stable when checks come and go.
   - **H-10 staff:** a Former staff profile has "Restore to active staff" (leaving record stays in the history). In `summary.js` a staff action joins its person's Today row only while that person is active; otherwise it is its own row, so Today and Actions agree. The 5 source links under "If something goes wrong" are 44 px tap targets (`a.srclink`).
   - **M-02/M-04:** Vaccination SOP cold-chain training says at least two staff who manage vaccines complete the NSW Health module (NSW Health cold chain page, `uat/research/content-v2-sources-2026-11-25.md`); prescribing SOP adds 7-year (under 18: until 25) digital clinical records and the 4 Nov 2027 authority expiry step (NSW Health site findings, line 115), with verified-steps pairs keeping procgen parity. Legacy import maps "Pharmacist in charge (PIC)" to Pharmacist; M2 says "your pharmacist team"; "No patient names" hints on the staff issue note and meeting "Others there"/"New action"; blank action titles (new and edit) and locum names are refused.
   - **Hardening S8 Finish stall: root-caused and fixed.** `rebaseDrafts` (`store.js`, C-06) kept the old base for a draft changed again while its own save was in flight, so the next save took this window's own last write for another tab's: the Finish (step 9) save became a `review/B1/conflict-…` copy and the screen fell back to the list. The base now moves to the window's own write unless another tab's copy replaced it. hardening passed 8 of 8 runs after the fix (it stalled 1 in 4 before).
   - Tests: `tests/batch2b.js` (in `test-all.sh`, 23 checks). `tests/pretrial.js` now expects Evidence locations ticked on the example (H-05 fills it).
0. **Batch 2A (27 Nov, build `166410f103`): done.**
   - **H-01 OTP LAIB storage:** the OTP secure-storage checklist item and the draft step no longer say "Schedule 8 cold chain for LAIB". They give each brand's storage, matching `content/onboard.js`: Buvidal below 25°C, never refrigerated or frozen; Sublocade refrigerated at 2°C–8°C in the S8 safe or fridge (or up to 7 days below 25°C). Changed in `legacy-procgen.js`, with the matching pairs added to `verified-steps.json` so `check-procgen-all` still compares like with like. Sources: Buvidal and Sublocade Australian product information. Note: NSW Health has published a Sublocade discontinuation notice (health.nsw.gov.au, "Changes to Sublocade availability in Australia"); the owner may want to drop the Sublocade line later.
   - **H-02 OTP 80+ patients:** `syncVolume` in `views/services.js` sets `ph.flags.volume` from the OTP `volumeBand` answer (Yes → true, anything else → false) when the answer is saved and when setup finishes, the way DAA `routes` set their flags. The OTP daily-volume threshold review now appears in "What happens next", Today, Reviews and the Year plan. The OTP comprehensive review's threshold answer still sets the flag too.
   - **H-03 OCP initiation:** the 5 Nov 2026 prescribing update names JCU, the University of Newcastle and UTS graduate certificates and the private (non-PBS) cost. The five `prescribing2026` items added in `procgen.js` are in `RPH.qm.displayMap`, so "Your answers" shows their wording, never "OCP initiation (JCU-trained)".
   - **H-06 branding:** the record summary ends "From PharmLedger."; `legacyWords` in `procgen.js` (used by `applyVerified`, the Edit wording box and the display of edited bodies) turns "R.Pharmacy" into "PharmLedger" and "approve it in Policies" into "adopt it in Procedures".
   - **M-03 reviews:** "Why?" drops the screen labels that came with the scraped Wattle Grove notes ("Annual · Recommended …", "Preview only …", the example's name); real sentences stay. The record view colours answers with `answerIsIssue` (`issues.js`), so a good "Yes" is no longer red.
   - Tests: `tests/batch2a.js` (in `test-all.sh`, 25 checks).
1. **Batch 1B (27 Nov, build `4f64f0558c`): done.**
   - **C-04 adopted procedures redraft:** the "Your setup answers changed" note and "Update the draft" now show on an adopted procedure too. The tap adds a new Draft version; the adopted version stays in `versions` and the draft says "Version X.0, adopted …, stays in use until you adopt this draft" (the Procedures list shows "· version X.0 in use"). Setup never redrafts an adopted procedure by itself (`SETUP.acts.ret`, `finishService` toasts say so). Nothing is adopted for the owner.
   - **C-06 store mid-flush:** in `flushNow`, when a later edit of this tab was queued while a save was merging another tab's change, the pharmacy's merge base stays at what that edit was made from, so the next save merges instead of overwriting; drafts the queued edit didn't touch take the merged copy and its base (`rebaseDrafts`).
   - **M-01 drafts:** the visit's issue text, visit note and next quarterly date save to the visit draft as they're typed (`inputs`/`changes` `ans` and `fin`). Meeting minutes keep a draft (`meeting/<id>`) that survives opening an open item or a reload, and is cleared on Save meeting.
   - **M-05:** the "Add PharmLedger to your Home Screen before you enter records" line sits above every setup and date card on Today (installable app in a browser, not standalone). The claude.ai preview hints on the evidence pack and Backup are hidden in the installable app.
   - Tests: `tests/batch1b.js` (in `test-all.sh`; it fails without the fixes). `tests/pwa.js` now checks the Home Screen line sits first.
1. **Batch 1A (27 Nov, build `5be6df0d29`): done.**
   - **C-01 S8 limit (s 111):** one window, `s8Max(ph)` in `rules.js`: 3 months after the last completed stock check, or 3 months from today with none on record; if that has passed, today to +14 days (`S8_GRACE_DAYS`). Used by first dates, Change due date (input `max` and save check), the finish screen and `alignPlan`. Today keeps "Add your last S8 stocktake date" until a real stock-check date exists (`sentence(list, ph)`). An overdue S8 row still shows overdue at the legal date; the planned date is saved but never hides that. Note: the UAT layer uses 7 grace days; the brief asked for 14.
   - **C-02 restore:** the file input is cleared after every pick, so the same file chosen again confirms the replace; any navigation disarms it (`pl:navigate`).
   - **C-03 another pharmacy:** the open pharmacy stays active until Step 3 creates the new one; Back from Step 1 returns to it; the welcome screen offers "Back to [Pharmacy]" if pharmacies exist but none is open.
   - **C-05 Reset test data:** blocked in the UAT dialog while any real pharmacy is on the device (not test/fictional, not the example, with records); the dialog says to back up and delete test pharmacies one by one in More › Pharmacies.
   - Tests: `tests/batch1a.js` (in `test-all.sh`).
1. **Final colour spec:**
   - The logo keeps its geometry, now a navy ledger and a teal plus on a Warm Ivory tile; theme-color `#0f2942`.
   - Navy primary buttons and active nav; a navy→teal stripe.
   - "Centered Calm" welcome: logo(56), PharmLedger in 26 px, tagline, a full-width button, then "Restore backup · Try example".
2. **Visual polish:**
   - Light only, weights 400/600, hairline cards with soft shadows, 20/12/8 spacing.
   - Service icons on list rows, a calm setup summary card, the Adopt bottom sheet, pill toasts with a settling check.
3. **Foldables:** a left rail and list + record split at 700 px+, hinge-aware, with centred single panes.
4. **PharmLedger rebrand and fixes:**
   - The Option C icon.
   - Fixes: a stale date no longer blocks finishing setup; "to confirm" items open Edit; "Update the draft" works in one tap.
   - The gates two-tab flake is root-caused and fixed.
5. **Fixes 1–7:**
   - The OCP Intention form restored (NSW Health OCP page).
   - The year plan fits at 390 px; the Android menu hint; table headers; filter chips; "Why?" chevrons; governance wording.
6. **"Onboard me"** guides for all 17 services. Dated notices: eNRMC 31 Mar 2027; QSPP 1 Jul 2027 for the named PPA programs only.
7. **Prescribing correction:** OCP needs a JCU, Newcastle or UTS graduate certificate; the Queensland gate covers only the five extra conditions.
8. **Procedures:** all 17 services can reach "nothing to confirm" through the screens (`tests/procedures-all.js`).

## 8. Open items and next work
1. **2-week Galaxy Z Fold trial** (Stage 3C done; `main` complete and frozen for it): owner UAT of the current build on the phone, the cover screen and unfolded. Check the look, the welcome screen, the icon on the home screen, and the hinge spacing: real hinge segments can't be emulated in Playwright.
2. **Phase D3** (parked): a managed back end in Sydney with emailed-link sign-in, then the post-trial v4 in-app AI architecture.
3. **Deferred by the owner:** push notifications, Monday plan.
4. **Optional, ask the owner first:** rename the repo or Pages path from "PropApp". This changes the phone link and would need a reinstall.
5. **Rebuild parity:** keep checking `uat/FEATURE-INVENTORY.md` before the old app in `uat/` can be retired.

## 9. Final state of this handoff
**Stage 3C, build `cb75c2a7e7`:** `test-all.sh` run once in full: all 40 suites pass (stage3c included, and batch3 with its Stage 3B update, which now also passes in the full run) plus Check later, and `check-procgen-all` shows all 17 identical. `docs/` refreshed from `dist/pwa/`. `main` complete and frozen for the Fold trial.

**Stage 3B, build `b30f398081`:** `test-all.sh` run once in full: 38 of 39 suites passed (stage3b included) plus Check later, and `check-procgen-all` shows all 17 identical. `batch3` failed 1 check (M-08) that expected the example's Year plan to have no Quarter Balancer: with `otp-amenity` now Annual the example has two service annuals, so the Balancer shows. The check now asserts the Align wording matches whichever is on screen; `batch3` re-run alone: all pass. `docs/` refreshed from `dist/pwa/`. `main` frozen for the Fold trial.

**Stage 3A, build `cb301740fb`:** `test-all.sh` run once in full: 36 of 37 suites passed (stage3a included) plus Check later, and `check-procgen-all` shows all 17 identical. `pretrial` failed 2 checks that expected the old behaviour (six pack sections; the calendar offer on a brand-new pharmacy with no dates); both updated and `pretrial` re-run alone: all pass. `docs/` refreshed from `dist/pwa/`.

**Stage 2 parity, build `9b350249d1`:** `test-all.sh` run once in full on the final build: all 36 suites pass (parity included, and the 5 suites fixed after Onboarding polish: batch1, pharmledger, procedures-all, batch2a, batch3) plus Check later; `check-procgen-all` shows all 17 identical. `docs/` refreshed from `dist/pwa/`.

**Onboarding polish, build `f341207867`:** `test-all.sh` run once in full: 30 of 35 suites passed plus procgen; batch1, pharmledger, procedures-all (both variants), batch2a and batch3 failed because their tap-then-Next loops met auto-advance (a move onto the "Where you keep records" or done screen, a second Next swallowed, the old toast). Fixed in the app (last question waits for Finish; only one Next is swallowed) and in those tests; on the final build all of them plus batch1b (a one-off crash in the full run), setup-questions and onboarding-polish pass, and `check-procgen-all` shows all 17 identical. `docs/` refreshed from `dist/pwa/`. Screenshots `95`–`99` in `app/handoff/`.

**Batch 3, build `a78881bc7c`:** `test-all.sh` run once in full on the final build, no time limit hit: all 34 suites pass (batch3 included) plus Check later, and `check-procgen-all` shows all 17 identical. `docs/` refreshed from `dist/pwa/`. Ready for the 2-week Fold trial.

**Batch 2B, build `f43df8205e`:** `test-all.sh` run once in full (no time limit hit) on build `589458ee6a`: 32 of 33 suites passed, hardening included, plus Check later; pretrial failed 4 checks that expected an empty Evidence locations section (H-05 now fills it), and `check-procgen-all` showed vaccination and prescribing differing (the intended wording). Fixed with an updated pretrial check and verified-steps pairs; on the final build `f43df8205e` pretrial, batch2b, hardening, procedures-all (and Check later), batch2a and onboard all pass and `check-procgen-all` shows all 17 identical. `docs/` refreshed from `dist/pwa/`.

**Batch 2A, build `166410f103`:** `test-all.sh` run once; it hit the session's 10-minute limit after `procedures-all`, so the last four suites (onboard, pharmledger, foldable, visual), the Check later variant and `check-procgen-all` were run straight after with the same build. 32 of 33 suites passed (batch2a included) plus Check later; `check-procgen-all`: all 17 identical. `hardening` crashed (a Node timeout, not a failed check): at Item 3 the S8 review's "Finish" tap in list mode sometimes doesn't move on to the stock-check date. Alone on this build it passed 5 of 8 runs; on the Batch 1B build it passed 4 of 4. Nothing in Batch 2A touches that screen's code, but treat it as open: look at a list-mode draft save landing after the Finish tap (`acts.qa` then `step`). `docs/` refreshed from `dist/pwa/`.

**Batch 1B, build `4f64f0558c`:** full `test-all.sh` run once: 31 of 32 suites passed (batch1b included) plus the Check later variant; `core` crashed once with a Node exception mid-run, then passed 3 times on its own with no changes. `check-procgen-all`: all 17 identical. `docs/` refreshed from `dist/pwa/`.

**Batch 1A, build `5be6df0d29`:** full `test-all.sh` run once: 29 of 31 suites passed (batch1a included). wave1 (R02 incomplete-check wording) and sprint5 (Reset used on the example pharmacy) failed; both fixed (legal date kept in the wording; the example counts as fictional) and re-run green with batch1a, gates, hardening and pretrial. `check-procgen-all`: all 17 identical. `docs/` refreshed from `dist/pwa/`.

Previous build (2dec2b5fd2):
| Check (build `2dec2b5fd2`) | Result |
|---|---|
| `node tools/make-icons.js` | Pass (180/192/512 PNGs, navy/teal on ivory) |
| `node tools/build.js --uat` | Pass, build `2dec2b5fd2` |
| `tools/test-all.sh`: 30 suites + "Check later" variant | 29 passed in the full run; **upgrade** failed only because a bulk label rename touched its old-build fixture. Fixed, and it passes on its own. |
| `node tools/check-procgen-all.js` | Pass, "All 17 services identical" |
| `docs/` under /PropApp/ (installable, offline, icons, manifest `theme_color #0f2942`, `background_color #fafaf8`) | Pass |
| Live at https://mohaco1.github.io/PropApp/ | Yes |
| Working tree | Clean after the push |

Screenshots checked for this build (in `app/handoff/`, git-ignored): `90_welcome_calm_390px.png`, `91_welcome_calm_unfolded.png`, `92_today_navy_390px.png`, plus the earlier `80`–`82` (setup summary, service icons, Adopt sheet) and `70`–`71` (foldable).
