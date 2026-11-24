// Automated accessibility check (axe-core, WCAG 2.0/2.1/2.2 A and AA) on every main page and five windows at phone size. Fictional data.
const { chromium, devices } = require('playwright');const AXE=__dirname+'/vendor/axe.min.js'; // axe-core 4.10.2 (MPL-2.0)
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({...devices['iPhone 13']})).newPage();p.on('dialog',d=>d.accept());
await p.goto('file:///home/user/rpharmacy/uat/app/rpharmacy-uat-testing.html');await p.waitForTimeout(1500);await p.evaluate(require('/home/user/rpharmacy/uat/tests/showcase-seed.js'));await p.waitForTimeout(600);
await p.addScriptTag({path:AXE});
const agg={};
const scan=async(label)=>{const r=await p.evaluate(async()=>{const res=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']},resultTypes:['violations']});return res.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,n:v.nodes.length,ex:v.nodes.slice(0,3).map(x=>x.target.join(' ')+' :: '+(x.failureSummary||'').split('\n')[1])}));});
 for(const v of r){(agg[v.id]??={impact:v.impact,help:v.help,where:{}}).where[label]={n:v.n,ex:v.ex};}};
await p.evaluate(()=>{if($('editor').open)$('editor').close();});
for(const pg of ['overview','audits','actions','planner','staff','documents','setup','history','services','more']){await p.evaluate(pg=>{CD.go(pg);window.scrollTo(0,0);},pg);await p.waitForTimeout(400);await scan('page:'+pg);}
const dlg=[['visit prep',()=>RPH.visit.prep(false)],['site visit',()=>RPH.sv.open(false)],['action',()=>taskEditor(Object.values(state.taskLedger).find(t=>t.status==='Outstanding').id)],['S8 review',()=>reviewEditor('B1')],['DAA change',()=>RPH.chg.choose(['house'],'',today())]];
for(const [l,f] of dlg){await p.evaluate(`(${f.toString()})()`);await p.waitForTimeout(500);await scan('dialog:'+l);await p.evaluate(()=>{if($('editor').open)$('editor').close();});await p.waitForTimeout(300);}
const ids=Object.keys(agg);for(const [k,v] of Object.entries(agg))console.log('FAIL '+v.impact+' '+k+' · '+v.help+' · '+Object.keys(v.where).join(', '));console.log((ids.length?0:1)+'/1 '+(ids.length?ids.length+' accessibility rule(s) broken':'no WCAG 2.2 AA violations on 10 pages and 5 windows (phone)'));await b.close();process.exit(ids.length?1:0);})();
