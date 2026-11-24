// Batch 0 · export accuracy (Codex). A site visit with Satisfactory, Issue, Verify and N/A answers: the review-detail
// export, the History CSV and the printed report must say exactly what was recorded. Fictional data only.
const { chromium, devices } = require('playwright');const fs=require('fs');
const res=[];const ok=(n,p,d='')=>res.push({n,p:!!p,d:String(d).slice(0,300)});
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPhone 13'],acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto('file:///home/user/rpharmacy/uat/app/rpharmacy-uat-testing.html');await p.waitForTimeout(1500);await p.evaluate(require('./showcase-seed.js'));await p.waitForTimeout(600);
 const rec=await p.evaluate(()=>{if($('editor').open)$('editor').close();
  const items=RPH.sv.items().filter(i=>i.core);const plan={};const st=['ok','issue','verify','na'];
  const d={v:3,date:today(),items:{}};items.forEach((it,i)=>{const s=i<4?st[i]:'ok';plan[it.key]=s;d.items[it.key]={status:s,text:s==='issue'?'Fictional issue '+i:s==='verify'?'Fictional verify '+i:'',reason:s==='na'?'Fictional reason '+i:'',follow:s==='issue'?{mode:'new',owner:'You',due:addInterval(today(),14,'days')}:undefined};});
  const r0=state.reviews.length;const okc=RPH.sv.commit(false,d,items,today(),addInterval(today(),3,'months'),'');
  const r=state.reviews.at(-1);return {okc,added:state.reviews.length-r0,at:r.at,date:r.date,plan,answers:r.answers.map(a=>({k:a.itemKey,a:a.answer,n:a.note})),id:r.id,text:reviewText(r)};});
 ok('the site visit with mixed answers is saved',rec.okc&&rec.added===1,JSON.stringify(rec).slice(0,300));
 const want={ok:'Checked',issue:'Issue',verify:'Needs verification',na:'N/A'};
 const mism=rec.answers.filter(a=>want[rec.plan[a.k]]!==a.a);
 ok('every stored answer matches what was chosen (Checked / Issue / Needs verification / N/A)',rec.answers.length&&!mism.length,JSON.stringify(mism));
 ok('the review-detail export keeps the Issue, Verify and N/A answers with their notes and reason',/· Issue · Fictional issue 1/.test(rec.text)&&/· Needs verification · Fictional verify 2/.test(rec.text)&&/· N\/A · Fictional reason 3/.test(rec.text),rec.text.slice(0,400));
 // Review-detail download equals what is shown.
 await p.evaluate(id=>{CD.go('history');historyEntries().find(e=>e.type==='Review'&&e.record?.id===id).open();},rec.id);await p.waitForTimeout(300);
 const shown=await p.evaluate(()=>$('editor').querySelector('pre.hist-detail')?.textContent||'');
 const [dl]=await Promise.all([p.waitForEvent('download',{timeout:5000}).catch(()=>null),p.evaluate(()=>[...$('editor').querySelectorAll('button')].find(b=>b.textContent==='Export review detail').click())]);
 const file=dl?fs.readFileSync(await dl.path(),'utf8'):'';
 ok('the downloaded review detail is the same text as shown on screen (same plain words)',dl&&file.endsWith(shown)&&shown.length>50,file.length+' vs '+shown.length);
 await p.evaluate(()=>$('editor').close());
 // History CSV: the filtered export has exactly the rows shown, and this visit is one of them.
 await p.evaluate(()=>{gotoPage('history');});await p.waitForTimeout(300);
 const shownRows=await p.evaluate(()=>{const v=$('hist-source');return v?v.value:'';});
 const [c]=await Promise.all([p.waitForEvent('download',{timeout:5000}).catch(()=>null),p.evaluate(()=>$('hist-csv').click())]);
 const csv=c?fs.readFileSync(await c.path(),'utf8'):'';
 const vis=csv.split('\n').filter(l=>l.includes(rec.at)&&l.includes('"Review"'));const line=vis[0]||'';
 ok('History CSV has this visit once, with its recorded date',vis.length===1&&line.includes('"'+rec.date+'"'),line);
 ok('History CSV keeps each answer exactly: Section 2 Issue, Section 3 Needs verification, Section 4 N/A',/Section 1: Checked/.test(line)&&/Section 2: Issue/.test(line)&&/Section 3: Needs verification/.test(line)&&/Section 4: N\/A/.test(line)&&!/Rating unconfirmed/.test(line),line);
 const pr=await p.evaluate(at=>{let got='';RPH.cx.realPrint=()=>{got=[...document.querySelectorAll('#history-report tr')].find(tr=>tr.textContent.includes(at)&&tr.children[2]?.textContent==='Review')?.lastElementChild?.textContent||'';};$('hist-export').click();return got;},rec.at);
 ok('the printed report shows the same answers as recorded',/Section 3: Needs verification/.test(pr)&&/Section 4: N\/A/.test(pr)&&!/Rating unconfirmed/.test(pr),pr);
 const srch=await p.evaluate(()=>{const t=Object.values(state.taskLedger).find(t=>/Fictional issue 1/.test(t.text));const title=CD.actionTitle(t);const find=q=>{CD.st.q.actions=q;CD.go('actions');return $('cd-view').textContent.includes(title);};const r={title,orig:find('Medicine storage'),cur:find(title.slice(0,12))};CD.st.q.actions='';return r;});
 ok('Actions search finds the action by its original question wording and by its current title',srch.orig&&srch.cur,JSON.stringify(srch));
 ok('no page errors',!errs.length,errs.join(' | '));
 await b.close();const f=res.filter(r=>!r.p);for(const r of res)console.log((r.p?'PASS ':'FAIL ')+r.n+(r.p?'':' :: '+r.d));console.log(res.length-f.length+'/'+res.length);process.exit(f.length?1:0);})();
