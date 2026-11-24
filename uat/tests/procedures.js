// Procedures built from the sources (DAA, OTP), no internal notes leaking into any draft. Fictional data.
const src=require('fs').readFileSync(__dirname+'/setup-round5.js','utf8');
const { chromium, devices } = require('playwright');eval(src.slice(src.indexOf('async function walk'),src.indexOf('(async()=>{')));
const APP='file:///home/user/rpharmacy/uat/app/'+(process.env.FILE||'rpharmacy-uat-testing.html');
const res=[];const ok=(n,p,d='')=>res.push({n,p:!!p,d:String(d).slice(0,300)});
(async()=>{const b=await chromium.launch();
 const r=await begin(b,['Dose administration aids','Opioid Treatment Program','Home delivery','Staged supply','Vaccination','Residential aged care','Pharmacist prescribing','Medicines review','Screening','Simple compounding','Complex compounding','Medicine adherence','Needle and syringe','Absence from work','Therapeutic vaping','Medicinal cannabis','Other funded'],false);
 // make DAA PPA-funded via the funding question
 await walk(r.p,x=>/How are DAAs funded/.test(x.lab));
 await r.p.evaluate(()=>{const l=[...document.querySelectorAll('#editor .rph-question label.fresh-option')].find(l=>/PPA/.test(l.textContent));l.querySelector('input').click();});
 await r.p.locator('#editor button',{hasText:/^Continue$/}).first().click();await r.p.waitForTimeout(200);
 await walk(r.p);
 const d=await r.p.evaluate(()=>({daa:sopDocument('daa'),otp:sopDocument('otp'),all:state.active.map(id=>sopDocument(id)).join('\n')}));
 ok('DAA procedure has numbered steps citing the Regulation (s 136, s 185)',/4\. Procedure\n1\. /.test(d.daa)&&/s 136\(1\)/.test(d.daa)&&/s 185\(3\)/.test(d.daa),d.daa.slice(0,300));
 ok('PPA-funded DAA adds written consent, eligibility, 7-year records and the claim deadline',/written consent/.test(d.daa)&&/eligibility/.test(d.daa)&&/7 years/.test(d.daa)&&/end of the next calendar month/.test(d.daa));
 ok('DAA no longer reads as "question · answer" lines',!/\? · /.test(d.daa),(d.daa.match(/.{0,40}\? · .{0,30}/)||[''])[0]);
 ok('OTP procedure cites the OTP Standards items (1(a), 5, 6, 1(f))',/1\(a\)/.test(d.otp)&&/Standards 5\)/.test(d.otp)&&/Standards 6\)/.test(d.otp));
 ok('parts still to write are listed under "Confirm before adoption"',/8\. Confirm before adoption[\s\S]*write the steps for missed doses/i.test(d.otp));
 const each=await r.p.evaluate(()=>state.active.map(id=>[id,sopDocument(id)]).filter(([,t])=>!(/4\. Procedure\n1\. /.test(t)&&/9\. Sources/.test(t)&&/8\. Confirm before adoption/.test(t))).map(([id])=>id));
 ok('every chosen service has a real procedure: numbered steps, sources, confirm list',each.length===0,JSON.stringify(each));
 ok('no internal development notes in any procedure',!/Full Draft 0\.2|workflow handover/i.test(d.all));
 ok('backup valid',await r.p.evaluate(()=>{try{validateBackup(portableBackup());return true;}catch(e){return e.message;}})===true);
 ok('no script errors',!r.errs.length,r.errs.join(' | '));
 for(const x of res)console.log((x.p?'PASS ':'FAIL ')+x.n+(x.p?'':' · '+x.d));console.log(res.filter(x=>x.p).length+'/'+res.length+' passed');await b.close();})();
