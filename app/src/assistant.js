// Counter Quick-Answer (28 Nov 2026, owner brief): ten questions a proprietor asks at the counter, answered from this
// pharmacy's own records and the app's law content. Read-only and offline: ask(ph, query, today) never changes ph,
// never stores the query, makes no network call and reads no patient data. Counts come from summary.js (design rule 8),
// the S8 limit from rules.js, the wording from law.json and the links from sources.js.
// Statutory facts (s 148(2)(a)(i), s 33(2)(b), s 37A, s 111(3), Sublocade dates, cannabis categories, the inspection
// repeat items) are the owner's 27–28 Nov brief text, already used elsewhere in the app; the official sites could not be
// re-read from this session.
import { C } from './content.js';
import { SOURCES } from './content/sources.js';
import { s8Limit, s8Takeover, latestStockCheck, activeServices } from './rules.js';
import { items, ranked, reviewDue } from './summary.js';
import { requirements, credentialState } from './model.js';
import { fmt, today as now, daysBetween, isDate, addDays } from './dates.js';
import { plural } from './util.js';

const src = k => { const s = SOURCES.find(x => x[0] === k); return s ? { title: s[1], url: s[4] } : null; };
const obl = id => C.law.OBL.find(o => o[0] === id);
const REG = 'Medicines, Poisons and Therapeutic Goods Regulation 2026';
const cite = (line, k) => ({ line, ...(src(k) || {}) });
const days = n => plural(n, 'day');
// "A, B and C", or "A, B, C and 2 more" when there are more than shown.
const list = (xs, n = 3) => { const s = xs.slice(0, n), more = xs.length - s.length; if (more) return s.join(', ') + ' and ' + more + ' more'; return s.length <= 1 ? s.join('') : s.slice(0, -1).join(', ') + ' and ' + s.at(-1); };
const on = (ph, id) => activeServices(ph).includes(id);
const active = ph => (ph.staff || []).filter(p => p.active !== false);
// Each answer: { text (1–2 sentences), cite { line, title, url }, link { label, to, id } or { label, tab, filter } }.
export const QUESTIONS = [
  { id: 's8', chip: 'Next S8 inventory', q: 'When is the next S8 inventory due?',
    words: [/\bs ?8\b|schedule 8|inventor|stock ?(check|take)/, /inventor|stock ?(check|take)|count|takeover|take over|due|next/],
    answer(ph, t) {
      if (s8Takeover(ph)) { const d = ph.inherited.since;
        return { text: `You took control on ${fmt(d)}, so an S8 inventory is needed immediately (s 111(3)). It's due now: no completed stock check is recorded since the takeover.`,
          cite: cite(REG + ', s 111(3)', 'reg'), link: { label: 'Open the S8 review', to: 'review', id: 'B1' } }; }
      const lim = s8Limit(ph), last = latestStockCheck(ph);
      if (!lim) return { text: 'No completed S8 stock check is recorded yet, so the 3-month limit can’t be worked out. Add the date of your last S8 inventory to start the clock.',
        cite: cite(REG + ', s 111', 'reg'), link: { label: 'Add your last S8 stocktake', to: 'review', id: 'B1' } };
      const n = daysBetween(t, lim), planned = ph.schedule?.B1, plan = isDate(planned) && planned < lim && planned >= t ? ` You’ve planned it for ${fmt(planned)}.` : '';
      const head = n < 0 ? `The next S8 inventory was due by ${fmt(lim)}: ${days(-n)} overdue.` : n === 0 ? `The next S8 inventory is due today (${fmt(lim)}).` : `The next S8 inventory is due by ${fmt(lim)}, in ${days(n)}.`;
      return { text: head + ` That’s 3 months after the last completed stock check on ${fmt(last)}.` + plan,
        cite: cite(REG + ', s 111', 'reg'), link: { label: 'Open the S8 review', to: 'review', id: 'B1' } };
    } },
  { id: 'witness', chip: 'S8 destruction witness', q: 'Who can witness S8 destruction?',
    words: [/witness/, /destr|destroy|dispos|expired s ?8|out.?of.?date/],
    answer(ph) {
      const n = active(ph).filter(p => /^Pharmacist\b/i.test(p.role || '')).length;
      return { text: 'A pharmacist, medical practitioner or nurse practitioner who isn’t employed or engaged at this pharmacy (locums and contractors count as engaged), isn’t family and, if a pharmacist, has no financial interest in it.'
          + (n ? ` So none of the ${plural(n, 'pharmacist')} on your staff list can witness here.` : ' Your own staff and locums can’t witness.'),
        cite: cite(REG + ', s 148(2)(a)(i)', 'reg'), link: { label: 'Open S8 destruction', to: 'obligation', id: 's148' } };
    } },
  { id: 'emergency', chip: 'S4 emergency supply', q: 'What are the S4 emergency supply limits?',
    words: [/emergenc|without (a )?(script|prescription)|no script|owing|continued supply/, /s ?4|supply|limit|how much|days?/],
    answer() {
      return { text: 'Up to 7 days’ treatment, and not again within 30 days; for an aerosol or inhaler, anovulant tablets, a cream, a liquid or an ointment, the smallest pack on the market. Never for S4D or S8.',
        cite: cite(REG + ', s 33(2)(b)', 'reg'), link: { label: 'Open supply without a prescription', to: 'obligation', id: 's33' } };
    } },
  { id: 'creds', chip: 'Credentials expiring', q: 'Whose credentials expire in the next 60 days?',
    words: [/credential|registration|ahpra|expir|renew|cpr|first aid|licen[cs]e|certificate/, /staff|who|whose|next|60|soon/],
    answer(ph, t) {
      const out = [];
      for (const p of active(ph)) for (const r of requirements(p)) { const cs = credentialState(p, r.id);
        if (isDate(cs.expiry) && daysBetween(t, cs.expiry) <= 60) out.push({ who: p.name, what: r.label, date: cs.expiry, id: p.id }); }
      out.sort((a, b) => a.date.localeCompare(b.date) || a.who.localeCompare(b.who));
      const people = [...new Set(out.map(x => x.id))];
      const link = people.length === 1 ? { label: 'Open ' + out[0].who, to: 'person', id: people[0] } : { label: 'Open Staff', tab: 'staff' };
      if (!out.length) return { text: active(ph).length ? 'No recorded credential expires in the next 60 days (to ' + fmt(addDays(t, 60)) + ').' + ' Only checks with an expiry date recorded in Staff are counted.' : 'No staff are on your list yet, so there’s nothing to count.',
        cite: cite('Health Practitioner Regulation National Law; Pharmacy Board of Australia', 'pba'), link };
      const shown = out.slice(0, 3).map(x => `${x.who}, ${x.what.split(/ · |,/)[0].trim()} ${x.date < t ? 'expired ' + fmt(x.date) : fmt(x.date)}`);
      return { text: `${plural(out.length, 'credential')} for ${plural(people.length, 'person', 'people')} by ${fmt(addDays(t, 60))}: ${shown.join('; ')}${out.length > 3 ? '; and ' + (out.length - 3) + ' more' : ''}.`,
        cite: cite('Health Practitioner Regulation National Law; Pharmacy Board of Australia', 'pba'), link, rows: out };
    } },
  { id: 'overdue', chip: 'Overdue and waiting', q: 'What’s overdue or waiting on someone?',
    words: [/overdue|late|behind|waiting|check.?back|outstanding|to ?do|open (items|actions)/],
    answer(ph, t) {
      const all = items(ph, {}, t), over = ranked(all.filter(i => i.bucket === 'overdue')), wait = all.filter(i => i.waiting), back = wait.filter(i => i.checkBackDue);
      const a = over.length ? `${over.length === 1 ? '1 thing is' : over.length + ' things are'} overdue: ${list(over.map(i => i.kind === 'person' ? i.title + '’s checks' : i.title))}.` : 'Nothing is overdue.';
      const b = wait.length ? ` ${wait.length === 1 ? '1 is' : wait.length + ' are'} waiting on someone${back.length ? ', ' + back.length + ' to check back on today or earlier' : ''}.` : ' Nothing is waiting on anyone.';
      return { text: a + b, cite: cite('Pharmacy Council of NSW: proprietor oversight', 'council'),
        link: over.length ? { label: 'Open Today · Overdue', tab: 'today', filter: 'overdue' } : { label: 'Open Today · Waiting', tab: 'today', filter: 'waiting' }, counts: { overdue: over.length, waiting: wait.length, checkBack: back.length } };
    } },
  { id: 'carry', chip: 'Visit carry-overs', q: 'What’s still unresolved from my visits?',
    words: [/visit|carry|carried|unresolved|check later|needs verification|left open|follow.?up/],
    answer(ph) {
      const out = carryovers(ph);
      if (!out.length) return { text: (ph.records || []).some(r => r.type === 'Q1') ? 'Nothing from your site visits is still marked “Check later”.' : 'No site visit is recorded yet, so nothing has carried over.',
        cite: cite('Pharmacy Council of NSW: routine inspections', 'council'), link: { label: 'Start a visit', to: 'visit-start' } };
      return { text: `${out.length === 1 ? '1 visit check is' : out.length + ' visit checks are'} still “Check later” at the latest visit that looked at ${out.length === 1 ? 'it' : 'them'}: ${list(out.map(x => x.title + ' (' + fmt(x.date) + ')'))}.`,
        cite: cite('Pharmacy Council of NSW: routine inspections', 'council'), link: { label: 'Start a visit', to: 'visit-start' }, rows: out };
    } },
  { id: 'otp', chip: 'Sublocade and OTP 80+', q: 'What changes with Sublocade, and do the OTP 80+ rules apply?',
    words: [/sublocade|buvidal|laib|depot|otp|opioid|methadone|buprenorphine|80|amenity/],
    answer(ph, t) {
      const when = t <= '2026-12-11' ? `Final Sublocade orders close 11 Dec (${days(daysBetween(t, '2026-12-11'))}), and it’s discontinued on 31 Dec 2026; no new patients are started on it.`
        : t <= '2026-12-31' ? 'Final Sublocade orders closed on 11 Dec; it’s discontinued on 31 Dec 2026, and no new patients are started on it.' : 'Sublocade was discontinued on 31 Dec 2026.';
      const store = ' Buvidal continues: store it below 25°C, never refrigerated or frozen.';
      if (!on(ph, 'otp')) return { text: 'You don’t offer OTP here, so this doesn’t apply. ' + when + store, cite: cite('NSW OTP Standards; product information', 'otp'), link: { label: 'Open Services', to: 'services' } };
      const due = reviewDue(ph, 'otp-amenity');
      const vol = ph.flags?.volume ? ` You’ve said you dose 80 or more on a peak day, so the amenity plan, staffing declaration and annual review apply${isDate(due) ? ' (review due ' + fmt(due) + ')' : ''}.` : ' You’ve said fewer than 80 on a peak day, so the 80+ amenity rules don’t apply yet.';
      return { text: when + store + vol, cite: cite('NSW OTP Standards; Sublocade and Buvidal product information', 'otp'), link: { label: 'Open Opioid Treatment Program', to: 'service', id: 'otp' } };
    } },
  { id: 'ocp', chip: 'Starting the pill (OCP)', q: 'Can we start someone on the oral contraceptive pill?',
    words: [/\bocp\b|contracept|the pill|\bpill\b|anovulant|37a/],
    answer(ph) {
      const pw = String(ph.services?.prescribing?.answers?.pathway || ''), ready = on(ph, 'prescribing') && /OCP initiation/.test(pw);
      const base = 'Only an approved pharmacist (a JCU, University of Newcastle or UTS graduate certificate) who has submitted NSW Health’s Intention form can start the pill, for low-risk women aged 18–39.';
      return { text: base + (ready ? ' Your prescribing setup includes OCP initiation.' : on(ph, 'prescribing') ? ' Your prescribing setup doesn’t include OCP initiation yet.' : ' You don’t offer pharmacist prescribing here yet.'),
        cite: cite(REG + ', s 37A; NSW OCP initiation protocol', 'ocp'), link: on(ph, 'prescribing') ? { label: 'Open Pharmacist prescribing', to: 'service', id: 'prescribing' } : { label: 'Open Services', to: 'services' } };
    } },
  { id: 'cannabis', chip: 'Medicinal cannabis schedule', q: 'Is this medicinal cannabis S4 or S8?',
    words: [/cannab|\bcbd\b|\bthc\b|marijuana|category [1-5]/, /\bs ?[48]\b|schedul/],
    answer(ph) {
      return { text: 'Category 1 (98% or more CBD, no more than 2% other cannabinoids) is Schedule 4; Categories 2–5, including CBD-dominant Category 2, are Schedule 8, so S8 storage and the register apply. There’s no emergency supply of unregistered S8 cannabis.'
          + (on(ph, 'cannabis') ? '' : ' You don’t list medicinal cannabis as a service here.'),
        cite: cite('NSW Health, Cannabis medicines; TGA product categories', 'cann'), link: on(ph, 'cannabis') ? { label: 'Open Medicinal cannabis supply', to: 'service', id: 'cannabis' } : { label: 'Open Services', to: 'services' } };
    } },
  { id: 'inspect', chip: 'Inspection quick-check', q: 'What do inspectors find most often?',
    words: [/inspect|inspector|audit|council visit|hpca|ready|amh|etg|sink|declaration|30 june/],
    answer(ph, t) {
      const jun = t.slice(5) <= '06-30' ? t.slice(0, 4) + '-06-30' : (+t.slice(0, 4) + 1) + '-06-30';
      const lastQ1 = (ph.records || []).filter(r => r.type === 'Q1').map(r => r.date).sort().at(-1);
      return { text: `The repeat findings: digital eTG and AMH not readily accessible, no impervious dispensary sink with hot and cold running water, and a missing annual financial-interest declaration (due each year by 30 June, ${daysBetween(t, jun) === 0 ? 'today' : days(daysBetween(t, jun)) + ' away'}).`
          + (lastQ1 ? ` Your last site visit was ${fmt(lastQ1)}.` : ' No site visit is recorded yet.'),
        cite: cite('Pharmacy Council of NSW routine inspections; Health Practitioner Regulation (NSW) Regulation 2025 s 11', 'council'), link: { label: 'Start a visit', to: 'visit-start' } };
    } },
];
// Visit carry-overs: for each visit check, the latest visit that gave it a substantive answer (not N/A or "Not reviewed
// this visit"); if that answer is still "Needs verification" (shown as Check later), it has carried over.
export function carryovers(ph) {
  const visits = (ph.records || []).filter(r => r.type === 'Q1').sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.at || '').localeCompare(a.at || ''));
  const seen = new Set(), out = [], NS = /^(N\/A|Not reviewed this visit|)$/;
  for (const v of visits) for (const a of v.answers || []) { const k = a.item || a.text; if (!k || seen.has(k) || NS.test(a.answer || '')) continue;
    seen.add(k); if (a.answer === 'Needs verification') out.push({ key: k, title: a.text || k, date: v.date, note: a.note || '' }); }
  return out;
}
const norm = s => String(s || '').toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ').trim();
// Every question that matches, best first. A question matches when its first keyword group hits; more groups hit, higher.
export function match(query) {
  const q = norm(query); if (q.length < 2) return [];
  return QUESTIONS.map((x, i) => { const hits = x.words.map(re => re.test(q)); return { id: x.id, i, score: hits[0] ? hits.filter(Boolean).length : 0 }; })
    .filter(x => x.score).sort((a, b) => b.score - a.score || a.i - b.i).map(x => x.id);
}
// The one entry point. query is a question id (a chip) or typed words. Returns null when nothing matches.
export function ask(ph, query, t = now()) {
  if (!ph) return null;
  const byId = QUESTIONS.find(x => x.id === query), id = byId ? byId.id : match(query)[0]; if (!id) return null;
  const x = QUESTIONS.find(y => y.id === id), a = x.answer(ph, t);
  return { id, q: x.q, chip: x.chip, ...a, also: byId ? [] : match(query).slice(1, 3) };
}
