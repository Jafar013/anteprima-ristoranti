// Pagina di selezione delle demo (dist/index.html). Non fa parte degli export dei singoli siti.
'use strict';
const fs = require('fs');
const path = require('path');
const { esc } = require('../../tools/lib/core');

const ORDER = ['trattoria', 'osteria', 'contemporaneo'];

async function build({ dist, sites, write, src }) {
  const byId = Object.fromEntries(sites.map(s => [s.id, s]));
  const list = ORDER.filter(id => byId[id]).map(id => byId[id]);
  const prevDir = path.join(src, 'previews');
  fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });
  const hasPrev = {};
  for (const s of list) {
    hasPrev[s.id] = {};
    for (const kind of ['desktop', 'mobile']) {
      const f = path.join(prevDir, `${s.id}-${kind}.webp`);
      if (fs.existsSync(f)) { fs.copyFileSync(f, path.join(dist, 'assets', `${s.id}-${kind}.webp`)); hasPrev[s.id][kind] = true; }
    }
  }
  fs.copyFileSync(path.join(src, 'portal.css'), path.join(dist, 'assets', 'portal.css'));

  const rows = list.map((s, i) => {
    const p = s.config.portal;
    const c = s.config.colors;
    const swatches = (p.swatches || [c.bg, c.ink, c.accent]).map(v => `<span style="background:${esc(v)}"></span>`).join('');
    const prev = hasPrev[s.id];
    const fig = prev.desktop ? `
      <a class="demo__media" href="${s.id}/index.html" tabindex="-1" aria-hidden="true">
        <span class="demo__screen"><img src="assets/${s.id}-desktop.webp" width="1440" height="900" alt="" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"></span>
        ${prev.mobile ? `<span class="demo__phone"><img src="assets/${s.id}-mobile.webp" width="390" height="844" alt="" loading="lazy" decoding="async"></span>` : ''}
      </a>` : `<div class="demo__media demo__media--empty"></div>`;
    return `
  <article class="demo" aria-labelledby="demo-${s.id}">
    ${fig}
    <div class="demo__text">
      <p class="demo__num">${String(i + 1).padStart(2, '0')} — ${esc(p.template)}</p>
      <h2 class="demo__title" id="demo-${s.id}">${esc(s.config.name)}</h2>
      <p class="demo__desc">${esc(p.description)}</p>
      <dl class="demo__meta">
        <div><dt>Per</dt><dd>${esc(p.for)}</dd></div>
        <div><dt>Caratteri</dt><dd>${esc(p.fonts)}</dd></div>
        <div><dt>Palette</dt><dd class="demo__swatches" aria-label="${esc(p.paletteLabel || '')}">${swatches}</dd></div>
      </dl>
      <a class="demo__open" href="${s.id}/index.html">Apri il sito <span class="sr-only">${esc(s.config.name)}</span><span aria-hidden="true">→</span></a>
    </div>
  </article>`;
  }).join('\n');

  const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Siti per la ristorazione — tre demo</title>
<meta name="description" content="Tre siti dimostrativi per trattorie, osterie e ristoranti di famiglia: tradizione, territorio e cucina contemporanea.">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#f3f1ec">
<meta property="og:type" content="website">
<meta property="og:title" content="Siti per la ristorazione — tre demo">
<meta property="og:description" content="Tre siti dimostrativi per trattorie, osterie e ristoranti di famiglia.">
${hasPrev.trattoria && hasPrev.trattoria.desktop ? '<meta property="og:image" content="assets/trattoria-desktop.webp">\n' : ''}<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23161513'/%3E%3Ccircle cx='32' cy='32' r='9' fill='%23f3f1ec'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap">
<link rel="stylesheet" href="assets/portal.css">
</head>
<body>
<a class="skip-link" href="#demo">Vai alle demo</a>
<header class="top wrap">
  <p class="top__mark">Siti per la ristorazione</p>
  <p class="top__note">Demo · 3 progetti</p>
</header>
<main id="demo" class="wrap">
  <section class="intro" aria-labelledby="intro-title">
    <h1 id="intro-title">Tre modi di stare a tavola, <span>tre siti costruiti su misura.</span></h1>
    <p>Una trattoria di famiglia, un’osteria legata al territorio, un ristorante contemporaneo. Quattro pagine ciascuno — home, menu, storia e contatti — pensate prima per lo smartphone, veloci e facili da aggiornare.</p>
  </section>
  <div class="demos">
${rows}
  </div>
</main>
<footer class="foot wrap">
  <p>Ristoranti, nomi, indirizzi, numeri di telefono e prezzi sono di fantasia. Le fotografie sono immagini dimostrative con licenza d’uso libera.</p>
</footer>
</body>
</html>
`;
  write(path.join(dist, 'index.html'), html);
}

module.exports = { build };
