// Screenshot rapidi di un sito già buildato (dist/<id>) per il controllo visivo durante lo sviluppo.
// Uso: node tools/shots.js <id> [porta] [pagine separate da virgola] [larghezze separate da virgola]
//   es. node tools/shots.js osteria 4201 index,menu 1440,390
// Output: qa/shots/<id>/<pagina>-<larghezza>.png (pagina intera) + errori JS/overflow in console.
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright-core');
const { createServer } = require('./serve');

const ROOT = path.resolve(__dirname, '..');
const [id, portArg, pagesArg, widthsArg] = process.argv.slice(2);
if (!id) { console.error('Uso: node tools/shots.js <id> [porta] [pagine] [larghezze]'); process.exit(1); }
const port = Number(portArg || 4200);
const pages = (pagesArg || 'index,menu,storia,contatti').split(',');
const VP = { 1440: [1440, 900], 1920: [1920, 1080], 1024: [1024, 768], 768: [768, 1024], 390: [390, 844], 360: [360, 740] };
const widths = (widthsArg || '1440,768,390').split(',').map(Number);
const out = path.join(ROOT, 'qa', 'shots', id);

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const server = createServer(path.join(ROOT, 'dist')).listen(port);
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge' });
  try {
    for (const w of widths) {
      const [vw, vh] = VP[w] || [w, 900];
      const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, isMobile: vw < 500, hasTouch: vw < 1100 });
      for (const p of pages) {
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
        await page.goto(`http://localhost:${port}/${id}/${p}.html`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        // forza la comparsa degli elementi [data-reveal] e il caricamento delle immagini lazy
        await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
        await page.evaluate(async () => {
          document.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
          document.querySelectorAll('[data-reveal]').forEach(e => e.classList.add('is-visible'));
          await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
          await Promise.all([...document.images].map(i => i.decode ? i.decode().catch(() => 0) : 0));
        });
        await page.waitForTimeout(300);
        const over = await page.evaluate(() => {
          const W = document.documentElement.clientWidth, bad = [];
          document.querySelectorAll('body *').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width && (r.right > W + 1 || r.left < -1) && getComputedStyle(el).position !== 'fixed') {
              let p = el.parentElement, clipped = false;
              while (p && p !== document.body) { const s = getComputedStyle(p); if (/(hidden|clip|auto|scroll)/.test(s.overflowX)) { clipped = true; break; } p = p.parentElement; }
              if (!clipped) bad.push(el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '') + ` [${Math.round(r.left)}→${Math.round(r.right)}]`);
            }
          });
          return { scroll: document.documentElement.scrollWidth > W, bad: bad.slice(0, 8) };
        });
        const file = path.join(out, `${p}-${w}.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log(`${p} @${w}: ${errors.length ? 'ERRORI JS: ' + errors.join(' | ') : 'js ok'}; ${over.scroll || over.bad.length ? 'OVERFLOW ' + over.bad.join(', ') : 'nessun overflow'} → ${path.relative(ROOT, file)}`);
        await page.close();
      }
      await ctx.close();
    }
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
