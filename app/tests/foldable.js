// Foldables (26 Nov 2026): Galaxy Z Fold cover screen (344×882) keeps the phone layout; unfolded (768×882 and 882×768)
// gets a left rail and list + record side by side. Real touch taps; fails on any console error.
const { phone, ok, done } = require('./helpers.js'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '../handoff'); fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const noOverflow = p => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
const navBox = p => p.evaluate(() => { const r = document.querySelector('.nav').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, targets: [...document.querySelectorAll('.nav button')].every(b => b.getBoundingClientRect().height >= 44 && b.getBoundingClientRect().width >= 44) }; });
const panes = p => p.evaluate(() => { const vis = s => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 250 && r.height > 300 && r.left < innerWidth && r.right <= innerWidth + 1; }; return vis('.pane-master') && vis('.pane-detail'); });
const detailTitle = p => p.locator('.pane-detail main').first().innerText().then(t => t.split('\n').filter(Boolean).slice(0, 3).join(' / ')).catch(() => '');
(async () => {
  for (const [w, h] of [[344, 882], [768, 882], [882, 768]]) {
    const { b, p, errors: e } = await phone({ time: '2026-11-26T10:00:00+11:00', viewport: { width: w, height: h }, scale: 2 }); e.forEach(x => errors.push(x)); p.on('pageerror', x => errors.push(x.message));
    const tag = w + '×' + h, unfolded = w >= 700;
    await p.getByRole('button', { name: 'Look around an example pharmacy (fictional)' }).tap(); await p.waitForTimeout(3300);
    ok(await noOverflow(p), tag + ': Today has no sideways scroll');
    const nb = await navBox(p);
    ok(unfolded ? nb.x === 0 && nb.w <= 100 && nb.h >= h - 1 && nb.targets : nb.y + nb.h >= h - 1 && nb.w >= w - 1 && nb.targets, tag + ': ' + (unfolded ? 'left navigation rail' : 'bottom navigation bar, as on a phone') + ', every target 44 px+');
    // open a record from a list, then switch to another from the list pane
    const check = async (label, openList, rowSel) => {
      await openList(); await p.waitForTimeout(250);
      const rows = p.locator(rowSel); const n = await rows.count(); if (n < 1) { ok(false, tag + ' ' + label + ': no rows'); return; }
      const listTitle = await p.locator('.bar-title').first().innerText();
      await rows.first().tap(); await p.waitForTimeout(300);
      if (!unfolded) { ok(await p.locator('.split').count() === 0 && await noOverflow(p) && (await p.locator('.bar-title').first().innerText()) !== listTitle, tag + ' ' + label + ': opens full screen (no split) with no sideways scroll'); return; }
      const t1 = await detailTitle(p);
      ok(await panes(p) && await noOverflow(p) && (await p.locator('.pane-master .bar-title').innerText()) === listTitle && await p.locator('.pane-master .active').count() >= 1, tag + ' ' + label + ': list and record side by side (“' + t1 + '”), the open row highlighted');
      if (label === 'Procedure' && w === 768) await p.screenshot({ path: path.join(OUT, '70_fold_unfolded_procedure_768px.png') });
      const m = p.locator('.pane-master .row[data-id], .pane-master .row[data-key]'); const mn = await m.count();
      if (mn < 2) { ok(true, tag + ' ' + label + ': only one row to switch between'); return; }
      await p.evaluate(() => { const m = document.querySelector('.pane-master'); m.scrollTop = 40; }); const st = await p.evaluate(() => document.querySelector('.pane-master').scrollTop);
      await m.nth(1).tap(); await p.waitForTimeout(300); const t2 = await detailTitle(p);
      ok(await panes(p) && t2 && t2 !== t1 && (await p.evaluate(() => document.querySelector('.pane-master').scrollTop)) === st && await p.locator('.pane-master .active').count() >= 1, tag + ' ' + label + ': tapping another row in the list updates the record (“' + t2 + '”); the list keeps its scroll');
      // Back from the record leaves the list on its own
      await p.locator('.pane-detail [data-act="back"]').first().tap(); await p.waitForTimeout(250);
      ok(await p.locator('.split').count() === 0 && (await p.locator('.bar-title').first().innerText()) === listTitle, tag + ' ' + label + ': Back closes the record and keeps the list');
    };
    await check('Action', () => p.getByRole('button', { name: 'Actions', exact: true }).first().tap(), 'main .row[data-act]');
    await check('Staff', () => p.getByRole('button', { name: 'Staff', exact: true }).first().tap(), 'main .list .row[data-act]');
    await check('Procedure', async () => { await p.getByRole('button', { name: 'More', exact: true }).first().tap(); await p.waitForTimeout(150); await p.getByRole('button', { name: /^Procedures/ }).first().tap(); }, 'main .row[data-id]');
    if (w === 344) await p.screenshot({ path: path.join(OUT, '71_fold_cover_344px.png') });
    // single-pane screens stay centred and readable
    await p.getByRole('button', { name: 'More', exact: true }).first().tap(); await p.waitForTimeout(150); await p.getByRole('button', { name: /^Calendar/ }).first().tap(); await p.getByRole('button', { name: 'Year plan' }).tap(); await p.waitForTimeout(250);
    const cal = await p.evaluate(() => { const s = document.querySelector('.screen').getBoundingClientRect(); let q = document.querySelector('.qgrid'), tmp = null; if (!q) { tmp = q = document.createElement('div'); q.className = 'qgrid'; q.innerHTML = '<i></i><i></i><i></i><i></i>'; document.querySelector('main').appendChild(q); } const cols = getComputedStyle(q).gridTemplateColumns.split(' ').length; tmp?.remove(); return { w: s.width, cols }; });
    ok(await noOverflow(p) && (unfolded ? cal.w <= 641 && cal.cols === 4 : cal.cols <= 2), tag + ': Calendar ' + (unfolded ? 'is one centred pane (' + Math.round(cal.w) + ' px) with the Quarter Balancer in 4 columns' : 'keeps the phone layout') );
    await b.close();
  }
  await done({ close: async () => {} }, errors);
})();
