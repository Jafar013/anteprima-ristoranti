// Helper condivisi dai template dei tre siti.
// Ogni template riceve un oggetto `ctx` creato da makeContext() e usa queste funzioni
// per immagini, collegamenti esterni, orari, menu e struttura della pagina.
'use strict';

const PAGES = [
  { id: 'home', file: 'index.html', label: 'Home' },
  { id: 'menu', file: 'menu.html', label: 'Menu' },
  { id: 'storia', file: 'storia.html', label: 'La nostra storia' },
  { id: 'contatti', file: 'contatti.html', label: 'Contatti' }
];

/** Escape HTML per testi provenienti dai file di contenuto. */
function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Testo con markup minimo consentito nei contenuti: *corsivo* e **grassetto**.
 * Tutto il resto viene escapato.
 */
function rich(v) {
  return esc(v)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

/** Paragrafi da un array di stringhe (o da una stringa). */
function paras(list, cls) {
  const arr = Array.isArray(list) ? list : [list];
  return arr.filter(Boolean).map(p => `<p${cls ? ` class="${cls}"` : ''}>${rich(p)}</p>`).join('\n');
}

/** Prezzo in formato italiano: 14 → "14", 6.5 → "6,50". */
function price(v) {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  if (!Number.isFinite(n)) return esc(v);
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',');
}

function makeContext({ id, config, content, menu, images, portal, year }) {
  const ctx = { id, config, content, menu, images, portal: !!portal, year, PAGES };

  /**
   * <img> responsive da images.json.
   * opts.sizes: attributo sizes (default 100vw)
   * opts.priority: true per l'immagine principale above the fold (eager + fetchpriority high)
   * opts.cls: classi; opts.alt: alt alternativo; opts.decorative: alt=""
   */
  ctx.img = (key, opts = {}) => {
    const im = images[key];
    if (!im) throw new Error(`[${id}] immagine mancante: "${key}" (vedi images.json)`);
    const widths = im.widths;
    const largest = widths[widths.length - 1];
    const srcFor = w => `img/${key}-${w}.webp`;
    const fallbackW = widths.find(w => w >= 1200) || largest;
    const alt = opts.decorative ? '' : (opts.alt != null ? opts.alt : im.alt);
    const h = Math.round(fallbackW * im.height / im.width);
    const attrs = [
      `src="${srcFor(fallbackW)}"`,
      `srcset="${widths.map(w => `${srcFor(w)} ${w}w`).join(', ')}"`,
      `sizes="${esc(opts.sizes || '100vw')}"`,
      `width="${fallbackW}" height="${h}"`,
      `alt="${esc(alt)}"`,
      opts.priority ? 'fetchpriority="high"' : 'loading="lazy"',
      'decoding="async"'
    ];
    if (opts.cls) attrs.unshift(`class="${esc(opts.cls)}"`);
    if (im.position) attrs.push(`style="object-position:${esc(im.position)}"`);
    return `<img ${attrs.join(' ')}>`;
  };

  /** URL relativo di un'immagine a una data larghezza (per og:image, sfondi). */
  ctx.imgUrl = (key, minW = 1200) => {
    const im = images[key];
    const w = im.widths.find(x => x >= minW) || im.widths[im.widths.length - 1];
    return `img/${key}-${w}.webp`;
  };

  /**
   * Collegamento esterno configurabile (config.links).
   * kind: booking | phone | email | maps | instagram | facebook | whatsapp
   * Se il collegamento non è configurato il sito resta in modalità demo:
   * viene generato un <button> che apre la finestra "collegamento dimostrativo".
   */
  ctx.action = (kind, label, cls = '', extra = '') => {
    const url = (config.links || {})[kind];
    const c = cls ? ` class="${esc(cls)}"` : '';
    if (url) {
      const ext = /^https?:/i.test(url);
      return `<a href="${esc(url)}"${c}${ext ? ' target="_blank" rel="noopener"' : ''}${extra ? ' ' + extra : ''}>${label}</a>`;
    }
    return `<button type="button"${c} data-demo="${esc(kind)}"${extra ? ' ' + extra : ''}>${label}</button>`;
  };

  /** Link di navigazione interna con aria-current. */
  ctx.navLinks = (current, cls = '') => PAGES.map(p =>
    `<li><a href="${p.file}"${cls ? ` class="${cls}"` : ''}${p.id === current ? ' aria-current="page"' : ''}>${esc(p.label)}</a></li>`
  ).join('');

  /** Orari come <dl>. */
  ctx.hours = (cls = 'hours') => {
    const rows = (config.hours || []).map(h =>
      `<div><dt>${esc(h.days)}</dt><dd>${esc(h.time)}</dd></div>`).join('');
    return `<dl class="${cls}">${rows}</dl>`;
  };

  /** Indirizzo su più righe. */
  ctx.address = () => {
    const a = config.contact.address;
    return `<address>${esc(a.street)}<br>${esc(a.postcode)} ${esc(a.city)} (${esc(a.province)})</address>`;
  };

  /** Tutte le voci del menu, con eventuali filtri per tag. */
  ctx.allDishes = () => menu.categories.flatMap(c => c.items.map(i => ({ ...i, category: c.id })));

  /** Riga allergeni di un piatto (vuota in demo: i dati li fornisce il ristorante). */
  ctx.allergens = (item) => {
    if (!item.allergens || !item.allergens.length) return '';
    return `<p class="dish__allergens"><span class="sr-only">Allergeni: </span>${item.allergens.map(n => `<abbr title="${esc((menu.allergenList || [])[n - 1] || '')}">${esc(n)}</abbr>`).join(' ')}</p>`;
  };

  /** Legenda dei 14 allergeni (Reg. UE 1169/2011) + nota del ristorante. */
  ctx.allergenBlock = (cls = 'allergens') => `
<section class="${cls}" id="allergeni" aria-labelledby="allergeni-title">
  <h2 id="allergeni-title">${esc(menu.allergenTitle || 'Allergeni')}</h2>
  ${paras(menu.allergenNote)}
  <ol class="${cls}__list">${(menu.allergenList || []).map(a => `<li>${esc(a)}</li>`).join('')}</ol>
</section>`;

  ctx.price = price;
  ctx.esc = esc;
  ctx.rich = rich;
  ctx.paras = paras;
  return ctx;
}

/** Testi della finestra "collegamento dimostrativo" per tipo di azione. */
const DEMO_TEXT = {
  booking: ['Prenotazione online', 'In questo sito dimostrativo il pulsante non apre un servizio reale. Nel sito del ristorante porterà al servizio di prenotazione scelto (per esempio TheFork, Quandoo, un modulo esterno o WhatsApp), configurabile in un solo punto.'],
  phone: ['Chiamata', 'Il numero mostrato è di fantasia. Nel sito del ristorante il pulsante avvierà la chiamata dallo smartphone.'],
  email: ['E-mail', 'L\u2019indirizzo mostrato è di fantasia. Nel sito del ristorante il pulsante aprirà il programma di posta.'],
  maps: ['Indicazioni stradali', 'L\u2019indirizzo è dimostrativo. Nel sito del ristorante il pulsante aprirà il percorso in Google Maps o Apple Mappe.'],
  instagram: ['Instagram', 'Profilo dimostrativo. Nel sito del ristorante il collegamento aprirà la pagina Instagram del locale.'],
  facebook: ['Facebook', 'Pagina dimostrativa. Nel sito del ristorante il collegamento aprirà la pagina Facebook del locale.'],
  whatsapp: ['WhatsApp', 'Numero dimostrativo. Nel sito del ristorante il pulsante aprirà una chat WhatsApp con il locale.']
};

/**
 * Pagina completa. I template forniscono header, main e footer; qui si aggiungono
 * <head>, skip link, finestra demo e script condiviso.
 */
function page(ctx, { pageId, title, description, header, main, footer, bodyClass = '' }) {
  const { config } = ctx;
  const seo = config.seo || {};
  const fullTitle = pageId === 'home' ? `${config.name} — ${seo.tagline || ''}`.replace(/ — $/, '') : `${title} — ${config.name}`;
  const base = (seo.siteUrl || '').replace(/\/?$/, '/');
  const file = PAGES.find(p => p.id === pageId).file;
  const ogImg = ctx.imgUrl(seo.ogImage || 'hero', 1200);
  const abs = u => (seo.siteUrl ? base + u : u);
  const fonts = config.fonts;
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
${seo.noindex ? '<meta name="robots" content="noindex, nofollow">\n' : ''}${seo.siteUrl ? `<link rel="canonical" href="${esc(abs(file === 'index.html' ? '' : file))}">\n` : ''}<meta name="theme-color" content="${esc(config.colors.themeColor || config.colors.bg)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="it_IT">
<meta property="og:site_name" content="${esc(config.name)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(abs(ogImg))}">
<link rel="icon" href="img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${esc(fonts.href)}">
<link rel="stylesheet" href="css/style.css">
<script>document.documentElement.classList.add('js')</script>
<script src="js/site.js" defer></script>
</head>
<body class="page-${pageId}${bodyClass ? ' ' + bodyClass : ''}">
<a class="skip-link" href="#contenuto" tabindex="0">Vai al contenuto</a>
${ctx.portal ? `<div class="portal-bar"><a class="portal-link" href="../index.html"><span aria-hidden="true">←</span> Tutte le demo</a><span class="portal-bar__note">Sito dimostrativo</span></div>\n` : ''}${header}
<main id="contenuto" tabindex="-1">
${main}
</main>
${footer}
${demoDialog()}
</body>
</html>
`;
}

function demoDialog() {
  return `<dialog class="demo-dialog" id="demo-dialog" aria-labelledby="demo-dialog-title" aria-describedby="demo-dialog-text">
  <div class="demo-dialog__inner">
    <p class="demo-dialog__kicker">Collegamento dimostrativo</p>
    <h2 class="demo-dialog__title" id="demo-dialog-title">Prenotazione online</h2>
    <p class="demo-dialog__text" id="demo-dialog-text"></p>
    <form method="dialog"><button class="demo-dialog__close" type="submit">Ho capito</button></form>
  </div>
</dialog>
<script type="application/json" id="demo-texts">${JSON.stringify(DEMO_TEXT).replace(/</g, '\\u003c')}</script>`;
}

module.exports = { PAGES, esc, rich, paras, price, makeContext, page };
