// Shared: a real Express setup (two services) so backups validate. Fictional data. Taken from backup-after-setup.js.
const APP='file:///home/user/rpharmacy/uat/app/rpharmacy-uat-testing.html';
module.exports=async function setupPharmacy(p){
 await p.goto(APP);await p.waitForTimeout(1500);await p.evaluate(()=>{if(D.phone){D.applyView(false);render();}});
 await p.locator('main button',{hasText:'Set up your pharmacy'}).click();await p.waitForTimeout(300);
 await p.fill('#editor input >> nth=0','Harbourview Test Pharmacy');await p.fill('#editor input >> nth=1','1 Test Street');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(300);
 await p.fill('#editor input >> nth=0','Alex Owner');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(300);
 
 for(const s of ['Dose administration aids','Home delivery'])await p.locator('#editor .d-tiles>label',{hasText:s}).first().click();
 await p.locator('#editor button',{hasText:'Save service selection'}).click();await p.waitForTimeout(400);
 let guard=0,answered=0;
 while(guard++<120){const x=await p.evaluate(()=>{const ed=$('editor');if(!ed.open)return{closed:true};return{t:ed.querySelector('#dialog-title')?.textContent||'',opts:[...ed.querySelectorAll('.fresh-option')].map(b=>b.textContent.trim()),checks:ed.querySelectorAll('.rph-question label.fresh-option:not(:has(+ #qm-describe-Other)) input[type=checkbox]').length,inputs:[...ed.querySelectorAll('input:not([type=checkbox]):not([type=radio]),textarea')].filter(i=>i.offsetParent&&!i.closest('.uat-q')).length,buttons:[...ed.querySelectorAll('button')].map(b=>b.textContent.trim())};});
  if(x.closed||/Pharmacy setup complete/.test(x.t))break;
  if(x.buttons.includes('Start')){await p.locator('#editor button',{hasText:/^Start$/}).click();await p.waitForTimeout(250);continue;}
  if(x.buttons.some(y=>/That.s how we do it/.test(y))){await p.locator('#editor button',{hasText:/That.s how we do it/}).click();await p.waitForTimeout(250);continue;}
  if(/Service setup complete/.test(x.t)){const nx=x.buttons.find(y=>/Continue to next section|Finish pharmacy setup/.test(y));await p.locator('#editor button',{hasText:nx}).first().click();await p.waitForTimeout(250);continue;}
  answered++;
  if(x.checks){await p.evaluate(m=>{const c=$('editor').querySelectorAll('.rph-question label.fresh-option:not(:has(+ #qm-describe-Other)) input[type=checkbox]');c[0].click();if(m&&c[1])c[1].click();},false);}
  else if(x.opts.length){const pick=x.opts.find(o=>/Draft it for me/.test(o))||x.opts.find(o=>!/Needs verification|Different local|Other|Someone else|our own/.test(o))||x.opts[0];await p.locator('#editor .fresh-option',{hasText:pick}).first().click();await p.waitForTimeout(200);continue;}
  else if(x.inputs){await p.evaluate(()=>{for(const i of [...$('editor').querySelectorAll('input:not([type=checkbox]):not([type=radio]),textarea')].filter(i=>i.offsetParent&&!i.closest('.uat-q'))){i.value='Test value';i.dispatchEvent(new Event('input',{bubbles:true}));}});}
  const c=x.buttons.find(y=>/^(Continue|Save|Next)/.test(y));if(!c)break;await p.locator('#editor button',{hasText:c}).first().click();await p.waitForTimeout(200);}
};
