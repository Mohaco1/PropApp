/* ===== Express onboarding (owner idea 19 Nov 2026; agreed as "assumed – confirm", never assumed compliance) =====
 * Express asks only what is specific to this pharmacy. For every other question it:
 *   - assumes the standard arrangement (the first, standard-practice option) and records it as "Assumed – confirm", or
 *   - records "Needs verification" for anything that would claim evidence (reported, documented, checked), or
 *   - records "Needs verification" for record locations and references, to add later.
 * The same question cards and the same save step are used as in the Detailed flow.
 * Assumed answers are listed to confirm on Today and Policies, and a procedure cannot be approved while its
 * service still has unconfirmed assumptions. Defaults must be source-checked in Phase 3.
 */
RPH.express={};
/* Express is the default (owner decision 20 Nov 2026); choosing Detailed is remembered. */
/* Drafts must be objects to pass backup validation (fixed 20 Nov 2026: the earlier true/false and list values
   made "Download backup" fail with "Invalid draft" for anyone using Express). Old values are read and rewritten. */
RPH.express.on=()=>{try{const d=readDraft('express-mode');if(d===true||d===false){setDraft('express-mode',{mode:d?'express':'detailed'});return d;}return d?.mode!=='detailed';}catch{return true;}};
RPH.express.set=v=>setDraft('express-mode',{mode:v?'express':'detailed'});
RPH.express.keys=id=>{const d=readDraft('express/'+id);if(Array.isArray(d)){setDraft('express/'+id,{keys:d});return d;}return d?.keys||[];};
/* Standard arrangements that may be assumed (first option = the standard practice; each has a "different local arrangement" alternative). */
RPH.express.ASSUME={otp:['laibArea','laibStorage','takeaway','area'],daa:['listCheck','finalCheck','changes','s8Placement','s8Storage'],delivery:['failure','escalation'],staged:['exceptions'],adherence:['interruption']};
/* Free-text facts that are specific to the pharmacy and are always asked. */
RPH.express.ASK_TEXT=['routes','packingProvider','dispensingProvider','vaccines','pathway','preparations','tests','programs','responsibility'];
/* Owner's Express choices after Detailed UAT (20 Nov 2026, chosen in chat). Assumed answers are listed to confirm.
   Legal/Standards checklists are never ticked for the owner: skipped and recorded as "Needs verification". */
RPH.express.LATER={daa:['labels2026'],otp:['otpGovernance','laibAreaStd'],prescribing:['prescribing2026']};
RPH.express.VALUE={daa:{preparation:'Technicians or assistants,Pharmacists'},otp:{fileReviewer:'Pharmacist alone',supply:'Supervised dosing and authorised take-away doses'}};
for(const [id,ks] of Object.entries(RPH.express.VALUE))for(const k of Object.keys(ks))(RPH.express.ASSUME[id]??=[]).includes(k)||RPH.express.ASSUME[id].push(k);
RPH.express.opts=f=>Array.isArray(f[2])?f[2].map(o=>typeof o==='string'?o:(o.label||o.value||'')):null;
RPH.express.cat=function(id,f){
 const k=f[0],opts=RPH.express.opts(f);
 if((RPH.express.ASSUME[id]||[]).includes(k))return 'assume';
 if((RPH.express.LATER[id]||[]).includes(k))return 'later';
 if(opts&&opts.some(o=>/^Reported |Evidence pending|Documented local procedure|Local process(es)? reported|Local documentation reported/.test(o)))return 'verify';
 if(!opts){if(RPH.express.ASK_TEXT.includes(k)||sopIsSoftware(k))return 'ask';if(/2026$|Std$|Governance$/.test(k))return 'ask';return 'later';}
 return 'ask';
};
RPH.express.assumed=(id,n=state)=>n.serviceConfig?.[id]?.assumed||[];
const exBaseCard=fsCard;
/* ===== One setup flow for everyone (owner decision 20 Nov 2026: hybrid of Express and Detailed) =====
 * For each service: a one-line intro → questions about this pharmacy, one per screen, numbered honestly →
 * one screen "What most pharmacies do" listing the usual arrangements in plain sentences. The proprietor
 * confirms them ("That's how we do it"), changes any line, or marks a line "Check later". Evidence questions
 * and legal checklists are never answered for them: they are recorded as "Needs verification" ("to check later").
 * "Go through every question one by one" gives the full question-by-question setup for that service.
 * If the proprietor leaves before confirming, the usual answers are kept as "Assumed – confirm" (listed on
 * Today; the procedure can't be approved until they're confirmed), exactly as before.
 */
RPH.hy={};
RPH.hy.state=id=>{const d=readDraft('hy/'+id);return d&&typeof d==='object'&&!Array.isArray(d)?d:{};};
RPH.hy.put=(id,s)=>setDraft('hy/'+id,s);
RPH.hy.cache=id=>{const cache='fresh-config/'+id,base=JSON.stringify(sopProfile(id)),saved=readDraft(cache),valid=saved?.base===base;
 return {cache,base,saved,answers:RPH.qm.migrate(id,{...sopValues(id),...(valid?saved.answers:{})})};};
RPH.hy.fill=function(id,answers,ex){let fields=fsFields(id,answers);
 for(let guard=0;guard<6;guard++){let changed=false;
  for(const f of fields){const k=f[0];if(answers[k])continue;const c=RPH.express.cat(id,f);
   if(c==='assume'){const o=RPH.express.opts(f),dv=RPH.express.VALUE?.[id]?.[k]??o?.[0];if(dv){answers[k]=dv;ex.add(k);changed=true;}}
   else if(c==='verify'||c==='later'){answers[k]='Needs verification';changed=true;}}
  fields=fsFields(id,answers);if(!changed)break;}
 return fields;};
RPH.hy.asked=(id,fields)=>fields.filter(f=>RPH.express.cat(id,f)==='ask');
RPH.hy.usual=(id,fields)=>fields.filter(f=>RPH.express.cat(id,f)==='assume');
RPH.hy.laterList=(id,fields)=>fields.filter(f=>['verify','later'].includes(RPH.express.cat(id,f)));
RPH.hy.label=(id,k,f)=>RPH.qm.metaFor(id,k)?.label||f?.[1]||k;
RPH.hy.svc=id=>{const done=state.active.filter(x=>state.serviceConfig?.[x]?.complete&&x!==id).length;return 'Step 4 of 4 · Service '+Math.min(done+1,state.active.length)+' of '+state.active.length;};
fsCard=function(id,move=''){
 if(!RPH.express.on()||RPH.express.detail===id||!state.active.includes(id))return exBaseCard(id,move);
 setDraft('fresh-resume',{id});
 const {cache,base,answers}=RPH.hy.cache(id),ex=new Set(RPH.express.keys(id));
 const fields=RPH.hy.fill(id,answers,ex);setDraft('express/'+id,{keys:[...ex]});
 const hs=RPH.hy.state(id),asked=RPH.hy.asked(id,fields);
 if(!hs.intro){setDraft(cache,{base,answers,key:''});return RPH.hy.intro(id,fields);}
 if(RPH.hy.editing===id){RPH.hy.editing=null;setDraft(cache,{base,answers,key:''});return RPH.hy.summary(id);}
 const moveField=asked.find(f=>f[0]===move);
 const target=moveField?move:asked.find(f=>!answers[f[0]])?.[0];
 if(target){RPH.hy.cur={id,key:target,keys:asked.map(f=>f[0]).filter(k=>k!=='routes')};setDraft(cache,{base,answers,key:target});return exBaseCard(id,target);}
 RPH.hy.cur=null;setDraft(cache,{base,answers,key:''});
 return RPH.hy.summary(id);
};
RPH.hy.intro=function(id,fields){
 const asked=RPH.hy.asked(id,fields).filter(f=>f[0]!=='routes'),usual=RPH.hy.usual(id,fields),later=RPH.hy.laterList(id,fields);
 const b=fsOpen(serviceName(id));b.classList.add('rph-question','hy-intro');
 const st=peLine(b,RPH.hy.svc(id));st.setAttribute('role','status');st.dataset.svc='1';
 const h=peLine(b,'Setting up '+serviceName(id));h.classList.add('sq-label');
 const parts=[];if(asked.length||fields.some(f=>f[0]==='routes'))parts.push('a few questions about how your pharmacy does this');if(usual.length)parts.push('one screen of usual arrangements to check');
 peLine(b,'You’ll get '+(parts.join(', then ')||'a short summary')+'. Your answers write the draft '+serviceName(id)+' procedure for you to review, and plan its reviews.');
 if(later.length)peLine(b,'Anything that needs evidence or a record location isn’t asked now: it goes on your “to check later” list.');
 peLine(b,'Nothing is marked as checked or compliant for you.');
 const go=fbtn(b,'Start',()=>{RPH.hy.put(id,{...RPH.hy.state(id),intro:true});fsCard(id);});go.classList.add('primary');
 const one=fbtn(b,'Go through every question one by one',()=>{RPH.hy.put(id,{...RPH.hy.state(id),intro:true});RPH.express.detail=id;exBaseCard(id,fields[0]?.[0]||'');});one.classList.add('quiet');
};
RPH.hy.sentence=(id,k,v)=>v==='Needs verification'?'Check later':RPH.qm.split(v).map(p=>RPH.qm.showFor(id,k,p)).join(', ');
RPH.hy.summary=function(id){
 const {cache,base,answers}=RPH.hy.cache(id),ex=new Set(RPH.express.keys(id));const fields=RPH.hy.fill(id,answers,ex);
 setDraft('express/'+id,{keys:[...ex]});setDraft(cache,{base,answers,key:''});
 const usual=RPH.hy.usual(id,fields),later=RPH.hy.laterList(id,fields);
 if(!usual.length)return RPH.hy.confirm(id);
 const b=fsOpen(serviceName(id));b.classList.add('rph-question','hy-sum');
 const st=peLine(b,RPH.hy.svc(id)+' · Usual arrangements');st.setAttribute('role','status');st.dataset.svc='1';
 const h=peLine(b,'What most pharmacies do');h.classList.add('sq-label');
 peLine(b,'Check each line describes your pharmacy. Change any that don’t, or mark them “Check later”.');
 const ul=D.el('ul',{class:'hy-list'});
 for(const f of usual){const k=f[0],v=answers[k],li=D.el('li',{class:v==='Needs verification'?'hy-later':''});
  const t=D.el('div',{class:'hy-t'});t.append(D.el('b',{text:RPH.hy.label(id,k,f)}),D.el('span',{text:RPH.hy.sentence(id,k,v)}));
  const acts=D.el('div',{class:'hy-acts'});
  const ch=D.el('button',{type:'button',text:'Change'});ch.onclick=()=>{RPH.hy.editing=id;RPH.hy.cur=null;exBaseCard(id,k);};
  const lt=D.el('button',{type:'button',text:v==='Needs verification'?'Undo':'Check later'});
  lt.onclick=()=>{const c=RPH.hy.cache(id),e=new Set(RPH.express.keys(id));if(c.answers[k]==='Needs verification'){delete c.answers[k];}else{c.answers[k]='Needs verification';e.delete(k);}setDraft('express/'+id,{keys:[...e]});setDraft(c.cache,{base:c.base,answers:c.answers,key:''});RPH.hy.summary(id);};
  const pv=RPH.sq?.PROC?.[id]?.[k];
  if(pv){const b=D.el('button',{type:'button',text:'Preview'});const box=D.el('p',{class:'hy-prev',hidden:true});box.textContent=String(v).startsWith('We have our own')?'Your procedure will point to your own '+pv.label.toLowerCase()+'.':id==='otp'?'This part goes on your “Your OTP procedure” list to write, following current NSW OTP guidance. We don’t write clinical OTP steps for you.':'We’ll draft: '+pv.text;
   b.onclick=()=>{box.hidden=!box.hidden;b.textContent=box.hidden?'Preview':'Hide preview';};acts.prepend(b);t.append(box);}
  acts.append(ch,lt);li.append(t,acts);ul.append(li);}
 b.append(ul);
 if(later.length){const d=D.el('details',{class:'hy-ev'});d.append(D.el('summary',{text:later.length+' to check later (evidence or record locations, never filled in for you)'}));const l2=D.el('ul',{class:'hy-later-list'});for(const f of later){const li=D.el('li');li.append(D.el('span',{text:RPH.hy.label(id,f[0],f)}));const an=D.el('button',{type:'button',text:'Answer now'});an.onclick=()=>{RPH.hy.editing=id;RPH.hy.cur=null;exBaseCard(id,f[0]);};li.append(an);l2.append(li);}d.append(l2);b.append(d);}
 const ok=fbtn(b,'That’s how we do it',()=>RPH.hy.confirm(id));ok.classList.add('primary');
 const one=fbtn(b,'Go through them one by one',()=>{RPH.express.detail=id;exBaseCard(id,usual[0][0]);});one.classList.add('quiet');
};
RPH.hy.confirm=function(id){
 const {cache,base,answers}=RPH.hy.cache(id);const ex=new Set();const fields=RPH.hy.fill(id,answers,ex);
 setDraft('express/'+id,{keys:[]});setDraft(cache,{base,answers,key:''});
 RPH.hy.confirming=id;try{return RPH.express.finish(id,answers,fields);}finally{RPH.hy.confirming=null;}
};
/* Saving a changed line from the summary returns to the summary (instead of saving the whole service). */
const hyChange=fsChange;
fsChange=function(msg,fn){const sv=/^Saved reported arrangements · (.+)$/.exec(msg||''),sid=sv&&services.find(x=>serviceName(x.id)===sv[1])?.id;
 const e=RPH.hy.editing||(sid&&RPH.express.on()&&RPH.express.detail!==sid&&RPH.hy.confirming!==sid?sid:null);
 if(e&&msg==='Saved reported arrangements · '+serviceName(e)){const n=clone();fn(n);const vals=sopValues(e,n);const c=RPH.hy.cache(e);
  setDraft(c.cache,{base:c.base,answers:{...c.answers,...vals},key:''});RPH.hy.editing=null;setTimeout(()=>RPH.hy.summary(e),0);return false;}
 return hyChange.apply(this,arguments);};
/* Same save as the Detailed flow's last card (copied from the v27 card engine), plus the list of assumed answers. */
RPH.express.finish=function(id,answers,visible){
 const cache='fresh-config/'+id;
 if(fsChange('Saved reported arrangements · '+serviceName(id),n=>{
  sopSet(n,id,Object.fromEntries(visible.map(([x])=>[x,answers[x]])));const c=serviceRecord(n,id);c.complete=true;n.flags??={};
  if(id==='daa'){for(const [flag] of fsRouteOptions)n.flags[flag]=RPH.qm.split(answers.routes).includes(flag);c.providers={routeA:answers.packingProvider||'',routeB:answers.dispensingProvider||''};}
  if(id==='staged')n.flags.stagedFund=RPH.qm.has(answers.funding,'PPA-funded');
 })){setDraft(cache,null);setDraft('hy/'+id,null);const box=fsOpen('Service setup complete');peLine(box,serviceName(id)+' · saved');
  const vis=fsFields(id,answers),usual=RPH.hy.usual(id,vis).filter(([k])=>answers[k]!=='Needs verification').length,a=RPH.express.assumed(id).length,v=vis.filter(([k])=>answers[k]==='Needs verification').length;
  peLine(box,[usual-a>0?(usual-a)+' usual arrangement'+(usual-a===1?'':'s')+' confirmed by you':'',a?a+' still to confirm':'',v?v+' to check later (listed on Today)':''].filter(Boolean).join(' · ')||'All answers saved.');
  fbtn(box,fsPending().length?'Continue to next section':'Finish pharmacy setup',()=>fsNext(true));fbtn(box,'Review saved answers',()=>fsSummary(id));}
};
/* Record which answers were assumed when the service is saved (either save path). Confirming or changing an answer removes it. */
const exCommit=commit;
commit=function(n,message){
 const m=/^Saved reported arrangements · (.+)$/.exec(message||'');
 if(m){const s=services.find(x=>serviceName(x.id)===m[1]);if(s&&n.serviceConfig?.[s.id]){const ex=readDraft('express/'+s.id)?RPH.express.keys(s.id):null;const c=n.serviceConfig[s.id];
  if(ex&&RPH.express.on()&&RPH.express.detail!==s.id){const vals=c.procedureProfile?.answers||{};c.assumed=ex.filter(k=>vals[k]!==undefined&&vals[k]!=='Needs verification');}
  else if(c.assumed&&RPH.express.editing){c.assumed=c.assumed.filter(k=>k!==RPH.express.editing);}}}
 /* No approval while assumptions are unconfirmed. */
 for(const d of n.documents||[]){const before=(state.documents||[]).find(x=>x.id===d.id);if(d.lifecycle==='Approved'&&before?.lifecycle!=='Approved'){
  const owner=state.active.find(id=>servicePolicyIds(id).includes(d.catalogueId)&&RPH.express.assumed(id,n).length);
  if(owner){notify('Confirm the '+RPH.express.assumed(owner,n).length+' assumed answers for '+serviceName(owner)+' before approving this procedure.');return false;}}}
 const ok=exCommit(n,message);
 if(ok&&m){const s=services.find(x=>serviceName(x.id)===m[1]);if(s){setDraft('express/'+s.id,null);setDraft('hy/'+s.id,null);}RPH.express.editing=null;RPH.express.detail=null;}
 return ok;
};
RPH.express.confirm=function(id,k,label){fsChange('Confirmed assumed answer · '+serviceName(id)+' · '+label,n=>{const c=n.serviceConfig?.[id];if(c?.assumed)c.assumed=c.assumed.filter(x=>x!==k);});};
RPH.express.change=function(id,k){RPH.express.editing=k;RPH.express.detail=id;exBaseCard(id,k);};
/* List assumed answers with the other items to verify (Today, Policies). */
const exUnknowns=fsUnknowns;
fsUnknowns=function(){const list=exUnknowns();
 for(const id of state.active){const vals=sopValues(id);for(const k of RPH.express.assumed(id)){const f=sopFieldsFor(id).find(x=>x[0]===k);const label=(RPH.qm.metaFor(id,k)?.label||f?.[1]||k);
  list.push({id:'assumed/'+id+'/'+k,label:serviceName(id)+' · '+label+' · assumed: '+vals[k],assumed:{id,k,label},run:()=>RPH.express.review(id,k,label,vals[k])});}}
 return list;};
RPH.express.review=function(id,k,label,value){
 const b=fsOpen('Assumed answer');peLine(b,serviceName(id)+' · '+label);peLine(b,'Assumed standard arrangement: '+value);
 peLine(b,'Express setup assumed this. Confirm it if it’s what your pharmacy does, or change it.');
 fbtn(b,'Confirm',()=>{RPH.express.confirm(id,k,label);fsClose();});fbtn(b,'Change answer',()=>RPH.express.change(id,k));
};
/* Services step: no mode to choose; one line explains what happens next. */
const exServices=fsServicesSelect;
fsServicesSelect=function(){
 exServices();const b=$('editor')?.querySelector('.fresh-form');if(!b)return;
 const box=D.el('section',{class:'d-plan',id:'setup-how'});box.append(D.el('h3',{text:'What happens next'}));
 box.append(D.el('p',{text:'For each service you pick: a few questions about how your pharmacy does it, then one screen of usual arrangements to check. About 2–3 minutes a service. Nothing is marked as checked or compliant for you.'}));
 const plan=b.querySelector('.d-plan');(plan||b.querySelector('.d-tiles'))?.before(box);
};
