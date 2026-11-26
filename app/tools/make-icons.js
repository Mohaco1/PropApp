// Renders the PharmLedger app icon (Option C ledger + plus) to PNGs for the installable app. Run once: node tools/make-icons.js
const { chromium } = require('playwright'); const path = require('path');
// Same MARK as LOGO_MARK in src/ui.js; full-bleed off-white with a ~14% safe margin so Samsung's rounded mask never clips it.
const MARK = '<path d="M7 6.5h11.5a2 2 0 0 1 2 2v2.2h-2.5a2.3 2.3 0 0 0-2.3 2.3v6a2.3 2.3 0 0 0 2.3 2.3h2.5v2.2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2z" fill="#0f2942"/><rect x="9.2" y="6.5" width="1.7" height="19" fill="#fafaf8"/><path d="M21 11.5h3v3h3v3h-3v3h-3v-3h-3v-3h3z" fill="#0f766e"/>';
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  for (const n of [180, 192, 512]) { await p.setViewportSize({ width: n, height: n });
    await p.setContent(`<body style="margin:0;background:#fafaf8"><svg width="${n}" height="${n}" viewBox="-4.5 -4.5 41 41" xmlns="http://www.w3.org/2000/svg"><rect x="-4.5" y="-4.5" width="41" height="41" fill="#fafaf8"/>${MARK}</svg></body>`);
    await p.screenshot({ path: path.resolve(__dirname, '../pwa-assets/icon-' + n + '.png') }); }
  await b.close(); console.log('icons written'); })();
