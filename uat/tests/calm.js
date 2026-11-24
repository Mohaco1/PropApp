// Design review fixes: bottom bar, header, one top card, short confirmations at the bottom, no phone list header, short dates. Fictional data.
const { chromium, devices } = require('playwright');
const res=[];const ok=(n,p,d='')=>res.push({n,p:!!p,d:String(d).slice(0,300)});
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({...devices['iPhone 13']})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto('file:///home/user/rpharmacy/uat/app/rpharmacy-uat-testing.html');await p.waitForTimeout(1500);
 await p.locator('main button',{hasText:'Set up your pharmacy'}).click();await p.waitForTimeout(300);
 await p.fill('#editor input >> nth=0','Birch Test Pharmacy');await p.fill('#editor input >> nth=1','1 Test St');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(250);
 const t=await p.evaluate(()=>{const s=document.getElementById('status');const r=s.getBoundingClientRect();return {vis:s.classList.contains('visible'),ok:s.classList.contains('cl-ok'),bottom:Math.round(innerHeight-r.bottom),top:Math.round(r.top),h:innerHeight};});
 ok('a "Saved" confirmation shows at the bottom of the screen, not over the title',t.vis&&t.ok&&t.bottom<120&&t.top>t.h/2,JSON.stringify(t));
 await p.waitForTimeout(3300);
 ok('and leaves after about 3 seconds',await p.evaluate(()=>!document.getElementById('status').classList.contains('visible')));
 await p.evaluate(require('./showcase-seed.js'));await p.waitForTimeout(600);
 await p.evaluate(()=>{if($('editor').open)$('editor').close();CD.go('overview');});await p.waitForTimeout(300);
 const h=await p.evaluate(()=>({nav:[...document.querySelectorAll('#cd-mob button')].map(b=>b.textContent),badge:[...document.querySelectorAll('#cd-bar .c')].filter(e=>getComputedStyle(e).display!=='none').length,
  cards:document.querySelectorAll('#cd-view .main > .ob-card, #cd-view .main > .vcard, #cd-view .main > .bkline, #cd-view .main > .howcard, #cd-view .main > .ob-ready, #cd-view .main .start3').length,
  thead:[...document.querySelectorAll('#cd-view .main table')].filter(t=>t.querySelector('tr[data-row^="today:"]')).map(t=>getComputedStyle(t.querySelector('thead')).display),status:document.querySelector('#cd-view .status')?.innerText}));
 ok('the bottom bar is Today, Reviews, Actions, Staff, More',JSON.stringify(h.nav)===JSON.stringify(['Today','Reviews','Actions','Staff','More']),JSON.stringify(h.nav));
 ok('the header no longer repeats the overdue count',h.badge===0,h.badge);
 ok('Today shows exactly one card above the list',h.cards===1,h.cards);
 ok('the phone list has no "Item / Due" header row',h.thead.every(d=>d==='none'),JSON.stringify(h.thead));
 ok('the status line is the date and one sentence',/^\w{3}, \d+ \w{3} · /.test(h.status||'')&&!/open jobs/.test(h.status||''),h.status);
 const d=await p.evaluate(()=>({same:RPH.shortDate(addInterval(today(),20,'days')),other:RPH.shortDate('2025-03-04'),tom:RPH.shortDate(addInterval(today(),1,'days'))}));
 ok('dates are short: no year this year, the year otherwise, "tomorrow" for tomorrow',!/20\d\d/.test(d.same)&&/2025/.test(d.other)&&d.tom==='tomorrow',JSON.stringify(d));
 await p.evaluate(()=>CD.go('more'));await p.waitForTimeout(200);
 ok('Calendar is under More',await p.evaluate(()=>[...document.querySelectorAll('#cd-view button[data-go="planner"]')].some(b=>b.offsetParent)));
 ok('no page errors',!errs.length,errs.join(' | '));
 await b.close();const f=res.filter(r=>!r.p);for(const r of res)console.log((r.p?'PASS ':'FAIL ')+r.n+(r.p?'':' :: '+r.d));console.log(res.length-f.length+'/'+res.length);process.exit(f.length?1:0);})();
