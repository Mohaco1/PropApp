#!/usr/bin/env bash
# Runs every Playwright suite at 390×844 and the procedure parity check. Prints one line per suite.
cd "$(dirname "$0")/.."
for t in core sprint1 sprint2 sprint3 sprint4 sprint5 screens setup-questions extras polish theme content2 v3 pwa wave1 wave2 gates wave3 pretrial sigil batch1 chaos hardening upgrade procedures-all onboard pharmledger foldable; do
  out=$(timeout 900 node tests/$t.js 2>&1); f=$(echo "$out" | grep -c '^FAIL')
  if echo "$out" | grep -q 'ALL PASS'; then echo "=== $t: ALL PASS"; else echo "=== $t: $f FAILED"; echo "$out" | grep '^FAIL' | cut -c1-160; fi
done
out=$(LATER=1 timeout 900 node tests/procedures-all.js 2>&1); echo "$out" | grep -q 'ALL PASS' && echo "=== procedures-all (Check later): ALL PASS" || { echo "=== procedures-all (Check later): FAILED"; echo "$out" | grep '^FAIL'; }
node tools/check-procgen-all.js 2>&1 | tail -1
