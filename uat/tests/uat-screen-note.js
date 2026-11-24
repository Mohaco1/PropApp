// UAT-only: a "note about this screen" box on every window, including the setup intro, usual arrangements and what-happens-next screens.
const { chromium, devices } = require('playwright');
const res=[];const ok=(n,p,d='')=>res.push({n,p:!!p,d:String(d).slice(0,300)});
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPhone 13']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto('file:///home/user/rpharmacy/uat/app/rpharmacy-uat-testing.html');await p.waitForTimeout(1500);
 await p.locator('main button',{hasText:'Set up your pharmacy'}).click();await p.waitForTimeout(300);
 ok('setup screens have "UAT note about this screen"',await p.evaluate(()=>!!document.querySelector('#editor details.uat-screen')));
 await p.fill('#editor input >> nth=0','T');await p.fill('#editor input >> nth=1','1 St');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(300);
 await p.fill('#editor input >> nth=0','Alex Owner');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(300);
 await p.locator('#editor .d-tiles>label',{hasText:'Home delivery'}).first().click();await p.locator('#editor button',{hasText:'Save service selection'}).click();await p.waitForTimeout(400);
 const intro=await p.evaluate(()=>({intro:!!document.querySelector('#editor .hy-intro'),note:!!document.querySelector('#editor details.uat-screen'),strip:!!document.querySelector('#editor .uat-strip')}));
 ok('the service intro has the note box and no misleading question strip',intro.intro&&intro.note&&!intro.strip,JSON.stringify(intro));
 await p.evaluate(()=>{const d=document.querySelector('#editor details.uat-screen');d.open=true;d.querySelector('textarea').value='Intro wording test note (fictional)';});
 await p.locator('#editor details.uat-screen .uat-save').click();await p.waitForTimeout(400);
 const saved=await p.evaluate(()=>({msg:document.querySelector('#editor details.uat-screen .uat-msg').textContent,notes:Object.values(UAT.data().notes||{}).map(n=>n.page+' :: '+n.text)}));
 ok('saving it adds a UAT note labelled with the screen',/Saved to UAT notes/.test(saved.msg)&&saved.notes.some(n=>/Setup · Home delivery/.test(n)&&/Intro wording test note/.test(n)),JSON.stringify(saved));
 ok('app data unchanged by the note',await p.evaluate(()=>!JSON.stringify(state).includes('Intro wording test note')));
 ok('no script errors',!errs.length,errs.join(' | '));
 for(const x of res)console.log((x.p?'PASS ':'FAIL ')+x.n+(x.p?'':' · '+x.d));console.log(res.filter(x=>x.p).length+'/'+res.length+' passed');await b.close();})();
