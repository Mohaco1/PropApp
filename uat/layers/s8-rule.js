/* ===== S8 inventory date limit · Medicines, Poisons and Therapeutic Goods Regulation 2026, s 111 =====
 * Approved by the owner on 19 Nov 2026 (uat/S8-RULE-FOR-APPROVAL.md).
 * s 111(1)(b): a community pharmacy must make an S8 inventory every 3 months, unless NSW Health has approved other times.
 * One guard on the save step covers every way the S8 date can change (review completion, Change due date,
 * Calendar, plain words, first date, setup dates, reminders). It uses v27's own legalLatest('B1') calculation:
 * 3 months after the latest recorded stock-check (inventory) date.
 */
RPH.s8={};
RPH.s8.approved=(n=state)=>n.scheduleMeta?.B1?.approvedTimes||null;
/* Latest allowed due date. With no inventory on record: 3 months from today.
   If the 3 months have already passed (overdue): a short planning window of 7 days from today (owner decision 19 Nov 2026: "this app is to help, not police"). */
RPH.s8.graceDays=7;
RPH.s8.overdue=(n=state)=>{const l=legalLatest('B1',n);return !!l&&l<today();};
RPH.s8.limit=function(n=state){let lim=legalLatest('B1',n)||addInterval(today(),3,'months');if(lim<today())lim=addInterval(today(),RPH.s8.graceDays,'days');return lim;};
RPH.s8.message=lim=>RPH.s8.overdue()?'The S8 inventory is overdue. Plan it within the next '+RPH.s8.graceDays+' days, on or before '+pretty(lim)+'.':'To keep the S8 inventory on track (every 3 months, Regulation s 111), choose a date on or before '+pretty(lim)+'.';
RPH.s8.check=function(n){
 const before=state.schedule.B1||'',after=n.schedule?.B1||'';
 if(after===before||RPH.s8.approved(n))return '';
 const b1=catalog().find(a=>a.id==='B1');
 if(!after)return b1&&isActive(b1)?'The S8 inventory date can’t be removed while S8 substances are kept here (Regulation s 111).':'';
 const lim=RPH.s8.limit(n);
 return after>lim?RPH.s8.message(lim):'';
};
const s8Commit=commit;
commit=function(n,message){const err=RPH.s8.check(n);if(err){notify(err);return false;}return s8Commit(n,message);};

/* Change due date window: show the limit and the "approved other times" option for the S8 stock check. */
const s8Dialog=RPH.schedule.dialog;
RPH.schedule.dialog=function(id,after){
 s8Dialog(id,after);
 if(id!=='B1')return;
 const ed=$('editor'),date=ed.querySelector('input[type=date]'),err=ed.querySelector('[role=alert]');if(!date)return;
 const ap=RPH.s8.approved(),lim=RPH.s8.limit();
 const box=RPH.el('div',{class:'rph-callout',id:'s8-limit'});
 if(ap){
  box.append(RPH.el('p',{text:'NSW Health approved other inventory times for this pharmacy · reference '+ap.reference+' (recorded '+pretty(ap.at.slice(0,10))+' by '+ap.by+'). The 3-month limit doesn’t apply.'}));
  box.append(RPH.button('Remove the approval',()=>{if(fsChange('Removed NSW Health approved S8 inventory times · '+ap.reference,n=>{const m=(n.scheduleMeta??={}).B1??={changes:[]};delete m.approvedTimes;}))RPH.schedule.dialog('B1',after);},'rph-link'));
 }else{
  date.max=lim;
  box.append(RPH.el('p',{text:RPH.s8.overdue()?'The S8 inventory is overdue. You can plan it any time in the next '+RPH.s8.graceDays+' days (latest '+pretty(lim)+').':'Latest date to stay on track: '+pretty(lim)+'. Regulation 2026 s 111: an S8 inventory every 3 months, unless NSW Health has approved other times.'}));
  const l=RPH.el('label',{class:'checkline'}),cb=RPH.el('input',{type:'checkbox',id:'s8-approved'});l.append(cb,' NSW Health has approved other inventory times for this pharmacy');box.append(l);
  const ref=RPH.el('input',{type:'text',id:'s8-approval-ref',maxLength:160,'aria-label':'Approval reference','placeholder':'Approval reference (letter, date or number)'});ref.hidden=true;box.append(ref);
  cb.onchange=()=>{ref.hidden=!cb.checked;date.max=cb.checked?'':lim;};
  const save=[...ed.querySelectorAll('button')].find(b=>b.textContent==='Save new due date');
  if(save)save.addEventListener('click',e=>{
   if(cb.checked){
    if(ref.value.trim().length<3){e.stopImmediatePropagation();err.textContent='Enter the NSW Health approval reference.';return;}
    const reference=ref.value.trim(),a=RPH.actor();
    if(!fsChange('Recorded NSW Health approved S8 inventory times · '+reference,n=>{const m=(n.scheduleMeta??={}).B1??={changes:[]};m.approvedTimes={reference,by:a.name,byId:a.id,at:RPH.now()};})){e.stopImmediatePropagation();return;}
   }else if(date.value&&date.value>lim){e.stopImmediatePropagation();err.textContent=RPH.s8.message(lim);}
  },true);
 }
 (err||date).before(box);
};

/* S8 review form: the next inventory date follows the stock-check date (s 111: every 3 months from the last inventory).
   The form's own default is today + 3 months; when a stock-check date is entered, the next date is capped at that date + 3 months. */
RPH.s8.formAssist=function(){
 const ed=$('editor'),stock=ed.querySelector('#stock-date'),next=ed.querySelector('#next-date');
 if(!ed.open||!stock||!next||next.dataset.s8)return;
 next.dataset.s8='1';
 const note=RPH.el('p',{class:'rph-small',id:'s8-next-note'});next.closest('label')?.after(note);
 const apply=()=>{if(RPH.s8.approved()){note.textContent='';next.removeAttribute('max');return;}
  let lim=stock.value?addInterval(stock.value,3,'months'):RPH.s8.limit();if(lim<today())lim=addInterval(today(),RPH.s8.graceDays,'days');next.max=lim;
  if(next.value&&next.value>lim)next.value=lim;
  note.textContent='Next inventory by '+pretty(lim)+' (3 months after the stock check, Regulation s 111).';};
 stock.addEventListener('input',apply);stock.addEventListener('change',apply);apply();
};
new MutationObserver(()=>RPH.s8.formAssist()).observe($('editor'),{childList:true,subtree:true});
