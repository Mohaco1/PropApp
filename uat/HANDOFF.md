# HANDOFF: resume UAT v28 on another computer

## Where things stand (19 Nov 2026)
- **UAT (permanent link, use this)**: https://claude.ai/artifact/Vnn6KXsNkkEe7Ywc3DbnWN · file `uat/app/rpharmacy-uat-testing.html` · notes in its db (`uatnotes`, `uatquestions`). See `UAT-ORDER.md`.
- **v36 (UAT build, test this one)**: https://claude.ai/artifact/1ycTCYkEXZNRs19VJ5RRdf. Order in `UAT-ORDER.md`. The UAT tools layer (`layers/uat-tools.js`) must be removed from the build before any real release.
- **v35 (test this one: the combined build)**: https://claude.ai/artifact/VgtSt4SbfGzuchoPmMFQGj. See `V35-PHASE2.md`.
- **v34 (test this one)**: https://claude.ai/artifact/B6pZg23FjNx1hbjpRQQcZH. Every page is Concept D.
- **v33 (test this one)**: https://claude.ai/artifact/2abNHY7K4tu3paCeERxDNn. Every page Concept D except History filters/exports and the Locations/backup sub-page (both in the Concept D frame).
- **v32 (latest)**: https://claude.ai/artifact/BKM3ccSc1uYD5A1T7mPXbk. S8 rule added; see `V32-S8.md`.
- **v31 (latest, overnight)**: https://claude.ai/artifact/GJdNKqu2XqNjUWJT1CD1M1. Read `V31-SUMMARY.md` and `S8-RULE-FOR-APPROVAL.md`.
- **v30 (Concept D frontend)**: https://claude.ai/artifact/D8UZBRAfsknuF68zy964jM. See `V30-CONCEPT-D-FRONTEND.md`. Rebuild with `node uat/build-uat.js`. Tests: `node tests/cd-functional.js`, `node tests/uat-phoneview.js`, `node tests/cd-shots.js` then `python3 tests/pair.py`. Git branch `conceptd-frontend`; v29 checkpoint in `checkpoints/`.
- v29 (full Concept D + phone view) is published to the same UAT link and tested. See the v29 section in `IMPLEMENTATION-SUMMARY.md` and `TEST-RESULTS.md`.
- Next step: **your UAT walkthrough** (`UAT-WALKTHROUGH.md`), then decisions D-1 to D-8.
- Dev v27 (`dev/proprietor-hub.html`) is unchanged and remains the fallback.

## Key files
- App: `uat/app/rpharmacy-uat-v28-conceptD.html`. Open it in Chrome or Edge, or use the published UAT artifact: https://claude.ai/artifact/TCsSGa9P6CfcmvDpR9M9TS (new and separate; the dev and original artifacts are untouched).
- Only new code: `uat/layers/conceptD-ui-layer.js`. Rebuild with `node uat/build-uat.js`.
- Tests: from `uat/tests`, run `node uat-functional.js`, `node uat-verify2.js`, `node uat-capture.js`, `node uat-phoneview.js` and `node hid.js` (dialog and page controls compared with v27). Existing suites are in `uat/tests/suites/`, with v27 copies in `suites-dev/`; walk-all uses `APP=../uat/app/rpharmacy-uat-v28-conceptD.html`.
- Baseline (v27): `uat/baseline/`.

## Resuming with Claude
Give Claude the zip (`R-Pharmacy-UAT-v28.zip`) or this repository folder, plus this file and `UAT-PROGRESS.md`. Say which items you've tested and what you found. Data you entered in the browser stays in that browser; use **Download backup** in a local copy to move it.

## Rules carried forward
- Proprietor-only. Fictional data only.
- Never auto-approve, complete or close anything.
- Don't change compliance rules without verification.
- Don't touch Drive, the Design Studio, dev v27 or the original.
- No production deployment.
