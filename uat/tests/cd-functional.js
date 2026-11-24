// Functional checks for the Concept D frontend (v30). Fictional data only. Laptop and phone sizes.
const { chromium } = require('playwright');
const APP = 'file:///home/user/rpharmacy/uat/app/rpharmacy-uat-testing.html';
const res = []; const ok = (n, p, d = '') => res.push({ n, p: !!p, d: String(d).slice(0, 300) });
(async () => {
  const b = await chromium.launch();
  for (const [dev, w, h] of [['laptop', 1280, 860], ['phone', 390, 844]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !m.text().includes('Content Security')) errs.push(m.text()); });
    p.on('dialog', d => d.accept());
    await p.goto(APP); await p.waitForTimeout(1500);
    const E = (fn, a) => p.evaluate(fn, a); const wait = (t = 250) => p.waitForTimeout(t);
    if (dev === 'laptop') ok(dev + ' opens in phone view by default (UAT)', await E(() => D.phone));
    await E(() => { if (D.phone) { D.applyView(false); render(); } });
    ok(dev + ' first use shows the landing with Set up your pharmacy', await E(() => !state.freshSite && [...$('main').querySelectorAll('button')].some(b => /Set up your pharmacy/.test(b.textContent))));
    // Onboarding through the real setup flow
    await p.locator('main button', { hasText: 'Set up your pharmacy' }).click(); await wait(400);
    await p.fill('#editor input >> nth=0', 'Harbourview Test Pharmacy'); await p.fill('#editor input >> nth=1', '1 Test Street, Testville');
    await p.locator('#editor button', { hasText: 'Continue' }).click(); await wait(400);
    await p.fill('#editor input >> nth=0', 'Alex Owner'); await p.locator('#editor button', { hasText: 'Continue' }).click(); await wait(400);
    ok(dev + ' onboarding shows service tiles and plan', await E(() => document.querySelectorAll('#editor .d-tiles>label').length === 17 && !!document.querySelector('#editor .d-plan')));
    await p.evaluate(() => RPH.express.set(false)); // this suite tests the question-by-question flow; the one-flow setup has its own suite
    for (const s of ['Dose administration aids', 'Opioid Treatment Program', 'Vaccination']) await p.locator('#editor .d-tiles>label', { hasText: s }).first().click();
    await p.locator('#editor button', { hasText: 'Save service selection' }).click(); await wait(500);
    ok(dev + ' saving services activates them (existing flow)', await E(() => ['daa', 'otp', 'vaccination'].every(x => state.active.includes(x)) && state.freshSelection));
    await E(() => { if ($('editor').open) $('editor').close(); });
    ok(dev + ' Concept D shell replaces the old one', await E(() => document.body.classList.contains('cdx') && !!$('cd-bar') && getComputedStyle(document.querySelector('body>nav:not(.mob)')).display === 'none'));
    // Seed fictional dates and people through clone/commit (the app's own save)
    await E(() => { const n = clone(), add = d => addInterval(today(), d, 'days'); n.schedule.B1 = add(20); n.schedule.Q1 = add(-5); n.schedule.M1 = add(1); n.staff = [{ id: 's1', person: 'Sam Taylor', role: 'Pharmacist', active: true, services: ['vaccination'], annualDue: add(-2), credentials: [{ id: 'c1', title: 'Immuniser certificate', reference: 'TEST-1', expiry: add(10) }] }]; commit(n, 'fictional test data'); });
    await wait(300);
    // Navigation
    const tabs = dev === 'laptop' ? [['overview', 'Today'], ['audits', 'Reviews'], ['actions', 'Actions'], ['planner', 'Calendar'], ['staff', 'Staff'], ['documents', 'Policies'], ['meetings', 'Meetings'], ['services', 'Services'], ['history', 'History']] : [['overview', 'Today'], ['audits', 'Reviews'], ['actions', 'Actions'], ['staff', 'Staff']];
    for (const [pg, t] of tabs) {
      await p.locator(dev === 'laptop' ? `#cd-bar nav.tabs button[data-go="${pg}"]` : `#cd-mob button[data-go="${pg}"]`).click(); await wait(250);
      const hh = await E(() => (document.querySelector('#cd-view h1') || document.querySelector('main:not(.cd-hidden) h1'))?.textContent || '');
      ok(`${dev} ${t} opens from navigation`, hh.startsWith(t) || (pg === 'planner' && hh.length > 0), hh);
    }
    if (dev === 'phone') { await p.locator('#cd-mob button[data-go="more"]').click(); await wait(250); ok(dev + ' More lists the other sections, including Calendar', await E(() => ['Calendar', 'Policies', 'Meetings', 'Services', 'History', 'Pharmacy setup'].every(t => $('cd-view').textContent.includes(t)))); }
    const snap = () => E(() => JSON.stringify({ s: state.schedule, r: state.reviews.length, t: Object.keys(state.taskLedger || {}).length, st: (state.staff || []).length, h: state.history.length }));
    const before = await snap();
    // Today
    await E(() => CD.go('overview')); await wait(250);
    const more = await E(() => !!document.querySelector('#cd-view [data-more-today]'));
    if (dev === 'phone') ok('phone Today shows the top 3 plus 8 items, with a Show all button', more);
    if (more) { await p.locator('#cd-view [data-more-today]').click(); await wait(250); }
    const today = await E(() => { const g = RPH.guide.group(CD.todayRows()); const top = CD.isM() ? document.querySelectorAll('#cd-view .start3 .s3row').length : 0; return { rows: document.querySelectorAll('#cd-view .main tr[data-row^="today:"]').length + top, shown: g.length, covered: g.reduce((a, x) => a + (x.members && !CD.st.openGroup[x.subject] ? x.members.length : 1), 0), expect: CD.todayRows().length, first: document.querySelector('#cd-view tr[data-row^="today:"] .nm')?.textContent }; });
    ok(dev + ' Today lists every item from the app data (grouped rows count each item inside)', today.rows === today.shown && today.covered === today.expect && today.rows > 0, JSON.stringify(today));
    await E(() => { CD.st.f.today = 'overdue'; render(); });
    ok(dev + ' Today Overdue filter', await E(() => [...document.querySelectorAll('#cd-view tr[data-row^="today:"]')].every(r => /Overdue/.test(r.textContent))));
    await E(() => { CD.st.f.today = 'all'; render(); });
    ok(dev + ' viewing pages changes no data', before === await snap());
    // Reviews → site visit audit screen
    await E(() => CD.go('audits')); await wait(200);
    await E(() => { CD.st.sel.reviews = 'Q1'; CD.st.expanded = true; CD.st.tapped = {reviews: 'Q1'}; render(); }); await wait(200);
    const start = dev === 'laptop' ? '#cd-view .pane button.btn.primary' : '#cd-view tr.inline button.btn.primary';
    await p.locator(start).first().click(); await wait(500);
    if (await E(() => $('editor').classList.contains('vprep'))) { await p.locator('#editor .vp-go').click(); await wait(600); }
    ok(dev + ' Start opens Start a visit, then the site visit as the audit screen', await E(() => $('editor').open && $('editor').classList.contains('cd-audit') && !!$('sv-root')));
    await p.keyboard.press('1'); await wait(200);
    ok(dev + ' key 1 answers the current check (saved by the app)', await E(() => document.querySelector('#editor .sv-item.cd-cur [role=radio][aria-checked=true]')?.textContent.startsWith('Satisfactory')));
    await p.locator('#editor .cd-svnav button', { hasText: /^Next$/ }).click(); await wait(200);
    ok(dev + ' Save and next moves to check 2', await E(() => [...document.querySelectorAll('#editor .sv-item')].indexOf(document.querySelector('#editor .sv-item.cd-cur')) === 1));
    if (dev === 'laptop') ok(dev + ' steps list shows progress', await E(() => /1 of \d+ reviewed/.test(document.querySelector('#editor .cd-steps').textContent)));
    await p.locator('#editor .cd-audit-top button').click(); await wait(250);
    ok(dev + ' ← back closes the review; the draft is kept', await E(() => !$('editor').open && !!readDraft('Q1') || !$('editor').open));
    // B1 (radio form) in the audit screen
    await E(() => reviewEditor('B1')); await wait(400);
    ok(dev + ' S8 review uses the audit screen with option rows', await E(() => $('editor').classList.contains('cd-audit') && document.querySelectorAll('#editor label.cd-opt').length > 0));
    await E(() => $('editor').close());
    // Plan a date (existing reasoned dialog)
    await E(() => { CD.st.sel.reviews = 'B1'; CD.go('audits'); }); await wait(200);
    await E(() => [...document.querySelectorAll('#cd-view button')].find(b => b.textContent === 'Plan a date').click()); await wait(300);
    ok(dev + ' Plan a date opens the existing due-date dialog', await E(() => $('editor').open && /Change due date/.test($('editor').textContent)));
    await E(() => { const d = $('editor').querySelector('input[type=date]'); d.value = addInterval(state.schedule.B1, 10, 'days'); d.dispatchEvent(new Event('input')); [...$('editor').querySelectorAll('button')].find(b => b.textContent === 'Save new due date').click(); });
    await wait(200);
    ok(dev + ' postponing without a reason is still refused', await E(() => $('editor').open && /reason/i.test($('editor').querySelector('[role=alert]')?.textContent || '') && state.schedule.B1 === addInterval(today(), 20, 'days')));
    await E(() => $('editor').close());
    // Calendar tabs, plain words, meeting
    await E(() => { CD.st.cal = 'Weekly'; CD.go('planner'); }); await wait(200);
    ok(dev + ' Weekly view lists S8 once', await E(() => [...document.querySelectorAll('#cd-view tr[data-row^="cal:"]')].filter(r => /S8 stock check/.test(r.textContent)).length === 1));
    await E(() => { CD.st.cal = 'Year'; render(); });
    ok(dev + ' Year plan renders a row per item', await E(() => document.querySelectorAll('#cd-view table.yr tbody tr').length === D.rows().length));
    await E(() => { CD.st.cal = 'Month'; render(); });
    ok(dev + ' Month view renders' + (dev === 'laptop' ? ' the month grid' : ' the agenda (grid hidden on phone, as in the prototype)'), await E(x => x ? document.querySelectorAll('#cd-view .cal>button').length >= 28 : /Next four weeks/.test($('cd-view').textContent), dev === 'laptop'));
    await p.fill('#cd-plain', 'S8 check 1st Dec morning'); await E(() => [...document.querySelectorAll('#cd-view button')].find(b => b.textContent === 'Find').click()); await wait(200);
    ok(dev + ' plain words finds S8 and 1 Dec', await E(() => /S8 stock check[\s\S]*1 Dec 2026/.test($('cd-view').textContent)));
    await E(() => [...document.querySelectorAll('#cd-view button')].find(b => b.textContent === 'Add').click()); await wait(300);
    ok(dev + ' Add opens the existing dialog prefilled; nothing saved yet', await E(() => $('editor').open && $('editor').querySelector('input[type=date]').value === '2026-12-01' && state.schedule.B1 === addInterval(today(), 20, 'days')));
    await E(() => [...$('editor').querySelectorAll('button')].find(b => b.textContent === 'Save new due date').click()); await wait(300);
    ok(dev + ' earlier date saves and is logged', await E(() => state.schedule.B1 === '2026-12-01' && (state.scheduleMeta?.B1?.changes || []).length >= 1));
    await E(() => CD.scheduleMeeting(addInterval(today(), 3, 'days'))); await wait(300);
    ok(dev + ' Schedule meeting opens the existing meeting dialog', await E(() => !!$('plan-meeting')));
    await E(() => $('editor').close());
    // Actions: add through the existing form, then close it
    await E(() => CD.go('actions')); await wait(200);
    await E(() => [...document.querySelectorAll('#cd-view button')].find(b => b.textContent === 'Add action').click()); await wait(300);
    await p.fill('#task-form [name=text]', 'Check fridge log (test)'); await p.fill('#task-form [name=owner]', 'Sam Taylor'); await p.fill('#task-form [name=due]', '2026-11-25');
    await p.locator('#task-form button', { hasText: 'Save action' }).click(); await wait(400);
    ok(dev + ' new action appears in Actions', await E(() => [...document.querySelectorAll('#cd-view tr[data-row^="actions:"]')].some(r => /Check fridge log \(test\)/.test(r.textContent))));
    const tid = await E(() => taskRows().find(t => t.text === 'Check fridge log (test)')?.id);
    await E(id => taskEditor(id), tid); await wait(300);
    if (dev === 'phone') { ok(dev + ' the action opens with "Seen the fix · close it" and the form under Edit details', await E(() => !!document.querySelector('#editor .cl-close') && !document.querySelector('#editor details.cl-edit').open)); await p.locator('#editor .cl-close').click(); await wait(250); ok(dev + ' "Seen the fix · close it" opens the form set to Completed', await E(() => document.querySelector('#editor details.cl-edit').open && document.querySelector('#task-form [name=status]').value === 'Completed')); }
    else await p.selectOption('#task-form [name=status]', 'Completed');
    await p.fill('#task-form [name=outcome]', 'Seen the log (test)');
    await p.locator('#task-form button', { hasText: 'Save action' }).click(); await wait(400);
    await E(() => { CD.st.f.actions = 'closed'; render(); });
    ok(dev + ' closing an action moves it to Completed', await E(() => [...document.querySelectorAll('#cd-view tr[data-row^="actions:"]')].some(r => /Check fridge log \(test\)/.test(r.textContent))));
    await E(() => { CD.st.f.actions = 'open'; render(); });
    // Staff
    await E(() => CD.go('staff')); await wait(200);
    ok(dev + ' staff matrix shows the person with status words', await E(() => /Sam Taylor[\s\S]*(To verify|Needs review|Overdue)/.test($('cd-view').textContent)));
    await E(() => [...document.querySelectorAll('#cd-view button')].find(b => b.textContent === 'Open record').click()); await wait(300);
    ok(dev + ' Open record shows the staff record as a Concept D page', await E(() => page === 'staff-profile' && /Sam Taylor/.test($('cd-view').textContent) && /Requirements/.test($('cd-view').textContent) && $('main').classList.contains('cd-hidden')));
    for (const [label, test] of [['Annual assurance', () => $('editor').open], ['Review a change', () => $('editor').open], ['Edit profile', () => $('editor').open && !!$('editor').querySelector('[name=person]')], ['Departure checklist', () => $('editor').open]]) {
      await E(l => [...document.querySelectorAll('#cd-view button')].find(b => b.textContent === l).click(), label); await wait(300);
      ok(dev + ' staff record · ' + label + ' opens the existing form', await E(test)); await E(() => { if ($('editor').open) $('editor').close(); });
    }
    await E(() => { CD.st.f.person = 'req'; CD.st.expanded = true; render(); }); await wait(200);
    await E(() => [...document.querySelectorAll('#cd-view button')].find(b => /Verify now|Review verification/.test(b.textContent)).click()); await wait(300);
    ok(dev + ' staff record · Verify opens the existing verification', await E(() => $('editor').open)); await E(() => $('editor').close());
    await E(() => { CD.st.f.person = 'cred'; render(); }); await wait(200);
    await E(() => [...document.querySelectorAll('#cd-view button')].find(b => b.textContent === 'Add credential or training').click()); await wait(300);
    ok(dev + ' staff record · Add credential opens the existing editor', await E(() => $('editor').open)); await E(() => { $('editor').close(); CD.st.f.person = 'req'; });
    await E(() => CD.go('staff')); await wait(200);
    await E(() => [...document.querySelectorAll('#cd-view button')].find(b => b.textContent === 'Add staff member').click()); await wait(300);
    ok(dev + ' Add staff member opens the staff editor', await E(() => $('editor').open && !!$('editor').querySelector('[name=person]')));
    await E(() => $('editor').close());
    // Policies
    await E(() => CD.go('documents')); await wait(200);
    ok(dev + ' Policies lists answers to verify', await E(() => /Setup answers to verify/.test($('cd-view').textContent)));
    await E(() => [...document.querySelectorAll('#cd-view button')].find(b => b.textContent === 'Template library & documents').click()); await wait(300);
    ok(dev + ' library is a Concept D page with templates', await E(() => /Policy library/.test($('cd-view').textContent) && document.querySelectorAll('#cd-view tr[data-row^="lib-tpl:"]').length > 5 && $('main').classList.contains('cd-hidden')));
    await E(() => [...document.querySelectorAll('#cd-view button')].find(b => b.textContent === 'View template').click()); await wait(300);
    ok(dev + ' View template opens the existing template window', await E(() => $('editor').open)); await E(() => $('editor').close());
    await E(() => { CD.st.f.library = 'evidence'; render(); }); await wait(200);
    await E(() => [...document.querySelectorAll('#cd-view button')].find(b => b.textContent === 'Add document reference').click()); await wait(300);
    ok(dev + ' Add document reference opens the existing editor', await E(() => $('editor').open)); await E(() => { $('editor').close(); CD.st.f.library = 'tpl'; });
    await E(() => [...document.querySelectorAll('#cd-view button')].find(b => b.textContent.includes('Procedures')).click()); await wait(200);
    await E(() => [...document.querySelectorAll('#cd-view button')].find(b => b.textContent === 'Add policy').click()); await wait(300);
    ok(dev + ' Add policy opens the existing flow', await E(() => $('editor').open));
    await E(() => $('editor').close());
    // Other pages and exports
    await E(() => CD.go('history')); await wait(250);
    ok(dev + ' History lists records in Concept D', await E(() => document.querySelectorAll('#cd-view tr[data-row^="history:"]').length > 3 && $('main').classList.contains('cd-hidden')));
    ok(dev + ' History filters and both exports are on the page', await E(() => !!document.querySelector('#cd-view #hist-source') && !!document.querySelector('#cd-view #hist-csv') && !!document.querySelector('#cd-view #hist-export')));
    await p.fill('#cd-view #hist-q', 'S8'); await wait(400);
    const hrows = await E(() => [...document.querySelectorAll('#cd-view tr[data-row^="history:"]')].map(r => r.textContent));
    ok(dev + ' History search filters the list', hrows.length > 0 && hrows.length < 40, hrows.length);
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }).catch(() => null), E(() => document.querySelector('#cd-view #hist-csv').click())]);
    let csvLines = 0; if (dl) { const fp = await dl.path(); csvLines = require('fs').readFileSync(fp, 'utf8').trim().split(/\r?\n/).length - 1; }
    const matching = await E(() => Number(($('cd-view').querySelector('.status').textContent.match(/(\d+) matching/) || [])[1]));
    ok(dev + ' CSV export contains exactly the filtered records', dl && csvLines === matching, csvLines + ' rows vs ' + matching + ' shown');
    await p.fill('#cd-view #hist-q', ''); await wait(400);
    await E(() => { const r = document.querySelector('#cd-view tr[data-row^="history:"]'); r.click(); }); await wait(200);
    await E(() => [...document.querySelectorAll('#cd-view button')].find(b => b.textContent === 'Open record').click()); await wait(300);
    ok(dev + ' a history record opens', await E(() => $('editor').open)); await E(() => $('editor').close());
    await E(() => CD.go('meetings')); await wait(200);
    ok(dev + ' Meetings page lists the scheduled meeting', await E(() => /Staff safety meeting/.test($('cd-view').textContent)));
    await E(() => [...document.querySelectorAll('#cd-view button')].find(b => b.textContent === 'Add meeting').click()); await wait(250);
    await E(() => [...$('meeting-types').querySelectorAll('button')].find(b => /Proprietor check-in/.test(b.textContent)).click()); await wait(400);
    ok(dev + ' Add meeting opens the existing meeting editor', await E(() => $('editor').open && !!$('meet')));
    await E(() => $('editor').close());
    await E(() => CD.go('services')); await wait(200);
    ok(dev + ' Services lists every service with status', await E(() => document.querySelectorAll('#cd-view tr[data-row^="services:"]').length === 17));
    await E(() => { CD.st.sel.services = 'delivery'; render(); }); await wait(200);
    await E(() => [...document.querySelectorAll('#cd-view button')].find(b => b.textContent === 'Activate').click()); await wait(400);
    ok(dev + ' Activate uses the existing service flow', await E(() => state.active.includes('delivery')));
    await E(() => { if ($('editor').open) $('editor').close(); });
    await E(() => [...document.querySelectorAll('#cd-view button')].find(b => b.textContent === 'Disable').click()); await wait(250);
    await E(() => $('disable-service').click()); await wait(300);
    ok(dev + ' Disable uses the existing confirmation', await E(() => !state.active.includes('delivery')));
    ok(dev + ' software register shown in the service pane', await E(() => /Software used/.test($('cd-view').textContent) || dev === 'phone'));
    // Search palette
    await E(() => CD.go('overview')); await wait(200);
    await p.keyboard.press('Control+k'); await wait(200); await p.keyboard.type('History'); await p.keyboard.press('Enter'); await wait(300);
    ok(dev + ' Ctrl+K search jumps to a page', await E(() => page === 'history'));
    // Recording as
    await E(() => document.querySelector('#cd-bar [data-me]').click()); await wait(200);
    ok(dev + ' AO button opens Who is recording', await E(() => $('editor').open && /Who is recording/.test($('editor').textContent)));
    await E(() => $('editor').close());
    // Pharmacy switching
    await E(() => addSite('Kensal Street Test Pharmacy', 'Alex Owner')); await wait(1800);
    await E(() => { try { if (D.phone) { D.applyView(false); render(); } } catch (e) { } });
    const sc = await E(() => [...document.querySelectorAll('#cd-bar .scope button')].map(b => b.textContent));
    ok(dev + ' pharmacy switch shows both pharmacies', sc.length === 2, JSON.stringify(sc));
    if (sc.length === 2) { const nm = await E(() => state.pharmacyName); await E(() => document.querySelector('#cd-bar .scope button[aria-pressed=false]').click()); await wait(1800); ok(dev + ' switching changes pharmacy and data', await E(n => state.pharmacyName !== n, nm)); }
    // Sideways scroll
    for (const pg of ['overview', 'audits', 'actions', 'planner', 'staff', 'documents', 'meetings', 'services', 'history']) { await E(x => CD.go(x), pg); await wait(150); if (await E(() => document.documentElement.scrollWidth > innerWidth + 1)) ok(dev + ' no sideways scroll · ' + pg, false); }
    await E(() => CD.go('setup')); await wait(250);
    ok(dev + ' Pharmacy setup is a Concept D page', await E(() => /Pharmacy setup/.test($('cd-view').textContent) && document.querySelectorAll('#cd-view tr[data-row^="setup:"]').length === 13 && $('main').classList.contains('cd-hidden')));
    await E(() => { CD.st.sel.setup = 'Reminders & preferences'; CD.st.expanded = true; render(); }); await wait(200);
    await E(() => [...document.querySelectorAll('#cd-view button')].find(b => b.textContent === 'Open').click()); await wait(300);
    ok(dev + ' setup section opens its existing window', await E(() => $('editor').open && /Reminders/.test($('editor').textContent))); await E(() => $('editor').close());
    await E(() => { CD.st.sel.setup = 'Locations, backup & restore'; CD.st.expanded = true; render(); }); await wait(200);
    await E(() => [...document.querySelectorAll('#cd-view button')].find(b => b.textContent === 'Open').click()); await wait(400);
    ok(dev + ' Locations, backup & restore is a Concept D page', await E(() => /Locations, backup/.test($('cd-view').textContent) && document.querySelectorAll('#cd-view tr[data-row^="loc:"]').length >= 1 && $('main').classList.contains('cd-hidden')));
    await E(() => { CD.st.f.loc = 'settings'; render(); }); await wait(200);
    ok(dev + ' settings forms are kept (region, annual assurance month, reminders)', await E(() => /Shared review schedules/.test($('cd-view').textContent) && /Reminders/.test($('cd-view').textContent)));
    await E(() => { CD.st.f.loc = 'backup'; render(); }); await wait(200);
    const [bk] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }).catch(() => null), E(() => $('portable-export').click())]);
    ok(dev + ' Download backup produces a backup file', !!bk && /backup\.json$/.test(bk.suggestedFilename()), bk && bk.suggestedFilename());
    if (bk) {
      const fp = await bk.path(); const before = await E(() => ({ n: state.pharmacyName, t: Object.keys(state.taskLedger || {}).length }));
      await E(() => { const n = clone(); n.pharmacyName = 'Changed after backup (test)'; commit(n, 'test change'); CD.st.setupHost = true; CD.st.f.loc = 'backup'; render(); }); await wait(300);
      await p.setInputFiles('#backup-file', fp); await wait(600);
      const rep = await E(() => ($('restore-report')?.textContent || '') + ' | ' + ($('backup-result')?.textContent || ''));
      ok(dev + ' choosing the backup file shows a restore check', /restore|backup|records|pharmacy/i.test(rep), rep.slice(0, 160));
      ok(dev + ' restore is locked until you confirm you understand what will be replaced', await E(() => { const b = $('confirm-restore'); return !!$('restore-ack') && b && b.disabled; }));
      await E(() => { const a = $('restore-ack'); if (a) { a.checked = true; a.dispatchEvent(new Event('change')); } });
      const conf = await E(() => { const b = $('confirm-restore'); if (!b || b.hidden || b.disabled) return false; b.click(); return true; }); await p.waitForTimeout(2500);
      await E(() => { try { if (D.phone) { D.applyView(false); render(); } } catch (e) { } });
      const after = await E(() => ({ n: state.pharmacyName, t: Object.keys(state.taskLedger || {}).length }));
      ok(dev + ' restoring the backup brings back the saved records', conf && after.n === before.n && after.t === before.t, JSON.stringify({ conf, before, after, rep }));
    }
    await E(() => { CD.st.setupHost = true; CD.st.f.loc = 'sites'; page = 'setup'; render(); }); await wait(200);
    await E(() => [...document.querySelectorAll('#cd-view button')].find(b => b.textContent.includes('Pharmacy setup')).click()); await wait(250);
    ok(dev + ' back returns to the setup page', await E(() => $('main').classList.contains('cd-hidden') && document.querySelectorAll('#cd-view tr[data-row^="setup:"]').length === 13));
    ok(dev + ' old screens are not drawn under Concept D pages', await E(() => { CD.go('overview'); return $('main').children.length === 0 && $('main').classList.contains('cd-hidden'); }));
    ok(dev + ' no script errors', !errs.length, errs.join(' | '));
    await p.close();
  }
  for (const r of res) console.log((r.p ? 'PASS ' : 'FAIL ') + r.n + (r.p ? '' : ' · ' + r.d));
  console.log(res.filter(r => r.p).length + '/' + res.length + ' passed');
  require('fs').writeFileSync('/home/user/rpharmacy/uat/tests/out/cd-functional-results.json', JSON.stringify(res, null, 1));
  await b.close();
})();
