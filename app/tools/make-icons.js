// Renders the R. app icon (P-06 coastal gradient) to PNGs for the installable app. Run once: node tools/make-icons.js
const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  for (const n of [180, 192, 512]) { await p.setViewportSize({ width: n, height: n });
    await p.setContent(`<body style="margin:0"><div style="width:${n}px;height:${n}px;display:grid;place-items:center;background:linear-gradient(135deg,#008B82 0%,#005792 100%);color:#fff;font:600 ${Math.round(n * 0.42)}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;letter-spacing:-0.03em">R.</div></body>`);
    await p.screenshot({ path: path.resolve(__dirname, '../pwa-assets/icon-' + n + '.png') }); }
  await b.close(); console.log('icons written'); })();
