// Builds the app into one HTML file (app/dist/propapp.html) so it can run from a link or offline.
// The UAT build also embeds the fictional example pharmacy (Wattle Grove) from uat/demo.
const esbuild = require('esbuild'); const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const r = await esbuild.build({ entryPoints: [path.join(ROOT, 'src/main.js')], bundle: true, write: false, format: 'iife', minify: process.argv.includes('--min'), loader: { '.css': 'text', '.json': 'json' }, target: 'es2020' });
  const js = r.outputFiles[0].text;
  const ex = path.resolve(ROOT, '../uat/demo/wattle-grove.json');
  const uat = process.argv.includes('--uat') ? 'window.PROPAPP_UAT=true;' : '';
  const example = fs.existsSync(ex) ? 'window.PROPAPP_EXAMPLE=' + JSON.stringify(JSON.parse(fs.readFileSync(ex, 'utf8'))).replace(/</g, '\\u003c') + ';' : '';
  const build = crypto.createHash('sha256').update(js + example).digest('hex').slice(0, 10);
  const page = `<title>PropApp</title><meta name="propapp-build" content="${build}">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="claude:viewport-fit-sides" content="cover">
<div id="app"></div><script>window.PROPAPP_BUILD=${JSON.stringify(build)};${uat}${example}</script><script>${js.replace(/<\/script/gi, '<\\/script')}</script>`;
  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'dist/propapp.html'), page);
  // a full standalone document for opening the file directly in a browser
  fs.writeFileSync(path.join(ROOT, 'dist/propapp-standalone.html'), `<!doctype html><html lang="en-AU"><head><meta charset="utf-8">${page.replace('<div id="app"></div>', '</head><body><div id="app"></div>')}</body></html>`);
  console.log('built', build, (page.length / 1024).toFixed(0) + ' KB');
})().catch(e => { console.error(e.message); process.exit(1); });
