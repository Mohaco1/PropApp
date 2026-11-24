/* ===== Fixes from the live walkthrough (Codex, 21 Nov 2026; owner said "try now") =====
 * 1. Calendar includes dated open actions, so "due within 7 days" and the weekly view agree with Actions.
 * 2. "Create this draft" on each service's "what happens next" screen opens that service's policy topic.
 * 3. Policy status codes shown in plain words.
 * 4. S8 review: no provisional next-inventory date until the stock-check date is entered.
 * 5. Adopting a procedure is blocked while it still has [Confirm: …] items (owner decision, as recommended).
 * 6. Wording: "Pharmacy details saved", "1 person", meetings say "Save meeting" / "Schedule next meeting".
 */
/* 1. Calendar */
CD.calRows=()=>[...D.rows(),...taskRows().filter(t=>t.status==='Outstanding'&&t.due).map(t=>({id:'task/'+t.id,label:'Action · '+(t.text||'').split(' · ')[0].slice(0,90),date:t.due,active:true,taskType:true,run:()=>taskEditor(t.id)}))];
/* 2. Create this draft */
RPH.cx={};
RPH.cx.draftFor=function(id){const ids=servicePolicyIds(id);const row=ids.map(k=>peById.get(k)).find(Boolean);if(!row){CD.go('documents');return;}
 const existing=(()=>{try{return procedureDocs().find(d=>d.catalogueId===row.id&&d.lifecycle!=='Archived');}catch{return null;}})();if(existing){policyDetail(existing.id);return;}
 if(procedureStarters.has(row.id))peDraft(row);else templateInfo(row);};
RPH.cx.sdHook=function(){const ed=$('editor');if(!ed?.open)return;const box=ed.querySelector('.sd-box');if(!box||box.querySelector('.cx-draft'))return;
 const id=RPH.sd?.last;if(!id)return;const sec=[...box.querySelectorAll('.sd-sec')].find(s=>/Your procedure/.test(s.querySelector('h4')?.textContent||''));if(!sec)return;
 const b=D.el('button',{type:'button',class:'cx-draft primary',text:'Create this draft'});b.onclick=()=>RPH.cx.draftFor(id);
 sec.querySelector('p')?.after(b);};
new MutationObserver(()=>RPH.cx.sdHook()).observe($('editor'),{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
/* 3 + 6. Plain words */
RPH.words.RULES.push(
 [/\bGUIDED_DRAFT_NEEDS_SOURCE_REVIEW\b/g,'Draft · sources to check'],[/\bGUIDED_DRAFT_NEEDS_EDITORIAL_REVIEW\b/g,'Draft · wording to review'],
 [/\bNEEDS_SOURCE\b/g,'Needs a source'],[/\bNEEDS_RIGHTS\b/g,'Wording rights to check'],[/\bOUT_OF_SCOPE\b/g,'Not covered'],[/\bPROPOSED\b/g,'Proposed'],
 [/\bSaved pharmacy and proprietor details\b/g,'Pharmacy details saved'],[/\b1 people\b/g,'1 person']);
const cxFix=RPH.words.fix;
RPH.words.fix=function(node){cxFix(node);if(node.nodeType!==3)return;const el=node.parentElement;if(!el)return;
 const ed=el.closest('#editor');if(!ed)return;const title=ed.querySelector('#dialog-title')?.textContent||'';if(!/meeting|check-in/i.test(title))return;
 const t=node.nodeValue.trim();if(t==='Complete review'||t==='Finish review')node.nodeValue=node.nodeValue.replace(t,'Save meeting');else if(t==='Next meeting review')node.nodeValue=node.nodeValue.replace(t,'Schedule next meeting');};
/* 4. S8: no provisional deadline */
const cxS8=RPH.s8.formAssist;
RPH.s8.formAssist=function(){cxS8.apply(this,arguments);const ed=$('editor'),stock=ed?.querySelector('#stock-date'),next=ed?.querySelector('#next-date');if(!stock||!next||next.dataset.cx)return;next.dataset.cx='1';
 const note=ed.querySelector('#s8-next-note');const hold=()=>{if(stock.value||RPH.s8.approved())return;next.value='';if(note)note.textContent='Enter the stock-check date first. The next inventory date follows from it (every 3 months, Regulation s 111).';};
 /* Retest fix (R05): the next date follows the stock-check date while it's the app's own suggestion. If the owner types
    their own date, it's kept (still capped at 3 months by s 111). Clearing the stock-check date clears a suggested date. */
 const auto=()=>next.dataset.auto==='1'&&next.value===next.dataset.autoVal;
 next.addEventListener('input',e=>{if(e.isTrusted)next.dataset.auto='0';});
 const fill=()=>{if(RPH.s8.approved())return;
  if(!stock.value){if(!next.value||auto()){next.value='';next.dataset.auto='0';next.dispatchEvent(new Event('input',{bubbles:true}));}hold();return;}
  let lim=addInterval(stock.value,3,'months');if(lim<today())lim=addInterval(today(),RPH.s8.graceDays,'days');
  if(!next.value||auto()){next.value=lim;next.dataset.auto='1';next.dataset.autoVal=lim;next.dispatchEvent(new Event('input',{bubbles:true}));}
  if(note)note.textContent='Next inventory by '+pretty(lim)+' (3 months after the stock check, Regulation s 111).';};
 stock.addEventListener('input',fill);stock.addEventListener('change',fill);hold();};
/* 5. Adoption blocked while [Confirm] items remain */
const cxAdopt=RPH.sop.adopt;
RPH.sop.adopt=function(id){const d=procedureDocs().find(x=>x.id===id);const open=d?RPH.sop.text(d):[];if(!open.length)return cxAdopt.apply(this,arguments);
 const b=fsOpen('Not ready to adopt');b.append(RPH.el('p',{text:'This draft still has '+open.length+' item'+(open.length===1?'':'s')+' to confirm. Fill each one in the draft, then adopt it. Nothing is adopted while these remain.'}));
 const ul=RPH.el('ul');for(const x of open.slice(0,20))ul.append(RPH.el('li',{text:typeof x==='string'?x:(x.text||x.label||JSON.stringify(x))}));b.append(ul);
 fbtn(b,'Open the draft to fill these in',()=>policyDetail(id)).classList.add('primary');
 fbtn(b,'Close',()=>fsClose());};
/* Batch 2 (Codex R04): Today shows where an unfinished review is up to. */
const cxRows=CD.todayRows;
CD.todayRows=function(){return cxRows.apply(this,arguments).map(r=>{if(!r.id.startsWith('review/'))return r;const aid=r.id.slice(7);let d=null;try{d=readDraft(aid);}catch{}if(!d)return r;
 const meta=(()=>{try{return RPH.draftMeta(aid);}catch{return null;}})(),saved=meta?.lastAt?CD.short(String(meta.lastAt).slice(0,10)):'';
 let prog='';if(aid==='Q1'&&d.items){const n=RPH.sv?.items?.().length||0,done=Object.values(d.items).filter(x=>x&&x.status).length;if(n)prog=done+' of '+n+' checked';}
 return {...r,act:'Resume',type:r.type+' · in progress'+(prog?' · '+prog:'')+(saved?' · saved '+saved:'')};});};
/* Batch 3 (Codex R01–R03): actions lead with the finding; review results show their follow-up. Display only. */
CD.actionTitle=function(t){if(!t)return '';const f=t.findingId&&state.findingLedger?.[t.findingId];
 const fromReview=!!t.findingId||(t.sources||[]).some(x=>x&&x.type&&!/^(Staff|Service|Meeting|Manual|Setup)$/i.test(x.type));
 let s=(f&&f.text&&f.text.trim())||'';if(!s){const i=(t.text||'').lastIndexOf(' · ');s=i>0&&fromReview?t.text.slice(i+3).trim():'';}
 if(!s||s.length<4)return t.text||'';return s[0].toUpperCase()+s.slice(1);};
CD.resultFollow=function(r){const ids=new Set([...(r.actionIds||[]),...(r.actionId?[r.actionId]:[]),...(r.findingIds||[]).map(id=>state.findingLedger?.[id]?.taskId).filter(Boolean)]);if(!ids.size)return '';
 const ts=[...ids].map(id=>state.taskLedger?.[id]).filter(Boolean);const open=ts.filter(t=>t.status==='Outstanding').length;
 return open?' · '+open+' open action'+(open===1?'':'s'):ts.length?' · follow-up closed':'';};
const cxRows3=CD.todayRows;
CD.todayRows=function(){return cxRows3.apply(this,arguments).map(r=>{if(!r.id.startsWith('task/'))return r;const t=state.taskLedger?.[r.id.slice(5)];const title=CD.actionTitle(t);return title&&t&&title!==t.text?{...r,item:title}:r;});};
const cxCal=CD.calRows;
CD.calRows=()=>cxCal().map(r=>r.taskType?{...r,label:'Action · '+CD.actionTitle(state.taskLedger?.[r.id.slice(5)])}:r);
/* Batch 3: History says what happened (phones hide the Type column, so identical titles were indistinguishable). */
CD.histVerb=function(r){const rec=r.record||{},t=r.type||'';
 if(t==='Reminder change')return 'Due date changed';if(t==='Configuration')return 'Setup saved';if(t==='Task')return 'Action raised';
 if(t==='Task update'){const m=String(rec.message||rec.event||rec.note||'');return rec.status==='Completed'||/clos|complet/i.test(m)?'Action closed':/reopen/i.test(m)?'Action reopened':/due/i.test(m)?'Action due date changed':'Action updated';}
 if(t==='Review')return 'Review completed'+(CD.resultFollow?CD.resultFollow(rec):'');if(t==='Document')return 'Procedure saved';if(t==='Meeting')return 'Meeting saved';if(t==='Credential')return 'Credential recorded';return t;};
/* Batch 5 (Codex R08): offer the buyer guide on the first setup screen; mark inherited answers. */
const cxSite=fsSite;
fsSite=function(){cxSite.apply(this,arguments);const b=$('editor')?.querySelector('.fresh-form');if(!b||b.querySelector('.cx-bought'))return;
 const p=D.el('p',{class:'sd-note cx-bought'});p.append('Just bought this pharmacy? ');const a=D.el('button',{type:'button',class:'rph-link',text:'See what to do first'});a.onclick=()=>RPH.nsw.ownScreen(true);p.append(a);b.append(p);};
const cxOwn=RPH.nsw.ownScreen;
RPH.nsw.ownScreen=function(fromSetup){cxOwn.apply(this,arguments);const b=$('editor')?.querySelector('.fresh-form');if(!b)return;
 const box=D.el('div',{class:'sd-sec'});box.append(D.el('p',{class:'sd-note',text:state.inherited?'Marked as just bought: anything you put off in setup shows as “Inherited · check later”.':'Just bought it? Tap below and anything you put off in setup will show as “Inherited · check later”, so it’s clear you haven’t checked it yourself yet.'}));
 if(!state.inherited){const m=D.el('button',{type:'button',text:'I’ve just bought this pharmacy'});m.onclick=()=>{if(fsChange('Marked as a newly bought pharmacy',n=>{n.inherited=true;}))RPH.nsw.ownScreen(fromSetup);};box.append(m);}
 b.prepend(box);
 if(fromSetup){const back=fbtn(b,'Back to setup',()=>fsSite());back.classList.add('primary');}};
RPH.words.RULES.push([/^Check later$/,()=>state.inherited?'Inherited · check later':'Check later']);
/* Batch 3 (Codex decision, owner-approved): a site visit shows this pharmacy's still-open follow-ups from earlier
   visits on the same check. The owner can open the action to record that they saw the fix and close it there
   (the existing close form, which needs a resolution). Nothing is closed automatically. */
RPH.cx.openFor=key=>Object.values(state.findingLedger||{}).filter(f=>f&&f.itemKey==='Q1/'+key&&f.taskId&&state.taskLedger?.[f.taskId]?.status==='Outstanding');
RPH.cx.svOpen=function(){const root=$('editor')?.querySelector('#sv-root');if(!root)return;
 for(const it of root.querySelectorAll('.sv-item')){if(it.querySelector('.cx-open'))continue;const key=it.dataset.key;if(!key)continue;const fs=RPH.cx.openFor(key);if(!fs.length)continue;
  const box=D.el('div',{class:'cx-open rph-callout'});box.append(D.el('b',{text:'Still open from an earlier visit'}));
  for(const f of fs){const t=state.taskLedger[f.taskId];const row=D.el('div',{class:'cx-open-row'});row.append(D.el('span',{text:(f.text||f.itemLabel)+(t.due?' · due '+pretty(t.due):'')}));
   const btn=D.el('button',{type:'button',class:'rph-link',text:'Seen the fix? Close it'});btn.onclick=()=>taskEditor(t.id);row.append(btn);box.append(row);}
  (it.querySelector('.sv-item-top')||it.firstChild)?.after(box);}};
new MutationObserver(()=>RPH.cx.svOpen()).observe($('editor'),{childList:true,subtree:true});
/* Batch 7 (Codex R10): which source drives what. Lists each source the app relies on, when it was last read,
   and the procedures and reviews that cite it. "This source changed" raises ONE action listing what to re-check;
   nothing is edited automatically and earlier approved versions stay as they are. */
RPH.cx.SOURCES=[
 ['reg','Medicines, Poisons and Therapeutic Goods Regulation 2026 (NSW)','20 Nov 2026',/Regulation 2026|Regulation s \d|\(s \d+|\bs 1\d\d\b/,'https://legislation.nsw.gov.au/view/html/inforce/current/sl-2026-0330'],
 ['mss','NSW Medicine Storage Standards','20 Nov 2026',/Storage Standards/,'https://www.health.nsw.gov.au/pharmaceutical/Pages/medicine-storage-standards.aspx'],
 ['edr','NSW Electronic Drug Register Standards','20 Nov 2026',/Electronic Drug Register/,'https://www.health.nsw.gov.au/pharmaceutical/Pages/electronic-register-standards.aspx'],
 ['otp','NSW OTP Standards and OTP registration','20 Nov 2026',/OTP Standards|OTP registration/,'https://www.health.nsw.gov.au/pharmaceutical/Pages/otp-standards.aspx'],
 ['vacc','NSW Pharmacist Vaccination Standards and authorities','20 Nov 2026',/Vaccination Standards|Immuniser|immuniser/,'https://www.health.nsw.gov.au/immunisation/professionals/pharmacist-immunisers/Pages/default.aspx'],
 ['s45','Strive for 5 (national vaccine storage guidelines)','22 Nov 2026 (via Codex)',/Strive for 5/,'https://www.health.gov.au/resources/publications/national-vaccine-storage-guidelines-strive-for-5'],
 ['ca','NSW pharmacist prescribing Class Authorities','20 Nov 2026',/Class Authorit|prescribing authorit/i,'https://www.health.nsw.gov.au/pharmaceutical/Pages/expanded-scope-pharmacists-information.aspx'],
 ['vape','NSW Health vaping requirements and self-assessment','20 Nov 2026',/vaping|vapes/i,'https://www.health.nsw.gov.au/pharmaceutical/Pages/nicotine-vaping.aspx'],
 ['cann','NSW Health Cannabis medicines','20 Nov 2026',/Cannabis medicines/,'https://www.health.nsw.gov.au/pharmaceutical/Pages/cannabis-medicines.aspx'],
 ['council','Pharmacy Council of NSW (premises, ownership, proprietor oversight)','21 Nov 2026',/Pharmacy Council|Council Guide/,'https://www.hpca.nsw.gov.au/councils/pharmacy'],
 ['pba','Pharmacy Board of Australia guidelines','21 Nov 2026',/Pharmacy Board/,'https://www.pharmacyboard.gov.au/Codes-Guidelines'],
 ['ppa','PPA Program Rules (DAA, Staged Supply, HMR, RMMR, MedsCheck)','20 Nov 2026',/PPA|Program Rules/,'https://www.ppaonline.com.au/'],
 ['tga','TGA (vapes, recalls, advertising)','22 Nov 2026 (via Codex)',/\bTGA\b/,'https://www.tga.gov.au/'],
 ['privacy','Privacy Act 1988 and NSW HRIP Act','22 Nov 2026 (via Codex)',/Privacy Act|HRIP/,'https://www.oaic.gov.au/privacy/notifiable-data-breaches'],
 ['nsp','NSW Needle and Syringe Program guideline GL2023_002','21 Nov 2026',/GL2023_002|Needle and Syringe/,'https://www1.health.nsw.gov.au/pds/Pages/doc.aspx?dn=GL2023_002'],
 ['fw','Fair Work Act 2009 and Pharmacy Industry Award','22 Nov 2026 (via Codex)',/Fair Work/,'https://www.fairwork.gov.au/']];
RPH.cx.usedBy=function(){const out={};for(const [k] of RPH.cx.SOURCES)out[k]=[];
 for(const id of state.active){let t='';try{t=sopDocument(id)||'';}catch{}for(const [k,,,re] of RPH.cx.SOURCES)if(re.test(t))out[k].push(serviceName(id)+' procedure');}
 for(const a of catalog().filter(x=>isActive(x))){let q='';try{q=reviewQuestions(a).join(' ');}catch{}for(const [k,,,re] of RPH.cx.SOURCES)if(re.test(q))out[k].push(a.name+' (review)');}
 for(const o of (RPH.insp?.OBL||[]).filter(o=>RPH.insp.applies(o)))for(const [k,,,re] of RPH.cx.SOURCES)if(re.test(o[1]+' '+o[2]+' '+o[3]))out[k].push('Legal obligations · '+o[2]);
 for(const k in out)out[k]=[...new Set(out[k])];return out;};
RPH.cx.sourcesScreen=function(){const b=fsOpen('Sources');b.classList.add('insp');const used=RPH.cx.usedBy();
 peLine(b,'Every rule in the app comes from one of these. If one changes, tap “This source changed”: you get one action listing exactly what to look at again. Nothing is changed for you, and earlier approved procedures keep their versions.');
 const ul=D.el('ul',{class:'insp-list'});for(const [k,title,checked,,url] of RPH.cx.SOURCES){const u=used[k]||[];if(!u.length)continue;const li=D.el('li');
  li.append(D.el('b',{text:title}),D.el('p',{class:'insp-who',text:'Last read '+checked+' · used in '+u.length+' place'+(u.length===1?'':'s')}));
  const d=D.el('details');d.append(D.el('summary',{text:'Where it’s used'}));const l2=D.el('ul');for(const x of u)l2.append(D.el('li',{text:x}));d.append(l2);li.append(d);
  const a=D.el('a',{href:url,target:'_blank',rel:'noopener',text:'Open source'});const btn=D.el('button',{type:'button',class:'rph-link',text:'This source changed'});
  btn.onclick=()=>{if(fsChange('Source changed · '+title,n=>{n.taskLedger??={};taskNew(n,'src-'+k+'-'+Date.now(),{text:'Re-check after a change to '+title+': '+u.join('; '),owner:RPH.actor(n).name,due:addInterval(today(),30,'days')},null);})){btn.disabled=true;btn.textContent='Action raised · see Actions';}};
  const row=D.el('div',{class:'cx-open-row'});row.append(a,btn);li.append(row);ul.append(li);}
 b.append(ul);fbtn(b,'Close',()=>fsClose()).classList.add('quiet');};
const cxSite2=siteSetup;
siteSetup=function(){cxSite2.apply(this,arguments);const list=$('main')?.querySelector('.rph-menu');if(!list||list.querySelector('[data-insp=sources]'))return;
 const x=RPH.el('button',{type:'button',class:'rph-menu-row'},RPH.el('strong',{text:'Sources'}),RPH.el('small',{text:'Where each rule comes from, and what to re-check if one changes'}));x.dataset.insp='sources';x.onclick=()=>RPH.cx.sourcesScreen();list.append(x);};
CD.SETUP_GROUPS[1][1].push('Sources');
/* Batch 1 (Codex R06/R07): coming back to Today restores where you were (filter is already kept; scroll too). */
RPH.cx.todayScroll=0;
const cxGo=CD.go;CD.go=function(p){if(page==='overview')RPH.cx.todayScroll=window.scrollY;const r=cxGo.apply(this,arguments);if(p==='overview'&&RPH.cx.todayScroll)setTimeout(()=>window.scrollTo(0,RPH.cx.todayScroll),0);return r;};
/* Batch 4 (Codex R05): a review's date is when the work was done; "recorded" is when it was entered. Show both in
   History when they differ, so a late entry is never mistaken for the date the work happened. */
const cxVerb=CD.histVerb;
CD.histVerb=function(r){const v=cxVerb(r);const rec=r.record||{};return r.type==='Review'&&rec.at&&rec.date&&rec.at.slice(0,10)!==rec.date?v+' · done '+CD.short(rec.date)+', recorded '+CD.short(rec.at.slice(0,10)):v;};
/* Export accuracy (Codex Batch 0). The History CSV and printed report showed a site-visit "Needs verification" (and
   "Not reviewed this visit") answer as "Rating unconfirmed". The answer is now written exactly as recorded. The
   downloaded review detail also uses the same plain words as the screen (Action, Review). Nothing else changes. */
RPH.cx.KNOWN_ANS=['Checked','Issue','N/A','Needs verification','Not reviewed this visit'];
RPH.cx.fixPremises=(cell,at)=>{const r=state.reviews.find(x=>x.audit==='Q1'&&x.at===at);if(!r)return cell;
 return cell.replace(/Section (\d+): Rating unconfirmed/g,(m,i)=>{const a=(r.answers||[])[i-1]?.answer;return RPH.cx.KNOWN_ANS.includes(a)?'Section '+i+': '+a:m;});};
RPH.cx.plainWords=t=>{let o=String(t);for(const [re,to] of RPH.words?.RULES||[])o=o.replace(re,to);return o;};
const cxDownload=download;
download=function(name,text,type){
 try{if(/^history-.*\.csv$/.test(name))text=String(text).replace(/^("[^"]*","[^"]*","Review","([^"]+)",.*")(Section 1:[^"]*)"/gm,(m,head,at,cell)=>head+RPH.cx.fixPremises(cell,at)+'"');
  else if(/^review-.*\.txt$/.test(name))text=RPH.cx.plainWords(text);}catch{}
 return cxDownload.call(this,name,text,type);};
RPH.cx.realPrint=window.print.bind(window);
window.print=function(){try{for(const tr of document.querySelectorAll('#history-report tbody tr')){const c=tr.children;const last=c[c.length-1];if(c[2]?.textContent==='Review'&&/Rating unconfirmed/.test(last?.textContent||''))last.textContent=RPH.cx.fixPremises(last.textContent,c[3].textContent);}}catch{}return RPH.cx.realPrint();};
