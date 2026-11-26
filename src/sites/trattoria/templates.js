// Trattoria Bellandi — template 01 "Trattoria tradizionale".
// Tutti i testi arrivano da content.json, i piatti da menu.json, i dati di contatto da site.json:
// per cambiare un testo non serve toccare questo file.
'use strict';

/* ------------------------------------------------------------------ helpers */

const TAG_LABEL = { casa: 'Della casa', veg: 'Vegetariano', stagione: 'Di stagione' };

/** Titolo con *corsivo* in evidenza (diventa <em>). */
const t = (ctx, s) => ctx.rich(s);

function kicker(ctx, text, cls = '') {
  return `<p class="kicker${cls ? ' ' + cls : ''}">${ctx.esc(text)}</p>`;
}

/** Figura con passe-partout sottile e didascalia. */
function figure(ctx, key, { sizes, caption, cls = '', ratio = '', priority = false, reveal = true, delay = '' } = {}) {
  const style = ratio ? ` style="--ratio:${ratio}"` : '';
  const rv = reveal ? ` data-reveal${delay ? ` style="--reveal-delay:${delay}"` : ''}` : '';
  return `<figure class="frame${cls ? ' ' + cls : ''}"${rv}>
  <div class="frame__img"${style}><div class="frame__crop">${ctx.img(key, { sizes, priority })}</div></div>
  ${caption ? `<figcaption class="frame__caption">${ctx.rich(caption)}</figcaption>` : ''}
</figure>`;
}

/** Prezzo: numero tipografico + "euro" per chi usa un lettore di schermo. */
function priceTag(ctx, p) {
  if (p === null || p === undefined || p === '') return '';
  return `<p class="dish__price"><span class="sr-only">Prezzo: </span>${ctx.price(p)}<span class="sr-only"> euro</span></p>`;
}

/** Un piatto, come su un menu stampato: nome, puntini, prezzo e descrizione. */
function dish(ctx, item, { headingLevel = 3, showTags = true } = {}) {
  const tags = (item.tags || []).filter(x => TAG_LABEL[x]);
  const tagHtml = showTags && tags.length
    ? `<span class="dish__tags">${tags.map(x => `<span class="tag tag--${x}">${TAG_LABEL[x]}</span>`).join('')}</span>`
    : '';
  const h = `h${headingLevel}`;
  return `<li class="dish${tags.includes('casa') ? ' dish--casa' : ''}" data-tags="${ctx.esc(tags.join(' '))}">
  <div class="dish__line"><${h} class="dish__name">${ctx.esc(item.name)}</${h}><span class="dish__leader" aria-hidden="true"></span>${priceTag(ctx, item.price)}</div>
  ${item.desc || tagHtml ? `<p class="dish__desc">${tagHtml}${ctx.rich(item.desc || '')}</p>` : ''}
  ${ctx.allergens(item)}
</li>`;
}

function timeline(ctx, steps, cls = '') {
  return `<ol class="timeline${cls ? ' ' + cls : ''}" role="list">
${steps.map((s, i) => `  <li class="timeline__step"${i ? ` data-reveal style="--reveal-delay:${(i * 0.08).toFixed(2)}s"` : ' data-reveal'}>
    <p class="timeline__year">${ctx.esc(s.year)}</p>
    <h3 class="timeline__title">${ctx.esc(s.title)}</h3>
    <p class="timeline__text">${ctx.rich(s.text)}</p>
  </li>`).join('\n')}
</ol>`;
}

/** E-mail che può andare a capo solo dopo la chiocciola o prima dell'ultimo punto. */
const emailHtml = ctx => ctx.esc(ctx.config.contact.email).replace('@', '@<wbr>').replace(/\.([^.]+)$/, '<wbr>.$1');

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/* ------------------------------------------------------------------ header / footer */

function header(ctx, pageId) {
  const c = ctx.content.common;
  const { config } = ctx;
  return `<header class="site-header" data-header>
  <div class="site-header__inner wrap">
    <a class="wordmark" href="index.html">
      <span class="wordmark__name">${ctx.esc(config.name)}</span>
      <span class="wordmark__since">${ctx.esc(c.since)}</span>
    </a>
    <nav class="primary-nav" aria-label="Principale">
      <ul role="list">${ctx.navLinks(pageId, 'primary-nav__link')}</ul>
    </nav>
    ${ctx.action('booking', ctx.esc(c.bookingLabel), 'btn btn--small site-header__cta')}
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" data-nav-toggle><span class="sr-only">${ctx.esc(c.menuToggleOpen)}</span><span class="nav-toggle__bars" aria-hidden="true"><span></span><span></span><span></span></span></button>
  </div>
</header>
<div class="mobile-nav" id="mobile-nav" data-mobile-nav hidden>
  <div class="mobile-nav__inner wrap">
    <nav aria-label="Principale mobile">
      <ul role="list" class="mobile-nav__list">${ctx.navLinks(pageId, 'mobile-nav__link')}</ul>
    </nav>
    <div class="mobile-nav__actions">
      ${ctx.action('booking', ctx.esc(c.bookingLong), 'btn btn--block')}
      ${ctx.action('phone', `${ctx.esc(c.callLabel)} <span class="mobile-nav__num">${ctx.esc(config.contact.phoneDisplay)}</span>`, 'btn btn--ghost btn--block')}
    </div>
    <p class="mobile-nav__note">${ctx.esc(c.mobileNavNote)}</p>
    <div class="mobile-nav__info">
      <div>
        <p class="h4">${ctx.esc(c.hoursTitle)}</p>
        ${ctx.hours('hours hours--compact')}
      </div>
      <div>
        <p class="h4">${ctx.esc(c.addressTitle)}</p>
        ${ctx.address()}
        <p class="note">${ctx.esc(c.demoAddress)}</p>
      </div>
    </div>
  </div>
</div>`;
}

/** Barra azioni in fondo allo schermo, solo sugli smartphone (nascosta in CSS dalle larghezze maggiori).
 *  È "sticky" e non "fixed": così site.js ne misura l'altezza (offsetParent non nullo)
 *  e il pulsante "Tutte le demo" si sposta sopra di essa. */
function actionbar(ctx) {
  const c = ctx.content.common;
  return `<div class="actionbar" data-actionbar>
  ${ctx.action('phone', ctx.esc(c.callLabel), 'btn btn--ghost actionbar__btn')}
  ${ctx.action('booking', ctx.esc(c.bookingLong), 'btn actionbar__btn actionbar__btn--main')}
</div>`;
}

function footer(ctx) {
  const f = ctx.content.footer;
  const c = ctx.content.common;
  const { config } = ctx;
  const demo = ctx.esc(f.demo);
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="site-footer__grid">
      <div class="site-footer__brand">
        <p class="site-footer__name">${ctx.esc(config.name)}</p>
        <p class="site-footer__tagline">${ctx.esc(f.tagline)}</p>
        ${ctx.address()}
        <p class="site-footer__small">${ctx.esc(c.demoAddress)}</p>
      </div>
      <div class="site-footer__col">
        <h2 class="site-footer__title">${ctx.esc(c.hoursTitle)}</h2>
        ${ctx.hours('hours hours--footer')}
      </div>
      <nav class="site-footer__col" aria-label="Pagine del sito">
        <h2 class="site-footer__title">${ctx.esc(f.navTitle)}</h2>
        <ul role="list" class="site-footer__list">${ctx.navLinks('', 'site-footer__link')}</ul>
      </nav>
      <div class="site-footer__col">
        <h2 class="site-footer__title">${ctx.esc(f.socialTitle)}</h2>
        <ul role="list" class="site-footer__list">
          <li>${ctx.action('phone', ctx.esc(config.contact.phoneDisplay), 'site-footer__link')}</li>
          <li>${ctx.action('email', emailHtml(ctx), 'site-footer__link site-footer__email')}</li>
          <li>${ctx.action('instagram', 'Instagram', 'site-footer__link')}</li>
          <li>${ctx.action('facebook', 'Facebook', 'site-footer__link')}</li>
        </ul>
      </div>
    </div>
    <div class="site-footer__bottom">
      <p>${demo}</p>
      <p>© ${ctx.year} ${ctx.esc(config.name)}</p>
    </div>
  </div>
</footer>
${actionbar(ctx)}`;
}

/* ------------------------------------------------------------------ blocchi riusati */

function visitBlock(ctx, { titleTag = 'h2' } = {}) {
  const c = ctx.content.common;
  const v = ctx.content.home.visit;
  const { config } = ctx;
  return `<section class="visit section" aria-labelledby="visit-title">
  <div class="wrap">
    <header class="sec-head sec-head--rule" data-reveal>
      ${kicker(ctx, v.kicker)}
      <${titleTag} class="h2" id="visit-title">${t(ctx, v.title)}</${titleTag}>
    </header>
    <div class="visit__grid">
      <div class="visit__col">
        <h3 class="h4">${ctx.esc(c.hoursTitle)}</h3>
        ${ctx.hours('hours')}
      </div>
      <div class="visit__col">
        <h3 class="h4">${ctx.esc(c.addressTitle)}</h3>
        ${ctx.address()}
        <p class="note">${ctx.esc(c.demoAddress)}</p>
        ${ctx.action('maps', `${ctx.esc(c.mapsLabel)}<span aria-hidden="true"> →</span>`, 'textlink')}
      </div>
      <div class="visit__col">
        <h3 class="h4">${ctx.esc(c.contactTitle)}</h3>
        <ul role="list" class="contact-list">
          <li>${ctx.action('phone', ctx.esc(config.contact.phoneDisplay), 'textlink textlink--plain')}</li>
          <li>${ctx.action('email', emailHtml(ctx), 'textlink textlink--plain contact-email')}</li>
        </ul>
        ${ctx.action('booking', ctx.esc(c.bookingLong), 'btn')}
      </div>
    </div>
  </div>
</section>`;
}

/* ------------------------------------------------------------------ HOME */

function home(ctx) {
  const H = ctx.content.home;
  const c = ctx.content.common;
  const dishes = ctx.allDishes();
  const preview = H.menuPreview.dishes.map(n => dishes.find(d => d.name === n)).filter(Boolean);
  const timelineSteps = ctx.content.storia.timeline;

  return `
<section class="hero" aria-labelledby="hero-title">
  <div class="wrap hero__grid">
    <div class="hero__top">
      ${kicker(ctx, H.hero.kicker, 'kicker--rule')}
    </div>
    <h1 class="hero__title" id="hero-title">${t(ctx, H.hero.title)}</h1>
    <div class="hero__aside">
      <p class="hero__lede">${ctx.rich(H.hero.lede)}</p>
      <div class="hero__actions">
        ${ctx.action('booking', ctx.esc(c.bookingLong), 'btn')}
        <a class="textlink" href="menu.html">${ctx.esc(c.menuLink)}<span aria-hidden="true"> →</span></a>
      </div>
    </div>
    ${figure(ctx, 'hero', { cls: 'hero__figure', caption: H.hero.caption, priority: true, reveal: false, sizes: '(min-width: 82rem) 74rem, calc(100vw - 2.5rem)' })}
  </div>
</section>

<section class="intro section" aria-labelledby="intro-title">
  <div class="wrap intro__grid">
    <header class="intro__head" data-reveal>
      ${kicker(ctx, H.intro.kicker)}
      <h2 class="h2" id="intro-title">${t(ctx, H.intro.title)}</h2>
    </header>
    <div class="intro__body prose">
      ${ctx.paras(H.intro.paras.slice(0, 1), 'dropcap')}
      ${ctx.paras(H.intro.paras.slice(1))}
    </div>
    <blockquote class="pullquote intro__quote" data-reveal>
      <p>${ctx.rich(H.intro.quote)}</p>
      <footer>— ${ctx.esc(H.intro.quoteBy)}</footer>
    </blockquote>
  </div>
</section>

<section class="preview section" aria-labelledby="preview-title">
  <div class="wrap preview__grid">
    ${figure(ctx, 'tagliatelle', { cls: 'preview__figure', caption: H.menuPreview.caption, sizes: '(min-width: 64rem) 36vw, calc(100vw - 2.5rem)' })}
    <div class="menu-card" data-reveal style="--reveal-delay:.08s">
      ${kicker(ctx, H.menuPreview.kicker, 'kicker--center')}
      <h2 class="menu-card__title" id="preview-title">${t(ctx, H.menuPreview.title)}</h2>
      <ul role="list" class="dishes dishes--compact">
        ${preview.map(d => dish(ctx, d, { showTags: false })).join('\n')}
      </ul>
      <p class="menu-card__note">${ctx.esc(H.menuPreview.note)}</p>
      <p class="menu-card__more"><a class="textlink" href="menu.html">${ctx.esc(H.menuPreview.link)}<span aria-hidden="true"> →</span></a></p>
    </div>
  </div>
</section>

<section class="story-teaser section section--paper" aria-labelledby="story-title">
  <div class="wrap story-teaser__grid">
    ${figure(ctx, 'cucina', { cls: 'story-teaser__figure', caption: H.story.caption, sizes: '(min-width: 64rem) 34vw, calc(100vw - 2.5rem)' })}
    <div class="story-teaser__text">
      <header data-reveal>
        ${kicker(ctx, H.story.kicker)}
        <h2 class="h2" id="story-title">${t(ctx, H.story.title)}</h2>
      </header>
      <p class="lede-text" data-reveal>${ctx.rich(H.story.text)}</p>
      ${timeline(ctx, timelineSteps, 'timeline--compact')}
      <p><a class="textlink" href="storia.html">${ctx.esc(H.story.link)}<span aria-hidden="true"> →</span></a></p>
    </div>
  </div>
</section>

<section class="room section" aria-labelledby="room-title">
  <div class="wrap">
    <header class="sec-head sec-head--split" data-reveal>
      <div>
        ${kicker(ctx, H.room.kicker)}
        <h2 class="h2" id="room-title">${t(ctx, H.room.title)}</h2>
      </div>
      <p class="sec-head__text">${ctx.rich(H.room.text)}</p>
    </header>
    <div class="room__grid">
      ${figure(ctx, 'sala', { cls: 'room__a', caption: H.room.captions.sala, sizes: '(min-width: 64rem) 38vw, (min-width: 40rem) 46vw, 80vw' })}
      ${figure(ctx, 'hero', { cls: 'room__b frame--detail', caption: H.room.captions.hero, delay: '.08s', sizes: '(min-width: 64rem) 92vw, (min-width: 40rem) 100vw, 170vw' })}
      ${figure(ctx, 'cantina', { cls: 'room__c', caption: H.room.captions.cantina, delay: '.16s', sizes: '(min-width: 64rem) 36vw, (min-width: 40rem) 46vw, 72vw' })}
    </div>
  </div>
</section>

<section class="convivial section section--paper" aria-labelledby="convivial-title">
  <div class="wrap convivial__grid">
    <header class="convivial__head" data-reveal>
      ${kicker(ctx, H.convivial.kicker)}
      <h2 class="h2" id="convivial-title">${t(ctx, H.convivial.title)}</h2>
      <p class="lede-text">${ctx.rich(H.convivial.text)}</p>
    </header>
    ${figure(ctx, 'lasagne', { cls: 'convivial__figure', caption: H.convivial.caption, sizes: '(min-width: 64rem) 46vw, calc(100vw - 2.5rem)' })}
    <ul role="list" class="convivial__list">
      ${H.convivial.items.map((it, i) => `<li data-reveal style="--reveal-delay:${(i * 0.08).toFixed(2)}s">
        <h3 class="h3">${ctx.esc(it.title)}</h3>
        <p>${ctx.rich(it.text)}</p>
      </li>`).join('\n')}
    </ul>
  </div>
</section>

<section class="invite" aria-labelledby="invite-title">
  <div class="wrap invite__inner" data-reveal>
    <h2 class="invite__title" id="invite-title">${t(ctx, H.booking.title)}</h2>
    <p class="invite__text">${ctx.rich(H.booking.text)}</p>
    <div class="invite__actions">
      ${ctx.action('booking', ctx.esc(c.bookingLong), 'btn btn--light')}
      ${ctx.action('phone', `${ctx.esc(c.callLabel)} ${ctx.esc(ctx.config.contact.phoneDisplay)}`, 'btn btn--ghost-light')}
    </div>
  </div>
</section>

${visitBlock(ctx)}`;
}

/* ------------------------------------------------------------------ MENU */

function menuPage(ctx) {
  const M = ctx.menu;
  const P = ctx.content.menuPage;
  const c = ctx.content.common;
  const legend = (M.legend || []).map(l => `<li><span class="tag tag--${ctx.esc(l.tag)}">${ctx.esc(l.label)}</span> <span>${ctx.esc(l.text)}</span></li>`).join('');

  return `
<header class="page-head page-head--center">
  <div class="wrap">
    ${kicker(ctx, P.kicker || M.season, 'kicker--center')}
    <h1 class="page-head__title">${t(ctx, M.title)}</h1>
    <p class="page-head__lede">${ctx.rich(P.lede)}</p>
    <div class="ornament" aria-hidden="true"></div>
  </div>
</header>

<div class="wrap menu-layout">
  <nav class="menu-nav" data-menu-nav aria-label="Categorie del menu">
    <p class="menu-nav__title" aria-hidden="true">${ctx.esc(P.navLabel)}</p>
    <ul role="list" class="menu-nav__track" data-menu-nav-track>
      ${M.categories.map(cat => `<li><a class="menu-nav__link" href="#${ctx.esc(cat.id)}">${ctx.esc(cat.title)}</a></li>`).join('\n      ')}
    </ul>
  </nav>

  <div class="menu-body">
    <section class="menu-legend" aria-labelledby="legend-title">
      <h2 class="sr-only" id="legend-title">${ctx.esc(P.legendTitle)}</h2>
      <ul role="list">${legend}</ul>
    </section>

${M.categories.map(cat => `    <section class="menu-cat" id="${ctx.esc(cat.id)}" data-menu-category aria-labelledby="cat-${ctx.esc(cat.id)}">
      <header class="menu-cat__head">
        <h2 class="menu-cat__title" id="cat-${ctx.esc(cat.id)}">${ctx.esc(cat.title)}</h2>
        ${cat.intro ? `<p class="menu-cat__intro">${ctx.rich(cat.intro)}</p>` : ''}
      </header>
      <ul role="list" class="dishes">
        ${cat.items.map(it => dish(ctx, it)).join('\n')}
      </ul>
    </section>`).join('\n')}

    <section class="menu-notes" aria-labelledby="notes-title">
      <h2 class="h4" id="notes-title">${ctx.esc(P.notesTitle)}</h2>
      ${ctx.paras(M.note)}
    </section>

    ${ctx.allergenBlock('allergens')}

    <div class="menu-closing">
      <p>${ctx.rich(P.closing)}</p>
      ${ctx.action('booking', ctx.esc(c.bookingLong), 'btn')}
    </div>
  </div>
</div>`;
}

/* ------------------------------------------------------------------ STORIA */

function storiaPage(ctx) {
  const S = ctx.content.storia;
  const c = ctx.content.common;
  const ch = S.chapters;
  const chapter = (x, i) => `<section class="chapter" id="${ctx.esc(x.id)}" aria-labelledby="ch-${ctx.esc(x.id)}">
    <header class="chapter__head" data-reveal>
      <p class="chapter__num" aria-hidden="true">${ROMAN[i]}</p>
      <h2 class="chapter__title" id="ch-${ctx.esc(x.id)}">${ctx.esc(x.title)}</h2>
    </header>
    <div class="chapter__body prose">
      ${ctx.paras(x.paras.slice(0, 1), i === 0 ? 'dropcap' : '')}
      ${ctx.paras(x.paras.slice(1))}
    </div>
  </section>`;
  const sfogliaIdx = ch.findIndex(x => x.id === 'sfoglia');
  const famIdx = ch.findIndex(x => x.id === 'famiglia');

  const parts = ch.map((x, i) => {
    let html = chapter(x, i);
    if (i === famIdx) html += `
  <blockquote class="pullquote pullquote--wide" data-reveal>
    <p>${ctx.rich(S.quote)}</p>
    <footer>— ${ctx.esc(S.quoteBy)}</footer>
  </blockquote>`;
    if (i === sfogliaIdx) html += `
  <div class="triptych">
    ${figure(ctx, 'mani', { cls: 'triptych__a', caption: S.photos.mani, sizes: '(min-width: 48rem) 40vw, 46vw' })}
    ${figure(ctx, 'mattarello', { cls: 'triptych__b', caption: S.photos.mattarello, delay: '.08s', sizes: '(min-width: 48rem) 24vw, 46vw' })}
    ${figure(ctx, 'sfoglia', { cls: 'triptych__c', caption: S.photos.sfoglia, delay: '.16s', sizes: '(min-width: 48rem) 48vw, calc(100vw - 2.5rem)' })}
  </div>`;
    return html;
  }).join('\n');

  return `
<header class="page-head page-head--split">
  <div class="wrap page-head__grid">
    <div class="page-head__text">
      ${kicker(ctx, S.kicker, 'kicker--rule')}
      <h1 class="page-head__title">${t(ctx, S.title)}</h1>
      <p class="page-head__lede">${ctx.rich(S.lede)}</p>
    </div>
    ${figure(ctx, 'cucina', { cls: 'page-head__figure', caption: S.heroCaption, priority: true, reveal: false, sizes: '(min-width: 64rem) 36vw, calc(100vw - 2.5rem)' })}
  </div>
</header>

<article class="longform wrap">
  ${parts}
</article>

<section class="history section section--paper" aria-labelledby="history-title">
  <div class="wrap">
    <header class="sec-head sec-head--center" data-reveal>
      <h2 class="h2" id="history-title">${t(ctx, S.timelineTitle)}</h2>
    </header>
    ${timeline(ctx, S.timeline, 'timeline--wide')}
  </div>
</section>

<section class="closing section" aria-labelledby="closing-title">
  <div class="wrap closing__inner" data-reveal>
    <h2 class="h2" id="closing-title">${t(ctx, S.closingTitle)}</h2>
    <p class="lede-text">${ctx.rich(S.closingText)}</p>
    <div class="closing__actions">
      ${ctx.action('booking', ctx.esc(c.bookingLong), 'btn')}
      <a class="textlink" href="menu.html">${ctx.esc(c.menuLink)}<span aria-hidden="true"> →</span></a>
    </div>
  </div>
</section>`;
}

/* ------------------------------------------------------------------ CONTATTI */

function contattiPage(ctx) {
  const K = ctx.content.contatti;
  const c = ctx.content.common;
  const { config } = ctx;
  return `
<header class="page-head page-head--split page-head--contact">
  <div class="wrap page-head__grid">
    <div class="page-head__text">
      ${kicker(ctx, K.kicker, 'kicker--rule')}
      <h1 class="page-head__title">${t(ctx, K.title)}</h1>
      <p class="page-head__lede">${ctx.rich(K.lede)}</p>
    </div>
    ${figure(ctx, 'bicchieri', { cls: 'page-head__figure', caption: K.photoCaption, priority: true, reveal: false, sizes: '(min-width: 64rem) 40vw, calc(100vw - 2.5rem)' })}
  </div>
</header>

<section class="contact section" aria-label="Recapiti e orari">
  <div class="wrap contact__grid">
    <div class="contact__block contact__block--address">
      <h2 class="h3">${ctx.esc(c.addressTitle)}</h2>
      ${ctx.address()}
      <p class="note">${ctx.esc(c.demoAddress)}</p>
      ${ctx.action('maps', ctx.esc(c.mapsLabel), 'btn btn--ghost')}
    </div>
    <div class="contact__block">
      <h2 class="h3">${ctx.esc(K.phoneTitle)}</h2>
      <p class="contact__big">${ctx.action('phone', ctx.esc(config.contact.phoneDisplay), 'textlink textlink--plain')}</p>
      <h2 class="h3 contact__sub">${ctx.esc(K.emailTitle)}</h2>
      <p class="contact__big contact__big--email">${ctx.action('email', emailHtml(ctx), 'textlink textlink--plain contact-email')}</p>
      <h2 class="h3 contact__sub">${ctx.esc(K.socialTitle)}</h2>
      <ul role="list" class="contact__social">
        <li>${ctx.action('instagram', 'Instagram', 'textlink')}</li>
        <li>${ctx.action('facebook', 'Facebook', 'textlink')}</li>
        <li>${ctx.action('whatsapp', 'WhatsApp', 'textlink')}</li>
      </ul>
    </div>
    <div class="contact__block contact__block--hours">
      <h2 class="h3">${ctx.esc(c.hoursTitle)}</h2>
      ${ctx.hours('hours')}
      ${ctx.paras(K.hoursNote, 'note')}
    </div>
    <div class="contact__block contact__block--booking">
      <h2 class="h3">${ctx.esc(K.bookingTitle)}</h2>
      ${ctx.paras(K.bookingParas)}
      ${ctx.action('booking', ctx.esc(c.bookingLong), 'btn')}
    </div>
  </div>
</section>

<section class="directions section section--paper" aria-labelledby="directions-title">
  <div class="wrap">
    <header class="sec-head sec-head--split" data-reveal>
      <h2 class="h2" id="directions-title">${t(ctx, K.directionsTitle)}</h2>
      <p class="sec-head__text note">${ctx.esc(K.directionsNote)}</p>
    </header>
    <ol role="list" class="directions__list">
      ${K.directions.map((d, i) => `<li data-reveal style="--reveal-delay:${(i * 0.08).toFixed(2)}s">
        <h3 class="h3">${ctx.esc(d.title)}</h3>
        <p>${ctx.rich(d.text)}</p>
      </li>`).join('\n')}
    </ol>
    <div class="directions__foot">
      <div class="directions__access">
        <h3 class="h4">${ctx.esc(K.accessTitle)}</h3>
        <p>${ctx.rich(K.access)}</p>
      </div>
      ${ctx.action('maps', `${ctx.esc(c.mapsLabel)}<span aria-hidden="true"> →</span>`, 'textlink')}
    </div>
  </div>
</section>

<section class="fictional section" aria-label="Nota sul sito dimostrativo">
  <div class="wrap">
    <p class="fictional__text">${ctx.rich(K.fictional)}</p>
  </div>
</section>`;
}

/* ------------------------------------------------------------------ render */

module.exports.render = (ctx, page) => {
  const C = ctx.content;
  return {
    'index.html': page(ctx, { pageId: 'home', title: 'Home', description: C.home.meta, header: header(ctx, 'home'), main: home(ctx), footer: footer(ctx) }),
    'menu.html': page(ctx, { pageId: 'menu', title: 'Menu', description: C.menuPage.meta, header: header(ctx, 'menu'), main: menuPage(ctx), footer: footer(ctx) }),
    'storia.html': page(ctx, { pageId: 'storia', title: 'La nostra storia', description: C.storia.meta, header: header(ctx, 'storia'), main: storiaPage(ctx), footer: footer(ctx) }),
    'contatti.html': page(ctx, { pageId: 'contatti', title: 'Contatti', description: C.contatti.meta, header: header(ctx, 'contatti'), main: contattiPage(ctx), footer: footer(ctx) })
  };
};
