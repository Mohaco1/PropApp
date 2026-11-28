// Renders every PharmLedger app icon from the exact Option C LOGO_MARK in src/ui.js (read from the file, never copied).
// Run once after a logo change: node tools/make-icons.js   (writes app/pwa-assets/, then rebuild).
//  icon-192/512.png            purpose "any": the in-app tile (ivory, rounded, hairline) on a transparent square.
//  icon-maskable-192/512.png   purpose "maskable": full-bleed ivory, mark inside a 66% circle (Android's safe zone is 80%).
//  apple-touch-icon.png (180)  full-bleed ivory (iOS rounds the corners itself; no transparency allowed).
//  favicon.svg, favicon-32.png the in-app tile.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const ui = fs.readFileSync(path.resolve(__dirname, '../src/ui.js'), 'utf8');
const MARK = (/export const LOGO_MARK = '([^']+)';/.exec(ui) || [])[1]; if (!MARK) throw Error('LOGO_MARK not found in src/ui.js');
const OUT = path.resolve(__dirname, '../pwa-assets');
// The tile exactly as logo() in ui.js draws it.
const tile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x=".5" y=".5" width="31" height="31" rx="7.5" fill="#fafaf8" stroke="#dbe3ea" stroke-width="1"/>${MARK}</svg>`;
// Full bleed: the mark's box (x 5–27, y 6.5–25.5) is centred on (16,16); `span` user units across the whole square.
const bleed = span => { const o = 16 - span / 2; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${o} ${o} ${span} ${span}"><rect x="${o}" y="${o}" width="${span}" height="${span}" fill="#fafaf8"/>${MARK}</svg>`; };
const jobs = [
  ['icon-192.png', 192, tile], ['icon-512.png', 512, tile],
  // farthest mark corner is 14.5 units from centre: 14.5 / 44 = 0.33 of the width, inside the 0.40 maskable safe radius
  ['icon-maskable-192.png', 192, bleed(44)], ['icon-maskable-512.png', 512, bleed(44)],
  ['apple-touch-icon.png', 180, bleed(40)], ['favicon-32.png', 32, tile]];
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  for (const [f, n, svg] of jobs) { await p.setViewportSize({ width: n, height: n });
    await p.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${n}px;height:${n}px}</style>${svg}`);
    await p.screenshot({ path: path.join(OUT, f), omitBackground: true }); }
  fs.writeFileSync(path.join(OUT, 'favicon.svg'), tile + '\n');
  for (const f of ['icon-180.png']) fs.rmSync(path.join(OUT, f), { force: true });
  await b.close(); console.log('icons written:', jobs.map(j => j[0]).concat('favicon.svg').join(', ')); })();
