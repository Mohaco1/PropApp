# PharmLedger: handoff (26 Nov 2026)

Read `CLAUDE.md` first. It holds the owner's standing rules. The app is **PharmLedger** (formerly Sigil and PropApp), tagline "For the owner's side of the counter."

| | |
|---|---|
| Code commit | see `git log -1` (visual polish code: `82ed7b0`) |
| App build id | `0c5f2e1570` (replaces d192b6a64a) |
| Live | https://mohaco1.github.io/PropApp/, served from `docs/` on `main` |
| Preview artifact | https://claude.ai/artifact/5fKsJBkM1Jq35fGrAjqqq6 |
| Source | `app/src/` (ES modules, bundled by esbuild) |
| Build log | `app/PROGRESS.md` |

## Visual Polish, light only and exact logo (on d192b6a64a): done
- [x] **Light only.** No dark-mode CSS (`app/src/styles.css`); tests theme, gates and v3 check it. `--muted` kept at `#526575` for 4.5:1 contrast (the spec's `#64748b` falls short on the page background).
- [x] **Coastal Precision v2** (end of `app/src/styles.css`): weights 400/600, hairline cards + soft shadow, 20/12/8 spacing, 14 px radius, service icons (`svcIcon`, `app/src/ui.js`) on Service and Procedure rows, the calm setup summary card (`app/src/views/services.js`), the bottom sheet (`sheet`, `app/src/ui.js`) for Adopt (`app/src/views/procedures.js`), pill toasts with a 150 ms settling check (`app/src/app.js`), and the settle on a closed action (`app/src/views/actions.js`).
- [ ] **Open for the owner:** a confirm sheet before "Save review". Saving is one tap today; a sheet would add a tap to every review.
- [x] **Exact Option C logo**: `LOGO_MARK` (`app/src/ui.js`), `app/tools/make-icons.js` (~14 % safe margin), `app/pwa-assets/icon-*.png`.
- [x] Foldable support unchanged; `tests/foldable.js` passes. New `tests/visual.js`.

## Foldables (on 79324e8d54): done
- [x] **Responsive shell** (`app/src/styles.css`, end of file). Below 700 px: untouched. 700 px and up: an 84 px left rail; `.split` with list and record (`minmax(300px,38%) 1fr`); centred 640 px single panes (welcome, onboard and service-setup never split); Quarter Balancer in 4 columns. With `horizontal-viewport-segments: 2`, the panes follow the hinge segments.
- [x] **List and record side by side** (`app/src/app.js`: `MASTER`, `SOLO`, `splitFor`, `routeFor`, `fromMaster`). The spec's `law` and `sites` are the views `obligations` and `allsites`. A tap in the list pane runs against the list view; opening another record replaces the shown one without resetting the list's scroll; Back closes the record.
- [x] **`tests/foldable.js`** at 344×882, 768×882 and 882×768. Not testable here: real hinge segments (Playwright can't emulate them).

## PharmLedger spec (Gemini, on 5359cb8efe): all done
- [x] **1. Finish deadlock.** A past saved date no longer blocks "Save dates and finish". The date is shown unchanged and `min` allows it. File: `app/src/views/services.js`. Test: `tests/pharmledger.js`.
- [x] **2. Procedure confirms.** Every "[Confirm: …]" item opens Edit with "I've checked it — remove this marker" on screen (for "Write the steps", the own-procedure link). The setup question is one link away. "Update the draft" adds one version and clears the banner. File: `app/src/views/procedures.js`. Tests: `tests/pharmledger.js`, `tests/sprint2.js` UX5.
- [x] **3. Rebrand to PharmLedger.** Option C icon: a teal `#0f766e` ledger with a spine cut and an ocean `#005792` plus on an off-white `#f8fafc` tile. Files: `app/src/ui.js` (LOGO_MARK), `app/tools/make-icons.js`, `app/pwa-assets/icon-{180,192,512}.png`, `app/tools/build.js` (title, manifest), visible text across `app/src`, `CLAUDE.md`. Storage keys `propapp:*` and the backup format are unchanged; Sigil, PropApp and R.Pharmacy backups still restore.
- [x] **4. gates two-tab flake fixed.** When a tab heard another tab's save, it reloaded keys it was still writing, which dropped its own change from memory; its next save then merged that change away. `getAll` and the BroadcastChannel handler now skip in-flight keys. File: `app/src/store.js`. gates passed 4 of 4 runs on its own plus the full run (before: about 1 in 3).
- [x] Fixes 1–7 from the previous handoff were already done in 5359cb8efe.

## Verification (build 0c5f2e1570, Playwright at 390×844 plus the foldable sizes, touch taps, fails on any console error)
| Check | Result |
|---|---|
| Build: `node tools/build.js --uat` | Pass |
| 29 Playwright suites, `tools/test-all.sh` (incl. gates, pharmledger, foldable, visual) | All pass in one full run (core and hardening included) |
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
1. Owner UAT of build 0c5f2e1570 on the phone and on an unfolded Fold (look, icons, Adopt sheet, rail, list + record, hinge).
2. Owner decision: should "Save review" ask in a bottom sheet first?
2. Post-trial v4 in-app AI architecture: parked for phase D3 (managed back end in Sydney, emailed-link sign-in, not yet built).
3. Deferred by the owner: push notifications, Monday plan.
4. Optional: the repo and Pages URL still say "PropApp". Renaming the GitHub repo would change the phone link, so ask the owner first.
