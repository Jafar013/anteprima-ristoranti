// Template 03 — "Gemma, cucina di famiglia" (ristorante familiare contemporaneo).
// Tutti i testi arrivano da content.json / menu.json / site.json: qui solo struttura e composizione.
'use strict';

/* ---------- Piccoli glifi per la barra azioni (decorativi) ---------- */
const GLYPH = {
  booking: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><rect x="3.5" y="5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 9.5h17M8 3v4M16 3v4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  phone: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M6.6 3.8 9 3.5l1.6 4.2-2 1.4a11 11 0 0 0 6.3 6.3l1.4-2 4.2 1.6-.3 2.4a2 2 0 0 1-2.1 1.7A16 16 0 0 1 4.9 5.9a2 2 0 0 1 1.7-2.1z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  menu: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M5 6h14M5 12h14M5 18h9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

/* ---------- Utilità ---------- */
const euro = (ctx, p) => `${ctx.esc(ctx.price(p))} €`;

function findDish(ctx, category, name) {
  const cat = ctx.menu.categories.find(c => c.id === category);
  const item = cat && cat.items.find(i => i.name === name);
  if (!item) throw new Error(`[contemporaneo] piatto non trovato nel menu: "${name}" (${category})`);
  return { ...item, categoryTitle: cat.title };
}

const eyebrow = (ctx, text, cls = '') => `<p class="eyebrow${cls ? ' ' + cls : ''}">${ctx.esc(text)}</p>`;

/* ---------- Header + navigazione mobile ---------- */
function header(ctx, pageId) {
  const c = ctx.content.common;
  const cfg = ctx.config;
  return `<header class="site-header" data-header>
  <div class="site-header__inner">
    <a class="brand" href="index.html">
      <span class="brand__name">${ctx.esc(cfg.name)}</span>
      <span class="brand__tag">${ctx.esc(c.descriptor)}</span>
    </a>
    <nav class="site-nav" aria-label="Principale">
      <ul role="list">${ctx.navLinks(pageId, 'site-nav__link')}</ul>
    </nav>
    <div class="site-header__end">
      ${ctx.action('booking', ctx.esc(c.bookLabel), 'btn btn--accent btn--header')}
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" data-nav-toggle><span class="sr-only">Apri il menu</span><span class="nav-toggle__bars" aria-hidden="true"><span></span><span></span><span></span></span></button>
    </div>
  </div>
  <div class="mobile-nav" id="mobile-nav" data-mobile-nav hidden>
    <div class="mobile-nav__inner">
      <nav aria-label="Principale mobile">
        <ul role="list" class="mobile-nav__links">${ctx.navLinks(pageId, 'mobile-nav__link')}</ul>
      </nav>
      <div class="mobile-nav__actions">
        ${ctx.action('booking', ctx.esc(c.bookLong), 'btn btn--accent btn--block')}
        <div class="mobile-nav__pair">
          ${ctx.action('phone', ctx.esc(c.callLabel), 'btn btn--outline')}
          ${ctx.action('whatsapp', ctx.esc(c.whatsappLabel), 'btn btn--outline')}
        </div>
      </div>
      <div class="mobile-nav__info">
        ${ctx.address()}
        <p class="mobile-nav__demo">${ctx.esc(c.demoAddress)}</p>
      </div>
    </div>
  </div>
</header>`;
}

/* ---------- Footer + barra azioni mobile ---------- */
function footer(ctx, pageId) {
  const c = ctx.content.common;
  const f = c.footer;
  const cfg = ctx.config;
  return `<footer class="site-footer is-dark">
  <div class="wrap">
    <div class="site-footer__top">
      <p class="site-footer__mark">${ctx.esc(cfg.name)}</p>
      <p class="site-footer__lede">${ctx.rich(f.lede)}</p>
      ${ctx.action('booking', ctx.esc(c.bookLong), 'btn btn--accent')}
    </div>
    <div class="site-footer__cols">
      <div class="site-footer__col">
        <h2 class="site-footer__title">${ctx.esc(f.addressTitle)}</h2>
        ${ctx.address()}
        <p class="site-footer__small">${ctx.esc(c.demoAddress)}</p>
        ${ctx.action('maps', ctx.esc(c.mapsLabel), 'textlink')}
      </div>
      <div class="site-footer__col">
        <h2 class="site-footer__title">${ctx.esc(f.hoursTitle)}</h2>
        ${ctx.hours('hours hours--footer')}
      </div>
      <div class="site-footer__col">
        <h2 class="site-footer__title">${ctx.esc(f.contactTitle)}</h2>
        <ul role="list" class="site-footer__list">
          <li>${ctx.action('phone', ctx.esc(cfg.contact.phoneDisplay), 'textlink')}</li>
          <li>${ctx.action('email', ctx.esc(cfg.contact.email), 'textlink textlink--break')}</li>
          <li>${ctx.action('whatsapp', ctx.esc(c.whatsappLabel), 'textlink')}</li>
        </ul>
      </div>
      <div class="site-footer__col">
        <h2 class="site-footer__title">${ctx.esc(f.navTitle)}</h2>
        <nav aria-label="Pagine del sito"><ul role="list" class="site-footer__list">${ctx.navLinks(pageId, 'textlink')}</ul></nav>
        <h2 class="site-footer__title site-footer__title--follow">${ctx.esc(f.social)}</h2>
        <ul role="list" class="site-footer__social">
          <li>${ctx.action('instagram', 'Instagram', 'textlink')}</li>
          <li>${ctx.action('facebook', 'Facebook', 'textlink')}</li>
        </ul>
      </div>
    </div>
    <div class="site-footer__bottom">
      <p>${ctx.esc(f.demo)}</p>
      <p>© ${ctx.year} ${ctx.esc(cfg.name)} — ${ctx.esc(c.descriptor)}</p>
    </div>
  </div>
</footer>
<nav class="actionbar" aria-label="Azioni rapide" data-actionbar>
  ${ctx.action('booking', `${GLYPH.booking}<span>${ctx.esc(c.bookLabel)}</span>`, 'actionbar__btn actionbar__btn--primary')}
  ${ctx.action('phone', `${GLYPH.phone}<span>${ctx.esc(c.callLabel)}</span>`, 'actionbar__btn')}
  <a class="actionbar__btn" href="menu.html"${pageId === 'menu' ? ' aria-current="page"' : ''}>${GLYPH.menu}<span>${ctx.esc(c.menuLabel)}</span></a>
</nav>`;
}

/* ---------- Banda finale di prenotazione (condivisa) ---------- */
function ctaBand(ctx) {
  const c = ctx.content.common;
  return `<section class="cta-band" aria-labelledby="cta-title">
  <div class="wrap cta-band__inner">
    <div class="cta-band__text">
      ${eyebrow(ctx, c.cta.eyebrow, 'eyebrow--on-accent')}
      <h2 class="cta-band__title" id="cta-title">${ctx.rich(c.cta.title)}</h2>
      <p class="cta-band__lede">${ctx.esc(c.cta.text)}</p>
    </div>
    <div class="cta-band__actions">
      ${ctx.action('booking', ctx.esc(c.bookLong), 'btn btn--dark btn--lg')}
      ${ctx.action('phone', `${ctx.esc(c.callLabel)} ${ctx.esc(ctx.config.contact.phoneDisplay)}`, 'btn btn--outline-light btn--lg')}
    </div>
  </div>
</section>`;
}

/* ======================================================================
   HOME
   ====================================================================== */
function home(ctx) {
  const h = ctx.content.home;
  const c = ctx.content.common;
  const cfg = ctx.config;
  const a = cfg.contact.address;

  const hero = `<section class="hero is-dark" aria-labelledby="hero-title">
  <div class="hero__panel">
    <div class="hero__content">
      ${eyebrow(ctx, h.hero.eyebrow)}
      <h1 class="hero__title" id="hero-title">${ctx.rich(h.hero.title)}</h1>
      <p class="hero__lede">${ctx.esc(h.hero.lede)}</p>
      <div class="hero__ctas">
        ${ctx.action('booking', ctx.esc(c.bookLong), 'btn btn--accent btn--lg')}
        <a class="btn btn--outline-light btn--lg" href="menu.html">${ctx.esc(h.hero.menu)}</a>
      </div>
    </div>
  </div>
  <div class="hero__media">
    ${ctx.img('hero', { priority: true, sizes: '(min-width: 60rem) 58vw, 100vw' })}
  </div>
</section>`;

  const q = h.quick;
  const quick = `<section class="quick" aria-label="${ctx.esc(q.title)}">
  <div class="wrap quick__grid">
    <div class="quick__item">
      <h2 class="quick__label">${ctx.esc(q.hoursLabel)}</h2>
      <p class="quick__text">${ctx.esc(q.hoursText)}</p>
      <a class="textlink" href="contatti.html#orari">${ctx.esc(q.hoursLink)}</a>
    </div>
    <div class="quick__item">
      <h2 class="quick__label">${ctx.esc(q.placeLabel)}</h2>
      <p class="quick__text">${ctx.esc(a.street)}, ${ctx.esc(a.city)} <span class="quick__demo">· ${ctx.esc(c.demoAddress.toLowerCase())}</span></p>
      ${ctx.action('maps', ctx.esc(c.mapsLabel), 'textlink')}
    </div>
    <div class="quick__item quick__item--book">
      <div>
        <h2 class="quick__label">${ctx.esc(q.bookingLabel)}</h2>
        <p class="quick__text">${ctx.esc(q.bookingText)}</p>
      </div>
      ${ctx.action('booking', ctx.esc(c.bookLabel), 'btn btn--dark')}
    </div>
  </div>
</section>`;

  const k = h.kitchen;
  const kitchen = `<section class="kitchen section" aria-labelledby="kitchen-title">
  <div class="wrap kitchen__grid">
    <figure class="kitchen__media" data-reveal>
      <div class="kitchen__main">${ctx.img('chef', { sizes: '(min-width: 60rem) 40vw, 78vw' })}</div>
      <div class="kitchen__inset">${ctx.img('impiattamento', { sizes: '(min-width: 60rem) 20vw, 42vw' })}</div>
      <figcaption class="caption">${ctx.esc(k.caption)}</figcaption>
    </figure>
    <div class="kitchen__text">
      ${eyebrow(ctx, k.eyebrow)}
      <h2 class="h2" id="kitchen-title">${ctx.rich(k.title)}</h2>
      <div class="prose">${ctx.paras(k.paras)}</div>
      <dl class="notes">
        ${k.notes.map(n => `<div class="notes__item"><dt>${ctx.esc(n.title)}</dt><dd>${ctx.esc(n.text)}</dd></div>`).join('')}
      </dl>
    </div>
  </div>
</section>`;

  const p = h.preview;
  const featured = p.featured.map((f, i) => {
    const d = findDish(ctx, f.category, f.name);
    const sizes = i === 0 ? '(min-width: 60rem) 40vw, (min-width: 40rem) 50vw, 100vw' : '(min-width: 60rem) 30vw, (min-width: 40rem) 50vw, 7rem';
    return `<li class="bento__item bento__item--${i + 1}">
      <div class="bento__media">${ctx.img(f.photo, { sizes, decorative: true })}</div>
      <div class="bento__body">
        <p class="bento__cat">${ctx.esc(d.categoryTitle)}</p>
        <h3 class="bento__name">${ctx.esc(d.name)}</h3>
        <p class="bento__desc">${ctx.esc(d.desc)}</p>
        <p class="bento__price">${euro(ctx, d.price)}</p>
      </div>
    </li>`;
  }).join('\n');
  const more = p.more.map(m => findDish(ctx, m.category, m.name))
    .map(d => `<li><span class="bento__more-name">${ctx.esc(d.name)}</span><span class="bento__more-price">${euro(ctx, d.price)}</span></li>`).join('');
  const preview = `<section class="preview section" aria-labelledby="preview-title">
  <div class="wrap">
    <div class="section-head section-head--split">
      <div>
        ${eyebrow(ctx, p.eyebrow)}
        <h2 class="h2" id="preview-title">${ctx.rich(p.title)}</h2>
      </div>
      <p class="section-head__lede">${ctx.esc(p.lede)}</p>
    </div>
    <ul role="list" class="bento">
      ${featured}
      <li class="bento__item bento__item--list is-dark">
        <h3 class="bento__list-title">${ctx.esc(p.moreTitle)}</h3>
        <ul role="list" class="bento__more">${more}</ul>
        <a class="btn btn--accent" href="menu.html">${ctx.esc(p.link)} ${GLYPH.arrow}</a>
      </li>
    </ul>
  </div>
</section>`;

  const s = h.story;
  const story = `<section class="story-teaser section section--surface" aria-labelledby="story-title">
  <div class="wrap story-teaser__grid">
    <div class="story-teaser__text">
      ${eyebrow(ctx, s.eyebrow)}
      <h2 class="h2" id="story-title">${ctx.rich(s.title)}</h2>
      <div class="prose">${ctx.paras(s.paras)}</div>
      <a class="btn btn--outline" href="storia.html">${ctx.esc(s.link)} ${GLYPH.arrow}</a>
    </div>
    <div class="story-teaser__media">
      <figure class="story-teaser__a" data-reveal>
        ${ctx.img('sala', { sizes: '(min-width: 60rem) 26vw, 55vw' })}
        <figcaption class="caption">${ctx.esc(s.captionSala)}</figcaption>
      </figure>
      <figure class="story-teaser__b" data-reveal style="--reveal-delay:.12s">
        ${ctx.img('cucina', { sizes: '(min-width: 60rem) 30vw, 45vw' })}
        <figcaption class="caption">${ctx.esc(s.captionCucina)}</figcaption>
      </figure>
    </div>
  </div>
</section>`;

  const t = h.together;
  const together = `<section class="together section is-dark" aria-labelledby="together-title">
  <div class="wrap">
    <div class="section-head section-head--split">
      <div>
        ${eyebrow(ctx, t.eyebrow)}
        <h2 class="h2" id="together-title">${ctx.rich(t.title)}</h2>
      </div>
      <p class="section-head__lede">${ctx.esc(t.lede)}</p>
    </div>
    <ul role="list" class="together__grid">
      ${t.items.map((it, i) => `<li class="together__item together__item--${i + 1}">
        <div class="together__media">${ctx.img(it.photo, { sizes: i === 0 ? '(min-width: 60rem) 45vw, 100vw' : '(min-width: 60rem) 25vw, 100vw' })}</div>
        <div class="together__body">
          <h3 class="h3">${ctx.esc(it.title)}</h3>
          <p>${ctx.esc(it.text)}</p>
        </div>
      </li>`).join('\n')}
    </ul>
    <p class="together__more"><a class="textlink" href="contatti.html#gruppi">${ctx.esc(t.groupsLink)} ${GLYPH.arrow}</a></p>
  </div>
</section>`;

  const inf = h.info;
  const info = `<section class="info section" aria-labelledby="info-title">
  <div class="wrap">
    <div class="section-head">
      ${eyebrow(ctx, inf.eyebrow)}
      <h2 class="h2" id="info-title">${ctx.esc(inf.title)}</h2>
    </div>
    <div class="info__grid">
      <div class="info__col">
        <h3 class="info__title">${ctx.esc(inf.hoursTitle)}</h3>
        ${ctx.hours('hours')}
      </div>
      <div class="info__col">
        <h3 class="info__title">${ctx.esc(inf.addressTitle)}</h3>
        ${ctx.address()}
        <p class="small muted">${ctx.esc(c.demoAddress)}</p>
        ${ctx.action('maps', ctx.esc(c.mapsLabel), 'btn btn--outline')}
      </div>
      <div class="info__col">
        <h3 class="info__title">${ctx.esc(inf.contactTitle)}</h3>
        <ul role="list" class="info__list">
          <li>${ctx.action('phone', ctx.esc(cfg.contact.phoneDisplay), 'textlink textlink--strong')}</li>
          <li>${ctx.action('whatsapp', `${ctx.esc(c.whatsappLabel)} ${ctx.esc(cfg.contact.whatsappDisplay)}`, 'textlink')}</li>
          <li>${ctx.action('email', ctx.esc(cfg.contact.email), 'textlink textlink--break')}</li>
        </ul>
        <a class="textlink" href="contatti.html">${ctx.esc(inf.contactsLink)} ${GLYPH.arrow}</a>
      </div>
    </div>
  </div>
</section>`;

  return [hero, quick, kitchen, preview, story, together, ctaBand(ctx), info].join('\n');
}

/* ======================================================================
   MENU
   ====================================================================== */
function menuPage(ctx) {
  const m = ctx.menu;
  const t = ctx.content.menu;
  const labels = m.tagLabels || {};
  const pill = tag => labels[tag] ? `<li class="pill pill--${ctx.esc(tag)}">${ctx.esc(labels[tag])}</li>` : '';
  // la pill "Per bambini" sarebbe ridondante nella categoria dedicata
  const dishTags = (item, catId) => (item.tags || []).filter(tg => !(catId === 'bambini' && tg === 'bambini'));

  const intro = `<section class="page-intro page-intro--menu" aria-labelledby="page-title">
  <div class="wrap page-intro__grid">
    <div class="page-intro__text">
      ${eyebrow(ctx, t.eyebrow)}
      <h1 class="page-title" id="page-title">${ctx.rich(t.title)}</h1>
      <p class="page-intro__lede">${ctx.esc(t.lede)}</p>
    </div>
    <aside class="lunch is-dark" aria-labelledby="lunch-title">
      <p class="lunch__when">${ctx.esc(m.lunch.when)}</p>
      <div class="lunch__head">
        <h2 class="lunch__title" id="lunch-title">${ctx.esc(m.lunch.title)}</h2>
        <p class="lunch__price">${euro(ctx, m.lunch.price)}</p>
      </div>
      <ul role="list" class="lunch__list">${m.lunch.includes.map(x => `<li>${ctx.esc(x)}</li>`).join('')}</ul>
      <p class="lunch__text">${ctx.esc(m.lunch.text)}</p>
      ${ctx.action('booking', ctx.esc(t.lunchCta), 'btn btn--accent')}
    </aside>
  </div>
</section>`;

  const nav = `<nav class="menu-nav" data-menu-nav aria-label="Categorie del menu">
  <ul role="list" class="menu-nav__track" data-menu-nav-track>
    ${m.categories.map(c => `<li><a class="menu-nav__link" href="#${ctx.esc(c.id)}">${ctx.esc(c.title)}</a></li>`).join('\n    ')}
  </ul>
</nav>`;

  const tools = `<div class="menu-tools">
  <button type="button" class="filter" data-menu-filter="veg" aria-pressed="false" aria-describedby="filter-hint">
    <span class="filter__switch" aria-hidden="true"><span></span></span>
    <span class="filter__label">${ctx.esc(t.filterLabel)}</span>
  </button>
  <p class="sr-only" id="filter-hint">${ctx.esc(t.filterHint)}</p>
  <p class="menu-tools__status" aria-live="polite" data-filter-status></p>
  <div class="menu-tools__legend">
    <p class="menu-tools__legend-title">${ctx.esc(t.legendTitle)}</p>
    <ul role="list" class="pills">${Object.keys(labels).filter(k => k !== 'bambini').map(pill).join('')}</ul>
  </div>
</div>`;

  const cats = m.categories.map(c => `<section class="menu-cat" id="${ctx.esc(c.id)}" data-menu-category aria-labelledby="cat-${ctx.esc(c.id)}">
  <div class="menu-cat__head">
    <h2 class="menu-cat__title" id="cat-${ctx.esc(c.id)}">${ctx.esc(c.title)}</h2>
    ${c.intro ? `<p class="menu-cat__intro">${ctx.esc(c.intro)}</p>` : ''}
  </div>
  <ul role="list" class="dishes">
    ${c.items.map(it => {
      const tags = dishTags(it, c.id);
      return `<li class="dish" data-tags="${ctx.esc((it.tags || []).join(' '))}">
      <div class="dish__row">
        <h3 class="dish__name">${ctx.esc(it.name)}</h3>
        <p class="dish__price">${euro(ctx, it.price)}</p>
      </div>
      ${it.desc ? `<p class="dish__desc">${ctx.esc(it.desc)}</p>` : ''}
      ${tags.length ? `<ul role="list" class="pills" aria-label="Caratteristiche">${tags.map(pill).join('')}</ul>` : ''}
      ${ctx.allergens(it)}
    </li>`;
    }).join('\n    ')}
  </ul>
</section>`).join('\n');

  const notes = `<aside class="menu-notes" aria-labelledby="menu-notes-title">
  <h2 class="menu-notes__title" id="menu-notes-title">${ctx.esc(t.noteTitle)}</h2>
  ${ctx.paras(m.note)}
</aside>`;

  return `${intro}
${nav}
<div class="wrap menu-body">
${tools}
<div class="menu-list">
${cats}
</div>
<div class="menu-foot">
${notes}
${ctx.allergenBlock('allergens')}
</div>
</div>
${ctaBand(ctx)}`;
}

/* ======================================================================
   LA NOSTRA STORIA
   ====================================================================== */
function storiaPage(ctx) {
  const s = ctx.content.storia;

  const intro = `<section class="page-intro page-intro--story" aria-labelledby="page-title">
  <div class="wrap page-intro__grid">
    <div class="page-intro__text">
      ${eyebrow(ctx, s.eyebrow)}
      <h1 class="page-title" id="page-title">${ctx.rich(s.title)}</h1>
    </div>
    <p class="page-intro__lede">${ctx.esc(s.lede)}</p>
  </div>
  <figure class="wide-photo">
    ${ctx.img('cucina', { priority: true, sizes: '(min-width: 90rem) 88rem, 100vw' })}
    <figcaption class="caption wrap">${ctx.esc(s.heroCaption)}</figcaption>
  </figure>
</section>`;

  const chapters = s.chapters.map((ch, i) => `<section class="chapter section${i % 2 ? ' chapter--flip' : ''}" aria-labelledby="chapter-${i + 1}">
  <div class="wrap chapter__grid">
    <div class="chapter__text">
      <p class="chapter__mark">${ctx.esc(ch.number)}</p>
      <h2 class="h2" id="chapter-${i + 1}">${ctx.esc(ch.title)}</h2>
      <div class="prose">${ctx.paras(ch.paras)}</div>
    </div>
    <figure class="chapter__media" data-reveal>
      ${ctx.img(ch.photo, { sizes: '(min-width: 60rem) 38vw, 100vw' })}
      <figcaption class="caption">${ctx.esc(ch.caption)}</figcaption>
    </figure>
  </div>
</section>`).join('\n');

  const quote = `<section class="quote-band section--surface" aria-label="Citazione">
  <div class="wrap">
    <figure class="pull-quote">
      <blockquote><p>${ctx.rich(s.quote.text)}</p></blockquote>
      <figcaption>— ${ctx.esc(s.quote.cite)}</figcaption>
    </figure>
  </div>
</section>`;

  const pr = s.principles;
  const principles = `<section class="principles section" aria-labelledby="principles-title">
  <div class="wrap">
    <div class="section-head">
      ${eyebrow(ctx, pr.eyebrow)}
      <h2 class="h2" id="principles-title">${ctx.rich(pr.title)}</h2>
    </div>
    <ol role="list" class="principles__list">
      ${pr.items.map((it, i) => `<li class="principle">
        <p class="principle__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</p>
        <h3 class="principle__title"><span class="sr-only">${i + 1}. </span>${ctx.esc(it.title)}</h3>
        <p class="principle__text">${ctx.esc(it.text)}</p>
      </li>`).join('\n      ')}
    </ol>
  </div>
</section>`;

  const split = (data, photo, id, flip, sizes) => `<section class="split section${flip ? ' split--flip' : ''}" aria-labelledby="${id}">
  <div class="wrap split__grid">
    <figure class="split__media" data-reveal>
      ${ctx.img(photo, { sizes })}
      <figcaption class="caption">${ctx.esc(data.caption)}</figcaption>
    </figure>
    <div class="split__text">
      ${eyebrow(ctx, data.eyebrow)}
      <h2 class="h2" id="${id}">${ctx.rich(data.title)}</h2>
      <div class="prose">${ctx.paras(data.paras)}</div>
    </div>
  </div>
</section>`;

  return [
    intro,
    chapters,
    quote,
    principles,
    split(s.ingredients, 'tavola', 'ingredients-title', false, '(min-width: 60rem) 55vw, 100vw'),
    split(s.hospitality, 'amici', 'hospitality-title', true, '(min-width: 60rem) 55vw, 100vw'),
    ctaBand(ctx)
  ].join('\n');
}

/* ======================================================================
   CONTATTI
   ====================================================================== */
function contattiPage(ctx) {
  const t = ctx.content.contatti;
  const c = ctx.content.common;
  const cfg = ctx.config;

  const channel = (kind, label, value) => ctx.action(kind,
    `<span class="channel__label">${ctx.esc(label)}</span><span class="channel__value">${ctx.esc(value)}</span><span class="channel__arrow">${GLYPH.arrow}</span>`,
    'channel');

  const intro = `<section class="page-intro page-intro--contact" aria-labelledby="page-title">
  <div class="wrap">
    <div class="page-intro__text">
      ${eyebrow(ctx, t.eyebrow)}
      <h1 class="page-title" id="page-title">${ctx.rich(t.title)}</h1>
      <p class="page-intro__lede">${ctx.esc(t.lede)}</p>
    </div>
  </div>
</section>`;

  const main = `<section class="contact section section--tight" aria-label="Prenotazioni, recapiti e orari">
  <div class="wrap contact__grid">
    <div class="contact__main">
      <div class="book-card is-dark">
        <div>
          <h2 class="book-card__title">${ctx.esc(t.bookTitle)}</h2>
          <p>${ctx.esc(t.bookText)}</p>
        </div>
        ${ctx.action('booking', ctx.esc(c.bookLabel), 'btn btn--accent btn--lg')}
      </div>
      <div class="channels">
        <h2 class="block-title">${ctx.esc(t.channelsTitle)}</h2>
        <ul role="list" class="channels__list">
          <li>${channel('phone', t.channels.phone, cfg.contact.phoneDisplay)}</li>
          <li>${channel('whatsapp', t.channels.whatsapp, cfg.contact.whatsappDisplay)}</li>
          <li>${channel('email', t.channels.email, cfg.contact.email)}</li>
        </ul>
        <p class="small muted">${ctx.esc(t.channelsNote)}</p>
      </div>
    </div>
    <div class="hours-card" id="orari">
      <h2 class="block-title">${ctx.esc(t.hoursTitle)}</h2>
      ${ctx.hours('hours hours--card')}
      <p class="small muted">${ctx.esc(t.hoursNote)}</p>
    </div>
  </div>
</section>`;

  const where = `<section class="where section section--surface" aria-labelledby="where-title">
  <div class="wrap where__grid">
    <div class="where__address">
      ${eyebrow(ctx, t.addressTitle)}
      <h2 class="h2" id="where-title">${ctx.rich(t.whereTitle)}</h2>
      ${ctx.address()}
      <p class="where__demo">${ctx.esc(c.demoAddress)}</p>
      ${ctx.action('maps', `${ctx.esc(c.mapsLabel)} ${GLYPH.arrow}`, 'btn btn--dark')}
    </div>
    <div class="where__directions">
      <h3 class="block-title">${ctx.esc(t.directionsTitle)}</h3>
      <dl class="directions">
        ${t.directions.map(d => `<div class="directions__item"><dt>${ctx.esc(d.title)}</dt><dd>${ctx.esc(d.text)}</dd></div>`).join('\n        ')}
      </dl>
      <p class="small muted">${ctx.esc(t.directionsNote)}</p>
    </div>
  </div>
</section>`;

  const groups = `<section class="groups section" id="gruppi" aria-labelledby="groups-title">
  <div class="wrap split__grid">
    <figure class="split__media" data-reveal>
      ${ctx.img('tavola', { sizes: '(min-width: 60rem) 55vw, 100vw' })}
    </figure>
    <div class="split__text">
      ${eyebrow(ctx, t.groupsEyebrow)}
      <h2 class="h2" id="groups-title">${ctx.rich(t.groupsTitle)}</h2>
      <div class="prose">${ctx.paras(t.groupsText)}</div>
      ${ctx.action('phone', ctx.esc(t.groupsCta), 'btn btn--accent')}
    </div>
  </div>
</section>`;

  const extra = `<section class="contact-extra section section--tight" aria-label="Social e note">
  <div class="wrap contact-extra__grid">
    <div>
      <h2 class="block-title">${ctx.esc(t.socialTitle)}</h2>
      <p class="muted">${ctx.esc(t.socialText)}</p>
      <ul role="list" class="contact-extra__social">
        <li>${ctx.action('instagram', 'Instagram', 'btn btn--outline')}</li>
        <li>${ctx.action('facebook', 'Facebook', 'btn btn--outline')}</li>
      </ul>
    </div>
    <div class="demo-note">
      <h2 class="block-title">${ctx.esc(t.demoTitle)}</h2>
      <p>${ctx.esc(t.demoText)}</p>
    </div>
  </div>
</section>`;

  return [intro, main, where, groups, extra].join('\n');
}

/* ---------- Render ---------- */
module.exports.render = (ctx, page) => {
  const ct = ctx.content;
  const mk = (pageId, title, description, main) => page(ctx, {
    pageId, title, description,
    header: header(ctx, pageId),
    main,
    footer: footer(ctx, pageId)
  });
  return {
    'index.html': mk('home', 'Home', ct.home.meta, home(ctx)),
    'menu.html': mk('menu', 'Menu', ct.menu.meta, menuPage(ctx)),
    'storia.html': mk('storia', 'La nostra storia', ct.storia.meta, storiaPage(ctx)),
    'contatti.html': mk('contatti', 'Contatti', ct.contatti.meta, contattiPage(ctx))
  };
};
