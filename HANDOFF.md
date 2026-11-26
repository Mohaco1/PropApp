# Sigil: handoff (26 Nov 2026)

Read `CLAUDE.md` first. It holds the owner's standing rules.

| | |
|---|---|
| Code commit | `8a1587318b5cf3b0370408f59cee1d3a188271d1` (this file is in the next commit) |
| App build id | `5359cb8efe` (replaces 767072835c) |
| Live | https://mohaco1.github.io/PropApp/, served from `docs/` on `main` |
| Preview artifact | https://claude.ai/artifact/5fKsJBkM1Jq35fGrAjqqq6 |
| Source | `app/src/` (ES modules, bundled by esbuild) |
| Build log | `app/PROGRESS.md` |

## Fixes 1–7 (Gemini handoff doc, build 767072835c)
- [x] **1. OCP Intention form.** Restored next to the private (non-PBS) cost note. Re-checked against the NSW Health OCP initiation page. Files: `app/src/content/onboard.js`, `app/src/procgen.js`, `uat/research/onboard-sources-2026-11-26.md`.
- [x] **2. Year plan.** The Move buttons (Quarter Balancer) and Align now come first. The 12-month table fits 390 px, so no month is clipped. Files: `app/src/views/more.js`, `app/src/styles.css`.
- [x] **3. Android hint.** Now reads "tap the three-dot menu (⋮)". File: `app/src/views/settings.js`.
- [x] **4. Evidence pack.** The "Raised" header no longer wraps on screen. Print is unchanged, so the PDF columns stay readable. File: `app/src/styles.css`.
- [x] **5. Today filter chips.** One line each, equal height. File: `app/src/styles.css`.
- [x] **6. "Why?" boxes.** A chevron shows on every box and rotates when opened. File: `app/src/styles.css`.
- [x] **7. Governance agenda.** "Incidents and patient safety"; complaints now appear only in the Q4 themes item. File: `app/src/views/meetings.js`.

Nothing from 1–7 remains.

## Verification (build 5359cb8efe, Playwright at 390×844, touch taps, fails on any console error)
| Check | Result |
|---|---|
| Build: `node tools/build.js --uat` | Pass |
| 26 Playwright suites, `tools/test-all.sh` | 25 pass every run. **gates** fails intermittently (see below). |
| procedures-all, "Check later" variant | Pass |
| `node tools/check-procgen-all.js` | Pass ("All 17 services identical") |
| docs/ under /PropApp/ (installable, offline, icons, no errors) | Pass |

**Known flake: `tests/gates.js`, "Bug 1" two-tab checks.** These are "two tabs saving together" and "a confirmed restore … isn't blended in". The suite passed 1 run in 3 on this build and fails on and off on earlier builds too. The cause is still open: timing between two open tabs, the localStorage journal and IndexedDB (`app/src/store.js`: `journalPending`, `replayJournal`). Normal use in a single tab isn't affected. `core` failed once in the full run and passed on rerun.

## Commands (run from `app/`)
```bash
npm install                    # esbuild + playwright (Chromium pre-installed in the cloud box)
node tools/build.js --uat      # -> dist/propapp.html, dist/propapp-standalone.html, dist/pwa/
tools/test-all.sh              # every suite + procgen parity, one line each
node tests/onboard.js          # any single suite
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
1. Root-cause the gates two-tab flake (`app/src/store.js`).
2. Post-trial v4 in-app AI architecture: parked for phase D3 (managed back end in Sydney, emailed-link sign-in, not yet built).
3. Deferred by the owner: push notifications, Monday plan.
