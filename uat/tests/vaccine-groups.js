// New pharmacy setup: "Which vaccines are offered?" is a grouped tick list (owner decision 20 Nov), never a typing box. Phone and laptop. Fictional data.
const { chromium, devices } = require('playwright');
const res=[];const ok=(n,p,d='')=>res.push({n,p:!!p,d:String(d).slice(0,300)});
(async()=>{const b=await chromium.launch();
for(const dev of ['phone','laptop']){
 const ctx=dev==='phone'?await b.newContext({...devices['iPhone 13']}):await b.newContext({viewport:{width:1280,height:860}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto('file:///home/user/rpharmacy/uat/app/rpharmacy-uat-testing.html');await p.waitForTimeout(1500);
 if(dev==='laptop')await p.evaluate(()=>{if(D.phone){D.applyView(false);render();}});
 await p.locator('main button',{hasText:'Set up your pharmacy'}).click();await p.waitForTimeout(300);
 await p.fill('#editor input >> nth=0','Birch Test Pharmacy');await p.fill('#editor input >> nth=1','1 Test St');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(300);
 await p.fill('#editor input >> nth=0','Alex Owner');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(400);
 await p.locator('#editor .d-tiles>label',{hasText:'Vaccination'}).first().click();
 await p.locator('#editor button',{hasText:'Save service selection'}).click();await p.waitForTimeout(500);
 await p.locator('#editor button',{hasText:/^Start$/}).click();await p.waitForTimeout(350);
 let x=null;
 for(let i=0;i<6;i++){x=await p.evaluate(()=>{const ed=$('editor');return {vac:/Which vaccines are offered/.test(ed.innerText),groups:[...ed.querySelectorAll('.vgroup .vg-head b')].map(b=>b.textContent),boxes:[...ed.querySelectorAll('.vgroup input[type=checkbox]')].length,typing:[...ed.querySelectorAll('.rph-question input[type=text],.rph-question textarea')].filter(i=>i.offsetParent&&!i.closest('.uat-screen,.uat-strip')&&!/Other|note/i.test((i.closest('label')?.textContent||'')+(i.placeholder||'')+(i.getAttribute('aria-label')||''))).length};});
  if(x.vac)break;
  await p.evaluate(()=>{const o=[...$('editor').querySelectorAll('.fresh-option')].find(o=>!/Needs verification|Other/i.test(o.textContent));if(o)(o.querySelector('input')||o).click();});await p.waitForTimeout(200);
  const c=await p.evaluate(()=>[...$('editor').querySelectorAll('button')].filter(b=>b.offsetParent).map(b=>b.textContent.trim()).find(t=>/^Continue$/.test(t)));if(c){await p.locator('#editor button',{hasText:/^Continue$/}).first().click();await p.waitForTimeout(350);}}
 ok(dev+': setup asks "Which vaccines are offered?" as four groups of tick boxes',x&&x.vac&&JSON.stringify(x.groups)===JSON.stringify(['Seasonal and adult','Catch-up and childhood','Travel','Special programs'])&&x.boxes>=21,JSON.stringify(x));
 ok(dev+': no typing box for the vaccines themselves',x&&x.typing===0,JSON.stringify(x));if(x&&x.typing){console.log('BOX',await p.evaluate(()=>[...$('editor').querySelectorAll('.rph-question input[type=text],.rph-question textarea')].filter(i=>i.offsetParent).map(i=>JSON.stringify({ph:i.placeholder,aria:i.getAttribute('aria-label'),lab:(i.closest('label')?.textContent||'').trim().slice(0,80),prev:(i.previousElementSibling?.textContent||'').slice(0,80),parent:i.parentElement.className,val:i.value})).join('\n')));await p.screenshot({path:'/tmp/claude-0/-home-user/5b6e2225-6448-5853-b322-4bb4689ab85b/scratchpad/vbox-'+dev+'.png',fullPage:true});}
 await p.locator('#editor .vg-all').first().click();await p.waitForTimeout(150);
 ok(dev+': "Select all" ticks a whole group',await p.evaluate(()=>[...document.querySelector('#editor .vgroup').querySelectorAll('input[type=checkbox]')].every(c=>c.checked)));
 ok(dev+': no page errors',!errs.length,errs.join(' | '));await ctx.close();}
 await b.close();const f=res.filter(r=>!r.p);for(const r of res)console.log((r.p?'PASS ':'FAIL ')+r.n+(r.p?'':' :: '+r.d));console.log(res.length-f.length+'/'+res.length);process.exit(f.length?1:0);})();
