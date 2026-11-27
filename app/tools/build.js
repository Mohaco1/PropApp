// Builds the app into one HTML file (app/dist/propapp.html) so it can run from a link or offline.
// The UAT build also embeds the fictional example pharmacy (Wattle Grove) from uat/demo.
const esbuild = require('esbuild'); const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
// D3-C: the sync API origin built into the installable app only (never into the single-file app). An https origin, or a
// local test server on 127.0.0.1. PROPAPP_OUT_DIR builds somewhere other than app/dist (the acceptance test uses it).
const API_ORIGIN = process.env.PROPAPP_API_ORIGIN || 'https://api.pharmledger.com.au';
if (!/^https:\/\/[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:\d{1,5})?$/i.test(API_ORIGIN) && !/^http:\/\/127\.0\.0\.1:\d{1,5}$/.test(API_ORIGIN)) { console.error('PROPAPP_API_ORIGIN must be https://<host> or http://127.0.0.1:<port>, not ' + API_ORIGIN); process.exit(1); }
const OUT = process.env.PROPAPP_OUT_DIR ? path.resolve(process.env.PROPAPP_OUT_DIR) : path.join(ROOT, 'dist');
(async () => {
  const r = await esbuild.build({ entryPoints: [path.join(ROOT, 'src/main.js')], bundle: true, write: false, format: 'iife', minify: process.argv.includes('--min'), loader: { '.css': 'text', '.json': 'json' }, target: 'es2020' });
  const js = r.outputFiles[0].text;
  const ex = path.resolve(ROOT, '../uat/demo/wattle-grove.json');
  const uat = process.argv.includes('--uat') ? 'window.PROPAPP_UAT=true;' : '';
  const example = fs.existsSync(ex) ? 'window.PROPAPP_EXAMPLE=' + JSON.stringify(JSON.parse(fs.readFileSync(ex, 'utf8'))).replace(/</g, '\\u003c') + ';' : '';
  const pageFor = build => `<title>PharmLedger</title><meta name="propapp-build" content="${build}">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="claude:viewport-fit-sides" content="cover">
<div id="app"></div><script>window.PROPAPP_BUILD=${JSON.stringify(build)};${uat}${example}</script><script>${js.replace(/<\/script/gi, '<\\/script')}</script>`;
  // Stage 3E: the build id covers everything that ships, not just the script: the HTML shell and both security
  // policies, the UAT flag, the manifest, the offline worker and the icons. Any change to them is a new build.
  const CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
  const PCSP = `default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data: blob:; font-src data:; manifest-src 'self'; worker-src 'self'; connect-src 'self' ${API_ORIGIN}; object-src 'none'; base-uri 'self'; form-action 'none'`;
  const head = `<meta http-equiv="Content-Security-Policy" content="${PCSP}"><link rel="manifest" href="./manifest.webmanifest"><link rel="apple-touch-icon" href="./icon-180.png"><meta name="theme-color" content="#0f2942"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="PharmLedger"><meta name="apple-mobile-web-app-status-bar-style" content="default">`;
  const manifest = JSON.stringify({ name: 'PharmLedger', short_name: 'PharmLedger', description: 'For the owner’s side of the counter.', id: './', start_url: './', scope: './', display: 'standalone', background_color: '#fafaf8', theme_color: '#0f2942', icons: [192, 512].flatMap(n => ['any', 'maskable'].map(purpose => ({ src: './icon-' + n + '.png', sizes: n + 'x' + n, type: 'image/png', purpose }))) }, null, 1);
  const swSrc = fs.readFileSync(path.join(ROOT, 'pwa-assets/sw.js'), 'utf8'), icons = [180, 192, 512].map(n => fs.readFileSync(path.join(ROOT, 'pwa-assets/icon-' + n + '.png')));
  const hash = crypto.createHash('sha256'); const pwaBoot = `window.PROPAPP_PWA=true;window.PROPAPP_API=${JSON.stringify(API_ORIGIN)};`;
  for (const part of [js, example, 'uat:' + uat, pageFor('__BUILD__'), CSP, PCSP, pwaBoot, head, manifest, swSrc, ...icons]) hash.update(part).update('\0');
  const build = hash.digest('hex').slice(0, 10);
  const page = pageFor(build);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'propapp.html'), page);
  // a full standalone document for opening the file directly in a browser
  // Standalone file: a strict Content Security Policy inside <head> (nothing can be loaded from or sent to the network).
  fs.writeFileSync(path.join(OUT, 'propapp-standalone.html'), `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${CSP}">${page.replace('<div id="app"></div>', '</head><body><div id="app"></div>')}</body></html>`);
  // Installable app (V3-01; owner 25 Nov: prepared and tested locally, not deployed). Same app, served as files from
  // one https origin: index.html, manifest, offline worker and icons in dist/pwa. CSP allows only that origin.
  const pdir = path.join(OUT, 'pwa'); fs.mkdirSync(pdir, { recursive: true });
  fs.writeFileSync(path.join(pdir, 'index.html'), `<!doctype html><html lang="en-AU"><head><meta charset="utf-8">${head}${page.replace('<div id="app"></div><script>', '</head><body><div id="app"></div><script>' + pwaBoot)}</body></html>`);
  fs.writeFileSync(path.join(pdir, 'manifest.webmanifest'), manifest);
  fs.writeFileSync(path.join(pdir, 'sw.js'), swSrc.replace(/__BUILD__/g, build));
  for (const n of [180, 192, 512]) fs.copyFileSync(path.join(ROOT, 'pwa-assets/icon-' + n + '.png'), path.join(pdir, 'icon-' + n + '.png'));
  console.log('built', build, (page.length / 1024).toFixed(0) + ' KB');
})().catch(e => { console.error(e.message); process.exit(1); });
