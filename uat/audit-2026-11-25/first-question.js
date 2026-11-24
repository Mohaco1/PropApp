// For each review form: how far down (px, phone 390x844) the first question starts, and the words above it.
const { chromium } = require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();p.on('dialog',d=>d.accept());
await p.goto('file://'+path.resolve(__dirname,'../app/rpharmacy-uat-testing.html'));await p.waitForTimeout(1500);
await Promise.all([p.waitForNavigation(),p.evaluate(()=>RPH.example.open())]);await p.waitForTimeout(1500);
const ids=await p.evaluate(()=>catalog().map(a=>[a.id,a.name]).filter(x=>x[0]!=='Q1'));const out=[];
for(const [id,name] of ids){await p.evaluate(id=>{const e=$('editor');if(e.open)e.close();RPH.calm.direct=true;reviewEditor(id);RPH.calm.direct=false;},id);await p.waitForTimeout(350);
 out.push(await p.evaluate(([id,name])=>{const ed=$('editor');ed.scrollTop=0;const q=[...ed.querySelectorAll('[data-question],fieldset.card,.sv-q')].find(f=>!f.querySelector('[data-question]')&&f.querySelector('input[type=radio],input[type=checkbox],select')&&f.offsetParent&&!/Attendees/.test(f.textContent.slice(0,40)));
  const top=q?Math.round(q.getBoundingClientRect().top):null;let words=0;const w=document.createTreeWalker(ed,NodeFilter.SHOW_TEXT);while(w.nextNode()){const el=w.currentNode.parentElement;if(!el||!el.offsetParent||el.closest('.uat-screen'))continue;if(top!==null&&el.getBoundingClientRect().top<top)words+=w.currentNode.textContent.trim().split(/\s+/).filter(Boolean).length;}
  return {id,name,firstQuestion:top,wordsBefore:words};},[id,name]));}
fs.writeFileSync(path.join(__dirname,'first-question.json'),JSON.stringify(out,null,1));
console.log(out.filter(o=>o.firstQuestion>844).length,'of',out.length,'below first screen; median px',out.map(o=>o.firstQuestion).sort((a,b)=>a-b)[out.length>>1]);console.log(out.map(o=>o.id+':'+o.firstQuestion+'/'+o.wordsBefore).join(' '));
await b.close();})();
