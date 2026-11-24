// Pulls the rule content (services, setup questions, reviews and their questions, site-visit checks, staff requirements,
// NSW law and contacts) out of the current app (uat/app/rpharmacy-uat-testing.html), so the rebuild uses exactly the
// same wording. Run: node app/tools/extract-content.js  → app/src/content/*.json
const { chromium } = require('playwright');const fs=require('fs');const path=require('path');
const OLD='file://'+path.resolve(__dirname,'../../uat/app/rpharmacy-uat-testing.html');const OUT=path.resolve(__dirname,'../src/content');
const plain=v=>JSON.parse(JSON.stringify(v,(k,x)=>typeof x==='function'?undefined:x));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});p.on('dialog',d=>d.accept());
 await p.goto(OLD);await p.waitForTimeout(1500);
 await Promise.all([p.waitForNavigation(),p.evaluate(()=>RPH.example.open())]);await p.waitForTimeout(1500);
 // all services active in memory only (nothing saved), so every review renders its questions
 await p.evaluate(()=>{state.active=services.map(s=>s.id);});
 const base=await p.evaluate(()=>({
  services:services.map(s=>({id:s.id,name:s.name,frequency:s.frequency,check:s.check})),
  setupFields:Object.fromEntries(Object.keys(sopFields).map(k=>[k,sopFieldsFor(k).map(([key,label,options,section,extra])=>({key,label,options,section,extra:extra??null}))])),
  sq:{PROC:RPH.sq.PROC,REC_BASE:RPH.sq.REC_BASE,REC:RPH.sq.REC,LEAD:RPH.sq.LEAD,VGROUPS:RPH.sq.VGROUPS},
  catalog:catalog().map(a=>({...a})),
  visit:{core:RPH.sv.coreMeta,services:RPH.sv.serviceMeta,items:RPH.sv.items(),statusText:RPH.sv.statusText,answerText:RPH.sv.answerText,areas:(()=>{try{return q1InspectionAreas();}catch{return []}})()},
  law:{REG:RPH.insp.REG,OBL:RPH.insp.OBL,S8RX:RPH.insp.S8RX,MSS:RPH.nsw.MSS,ADD:RPH.nsw.ADD,VAPE:RPH.nsw.VAPE,DATES:RPH.nsw.DATES,CONTACTS:RPH.nsw.CONTACTS,OWN:RPH.nsw.OWN,KINDS:RPH.help.KINDS,SUGGEST:RPH.help.SUGGEST},
  roles:[...new Set([...document.createElement('div').querySelectorAll('x')].map(()=>''))],
 }));
 // staff requirements for every role × service, via throwaway people (not saved)
 base.staff=await p.evaluate(()=>{staffEditor('');const roles=[...$('editor').querySelectorAll('[name=role] option')].map(o=>o.value).filter(Boolean);const eng=[...$('editor').querySelectorAll('[name=engagement] option')].map(o=>o.value).filter(Boolean);$('editor').close();
  const req={};for(const role of roles){req[role]={base:staffRequirements({id:'x',person:'x',role,engagement:'Regular',services:[]}).map(r=>({id:r.id,label:r.label})),services:{}};for(const s of services)req[role].services[s.id]=staffRequirements({id:'x',person:'x',role,engagement:'Regular',services:[s.id]}).map(r=>({id:r.id,label:r.label})).filter(r=>!req[role].base.some(b=>b.id===r.id));}
  return {roles,engagements:eng,requirements:req,outcomes:verificationOutcomes,methods:verificationMethods};});
 // each review: render it and read its questions and fields
 base.reviewForms={};
 for(const a of base.catalog){if(a.id==='Q1')continue;
  base.reviewForms[a.id]=await p.evaluate(id=>{const e=$('editor');if(e.open)e.close();RPH.calm.direct=true;try{reviewEditor(id);}finally{RPH.calm.direct=false;}
   const f=$('review-form')||e;const txt=x=>(x?.innerText||'').replace(/\s+/g,' ').trim();
   const questions=[...f.querySelectorAll('[data-question]')].map(q=>({n:+q.dataset.question,text:txt(q.querySelector('legend'))||txt(q.querySelector('h3,h4,label')),options:[...q.querySelectorAll('input[type=radio]')].map(r=>({value:r.value,issue:r.dataset.issue==='1'}))}));
   const fields=[...f.querySelectorAll('label')].filter(l=>!l.closest('[data-question]')&&l.querySelector('input:not([type=radio]):not([type=checkbox]),select,textarea')).map(l=>{const i=l.querySelector('input,select,textarea');return {label:txt(l).slice(0,140),type:i.tagName==='SELECT'?'select':i.type||i.tagName.toLowerCase(),id:i.id||i.name||'',required:i.required,options:i.tagName==='SELECT'?[...i.options].map(o=>o.textContent.trim()).filter(Boolean):undefined};});
   const notes=[...f.querySelectorAll('p,.label')].map(txt).filter(t=>t&&t.length>12&&!/Draft|saves as you|Proprietor oversight\. Refer/.test(t));
   // Proprietor words (design rule 6, P-03): the old follow-up field label is not carried across.
   for(const x of fields)if(x.label==='Responsible person or role')x.label='Who follows it up';
   const out={title:txt(e.querySelector('h2,#dialog-title')),questions,fields,notes:[...new Set(notes)]};e.close();return out;},a.id);
 }
 fs.mkdirSync(OUT,{recursive:true});
 for(const [k,v] of Object.entries({services:{services:base.services,setupFields:base.setupFields,sq:base.sq},reviews:{catalog:base.catalog,forms:base.reviewForms},visit:base.visit,law:base.law,staff:base.staff}))fs.writeFileSync(path.join(OUT,k+'.json'),JSON.stringify(plain(v),null,1));
 console.log('extracted',Object.keys(base.reviewForms).length,'review forms;',base.staff.roles.length,'roles');await b.close();})();
