// Concept D prototype vs working app, same viewport, same page. Fictional data only.
const { chromium } = require('playwright');
const O='/home/user/rpharmacy/uat/tests/out/cd/';require('fs').mkdirSync(O,{recursive:true});
const PROTO='file:///home/user/rpharmacy/design-studio/round3/concept-d.html';
const APP='file:///home/user/rpharmacy/uat/app/rpharmacy-uat-v36-conceptD.html';
const pages=[['dashboard','overview'],['audits','audits'],['audit','audit'],['actions','actions'],['calendar','planner'],['staff','staff'],['policies','documents']];
// app-only pages (no prototype equivalent) captured by cd-ext.js
const only=process.argv[2];
(async()=>{const b=await chromium.launch();
for(const [dev,w,h] of [['desktop',1280,860],['mobile',390,844]]){
 const pp=await b.newPage({viewport:{width:w,height:h}});
 const ap=await b.newPage({viewport:{width:w,height:h}});const errs=[];ap.on('pageerror',e=>errs.push(e.message));ap.on('console',m=>{if(m.type()==='error'&&!m.text().includes('Content Security'))errs.push(m.text())});
 await ap.goto(APP);await ap.waitForTimeout(1500);
 await ap.evaluate(()=>{try{if(D.phone){D.applyView(false);}}catch(e){}});
 await ap.evaluate(require('./showcase-seed.js'));
 await ap.waitForTimeout(600);
 for(const [pk,ak] of pages){if(only&&only!==pk)continue;
  await pp.goto(PROTO+'#'+pk);await pp.waitForTimeout(400);await pp.screenshot({path:O+dev+'-'+pk+'-proto.png'});
  if(ak==='audit'){await ap.evaluate(()=>{if($('editor').open)$('editor').close();gotoPage('audits');reviewEditor('Q1');});}
  else if(ak==='planner'){await ap.evaluate(()=>{if($('editor').open)$('editor').close();CD.st.cal='Month';CD.go('planner');});}
  else await ap.evaluate(x=>{if($('editor').open)$('editor').close();if(x==='planner'){page='planner';render();}else gotoPage(x);},ak);
  await ap.waitForTimeout(500);if(process.env.DBG)console.log(pk,await ap.evaluate(()=>[$('editor').open,page,document.querySelectorAll('dialog[open]').length]));await ap.screenshot({path:O+dev+'-'+pk+'-app.png'});
 }
 await ap.evaluate(()=>{if($('editor').open)$('editor').close();});
 console.log(dev,'errors',JSON.stringify(errs).slice(0,600));
 await pp.close();await ap.close();}
await b.close();})();
