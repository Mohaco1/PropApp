/* ===== Finishing a site visit without hunting (expert review M1/X8/R3/U2, owner approved 20 Nov 2026) =====
 *  - "Finish review" lists EVERY item still needed, each with a "Go to" button that jumps to that check.
 *  - A check that still needs something (e.g. the vaccination cold-chain question after "Satisfactory")
 *    says so under the answers, and its progress segment turns amber, before you move on.
 *  - On the last check the main button reads "Finish review" (not a disabled "Last check").
 * Nothing is completed for the user: the same checks and the same confirmation step apply.
 */
RPH.rf={};
RPH.rf.problems=()=>{try{return RPH.sv?.problems?RPH.sv.problems():[];}catch{return [];}};
RPH.rf.jump=function(key){const ed=$('editor');
 if(key==='date'){const i=ed.querySelector('input[type=date]');i?.scrollIntoView({block:'center'});i?.focus();return;}
 if(key==='next'){const d=[...ed.querySelectorAll('details')].find(x=>/next visit/i.test(x.textContent));if(d){d.open=true;const i=d.querySelector('input[type=date]');i?.scrollIntoView({block:'center'});i?.focus();}return;}
 const items=[...ed.querySelectorAll('#sv-root .sv-item')],i=items.findIndex(x=>x.dataset.key===key);if(i<0)return;
 CD.svIdx=i;CD.svSteps();items[i].scrollIntoView({block:'start'});
 const need=items[i].querySelector('.sv-item-body textarea:not([disabled]),.sv-item-body input:not([disabled]),[role=radio]');need?.focus({preventScroll:true});};
RPH.rf.list=function(pr){const ed=$('editor'),msg=ed.querySelector('.sv-msg');if(!msg)return;
 const had=ed.querySelector('.cd-blockers');had?.remove();if(!pr.length){if(had)msg.textContent='';return;}
 msg.textContent=pr.length===1?'1 thing to finish before you can complete this visit:':pr.length+' things to finish before you can complete this visit:';
 const ul=D.el('ul',{class:'cd-blockers'});
 for(const [key,text] of pr){const li=D.el('li');const b=D.el('button',{type:'button',text:'Go to'});b.onclick=()=>RPH.rf.jump(key);li.append(D.el('span',{text}),b);ul.append(li);}
 msg.after(ul);};
const rfSvize=CD.svize;
CD.svize=function(){const r=rfSvize.apply(this,arguments);const ed=$('editor');
 if(ed.classList.contains('cd-sv')&&RPH.sv?.summary&&!RPH.sv.summary.__rf){const orig=RPH.sv.summary;
  const w=function(){const pr=RPH.rf.problems();const out=orig.apply(this,arguments);RPH.rf.list(pr);return out;};w.__rf=true;RPH.sv.summary=w;}
 return r;};
const rfSteps=CD.svSteps;
CD.svSteps=function(){rfSteps.apply(this,arguments);const ed=$('editor'),root=ed?.querySelector('#sv-root');if(!root||!ed.classList.contains('cd-sv'))return;
 const items=[...root.querySelectorAll('.sv-item')],n=items.length,pr=RPH.rf.problems();
 const open=k=>pr.filter(([key,t])=>key===k&&!/not yet reviewed$/.test(t));
 // amber segments for answered checks that still need something
 const segs=[...(ed.querySelector('.cd-prog')?.children||[])];items.forEach((it,i)=>segs[i]?.classList.toggle('warn',!!open(it.dataset.key).length&&!!it.querySelector('[role=radio][aria-checked=true]')));
 // "still needed" under the current check
 const cur=items[CD.svIdx];root.querySelectorAll('.cd-still').forEach(x=>x.remove());
 if(cur&&cur.querySelector('[role=radio][aria-checked=true]')){const need=open(cur.dataset.key);
  if(need.length){const box=D.el('p',{class:'cd-still',role:'status'});box.textContent='Still needed on this check: '+need.map(([,t])=>t.replace(/^[^·]+· /,'')).join('; ')+'.';(cur.querySelector('.sv-item-body')||cur).after(box);}}
 // last check: the main button finishes the review
 const nav=ed.querySelector('.cd-svnav');if(nav){const nx=nav.children[1];if(!nx.__rf){const o=nx.onclick;nx.onclick=function(e){if(CD.svIdx>=n-1){ed.querySelector('#sv-complete')?.click();return;}return o?.call(this,e);};nx.__rf=true;}
  if(CD.svIdx===n-1){nx.textContent='Finish review';nx.disabled=false;}}
 // the error list stays current as things are fixed
 if(ed.querySelector('.cd-blockers'))RPH.rf.list(pr);
};
/* Fix (found in this review, also in v36): after typing a finding, the first tap on "New corrective Action"
   was lost, because leaving the text box redraws the follow-up buttons under the finger. The redraw (which
   looks for similar open actions) now runs just after the tap instead of during it. */
document.addEventListener('change',e=>{const t=e.target;if(e.rfLate||t.tagName!=='TEXTAREA'||!t.closest('#editor .sv-item-body'))return;
 e.stopPropagation();setTimeout(()=>{if(!t.isConnected)return;const ev=new Event('change');ev.rfLate=true;t.dispatchEvent(ev);},350);},true);
