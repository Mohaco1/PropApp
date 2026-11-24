/* R.Pharmacy Design Studio: catalogue of every design found in the project.
   IDs are stable: notes and picks are saved against these IDs, so keep them unchanged.
   To add a design later: put its file in designs/ and add an entry below. */
window.CATALOGUE = {
  designs: {
    // Round 3: five finalists (A–C are the unchanged Round 2 originals; D and E are new hybrids)
    'r3-A': { name: 'A · Quiet Precision (original)', src: 'round2/concept-a.html', kind: 'page', origin: 'Round 3 finalist · Round 2 original, unchanged' },
    'r3-B': { name: 'B · Command Centre (original)', src: 'round2/concept-b.html', kind: 'page', origin: 'Round 3 finalist · Round 2 original, unchanged' },
    'r3-C': { name: 'C · Guided Path (original)', src: 'round2/concept-c.html', kind: 'page', origin: 'Round 3 finalist · Round 2 original, unchanged' },
    'r3-D': { name: 'D · Precision Command (new)', src: 'round3/concept-d.html', kind: 'page', origin: 'Round 3 hybrid · A’s calm system with B’s queue, pane, scope and matrices' },
    'r3-E': { name: 'E · Guided Precision (new)', src: 'round3/concept-e.html', kind: 'page', origin: 'Round 3 hybrid · A’s calm interface with C’s guided checks in place, selective B' },

    // Round 2: five concepts (each is one interactive prototype; the section picks the page)
    'r2-A': { name: 'A · Quiet Precision', src: 'round2/concept-a.html', kind: 'page', origin: 'Round 2 · typography and spacing, one ordered list, details open in place' },
    'r2-B': { name: 'B · Command Centre', src: 'round2/concept-b.html', kind: 'page', origin: 'Round 2 · dense workspace, queue and detail pane, both pharmacies side by side' },
    'r2-C': { name: 'C · Guided Path', src: 'round2/concept-c.html', kind: 'page', origin: 'Round 2 · your next step, then short guided flows' },
    'r2-D': { name: 'D · Editorial', src: 'round2/concept-d.html', kind: 'page', origin: 'Round 2 · reads like a daily briefing, typeset register and documents' },
    'r2-E': { name: 'E · The Floor', src: 'round2/concept-e.html', kind: 'page', origin: 'Round 2 · the floor plan is the navigation' },

    // Current app (v27): real screenshots, fictional data
    'app-overview':  { name: 'Current app · Overview',  src: 'designs/current-app/overview.png',  kind: 'image', origin: 'Current R.Pharmacy app (v27), fictional data' },
    'app-audits':    { name: 'Current app · Audits & reviews', src: 'designs/current-app/audits.png', kind: 'image', origin: 'Current R.Pharmacy app (v27), fictional data' },
    'app-tasks':     { name: 'Current app · Tasks',     src: 'designs/current-app/actions.png',   kind: 'image', origin: 'Current R.Pharmacy app (v27), fictional data' },
    'app-staff':     { name: 'Current app · Staff & credentials', src: 'designs/current-app/staff.png', kind: 'image', origin: 'Current R.Pharmacy app (v27), fictional data' },
    'app-meetings':  { name: 'Current app · Meetings',  src: 'designs/current-app/meetings.png',  kind: 'image', origin: 'Current R.Pharmacy app (v27), fictional data' },
    'app-documents': { name: 'Current app · Policies, procedures & documents', src: 'designs/current-app/documents.png', kind: 'image', origin: 'Current R.Pharmacy app (v27), fictional data' },
    'app-services':  { name: 'Current app · Services',  src: 'designs/current-app/services.png',  kind: 'image', origin: 'Current R.Pharmacy app (v27), fictional data' },
    'app-history':   { name: 'Current app · History',   src: 'designs/current-app/history.png',   kind: 'image', origin: 'Current R.Pharmacy app (v27), fictional data' },
    'screenbook':    { name: 'Current app · Screen Book (all 116 setup screens)', src: 'designs/screenbook/index.html', kind: 'page', origin: 'Screen Book, captured from the app' },

    // 7 · Your Mix: built from the proprietor's studio notes
    'Y1-Mix-Today': { name: '7 Your Mix · Today', src: 'designs/mockups/Y1-Mix-Today.html', kind: 'page', origin: 'Built from your notes (19 Nov): Field Kit structure, Home C colours, Pulse greeting, Ledger type' },
    'Y2-Mix-Audits': { name: '7 Your Mix · Audits', src: 'designs/mockups/Y2-Mix-Audits.html', kind: 'page', origin: 'Built from your notes (19 Nov): Field Kit structure, Home C colours, Pulse greeting, Ledger type' },
    'Y3-Mix-Visit': { name: '7 Your Mix · Site visit check', src: 'designs/mockups/Y3-Mix-Visit.html', kind: 'page', origin: 'Built from your notes (19 Nov): Field Kit structure, Home C colours, Pulse greeting, Ledger type' },
    'Y4-Mix-Question': { name: '7 Your Mix · Setup question', src: 'designs/mockups/Y4-Mix-Question.html', kind: 'page', origin: 'Built from your notes (19 Nov): Field Kit structure, Home C colours, Pulse greeting, Ledger type' },
    'Y5-Mix-Tasks': { name: '7 Your Mix · Tasks', src: 'designs/mockups/Y5-Mix-Tasks.html', kind: 'page', origin: 'Built from your notes (19 Nov): Field Kit structure, Home C colours, Pulse greeting, Ledger type' },
    'Y6-Mix-History': { name: '7 Your Mix · History', src: 'designs/mockups/Y6-Mix-History.html', kind: 'page', origin: 'Built from your notes (19 Nov): Field Kit structure, Home C colours, Pulse greeting, Ledger type' },
    'Y7-Mix-Evidence': { name: '7 Your Mix · Snap evidence', src: 'designs/mockups/Y7-Mix-Evidence.html', kind: 'page', origin: 'Built from your notes (19 Nov): Field Kit structure, Home C colours, Pulse greeting, Ledger type' },

    // First trials (UI Trials canvas)
    'Main':              { name: 'Home A · app as it was', src: 'designs/mockups/Main.html', kind: 'page', origin: 'First trials' },
    'HomeB-Today':       { name: 'Home B · Today first', src: 'designs/mockups/HomeB-Today.html', kind: 'page', origin: 'First trials' },
    'HomeC-Tiles':       { name: 'Home C · Tiles and next step', src: 'designs/mockups/HomeC-Tiles.html', kind: 'page', origin: 'First trials' },
    'QuestionA-Current': { name: 'Question A · app as it was', src: 'designs/mockups/QuestionA-Current.html', kind: 'page', origin: 'First trials' },
    'QuestionB-Sheet':   { name: 'Question B · Thumb sheet', src: 'designs/mockups/QuestionB-Sheet.html', kind: 'page', origin: 'First trials' },
    'QuestionC-OneTap':  { name: 'Question C · One tap with Undo', src: 'designs/mockups/QuestionC-OneTap.html', kind: 'page', origin: 'First trials' },

    // Five design directions + the combined one
    'D1-Ledger-Today': { name: '1 Quiet Ledger · Today', src: 'designs/mockups/D1-Ledger-Today.html', kind: 'page', origin: 'Design directions' },
    'D1-Ledger-Question': { name: '1 Quiet Ledger · Question', src: 'designs/mockups/D1-Ledger-Question.html', kind: 'page', origin: 'Design directions' },
    'D1-Ledger-Visit': { name: '1 Quiet Ledger · Site visit', src: 'designs/mockups/D1-Ledger-Visit.html', kind: 'page', origin: 'Design directions' },
    'D2-Pulse-Today': { name: '2 Pulse Board · Today', src: 'designs/mockups/D2-Pulse-Today.html', kind: 'page', origin: 'Design directions' },
    'D2-Pulse-Question': { name: '2 Pulse Board · Question', src: 'designs/mockups/D2-Pulse-Question.html', kind: 'page', origin: 'Design directions' },
    'D2-Pulse-Visit': { name: '2 Pulse Board · Site visit', src: 'designs/mockups/D2-Pulse-Visit.html', kind: 'page', origin: 'Design directions' },
    'D3-Field-Today': { name: '3 Field Kit · Today', src: 'designs/mockups/D3-Field-Today.html', kind: 'page', origin: 'Design directions' },
    'D3-Field-Question': { name: '3 Field Kit · Question', src: 'designs/mockups/D3-Field-Question.html', kind: 'page', origin: 'Design directions' },
    'D3-Field-Visit': { name: '3 Field Kit · Site visit', src: 'designs/mockups/D3-Field-Visit.html', kind: 'page', origin: 'Design directions' },
    'D4-Trail-Today': { name: '4 Evidence Trail · Today', src: 'designs/mockups/D4-Trail-Today.html', kind: 'page', origin: 'Design directions' },
    'D4-Trail-Question': { name: '4 Evidence Trail · Question', src: 'designs/mockups/D4-Trail-Question.html', kind: 'page', origin: 'Design directions' },
    'D4-Trail-Visit': { name: '4 Evidence Trail · Site visit', src: 'designs/mockups/D4-Trail-Visit.html', kind: 'page', origin: 'Design directions' },
    'D5-Night-Today': { name: '5 Night Shift · Today', src: 'designs/mockups/D5-Night-Today.html', kind: 'page', origin: 'Design directions' },
    'D5-Night-Question': { name: '5 Night Shift · Question', src: 'designs/mockups/D5-Night-Question.html', kind: 'page', origin: 'Design directions' },
    'D5-Night-Visit': { name: '5 Night Shift · Site visit', src: 'designs/mockups/D5-Night-Visit.html', kind: 'page', origin: 'Design directions' },
    'D6-FieldLedger-Today': { name: '6 Field Ledger · Today', src: 'designs/mockups/D6-FieldLedger-Today.html', kind: 'page', origin: 'Combined design (from the critique)' },
    'D6-FieldLedger-Night': { name: '6 Field Ledger · Today at night', src: 'designs/mockups/D6-FieldLedger-Night.html', kind: 'page', origin: 'Combined design (from the critique)' },
    'D6-FieldLedger-Question': { name: '6 Field Ledger · Question', src: 'designs/mockups/D6-FieldLedger-Question.html', kind: 'page', origin: 'Combined design (from the critique)' },
    'D6-FieldLedger-Visit': { name: '6 Field Ledger · Site visit', src: 'designs/mockups/D6-FieldLedger-Visit.html', kind: 'page', origin: 'Combined design (from the critique)' },
    'D6-FieldLedger-Task': { name: '6 Field Ledger · Task', src: 'designs/mockups/D6-FieldLedger-Task.html', kind: 'page', origin: 'Combined design (from the critique)' },

    // Key flows
    'F1-Task-Detail': { name: 'Flow · Task detail', src: 'designs/mockups/F1-Task-Detail.html', kind: 'page', origin: 'Key flows' },
    'F2-Year-Plan': { name: 'Flow · Year plan', src: 'designs/mockups/F2-Year-Plan.html', kind: 'page', origin: 'Key flows' },
    'F3-Multi-Site': { name: 'Flow · All pharmacies', src: 'designs/mockups/F3-Multi-Site.html', kind: 'page', origin: 'Key flows' },
    'F4-Visit-Summary': { name: 'Flow · Visit recorded', src: 'designs/mockups/F4-Visit-Summary.html', kind: 'page', origin: 'Key flows' },
    'F5-SOP-Review': { name: 'Flow · SOP review', src: 'designs/mockups/F5-SOP-Review.html', kind: 'page', origin: 'Key flows' },
    'F6-Inspection-Pack': { name: 'Flow · Inspection pack', src: 'designs/mockups/F6-Inspection-Pack.html', kind: 'page', origin: 'Key flows' },

    // Award-inspired
    'A1-Tide-Weeks': { name: 'Tide Guide → next 8 weeks', src: 'designs/mockups/A1-Tide-Weeks.html', kind: 'page', origin: 'Award-inspired' },
    'A2-Duty-Recall': { name: 'Watch Duty → recall alert', src: 'designs/mockups/A2-Duty-Recall.html', kind: 'page', origin: 'Award-inspired' },
    'A3-Moon-Cycle': { name: 'Moonlitt → plan your visit', src: 'designs/mockups/A3-Moon-Cycle.html', kind: 'page', origin: 'Award-inspired' },
    'A4-Cap-Evidence': { name: 'CapWords → snap evidence', src: 'designs/mockups/A4-Cap-Evidence.html', kind: 'page', origin: 'Award-inspired' },
    'A5-Listen-SOP': { name: 'Speechify → listen to SOP', src: 'designs/mockups/A5-Listen-SOP.html', kind: 'page', origin: 'Award-inspired' },

    // New designs (added in the design loop)
    'N1-Onboarding-Services': { name: 'New · Onboarding: what do you offer?', src: 'designs/mockups/N1-Onboarding-Services.html', kind: 'page', origin: 'New design · one question per screen with a live plan preview (onboarding apps like Headspace)' },
    'N2-Staff-Wallet': { name: 'New · Staff credential wallet', src: 'designs/mockups/N2-Staff-Wallet.html', kind: 'page', origin: 'New design · stacked cards per person, soonest renewal on top (Apple Wallet)' },
    'N3-Meeting-Notes': { name: 'New · Meeting notes that become Tasks', src: 'designs/mockups/N3-Meeting-Notes.html', kind: 'page', origin: 'New design · agenda built from open items, one tap turns a note into a Task (Granola-style notes)' },
    'N4-Settings': { name: 'New · Settings with backup first', src: 'designs/mockups/N4-Settings.html', kind: 'page', origin: 'New design · grouped lists (iOS Settings), backup status at the top, dark mode after 6pm' },
    'N5-Audit-History-Grid': { name: 'New · Audits with last-12-times grid', src: 'designs/mockups/N5-Audit-History-Grid.html', kind: 'page', origin: 'New design · each audit shows its last 12 due dates as squares (GitHub contribution grid)' },
    'N6-Lock-Screen': { name: 'New · Lock screen widget and reminders', src: 'designs/mockups/N6-Lock-Screen.html', kind: 'page', origin: 'New design · glanceable widget plus at most one calm reminder a day (iOS widgets and notifications)' },
    'N7-History-Search': { name: 'New · Search your record', src: 'designs/mockups/N7-History-Search.html', kind: 'page', origin: 'New design · one search across visits, Tasks, SOPs and photos for inspector questions (Spotlight / Raycast)' },
    'N8-Desktop-Today': { name: 'New · Laptop layout: Today (three panes)', src: 'designs/mockups/N8-Desktop-Today.html', kind: 'page', origin: 'New design · sidebar, list and detail side by side for the laptop (Linear / Mail)', w: 1280, h: 800 },
    'N9-Document-Shelf': { name: 'New · Documents: attention shelf + folders', src: 'designs/mockups/N9-Document-Shelf.html', kind: 'page', origin: 'New design · a swipeable shelf of documents needing review above plain folders (Files / Dropbox)' },
    'N10-Calendar-Month': { name: 'New · Month calendar with plain-words planning', src: 'designs/mockups/N10-Calendar-Month.html', kind: 'page', origin: 'New design · type “S8 check 1st Dec morning” and confirm; dots show legal vs your plan (Fantastical)' },
    'N11-Tasks-Board': { name: 'New · Tasks by who it’s waiting on', src: 'designs/mockups/N11-Tasks-Board.html', kind: 'page', origin: 'New design · three tabs: With staff, Your check, Closed; only you close (Trello / Linear boards)' },

    // Style variants of the thinner sections (same content, three styles)
    'V-audits-FieldKit': { name: 'Field Kit · Audits', src: 'designs/mockups/V-audits-FieldKit.html', kind: 'page', origin: 'Style variant · same content drawn in Field Kit' },
    'V-audits-Trail': { name: 'Evidence Trail · Audits', src: 'designs/mockups/V-audits-Trail.html', kind: 'page', origin: 'Style variant · same content drawn in Evidence Trail' },
    'V-audits-Night': { name: 'Night Shift · Audits', src: 'designs/mockups/V-audits-Night.html', kind: 'page', origin: 'Style variant · same content drawn in Night Shift' },
    'V-staff-FieldKit': { name: 'Field Kit · Staff', src: 'designs/mockups/V-staff-FieldKit.html', kind: 'page', origin: 'Style variant · same content drawn in Field Kit' },
    'V-staff-Trail': { name: 'Evidence Trail · Staff', src: 'designs/mockups/V-staff-Trail.html', kind: 'page', origin: 'Style variant · same content drawn in Evidence Trail' },
    'V-staff-Night': { name: 'Night Shift · Staff', src: 'designs/mockups/V-staff-Night.html', kind: 'page', origin: 'Style variant · same content drawn in Night Shift' },
    'V-meetings-FieldKit': { name: 'Field Kit · Meetings', src: 'designs/mockups/V-meetings-FieldKit.html', kind: 'page', origin: 'Style variant · same content drawn in Field Kit' },
    'V-meetings-Trail': { name: 'Evidence Trail · Meetings', src: 'designs/mockups/V-meetings-Trail.html', kind: 'page', origin: 'Style variant · same content drawn in Evidence Trail' },
    'V-meetings-Night': { name: 'Night Shift · Meetings', src: 'designs/mockups/V-meetings-Night.html', kind: 'page', origin: 'Style variant · same content drawn in Night Shift' },
    'V-onboarding-FieldKit': { name: 'Field Kit · Onboarding', src: 'designs/mockups/V-onboarding-FieldKit.html', kind: 'page', origin: 'Style variant · same content drawn in Field Kit' },
    'V-onboarding-Trail': { name: 'Evidence Trail · Onboarding', src: 'designs/mockups/V-onboarding-Trail.html', kind: 'page', origin: 'Style variant · same content drawn in Evidence Trail' },
    'V-onboarding-Night': { name: 'Night Shift · Onboarding', src: 'designs/mockups/V-onboarding-Night.html', kind: 'page', origin: 'Style variant · same content drawn in Night Shift' },
    'V-settings-FieldKit': { name: 'Field Kit · Settings', src: 'designs/mockups/V-settings-FieldKit.html', kind: 'page', origin: 'Style variant · same content drawn in Field Kit' },
    'V-settings-Trail': { name: 'Evidence Trail · Settings', src: 'designs/mockups/V-settings-Trail.html', kind: 'page', origin: 'Style variant · same content drawn in Evidence Trail' },
    'V-settings-Night': { name: 'Night Shift · Settings', src: 'designs/mockups/V-settings-Night.html', kind: 'page', origin: 'Style variant · same content drawn in Night Shift' },

    'V-policies-FieldKit': { name: 'Field Kit · Policies', src: 'designs/mockups/V-policies-FieldKit.html', kind: 'page', origin: 'Style variant · same content drawn in Field Kit' },
    'V-policies-Trail': { name: 'Evidence Trail · Policies', src: 'designs/mockups/V-policies-Trail.html', kind: 'page', origin: 'Style variant · same content drawn in Evidence Trail' },
    'V-policies-Night': { name: 'Night Shift · Policies', src: 'designs/mockups/V-policies-Night.html', kind: 'page', origin: 'Style variant · same content drawn in Night Shift' },
    'V-documents-FieldKit': { name: 'Field Kit · Documents', src: 'designs/mockups/V-documents-FieldKit.html', kind: 'page', origin: 'Style variant · same content drawn in Field Kit' },
    'V-documents-Trail': { name: 'Evidence Trail · Documents', src: 'designs/mockups/V-documents-Trail.html', kind: 'page', origin: 'Style variant · same content drawn in Evidence Trail' },
    'V-documents-Night': { name: 'Night Shift · Documents', src: 'designs/mockups/V-documents-Night.html', kind: 'page', origin: 'Style variant · same content drawn in Night Shift' },
    'V-calendar-FieldKit': { name: 'Field Kit · Calendar', src: 'designs/mockups/V-calendar-FieldKit.html', kind: 'page', origin: 'Style variant · same content drawn in Field Kit' },
    'V-calendar-Trail': { name: 'Evidence Trail · Calendar', src: 'designs/mockups/V-calendar-Trail.html', kind: 'page', origin: 'Style variant · same content drawn in Evidence Trail' },
    'V-calendar-Night': { name: 'Night Shift · Calendar', src: 'designs/mockups/V-calendar-Night.html', kind: 'page', origin: 'Style variant · same content drawn in Night Shift' },
    'V-history-FieldKit': { name: 'Field Kit · History', src: 'designs/mockups/V-history-FieldKit.html', kind: 'page', origin: 'Style variant · same content drawn in Field Kit' },
    'V-history-Trail': { name: 'Evidence Trail · History', src: 'designs/mockups/V-history-Trail.html', kind: 'page', origin: 'Style variant · same content drawn in Evidence Trail' },
    'V-history-Night': { name: 'Night Shift · History', src: 'designs/mockups/V-history-Night.html', kind: 'page', origin: 'Style variant · same content drawn in Night Shift' },
    'V-tasks-FieldKit': { name: 'Field Kit · Tasks', src: 'designs/mockups/V-tasks-FieldKit.html', kind: 'page', origin: 'Style variant · same content drawn in Field Kit' },
    'V-tasks-Trail': { name: 'Evidence Trail · Tasks', src: 'designs/mockups/V-tasks-Trail.html', kind: 'page', origin: 'Style variant · same content drawn in Evidence Trail' },
    'V-tasks-Night': { name: 'Night Shift · Tasks', src: 'designs/mockups/V-tasks-Night.html', kind: 'page', origin: 'Style variant · same content drawn in Night Shift' },

    'Brief': { name: 'Design brief and inspiration', src: 'designs/mockups/Brief.html', kind: 'page', origin: 'Brief', w: 1280, h: 1960 }
  },

  sections: [
    { group: 'Round 3 · Five finalists', groupLink: 'round3/index.html', groupLinkLabel: 'Open the Round 3 space', id: 'r3-overall', name: 'Whole finalists (start here)', hash: 'dashboard', designs: ['r3-A', 'r3-B', 'r3-C', 'r3-D', 'r3-E'] },
    { group: 'Round 3 · Five finalists', groupLink: 'round3/index.html', groupLinkLabel: 'Open the Round 3 space', id: 'r3-dashboard', name: 'Today / Dashboard', hash: 'dashboard', designs: ['r3-A', 'r3-B', 'r3-C', 'r3-D', 'r3-E'] },
    { group: 'Round 3 · Five finalists', groupLink: 'round3/index.html', groupLinkLabel: 'Open the Round 3 space', id: 'r3-audits', name: 'Audits', hash: 'audits', designs: ['r3-A', 'r3-B', 'r3-C', 'r3-D', 'r3-E'] },
    { group: 'Round 3 · Five finalists', groupLink: 'round3/index.html', groupLinkLabel: 'Open the Round 3 space', id: 'r3-audit', name: 'Audit check-in', hash: 'audit', designs: ['r3-A', 'r3-B', 'r3-C', 'r3-D', 'r3-E'] },
    { group: 'Round 3 · Five finalists', groupLink: 'round3/index.html', groupLinkLabel: 'Open the Round 3 space', id: 'r3-actions', name: 'Actions', hash: 'actions', designs: ['r3-A', 'r3-B', 'r3-C', 'r3-D', 'r3-E'] },
    { group: 'Round 3 · Five finalists', groupLink: 'round3/index.html', groupLinkLabel: 'Open the Round 3 space', id: 'r3-calendar', name: 'Calendar', hash: 'calendar', designs: ['r3-A', 'r3-B', 'r3-C', 'r3-D', 'r3-E'] },
    { group: 'Round 3 · Five finalists', groupLink: 'round3/index.html', groupLinkLabel: 'Open the Round 3 space', id: 'r3-staff', name: 'Staff assurance', hash: 'staff', designs: ['r3-A', 'r3-B', 'r3-C', 'r3-D', 'r3-E'] },
    { group: 'Round 3 · Five finalists', groupLink: 'round3/index.html', groupLinkLabel: 'Open the Round 3 space', id: 'r3-policies', name: 'Policies and procedures', hash: 'policies', designs: ['r3-A', 'r3-B', 'r3-C', 'r3-D', 'r3-E'] },
    { group: 'Round 2 · Five concepts', groupLink: 'round2/index.html', groupLinkLabel: 'Open the Round 2 space', id: 'r2-overall', name: 'Whole concepts (start here)', hash: 'dashboard', designs: ['r2-A', 'r2-B', 'r2-C', 'r2-D', 'r2-E'] },
    { group: 'Round 2 · Five concepts', groupLink: 'round2/index.html', groupLinkLabel: 'Open the Round 2 space', id: 'r2-dashboard', name: 'Dashboard / Today', hash: 'dashboard', designs: ['r2-A', 'r2-B', 'r2-C', 'r2-D', 'r2-E'] },
    { group: 'Round 2 · Five concepts', groupLink: 'round2/index.html', groupLinkLabel: 'Open the Round 2 space', id: 'r2-audits', name: 'Audits and reviews', hash: 'audits', designs: ['r2-A', 'r2-B', 'r2-C', 'r2-D', 'r2-E'] },
    { group: 'Round 2 · Five concepts', groupLink: 'round2/index.html', groupLinkLabel: 'Open the Round 2 space', id: 'r2-audit', name: 'Audit check-in', hash: 'audit', designs: ['r2-A', 'r2-B', 'r2-C', 'r2-D', 'r2-E'] },
    { group: 'Round 2 · Five concepts', groupLink: 'round2/index.html', groupLinkLabel: 'Open the Round 2 space', id: 'r2-actions', name: 'Actions and follow-ups', hash: 'actions', designs: ['r2-A', 'r2-B', 'r2-C', 'r2-D', 'r2-E'] },
    { group: 'Round 2 · Five concepts', groupLink: 'round2/index.html', groupLinkLabel: 'Open the Round 2 space', id: 'r2-calendar', name: 'Calendar / upcoming', hash: 'calendar', designs: ['r2-A', 'r2-B', 'r2-C', 'r2-D', 'r2-E'] },
    { group: 'Round 2 · Five concepts', groupLink: 'round2/index.html', groupLinkLabel: 'Open the Round 2 space', id: 'r2-staff', name: 'Staff assurance', hash: 'staff', designs: ['r2-A', 'r2-B', 'r2-C', 'r2-D', 'r2-E'] },
    { group: 'Round 2 · Five concepts', groupLink: 'round2/index.html', groupLinkLabel: 'Open the Round 2 space', id: 'r2-policies', name: 'Policies and procedures', hash: 'policies', designs: ['r2-A', 'r2-B', 'r2-C', 'r2-D', 'r2-E'] },
    { group: 'Round 1 · Earlier designs', id: 'dashboard', name: 'Dashboard / Today', designs: ['Y1-Mix-Today', 'app-overview', 'Main', 'HomeB-Today', 'HomeC-Tiles', 'D1-Ledger-Today', 'D2-Pulse-Today', 'D3-Field-Today', 'D4-Trail-Today', 'D5-Night-Today', 'D6-FieldLedger-Today', 'D6-FieldLedger-Night', 'F3-Multi-Site', 'N6-Lock-Screen', 'N8-Desktop-Today'] },
    { group: 'Round 1 · Earlier designs', id: 'audits', name: 'Audits and Reviews', designs: ['Y2-Mix-Audits', 'app-audits', 'N5-Audit-History-Grid', 'V-audits-FieldKit', 'V-audits-Trail', 'V-audits-Night'] },
    { group: 'Round 1 · Earlier designs', id: 'checkin', name: 'Site visit / check-in forms', designs: ['Y3-Mix-Visit', 'Y7-Mix-Evidence', 'D1-Ledger-Visit', 'D2-Pulse-Visit', 'D3-Field-Visit', 'D4-Trail-Visit', 'D5-Night-Visit', 'D6-FieldLedger-Visit', 'F4-Visit-Summary', 'A4-Cap-Evidence'] },
    { group: 'Round 1 · Earlier designs', id: 'tasks', name: 'Actions and Tasks', designs: ['Y5-Mix-Tasks', 'app-tasks', 'F1-Task-Detail', 'D6-FieldLedger-Task', 'A2-Duty-Recall', 'N11-Tasks-Board', 'V-tasks-FieldKit', 'V-tasks-Trail', 'V-tasks-Night'] },
    { group: 'Round 1 · Earlier designs', id: 'calendar', name: 'Calendar and planning', designs: ['F2-Year-Plan', 'A1-Tide-Weeks', 'A3-Moon-Cycle', 'N10-Calendar-Month', 'V-calendar-FieldKit', 'V-calendar-Trail', 'V-calendar-Night'] },
    { group: 'Round 1 · Earlier designs', id: 'staff', name: 'Staff Assurance', designs: ['app-staff', 'N2-Staff-Wallet', 'V-staff-FieldKit', 'V-staff-Trail', 'V-staff-Night'] },
    { group: 'Round 1 · Earlier designs', id: 'meetings', name: 'Meetings and Check-ins', designs: ['app-meetings', 'N3-Meeting-Notes', 'V-meetings-FieldKit', 'V-meetings-Trail', 'V-meetings-Night'] },
    { group: 'Round 1 · Earlier designs', id: 'setup', name: 'Service setup questions', designs: ['Y4-Mix-Question', 'screenbook', 'QuestionA-Current', 'QuestionB-Sheet', 'QuestionC-OneTap', 'D1-Ledger-Question', 'D2-Pulse-Question', 'D3-Field-Question', 'D4-Trail-Question', 'D5-Night-Question', 'D6-FieldLedger-Question'] },
    { group: 'Round 1 · Earlier designs', id: 'policies', name: 'Policies and Procedures', designs: ['app-services', 'F5-SOP-Review', 'A5-Listen-SOP', 'V-policies-FieldKit', 'V-policies-Trail', 'V-policies-Night'] },
    { group: 'Round 1 · Earlier designs', id: 'documents', name: 'Document Library', designs: ['app-documents', 'F6-Inspection-Pack', 'N9-Document-Shelf', 'V-documents-FieldKit', 'V-documents-Trail', 'V-documents-Night'] },
    { group: 'Round 1 · Earlier designs', id: 'history', name: 'History and Evidence', designs: ['Y6-Mix-History', 'app-history', 'D4-Trail-Today', 'A4-Cap-Evidence', 'N7-History-Search', 'V-history-FieldKit', 'V-history-Trail', 'V-history-Night'] },
    { group: 'Round 1 · Earlier designs', id: 'onboarding', name: 'Onboarding', designs: ['N1-Onboarding-Services', 'V-onboarding-FieldKit', 'V-onboarding-Trail', 'V-onboarding-Night'] },
    { group: 'Round 1 · Earlier designs', id: 'settings', name: 'Settings', designs: ['N4-Settings', 'V-settings-FieldKit', 'V-settings-Trail', 'V-settings-Night'] },
    { group: 'Round 1 · Earlier designs', id: 'brief', name: 'Design brief', designs: ['Brief'] }
  ],

  components: ['Overall layout', 'Header', 'Navigation', 'Summary / counts', 'Lists and rows', 'Cards', 'Buttons', 'Answer options', 'Status colours', 'Source tags', 'Progress', 'Forms and notes', 'Typography', 'Colours', 'Spacing', 'Dark mode', 'Wording']
};
