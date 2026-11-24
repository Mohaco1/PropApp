# Test results: UAT v28 · Concept D (19 Nov 2026)

All tests use fictional data in headless Chromium, at laptop (1280×860) and phone (390×844) sizes. Nothing has been tested on a real device or by a person yet.

## Automated: passed
| Test | What it checks | Result |
|---|---|---|
| Existing suites, run on v27 and on the UAT copy and compared (`tests/suites/`): check-buttons, check-ui, labels-check, records-check, doc-check, acct-check, multi-check | Setup cards, labels, records, procedure documents, the account backup round trip and multi-select | **7/7 identical output** to v27 |
| walk-all (all 17 service setups walked to the end) | Every service setup, its procedure text and the tasks it raises | **17/17 identical** to the v27 baseline report |
| Control inventory (`tests/uat-capture.js`) | Every button and field inside each page, compared with the v27 baseline on 8 pages × 2 sizes | **Nothing missing.** The only difference is the label of my test-setup history entry |
| Functional (`tests/uat-functional.js`) | Listed below | **45/45** |
| Second verification (`tests/uat-verify2.js`), written separately against the preservation checklist | Listed below | **36/36** |
| Script errors | All runs | **None.** The only console message is the CSP notice, which v27 also shows |
| Sideways scrolling | 9 pages, plus the Calendar tabs, at both sizes | **None** |

### Functional checks (both sizes)
**Onboarding**
- The service step shows 17 tiles.
- "Your plan so far" updates as you tick.
- Ticking saves nothing.
- Saving activates exactly the chosen services through the existing flow.

**Calendar**
- Calendar opens from the tabs on a laptop and from More on a phone.
- Switching between the three tabs changes no data (the schedule, reviews and history are compared before and after).
- S8 appears once in the weekly view.

**Plan in plain words**
- It finds "S8 stock check" and 1 Dec 2026.
- "Add" opens the existing due-date dialog with 1 Dec filled in.
- Nothing is saved before you confirm.
- Saving an earlier date works and is logged.
- **Pushing a date later without a reason is still refused.**

**Staff**
- The matrix shows one row per person, and search still filters it.
- Clicking a row opens the detail pane.
- Clicking the name opens the existing staff record.

**Other**
- Ctrl+K opens jump search, and Enter goes to the page.
- The editor is a side pane on a laptop and a full sheet on a phone, and Esc closes it.
- The pharmacy switcher lists both fictional pharmacies, and switching changes the pharmacy.

### Second verification (both sizes)
**First use and navigation**
- A new browser store still shows the first-use landing page.
- All 9 original pages are still in the navigation.
- "Recording as" is present.

**Audits and Calendar**
- The Audits tabs are unchanged.
- The Month tab uses the existing grid, and the selected day lists the scheduled meeting.
- "Schedule meeting" opens the existing dialog.
- Going back to Audits after the Calendar restores the Audits tab.
- A review opens from a Calendar row in the existing editor.

**Other pages and storage**
- Tasks, Policies, Meetings, History and Services all render, and the History exports are present.
- Pharmacy setup opens.
- No new saved fields.

## Manual checks I did (screenshots in `tests/out/`)
I reviewed the screenshots of each page at both sizes:
- Calendar weekly, year and month
- Staff matrix
- Onboarding tiles
- Overview
- Audits
- Landing page

Layout problems found and fixed during this pass:
- A gap above the headings
- The notification bar stretching to full height
- Dates wrapping on a phone
- The plan summary sitting below 17 tiles on a phone
- The "Ctrl K" hint showing on a phone

## Not verified
- A real phone or tablet, and Safari or Firefox.
- Screen-reader announcements; the roles and labels were added but not tested with a reader.
- The ⌘K shortcut on a Mac. The code handles it, but only Ctrl+K was tested.
- Account save and restore through claude.ai inside the published artifact (the same as v27; never tested live).
- File downloads inside the claude.ai viewer. They're blocked there, as in v27, so test exports from a local copy.
- Long real-world data: many staff, years of history.
