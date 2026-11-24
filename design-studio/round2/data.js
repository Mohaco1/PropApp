/* R.Pharmacy Design Studio · Round 2 shared scenario.
   Every concept renders this same data so they can be compared fairly.
   All people, pharmacies and dates are fictional. "Today" is Thursday 19 November 2026.
   Sources quoted are only ones already used in the app (e.g. § Reg 2026 s 111 for the S8 check);
   no new legal frequencies are invented. */
window.RPH = {
  today: 'Thursday 19 November',
  todayShort: 'Thu 19 Nov',
  proprietor: { name: 'Alex Owner', first: 'Alex', initials: 'AO' },

  pharmacies: [
    { id: 'hv', name: 'Harbourview Pharmacy', short: 'Harbourview', overdue: 1, dueSoon: 3, verify: 7, actions: 3, onTrack: 4 },
    { id: 'ks', name: 'Kensal Street Pharmacy', short: 'Kensal Street', overdue: 0, dueSoon: 1, verify: 2, actions: 1, onTrack: 7 }
  ],

  /* status: overdue | soon | ok */
  audits: [
    { id: 'visit', name: 'Site visit', cadence: 'Every 8 weeks', last: '8 Sep', due: '3 Nov', dueLabel: 'Overdue 16 days', status: 'overdue', checks: 6, source: 'Your plan', area: 'Whole pharmacy', zone: 'all' },
    { id: 'creds', name: 'Staff credentials review', cadence: 'Every 3 months', last: '20 Aug', due: '20 Nov', dueLabel: 'Due tomorrow', status: 'soon', checks: 4, source: 'Your plan', area: 'Staff', zone: 'office' },
    { id: 'cold', name: 'Cold chain review', cadence: 'Monthly', last: '30 Oct', due: '30 Nov', dueLabel: 'Due 30 Nov', status: 'soon', checks: 5, source: 'Storage standards', area: 'Medicine storage', zone: 'fridge' },
    { id: 's8', name: 'S8 stock check', cadence: 'Legal requirement', last: '1 Sep', due: '1 Dec', dueLabel: 'Due 1 Dec', status: 'soon', checks: 3, source: '§ Reg 2026 s 111', legal: true, area: 'Controlled drugs', zone: 'safe' },
    { id: 'daa', name: 'DAA packing check', cadence: 'Monthly', last: '4 Nov', due: '4 Dec', dueLabel: 'Due 4 Dec', status: 'ok', checks: 6, source: 'Pharmacy Board DAA guideline', area: 'Dose administration aids', zone: 'daa' },
    { id: 'vfridge', name: 'Vaccination fridge audit', cadence: 'Monthly', last: '6 Nov', due: '6 Dec', dueLabel: 'Due 6 Dec', status: 'ok', checks: 4, source: 'Storage standards', area: 'Vaccination', zone: 'fridge' },
    { id: 'clean', name: 'Dispensary cleanliness', cadence: 'Monthly', last: '9 Nov', due: '9 Dec', dueLabel: 'Due 9 Dec', status: 'ok', checks: 5, source: 'Your plan', area: 'Dispensary', zone: 'dispensary' },
    { id: 'fire', name: 'Fire safety walk-through', cadence: 'Every 6 months', last: '14 Jul', due: '14 Jan', dueLabel: 'Due 14 Jan', status: 'ok', checks: 6, source: 'Your plan', area: 'Premises', zone: 'front' }
  ],

  /* The site visit in progress: check 1 done, check 2 is current. */
  visit: {
    title: 'Site visit', pharmacy: 'Harbourview', started: '2:10pm',
    checks: [
      { id: 'c1', name: 'Premises and security', prompt: 'Doors, alarm, after-hours access and signage.', last: 'Satisfactory', answer: 'Satisfactory', zone: 'front' },
      { id: 'c2', name: 'Medicine storage and stock', prompt: 'Storage conditions, fridge exceptions, recalls and out-of-date stock since your last visit.', last: 'Satisfactory', answer: null, zone: 'fridge', source: 'Storage standards' },
      { id: 'c3', name: 'Records and registers', prompt: 'S8 register, prescription records and recall log are up to date.', last: 'Satisfactory', answer: null, zone: 'safe' },
      { id: 'c4', name: 'Dispensing and labelling', prompt: 'Labels, checks and the dispensing workflow on the day.', last: 'Satisfactory', answer: null, zone: 'dispensary' },
      { id: 'c5', name: 'Pharmacist on duty and supervision', prompt: 'Pharmacist present and supervising; roster matches the day.', last: 'Satisfactory', answer: null, zone: 'dispensary' },
      { id: 'c6', name: 'Privacy and counselling area', prompt: 'Private area available and fit for counselling and vaccination.', last: 'Satisfactory', answer: null, zone: 'consult' }
    ],
    answers: ['Satisfactory', 'Issue', 'Needs verification', 'Not applicable'],
    findings: ['Out-of-date stock', 'Fridge log gaps', 'Recall not actioned', 'Storage too warm', 'Something else']
  },

  /* Actions (Tasks). state: check (ready for proprietor's check) | staff (waiting on someone) | closed */
  actions: [
    { id: 't1', title: 'Fix fridge log gaps', state: 'check', owner: 'Sam Taylor', due: '25 Nov', from: 'Cold chain review · 30 Oct', zone: 'fridge',
      trail: [ ['30 Oct', 'You found an issue: fridge log missed two readings'], ['30 Oct', 'You raised this Task for Sam, due 25 Nov'], ['12 Nov', 'You noted Sam’s update: “Reminders set for 9am and 5pm.” 1 photo'], ['Now', 'Your check: look at this week’s log, then close or reopen'] ] },
    { id: 't2', title: 'Confirm where OTP approvals are filed', state: 'staff', owner: 'Sam Taylor', due: 'Fri 20 Nov', from: 'Check-in · 21 Oct', zone: 'office',
      trail: [ ['21 Oct', 'Raised at your check-in with Sam'] ] },
    { id: 't3', title: 'Look at a second fridge thermometer', state: 'staff', owner: 'Priya Nair', due: '15 Dec', from: 'Check-in · 21 Oct', zone: 'fridge',
      trail: [ ['21 Oct', 'Raised at your check-in'] ] },
    { id: 't4', title: 'Replace expired stock on shelf 4', state: 'closed', owner: 'Jordan Lee', due: '15 Nov', closed: '12 Nov', from: 'Dispensary cleanliness · 9 Nov', zone: 'dispensary', trail: [] },
    { id: 't5', title: 'Update after-hours contact list', state: 'closed', owner: 'Sam Taylor', due: '5 Nov', closed: '3 Nov', from: 'Check-in · 21 Oct', zone: 'office', trail: [] }
  ],

  /* Setup answers marked "Needs verification" */
  verify: [
    { service: 'OTP', text: 'PBS approval for this pharmacy' },
    { service: 'OTP', text: 'Where dosing records are kept' },
    { service: 'DAA', text: 'Written consent for PPA-funded packs' },
    { service: 'DAA', text: 'Who checks packed aids before release' },
    { service: 'DAA', text: 'Where packing takes place' },
    { service: 'Vaccination', text: 'Where temperature records are kept' },
    { service: 'Delivery', text: 'Who signs at handover' }
  ],

  /* Upcoming obligations (next 4 weeks) */
  upcoming: [
    { date: '20 Nov', dow: 'Fri', title: 'Staff credentials review', kind: 'audit', ref: 'creds' },
    { date: '20 Nov', dow: 'Fri', title: 'OTP approvals location (Sam)', kind: 'task', ref: 't2' },
    { date: '25 Nov', dow: 'Wed', title: 'Proprietor check-in with Sam', kind: 'meeting' },
    { date: '25 Nov', dow: 'Wed', title: 'Fridge log gaps: your check', kind: 'task', ref: 't1' },
    { date: '30 Nov', dow: 'Mon', title: 'Cold chain review', kind: 'audit', ref: 'cold' },
    { date: '1 Dec', dow: 'Tue', title: 'S8 stock check', kind: 'legal', ref: 's8' },
    { date: '4 Dec', dow: 'Fri', title: 'DAA packing check', kind: 'audit', ref: 'daa' },
    { date: '6 Dec', dow: 'Sun', title: 'Vaccination fridge audit', kind: 'audit', ref: 'vfridge' },
    { date: '9 Dec', dow: 'Wed', title: 'Dispensary cleanliness', kind: 'audit', ref: 'clean' },
    { date: '15 Dec', dow: 'Tue', title: 'Second fridge thermometer (Priya)', kind: 'task', ref: 't3' }
  ],

  /* Staff assurance. status: soon | ok */
  staff: [
    { id: 's1', name: 'Sam Taylor', role: 'Pharmacist in charge', status: 'soon', note: 'Registration renewal date in your record: 30 Nov',
      creds: [ ['Pharmacist registration', 'Renewal 30 Nov · checked on public register 2 Nov', 'soon'], ['Immunisation training', 'Certificate on file · 14 Mar', 'ok'], ['First aid and CPR', 'Refresher due Jun', 'ok'], ['Performance and development review', 'Held 9 Jul, as your local policy sets', 'ok'] ] },
    { id: 's2', name: 'Priya Nair', role: 'Pharmacist', status: 'ok', note: 'All records current',
      creds: [ ['Pharmacist registration', 'Checked on public register 2 Nov', 'ok'], ['Immunisation training', 'Certificate on file · 2 Feb', 'ok'], ['First aid and CPR', 'Refresher due Mar', 'ok'] ] },
    { id: 's3', name: 'Mia Chen', role: 'Dispensary technician', status: 'ok', note: 'All records current',
      creds: [ ['Training record', 'Updated 30 Sep', 'ok'], ['DAA packing sign-off', 'Recorded 4 Nov', 'ok'] ] },
    { id: 's4', name: 'Jordan Lee', role: 'Pharmacy assistant', status: 'ok', note: 'All records current',
      creds: [ ['Training record', 'Updated 14 Oct', 'ok'] ] }
  ],

  /* Policies and procedures (SOPs). status: draft | review | approved */
  sops: [
    { id: 'p1', name: 'Dose administration aids', status: 'draft', note: '3 answers marked to verify', version: 'Draft', zone: 'daa' },
    { id: 'p2', name: 'Cold chain and fridge management', status: 'review', note: 'Yearly review you set: December', version: 'v2 · approved 4 Dec 2025', zone: 'fridge' },
    { id: 'p3', name: 'Vaccination', status: 'approved', note: 'Approved by you 2 Nov', version: 'v3', zone: 'consult' },
    { id: 'p4', name: 'Opioid treatment (OTP)', status: 'approved', note: 'Approved by you 2 Nov', version: 'v2', zone: 'safe' },
    { id: 'p5', name: 'Controlled drugs (S8) handling', status: 'approved', note: 'Approved by you 2 Nov', version: 'v2', zone: 'safe' },
    { id: 'p6', name: 'Home delivery', status: 'approved', note: 'Approved by you 28 Oct', version: 'v1', zone: 'front' },
    { id: 'p7', name: 'Dispensing and labelling', status: 'approved', note: 'Approved by you 28 Oct', version: 'v1', zone: 'dispensary' },
    { id: 'p8', name: 'Pharmacist prescribing', status: 'approved', note: 'Approved by you 28 Oct', version: 'v1', zone: 'consult' }
  ],
  sopTotals: { total: 17, approved: 15, draft: 1, review: 1 },
  sopPreview: {
    title: 'Dose administration aids',
    lines: [
      ['A pharmacist verifies the current medication list before any packing starts.', 'From your answers'],
      ['Written consent is held for each patient whose packs are PPA-funded.', 'Marked to verify'],
      ['Packed aids are checked by a second person before release.', 'From your answers']
    ]
  },

  /* Physical zones (used by the spatial concept, and as tags elsewhere) */
  zones: [
    { id: 'front', name: 'Front of shop' },
    { id: 'consult', name: 'Consulting room' },
    { id: 'dispensary', name: 'Dispensary' },
    { id: 'fridge', name: 'Fridges and cold chain' },
    { id: 'safe', name: 'S8 safe and registers' },
    { id: 'daa', name: 'DAA packing area' },
    { id: 'office', name: 'Back office' }
  ]
};
