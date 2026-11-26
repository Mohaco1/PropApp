# PharmLedger: handoff (26 Nov 2026)

Read `CLAUDE.md` first. It holds the owner's standing rules. The app is **PharmLedger** (formerly Sigil and PropApp), tagline "For the owner's side of the counter."

| | |
|---|---|
| Code commit | `67502269fdce05418e4c38ab67d2165a1799d9d4` (this file is in the next commit) |
| App build id | `79324e8d54` (replaces 5359cb8efe) |
| Live | https://mohaco1.github.io/PropApp/, served from `docs/` on `main` |
| Preview artifact | https://claude.ai/artifact/5fKsJBkM1Jq35fGrAjqqq6 |
| Source | `app/src/` (ES modules, bundled by esbuild) |
| Build log | `app/PROGRESS.md` |

## PharmLedger spec (Gemini, on 5359cb8efe): all done
- [x] **1. Finish deadlock.** A past saved date no longer blocks "Save dates and finish". The date is shown unchanged and `min` allows it. File: `app/src/views/services.js`. Test: `tests/pharmledger.js`.
- [x] **2. Procedure confirms.** Every "[Confirm: …]" item opens Edit with "I've checked it — remove this marker" on screen (for "Write the steps", the own-procedure link). The setup question is one link away. "Update the draft" adds one version and clears the banner. File: `app/src/views/procedures.js`. Tests: `tests/pharmledger.js`, `tests/sprint2.js` UX5.
- [x] **3. Rebrand to PharmLedger.** Option C icon: a teal `#0f766e` ledger with a spine cut and an ocean `#005792` plus on an off-white `#f8fafc` tile. Files: `app/src/ui.js` (LOGO_MARK), `app/tools/make-icons.js`, `app/pwa-assets/icon-{180,192,512}.png`, `app/tools/build.js` (title, manifest), visible text across `app/src`, `CLAUDE.md`. Storage keys `propapp:*` and the backup format are unchanged; Sigil, PropApp and R.Pharmacy backups still restore.
- [x] **4. gates two-tab flake fixed.** When a tab heard another tab's save, it reloaded keys it was still writing, which dropped its own change from memory; its next save then merged that change away. `getAll` and the BroadcastChannel handler now skip in-flight keys. File: `app/src/store.js`. gates passed 4 of 4 runs on its own plus the full run (before: about 1 in 3).
- [x] Fixes 1–7 from the previous handoff were already done in 5359cb8efe.

## Verification (build 79324e8d54, Playwright at 390×844, touch taps, fails on any console error)
| Check | Result |
|---|---|
| Build: `node tools/build.js --uat` | Pass |
| 27 Playwright suites, `tools/test-all.sh` (incl. gates, onboard, pharmledger) | All pass (sprint2 rerun after its UX5 test was updated) |
| procedures-all, "Check later" variant | Pass |
| `node tools/check-procgen-all.js` | Pass ("All 17 services identical") |
| docs/ under /PropApp/ (installable, offline, icons, no errors) | Pass |

**Phone note.** An installed copy can keep showing an older version until it updates. Close the app fully and reopen it; if needed, clear the site's data in Chrome after taking a backup.

## Commands (run from `app/`)
```bash
npm install                    # esbuild + playwright (Chromium pre-installed in the cloud box)
node tools/make-icons.js       # only if the icon changes
node tools/build.js --uat      # -> dist/propapp.html, dist/propapp-standalone.html, dist/pwa/
tools/test-all.sh              # every suite + procgen parity, one line each
node tests/pharmledger.js      # any single suite
node tools/check-procgen-all.js
cp dist/pwa/* ../docs/         # deploy: then commit + push main; Pages serves docs/
python3 -m http.server -d dist/pwa 8080   # local look (open http://localhost:8080/)
```

## Guardrails (from CLAUDE.md)
- **Proprietor only.** No staff logins, no pharmacist-in-charge (PIC) fields. Say "pharmacist on duty", never "PIC".
- **Helper, not policeman.** Never auto-tick, auto-close, auto-approve or auto-adopt anything. No risk scores and no QSPP scoring.
- **Data.** Offline-first: data stays on the phone. No patient health data. Fictional names only.
- **Layout.** One primary button per screen. Tap targets of 44 px or more. The first job is visible at 390×844. No sideways scroll.
- **Sources.** Any change to a compliance obligation is checked against a primary source (`uat/research/`).
- **Keep.** Storage keys `propapp:*` and the backup format stay as they are.

## Next queued
1. Owner UAT on the phone of build 79324e8d54 (name, icon, finishing setup, procedure confirms).
2. Post-trial v4 in-app AI architecture: parked for phase D3 (managed back end in Sydney, emailed-link sign-in, not yet built).
3. Deferred by the owner: push notifications, Monday plan.
4. Optional: the repo and Pages URL still say "PropApp". Renaming the GitHub repo would change the phone link, so ask the owner first.
