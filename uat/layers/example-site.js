/* ===== UAT only: open the example pharmacy (Wattle Grove Pharmacy, fictional) =====
 * RPH_EXAMPLE (added by build-uat.js from demo/wattle-grove.json) is a backup made by running the real app through a
 * year with the clock moved forward. demo/build-demo.js makes it; every record came from the app's own screens.
 * Opening it adds a separate pharmacy to this browser's pharmacy list. The pharmacy you were in is not changed.
 * Dates move forward so that the day the example was made becomes today. Free text keeps its words, and any
 * yyyy-mm-dd date written in it moves as well.
 * If the example is already on this device, the button just switches to it.
 */
RPH.example={};
RPH.example.NAME='Wattle Grove Pharmacy';
RPH.example.shiftText=function(text,days){return text.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g,(m,y,mo,d)=>{const t=Date.UTC(+y,+mo-1,+d);if(isNaN(t))return m;return new Date(t+days*864e5).toISOString().slice(0,10);});};
RPH.example.prepared=function(){const E=window.RPH_EXAMPLE;if(!E)return null;
 const days=Math.round((Date.parse(today()+'T00:00:00Z')-Date.parse(E.generated+'T00:00:00Z'))/864e5);
 return {days,backup:JSON.parse(RPH.example.shiftText(JSON.stringify(E.backup),days))};};
RPH.example.entry=function(){try{const dir=readSites();const id=window.RPH_EXAMPLE?.backup?.data?.taskPharmacyId;const e=dir&&dir.sites.find(s=>s.id===id);return e&&localStorage.getItem(e.slot)?e:null;}catch{return null;}};
RPH.example.open=async function(){
 try{
  const P=RPH.example.prepared();if(!P)throw Error('The example pharmacy is not in this build.');
  if(storageIssue||currentSlot()!==key)throw Error('Reopen the current pharmacy before switching.');
  const data=P.backup.data,id=data.taskPharmacyId;
  let dir=readSites();
  if(!dir){dir={version:1,active:null,sites:[]};if(state.onboarded)dir.sites.push({id:state.taskPharmacyId,slot:key});}
  const have=dir.sites.find(s=>s.id===id);
  if(have&&localStorage.getItem(have.slot)){if(dir.active===id){notify('You are already in the example pharmacy.');return;}dir.active=id;localStorage.setItem('r-pharmacy-sites-v1',JSON.stringify(dir));rphReload();return;}
  validateBackup(JSON.parse(JSON.stringify(P.backup)));
  const slot='r-pharmacy-site-'+crypto.randomUUID();
  localStorage.setItem(slot,JSON.stringify(data));
  for(const [k,v] of Object.entries(P.backup.drafts||{}))if(!['fresh-resume','setup-evidence'].includes(k))localStorage.setItem(slot+'-draft-'+k,JSON.stringify(v));
  try{localStorage.setItem('rph-setup-ready-seen:'+id,'1');}catch{}
  if(have)have.slot=slot;else dir.sites.push({id,slot});
  dir.active=id;localStorage.setItem('r-pharmacy-sites-v1',JSON.stringify(dir));
  rphReload();
 }catch(e){console.warn(e);notify('The example pharmacy could not be opened: '+e.message);}
};
RPH.example.back=function(){try{const dir=readSites();const id=window.RPH_EXAMPLE?.backup?.data?.taskPharmacyId;const other=dir&&dir.sites.find(s=>s.id!==id);if(!other){notify('There is no other pharmacy on this device yet.');return;}chooseSite(other.id);}catch(e){notify(e.message);}};
/* A short block in the UAT notes window, above "Start fresh on this device". */
if(typeof UAT!=='undefined'&&UAT.open){const exOpen=UAT.open;UAT.open=function(){const r=exOpen.apply(this,arguments);try{const dl=document.getElementById('uat-dlg');const reset=dl&&dl.querySelector('.uat-reset');if(reset&&!dl.querySelector('.uat-example')&&window.RPH_EXAMPLE){
 const inEx=state.taskPharmacyId===RPH_EXAMPLE.backup.data.taskPharmacyId,box=document.createElement('div');box.className='uat-reset uat-example';
 const h=document.createElement('b');h.textContent='Example pharmacy';const p=document.createElement('p');
 p.textContent=inEx?'You are in Wattle Grove Pharmacy (fictional), about a year of made-up records. Your own pharmacy is unchanged.':'Wattle Grove Pharmacy (fictional) has about a year of made-up records, with dates set around today. It opens as a separate pharmacy. Your own pharmacy and these notes are not changed.';
 const b=document.createElement('button');b.type='button';b.className='uat-example-btn';
 b.textContent=inEx?'Back to my pharmacy':RPH.example.entry()?'Open the example pharmacy again':'Open the example pharmacy';
 b.onclick=()=>{dl.close();inEx?RPH.example.back():RPH.example.open();};
 box.append(h,p,b);reset.before(box);}}catch(e){console.warn(e);}return r;};}
