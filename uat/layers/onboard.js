/* ===== Onboarding: a map before setup, a progress bar during it, a checklist on Today (owner approved mock-up, 24 Nov 2026) =====
 * From the Mobbin / UserOnboard review (Shopify's "N steps away" checklist; "tell me the minimum to get going").
 *  1. The first screen lists the app's 4 setup steps: Pharmacy details, Owners, Choose your services ("Needed to start")
 *     and Set up each service ("Can wait"). Today works after the first three.
 *  2. The step counter the app already shows on steps 3 and 4 now also shows on steps 1 and 2, with "needed to start" /
 *     "can wait". Only during first-time setup, never when the same screens are opened later to edit.
 *  3. Today shows "Finish setting up · N left" as a checklist (done steps ticked, the next one with Start), and once
 *     everything is done a one-time "<pharmacy> is set up" message.
 * Nothing about the questions, answers or what's saved changes.
 */
RPH.ob={};
const obEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
RPH.ob.inSetup=()=>{try{return !state.freshSite||!state.freshProprietors||!state.freshSelection||fsPending().length>0;}catch{return false;}};
/* The steps, in order, with whether each is done. */
RPH.ob.steps=function(){
 const pending=(()=>{try{return fsPending();}catch{return [];}})();
 const out=[{key:'details',label:'Pharmacy details',done:!!state.freshSite,need:true},{key:'owners',label:'Owners',done:!!state.freshProprietors,need:true},
  {key:'services',label:'Choose your services',done:!!state.freshSelection,need:true}];
 if(state.freshSelection)for(const id of state.active)out.push({key:'svc:'+id,id,label:serviceName(id),done:!pending.includes(id),need:false});
 return out;};
RPH.ob.nextKey=function(){const st=RPH.ob.steps();const pending=st.filter(s=>!s.done);if(!pending.length)return null;
 if(pending[0].need)return pending[0].key;
 let last=null;try{last=readDraft('fresh-resume')?.id;}catch{}const r=pending.find(s=>s.id===last);return (r||pending[0]).key;};
/* ---------- 1. the first screen ---------- */
const obLanding=fsLanding;
fsLanding=function(){obLanding.apply(this,arguments);try{
 const box=$('main').querySelector('.land3');if(!box)return;const d=[...box.children].find(x=>/How long setup takes/.test(x.textContent));if(!d)return;
 const nd=document.createElement('div');nd.className='ob-map';
 nd.innerHTML='<b>Setup: 4 short steps, about 15–20 minutes</b><p>Only the first 3 are needed to start. The rest can wait, and Today works in the meantime. Anything you’re unsure of can be marked “Check later”, and you can stop and carry on later.</p>'+
  '<ol class="ob-steps"><li><span class="ob-n">1</span><span class="ob-t">Pharmacy details</span><span class="ob-pill ob-need">Needed to start</span></li><li><span class="ob-n">2</span><span class="ob-t">Owners</span><span class="ob-pill ob-need">Needed to start</span></li><li><span class="ob-n">3</span><span class="ob-t">Choose your services</span><span class="ob-pill ob-need">Needed to start</span></li><li><span class="ob-n">4</span><span class="ob-t">Set up each service you chose, a few minutes each</span><span class="ob-pill ob-wait">Can wait</span></li></ol>';
 d.replaceWith(nd);}catch(e){console.warn(e);}};
/* ---------- 2. step counter on the first two setup screens ----------
   The app already shows "Step 3 of 4" on Services provided and "Step 4 of 4 · Service 1 of 2" on each service.
   The same counter now appears on Pharmacy details (1 of 4) and owners (2 of 4), with "needed to start". */
RPH.ob.stepFor=title=>{if(!RPH.ob.inSetup())return 0;if(title==='Pharmacy details')return 1;if(['Proprietors','Who is recording?','Proprietors & oversight'].includes(title)&&!state.freshProprietors)return 2;return 0;};
const obOpen=fsOpen;
fsOpen=function(title){const b=obOpen.apply(this,arguments);try{const n=RPH.ob.stepFor(title);if(n&&b&&!b.querySelector('.d-progstep')){
  const prog=D.el('div',{class:'d-progstep ob-progstep'});prog.append(D.el('p',{class:'eyebrow',text:'Step '+n+' of 4 · needed to start'}),D.el('div',{class:'d-progress',role:'progressbar','aria-label':'Setup progress','aria-valuemin':'0','aria-valuemax':'4','aria-valuenow':String(n-1)},D.el('i',{style:'width:'+Math.round((n-1)/4*100)+'%'})));
  b.prepend(prog);}}catch(e){console.warn(e);}return b;};
/* ---------- 3. Today: checklist, then a one-time "set up" message ---------- */
RPH.ob.readyKey=()=>{let id='here';try{id=siteDirectory().active||id;}catch{}return 'rph-setup-ready-seen:'+id;};
RPH.ob.card=function(){
 const st=RPH.ob.steps(),left=st.filter(s=>!s.done);
 if(!left.length){let seen=false;try{seen=localStorage.getItem(RPH.ob.readyKey())==='1';}catch{}if(seen)return '';
  return `<div class="ob-ready"><b>✓ ${obEsc(state.pharmacyName||'Your pharmacy')} is set up</b><p class="sub">All ${state.active.length} service${state.active.length===1?' is':'s are'} configured. Your reviews and procedures now match how you run them. Start with the jobs below.</p><div>${CD.btn('Got it',()=>{try{localStorage.setItem(RPH.ob.readyKey(),'1');}catch{}render();})}</div></div>`;}
 const next=RPH.ob.nextKey();
 return `<div class="ob-card"><div class="ob-head"><b>Finish setting up · ${left.length} left</b>${st.length>3?'<span class="sub">a few minutes each</span>':''}</div><ul class="ob-chk">${st.map(s=>`<li class="${s.done?'ob-done':s.key===next?'ob-next':''}"><span class="ob-box" aria-hidden="true">${s.done?'✓':''}</span><span class="ob-t">${obEsc(s.label)}${s.key===next?`<small>Next${s.need?' · needed to start':''}</small>`:''}<span class="cd-vh">${s.done?' · done':''}</span></span>${s.key===next?CD.btn('Start',()=>fsNext(),true):''}</li>`).join('')}</ul>${state.freshSelection?'<p class="sub">Today already works. Each service you finish makes its reviews and procedures fit how you actually run it.</p>':'<p class="sub">After these, Today shows what’s due. Setting up each service can wait.</p>'}</div>`;};
