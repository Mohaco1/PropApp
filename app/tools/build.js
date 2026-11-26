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
  const page = `<title>Sigil</title><meta name="propapp-build" content="${build}">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="claude:viewport-fit-sides" content="cover">
<div id="app"></div><script>window.PROPAPP_BUILD=${JSON.stringify(build)};${uat}${example}</script><script>${js.replace(/<\/script/gi, '<\\/script')}</script>`;
  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'dist/propapp.html'), page);
  // a full standalone document for opening the file directly in a browser
  // Standalone file: a strict Content Security Policy inside <head> (nothing can be loaded from or sent to the network).
  const CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
  fs.writeFileSync(path.join(ROOT, 'dist/propapp-standalone.html'), `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${CSP}">${page.replace('<div id="app"></div>', '</head><body><div id="app"></div>')}</body></html>`);
  // Installable app (V3-01; owner 25 Nov: prepared and tested locally, not deployed). Same app, served as files from
  // one https origin: index.html, manifest, offline worker and icons in dist/pwa. CSP allows only that origin.
  const PCSP = "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data: blob:; font-src data:; manifest-src 'self'; worker-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'";
  const pdir = path.join(ROOT, 'dist/pwa'); fs.mkdirSync(pdir, { recursive: true });
  const head = `<meta http-equiv="Content-Security-Policy" content="${PCSP}"><link rel="manifest" href="./manifest.webmanifest"><link rel="apple-touch-icon" href="./icon-180.png"><meta name="theme-color" content="#005792"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Sigil"><meta name="apple-mobile-web-app-status-bar-style" content="default">`;
  fs.writeFileSync(path.join(pdir, 'index.html'), `<!doctype html><html lang="en-AU"><head><meta charset="utf-8">${head}${page.replace('<div id="app"></div><script>', '</head><body><div id="app"></div><script>window.PROPAPP_PWA=true;')}</body></html>`);
  fs.writeFileSync(path.join(pdir, 'manifest.webmanifest'), JSON.stringify({ name: 'Sigil', short_name: 'Sigil', description: 'Built for the owner’s side of the counter.', id: './', start_url: './', scope: './', display: 'standalone', background_color: '#f8fafc', theme_color: '#005792', icons: [192, 512].flatMap(n => ['any', 'maskable'].map(purpose => ({ src: './icon-' + n + '.png', sizes: n + 'x' + n, type: 'image/png', purpose }))) }, null, 1));
  fs.writeFileSync(path.join(pdir, 'sw.js'), fs.readFileSync(path.join(ROOT, 'pwa-assets/sw.js'), 'utf8').replace('__BUILD__', build));
  for (const n of [180, 192, 512]) fs.copyFileSync(path.join(ROOT, 'pwa-assets/icon-' + n + '.png'), path.join(pdir, 'icon-' + n + '.png'));
  console.log('built', build, (page.length / 1024).toFixed(0) + ' KB');
})().catch(e => { console.error(e.message); process.exit(1); });
