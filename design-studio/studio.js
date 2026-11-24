/* R.Pharmacy Design Studio. Plain JavaScript, no build step.
   Everything you type is saved in this browser (localStorage) and can be
   saved to / loaded from a .json backup file to move between computers. */
(function () {
  'use strict';
  var C = window.CATALOGUE;
  var KEY = 'rph-design-studio-v1';
  var TYPES = [['like', 'Like'], ['dislike', 'Dislike'], ['keep', 'Keep'], ['change', 'Change'], ['remove', 'Remove'], ['comment', 'Comment']];
  var TYPE_LABEL = Object.fromEntries(TYPES);
  var STATUS = [['none', 'Not reviewed'], ['progress', 'In progress'], ['decided', 'Decisions made'], ['final', 'Finalised']];
  var STATUS_LABEL = Object.fromEntries(STATUS);
  var PICK_STATE = [['decided', 'Decided'], ['considering', 'Considering'], ['rejected', 'Rejected']];
  var SCALE_W = 300;

  function blank() { return { version: 1, notes: {}, sections: {}, updated: null }; }
  var db = blank();
  try { var raw = localStorage.getItem(KEY); if (raw) db = Object.assign(blank(), JSON.parse(raw)); } catch (e) { console.warn('Could not read saved notes', e); }

  function save() {
    db.updated = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(db)); setSaved('Saved ' + new Date().toLocaleTimeString()); }
    catch (e) { setSaved('Could not save in this browser. Save a backup file now.'); }
  }
  function setSaved(t) { var el = document.getElementById('saved'); if (el) el.textContent = t; }
  function toast(t) { var el = document.createElement('div'); el.className = 'toast'; el.textContent = t; document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2200); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function sec(id) { return C.sections.find(function (s) { return s.id === id; }); }
  function sdata(id) { if (!db.sections[id]) db.sections[id] = { status: 'none', picks: [], instructions: '', questions: '' }; return db.sections[id]; }
  function nkey(sectionId, designId) { return sectionId + '|' + designId; }
  function notesFor(sectionId, designId) { return db.notes[nkey(sectionId, designId)] || []; }
  function dname(id) { return (C.designs[id] && C.designs[id].name) || id + ' (missing)'; }
  function noteCount(s) { return s.designs.reduce(function (n, d) { return n + notesFor(s.id, d).length; }, 0); }

  var current = location.hash.slice(1) || (C.sections[0] && C.sections[0].id) || 'dashboard';
  var draftType = {};

  // ---------- navigation ----------
  function renderNav() {
    var nav = document.getElementById('nav'), h = '', lastGroup = null;
    C.sections.forEach(function (s) {
      var st = sdata(s.id).status;
      if (s.group && s.group !== lastGroup) {
        h += (lastGroup ? '<hr>' : '') + '<div class="navgroup">' + esc(s.group) + '</div>';
        if (s.groupLink) h += '<a class="navlink" href="' + esc(s.groupLink) + '">' + esc(s.groupLinkLabel || 'Open') + ' ↗</a>';
        lastGroup = s.group;
      }
      h += '<button data-go="' + s.id + '" aria-current="' + (current === s.id) + '"><span class="dot s-' + st + '" title="' + STATUS_LABEL[st] + '"></span>' + esc(s.name) + '<span class="count">' + s.designs.length + '</span></button>';
    });
    h += '<hr><button data-go="final" aria-current="' + (current === 'final') + '"><span class="dot s-final"></span>Super design (final spec)</button>';
    nav.innerHTML = h;
  }

  // ---------- preview ----------
  function srcFor(d, sectionId) { var s = sec(sectionId); return d.src + (s && s.hash && d.kind === 'page' ? '#' + s.hash : ''); }
  function preview(d, width, sectionId) {
    var w = d.w || 390, h = d.h || 844, s = width / w, ph = Math.min(h * s, 680);
    var inner = d.kind === 'image'
      ? '<img src="' + esc(d.src) + '" alt="' + esc(d.name) + '" loading="lazy">'
      : '<iframe src="' + esc(srcFor(d, sectionId)) + '" title="' + esc(d.name) + '" loading="lazy"></iframe>';
    return '<div class="frame" style="width:' + width + 'px;height:' + ph + 'px"><div class="inner" style="width:' + w + 'px;height:' + (ph / s) + 'px;transform:scale(' + s + ')">' + inner + '</div></div>';
  }

  // ---------- notes ----------
  function notesBlock(sectionId, designId) {
    var k = nkey(sectionId, designId), t = draftType[k] || 'like';
    var h = '<div class="notes" data-k="' + esc(k) + '"><div class="types" role="group" aria-label="Note type">';
    TYPES.forEach(function (x) { h += '<button type="button" class="t-' + x[0] + '" data-type="' + x[0] + '" aria-pressed="' + (t === x[0]) + '">' + x[1] + '</button>'; });
    h += '</div><textarea aria-label="Note for ' + esc(dname(designId)) + '" placeholder="What do you think of this one?"></textarea>';
    h += '<div class="addline"><select aria-label="Which part"><option value="">Whole design</option>' + C.components.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select><button type="button" class="btn small primary" data-add>Add note</button></div>';
    notesFor(sectionId, designId).forEach(function (n) {
      h += '<div class="note" data-id="' + n.id + '"><div class="meta"><span class="badge t-' + n.type + '">' + TYPE_LABEL[n.type] + '</span>' + (n.component ? '<span>' + esc(n.component) + '</span>' : '') + '<span class="grow"></span><button type="button" class="btn link" data-edit>Edit</button><button type="button" class="btn link" data-del>Delete</button></div><div class="text">' + esc(n.text) + '</div></div>';
    });
    return h + '</div>';
  }

  // ---------- section page ----------
  function renderSection(id) {
    var s = sec(id); if (!s) { current = 'dashboard'; return renderSection('dashboard'); }
    var sd = sdata(id), main = document.getElementById('main');
    var h = '<div class="head"><h1>' + esc(s.name) + '</h1><span class="sub">' + s.designs.length + ' design' + (s.designs.length === 1 ? '' : 's') + ' · ' + noteCount(s) + ' notes</span><span class="grow"></span>';
    h += '<label class="inline">Status <select data-status>' + STATUS.map(function (x) { return '<option value="' + x[0] + '"' + (sd.status === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></label></div>';
    if (!s.designs.length) {
      h += '<div class="empty"><p><b>No designs for this section yet.</b></p><p>Nothing has been mocked up for ' + esc(s.name) + ' so far, and the current app has no separate page for it. You can still write the super design notes below, or ask Claude for mockups and they’ll appear here.</p></div>';
    } else {
      h += '<div class="row">';
      s.designs.forEach(function (did) {
        var d = C.designs[did]; if (!d) { h += '<div class="col"><b>' + esc(did) + '</b><p class="empty">File missing from catalogue.</p></div>'; return; }
        h += '<div class="col" data-design="' + esc(did) + '"><div class="col-title"><b>' + esc(d.name) + '<span class="origin">' + esc(d.origin) + '</span></b><button type="button" class="btn small" data-open="' + esc(did) + '">Open large</button></div>' + preview(d, SCALE_W, id) + notesBlock(id, did) + '</div>';
      });
      h += '</div>';
    }
    h += superBlock(s);
    main.innerHTML = h;
  }

  function superBlock(s) {
    var sd = sdata(s.id);
    var opts = function (sel) { return '<option value="">Choose a design…</option>' + s.designs.map(function (d) { return '<option value="' + esc(d) + '"' + (sel === d ? ' selected' : '') + '>' + esc(dname(d)) + '</option>'; }).join('') + '<option value="new"' + (sel === 'new' ? ' selected' : '') + '>Something new (describe it)</option>'; };
    var h = '<div class="super"><h2>Super design for ' + esc(s.name) + '</h2><p>Pick the best part from each design. Choosing one part doesn’t approve the whole design.</p>';
    h += '<table><thead><tr><th style="width:24%">Part</th><th style="width:30%">Take it from</th><th>Notes / how to change it</th><th style="width:14%">Decision</th><th style="width:40px"></th></tr></thead><tbody>';
    if (!sd.picks.length) h += '<tr><td colspan="5" class="muted" style="color:var(--muted)">No picks yet. Add one below.</td></tr>';
    sd.picks.forEach(function (p, i) {
      h += '<tr data-pick="' + i + '"><td><input list="components" value="' + esc(p.component) + '" data-f="component" aria-label="Part"></td><td><select data-f="design" aria-label="Take it from">' + opts(p.design) + '</select></td><td><input value="' + esc(p.note) + '" data-f="note" aria-label="Notes"></td><td><select data-f="state" aria-label="Decision">' + PICK_STATE.map(function (x) { return '<option value="' + x[0] + '"' + (p.state === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></td><td><button type="button" class="btn link" data-delpick="' + i + '" aria-label="Remove pick">✕</button></td></tr>';
    });
    h += '</tbody></table><datalist id="components">' + C.components.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist>';
    h += '<div style="margin-top:8px"><button type="button" class="btn small" data-addpick>Add a pick</button></div>';
    h += '<div class="two"><label>Instructions for the final design<textarea data-text="instructions" placeholder="e.g. Use Design 6’s layout but with Design 3’s answer buttons. These instructions override the picks above.">' + esc(sd.instructions) + '</textarea></label>';
    h += '<label>Still deciding / open questions<textarea data-text="questions" placeholder="Anything you haven’t made up your mind on yet">' + esc(sd.questions) + '</textarea></label></div></div>';
    return h;
  }

  // ---------- large view ----------
  function openLarge(sectionId, did) {
    var d = C.designs[did]; if (!d) return;
    var w = d.w || 390, h = d.h || 844, vw = Math.min(window.innerWidth * 0.96 - 360, w), s = Math.min(1, vw / w);
    var maxH = window.innerHeight * 0.94 - 70;
    var m = document.createElement('div'); m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', d.name);
    var body = d.kind === 'image'
      ? '<div class="big" style="width:' + (w * s) + 'px;max-height:' + maxH + 'px;overflow:auto"><img src="' + esc(d.src) + '" alt="' + esc(d.name) + '" style="width:100%;display:block"></div>'
      : '<div class="big" style="width:' + (w * s) + 'px;height:' + Math.min(h * s, maxH) + 'px"><iframe src="' + esc(srcFor(d, sectionId)) + '" title="' + esc(d.name) + '" style="width:' + w + 'px;height:' + (Math.min(h * s, maxH) / s) + 'px;transform:scale(' + s + ');transform-origin:0 0"></iframe></div>';
    m.innerHTML = '<div class="box"><div class="stage"><div class="bar"><b>' + esc(d.name) + '</b><a class="btn small" href="' + esc(srcFor(d, sectionId)) + '" target="_blank" rel="noopener">Full screen in new tab</a><button type="button" class="btn small" data-close>Back to comparison</button></div>' + body + '</div><div class="side">' + notesBlock(sectionId, did) + '</div></div>';
    document.body.appendChild(m);
    m.querySelector('[data-close]').focus();
    function close() { m.remove(); document.removeEventListener('keydown', onKey); render(); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-close]')) close(); });
    m.addEventListener('click', notesClick);
  }

  // ---------- final spec ----------
  function renderFinal() {
    var main = document.getElementById('main');
    var h = '<div class="head"><h1>Super design: final spec</h1><span class="sub">Built from your picks and notes</span></div><div class="final">';
    h += '<div class="exports"><button class="btn primary" data-export="handoff">Download Claude Code handoff (.md)</button><button class="btn" data-export="spec">Download full design spec (.md)</button><button class="btn" data-export="open">Download open questions (.md)</button><button class="btn" data-export="json">Save backup file (.json)</button></div>';
    h += '<p class="muted" style="color:var(--muted);margin:0">The handoff only includes parts marked <b>Decided</b> plus your instructions. “Considering” and “Rejected” stay in the full spec.</p>';
    C.sections.forEach(function (s) {
      var sd = sdata(s.id), dec = sd.picks.filter(function (p) { return p.state === 'decided'; }), con = sd.picks.filter(function (p) { return p.state === 'considering'; }), rej = sd.picks.filter(function (p) { return p.state === 'rejected'; });
      h += '<section><h3><span class="dot s-' + sd.status + '"></span>' + esc(s.name) + ' <span class="muted" style="font-weight:400;font-size:13px;color:var(--muted)">' + STATUS_LABEL[sd.status] + ' · ' + noteCount(s) + ' notes</span></h3>';
      if (!dec.length && !con.length && !rej.length && !sd.instructions && !sd.questions) h += '<div class="muted" style="color:var(--muted)">Nothing decided yet.</div>';
      if (dec.length) h += '<b>Decided</b><ul>' + dec.map(pickLi).join('') + '</ul>';
      if (sd.instructions) h += '<b>Instructions</b><p style="margin:2px 0 6px;white-space:pre-wrap">' + esc(sd.instructions) + '</p>';
      if (con.length) h += '<b>Still considering</b><ul>' + con.map(pickLi).join('') + '</ul>';
      if (rej.length) h += '<b>Rejected</b><ul>' + rej.map(pickLi).join('') + '</ul>';
      if (sd.questions) h += '<b>Open questions</b><p style="margin:2px 0;white-space:pre-wrap">' + esc(sd.questions) + '</p>';
      h += '</section>';
    });
    main.innerHTML = h + '</div>';
  }
  function pickLi(p) { return '<li><b>' + esc(p.component || 'Part') + '</b> from ' + esc(p.design === 'new' ? 'something new' : dname(p.design)) + (p.note ? ' · ' + esc(p.note) : '') + '</li>'; }

  // ---------- exports ----------
  function pickMd(p) { return '- **' + (p.component || 'Part') + '**: from ' + (p.design === 'new' ? 'something new' : (dname(p.design) + ' (`' + (C.designs[p.design] ? C.designs[p.design].src : p.design) + '`)')) + (p.note ? '. ' + p.note : ''); }
  function notesMd(s) {
    var out = [];
    s.designs.forEach(function (d) { var ns = notesFor(s.id, d); if (!ns.length) return; out.push('#### ' + dname(d)); ns.forEach(function (n) { out.push('- ' + TYPE_LABEL[n.type] + (n.component ? ' (' + n.component + ')' : '') + ': ' + n.text.replace(/\n/g, ' ')); }); });
    return out;
  }
  function buildSpec() {
    var L = ['# R.Pharmacy: full design spec', '', 'Exported ' + new Date().toLocaleString() + ' from the R.Pharmacy Design Studio.', ''];
    C.sections.forEach(function (s) {
      var sd = sdata(s.id); L.push('## ' + s.name, '', 'Status: ' + STATUS_LABEL[sd.status], '');
      PICK_STATE.forEach(function (st) { var ps = sd.picks.filter(function (p) { return p.state === st[0]; }); if (ps.length) { L.push('### ' + st[1]); ps.forEach(function (p) { L.push(pickMd(p)); }); L.push(''); } });
      if (sd.instructions) L.push('### Instructions', sd.instructions, '');
      if (sd.questions) L.push('### Open questions', sd.questions, '');
      var nm = notesMd(s); if (nm.length) { L.push('### Notes on each design'); L.push.apply(L, nm); L.push(''); }
      if (!s.designs.length) L.push('_No designs exist for this section yet._', '');
    });
    var unrev = C.sections.filter(function (s) { return sdata(s.id).status === 'none'; }).map(function (s) { return s.name; });
    L.push('## Not reviewed yet', unrev.length ? unrev.map(function (n) { return '- ' + n; }).join('\n') : 'All sections have been looked at.');
    return L.join('\n');
  }
  function buildHandoff() {
    var L = ['# R.Pharmacy UI: implementation handoff for Claude Code', '',
      'This is the one agreed design direction, chosen by the proprietor in the R.Pharmacy Design Studio. Build the UI to match it.', '',
      '## Ground rules', '- Change the look and layout only. Do not change compliance rules, audit content, workflows or saved data.', '- The app stays proprietor-only. Never auto-approve SOPs, complete audits or close Tasks.', '- Work on the dev copy and keep the original untouched; show the user before replacing the version they are testing.', '- Mockup files referenced below live in `design-studio/designs/` and are reference only.', ''];
    var any = false;
    C.sections.forEach(function (s) {
      var sd = sdata(s.id), dec = sd.picks.filter(function (p) { return p.state === 'decided'; }), rej = sd.picks.filter(function (p) { return p.state === 'rejected'; });
      if (!dec.length && !sd.instructions) return; any = true;
      L.push('## ' + s.name + (sd.status === 'final' ? '' : ' (status: ' + STATUS_LABEL[sd.status] + ')'), '');
      if (sd.instructions) L.push('**Instructions (these take priority):**', sd.instructions, '');
      if (dec.length) { L.push('**Use:**'); dec.forEach(function (p) { L.push(pickMd(p)); }); L.push(''); }
      if (rej.length) { L.push('**Do not use:**'); rej.forEach(function (p) { L.push(pickMd(p)); }); L.push(''); }
      var removes = []; s.designs.forEach(function (d) { notesFor(s.id, d).forEach(function (n) { if (n.type === 'remove' || n.type === 'change') removes.push('- ' + TYPE_LABEL[n.type] + ' in ' + dname(d) + (n.component ? ' (' + n.component + ')' : '') + ': ' + n.text.replace(/\n/g, ' ')); }); });
      if (removes.length) { L.push('**Requested changes and removals:**'); L.push.apply(L, removes); L.push(''); }
    });
    if (!any) L.push('_No decisions marked “Decided” yet. Mark picks as Decided in the studio, then export again._');
    var open = C.sections.filter(function (s) { var sd = sdata(s.id); return sd.questions || sd.picks.some(function (p) { return p.state === 'considering'; }); });
    if (open.length) L.push('', '## Not decided yet (ask the user before building these)', open.map(function (s) { return '- ' + s.name; }).join('\n'));
    return L.join('\n');
  }
  function buildOpen() {
    var L = ['# R.Pharmacy design: open questions', ''];
    C.sections.forEach(function (s) {
      var sd = sdata(s.id), con = sd.picks.filter(function (p) { return p.state === 'considering'; });
      if (sd.status === 'final' && !sd.questions && !con.length) return;
      L.push('## ' + s.name + ' (' + STATUS_LABEL[sd.status] + ')');
      if (sd.questions) L.push(sd.questions);
      con.forEach(function (p) { L.push(pickMd(p) + ' (still considering)'); });
      if (!sd.questions && !con.length) L.push('- Not finalised yet.');
      L.push('');
    });
    return L.join('\n');
  }
  function download(name, text, type) {
    var b = new Blob([text], { type: type || 'text/markdown' }), a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  var stamp = function () { return new Date().toISOString().slice(0, 10); };
  function exportJson() { download('rph-design-studio-backup-' + stamp() + '.json', JSON.stringify(db, null, 2), 'application/json'); toast('Backup file saved'); }

  // ---------- events ----------
  function notesClick(e) {
    var box = e.target.closest('.notes'); if (!box) return;
    var k = box.dataset.k, parts = k.split('|'), list = db.notes[k] || (db.notes[k] = []);
    var tb = e.target.closest('[data-type]');
    if (tb) { draftType[k] = tb.dataset.type; box.querySelectorAll('[data-type]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === tb)); }); return; }
    if (e.target.closest('[data-add]')) {
      var ta = box.querySelector('textarea'), text = ta.value.trim(); if (!text) { ta.focus(); return; }
      list.push({ id: uid(), type: draftType[k] || 'like', component: box.querySelector('.addline select').value, text: text, created: new Date().toISOString() });
      save(); refreshNotes(box, parts[0], parts[1]); renderNav(); return;
    }
    var noteEl = e.target.closest('.note'); if (!noteEl) return;
    var n = list.find(function (x) { return x.id === noteEl.dataset.id; }); if (!n) return;
    if (e.target.closest('[data-del]')) { if (!confirm('Delete this note?')) return; db.notes[k] = list.filter(function (x) { return x !== n; }); save(); refreshNotes(box, parts[0], parts[1]); return; }
    if (e.target.closest('[data-edit]')) {
      var t = noteEl.querySelector('.text');
      t.innerHTML = '<textarea style="width:100%;min-height:60px;border:1px solid var(--line);border-radius:6px;padding:6px">' + esc(n.text) + '</textarea><div style="display:flex;gap:6px;margin-top:4px"><select aria-label="Note type">' + TYPES.map(function (x) { return '<option value="' + x[0] + '"' + (n.type === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select><button type="button" class="btn small primary" data-saveedit>Save</button></div>';
      t.querySelector('[data-saveedit]').onclick = function (ev) { ev.stopPropagation(); n.text = t.querySelector('textarea').value.trim() || n.text; n.type = t.querySelector('select').value; n.updated = new Date().toISOString(); save(); refreshNotes(box, parts[0], parts[1]); };
      t.querySelector('textarea').focus();
    }
  }
  function refreshNotes(box, s, d) { var tmp = document.createElement('div'); tmp.innerHTML = notesBlock(s, d); box.replaceWith(tmp.firstChild); }

  document.addEventListener('click', function (e) {
    var go = e.target.closest('[data-go]');
    if (go) { current = go.dataset.go; location.hash = current; render(); document.getElementById('main').scrollTop = 0; return; }
    if (e.target.closest('.modal')) return;
    var op = e.target.closest('[data-open]'); if (op) { openLarge(current, op.dataset.open); return; }
    if (e.target.closest('[data-addpick]')) { sdata(current).picks.push({ component: '', design: '', note: '', state: 'considering' }); if (sdata(current).status === 'none') sdata(current).status = 'progress'; save(); render(); return; }
    var dp = e.target.closest('[data-delpick]'); if (dp) { sdata(current).picks.splice(+dp.dataset.delpick, 1); save(); render(); return; }
    var ex = e.target.closest('[data-export]');
    if (ex) { var t = ex.dataset.export; if (t === 'json') exportJson(); if (t === 'spec') download('rph-design-spec-' + stamp() + '.md', buildSpec()); if (t === 'handoff') download('rph-claude-code-handoff-' + stamp() + '.md', buildHandoff()); if (t === 'open') download('rph-open-questions-' + stamp() + '.md', buildOpen()); return; }
    notesClick(e);
  });
  document.addEventListener('change', function (e) {
    if (e.target.closest('.modal')) return;
    if (e.target.matches('[data-status]')) {
      var v = e.target.value;
      if (v === 'final' && !confirm('Mark “' + sec(current).name + '” as finalised? You can change it back later.')) { e.target.value = sdata(current).status; return; }
      sdata(current).status = v; save(); renderNav(); return;
    }
    var tr = e.target.closest('[data-pick]');
    if (tr && e.target.dataset.f) { sdata(current).picks[+tr.dataset.pick][e.target.dataset.f] = e.target.value; save(); }
  });
  document.addEventListener('input', function (e) {
    if (e.target.matches('[data-text]')) { sdata(current)[e.target.dataset.text] = e.target.value; save(); }
    var tr = e.target.closest('[data-pick]'); if (tr && e.target.dataset.f && e.target.tagName === 'INPUT') { sdata(current).picks[+tr.dataset.pick][e.target.dataset.f] = e.target.value; save(); }
  });
  document.getElementById('exportJson').onclick = exportJson;
  document.getElementById('importJson').onclick = function () { document.getElementById('importFile').click(); };
  document.getElementById('importFile').onchange = function (e) {
    var f = e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var data = JSON.parse(r.result);
        if (!data || typeof data.notes !== 'object' || typeof data.sections !== 'object') throw new Error('not a studio backup');
        if (!confirm('Load this backup? It replaces the notes currently in this browser. (Save a backup first if unsure.)')) return;
        db = Object.assign(blank(), data); save(); render(); toast('Backup loaded');
      } catch (err) { alert('That file isn’t a Design Studio backup, so nothing was changed.'); }
      e.target.value = '';
    };
    r.readAsText(f);
  };
  window.addEventListener('hashchange', function () { var h = location.hash.slice(1); if (h && h !== current) { current = h; render(); } });

  function render() { renderNav(); if (current === 'final') renderFinal(); else renderSection(current); }
  render();
  if (db.updated) setSaved('Last saved ' + new Date(db.updated).toLocaleString());
})();
