// Fill and complete any standard review form at the browser's current (fake) date. opts.issue: index of the check to mark as an issue.
async function completeReview(p,id,opts={}){
 await p.evaluate(id=>{if($('editor').open)$('editor').close();RPH.calm&&(RPH.calm.direct=true);reviewEditor(id);RPH.calm&&(RPH.calm.direct=false);},id);await p.waitForTimeout(450);
 const r0=await p.evaluate(()=>state.reviews.length);
 for(let pass=0;pass<4;pass++){
  await p.evaluate(o=>{const ed=$('editor');const f=ed.querySelector('#review-form')||ed;const vis=e=>!e.closest('.uat-screen,.uat-strip')&&!e.disabled&&!e.closest('fieldset[disabled],[hidden]');
   const nt=$('notes');if(o.notes&&nt&&!nt.value){nt.value=o.notes;nt.dispatchEvent(new Event('input',{bubbles:true}));}
   const rd=$('review-date');if(rd&&!rd.value){rd.value=o.date||today();rd.dispatchEvent(new Event('input',{bubbles:true}));rd.dispatchEvent(new Event('change',{bubbles:true}));}
   let qi=0;
   for(const fs of [...f.querySelectorAll('fieldset')].filter(vis)){const rs=[...fs.querySelectorAll('input[type=radio]')].filter(r=>r.closest('fieldset')===fs);if(!rs.length)continue;if(rs.some(r=>r.checked)){qi++;continue;}
    const issue=o.issue===qi;const tag=rs.some(r=>r.dataset.issue!==undefined);const pick=issue?(rs.find(r=>r.dataset.issue==='1')||rs.find(r=>/^(No|Issue|Not met|Partly)/i.test(r.value))||rs[rs.length-1]):(tag?(rs.find(r=>r.dataset.issue==='0'&&!/^(N\/A|Not applicable|Needs verification)/i.test(r.value))||rs.find(r=>r.dataset.issue==='0')):null)||rs.find(r=>/^(Yes|Met|Checked|Satisfactory|Complete|Compliant|Reviewed|Sighted)/i.test(r.value))||rs[0];
    pick.click();qi++;}
   for(const s of [...f.querySelectorAll('select')].filter(vis)){if(s.value)continue;const op=[...s.options].find(x=>x.value&&!/Needs verification|Incomplete|Not done|Issue|No\b/i.test(x.textContent))||[...s.options].find(x=>x.value);if(op){s.value=op.value;s.dispatchEvent(new Event('change',{bubbles:true}));}}
   for(const i of [...f.querySelectorAll('input[type=date]')].filter(vis)){if(i.value||i.id==='next-date')continue;i.value=o.date||today();i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));}
   for(const i of [...f.querySelectorAll('input[type=text],input:not([type]),textarea')].filter(vis)){if(i.value||i.id==='by')continue;if(!i.required&&!(o.issue!==undefined&&/issue|what|finding|describe/i.test(i.closest('label')?.textContent||'')))continue;const l=(i.closest('label')?.textContent||i.placeholder||'');
    if(/note/i.test(l)&&!i.required&&!o.note)continue;i.value=/issue|what/i.test(l)?(o.issueText||'Fictional issue noted'):/note/i.test(l)?(o.note||''):window.__tf(l);i.dispatchEvent(new Event('input',{bubbles:true}));}
  },opts);
  await p.waitForTimeout(150);
  let btn='';for(let k=0;k<30;k++){btn=await p.evaluate(()=>{const b=[...$('editor').querySelectorAll('button')].filter(b=>b.offsetParent&&!b.disabled&&/^(Complete review|Save review|Record review|Complete|Finish review|Save meeting|Save)$/i.test(b.textContent.trim()));return b[0]?.textContent.trim()||'';});
   if(btn)break;const nx=await p.evaluate(()=>{const b=[...$('editor').querySelectorAll('button')].find(b=>b.offsetParent&&!b.disabled&&/^(Next|Save and next)$/.test(b.textContent.trim()));if(b){b.click();return true;}return false;});if(!nx)break;await p.waitForTimeout(120);}
  if(!btn)return {ok:false,why:'no complete button',btns:await p.evaluate(()=>[...$('editor').querySelectorAll('button')].filter(b=>b.offsetParent).map(b=>b.textContent.trim()).slice(0,12))};
  await p.locator('#editor button',{hasText:new RegExp('^'+btn+'$')}).first().click();await p.waitForTimeout(450);
  const conf=await p.evaluate(()=>[...$('editor').querySelectorAll('button')].filter(b=>b.offsetParent).map(b=>b.textContent.trim()).find(t=>/^(Complete|Confirm|Yes, complete|Complete review|Save anyway)/i.test(t)));
  const n=await p.evaluate(()=>state.reviews.length);
  if(n>r0){await p.evaluate(()=>{if($('editor').open)$('editor').close();});return {ok:true,rec:await p.evaluate(()=>{const r=state.reviews.at(-1);return {audit:r.audit,date:r.date,actions:(r.actionIds||[]).length+(r.taskLinks||[]).length};})};}
  if(conf&&pass<3){await p.locator('#editor button',{hasText:conf}).first().click();await p.waitForTimeout(450);if(await p.evaluate(r0=>state.reviews.length>r0,r0)){await p.evaluate(()=>{if($('editor').open)$('editor').close();});return {ok:true};}}
 }
 const why=await p.evaluate(()=>($('status')?.querySelector('span')?.textContent||'')+' | '+[...$('editor').querySelectorAll('.error,[role=alert],.sv-msg,.warn')].map(e=>e.textContent).join(' ').slice(0,200));
 await p.evaluate(()=>{if($('editor').open)$('editor').close();});
 return {ok:false,why};}
module.exports={completeReview};
