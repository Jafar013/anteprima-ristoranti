// Anteprime per la pagina di selezione: screenshot della home di ogni sito (desktop 1440×900, smartphone 390×844)
// salvati in src/portal/previews/<id>-desktop.webp / -mobile.webp. Richiede una build già fatta (dist/).
// Uso: node tools/previews.js   (poi node tools/build.js per copiarle in dist/)
'use strict';
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { chromium } = require('playwright-core');
const { createServer } = require('./serve');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'src', 'portal', 'previews');
const SITES = ['trattoria', 'osteria', 'contemporaneo'];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = createServer(path.join(ROOT, 'dist')).listen(4190);
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge' });
  try {
    for (const id of SITES) {
      for (const [kind, vp, outW] of [['desktop', { width: 1440, height: 900 }, 1440], ['mobile', { width: 390, height: 844 }, 390]]) {
        const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: kind === 'mobile' ? 2 : 1, reducedMotion: 'reduce' });
        const page = await ctx.newPage();
        await page.goto(`http://localhost:4190/${id}/index.html`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await page.addStyleTag({ content: '.portal-bar{display:none!important}' });
        await page.waitForTimeout(400);
        const buf = await page.screenshot({ type: 'png' });
        await sharp(buf).resize({ width: kind === 'mobile' ? outW * 2 : outW }).webp({ quality: 80 }).toFile(path.join(OUT, `${id}-${kind}.webp`));
        await ctx.close();
        console.log(`✓ ${id} ${kind}`);
      }
    }
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
