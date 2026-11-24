/* ===== Batch 0 · protect evidence (Codex audit, 22 Nov 2026) =====
 * Draft guard. Every draft write in the app goes through setDraft. Codex reproduced (on an archived build) an
 * older, untouched copy of a site visit overwriting newer notes when it was closed. The site visit, like other
 * forms, saves its in-memory copy on Close/Escape. Rules now:
 *  1. Writing exactly what this window last read or wrote = no change → nothing is written.
 *  2. If the stored draft changed since this window last read or wrote it (another tab, another device sync, or
 *     a restore), this window's copy is NOT written over it. It is kept separately as "<id>/conflict-<time>" and
 *     the owner is told. The newer stored version stays.
 *  3. Deleting a draft (on completion or discard) is always allowed.
 * Tabs share writes through the existing BroadcastChannel, so "stored" reflects other windows.
 */
RPH.ig={known:new Map(),conflict:new Map()};
RPH.ig.raw=id=>{try{return localStorage.getItem(draftKey(id));}catch{return null;}};
const igRead=readDraft;
RPH.ig.openedAt=0;
readDraft=function(id){const v=igRead.apply(this,arguments);try{
 const ed=$('editor'),init=!ed?.open||Date.now()-RPH.ig.openedAt<1500;
 if(!RPH.ig.conflict.has(id)&&(init||!RPH.ig.known.has(id)))RPH.ig.known.set(id,RPH.ig.raw(id));}catch{}return v;};
/* A form session = the editor window being open. Reads made while a form is open (e.g. Today re-rendering) don't
   reset what that form loaded; closing the window ends the session. */
/* Retest fix (R04): a form's save-on-close runs after the window closes, so the session is ended one tick later.
   A session also tracks whether the owner actually changed anything (a real tap or keystroke in the window). */
RPH.ig.touched=false;
new MutationObserver(()=>{const ed=$('editor');if(ed.open){if(!RPH.ig.openedAt){RPH.ig.openedAt=Date.now();RPH.ig.touched=false;}}else setTimeout(()=>{if($('editor').open)return;RPH.ig.openedAt=0;RPH.ig.touched=false;RPH.ig.known.clear();RPH.ig.conflict.clear();},0);}).observe($('editor'),{attributes:true,attributeFilter:['open']});
for(const ev of ['input','change','keydown','pointerdown'])document.addEventListener(ev,e=>{if(e.isTrusted&&e.target?.closest?.('#editor')&&!e.target.closest('#close,.close,.cd-audit-top button'))RPH.ig.touched=true;},true);
const igSet=setDraft;
setDraft=function(id,v){
 if(v===null){RPH.ig.known.delete(id);RPH.ig.conflict.delete(id);return igSet.apply(this,arguments);}
 let next;try{next=JSON.stringify(v);}catch{return igSet.apply(this,arguments);}
 const cur=RPH.ig.raw(id),known=RPH.ig.known.get(id);
 // Already split off after a conflict: keep updating this window's separate copy only.
 if(RPH.ig.conflict.has(id)){const cid=RPH.ig.conflict.get(id);return igSet.call(this,cid,v&&typeof v==='object'&&!Array.isArray(v)?v:{copy:v});}
 if(known!==undefined&&next===known)return true;                 // rule 1: unchanged → no write
 // Retest fix (R04): opened and closed without any change by the owner, and nothing changed elsewhere → leave the
 // stored draft exactly as it was (an older-format draft keeps its date, note and extra fields until really edited).
 if(RPH.ig.openedAt&&!RPH.ig.touched&&known!==undefined&&cur===known)return true;
 // When the owner does edit an older-format draft, fields the new format doesn't use are kept alongside.
 try{const old=cur&&JSON.parse(cur);if(old&&v&&typeof old==='object'&&typeof v==='object'&&!Array.isArray(v)&&!Array.isArray(old)&&old.v!==v.v){const keep={};for(const k of Object.keys(old))if(!(k in v))keep[k]=old[k];if(Object.keys(keep).length){v={...v,legacy:{...(v.legacy||{}),...keep}};next=JSON.stringify(v);arguments[1]=v;}}}catch{}
 if(known!==undefined&&cur!==known&&cur!==null&&cur!==next){       // rule 2: changed elsewhere
  const cid=id+'/conflict-'+Date.now();RPH.ig.conflict.set(id,cid);
  igSet.call(this,cid,v&&typeof v==='object'&&!Array.isArray(v)?v:{copy:v});
  try{notify('This draft was changed in another window. The newer version is kept; your changes here were saved separately as a copy.','warning');}catch{}
  return false;}
 const ok=igSet.apply(this,arguments);if(ok)RPH.ig.known.set(id,next);return ok;};
/* A window that re-opens a form starts fresh (it reads again), so it can save normally. */
RPH.ig.reset=id=>{RPH.ig.conflict.delete(id);RPH.ig.known.delete(id);};
/* Backup restore (Codex): a thrown restore followed by a retry recorded two "Restored from backup" entries,
   because the selected backup object was changed on each attempt. The selected backup is now copied before
   applying, only one restore entry is kept, and a finding that points at a missing action is rejected. */
const igRestore=restoreBackup;
restoreBackup=function(input,expected){
 let staged;try{staged=JSON.parse(JSON.stringify(input));}catch{return igRestore.apply(this,arguments);}
 const h=staged?.data?.history;
 // Retest fix: only a retry duplicate is dropped (same message and person within a minute); genuine restores on
 // different dates or by different people all stay.
 if(Array.isArray(h)){for(let i=h.length-1;i>0;i--){const a=h[i],b=h[i-1];if(/^Restored from backup/.test(a?.message||'')&&a.message===b?.message&&(a.by||'')===(b.by||'')&&Math.abs(Date.parse(a.at)-Date.parse(b.at))<60000)h.splice(i,1);}}
 const d=staged?.data||staged;const tasks=new Set([...Object.keys(d?.taskLedger||{}),...(d?.auditActions||[]).map(a=>a.id)]);
 for(const f of Object.values(d?.findingLedger||{}))if(f&&f.taskId&&!tasks.has(f.taskId))throw new Error('This backup has a finding linked to an action that isn’t in the file ('+f.taskId+'). Nothing was restored.');
 return igRestore.call(this,staged,expected);};
