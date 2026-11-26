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
| App build id | **`2dec2b5fd2`** |
| Code commit | see `git log -1` (final colour code: `d43b2a1`) |
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
  - Briefs from this week: pretrial, sigil, batch1, chaos, hardening, upgrade, procedures-all (and `LATER=1`), onboard, pharmledger, foldable, visual.
- **Latest full run on build `2dec2b5fd2`:** see section 9.

## 7. What was done this week (newest first)
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
(filled in below after the last full run)
