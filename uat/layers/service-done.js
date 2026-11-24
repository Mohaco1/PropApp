/* ===== "What happens next" after each service (owner decision 2, 20 Nov 2026) =====
 * The "Service setup complete" screen now shows, for that service:
 *  - a tick and "X of N services done";
 *  - its reviews: how often, and the first due date (a suggested date you can change for reviews that have
 *    none yet; existing dates are shown and changed later in Calendar, where moving one needs a reason);
 *  - its procedure: ready to draft in Policies, with a Preview of the wording;
 *  - what's on "to check later".
 * Saving dates is the proprietor's action ("Save these dates"); nothing is scheduled without it. Undated reviews
 * that are left are picked up by the last setup step.
 */
RPH.sd={};
RPH.sd.MONTHS={Monthly:1,Quarterly:3,'Six-monthly':6,Annual:12,Annually:12,Yearly:12};
RPH.sd.months=a=>{for(const [k,m] of Object.entries(RPH.sd.MONTHS))if(new RegExp('^'+k,'i').test(a.frequency||''))return m;return 0;};
const sdCommit=commit;
commit=function(n,message){const ok=sdCommit.apply(this,arguments);const m=/^Saved reported arrangements · (.+)$/.exec(message||'');
 if(ok&&m){const s=services.find(x=>serviceName(x.id)===m[1]);if(s)RPH.sd.last=s.id;}return ok;};
RPH.sd.enhance=function(){const ed=$('editor');if(!ed?.open||ed.querySelector('.sd-box'))return;
 if((ed.querySelector('#dialog-title')?.textContent||'').trim()!=='Service setup complete')return;
 const id=RPH.sd.last;if(!id||!state.active.includes(id))return;
 const form=ed.querySelector('.fresh-form')||ed;const firstBtn=[...form.querySelectorAll(':scope>button')][0];
 const done=state.active.filter(x=>state.serviceConfig?.[x]?.complete).length,total=state.active.length;
 const box=D.el('div',{class:'sd-box'});
 // tick + progress
 const head=D.el('div',{class:'sd-head'});head.innerHTML='<svg class="sd-tick" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg>';
 const ht=D.el('div');ht.append(D.el('b',{text:serviceName(id)+' is set up'}),D.el('span',{class:'sd-prog',text:done+' of '+total+' services done'}));head.append(ht);box.append(head);
 const dots=D.el('div',{class:'sd-dots','aria-hidden':'true'});for(const x of state.active)dots.append(D.el('i',{class:state.serviceConfig?.[x]?.complete?'on':''}));box.append(dots);
 // reviews
 const revs=catalog().filter(a=>a.service===id&&isActive(a));
 const dv=id==='daa'?sopValues('daa'):null;
 if(revs.length||dv?.sampleFrequency){const sec=D.el('section',{class:'sd-sec'});sec.append(D.el('h4',{text:'Reviews for this service'}));const inputs=[];
  if(dv?.sampleFrequency&&dv.sampleFrequency!=='Needs verification'){const row=D.el('div',{class:'sd-row'});const t=D.el('div');t.append(D.el('b',{text:'Routine DAA check (sample of packs and records)'}),D.el('span',{text:dv.sampleFrequency+' · your choice'}));row.append(t,D.el('span',{class:'sd-date',text:'Planned from your answer'}));sec.append(row);}
 for(const a of revs){const row=D.el('div',{class:'sd-row'});const t=D.el('div');t.append(D.el('b',{text:a.name}),D.el('span',{text:a.eventOnly?'When needed · '+(a.frequency||''):(a.frequency||'')}));row.append(t);
   const cur=state.schedule?.[a.id],m=RPH.sd.months(a);
   if(cur)row.append(D.el('span',{class:'sd-date',text:'First due '+pretty(cur)}));
   else if(!a.eventOnly&&m){const i=D.el('input',{type:'date','aria-label':'First due date · '+a.name});i.value=addInterval(today(),m,'months');i.min=today();inputs.push([a.id,i]);row.append(i);}
   else row.append(D.el('span',{class:'sd-date',text:'Planned from Calendar when needed'}));
   sec.append(row);}
  if(inputs.length){const msg=D.el('p',{class:'sd-msg',role:'status'});const save=D.el('button',{type:'button',class:'sd-save',text:'Save these dates'});
   save.onclick=()=>{const vals=inputs.filter(([,i])=>i.value);if(!vals.length){msg.textContent='Enter a date, or leave them for later.';return;}
    if(fsChange('Saved first due dates · '+serviceName(id),n=>{for(const [k,i] of vals)n.schedule[k]=i.value;})){for(const [,i] of inputs)i.disabled=true;save.disabled=true;msg.textContent='Saved. You can change them later in Calendar.';}};
   sec.append(D.el('p',{class:'sd-note',text:'Suggested from how often each review runs. Change any date, or leave them and set them at the end of setup.'}),save,msg);}
  box.append(sec);}
 // procedure
 const proc=D.el('section',{class:'sd-sec'});proc.append(D.el('h4',{text:'Your procedure'}),D.el('p',{text:'Your answers are ready to draft the '+serviceName(id)+' procedure in Policies. You review and approve it there; nothing is approved for you.'}));
 let text='';try{text=sopDocument(id)||'';}catch{}
 if(text){const d=D.el('details',{class:'sd-prev'});d.append(D.el('summary',{text:'Preview the draft'}),D.el('pre',{text:text.split('\n').slice(0,40).join('\n')+(text.split('\n').length>40?'\n…':'')}));proc.append(d);}
 box.append(proc);
 // to check later
 const vals=sopValues(id),later=fsFields(id,vals).filter(([k])=>vals[k]==='Needs verification');
 if(later.length){const sec=D.el('section',{class:'sd-sec'});sec.append(D.el('h4',{text:'To check later ('+later.length+')'}));const ul=D.el('ul');for(const f of later)ul.append(D.el('li',{text:RPH.qm.metaFor(id,f[0])?.label||f[1]}));sec.append(ul,D.el('p',{class:'sd-note',text:'These are on Today when you’re ready. Nothing here is marked as checked.'}));box.append(sec);}
 // replace the old count lines with the new box
 for(const p of [...form.querySelectorAll(':scope>p')])if(/saved|to check later|confirmed by you|still to confirm|assumed/i.test(p.textContent)&&!p.matches('[role=status]'))p.remove();
 if(firstBtn)firstBtn.before(box);else form.append(box);
 if(firstBtn)firstBtn.classList.add('primary');
};
new MutationObserver(()=>RPH.sd.enhance()).observe($('editor'),{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
