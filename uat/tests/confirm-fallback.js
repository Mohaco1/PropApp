// In-app confirm when the browser's confirm box is blocked (as in the artifact viewer). Fictional data.
const { chromium } = require('playwright');
const APP='file:///home/user/rpharmacy/uat/app/'+(process.env.FILE||'rpharmacy-uat-testing.html');
const res=[];const ok=(n,p,d='')=>res.push({n,p:!!p,d:String(d).slice(0,300)});
(async()=>{const b=await chromium.launch();
 // 1. blocked: confirm answers "no" instantly, like the sandboxed viewer
 const p=await b.newPage({viewport:{width:1280,height:860}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{window.__nc=0;Object.defineProperty(window,'confirm',{configurable:true,writable:true,value:()=>{window.__nc++;return false;}});});
 await p.goto(APP);await p.waitForTimeout(1500);
 await p.evaluate(()=>{if(D.phone){D.applyView(false);render();}});
 ok('fallback is active',await p.evaluate(()=>window.RPH_confirmFallback===true));
 // A real-style handler: a button whose click asks first, and a window whose Escape asks first (as the app's editors do).
 await p.evaluate(()=>{const bt=document.createElement('button');bt.id='t-btn';bt.textContent='Discard';bt.style.cssText='position:fixed;top:90px;right:20px;z-index:99999';bt.onclick=()=>{if(confirm('Close and discard your unsaved changes?'))window.__done=(window.__done||0)+1;};document.body.append(bt);
  const d=document.createElement('dialog');d.id='t-dlg';d.innerHTML='<p>Form</p>';d.oncancel=e=>{if(!confirm('Discard unsaved review?'))e.preventDefault();};document.body.append(d);});
 await p.locator('#t-btn').click();await p.waitForTimeout(300);
 const s1=await p.evaluate(()=>({conf:document.getElementById('rph-confirm')?.open,text:document.getElementById('rph-confirm-text')?.textContent,done:window.__done||0}));
 ok('a blocked confirm shows the same question in the app instead of doing nothing',s1.conf&&s1.text==='Close and discard your unsaved changes?'&&!s1.done,JSON.stringify(s1));
 await p.locator('#rph-confirm .rph-confirm-no').click();await p.waitForTimeout(200);
 ok('Cancel does nothing',await p.evaluate(()=>!(window.__done)&&!document.getElementById('rph-confirm').open));
 await p.locator('#t-btn').click();await p.waitForTimeout(200);await p.locator('#rph-confirm .rph-confirm-yes').click();await p.waitForTimeout(300);
 ok('Yes, continue carries out the action once',await p.evaluate(()=>window.__done===1));
 await p.locator('#t-btn').click();await p.waitForTimeout(200);
 ok('the yes is used once only: the next time it asks again',await p.evaluate(()=>document.getElementById('rph-confirm').open&&window.__done===1));
 await p.locator('#rph-confirm .rph-confirm-no').click();await p.waitForTimeout(200);
 await p.evaluate(()=>document.getElementById('t-dlg').showModal());await p.keyboard.press('Escape');await p.waitForTimeout(300);
 const esc=await p.evaluate(()=>({conf:document.getElementById('rph-confirm').open,dlg:document.getElementById('t-dlg').open}));
 ok('Escape on a window with unsaved changes asks in the app and keeps the window',esc.conf&&esc.dlg,JSON.stringify(esc));
 await p.locator('#rph-confirm .rph-confirm-yes').click();await p.waitForTimeout(300);
 ok('Yes after Escape closes the window',await p.evaluate(()=>!document.getElementById('t-dlg').open));
 ok('no script errors (blocked)',!errs.length,errs.join(' | '));
 // 2. normal browser: the native box is used, no in-app dialog
 const q=await b.newPage();const e2=[];q.on('pageerror',e=>e2.push(e.message));let native=0;q.on('dialog',d=>{native++;d.accept();});
 await q.goto(APP);await q.waitForTimeout(1500);
 await q.evaluate(()=>{const bt=document.createElement('button');bt.id='t-btn';bt.onclick=()=>{if(confirm('Close and discard your unsaved changes?'))window.__done=1;};document.body.append(bt);});
 await q.locator('#t-btn').click();await q.waitForTimeout(300);
 ok('where the browser box works it is used as before',native===1&&await q.evaluate(()=>window.__done===1&&!document.getElementById('rph-confirm')),'native='+native);
 ok('no script errors (normal)',!e2.length,e2.join(' | '));
 for(const x of res)console.log((x.p?'PASS ':'FAIL ')+x.n+(x.p?'':' · '+x.d));console.log(res.filter(x=>x.p).length+'/'+res.length+' passed');await b.close();})();
