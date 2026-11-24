// Builds the UAT app: dev v27 (engine, unchanged) + Concept D layers, inserted before the final render().
// v30: adds the Concept D frontend (layers/conceptD-frontend.*), taken from design-studio/round3/concept-d.html.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'../dev/proprietor-hub.html'),'utf8');
const layer=fs.readFileSync(path.join(__dirname,'layers/conceptD-ui-layer.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'layers/conceptD-frontend.css'),'utf8');
const front=fs.readFileSync(path.join(__dirname,'layers/conceptD-frontend.js'),'utf8');
const s8=fs.readFileSync(path.join(__dirname,'layers/s8-rule.js'),'utf8');
const express=fs.readFileSync(path.join(__dirname,'layers/express.js'),'utf8');
// UAT-only tester tools: remove this line for any real release
const reviewFinish=fs.readFileSync(path.join(__dirname,'layers/review-finish.js'),'utf8');
const setupQ=fs.readFileSync(path.join(__dirname,'layers/setup-questions.js'),'utf8');
const procedures=fs.readFileSync(path.join(__dirname,'layers/procedures.js'),'utf8');
const serviceDone=fs.readFileSync(path.join(__dirname,'layers/service-done.js'),'utf8');
const otpParts=fs.readFileSync(path.join(__dirname,'layers/otp-parts.js'),'utf8');
const tidy=fs.readFileSync(path.join(__dirname,'layers/tidy.js'),'utf8');
const backupFix=fs.readFileSync(path.join(__dirname,'layers/backup-fix.js'),'utf8');
const confirmFb=fs.readFileSync(path.join(__dirname,'layers/confirm-fallback.js'),'utf8');
const insp=fs.readFileSync(path.join(__dirname,'layers/inspection.js'),'utf8');
const nsw=fs.readFileSync(path.join(__dirname,'layers/nsw-health.js'),'utf8');
const helpers=fs.readFileSync(path.join(__dirname,'layers/helpers.js'),'utf8');
const cx=fs.readFileSync(path.join(__dirname,'layers/codex-fixes.js'),'utf8');
const visit=fs.readFileSync(path.join(__dirname,'layers/visit.js'),'utf8');
const waiting=fs.readFileSync(path.join(__dirname,'layers/waiting.js'),'utf8');
const change=fs.readFileSync(path.join(__dirname,'layers/change.js'),'utf8');
const retest=fs.readFileSync(path.join(__dirname,'layers/retest-fixes.js'),'utf8');
const onboard=fs.readFileSync(path.join(__dirname,'layers/onboard.js'),'utf8');
const calm=fs.readFileSync(path.join(__dirname,'layers/calm.js'),'utf8');
const integrity=fs.readFileSync(path.join(__dirname,'layers/integrity.js'),'utf8');
const guide=fs.readFileSync(path.join(__dirname,'layers/today-guide.js'),'utf8');
const words=fs.readFileSync(path.join(__dirname,'layers/words.js'),'utf8');
const uatTools=fs.readFileSync(path.join(__dirname,'layers/uat-tools.js'),'utf8');
// UAT only: the example pharmacy (made by demo/build-demo.js) and its loader.
const exampleData=fs.existsSync(path.join(__dirname,'demo/wattle-grove.json'))?JSON.parse(fs.readFileSync(path.join(__dirname,'demo/wattle-grove.json'),'utf8')):null;
const example=(exampleData?'window.RPH_EXAMPLE='+JSON.stringify({generated:exampleData.generated,backup:exampleData.backup}).replace(/</g,'\\u003c')+';\n':'')+fs.readFileSync(path.join(__dirname,'layers/example-site.js'),'utf8');
const code=layer+'\n/* ===== Concept D frontend CSS ===== */\nconst CD_CSS='+JSON.stringify(css)+';\n'+front+'\n'+s8+'\n'+express+'\n'+reviewFinish+'\n'+setupQ+'\n'+procedures+'\n'+serviceDone+'\n'+otpParts+'\n'+tidy+'\n'+backupFix+'\n'+confirmFb+'\n'+insp+'\n'+nsw+'\n'+helpers+'\n'+guide+'\n'+words+'\n'+cx+'\n'+visit+'\n'+waiting+'\n'+change+'\n'+retest+'\n'+onboard+'\n'+calm+'\n'+integrity+'\n'+uatTools+'\n'+example;
if(/<\/script/i.test(code))throw Error('layer must not contain a closing script tag');
const marker='\nrender();\n\n</script>';
const i=src.lastIndexOf(marker);if(i<0)throw Error('marker not found');
const buildId=require('crypto').createHash('sha256').update(code).digest('hex').slice(0,12);
let out=src.slice(0,i)+'\n'+code+'\nwindow.RPH_BUILD='+JSON.stringify(buildId)+';'+marker+src.slice(i+marker.length);
out=out.replace('<head>','<head><meta name="rph-build" content="'+buildId+'">');
out=out.replace(/<title>([^<]*)<\/title>/,'<title>R.Pharmacy UAT v36</title>');
fs.writeFileSync(path.join(__dirname,'app/rpharmacy-uat-v28-conceptD.html'),out);fs.writeFileSync(path.join(__dirname,'app/rpharmacy-uat-testing.html'),out.replace('<title>R.Pharmacy UAT v36</title>','<title>R.Pharmacy UAT testing</title>'));
const fileSha=require('crypto').createHash('sha256').update(out.replace('<title>R.Pharmacy UAT v36</title>','<title>R.Pharmacy UAT testing</title>')).digest('hex');
console.log('built',out.length,'bytes · build',buildId,'· sha256',fileSha);
