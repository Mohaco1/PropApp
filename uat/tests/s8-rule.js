// S8 inventory limit (Regulation 2026 s 111): every entry point and edge case. Fictional data only.
const { chromium } = require('playwright');
const APP = 'file:///home/user/rpharmacy/uat/app/' + (process.env.FILE || 'rpharmacy-uat-testing.html');
const res = []; const ok = (n, p, d = '') => res.push({ n, p: !!p, d: String(d).slice(0, 300) });
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto(APP); await p.waitForTimeout(1500);
  const E = (fn, a) => p.evaluate(fn, a), wait = (t = 250) => p.waitForTimeout(t);
  await E(() => { if (D.phone) { D.applyView(false); } const n = clone(); Object.assign(n, { freshSite: true, onboarded: true, freshProprietors: true, freshSelection: true, pharmacyName: 'Harbourview Test Pharmacy', proprietors: [{ id: 'p1', name: 'Alex Owner', primary: true }], currentReviewer: 'p1', active: ['daa', 'otp'] }); commit(n, 'fictional'); });
  const lim0 = await E(() => RPH.s8.limit());
  ok('no inventory on record: limit is 3 months from today', lim0 === await E(() => addInterval(today(), 3, 'months')), lim0);
  // first date (no S8 date yet)
  const r1 = await E(() => { const n = clone(); n.schedule.B1 = addInterval(today(), 4, 'months'); return commit(n, 'test'); });
  ok('setting a first S8 date beyond 3 months is refused', r1 === false && !(await E(() => state.schedule.B1)));
  const r2 = await E(() => { const n = clone(); n.schedule.B1 = addInterval(today(), 2, 'months'); return commit(n, 'test'); });
  ok('a first S8 date within 3 months saves', r2 !== false && await E(() => state.schedule.B1 === addInterval(today(), 2, 'months')));
  // Set a first date dialog and the bulk "Save dates" both go through the same save
  await E(() => { const n = clone(); delete n.schedule.B1; RPH.s8.__bypass = true; });
  // Change due date dialog
  const openDlg = () => E(() => RPH.schedule.dialog('B1'));
  const save = (date, reason) => E(([d, r]) => { const ed = $('editor'), i = ed.querySelector('input[type=date]'); i.value = d; i.dispatchEvent(new Event('input')); const t = ed.querySelector('input[aria-label="Reason for the change"]'); if (t && r) { t.value = r; t.dispatchEvent(new Event('input')); } [...ed.querySelectorAll('button')].find(x => x.textContent === 'Save new due date').click(); return { open: ed.open, err: ed.querySelector('[role=alert]')?.textContent || '' }; }, [date, reason]);
  await openDlg(); await wait();
  ok('Change due date shows the limit and the approved-times option', await E(() => /Latest date to stay on track|next 7 days/.test($('s8-limit')?.textContent || '') && !!$('s8-approved')));
  const over = await E(() => addInterval(today(), 3, 'months') > '' ? addInterval(addInterval(today(), 3, 'months'), 5, 'days') : '');
  let r = await save(over, 'Proprietor unavailable · visit rebooked'); await wait();
  ok('Change due date: beyond the limit is refused even with a reason', r.open && /on or before/.test(r.err) && await E(() => state.schedule.B1 === addInterval(today(), 2, 'months')), JSON.stringify(r));
  r = await save(await E(() => addInterval(today(), 80, 'days')), 'Aligning with another review'); await wait();
  ok('Change due date: within the limit with a reason saves', await E(() => state.schedule.B1 === addInterval(today(), 80, 'days')), JSON.stringify(r));
  // plain words path → same dialog
  await E(() => { CD.st.cal = 'Month'; CD.st.plain = 'S8 check ' + new Date(addInterval(addInterval(today(), 3, 'months'), 10, 'days') + 'T12:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }); CD.go('planner'); }); await wait();
  await E(() => [...document.querySelectorAll('#cd-view button')].find(x => x.textContent === 'Add').click()); await wait();
  r = await save(await E(() => $('editor').querySelector('input[type=date]').value), 'Proprietor unavailable · visit rebooked'); await wait();
  ok('Calendar plain words: a date beyond the limit is refused', r.open && /on or before/.test(r.err), JSON.stringify(r));
  await E(() => $('editor').close());
  // any other path (review completion, setup dates, reminders) uses commit
  const r3 = await E(() => { const n = clone(); n.schedule.B1 = addInterval(today(), 5, 'months'); return commit(n, 'other path'); });
  ok('any other save path is refused beyond the limit (guard on the save step)', r3 === false);
  const r4 = await E(() => { const n = clone(); delete n.schedule.B1; return commit(n, 'remove'); });
  ok('removing the S8 date is refused while S8 is active', r4 === false && !!(await E(() => state.schedule.B1)));
  // bulk first dates (fsSchedules) beyond the limit
  await E(() => fsSchedules()); await wait();
  const bulk = await E(() => { const ed = $('editor'); const lbl = [...ed.querySelectorAll('label')].find(l => /S8/.test(l.textContent)); if (!lbl) return 'no S8 field'; const i = lbl.querySelector('input'); i.value = addInterval(today(), 6, 'months'); i.dispatchEvent(new Event('input')); [...ed.querySelectorAll('button')].find(x => x.textContent === 'Save dates').click(); return state.schedule.B1; });
  ok('Initial review schedules: S8 beyond the limit is not saved', bulk === 'no S8 field' || bulk === await E(() => addInterval(today(), 80, 'days')), bulk);
  await E(() => { if ($('editor').open) $('editor').close(); });
  // inventory recorded → limit = stock date + 3 months; overdue → today
  await E(() => { const n = clone(); n.reviews.push({ id: 'r-s8', audit: 'B1', date: addInterval(today(), -10, 'days'), stockDate: addInterval(today(), -20, 'days'), at: new Date().toISOString(), by: 'Alex Owner', answers: [] }); commit(n, 'fictional inventory'); });
  ok('with an inventory recorded, the limit is 3 months after its date', await E(() => RPH.s8.limit() === addInterval(addInterval(today(), -20, 'days'), 3, 'months')));
  await E(() => { const n = clone(); n.reviews.find(x => x.id === 'r-s8').stockDate = addInterval(today(), -120, 'days'); s8Commit(n, 'fictional old inventory'); });
  ok('when overdue, there is a 7-day planning window', await E(() => RPH.s8.limit() === addInterval(today(), 7, 'days')));
  ok('overdue: a date within 7 days saves', await E(() => { const n = clone(); n.schedule.B1 = addInterval(today(), 6, 'days'); return s8Commit === undefined ? false : commit(n, 'plan') !== false; }) && await E(() => state.schedule.B1 === addInterval(today(), 6, 'days')));
  ok('overdue: a date after the 7 days is refused with a helpful message', await E(() => { const n = clone(); n.schedule.B1 = addInterval(today(), 10, 'days'); return commit(n, 'plan') === false && /overdue\. Plan it within the next 7 days/.test($('status').textContent); }));
  // approved other times
  await openDlg(); await wait();
  await E(() => { $('s8-approved').click(); }); await wait(100);
  r = await save(await E(() => addInterval(today(), 6, 'months')), 'Aligning with another review'); await wait();
  ok('approved times without a reference is refused', r.open && /approval reference/.test(r.err), JSON.stringify(r));
  await E(() => { $('s8-approval-ref').value = 'NSW Health letter TEST-123'; }); r = await save(await E(() => addInterval(today(), 6, 'months')), 'Aligning with another review'); await wait(300);
  ok('approved times with a reference allows a later date and records the approval', await E(() => state.schedule.B1 === addInterval(today(), 6, 'months') && RPH.s8.approved()?.reference === 'NSW Health letter TEST-123' && state.history.some(h => /approved S8 inventory times/.test(h.message || ''))));
  await openDlg(); await wait();
  ok('the window shows the recorded approval', await E(() => /approved other inventory times/.test($('s8-limit').textContent)));
  await E(() => [...$('s8-limit').querySelectorAll('button')].find(x => x.textContent === 'Remove the approval').click()); await wait(300);
  ok('the approval can be removed and the limit applies again', await E(() => !RPH.s8.approved() && /Latest date to stay on track|next 7 days/.test($('s8-limit')?.textContent || '')));
  await E(() => $('editor').close());
  // other reviews are not affected
  const q = await E(() => { const n = clone(); n.schedule.Q1 = addInterval(today(), 9, 'months'); return commit(n, 'Q1'); });
  ok('other reviews are not limited by the S8 rule', q !== false && await E(() => state.schedule.Q1 === addInterval(today(), 9, 'months')));
  ok('no script errors', !errs.length, errs.join(' | '));
  for (const x of res) console.log((x.p ? 'PASS ' : 'FAIL ') + x.n + (x.p ? '' : ' · ' + x.d));
  console.log(res.filter(x => x.p).length + '/' + res.length + ' passed');
  require('fs').writeFileSync('/home/user/rpharmacy/uat/tests/out/s8-results.json', JSON.stringify(res, null, 1));
  await b.close();
})();
