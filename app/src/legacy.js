// Brings a backup from the current app (R.Pharmacy UAT, format version 2) into the new model.
// Nothing is dropped: every original record is also kept under `legacy` so History and exports can show it exactly.
import { emptyPharmacy, migratePharmacy, detId } from './model.js';
import { isDate } from './dates.js';
const RESULT = { Verified: 'ok', 'Needs Review': 'issue', 'Not Applicable': 'na' };
const day = s => String(s || '').slice(0, 10);
export function isLegacyBackup(b) { return !!(b && b.version === 2 && b.data && Array.isArray(b.data.reviews)); }
export function importLegacy(backup) {
  const d = backup.data, ph = emptyPharmacy(d.pharmacyName || 'Pharmacy');
  // D3-C: a backup without its own pharmacy id gets one derived from its name and export time, so restoring the same
  // file on two devices gives the same pharmacy (and they sync as one), never two random ids.
  ph.id = d.taskPharmacyId || detId('ph', [d.pharmacyName || 'Pharmacy', backup.exportedAt || '']);
  const sp = d.siteProfile || {};
  Object.assign(ph, { address: sp.address || '', region: sp.region || '', identifier: sp.identifier || '' });
  ph.proprietors = (d.proprietors || []).map(p => ({ id: p.id, name: p.name, primary: !!p.primary }));
  if (!ph.proprietors.length && sp.proprietor) ph.proprietors = [{ id: 'owner', name: sp.proprietor, primary: true }];
  ph.recordingAs = d.currentReviewer || ph.proprietors[0]?.id || '';
  ph.flags = { ...(d.flags || {}) };
  for (const id of d.active || []) {
    const cfg = d.serviceConfig?.[id];
    const answers = { ...(cfg?.procedureProfile?.answers || {}) };
    for (const [k, sw] of Object.entries(cfg?.procedureProfile?.software || {})) { const row = (d.software || []).find(r => r.id === sw); if (row) answers[k] = row.name; }
    ph.services[id] = { active: true, setup: cfg?.complete ? 'done' : cfg ? 'doing' : 'todo', answers };
  }
  for (const [k, v] of Object.entries(d.schedule || {})) if (isDate(v)) ph.schedule[k] = v;
  // records
  const findings = d.findingLedger || {};
  const meetingsByReview = Object.fromEntries((d.meetings || []).filter(m => m.review).map(m => [m.review, m]));
  for (const r of d.reviews || []) {
    const kind = r.audit === 'Q1' ? 'visit' : r.audit === 'A1' ? (r.trigger === 'Departure assurance' ? 'departure' : 'staff') : ['M1', 'M2', 'Q4'].includes(r.audit) ? 'meeting' : 'review';
    const ids = new Set([...(r.actionIds || []), ...(r.actionId ? [r.actionId] : []), ...(r.taskLinks || []), ...(r.findingIds || []).map(f => findings[f]?.taskId).filter(Boolean)]);
    const m = meetingsByReview[r.id];
    ph.records.push({
      id: r.id, type: r.audit, kind, extra: /event/i.test(r.trigger || '') || r.event === true,
      title: r.templateName || m?.title || '', date: r.date, at: r.at, by: r.by || '',
      answers: (r.answers || []).map(a => ({ text: a.question, answer: a.answer, note: a.note || '', item: a.itemKey || a.requirementId || '', expiry: a.expiry || '', method: a.method || '', ref: a.reference || '' })),
      fields: { stockDate: r.stockDate || '', stockPharmacist: r.stockPharmacist || '', personId: r.personId || '', next: r.nextDate || '', sections: m?.sections || null, attendees: m?.attendeeNames || [] },
      notes: r.notes || m?.notes || '', next: r.nextDate || '', actionIds: [...ids], legacy: r,
    });
  }
  // actions
  for (const t of Object.values(d.taskLedger || {})) {
    const f = Object.values(findings).find(x => x.taskId === t.id);
    const s = (t.sources || [])[0];
    let source = null;
    if (f) source = { type: 'visit', recordId: f.source?.reviewId || '', label: (f.source?.label || 'Site visit') + ' · ' + (f.source?.date || ''), item: f.itemLabel || '', finding: f.text || '' };
    else if (s?.type === 'Staff') source = { type: 'staff', staffId: s.id, req: s.issue, label: 'Staff check' };
    else if (s?.type === 'Service') source = { type: 'service', service: s.id, issue: s.issue, label: 'Service setup' };
    else if (s) source = { type: String(s.type).toLowerCase(), recordId: s.id, label: s.type };
    const person = source?.type === 'staff' ? (d.staff || []).find(p => p.id === source.staffId)?.person || '' : '';
    ph.actions[t.id] = {
      id: t.id, title: f?.text && t.text.endsWith(f.text) ? f.text : t.text, due: t.due || '', status: t.status === 'Completed' ? 'closed' : 'open', created: day(t.createdAt),
      source, person, waiting: t.waiting ? { asked: t.waiting.what, on: t.waiting.asked, checkBack: t.waiting.checkBack } : null,
      closed: t.status === 'Completed' ? { date: day(t.completedAt), what: t.outcome || '', by: '' } : null,
      progress: t.progress || '', evidence: t.evidence || '',
      log: (t.activity || []).map(e => ({ at: e.at, by: e.by || '', kind: /Status changed .* to Completed|Completed/.test(e.message) ? 'closed' : /^Asked for/.test(e.message) ? 'asked' : /Created/.test(e.message) ? 'raised' : 'updated', text: e.message })),
    };
  }
  // staff, with each requirement's latest check
  for (const p of d.staff || []) {
    const checks = {};
    const recs = (d.reviews || []).filter(r => r.audit === 'A1' && (r.personId === p.id || r.answers?.some(a => a.personId === p.id))).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    for (const r of recs) for (const a of r.answers || []) if ((a.personId || r.personId) === p.id && a.requirementId && !a.requirementId.startsWith('departure/'))
      checks[a.requirementId] = { result: RESULT[a.answer] || 'issue', date: a.verificationDate || r.date, method: a.method || '', expiry: a.expiry || '', ref: a.reference || '', note: a.note || '' };
    // M-04: there is no pharmacist-in-charge role (owner decision); an old "Pharmacist in charge (PIC)" comes in as Pharmacist.
    ph.staff.push({ id: p.id, name: p.person, role: /in charge|\bPIC\b/i.test(p.role || '') ? 'Pharmacist' : p.role, engagement: p.engagement || 'Regular', start: p.start || '', end: p.end || '', active: p.active !== false, services: [...(p.services || [])], annualDue: p.annualDue || '', lastCheck: p.lastAssurance || '', checks });
  }
  // procedures and document references
  for (const doc of d.documents || []) {
    if (doc.serviceProcedure) ph.procedures.push({ id: doc.id, service: doc.serviceProcedure, title: doc.title, status: doc.lifecycle === 'Approved' || doc.lifecycle === 'Adopted' ? 'adopted' : 'draft', versions: (doc.versions || []).map(v => ({ v: v.version, body: v.body || '', generated: v.body || '', at: v.at, status: v.status })), amendment: doc.localAmendment || '' });
    else ph.documents.push({ id: doc.id, title: doc.title, url: doc.url || '', ref: doc.reference || '', version: doc.version || '', reviewDate: doc.reviewDate || '' });
  }
  ph.history = (d.history || []).map(x => ({ at: x.at, by: x.by || '', what: x.message }));
  ph.log = (d.ownerLog || []).map(x => ({ id: x.id, date: x.date, what: x.what, kind: x.kind || '', ref: x.ref || '', by: x.by || '' }));
  ph.obligations = { ...(d.legalEvidence || {}) };
  ph.lead = d.serviceLead || '';
  ph.siteScope = { ...(d.siteScope || {}) };
  ph.settings.setupDone = !!d.onboarded; ph.settings.allSetSeen = true;
  if (d.inherited) ph.inherited = { since: typeof d.inherited === 'string' ? d.inherited : '' };
  // drafts: site visits keep their answers; other review drafts keep their chosen answers
  const drafts = {};
  for (const [k, v] of Object.entries(backup.drafts || {})) {
    if (k === 'event-audit/Q1' || k === 'Q1') drafts[k === 'Q1' ? 'visit/quarterly' : 'visit/extra'] = { date: v.date || '', items: v.items || {}, vacc: v.vacc || {}, notes: v.notes || '', next: v.nextDate || '' };
    else if (!k.includes('/') && v && typeof v === 'object' && v['review-date']) {
      const answers = {};
      for (const [key, on] of Object.entries(v)) { const m = key.match(/^q(\d+)\/radio\/(.+)\/\d+$/); if (m && on) answers[m[1]] = m[2]; }
      drafts['review/' + k] = { date: v['review-date'], answers, notes: v.notes || '' };
    }
  }
  ph.legacy = { importedAt: new Date().toISOString(), format: backup.format || '', exportedAt: backup.exportedAt || '' };
  // D3-A: schema 2 (deterministic ids on history, action logs, procedure versions and reviews; one procedure per service).
  return { pharmacy: migratePharmacy(ph), drafts };
}
