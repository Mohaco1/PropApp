/* ===== Proprietor helpers (owner, 20 Nov 2026) =====
 * 1. "My log": a simple list of things the owner reported or sent (date, what, to whom, reference). For memory only,
 *    no patient details. Reachable from Pharmacy setup and from each "If something goes wrong" card.
 * 2. Staff: suggested credentials for each person's services (e.g. CPR for an immuniser). Tapping one fills the
 *    name and service; the owner enters the real date and reference. Nothing is recorded for them.
 * 3. S8 review split: the safe and fridge construction checks (Medicine Storage Standards) appear in the quarterly
 *    S8 review only when they haven't been answered in the last 12 months, or after the owner says the safe or
 *    fridge changed. The register, keys and codes checks stay every quarter.
 */
RPH.help={};
/* ---------- 1. My log ---------- */
RPH.help.KINDS=['Reported to NSW Health (Pharmaceutical Services)','Reported to the police','Reported to the public health unit','Notified the TGA','Told the prescriber or GP','Contacted the Pharmacy Council or Board','Other'];
RPH.help.log=(n=state)=>n.ownerLog||[];
RPH.help.logScreen=function(pre){const b=fsOpen('My log');b.classList.add('insp');
 peLine(b,'A note of what you reported or sent, so you can find it later. No patient names or details: just what, who to, when and any reference number.');
 const what=peField(b,'What happened (no patient details)',pre?.what||'');what.maxLength=200;
 const kindL=D.el('label');kindL.append('Who it went to');const kind=D.el('select');for(const k of RPH.help.KINDS)kind.add(new Option(k,k));if(pre?.kind)kind.value=pre.kind;kindL.append(kind);b.append(kindL);
 const date=peField(b,'Date');date.type='date';date.value=today();date.max=today();
 const ref=peField(b,'Reference or receipt number (optional)');ref.maxLength=120;
 const msg=D.el('p',{class:'sd-msg',role:'status'});
 const list=D.el('ul',{class:'insp-ans help-log'});
 const draw=()=>{list.replaceChildren();const rows=[...RPH.help.log()].reverse();if(!rows.length){list.append(D.el('li',{text:'Nothing logged yet.'}));return;}
  for(const r of rows.slice(0,50)){const li=D.el('li');li.append(D.el('b',{text:pretty(r.date)+' · '+r.what}),D.el('span',{text:r.kind+(r.ref?' · ref '+r.ref:'')+(r.by?' · logged by '+r.by:'')}));list.append(li);}};
 fbtn(b,'Add to log',()=>{const w=what.value.trim();if(!w){msg.textContent='Write what happened.';return;}if(!/^\d{4}-\d{2}-\d{2}$/.test(date.value)||date.value>today()){msg.textContent='Enter the date it was sent (not in the future).';return;}
  if(fsChange('Logged · '+w.slice(0,60),n=>{(n.ownerLog??=[]).push({id:'log-'+crypto.randomUUID(),date:date.value,what:w,kind:kind.value,ref:ref.value.trim(),by:RPH.actor(n).name,at:new Date().toISOString()});})){what.value='';ref.value='';msg.textContent='Added.';draw();}}).classList.add('primary');
 b.append(msg);const h=D.el('h4',{text:'Logged'});b.append(h,list);draw();
 fbtn(b,'Close',()=>fsClose()).classList.add('quiet');};
/* "Log that you reported it" on each incident card of the S8 page. */
const helpS8=RPH.insp.s8;
RPH.insp.s8=function(){helpS8.apply(this,arguments);const inc=$('editor')?.querySelector('.insp-inc');if(!inc)return;
 const pre={'S8 or S4D missing or stolen':['Reported missing or stolen S8/S4D','Reported to NSW Health (Pharmaceutical Services)'],'Drug register lost or destroyed':['Reported lost or destroyed drug register','Reported to NSW Health (Pharmaceutical Services)'],'Suspected forged prescription':['Reported a suspected forged prescription','Reported to NSW Health (Pharmaceutical Services)']};
 for(const d of inc.querySelectorAll('details')){const t=d.querySelector('summary')?.textContent;const p=pre[t];if(!p||d.querySelector('.help-logbtn'))continue;
  const x=D.el('button',{type:'button',class:'rph-link help-logbtn',text:'Log that you reported it'});x.onclick=()=>RPH.help.logScreen({what:p[0],kind:p[1]});d.append(x);}};
/* ---------- 2. Staff suggestions ---------- */
RPH.help.SUGGEST=[
 [()=>true,'','Pharmacist registration (Ahpra)','Renews each year by 30 November; 40 CPD credits each year to 30 September (Pharmacy Board).'],
 [s=>s.includes('vaccination'),'vaccination','Immuniser training certificate','For each vaccine they give (NSW Pharmacist Vaccination Standards).'],
 [s=>s.includes('vaccination'),'vaccination','CPR certificate','Must be under 12 months old; paediatric CPR if vaccinating under-14s.'],
 [s=>s.includes('vaccination'),'vaccination','NSW Pharmacist Immuniser Declaration Form','Kept at the pharmacy for audit.'],
 [s=>s.includes('vaccination'),'vaccination','First aid certificate','Renewed every 3 years; no grace period (Pharmacy Council vaccination checklist).'],
 [s=>s.includes('vaccination'),'vaccination','NSW Health vaccine cold-chain training module','Everyone who handles vaccine storage.'],
 [s=>s.includes('otp'),'otp','Read and understood the OTP Standards','Every pharmacist (OTP registration undertaking).'],
 [s=>s.includes('prescribing'),'prescribing','Working with Children Check','If they see patients under 18.'],
 [s=>s.includes('prescribing')&&RPH.qm.split(sopValues('prescribing').pathway).includes('Contraception'),'prescribing','Injection course (for DMPA)','Only if they give the contraceptive injection.']];
RPH.help.suggest=function(p){const s=(p.services||[]).filter(x=>state.active.includes(x));const out=[];
 for(const [when,svc,title,hint] of RPH.help.SUGGEST)if(when(s))out.push({svc,title,hint});
 if(s.includes('prescribing'))for(const c of RPH.qm.split(sopValues('prescribing').pathway).filter(v=>v&&v!=='Needs verification'))out.push({svc:'prescribing',title:'Prescribing training · '+c,hint:'Condition-specific training required by the NSW Class Authority.'});
 const have=(p.credentials||[]).filter(c=>!c.supersededBy).map(c=>(c.title||'').toLowerCase());
 return out.filter(o=>!have.some(h=>h.includes(o.title.toLowerCase().split(' (')[0])));};
const helpCred=credentialEditor;
credentialEditor=function(id){helpCred.apply(this,arguments);const form=$('credential-form');const p=state.staff?.find(x=>x.id===id);if(!form||!p||form.querySelector('.help-sugg'))return;
 const list=RPH.help.suggest(p);if(!list.length)return;
 const box=D.el('div',{class:'help-sugg'});box.append(D.el('p',{class:'sd-note',text:'Suggested for '+p.person+'’s services (not recorded yet). Tap one to fill it in, then add the real date and reference.'}));
 const chips=D.el('div',{class:'help-chips'});
 for(const o of list){const c=D.el('button',{type:'button',class:'help-chip',text:o.title,title:o.hint});c.onclick=()=>{form.elements.title.value=o.title;if(form.elements.service&&o.svc)form.elements.service.value=o.svc;form.elements.title.dispatchEvent(new Event('input',{bubbles:true}));const h=form.querySelector('.help-hint')||D.el('p',{class:'sd-note help-hint'});h.textContent=o.hint;form.elements.title.closest('label')?.after(h);};chips.append(c);}
 box.append(chips);form.prepend(box);};
/* Staff record: a line listing what's suggested and not recorded yet. */
const helpPerson=CD.V.person;
CD.V.person=function(){const html=helpPerson.apply(this,arguments);CD.after.push(()=>{const p=personRecord(profileId);if(!p||p.active===false)return;const list=RPH.help.suggest(p);const st=$('cd-view')?.querySelector('p.status');if(!st||!list.length||$('cd-view').querySelector('.help-missing'))return;
 const d=D.el('p',{class:'help-missing'});d.append(D.el('span',{text:'Suggested for their services, not recorded: '+list.map(o=>o.title).join(', ')+'. '}));const a=D.el('button',{type:'button',class:'rph-link',text:'Add one'});a.onclick=()=>credentialEditor(p.id);d.append(a);st.after(d);});return html;};
/* ---------- 3. S8 review: construction checks once a year ---------- */
RPH.help.YEARLY=/^(Storage \(Medicine Storage Standards|Fixing \(Medicine Storage Standards)/;
RPH.help.storageDue=(n=state)=>{const d=n.s8StorageChecked;return !d||addInterval(d,12,'months')<=today();};
const helpQ=reviewQuestions;
reviewQuestions=function(a){const rows=helpQ.apply(this,arguments);if(a?.id!=='B1'||RPH.help.storageDue())return rows;return rows.filter(q=>!RPH.help.YEARLY.test(q));};
RPH.step('s8-storage-yearly',ctx=>{for(const r of ctx.newReviews||[])if(r.audit==='B1'&&(r.answers||[]).some(a=>RPH.help.YEARLY.test(a.question||'')))ctx.n.s8StorageChecked=r.date;});
/* S8 page: show when the construction checks were last done, and let the owner bring them forward. */
const helpS8b=RPH.insp.s8;
RPH.insp.s8=function(){helpS8b.apply(this,arguments);const kv=$('editor')?.querySelector('.insp-kv');if(!kv||kv.querySelector('.help-sc'))return;
 const d=state.s8StorageChecked;const sp=D.el('span',{class:'help-sc',text:'Safe and fridge construction check'});const v=D.el('b',{text:d?pretty(d)+' · next with the S8 review after '+pretty(addInterval(d,12,'months')):'At the next S8 review'});kv.append(sp,v);
 if(d&&!RPH.help.storageDue()){const x=D.el('button',{type:'button',class:'rph-link',text:'Safe or fridge changed? Check it at the next S8 review'});x.onclick=()=>{if(fsChange('S8 safe or fridge changed · construction check at next S8 review',n=>{n.s8StorageChecked='';}))RPH.insp.s8();};kv.after(x);}};
/* ---------- Pharmacy setup row ---------- */
const helpSite=siteSetup;
siteSetup=function(){helpSite.apply(this,arguments);const list=$('main')?.querySelector('.rph-menu');if(!list||list.querySelector('[data-insp=log]'))return;
 const x=RPH.el('button',{type:'button',class:'rph-menu-row'},RPH.el('strong',{text:'My log'}),RPH.el('small',{text:RPH.help.log().length+' logged · what you reported and when'}));x.dataset.insp='log';x.onclick=()=>RPH.help.logScreen();
 const first=list.querySelector('[data-insp]');first?first.before(x):list.append(x);};
