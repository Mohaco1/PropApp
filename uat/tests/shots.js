const { chromium } = require('playwright');
const O='/home/user/rpharmacy/uat/tests/out/';
(async()=>{const b=await chromium.launch();
for(const [dev,w,h] of [['desktop',1280,860],['mobile',390,844]]){const p=await b.newPage({viewport:{width:w,height:h}}); await p.addInitScript(()=>{try{localStorage.setItem('rph-uat-view','laptop')}catch(e){}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/user/rpharmacy/uat/app/rpharmacy-uat-v28-conceptD.html');await p.waitForTimeout(1500); await p.evaluate(()=>{try{if(D.phone){D.applyView(false);render();}}catch(e){}});
await p.screenshot({path:O+'s-'+dev+'-1landing.png'});
await p.locator('main button').first().click();await p.waitForTimeout(400);await p.screenshot({path:O+'s-'+dev+'-2site.png'});
await p.fill('#editor input >> nth=0','Harbourview Test Pharmacy');await p.fill('#editor input >> nth=1','1 Test St, Testville');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(400);
await p.screenshot({path:O+'s-'+dev+'-3owners.png'});
await p.fill('#editor input >> nth=0','Test Owner');await p.locator('#editor button',{hasText:'Continue'}).click();await p.waitForTimeout(400);
await p.locator('#editor .d-tiles>label',{hasText:'Dose administration'}).click();await p.locator('#editor button',{hasText:'Save service selection'}).click();await p.waitForTimeout(500);
await p.screenshot({path:O+'s-'+dev+'-4question.png'});
await p.evaluate(()=>{$('editor').close();reviewEditor('B1');});await p.waitForTimeout(400);await p.screenshot({path:O+'s-'+dev+'-5review.png'});
await p.evaluate(()=>{$('editor').close();gotoPage('actions');});await p.waitForTimeout(300);await p.locator('main button',{hasText:'Add Task'}).first().click();await p.waitForTimeout(400);await p.screenshot({path:O+'s-'+dev+'-6task.png'});
await p.evaluate(()=>{$('editor').close();gotoPage('overview');});await p.waitForTimeout(300);await p.screenshot({path:O+'s-'+dev+'-7today.png'});
console.log(dev,errs);await p.close();}
await b.close();})();
