#!/usr/bin/env bash
# Runs every Playwright suite at 390×844 and the procedure parity check. Prints one line per suite.
cd "$(dirname "$0")/.."
# Stage 3E: the script itself fails (exit 1) if any suite exits non-zero or doesn't print ALL PASS.
status=0
for t in core sprint1 sprint2 sprint3 sprint4 sprint5 screens setup-questions onboarding-polish extras polish theme content2 v3 pwa wave1 wave2 gates wave3 pretrial sigil batch1 batch1a batch1b batch2a batch2b batch3 chaos hardening parity upgrade procedures-all onboard pharmledger foldable visual stage3a stage3b stage3c stage3d stage3e stage3f stage3gb; do
  out=$(timeout 900 node tests/$t.js 2>&1); rc=$?; f=$(echo "$out" | grep -c '^FAIL')
  if [ "$rc" = 0 ] && echo "$out" | grep -q 'ALL PASS'; then echo "=== $t: ALL PASS"; else status=1; echo "=== $t: $f FAILED (exit $rc)"; echo "$out" | grep '^FAIL' | cut -c1-160; [ "$f" = 0 ] && echo "$out" | tail -3 | cut -c1-200; fi
done
out=$(LATER=1 timeout 900 node tests/procedures-all.js 2>&1); rc=$?; if [ "$rc" = 0 ] && echo "$out" | grep -q 'ALL PASS'; then echo "=== procedures-all (Check later): ALL PASS"; else status=1; echo "=== procedures-all (Check later): FAILED (exit $rc)"; echo "$out" | grep '^FAIL'; fi
out=$(node tools/check-procgen-all.js 2>&1); rc=$?; echo "$out" | tail -1; [ "$rc" = 0 ] || status=1
[ "$status" = 0 ] && echo "=== TOTAL: ALL PASS" || echo "=== TOTAL: FAILED"
exit $status
