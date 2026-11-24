/* ===== "Your OTP procedure": one mobile screen instead of many actions (owner, 20 Nov 2026) =====
 * Source: NSW OTP Standards (November 2026), Standards for pharmacists at community pharmacy dosing points,
 * item 1: the pharmacy must have clearly documented (a) pharmacist responsibilities, (b) accounting and
 * records, (c) secure storage incl. LAIB cold chain, (d) clinical interventions and communication,
 * (e) dosing equipment maintenance, (f) takeaway doses incl. S8 labelling and child-resistant packaging,
 * (g) staff training records. Plus two local parts from setup: missed or intoxicated doses, and incidents.
 * - Setup raises ONE action ("Finish your OTP procedure"), not one per part, and setup actions are due in
 *   30 days rather than today.
 * - The action (and its Today row) opens one screen listing every part with "Written" / "To write".
 *   The proprietor marks each part; nothing is marked for them, and the action is closed only by them.
 */
RPH.otp={};
(()=>{const M=RPH.qm.meta.otp;
 if(M.otpGovernance)M.otpGovernance.checkTask='Finish your OTP procedure (OTP Standards, item 1)';
 for(const k of ['incidents','incidentProcess','films','takeawayControls','maintenance'])if(M[k])delete M[k].task;
 RPH.otp.SHORT={'Pharmacist responsibilities':'Pharmacist responsibilities','Accounting and records':'Accounting and records','Secure storage':'Secure storage (incl. LAIB cold chain)','Clinical interventions':'Clinical interventions and communication','Equipment maintenance':'Dosing equipment maintenance','Takeaway doses':'Takeaway doses','Staff training records':'Staff training records'};
})();
/* Setup actions are due in 30 days, not today (runs as the last step of every save, after the step that raises them). */
RPH.step('setup-actions-due-30-days',ctx=>{const n=ctx.n,before=new Set(Object.keys(ctx.prev?.taskLedger||state.taskLedger||{})),t0=today();
 for(const [id,t] of Object.entries(n.taskLedger||{}))if(!before.has(id)&&t.status==='Outstanding'&&t.due===t0&&(t.sources||[]).some(s=>s.type==='Service'))t.due=addInterval(t0,30,'days');});
RPH.otp.isTask=text=>/Finish your OTP procedure|documented OTP procedures required by the OTP Standards/.test(text||'');
RPH.otp.parts=function(){
 const v=sopValues('otp'),items=RPH.qm.checkItems('otp','otpGovernance',v),have=new Set(RPH.qm.split(v.otpGovernance));
 const local=[['incidents','Missed doses and intoxicated patients'],['incidentProcess','Reporting and notifying OTP incidents'],...(fsFields('otp',v).some(f=>f[0]==='films')?[['films','Supervising film doses']]:[])];
 const sel={};for(const it of items)sel['g:'+it.v]=have.has(it.v);for(const [k] of local)sel['l:'+k]=String(v[k]||'').startsWith('We have our own');
 const b=fsOpen('Your OTP procedure');b.classList.add('rph-question','otp-parts');
 const st=peLine(b,'');st.setAttribute('role','status');st.dataset.svc='1';
 const upd=()=>{const n=Object.values(sel).filter(Boolean).length;st.textContent=n+' of '+Object.keys(sel).length+' parts written';};upd();
 const h=peLine(b,'What your OTP procedure must cover');h.classList.add('sq-label');
 peLine(b,'The OTP Standards (November 2026, item 1) require these to be clearly documented at the pharmacy. Mark each part when your written procedure covers it. Nothing is marked for you.');
 const ul=D.el('ul',{class:'hy-list'});
 const row=(key,title,sub)=>{const li=D.el('li');const t=D.el('div',{class:'hy-t'});t.append(D.el('b',{text:title}),D.el('span',{text:sub}));
  const acts=D.el('div',{class:'hy-acts'});const w=D.el('button',{type:'button',text:'Written'}),x=D.el('button',{type:'button',text:'To write'});
  const paint=()=>{w.setAttribute('aria-pressed',String(sel[key]));x.setAttribute('aria-pressed',String(!sel[key]));li.classList.toggle('otp-done',sel[key]);upd();};
  w.onclick=()=>{sel[key]=true;paint();};x.onclick=()=>{sel[key]=false;paint();};acts.append(w,x);li.append(t,acts);paint();return li;};
 ul.append(D.el('li',{class:'otp-hd',text:'Required by the OTP Standards'}));
 for(const it of items)ul.append(row('g:'+it.v,RPH.otp.SHORT[it.v]||it.v,it.t));
 ul.append(D.el('li',{class:'otp-hd',text:'Also in your procedure (from setup)'}));
 for(const [k,label] of local)ul.append(row('l:'+k,label,'Your own steps, following current NSW OTP guidance.'));
 b.append(ul);
 const msg=peLine(b,'');msg.setAttribute('role','status');
 const save=fbtn(b,'Save',()=>{
  if(fsChange('Updated OTP procedure parts',n=>{const cur=sopValues('otp',n);const g=items.filter(it=>sel['g:'+it.v]).map(it=>it.v);
   const next={...cur,otpGovernance:g.length?g.join(','):'None confirmed yet'};for(const [k] of local)next[k]=sel['l:'+k]?(String(cur[k]||'').startsWith('We have our own')?cur[k]:'We have our own procedure: In our OTP procedure'):'Draft it for me';
   sopSet(n,'otp',next);})){msg.textContent=Object.values(sel).every(Boolean)?'Saved. Every part is written: close the action when you’re happy with it.':'Saved.';}
 });save.classList.add('primary');
 fbtn(b,'Close',()=>fsClose()).classList.add('quiet');
};
/* Today: the OTP procedure action opens the parts screen. */
const otpRows=CD.todayRows;
CD.todayRows=function(){return otpRows.apply(this,arguments).map(r=>RPH.otp.isTask(r.item)?{...r,item:'Finish your OTP procedure · '+(()=>{const v=sopValues('otp'),g=RPH.qm.split(v.otpGovernance).filter(x=>x!=='None confirmed yet').length,tot=RPH.qm.checkItems('otp','otpGovernance',v).length;return (tot-g)+' of '+tot+' Standards parts to write';})(),open:()=>RPH.otp.parts(),related:r.open,relatedLabel:'Action details'}:r);};
/* Action window: a button to the parts screen. */
RPH.otp.hook=function(){const ed=$('editor');if(!ed?.open||ed.querySelector('.otp-open'))return;
 const title=ed.querySelector('input[name=text],#task-form input')?.value||'';if(!RPH.otp.isTask(title))return;
 const form=ed.querySelector('#task-form')||ed.querySelector('form');if(!form)return;
 const b=D.el('button',{type:'button',class:'otp-open primary',text:'Open your OTP procedure parts'});b.onclick=()=>RPH.otp.parts();form.before(b);};
new MutationObserver(()=>RPH.otp.hook()).observe($('editor'),{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
