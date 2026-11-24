// Fictional example data shaped like the Concept D prototype's scenario, written with the app's own record shapes.
module.exports = () => {
  const n = clone(), t = today(), add = d => addInterval(t, d, 'days'), at = new Date().toISOString(), id = () => crypto.randomUUID();
  Object.assign(n, { freshSite: true, onboarded: true, freshProprietors: true, freshSelection: true, pharmacyName: 'Harbourview Pharmacy', proprietors: [{ id: 'p1', name: 'Alex Owner', primary: true }], currentReviewer: 'p1', active: ['daa', 'otp', 'vaccination', 'delivery'] });
  n.siteProfile = { ...siteProfile(n), proprietor: 'Alex Owner', address: '1 Example Street, Testville NSW' };
  for (const s of n.active) { n.serviceConfig ??= {}; n.serviceConfig[s] = { ...(n.serviceConfig[s] || {}), complete: s !== 'delivery' }; }
  n.schedule.Q1 = add(-16); n.schedule.B1 = add(12); n.schedule.M2 = add(6); n.schedule.M1 = add(20);
  const ids = catalog().filter(a => a.service && n.active.includes(a.service) && !a.eventOnly).map(a => a.id);
  ids.forEach((x, i) => n.schedule[x] = add(3 + i * 5));
  n.reviews = [...(n.reviews || []), { id: id(), audit: 'Q1', date: add(-72), at, by: 'Alex Owner', answers: [] }, { id: id(), audit: 'B1', date: add(-79), at, by: 'Alex Owner', answers: [] }, { id: id(), audit: ids[0], date: add(-24), at, by: 'Alex Owner', answers: [] }];
  n.staff = [
    { id: 's1', person: 'Sam Taylor', role: 'Pharmacist', active: true, services: ['vaccination'], annualDue: add(40), credentials: [{ id: 'c1', title: 'Immuniser certificate', reference: 'TEST-1', expiry: add(11) }] },
    { id: 's2', person: 'Priya Nair', role: 'Pharmacist', active: true, services: [], annualDue: add(120), credentials: [] },
    { id: 's3', person: 'Mia Chen', role: 'Dispensary technician / assistant', active: true, services: ['daa'], annualDue: add(90), credentials: [] },
    { id: 's4', person: 'Jordan Lee', role: 'Pharmacy assistant', active: true, services: [], annualDue: add(-2), credentials: [] }];
  n.taskLedger ??= {};
  const task = (text, owner, due, status = 'Outstanding', src = 'Cold chain review · 30 Oct') => { const k = id(); n.taskLedger[k] = { id: k, pharmacyId: n.taskPharmacyId, text, owner, due, status, createdAt: at, completedAt: status === 'Completed' ? at : '', outcome: '', evidence: '', sources: [], activity: [{ at, by: 'Alex Owner', message: 'Raised from ' + src }] }; };
  task('Fix fridge log gaps', 'Sam Taylor', add(6)); task('Confirm where OTP approvals are filed', 'Sam Taylor', add(1)); task('Look at a second fridge thermometer', 'Priya Nair', add(26));
  task('Replace expired stock on shelf 4', 'Jordan Lee', add(-7), 'Completed'); task('Update after-hours contact list', 'Sam Taylor', add(-16), 'Completed');
  const doc = (title, lifecycle, version, reviewDate) => ({ id: id(), scope: 'pharmacy', group: 'Policies & procedures', title, catalogueId: '', registered: true, lifecycle, reference: 'Local folder · ' + title, owner: 'Alex Owner', version, body: '', reviewDate, updatedAt: at });
  n.documents = [...(n.documents || []), doc('Dose administration aids', 'Draft', '', ''), doc('Cold chain and fridge management', 'Approved', '2', add(-3)), doc('Vaccination', 'Approved', '3', add(200)), doc('Opioid treatment (OTP)', 'Approved', '2', add(220)), doc('Controlled drugs (S8) handling', 'Approved', '2', add(240)), doc('Home delivery', 'Approved', '1', add(260))];
  n.meetings = [...(n.meetings || []), { id: id(), title: 'Check-in with Sam', date: add(-29), type: 'Proprietor check-in', attendees: 'Alex Owner, Sam Taylor', notes: 'Fridge log gaps discussed. OTP approvals location to confirm.', actions: [], versions: [], by: 'Alex Owner', sections: [] }];
  commit(n, 'Example data (fictional)');
  const s = document.getElementById('status'); if (s) s.style.setProperty('display', 'none', 'important');
};
