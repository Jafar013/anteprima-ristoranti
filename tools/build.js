// Build statico: genera
//   dist/                → pagina di selezione + i tre siti (dist/<id>/)
//   exports/<id>/        → ogni sito da solo, pronto per qualsiasi hosting statico
// Uso: node tools/build.js            (tutti i siti)
//      node tools/build.js trattoria  (solo un sito: dist/<id> ed exports/<id>)
'use strict';
const fs = require('fs');
const path = require('path');
const { makeContext, page } = require('./lib/core');
const { buildImages } = require('./lib/images');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const EXPORTS = path.join(ROOT, 'exports');

const readJSON = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const write = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };
const rm = d => fs.rmSync(d, { recursive: true, force: true });
const copyDir = (a, b) => fs.cpSync(a, b, { recursive: true });

function siteIds() {
  return fs.readdirSync(path.join(SRC, 'sites'), { withFileTypes: true })
    .filter(d => d.isDirectory()).map(d => d.name).sort();
}

function cssVars(config) {
  const c = config.colors, f = config.fonts;
  const lines = Object.entries(c).filter(([k]) => k !== 'themeColor')
    .map(([k, v]) => `  --c-${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v};`);
  lines.push(`  --font-display: ${f.display};`, `  --font-text: ${f.text};`);
  // Fallback metrici: un font di sistema ridimensionato (size-adjust) con la stessa larghezza media
  // del font web, così lo scambio con font-display: swap non sposta il layout (CLS).
  const faces = (f.fallbacks || []).map(fb => `@font-face { font-family: "${fb.name}"; src: ${fb.local.map(l => `local("${l}")`).join(', ')}; font-style: ${fb.style || 'normal'}; font-weight: 100 900; size-adjust: ${fb.sizeAdjust};${fb.ascentOverride ? ` ascent-override: ${fb.ascentOverride}; descent-override: ${fb.descentOverride}; line-gap-override: ${fb.lineGapOverride || '0%'};` : ''} }`);
  return `/* Generato da site.json: colori e font del sito (modificare site.json, non questo blocco) */\n${faces.join('\n')}${faces.length ? '\n' : ''}:root {\n${lines.join('\n')}\n}\n`;
}

function favicon(config) {
  const c = config.colors;
  const letter = (config.monogram || config.name.replace(/^(Trattoria|Osteria|Ristorante)\s+/i, '')[0]).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${c.favBg || c.ink}"/><text x="32" y="45" text-anchor="middle" font-family="Georgia, serif" font-size="40" fill="${c.favInk || c.bg}">${letter}</text></svg>`;
}

async function buildSite(id, { outDirs }) {
  const dir = path.join(SRC, 'sites', id);
  const config = readJSON(path.join(dir, 'site.json'));
  const content = readJSON(path.join(dir, 'content.json'));
  const menu = readJSON(path.join(dir, 'menu.json'));
  const imageDefs = readJSON(path.join(dir, 'images.json'));
  delete require.cache[require.resolve(path.join(dir, 'templates.js'))];
  const templates = require(path.join(dir, 'templates.js'));

  const images = await buildImages(id, path.join(dir, 'foto'), imageDefs, path.join(ROOT, '.cache', 'img', id));
  const css = cssVars(config) + '\n' +
    fs.readFileSync(path.join(SRC, 'shared', 'base.css'), 'utf8') + '\n' +
    fs.readFileSync(path.join(dir, 'theme.css'), 'utf8');
  const js = fs.readFileSync(path.join(SRC, 'shared', 'site.js'), 'utf8');
  const year = new Date().getFullYear();

  for (const { out, portal } of outDirs) {
    rm(out);
    const ctx = makeContext({ id, config, content, menu, images, portal, year });
    const pages = templates.render(ctx, page);
    for (const [file, html] of Object.entries(pages)) write(path.join(out, file), html);
    write(path.join(out, 'css', 'style.css'), css);
    write(path.join(out, 'js', 'site.js'), js);
    write(path.join(out, 'img', 'favicon.svg'), favicon(config));
    for (const f of images.__files) fs.copyFileSync(f.src, path.join(out, 'img', f.name));
    write(path.join(out, 'CREDITI-FOTO.txt'), creditsTxt(config, imageDefs));
  }
  return { id, config, content, images };
}

function creditsTxt(config, defs) {
  const rows = Object.entries(defs).map(([k, d]) => {
    const c = d.credit || {};
    return `${k}: ${c.title || ''}\n  Autore: ${c.author || 'n.d.'}\n  Fonte: ${c.source || 'n.d.'}\n  Licenza: ${c.license || 'n.d.'}${c.licenseUrl ? ' — ' + c.licenseUrl : ''}`;
  });
  return `${config.name} — sito dimostrativo\nCrediti delle fotografie (immagini dimostrative da sostituire con quelle del ristorante)\n\n${rows.join('\n\n')}\n`;
}

async function main() {
  const only = process.argv[2];
  const ids = only ? [only] : siteIds();
  const t0 = Date.now();
  const built = [];
  if (!only) { rm(DIST); rm(EXPORTS); }
  for (const id of ids) {
    built.push(await buildSite(id, {
      outDirs: [
        { out: path.join(DIST, id), portal: true },
        { out: path.join(EXPORTS, id), portal: false }
      ]
    }));
    console.log(`✓ ${id}`);
  }
  if (!only) {
    const portal = require(path.join(SRC, 'portal', 'portal.js'));
    await portal.build({ dist: DIST, sites: built, write, src: path.join(SRC, 'portal') });
    console.log('✓ pagina di selezione');
  }
  console.log(`Build completata in ${((Date.now() - t0) / 1000).toFixed(1)} s → dist/ ed exports/`);
}

main().catch(e => { console.error(e); process.exit(1); });
