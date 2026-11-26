// Renders the Sigil S-loop app icon (P-06 coastal gradient) to PNGs for the installable app. Run once: node tools/make-icons.js
const { chromium } = require('playwright'); const path = require('path');
// Same path as LOGO_PATH in src/ui.js; full-bleed off-white with a safe margin so Samsung's rounded mask never clips the loop.
const PATH = 'M66 30c-3-7-10-10-17-10-10 0-17 6-17 14 0 18 36 12 36 31 0 9-8 15-18 15-8 0-15-4-18-11';
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  for (const n of [180, 192, 512]) { await p.setViewportSize({ width: n, height: n });
    await p.setContent(`<body style="margin:0;background:#f8fafc"><svg width="${n}" height="${n}" viewBox="-14 -14 128 128" xmlns="http://www.w3.org/2000/svg"><rect x="-14" y="-14" width="128" height="128" fill="#f8fafc"/><path d="${PATH}" fill="none" stroke="#0f766e" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/></svg></body>`);
    await p.screenshot({ path: path.resolve(__dirname, '../pwa-assets/icon-' + n + '.png') }); }
  await b.close(); console.log('icons written'); })();
