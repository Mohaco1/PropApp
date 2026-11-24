// Phone-screen audit of the current UAT app. Every screen at 390x844 (phone), screenshot of what's visible first,
// plus measured checks. Fictional data only (Wattle Grove example + a fresh setup).
const { chromium } = require('playwright');const fs=require('fs');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app/rpharmacy-uat-testing.html');const OUT=path.join(__dirname,'shots');fs.mkdirSync(OUT,{recursive:true});
const VH=844;const results=[];
const measure=()=>{const ed=document.getElementById('editor');const root=ed&&ed.open?ed:document.body;const VH=innerHeight;
 const vis=e=>{if(!e.offsetParent&&getComputedStyle(e).position!=='fixed')return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0;};
 const skip=e=>e.closest('#uat-btn,#uat-dlg,.uat-screen,.uat-strip,#cd-mob,header,.cd-top,.cd-audit-top,nav')||/^(Close|← |Back|Today|Reviews|Actions|Staff|More|Laptop view|Phone view)/.test((e.innerText||e.value||'').trim());
 const ctrls=[...root.querySelectorAll('input:not([type=hidden]),select,textarea,button,summary,[role=button],a[href]')].filter(e=>vis(e)&&!skip(e)&&!e.disabled);
 const first=ctrls.map(e=>e.getBoundingClientRect().top+(root===ed?0:scrollY)).sort((a,b)=>a-b)[0];
 const text=root.innerText||'';
 const sents=text.split(/(?<=[.!?])\s+|\n+/).map(s=>s.trim().toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ')).filter(s=>s.length>=18);
 const seen={},dups=[];for(const s of sents){const k=s.slice(0,28);if(seen[k]&&!dups.includes(k))dups.push(k);seen[k]=1;}
 const firstIdx=(()=>{if(first===undefined)return text.length;let n=0;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let words=0;while(w.nextNode()){const t=w.currentNode;const el=t.parentElement;if(!el||!vis(el)||skip(el))continue;const r=el.getBoundingClientRect();if(r.top+(root===ed?0:scrollY)<first)words+=t.textContent.trim().split(/\s+/).filter(Boolean).length;}return words;})();
 const lefts=[...root.querySelectorAll('h1,h2,h3,p,label,legend,li,td')].filter(e=>vis(e)&&!skip(e)&&e.innerText.trim()).map(e=>({t:e.tagName,l:Math.round(e.getBoundingClientRect().left),txt:e.innerText.trim().slice(0,40)}));
 const hl=lefts.filter(x=>/H[123]/.test(x.t)).map(x=>x.l),pl=lefts.filter(x=>!/H[123]/.test(x.t)).map(x=>x.l);const mode=a=>{const m={};a.forEach(x=>m[x]=(m[x]||0)+1);return +Object.entries(m).sort((a,b)=>b[1]-a[1])[0]?.[0];};
 const misalign=hl.length&&pl.length&&Math.abs(mode(hl)-mode(pl))>6?`headings at ${mode(hl)}px, text at ${mode(pl)}px`:'';
 const small=ctrls.filter(e=>!/input|select|textarea/i.test(e.tagName)||['checkbox','radio'].includes(e.type)?true:true).map(e=>{const r=e.getBoundingClientRect();return {t:(e.innerText||e.value||e.getAttribute('aria-label')||e.type||'').trim().slice(0,24),w:Math.round(r.width),h:Math.round(r.height)}}).filter(x=>x.h<44&&!['checkbox','radio'].includes(x.t));
 const sh=root===ed?ed.scrollHeight:document.documentElement.scrollHeight;
 const over=document.documentElement.scrollWidth>innerWidth+1;
 const saves=(text.match(/saves? as you (type|go)|saved as you go|saved on this device/gi)||[]).length;
 return {firstAt:first===undefined?null:Math.round(first),wordsBefore:firstIdx,screens:+(sh/VH).toFixed(1),dups,misalign,small:small.slice(0,8),smallCount:small.length,overflow:over,saveMsgs:saves,words:text.split(/\s+/).filter(Boolean).length,title:(root.querySelector('h1,h2,#dialog-title')?.innerText||'').slice(0,60)};};
(async()=>{const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:390,height:VH},deviceScaleFactor:2,isMobile:true,hasTouch:true});let p=await ctx.newPage();p.on('dialog',d=>d.accept());
 let cons=[];p.on('console',m=>{if(m.type()==='error')cons.push(m.text().slice(0,120));});p.on('pageerror',e=>cons.push('PAGEERROR '+e.message.slice(0,120)));
 let n=0;
 const shot=async(group,name,fn,opts={})=>{cons=[];try{if(fn)await p.evaluate(()=>{const e=document.getElementById('editor');if(e&&e.open)e.close();const u=document.getElementById('uat-dlg');if(u&&u.open)u.close();});if(fn)await fn();await p.waitForTimeout(opts.wait||450);
  await p.evaluate(()=>{const e=document.getElementById('editor');if(e&&e.open)e.scrollTop=0;scrollTo(0,0);});
  const m=await p.evaluate(measure);const file=String(++n).padStart(3,'0')+'.jpg';await p.screenshot({path:path.join(OUT,file),type:'jpeg',quality:62});
  results.push({n,group,name,file,...m,console:cons.filter(c=>!/Content Security Policy/.test(c)),csp:cons.some(c=>/Content Security Policy/.test(c))});process.stdout.write('.');}
  catch(e){results.push({n:++n,group,name,error:e.message.slice(0,200)});process.stdout.write('x');}};
 const ev=(f,a)=>p.evaluate(f,a);
 // ---------- fresh first use ----------
 await p.goto(APP);await p.waitForTimeout(1500);
 await shot('First use','Welcome screen',null);
 await shot('First use','Setup step 1 · pharmacy details',async()=>{await p.locator('main button',{hasText:'Set up your pharmacy'}).click();});
 await p.locator('input:visible:not(.uat-new)').nth(0).fill('Test Pharmacy');await p.locator('input:visible:not(.uat-new)').nth(1).fill('1 Test St');await p.locator('button:visible',{hasText:'Continue'}).first().click();await p.waitForTimeout(300);
 results.push(...[]);await shot('First use','Setup step 2 · proprietors',null);
 await p.locator('input:visible:not(.uat-new)').last().fill('Alex Owner');await p.locator('button:visible',{hasText:'Continue'}).first().click();await p.waitForTimeout(300);
 await shot('First use','Setup step 3 · services',null);
 // ---------- example pharmacy (clean browser) ----------
 const ctx2=await b.newContext({viewport:{width:390,height:VH},deviceScaleFactor:2,isMobile:true,hasTouch:true});p=await ctx2.newPage();p.on('dialog',d=>d.accept());
 p.on('console',m=>{if(m.type()==='error')cons.push(m.text().slice(0,120));});p.on('pageerror',e=>cons.push('PAGEERROR '+e.message.slice(0,120)));
 await p.goto(APP);await p.waitForTimeout(1500);
 await Promise.all([p.waitForNavigation(),p.evaluate(()=>RPH.example.open())]);await p.waitForTimeout(1500);
 const go=pg=>()=>ev(pg=>{if(pg==='setup'){page='setup';render();}else CD.go(pg);},pg);
 await shot('Main pages','Today',go('overview'));
 await shot('Main pages','Today · more filters',async()=>{await ev(()=>CD.go('overview'));const m=p.locator('main summary,main button',{hasText:'More filters'});if(await m.count())await m.first().click();});
 await shot('Main pages','Reviews',go('audits'));
 await shot('Main pages','Actions',go('actions'));
 await shot('Main pages','Staff',go('staff'));
 await shot('Main pages','More',go('more'));
 await shot('Main pages','Calendar · this week',go('planner'));
 for(const tab of ['Year plan','Month'])await shot('Main pages','Calendar · '+tab,async()=>{await ev(()=>CD.go('planner'));await p.getByText(tab,{exact:true}).first().click();});
 await shot('Main pages','Policies',go('documents'));
 await shot('Main pages','History',()=>ev(()=>gotoPage('history')));
 await shot('Main pages','Pharmacy setup',go('setup'));
 await shot('Main pages','Services',()=>ev(()=>gotoPage('services')));
 await shot('Main pages','Meetings',()=>ev(()=>{page='meetings';render();}));
 // setup sub-screens: click each row on the setup page
 await ev(()=>{page='setup';render();});await p.waitForTimeout(300);
 const rows=await p.evaluate(()=>[...document.querySelectorAll('main button')].map(b=>b.innerText.split('\n')[0].trim()).filter(t=>t&&t.length<50));
 for(const r of rows){await shot('Pharmacy setup','Setup · '+r,async()=>{await ev(()=>{page='setup';render();});await p.locator('main button',{hasText:r}).first().click();});}
 // visits
 await shot('Site visit','Start a visit',()=>ev(()=>RPH.visit.prep(false)));
 await shot('Site visit','Extra visit (resumed)',()=>ev(()=>RPH.sv.open(true)));
 await shot('Site visit','Quarterly visit · first check',()=>ev(()=>{RPH.calm.direct=true;RPH.sv.open(false);RPH.calm.direct=false;}));
 // every review form
 const cat=await ev(()=>catalog().map(a=>[a.id,a.name]));
 for(const [id,name] of cat){if(id==='Q1')continue;await shot('Review forms',name+' ('+id+')',()=>ev(id=>{RPH.calm.direct=true;reviewEditor(id);RPH.calm.direct=false;},id));}
 // actions
 const tid=await ev(()=>Object.values(state.taskLedger).find(t=>/Fridge/.test(t.text))?.id);
 await shot('Actions','Action · open (phone screen)',()=>ev(t=>taskEditor(t),tid));
 await shot('Actions','Action · Edit details expanded',async()=>{await ev(t=>taskEditor(t),tid);await p.waitForTimeout(300);await ev(()=>{const d=document.querySelector('#editor details.cl-edit');if(d)d.open=true;});});
 await shot('Actions','Add action',()=>ev(()=>taskEditor()));
 const wid=await ev(()=>Object.values(state.taskLedger).find(t=>/extinguisher/.test(t.text))?.id);
 await shot('Actions','Action · waiting on someone',()=>ev(t=>taskEditor(t),wid));
 // staff
 const sid=await ev(()=>state.staff.find(s=>s.person==='Tom Nguyen').id);
 await shot('Staff','Staff profile · Tom',()=>ev(s=>openStaff(s),sid));
 await shot('Staff','Annual check form · Tom',()=>ev(s=>staffAssurance(false,s),sid));
 await shot('Staff','Add staff member',()=>ev(()=>staffEditor('')));
 // procedures
 const did=await ev(()=>procedureDocs()[0]?.id);
 await shot('Policies','Procedure · DAA draft',()=>ev(d=>policyDetail(d),did));
 // UAT
 await shot('Other','UAT notes window',()=>p.locator('#uat-btn').click());
 fs.writeFileSync(path.join(__dirname,'results.json'),JSON.stringify(results,null,1));
 console.log('\n',results.length,'screens',results.filter(r=>r.error).length,'errors');await b.close();})();
