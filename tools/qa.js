// QA completa sull'output statico (dist/ ed exports/). Richiede una build già fatta.
// Uso: node tools/qa.js [edge|chromium|firefox|webkit]   (default: edge, il Microsoft Edge installato)
//   chromium / firefox / webkit sono i browser di Playwright installati in .browsers/
//   (node node_modules/playwright-core/cli.js install chromium firefox webkit, con PLAYWRIGHT_BROWSERS_PATH=.browsers)
// Output: qa/report/<browser>/results.json e REPORT.md, screenshot in qa/screenshots/<browser>/
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync(path.join(ROOT, '.browsers'))) process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(ROOT, '.browsers');
const pw = require('playwright-core');
const { createServer } = require('./serve');

const ENGINES = {
  edge: { name: 'Microsoft Edge', launch: () => pw.chromium.launch({ channel: 'msedge' }) },
  chromium: { name: 'Chromium (motore di Google Chrome)', launch: () => pw.chromium.launch() },
  firefox: { name: 'Firefox', launch: () => pw.firefox.launch() },
  webkit: { name: 'WebKit (motore di Safari)', launch: () => pw.webkit.launch() }
};
const LABEL = (process.argv[2] || process.env.BROWSER || 'edge').toLowerCase();
if (!ENGINES[LABEL]) { console.error('Browser non valido: ' + LABEL + ' (edge|chromium|firefox|webkit)'); process.exit(2); }
const ENGINE_IDX = Object.keys(ENGINES).indexOf(LABEL);
const BROWSER_NAME = ENGINES[LABEL].name;
const SHOTS = path.join(ROOT, 'qa', 'screenshots', LABEL);
async function launchBrowser() {
  const b = await ENGINES[LABEL].launch();
  if (LABEL === 'firefox') { // Firefox non supporta l'opzione isMobile: si emula con viewport e touch
    const orig = b.newContext.bind(b);
    b.newContext = (o = {}) => { const { isMobile, ...rest } = o; return orig(rest); };
  }
  return b;
}
const SITES = ['trattoria', 'osteria', 'contemporaneo'];
const PAGES = ['index', 'menu', 'storia', 'contatti'];
const VIEWPORTS = {
  'desktop-1920': { width: 1920, height: 1080 },
  'desktop-1440': { width: 1440, height: 900 },
  'tablet-1024-landscape': { width: 1024, height: 768, touch: true },
  'tablet-768': { width: 768, height: 1024, touch: true },
  'mobile-390': { width: 390, height: 844, touch: true, mobile: true },
  'mobile-360': { width: 360, height: 740, touch: true, mobile: true }
};
const SHOT_VP = ['desktop-1920', 'tablet-768', 'mobile-390']; // screenshot salvati
const PORT_DIST = 4310 + 10 * ENGINE_IDX, PORT_EXP = PORT_DIST + 1;
const SUB = '/clienti/demo/'; // gli export vengono serviti in una sottocartella

const results = { started: new Date().toISOString(), checks: [], pages: [], interactions: [], exports: [], perf: [] };
const fail = [];
function check(scope, name, ok, detail = '') {
  results.checks.push({ scope, name, ok, detail });
  if (!ok) fail.push(`${scope} — ${name}${detail ? ': ' + detail : ''}`);
}

async function auditPage(browser, url, label, vpName, vp, shotPath) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.mobile, hasTouch: !!vp.touch, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [], failed = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('requestfailed', r => failed.push(r.url() + ' ' + (r.failure() || {}).errorText));
  page.on('response', r => { if (r.status() >= 400) failed.push(r.url() + ' HTTP ' + r.status()); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
    document.querySelectorAll('[data-reveal]').forEach(e => e.classList.add('is-visible'));
    await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
    await Promise.all([...document.images].map(i => i.decode ? i.decode().catch(() => 0) : 0));
  });
  await page.waitForTimeout(250);
  const a = await page.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const out = { scrollW: document.documentElement.scrollWidth, W };
    // elementi oltre il bordo destro non contenuti da un overflow
    const off = [];
    document.querySelectorAll('body *').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (r.right > W + 1 || r.left < -1) {
        let p = el.parentElement, clipped = false;
        while (p && p !== document.documentElement) { const s = getComputedStyle(p); if (/(hidden|clip|auto|scroll)/.test(s.overflowX)) { clipped = true; break; } p = p.parentElement; }
        if (!clipped) off.push(el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]);
      }
    });
    out.offscreen = [...new Set(off)].slice(0, 6);
    // immagini rotte, senza alt, senza dimensioni, deformate
    const imgs = [...document.images];
    out.imgCount = imgs.length;
    out.broken = imgs.filter(i => !i.naturalWidth).map(i => i.currentSrc || i.src);
    out.noAlt = imgs.filter(i => !i.hasAttribute('alt')).map(i => i.src);
    out.noDims = imgs.filter(i => !i.getAttribute('width') || !i.getAttribute('height')).map(i => i.src);
    out.distorted = imgs.filter(i => {
      if (!i.naturalWidth || !i.clientWidth || !i.clientHeight) return false;
      const fit = getComputedStyle(i).objectFit;
      if (fit === 'cover' || fit === 'contain') return false;
      const ra = i.naturalWidth / i.naturalHeight, rb = i.clientWidth / i.clientHeight;
      return Math.abs(ra - rb) / ra > 0.03;
    }).map(i => i.src.split('/').pop());
    // titoli che escono dal proprio box
    out.headingOverflow = [...document.querySelectorAll('h1,h2,h3')].filter(h => h.scrollWidth > h.clientWidth + 2 && getComputedStyle(h).overflowX === 'visible')
      .map(h => h.tagName + ': ' + h.textContent.trim().slice(0, 40));
    // testo che sborda dal proprio box (es. una parola lunga in un pulsante o in una colonna stretta)
    out.textOverflow = [...document.querySelectorAll('a, button, p, li, dd, dt, address, label, figcaption, td, th, h4, h5, h6')].filter(el => {
      const cs = getComputedStyle(el);
      if (cs.overflowX !== 'visible' || !el.clientWidth || cs.display === 'none' || el.closest('[hidden], dialog:not([open]), .sr-only')) return false;
      let a = el.parentElement; while (a && a !== document.body) { if (getComputedStyle(a).overflowX !== 'visible') return false; a = a.parentElement; }
      return el.scrollWidth > el.clientWidth + 2;
    }).map(el => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} "${el.textContent.trim().slice(0, 28)}" ${el.scrollWidth}>${el.clientWidth}`).slice(0, 6);
    out.h1 = document.querySelectorAll('h1').length;
    // salti nella gerarchia dei titoli
    let prev = 0; out.headingSkips = [];
    document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
      if (h.closest('dialog')) return;
      const lvl = +h.tagName[1]; if (prev && lvl > prev + 1) out.headingSkips.push(`h${prev}→h${lvl} "${h.textContent.trim().slice(0, 30)}"`); prev = lvl;
    });
    out.title = document.title; out.desc = (document.querySelector('meta[name=description]') || {}).content || '';
    out.og = !!document.querySelector('meta[property="og:image"]');
    out.lang = document.documentElement.lang;
    // bersagli di tocco nei controlli principali (header, menu mobile, barre, pulsanti)
    const sel = 'header a, header button, [data-mobile-nav] a, [data-mobile-nav] button, [data-actionbar] a, [data-actionbar] button, [data-menu-nav] a, .btn, button, [data-menu-filter], [data-scroller] button';
    out.smallTargets = [...new Set([...document.querySelectorAll(sel)].filter(el => {
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      if (!r.width || cs.visibility === 'hidden' || el.closest('[hidden]') || el.closest('dialog:not([open])')) return false;
      return r.height < 43.5 || r.width < 43.5;
    }).map(el => `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}" ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`))].slice(0, 10);
    // testo sotto i 12 px (leggibilità)
    out.tinyText = [...new Set([...document.querySelectorAll('body *')].filter(el => {
      if (!el.childNodes.length || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return false;
      const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('.sr-only') || el.closest('[hidden]') || el.closest('dialog:not([open])')) return false;
      return parseFloat(cs.fontSize) < 12;
    }).map(el => el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + ' ' + getComputedStyle(el).fontSize))].slice(0, 6);
    return out;
  });
  if (shotPath) { fs.mkdirSync(path.dirname(shotPath), { recursive: true }); await page.screenshot({ path: shotPath, fullPage: true, type: 'jpeg', quality: 72 }); }
  await ctx.close();
  const rec = { label, vp: vpName, ...a, errors, failed };
  results.pages.push(rec);
  const s = `${label} @${vpName}`;
  check(s, 'nessun errore JavaScript', !errors.length, errors.join(' | '));
  check(s, 'nessuna richiesta fallita', !failed.length, failed.join(' | '));
  check(s, 'nessuno scorrimento orizzontale', a.scrollW <= a.W && !a.offscreen.length, `${a.scrollW}>${a.W} ${a.offscreen.join(', ')}`);
  check(s, 'immagini caricate', !a.broken.length, a.broken.join(', '));
  check(s, 'immagini con alt e dimensioni', !a.noAlt.length && !a.noDims.length, [...a.noAlt, ...a.noDims].join(', '));
  check(s, 'immagini non deformate', !a.distorted.length, a.distorted.join(', '));
  check(s, 'titoli dentro i contenitori', !a.headingOverflow.length, a.headingOverflow.join(' | '));
  check(s, 'testi e pulsanti dentro il proprio box', !a.textOverflow.length, a.textOverflow.join(' | '));
  check(s, 'un solo h1 e gerarchia senza salti', a.h1 === 1 && !a.headingSkips.length, `h1=${a.h1} ${a.headingSkips.join(', ')}`);
  check(s, 'title, description, og:image, lang', !!a.title && a.desc.length > 50 && a.og && a.lang === 'it', `${a.title} | ${a.desc.length}`);
  if (vp.touch) check(s, 'bersagli di tocco ≥ 44 px', !a.smallTargets.length, a.smallTargets.join(', '));
  check(s, 'testo ≥ 12 px', !a.tinyText.length, a.tinyText.join(', '));
}

async function interactions(browser, base, id) {
  const R = (name, ok, detail) => { results.interactions.push({ site: id, name, ok, detail }); check(`${id} interazioni`, name, ok, detail); };
  // --- menu mobile ---
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
    const t = p.locator('[data-nav-toggle]');
    R('hamburger visibile su smartphone', await t.isVisible(), '');
    await t.click();
    await p.waitForTimeout(350);
    const open = await p.evaluate(() => ({ exp: document.querySelector('[data-nav-toggle]').getAttribute('aria-expanded'), hidden: document.querySelector('[data-mobile-nav]').hidden, focus: document.activeElement && document.activeElement.closest('[data-mobile-nav]') !== null, links: [...document.querySelectorAll('[data-mobile-nav] a')].filter(a => a.getBoundingClientRect().height > 0).length }));
    R('hamburger apre il pannello (aria-expanded, focus nel pannello, 4 link visibili)', open.exp === 'true' && !open.hidden && open.focus && open.links >= 4, JSON.stringify(open));
    await p.screenshot({ path: path.join(SHOTS, id, 'menu-mobile-aperto.jpg'), type: 'jpeg', quality: 72 });
    await p.keyboard.press('Escape');
    const closed = await p.evaluate(() => ({ exp: document.querySelector('[data-nav-toggle]').getAttribute('aria-expanded'), hidden: document.querySelector('[data-mobile-nav]').hidden, focusOnToggle: document.activeElement === document.querySelector('[data-nav-toggle]') }));
    R('Esc chiude il pannello e riporta il focus sul pulsante', closed.exp === 'false' && closed.hidden && closed.focusOnToggle, JSON.stringify(closed));
    await t.click(); await p.waitForTimeout(300);
    await p.locator('[data-mobile-nav] a[href="menu.html"]').first().click();
    await p.waitForLoadState('networkidle');
    R('link del pannello porta alla pagina Menu', p.url().endsWith('menu.html'), p.url());
    R('nessun errore JS durante la navigazione mobile', !errs.length, errs.join(' | '));
    await ctx.close();
  }
  // --- tastiera, skip link, focus visibile, dialog demo ---
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
    // In Safari/WebKit il Tab semplice salta i link (salvo impostazione dell'utente): lo skip link ha
    // tabindex="0" proprio per restare il primo elemento raggiungibile anche lì. Si prova il Tab semplice ovunque.
    const TAB = 'Tab';
    await p.keyboard.press(TAB);
    const first = await p.evaluate(() => document.activeElement.className);
    R(`primo ${TAB} sullo skip link`, /skip-link/.test(first), first);
    await p.keyboard.press('Enter');
    await p.waitForTimeout(200);
    R('skip link porta al contenuto', await p.evaluate(() => document.activeElement.id === 'contenuto' || location.hash === '#contenuto'), '');
    // 12 tab: ogni elemento a fuoco ha un indicatore visibile
    await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
    const noRing = [];
    for (let i = 0; i < 14; i++) {
      await p.keyboard.press(TAB);
      const f = await p.evaluate(() => {
        const el = document.activeElement; if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none');
        return { ring, txt: (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 30), visible: el.getBoundingClientRect().width > 0 };
      });
      if (f && (!f.ring || !f.visible)) noRing.push(f.txt);
    }
    R('focus visibile sui primi 14 elementi della home', !noRing.length, noRing.join(', '));
    // dialog demo dal pulsante Prenota
    const booking = p.locator('[data-demo="booking"]').first();
    if (await booking.count()) {
      await booking.click();
      const isOpen = await p.evaluate(() => document.getElementById('demo-dialog').open);
      const title = await p.textContent('#demo-dialog-title');
      await p.screenshot({ path: path.join(SHOTS, id, 'dialog-prenotazione.jpg'), type: 'jpeg', quality: 72 });
      await p.keyboard.press('Escape');
      const closed = await p.evaluate(() => !document.getElementById('demo-dialog').open);
      R('Prenota (demo) apre la finestra dimostrativa e Esc la chiude', isOpen && closed && /Prenotazione/.test(title), title);
    } else R('Prenota configurato come link esterno', true, '');
    // tutti i pulsanti demo hanno un testo nel dialog
    const kinds = await p.evaluate(() => [...new Set([...document.querySelectorAll('[data-demo]')].map(b => b.dataset.demo))]);
    const known = await p.evaluate(() => Object.keys(JSON.parse(document.getElementById('demo-texts').textContent)));
    R('ogni pulsante dimostrativo ha un testo dedicato', kinds.every(k => known.includes(k)), kinds.join(','));
    await ctx.close();
  }
  // --- indice categorie del menu ---
  {
    for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844, isMobile: true, hasTouch: true }]) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, reducedMotion: 'reduce' });
      const p = await ctx.newPage();
      await p.goto(base + 'menu.html', { waitUntil: 'networkidle' });
      const links = p.locator('[data-menu-nav] a[href^="#"]');
      const n = await links.count();
      R(`menu @${vp.width}: indice categorie presente`, n >= 4, String(n));
      if (n >= 3) {
        const href = await links.nth(2).getAttribute('href');
        await links.nth(2).click();
        await p.waitForTimeout(700);
        const pos = await p.evaluate(sel => {
          const t = document.querySelector(sel); const r = t.getBoundingClientRect();
          // solo barre sticky/fixed che stanno sopra la sezione anche in orizzontale (un indice laterale non la copre)
          const covers = [...document.querySelectorAll('[data-header], [data-menu-nav]')].map(e => {
            const cs = getComputedStyle(e), b = e.getBoundingClientRect();
            const sticky = cs.position === 'sticky' || cs.position === 'fixed' || (e.parentElement && getComputedStyle(e.parentElement).position === 'sticky');
            const overlapX = b.left < r.right && b.right > r.left;
            return sticky && overlapX && b.top < r.top + 5 ? b.bottom : 0;
          });
          return { top: Math.round(r.top), coveredBy: Math.round(Math.max(0, ...covers)), vh: innerHeight, active: (document.querySelector('[data-menu-nav] a.is-active') || {}).getAttribute && document.querySelector('[data-menu-nav] a.is-active').getAttribute('href') };
        }, href);
        R(`menu @${vp.width}: il link categoria porta alla sezione, non coperta da barre`, pos.top >= pos.coveredBy - 2 && pos.top < pos.vh * 0.6, JSON.stringify(pos));
        R(`menu @${vp.width}: categoria attiva evidenziata`, pos.active === href, `${pos.active} vs ${href}`);
      }
      if (await p.locator('[data-menu-filter]').count()) {
        const before = await p.locator('[data-tags]:visible').count();
        await p.locator('[data-menu-filter]').first().click();
        const after = await p.locator('[data-tags]:visible').count();
        const status = await p.textContent('[data-filter-status]');
        const pressed = await p.getAttribute('[data-menu-filter]', 'aria-pressed');
        await p.locator('[data-menu-filter]').first().click();
        const back = await p.locator('[data-tags]:visible').count();
        R(`menu @${vp.width}: filtro vegetariano funziona e si annuncia`, after > 0 && after < before && back === before && pressed === 'true' && /piatt/.test(status), `${before}→${after}→${back} "${status}"`);
      }
      await ctx.close();
    }
  }
  // --- galleria scorrevole ---
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    for (const pg of PAGES) {
      await p.goto(base + pg + '.html', { waitUntil: 'networkidle' });
      if (!(await p.locator('[data-scroller]').count())) continue;
      const sc = p.locator('[data-scroller]').first();
      await sc.scrollIntoViewIfNeeded();
      const static_ = await sc.evaluate(e => e.classList.contains('is-static'));
      if (static_) { R(`galleria (${pg}): tutto visibile, frecce nascoste`, true, ''); continue; }
      const prevDisabled = await sc.locator('[data-scroller-prev]').isDisabled();
      const x0 = await sc.locator('[data-scroller-track]').evaluate(e => e.scrollLeft);
      await sc.locator('[data-scroller-next]').click(); await p.waitForTimeout(400);
      const x1 = await sc.locator('[data-scroller-track]').evaluate(e => e.scrollLeft);
      await sc.locator('[data-scroller-prev]').click(); await p.waitForTimeout(400);
      const x2 = await sc.locator('[data-scroller-track]').evaluate(e => e.scrollLeft);
      R(`galleria (${pg}): frecce avanti/indietro funzionano`, prevDisabled && x1 > x0 && x2 < x1, `${x0}→${x1}→${x2}`);
    }
    await ctx.close();
  }
  // --- link interni e ancore ---
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    const broken = [];
    for (const pg of PAGES) {
      await p.goto(base + pg + '.html', { waitUntil: 'domcontentloaded' });
      const hrefs = await p.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => ({ raw: a.getAttribute('href'), abs: a.href })));
      for (const h of hrefs) {
        if (/^(https?:|mailto:|tel:)/.test(h.raw) && !h.abs.startsWith(new URL(base).origin)) continue;
        if (h.raw === '../index.html') continue; // collegamento alla raccolta demo
        const [file, hash] = h.abs.split('#');
        const res = await ctx.request.get(file);
        if (res.status() !== 200) { broken.push(`${pg}: ${h.raw} (${res.status()})`); continue; }
        if (hash) {
          const html = await res.text();
          if (!new RegExp(`id="${hash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(html)) broken.push(`${pg}: ${h.raw} (ancora mancante)`);
        }
        if (h.raw.startsWith('/')) broken.push(`${pg}: ${h.raw} (percorso assoluto: non funziona in sottocartella)`);
      }
    }
    R('tutti i link interni e le ancore risolvono', !broken.length, broken.join(' | '));
    await ctx.close();
  }
  // --- movimento ridotto ---
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
    const hidden = await p.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter(e => parseFloat(getComputedStyle(e).opacity) < 1).length);
    R('prefers-reduced-motion: nessun contenuto nascosto in attesa di animazione', hidden === 0, String(hidden));
    await ctx.close();
  }
  // --- senza JavaScript i contenuti restano visibili ---
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    const p = await ctx.newPage();
    await p.goto(base + 'menu.html', { waitUntil: 'domcontentloaded' });
    const st = await p.evaluate(() => ({ hidden: [...document.querySelectorAll('[data-reveal]')].filter(e => parseFloat(getComputedStyle(e).opacity) < 1).length, dishes: document.querySelectorAll('[data-tags]').length }));
    R('senza JavaScript il menu resta leggibile', st.hidden === 0 && st.dishes > 10, JSON.stringify(st));
    await ctx.close();
  }
}

async function perf(browser, base, id) {
  for (const [name, vp] of [['desktop-1440', { width: 1440, height: 900 }], ['mobile-390', { width: 390, height: 844, isMobile: true, hasTouch: true }]]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch });
    const p = await ctx.newPage();
    await p.addInitScript(() => {
      // LCP e layout-shift non esistono in tutti i motori: dove mancano il valore resta null
      const types = (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes) || [];
      window.__lcp = types.includes('largest-contentful-paint') ? 0 : null;
      window.__cls = types.includes('layout-shift') ? 0 : null;
      if (window.__lcp !== null) new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      if (window.__cls !== null) new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    });
    await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    const m = await p.evaluate(() => {
      const res = performance.getEntriesByType('resource');
      const nav = performance.getEntriesByType('navigation')[0];
      const local = res.filter(r => r.name.startsWith(location.origin));
      return {
        lcp: window.__lcp === null ? 'n/d' : Math.round(window.__lcp), cls: window.__cls === null ? 'n/d' : +window.__cls.toFixed(3), requests: res.length + 1,
        localKB: Math.round((local.reduce((s, r) => s + (r.encodedBodySize || 0), 0) + (nav.encodedBodySize || 0)) / 1024),
        imgKB: Math.round(local.filter(r => r.initiatorType === 'img').reduce((s, r) => s + (r.encodedBodySize || 0), 0) / 1024),
        external: [...new Set(res.filter(r => !r.name.startsWith(location.origin)).map(r => new URL(r.name).host))]
      };
    });
    results.perf.push({ site: id, vp: name, ...m });
    if (m.cls !== 'n/d') check(`${id} prestazioni @${name}`, 'CLS < 0,1 (stabilità del layout)', m.cls < 0.1, String(m.cls));
    check(`${id} prestazioni @${name}`, 'solo Google Fonts come servizio esterno', m.external.every(h => /fonts\.(googleapis|gstatic)\.com$/.test(h)), m.external.join(', '));
    await ctx.close();
  }
}

function auditExport(id) {
  const dir = path.join(ROOT, 'exports', id);
  const files = [];
  (function walk(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? walk(p) : files.push(path.relative(dir, p).replace(/\\/g, '/')); } })(dir);
  const others = SITES.filter(s => s !== id);
  const leaks = files.filter(f => others.some(o => f.includes(o)) || /portal|previews/.test(f));
  const html = files.filter(f => f.endsWith('.html'));
  const missing = [];
  let portalLink = false;
  for (const h of html) {
    const s = fs.readFileSync(path.join(dir, h), 'utf8');
    if (s.includes('../index.html') || s.includes('portal-link')) portalLink = true;
    const refs = [...s.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]).concat([...s.matchAll(/srcset="([^"]+)"/g)].flatMap(m => m[1].split(',').map(x => x.trim().split(' ')[0])));
    for (const r of refs) {
      if (/^(https?:|mailto:|tel:|#|data:)/.test(r)) continue;
      const f = r.split('#')[0]; if (!f) continue;
      if (!fs.existsSync(path.join(dir, f))) missing.push(`${h}: ${r}`);
    }
  }
  const css = fs.readFileSync(path.join(dir, 'css', 'style.css'), 'utf8');
  for (const m of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) if (!/^(data:|https?:)/.test(m[1]) && !fs.existsSync(path.join(dir, 'css', m[1]))) missing.push('style.css: ' + m[1]);
  const size = files.reduce((s, f) => s + fs.statSync(path.join(dir, f)).size, 0);
  results.exports.push({ id, files: files.length, sizeMB: +(size / 1048576).toFixed(2), leaks, missing, portalLink });
  check(`export ${id}`, 'contiene solo i file del sito (nessun altro template, nessuna pagina demo)', !leaks.length && !portalLink, leaks.join(', ') + (portalLink ? ' link alla raccolta demo' : ''));
  check(`export ${id}`, 'tutti gli asset referenziati esistono', !missing.length, missing.slice(0, 8).join(' | '));
  check(`export ${id}`, 'le 4 pagine esistono', PAGES.every(p => files.includes(p + '.html')), html.join(', '));
}

(async () => {
  for (const id of SITES) if (!fs.existsSync(path.join(ROOT, 'exports', id, 'index.html'))) throw new Error('Build mancante: eseguire prima node tools/build.js');
  fs.rmSync(SHOTS, { recursive: true, force: true });
  const sDist = createServer(path.join(ROOT, 'dist')).listen(PORT_DIST);
  const exportsServers = [];
  const browser = await launchBrowser();
  results.browser = BROWSER_NAME + ' ' + browser.version();
  try {
    // 1) pagina di selezione
    for (const vpName of ['desktop-1920', 'tablet-768', 'mobile-390', 'mobile-360']) {
      const vp = VIEWPORTS[vpName];
      await auditPage(browser, `http://localhost:${PORT_DIST}/index.html`, 'selezione demo', vpName, vp, SHOT_VP.includes(vpName) ? path.join(SHOTS, 'selezione', `selezione-${vpName}.jpg`) : null);
    }
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const p = await ctx.newPage();
      await p.goto(`http://localhost:${PORT_DIST}/index.html`);
      const btns = await p.$$eval('.demo__open', as => as.map(a => a.getAttribute('href')));
      const okLinks = [];
      for (const h of btns) { const r = await ctx.request.get(`http://localhost:${PORT_DIST}/${h}`); okLinks.push(r.status() === 200); }
      check('selezione demo', 'tre pulsanti verso le tre demo corrette', btns.join() === 'trattoria/index.html,osteria/index.html,contemporaneo/index.html' && okLinks.every(Boolean), btns.join(', '));
      await p.click('.demo__open >> nth=1'); await p.waitForLoadState();
      check('selezione demo', 'il pulsante apre la demo (clic reale)', p.url().endsWith('/osteria/index.html'), p.url());
      const back = p.locator('.portal-link');
      await back.click(); await p.waitForLoadState();
      check('selezione demo', '"Tutte le demo" riporta alla selezione', p.url().endsWith(`:${PORT_DIST}/index.html`), p.url());
      await ctx.close();
    }
    // 2) ogni sito: pagine × viewport (dalla raccolta dist/)
    for (const id of SITES) {
      for (const pg of PAGES) for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
        await auditPage(browser, `http://localhost:${PORT_DIST}/${id}/${pg}.html`, `${id}/${pg}`, vpName, vp, SHOT_VP.includes(vpName) ? path.join(SHOTS, id, `${pg}-${vpName}.jpg`) : null);
      }
      await interactions(browser, `http://localhost:${PORT_DIST}/${id}/`, id);
      await perf(browser, `http://localhost:${PORT_DIST}/${id}/`, id);
    }
    // 3) export singoli, serviti in una sottocartella
    for (const [i, id] of SITES.entries()) {
      auditExport(id);
      const port = PORT_EXP + i;
      const srv = createServer(path.join(ROOT, 'exports', id), SUB).listen(port); exportsServers.push(srv);
      for (const pg of PAGES) for (const vpName of ['desktop-1440', 'mobile-390']) {
        await auditPage(browser, `http://localhost:${port}${SUB}${pg}.html`, `export ${id}/${pg} (sottocartella ${SUB})`, vpName, VIEWPORTS[vpName], null);
      }
      await interactions(browser, `http://localhost:${port}${SUB}`, `export ${id}`);
    }
  } finally {
    await browser.close(); sDist.close(); exportsServers.forEach(s => s.close());
  }
  results.finished = new Date().toISOString();
  results.summary = { total: results.checks.length, passed: results.checks.filter(c => c.ok).length, failed: fail.length };
  const outDir = path.join(ROOT, 'qa', 'report', LABEL);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 1));
  const md = [`# Report QA automatica`, '', `- Browser: ${results.browser} (Playwright ${require('playwright-core/package.json').version})`, `- Eseguita: ${results.started} → ${results.finished}`,
    `- Controlli: **${results.summary.passed} superati / ${results.summary.total}** (${results.summary.failed} non superati)`, '',
    '## Non superati', '', ...(fail.length ? fail.map(f => '- ' + f) : ['- nessuno']), '',
    '## Prestazioni (indicative: server locale, nessuna limitazione di rete)', '', '| Sito | Viewport | LCP ms | CLS | Richieste | KB locali | di cui immagini KB | Host esterni |', '|---|---|---|---|---|---|---|---|',
    ...results.perf.map(p => `| ${p.site} | ${p.vp} | ${p.lcp} | ${p.cls} | ${p.requests} | ${p.localKB} | ${p.imgKB} | ${p.external.join(', ')} |`), '',
    '## Export', '', '| Sito | File | MB | Fughe | Asset mancanti |', '|---|---|---|---|---|',
    ...results.exports.map(e => `| ${e.id} | ${e.files} | ${e.sizeMB} | ${e.leaks.length} | ${e.missing.length} |`), ''].join('\n');
  fs.writeFileSync(path.join(outDir, 'REPORT.md'), md);
  console.log(`Controlli: ${results.summary.passed}/${results.summary.total} superati`);
  if (fail.length) { console.log('NON SUPERATI:'); fail.forEach(f => console.log(' - ' + f)); }
  process.exitCode = fail.length ? 1 : 0;
})().catch(e => { console.error(e); process.exit(2); });
