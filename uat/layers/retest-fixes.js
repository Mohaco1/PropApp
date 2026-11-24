/* ===== Fixes from Codex's v27 retest (24 Nov 2026) =====
 * R03 exports: the History CSV and print are corrected cell by cell from each original review record (proper CSV
 *     parsing, so quotes in a pharmacy name don't matter). Two visits saved at the same moment are told apart by
 *     their answers; if that's impossible the original text is left as it was rather than guessed.
 *     The review-detail download only changes the app's own labels, never words the owner typed.
 * R06 a staff credential linked to an action keeps its expiry on Today (expired = overdue), as well as the action.
 * R01–R03 review results count actions linked by taskLinks too; History verbs come from the actual status change.
 * R04 "In progress" includes every saved review draft, including far-future and event-only reviews.
 */
RPH.rtf={};
/* ---------- R03 exports ---------- */
RPH.rtf.KNOWN=['Checked','Issue','N/A','Needs verification','Not reviewed this visit'];
RPH.rtf.premises=function(r,fixed){const sections=(()=>{try{return q1InspectionAreas();}catch{return [];}})();
 return (r.answers||[]).map((a,i)=>{const ok=fixed?RPH.rtf.KNOWN:['Checked','Issue','N/A'];const rating=ok.includes(a.answer)?a.answer:'Rating unconfirmed';
  const areas=Array.isArray(a.areas)?sections[i]?.filter(area=>a.areas.includes(area)):[];
  return 'Section '+(i+1)+': '+rating+(areas?.length?' ('+areas.join('; ')+')':'');}).join(' | ')+((()=>{try{return suspectQ1(r)?(q1Reviewed(r)?' · Correction recorded':' · Proprietor review required'):'';}catch{return '';}})());};
/* Given the cell the app wrote and the row's saved time, return the corrected cell (or the original if unsure). */
RPH.rtf.fixCell=function(cell,at){
 const cands=(state.reviews||[]).filter(r=>r.audit==='Q1'&&r.at===at&&RPH.rtf.premises(r,false)===cell);
 const outs=[...new Set(cands.map(r=>RPH.rtf.premises(r,true)))];
 return outs.length===1?outs[0]:cell;};
RPH.rtf.parseCSV=function(text){const rows=[];let row=[],f='',q=false;
 for(let i=0;i<text.length;i++){const c=text[i];
  if(q){if(c==='"'){if(text[i+1]==='"'){f+='"';i++;}else q=false;}else f+=c;}
  else if(c==='"')q=true;else if(c===','){row.push(f);f='';}else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(f);rows.push(row);row=[];f='';}else f+=c;}
 if(f!==''||row.length){row.push(f);rows.push(row);}return rows;};
RPH.rtf.csv=function(text){const rows=RPH.rtf.parseCSV(String(text));if(!rows.length)return text;const head=rows[0];
 const iType=head.indexOf('Event'),iAt=head.indexOf('Saved timestamp'),iP=head.indexOf('Premises review ratings and areas');if(iType<0||iAt<0||iP<0)return text;
 let changed=false;for(const r of rows.slice(1)){if(r[iType]==='Review'&&/Rating unconfirmed/.test(r[iP]||'')){const v=RPH.rtf.fixCell(r[iP],r[iAt]);if(v!==r[iP]){r[iP]=v;changed=true;}}}
 if(!changed)return text;
 // Re-quote exactly as the app does: every field quoted, quotes doubled. Values are already formula-safe from the app.
 return rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');};
/* Replace the earlier, regex-based export patch (codex-fixes) with the record-based one. */
RPH.cx.fixPremises=(cell,at)=>RPH.rtf.fixCell(cell,at);
const rfDownload=download;
download=function(name,text,type){
 try{if(/^history-.*\.csv$/.test(name))text=RPH.rtf.csv(text);}catch(e){console.warn(e);}
 return rfDownload.call(this,name,text,type);};
/* Review detail: only the app's own generated labels are reworded; owner-entered text stays exactly as typed. */
RPH.cx.plainWords=t=>String(t).replace(/\bCorrective Task created\b/g,'Action raised').replace(/· Task “/g,'· Action “');
/* ---------- R06 credential expiry stays visible when linked to an action ---------- */
const rfRows=CD.todayRows;
CD.todayRows=function(){const rows=rfRows.apply(this,arguments);
 let team=[];try{team=activeTeam();}catch{}
 for(const r of rows){if(!String(r.id).startsWith('task/'))continue;const t=state.taskLedger?.[String(r.id).slice(5)];if(!t)continue;
  const s=(t.sources||[]).find(x=>x.type==='Staff');if(!s)continue;const p=team.find(x=>x.id===s.id);if(!p)continue;
  let it=null;try{it=staffItems(p).find(i=>i.id===s.issue);}catch{}if(!it||!it.expiry)continue;
  r.expiry=it.expiry;r.type=(r.type?r.type+' · ':'')+(it.expired||it.expiry<today()?'credential expired ':'credential expires ')+pretty(it.expiry)+(t.due?' · action due '+pretty(t.due):'');
  if(!r.date||it.expiry<r.date){r.date=it.expiry;r.due=CD.dueText(it.expiry);}
  if(it.expired||it.expiry<today())r.k='overdue';}
 return rows;};
/* ---------- R04 In progress: every saved review draft ---------- */
const rfRows2=CD.todayRows;
CD.todayRows=function(){const rows=rfRows2.apply(this,arguments);
 let cat=[];try{cat=catalog();}catch{}const pre=(()=>{try{return draftKey('');}catch{return null;}})();if(!pre)return rows;
 const have=new Set(rows.filter(r=>/Resume/i.test(r.act||'')).map(r=>String(r.id)));
 for(const k of Object.keys(localStorage)){if(!k.startsWith(pre))continue;const id=k.slice(pre.length);if(/\/conflict-|^meta|draftmeta/.test(id))continue;
  const ev=id.startsWith('event-audit/'),cid=ev?id.slice(12):id,a=cat.find(x=>x.id===cid);if(!a)continue;
  if(have.has('draft/'+id)||(!ev&&have.has('review/'+cid)))continue;
  if(!ev&&rows.some(r=>r.id==='review/'+cid&&/Resume/i.test(r.act||'')))continue;
  let d=null;try{d=JSON.parse(localStorage.getItem(k));}catch{}if(!d)continue;
  rows.push({id:'draft/'+id,k:'soon',item:(ev?'Extra ':'')+a.name,type:'Review in progress'+(d.date?' · visit date '+pretty(d.date):''),due:'In progress',date:'',owner:'You',act:'Resume',open:()=>reviewEditor(cid,ev),why:'You started this and saved a draft. Pick up where you left off.'});}
 return rows;};
/* ---------- R01–R03 follow-up counts and History verbs ---------- */
CD.resultFollow=function(r){const ids=new Set([...(r.actionIds||[]),...(r.actionId?[r.actionId]:[]),...(r.taskLinks||[]),...(r.findingIds||[]).map(id=>state.findingLedger?.[id]?.taskId).filter(Boolean)]);if(!ids.size)return '';
 const ts=[...ids].map(id=>state.taskLedger?.[id]).filter(Boolean);const open=ts.filter(t=>t.status==='Outstanding').length;
 return open?' · '+open+' open action'+(open===1?'':'s'):ts.length?' · follow-up closed':'';};
RPH.rtf.statusVerb=m=>{const x=String(m||'').match(/Status changed from (\w+) to (\w+)/);if(!x)return '';return x[2]==='Completed'?'Action closed':x[1]==='Completed'&&x[2]==='Outstanding'?'Action reopened':'Action updated';};
const rfVerb=CD.histVerb;
CD.histVerb=function(r){const t=r.type||'',rec=r.record||{},m=String(rec.message||rec.event||'');
 if(t==='Task completed')return 'Action closed';
 if(t==='Task update'){const v=RPH.rtf.statusVerb(m);if(v)return v;if(/^Due date changed|due date/i.test(m))return 'Action due date changed';return 'Action updated';}
 return rfVerb.apply(this,arguments);};
/* Full history timeline (waiting.js): closed/reopened come from the status change too. */
if(RPH.wait){const rfEv=RPH.wait.events;RPH.wait.events=function(id){return rfEv.apply(this,arguments).map(e=>{const v=RPH.rtf.statusVerb(e.text);return v==='Action closed'?{...e,kind:'Closed'}:v==='Action reopened'?{...e,kind:'Reopened'}:e;});};}
/* ---------- Owner, 24 Nov: procedures speak to the pharmacist on duty ----------
   Saved setup answers like "Who receives delivery incidents?" keep their validated value ("Pharmacist in charge"),
   so backups still restore. Only the drafted procedure wording changes: "the pharmacist in charge" → "the
   pharmacist on duty", because the pharmacist in charge is rostered day to day. Legal citations (e.g. "(s 122") are
   left exactly as written. Approved versions already saved keep their own text. */
RPH.rtf.onDuty=s=>typeof s!=='string'?s:s.replace(/\b([Pp])harmacist in charge\b(?!\s*\(s\s?\d|,?\s*s\s?\d)/g,(m,p)=>p+'harmacist on duty');
RPH.rtf.deep=v=>typeof v==='string'?RPH.rtf.onDuty(v):Array.isArray(v)?v.map(RPH.rtf.deep):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,RPH.rtf.deep(x)])):v;
if(RPH.sop&&RPH.sop.templates)for(const k of Object.keys(RPH.sop.templates)){const f=RPH.sop.templates[k];if(typeof f!=='function'||f.__onDuty)continue;const w=function(){return RPH.rtf.deep(f.apply(this,arguments));};w.__onDuty=true;RPH.sop.templates[k]=w;}
