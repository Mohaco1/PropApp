# PharmLedger: complete handoff (26 Nov 2026)

For Codex, Gemini or a new Claude session picking this up cold. Read **`CLAUDE.md`** first: it holds the owner's standing rules and decisions, and they override anything here.

## 1. Where things stand

| | |
|---|---|
| Product | **PharmLedger**, "For the owner's side of the counter." (formerly Sigil, PropApp, R.Pharmacy) |
| What it is | A phone-first web app that helps the **proprietor** of an NSW community pharmacy keep on top of legal and best-practice obligations. Offline-first; data stays on the device. |
| Repo | `Mohaco1/PropApp`, branch `main` |
| Live | https://mohaco1.github.io/PropApp/ (GitHub Pages, served from `docs/`) |
| Preview artifact | https://claude.ai/artifact/5fKsJBkM1Jq35fGrAjqqq6 (single-file build, `app/dist/propapp.html`) |
| App build id | **`166410f103`** (Batch 2A) |
| Code commit | Batch 2A commit on `main` (code, docs/ and this file for build 166410f103) |
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
tools/test-all.sh                # all 30 suites + "Check later" variant + procgen parity; one line each
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
  - Briefs from this week: pretrial, sigil, batch1, batch1a, batch1b, batch2a, chaos, hardening, upgrade, procedures-all (and `LATER=1`), onboard, pharmledger, foldable, visual.
- **Latest full run on build `2dec2b5fd2`:** see section 9.
- Note: `tests/upgrade.js` opens a saved old build (07775c5947) from a fixture, so it still taps the old "Look around an example pharmacy (fictional)" label. Leave that label as it is.

## 7. What was done this week (newest first)
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
1. **Owner UAT** of the current build on the phone and an unfolded Galaxy Z Fold. Check the look, the welcome screen, the icon on the home screen, and the hinge spacing: real hinge segments can't be emulated in Playwright.
2. **Phase D3** (parked): a managed back end in Sydney with emailed-link sign-in, then the post-trial v4 in-app AI architecture.
3. **Deferred by the owner:** push notifications, Monday plan.
4. **Optional, ask the owner first:** rename the repo or Pages path from "PropApp". This changes the phone link and would need a reinstall.
5. **Rebuild parity:** keep checking `uat/FEATURE-INVENTORY.md` before the old app in `uat/` can be retired.

## 9. Final state of this handoff
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
