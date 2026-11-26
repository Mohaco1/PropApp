// Renders the PharmLedger app icon (Option C ledger + plus) to PNGs for the installable app. Run once: node tools/make-icons.js
const { chromium } = require('playwright'); const path = require('path');
// Same MARK as LOGO_MARK in src/ui.js; full-bleed off-white with a safe margin so Samsung's rounded mask never clips it.
const MARK = '<rect x="22" y="16" width="42" height="66" rx="7" fill="#0f766e"/><rect x="31" y="16" width="3.5" height="66" fill="#f8fafc"/><path d="M57 42h15v11h11v15H72v11H57V68H46V53h11z" fill="#005792" stroke="#f8fafc" stroke-width="4" stroke-linejoin="round" paint-order="stroke"/>';
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  for (const n of [180, 192, 512]) { await p.setViewportSize({ width: n, height: n });
    await p.setContent(`<body style="margin:0;background:#f8fafc"><svg width="${n}" height="${n}" viewBox="-14 -14 128 128" xmlns="http://www.w3.org/2000/svg"><rect x="-14" y="-14" width="128" height="128" fill="#f8fafc"/>${MARK}</svg></body>`);
    await p.screenshot({ path: path.resolve(__dirname, '../pwa-assets/icon-' + n + '.png') }); }
  await b.close(); console.log('icons written'); })();
