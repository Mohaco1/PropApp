// Batch 8 (automatable part): 320 px wide with large text (text zoom 130%). Every main page must not scroll sideways,
// and the fixed bottom navigation must not cover the page's last control. Fictional data.
const { chromium } = require('playwright');
const res=[];const ok=(n,p,d='')=>res.push({n,p:!!p,d:String(d).slice(0,300)});
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:320,height:640},isMobile:true,hasTouch:true,deviceScaleFactor:1});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto('file:///home/user/rpharmacy/uat/app/rpharmacy-uat-testing.html');await p.waitForTimeout(1500);await p.evaluate(require('./showcase-seed.js'));await p.waitForTimeout(600);
 await p.evaluate(()=>{if($('editor').open)$('editor').close();document.documentElement.style.fontSize='130%';document.body.style.fontSize='130%';});
 for(const pg of ['overview','audits','actions','planner','staff','policies','setup','history']){
  await p.evaluate(pg=>{CD.go(pg);window.scrollTo(0,0);},pg);await p.waitForTimeout(350);
  const r=await p.evaluate(()=>{const de=document.documentElement;const wide=[...document.querySelectorAll('#cd-view *')].filter(e=>{const x=e.getBoundingClientRect();return x.width&&x.right>de.clientWidth+2&&getComputedStyle(e).position!=='fixed'&&!e.closest('[style*="overflow"],.cd-scroll,table,pre');}).slice(0,3).map(e=>e.tagName+'.'+e.className+' '+Math.round(e.getBoundingClientRect().right));
   window.scrollTo(0,de.scrollHeight);return {sw:de.scrollWidth,cw:de.clientWidth,wide};});
  await p.waitForTimeout(200);
  const c=await p.evaluate(()=>{const ctl=[...document.querySelectorAll('#cd-view button,#cd-view a,#cd-view input,#cd-view select')].filter(e=>e.offsetParent&&e.getBoundingClientRect().height);const last=ctl.at(-1);if(!last)return {none:true};const lr=last.getBoundingClientRect();
   const nav=[...document.querySelectorAll('body *')].filter(e=>{const s=getComputedStyle(e);return s.position==='fixed'&&e.offsetHeight&&e.getBoundingClientRect().bottom>=innerHeight-1&&e.getBoundingClientRect().top>innerHeight/2&&!e.closest('#cd-view')&&!e.matches('dialog,#uat-fab,.uat-fab');}).map(e=>e.getBoundingClientRect().top);const top=nav.length?Math.min(...nav):innerHeight;
   return {last:last.textContent.trim().slice(0,30)||last.tagName,bottom:Math.round(lr.bottom),navTop:Math.round(top)};});
  ok(pg+': no sideways scroll at 320 px with large text',r.sw<=r.cw+1,JSON.stringify(r));
  ok(pg+': the last control is not under the bottom navigation',c.none||c.bottom<=c.navTop+1,JSON.stringify(c));
 }
 ok('no page errors',!errs.length,errs.join(' | '));
 await b.close();const f=res.filter(r=>!r.p);for(const r of res)console.log((r.p?'PASS ':'FAIL ')+r.n+(r.p?'':' :: '+r.d));console.log(res.length-f.length+'/'+res.length);process.exit(f.length?1:0);})();
