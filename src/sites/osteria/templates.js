// Osteria Campolungo — template 02 "Osteria del territorio".
// Struttura editoriale e asimmetrica su griglia a 12 colonne. Tutti i testi arrivano da
// content.json e menu.json: qui c'è solo la composizione.
'use strict';

/* ---------- Piccoli componenti ---------- */

const arrow = '<span class="arrow" aria-hidden="true">→</span>';

/** <figure> con immagine responsive e didascalia opzionale. */
function fig(ctx, key, { cls = '', sizes, priority = false, caption = '' } = {}) {
  return `<figure class="fig${cls ? ' ' + cls : ''}">
  ${ctx.img(key, { sizes, priority, cls: 'fig__img' })}
  ${caption ? `<figcaption class="fig__cap">${ctx.esc(caption)}</figcaption>` : ''}
</figure>`;
}

function kicker(ctx, text) {
  return text ? `<p class="kicker">${ctx.esc(text)}</p>` : '';
}

/** Collegamento al telefono / e-mail che mostra il dato stesso. */
const phoneAction = (ctx, cls = 'textlink') => ctx.action('phone', ctx.esc(ctx.config.contact.phoneDisplay), cls);
// l'indirizzo va a capo solo dopo la @ o prima dell'ultimo punto, mai a metà parola
const emailAction = (ctx, cls = 'textlink') => ctx.action('email', ctx.esc(ctx.config.contact.email).replace('@', '@<wbr>').replace(/\.([^.]+)$/, '<wbr>.$1'), cls);

function bookBtn(ctx, label, cls = 'btn btn--solid') {
  return ctx.action('booking', `${ctx.esc(label || ctx.content.ui.book)}`, cls);
}

function socialList(ctx, cls) {
  const u = ctx.content.ui;
  return `<ul class="${cls}" role="list">
    <li>${ctx.action('instagram', ctx.esc(u.instagram), 'textlink')}</li>
    <li>${ctx.action('facebook', ctx.esc(u.facebook), 'textlink')}</li>
    <li>${ctx.action('whatsapp', ctx.esc(u.whatsapp), 'textlink')}</li>
  </ul>`;
}

function wordmark(ctx, tag = 'span') {
  const b = ctx.content.brand;
  return `<${tag} class="wordmark"><span class="wordmark__pre">${ctx.esc(b.pre)}</span> <span class="wordmark__name">${ctx.esc(b.name)}</span></${tag}>`;
}

/** Cerca un piatto in menu.json per nome (i prezzi restano in un solo posto). */
function findDish(ctx, name) {
  for (const c of ctx.menu.categories) {
    const d = c.items.find(i => i.name === name);
    if (d) return { ...d, category: c.id };
  }
  throw new Error(`[osteria] piatto non trovato in menu.json: "${name}"`);
}

const priceTag = (ctx, p) => `${ctx.price(p)}<span class="cur"> ${ctx.esc(ctx.content.ui.currency)}</span>`;

/* ---------- Header e footer ---------- */

function header(ctx, pageId) {
  const u = ctx.content.ui;
  return `<header class="site-header" data-header>
  <div class="site-header__bar wrap">
    <a class="site-header__brand" href="index.html">${wordmark(ctx)}</a>
    <nav class="site-nav" aria-label="Principale"><ul role="list">${ctx.navLinks(pageId, 'site-nav__link')}</ul></nav>
    ${ctx.action('booking', `<span>Prenota<span class="site-header__book-more"> un tavolo</span></span>`, 'site-header__book')}
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" data-nav-toggle><span class="sr-only">Apri il menu</span><span class="nav-toggle__bars" aria-hidden="true"><span></span><span></span><span></span></span></button>
  </div>
  <div class="mobile-nav" id="mobile-nav" data-mobile-nav hidden>
    <div class="mobile-nav__inner wrap">
      <nav aria-label="Principale mobile"><ul role="list" class="mobile-nav__list">${ctx.navLinks(pageId, 'mobile-nav__link')}</ul></nav>
      <div class="mobile-nav__actions">
        ${bookBtn(ctx, u.book)}
        ${ctx.action('phone', `${ctx.esc(u.call)} <span class="mobile-nav__num">${ctx.esc(ctx.config.contact.phoneDisplay)}</span>`, 'btn btn--line')}
      </div>
      ${ctx.hours('hours hours--compact')}
    </div>
  </div>
</header>`;
}

function footer(ctx, pageId) {
  const f = ctx.content.footer, u = ctx.content.ui;
  return `<footer class="site-footer">
  <div class="wrap site-footer__grid">
    <div class="site-footer__brand">
      <a href="index.html" class="site-footer__home">${wordmark(ctx)}</a>
      <p class="site-footer__tagline">${ctx.esc(f.tagline)}</p>
      ${bookBtn(ctx, u.book, 'btn btn--light')}
    </div>
    <div class="site-footer__col">
      <h2 class="site-footer__title">${ctx.esc(f.visitTitle)}</h2>
      ${ctx.address()}
      <p class="site-footer__demo">${ctx.esc(u.demoAddress)}</p>
      <p class="site-footer__contact">${phoneAction(ctx)}<br>${emailAction(ctx)}</p>
    </div>
    <div class="site-footer__col">
      <h2 class="site-footer__title">${ctx.esc(f.hoursTitle)}</h2>
      ${ctx.hours('hours hours--footer')}
    </div>
    <nav class="site-footer__col" aria-label="Pagine del sito">
      <h2 class="site-footer__title">${ctx.esc(f.navTitle)}</h2>
      <ul role="list" class="site-footer__list">${ctx.navLinks(pageId, 'textlink')}</ul>
    </nav>
    <div class="site-footer__col">
      <h2 class="site-footer__title">${ctx.esc(f.socialTitle)}</h2>
      ${socialList(ctx, 'site-footer__list')}
    </div>
  </div>
  <div class="wrap site-footer__base">
    <p>${ctx.esc(f.disclaimer)}</p>
    <p>© ${ctx.year} ${ctx.esc(f.copyright)}</p>
  </div>
</footer>`;
}

/* ---------- HOME ---------- */

function home(ctx) {
  const h = ctx.content.home, u = ctx.content.ui;
  const hero = h.hero, intro = h.intro, season = h.season, pv = h.menuPreview,
    story = h.story, prod = h.producers, tav = h.tavolata, inv = h.invite, info = h.info;

  const previewDishes = pv.pick.map(n => findDish(ctx, n)).map(d => `
        <li class="preview__dish">
          <div class="dish__row">
            <h3 class="dish__name">${ctx.esc(d.name)}</h3>
            <p class="dish__price"><span class="sr-only">Prezzo: </span>${priceTag(ctx, d.price)}</p>
          </div>
          <p class="dish__desc">${ctx.esc(d.desc)}</p>
        </li>`).join('');

  const seasonItems = season.items.map(s => `
        <li class="season__item">
          <h3 class="season__name">${ctx.esc(s.name)}</h3>
          <p class="season__when">${ctx.esc(s.when)}</p>
          <p class="season__from">${ctx.esc(s.from)}</p>
          <p class="season__dish">${ctx.esc(s.dish)}</p>
        </li>`).join('');

  const stripItems = prod.items.map((p, i) => `
        <li class="strip__item strip__item--${ctx.images[p.img].width >= ctx.images[p.img].height ? 'land' : 'port'}">
          <figure class="fig">
            ${ctx.img(p.img, { sizes: ctx.images[p.img].width >= ctx.images[p.img].height ? '(min-width: 60em) 30rem, 78vw' : '(min-width: 60em) 20rem, 60vw', cls: 'fig__img' })}
            <figcaption class="strip__cap"><span class="strip__num">${String(i + 1).padStart(2, '0')}</span> <strong>${ctx.esc(p.title)}</strong> ${ctx.esc(p.text)}</figcaption>
          </figure>
        </li>`).join('');

  const details = tav.details.map(d => `<div><dt>${ctx.esc(d.term)}</dt><dd>${ctx.esc(d.desc)}</dd></div>`).join('');

  return `
<section class="hero" aria-labelledby="hero-title">
  <div class="wrap hero__grid">
    <div class="hero__head">
      ${kicker(ctx, hero.kicker)}
      <h1 class="hero__title" id="hero-title">${ctx.rich(hero.title)}</h1>
    </div>
    <div class="hero__lede">
      <p class="lede">${ctx.esc(hero.lede)}</p>
      <div class="actions">
        ${bookBtn(ctx, u.book)}
        <a class="link-arrow" href="menu.html">${ctx.esc(hero.secondary)} ${arrow}</a>
      </div>
    </div>
    ${fig(ctx, 'hero', { cls: 'hero__main', priority: true, sizes: '(min-width: 60em) 50vw, 100vw', caption: hero.caption })}
    ${fig(ctx, 'pane', { cls: 'hero__inset', sizes: '(min-width: 60em) 22vw, 44vw' })}
  </div>
</section>

<section class="intro section" aria-labelledby="intro-title">
  <div class="wrap intro__grid">
    <h2 class="intro__title" id="intro-title">${ctx.esc(intro.title)}</h2>
    <p class="intro__statement" data-reveal>${ctx.esc(intro.statement)}</p>
    <div class="intro__body prose">
      ${ctx.paras(intro.paras)}
      <p><a class="link-arrow" href="storia.html">${ctx.esc(intro.link)} ${arrow}</a></p>
    </div>
  </div>
</section>

<section class="season" aria-labelledby="season-title">
  <div class="wrap">
    <div class="season__head">
      <h2 class="season__title" id="season-title">${ctx.esc(season.title)}</h2>
      <p class="season__label">${ctx.esc(season.label)}</p>
      <p class="season__intro">${ctx.esc(season.intro)}</p>
    </div>
    <ul class="season__list" role="list">${seasonItems}
    </ul>
  </div>
</section>

<section class="preview section" aria-labelledby="preview-title">
  <div class="wrap preview__grid">
    ${fig(ctx, 'porcini', { cls: 'preview__main', sizes: '(min-width: 60em) 40vw, 100vw', caption: pv.captionMain })}
    <div class="preview__text">
      ${kicker(ctx, pv.kicker)}
      <h2 class="h2" id="preview-title">${ctx.esc(pv.title)}</h2>
      <p class="preview__intro">${ctx.esc(pv.text)}</p>
      <ul class="preview__list" role="list">${previewDishes}
      </ul>
      <p><a class="link-arrow" href="menu.html">${ctx.esc(pv.link)} ${arrow}</a></p>
    </div>
    ${fig(ctx, 'zuppa', { cls: 'preview__small', sizes: '(min-width: 60em) 20vw, 50vw', caption: pv.captionSmall })}
  </div>
</section>

<section class="teaser section" aria-labelledby="teaser-title">
  <div class="wrap teaser__grid">
    <div class="teaser__text">
      ${kicker(ctx, story.kicker)}
      <h2 class="h2" id="teaser-title">${ctx.esc(story.title)}</h2>
      <div class="prose">${ctx.paras(story.paras)}</div>
      <p><a class="link-arrow" href="storia.html">${ctx.esc(story.link)} ${arrow}</a></p>
    </div>
    ${fig(ctx, 'colline', { cls: 'teaser__fig', sizes: '(min-width: 60em) 42vw, 100vw', caption: story.caption })}
  </div>
</section>

<section class="producers section" aria-labelledby="producers-title">
  <div class="strip" data-scroller>
    <div class="wrap strip__head">
      <div class="strip__intro">
        ${kicker(ctx, prod.kicker)}
        <h2 class="h2" id="producers-title">${ctx.esc(prod.title)}</h2>
        <p>${ctx.esc(prod.intro)}</p>
      </div>
      <div class="strip__controls">
        <button class="strip__btn" type="button" data-scroller-prev aria-label="${ctx.esc(u.prev)}"><span aria-hidden="true">←</span></button>
        <button class="strip__btn" type="button" data-scroller-next aria-label="${ctx.esc(u.next)}"><span aria-hidden="true">→</span></button>
      </div>
    </div>
    <ul class="strip__track" role="list" data-scroller-track tabindex="0" aria-label="${ctx.esc(prod.title)}">${stripItems}
    </ul>
  </div>
</section>

<section class="tavolata" aria-labelledby="tavolata-title">
  <div class="wrap tavolata__grid">
    ${fig(ctx, 'tavola', { cls: 'tavolata__fig', sizes: '(min-width: 60em) 36vw, 100vw', caption: tav.caption })}
    <div class="tavolata__text">
      ${kicker(ctx, tav.kicker)}
      <h2 class="h2" id="tavolata-title">${ctx.esc(tav.title)}</h2>
      <div class="prose">${ctx.paras(tav.paras)}</div>
      <dl class="facts">${details}</dl>
      ${bookBtn(ctx, tav.cta, 'btn btn--light')}
    </div>
  </div>
</section>

<section class="invite" aria-labelledby="invite-title">
  ${fig(ctx, 'tramonto', { cls: 'invite__fig', sizes: '100vw', caption: inv.caption })}
  <div class="wrap">
    <div class="invite__card">
      <h2 class="h2" id="invite-title">${ctx.esc(inv.title)}</h2>
      <p>${ctx.esc(inv.text)}</p>
      <div class="actions">
        ${bookBtn(ctx, u.book)}
        ${ctx.action('phone', `${ctx.esc(u.call)} ${ctx.esc(ctx.config.contact.phoneDisplay)}`, 'link-arrow')}
      </div>
    </div>
  </div>
</section>

<section class="info section" aria-labelledby="info-title">
  <div class="wrap info__grid">
    <h2 class="info__title" id="info-title">${ctx.esc(info.title)}</h2>
    <div class="info__col">
      <h3 class="label">${ctx.esc(info.hoursTitle)}</h3>
      ${ctx.hours('hours')}
    </div>
    <div class="info__col">
      <h3 class="label">${ctx.esc(info.addressTitle)}</h3>
      ${ctx.address()}
      <p class="demo-note">${ctx.esc(u.demoAddress)}</p>
      <p class="info__links">${ctx.action('maps', ctx.esc(u.maps), 'textlink')}<br><a class="textlink" href="contatti.html#come-arrivare">${ctx.esc(info.directionsLink)}</a></p>
    </div>
    <div class="info__col">
      <h3 class="label">${ctx.esc(info.contactTitle)}</h3>
      <p>${ctx.esc(info.contactText)}</p>
      <p class="info__links">${phoneAction(ctx)}<br>${emailAction(ctx)}</p>
    </div>
  </div>
</section>`;
}

/* ---------- MENU ---------- */

function menuPage(ctx) {
  const m = ctx.content.menu, menu = ctx.menu, tags = ctx.content.tags, u = ctx.content.ui;
  const cats = menu.categories;

  const tagList = list => list.length
    ? `<p class="dish__tags"><span class="sr-only">Segni: </span>${list.map(t => `<span class="tag tag--${ctx.esc(t)}">${ctx.esc(tags[t] || t)}</span>`).join('')}</p>`
    : '';

  const nav = cats.map(c => `<li><a class="chip" href="#${ctx.esc(c.id)}">${ctx.esc(c.title)}</a></li>`).join('');

  const sections = cats.map((c, i) => `
  <section class="cat" id="${ctx.esc(c.id)}" data-menu-category aria-labelledby="${ctx.esc(c.id)}-title">
    <div class="cat__head">
      <p class="cat__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</p>
      <h2 class="cat__title" id="${ctx.esc(c.id)}-title">${ctx.esc(c.title)}</h2>
      ${c.intro ? `<p class="cat__intro">${ctx.esc(c.intro)}</p>` : ''}
    </div>
    <ul class="cat__items" role="list">${c.items.map(d => `
      <li class="dish" data-tags="${ctx.esc((d.tags || []).join(' '))}">
        <div class="dish__row">
          <h3 class="dish__name">${ctx.esc(d.name)}</h3>
          <p class="dish__price"><span class="sr-only">Prezzo: </span>${priceTag(ctx, d.price)}</p>
        </div>
        <p class="dish__desc">${ctx.esc(d.desc)}</p>
        ${tagList(d.tags || [])}
        ${ctx.allergens(d)}
      </li>`).join('')}
    </ul>
    ${c.note ? `<p class="cat__note"><span class="cat__note-label">${ctx.esc(m.producerLabel)}</span> ${ctx.esc(c.note)}</p>` : ''}
  </section>`).join('');

  const legend = m.legend.map(l => `<li><span class="tag tag--${ctx.esc(l.tag)}">${ctx.esc(tags[l.tag])}</span> ${ctx.esc(l.text)}</li>`).join('');

  return `
<section class="page-head page-head--menu" aria-labelledby="menu-title">
  <div class="wrap page-head__grid">
    <div class="page-head__text">
      ${kicker(ctx, `${m.kicker} · ${menu.season}`)}
      <h1 class="page-title" id="menu-title">${ctx.esc(menu.title)}</h1>
      <p class="lede">${ctx.esc(m.lede)}</p>
      <div class="legend">
        <p class="label">${ctx.esc(m.legendTitle)}</p>
        <ul class="legend__list" role="list">${legend}</ul>
      </div>
    </div>
    ${fig(ctx, 'zucca', { cls: 'page-head__fig', priority: true, sizes: '(min-width: 60em) 28vw, (min-width: 40em) 42vw, 62vw', caption: m.caption })}
  </div>
</section>

<nav class="menu-nav" data-menu-nav aria-label="${ctx.esc(m.navLabel)}">
  <ul class="menu-nav__track" role="list" data-menu-nav-track>${nav}</ul>
</nav>

<div class="wrap carta">${sections}
</div>

<section class="menu-end section" aria-labelledby="notes-title">
  <div class="wrap menu-end__grid">
    <div class="menu-end__notes">
      <h2 class="label" id="notes-title">${ctx.esc(m.notesTitle)}</h2>
      ${ctx.paras(menu.note, 'menu-end__note')}
    </div>
    ${ctx.allergenBlock('allergens')}
    <div class="menu-end__book">
      <h2 class="h3">${ctx.esc(m.outro.title)}</h2>
      <p>${ctx.esc(m.outro.text)}</p>
      <div class="actions">${bookBtn(ctx, u.book)}${phoneAction(ctx, 'link-arrow')}</div>
    </div>
  </div>
</section>`;
}

/* ---------- STORIA ---------- */

function storia(ctx) {
  const s = ctx.content.storia, u = ctx.content.ui;

  const chapters = s.chapters.map((c, i) => `
<section class="chapter chapter--${i % 2 ? 'b' : 'a'} section" id="${ctx.esc(c.id)}" aria-labelledby="${ctx.esc(c.id)}-title">
  <div class="wrap chapter__grid">
    ${fig(ctx, c.img, { cls: 'chapter__fig', sizes: '(min-width: 60em) 38vw, 100vw', caption: c.caption })}
    <div class="chapter__text">
      <p class="kicker"><span class="kicker__num">${String(i + 1).padStart(2, '0')}</span> ${ctx.esc(c.kicker)}</p>
      <h2 class="h2" id="${ctx.esc(c.id)}-title">${ctx.esc(c.title)}</h2>
      <div class="prose">${ctx.paras(c.paras)}</div>
    </div>
  </div>
</section>`);

  const quote = `
<figure class="pullquote">
  <div class="wrap">
    <blockquote class="pullquote__text"><p>${ctx.esc(s.quote.text)}</p></blockquote>
    <figcaption class="pullquote__cite">${ctx.esc(s.quote.cite)}</figcaption>
  </div>
</figure>`;

  const people = s.people;
  const peopleList = people.list.map(p => `<div><dt>${ctx.esc(p.name)}</dt><dd>${ctx.esc(p.text)}</dd></div>`).join('');
  const hosp = s.hospitality;

  return `
<section class="page-head page-head--storia" aria-labelledby="storia-title">
  <div class="wrap page-head__intro">
    ${kicker(ctx, s.kicker)}
    <h1 class="page-title" id="storia-title">${ctx.rich(s.title)}</h1>
    <p class="lede">${ctx.esc(s.lede)}</p>
  </div>
  ${fig(ctx, 'colline', { cls: 'wide-fig wide-fig--top', priority: true, sizes: '100vw', caption: s.heroCaption })}
</section>
${chapters[0]}
${chapters[1]}
${quote}
${chapters[2]}

<section class="people section" aria-labelledby="people-title">
  <div class="wrap people__grid">
    <div class="people__head">
      ${kicker(ctx, people.kicker)}
      <h2 class="h2" id="people-title">${ctx.esc(people.title)}</h2>
      <p>${ctx.esc(people.intro)}</p>
    </div>
    <dl class="people__list">${peopleList}</dl>
    ${fig(ctx, people.img, { cls: 'people__fig', sizes: '(min-width: 60em) 50vw, 100vw', caption: people.caption })}
  </div>
</section>

<section class="invite invite--storia" aria-labelledby="hosp-title">
  ${fig(ctx, 'tramonto', { cls: 'invite__fig', sizes: '100vw', caption: hosp.caption })}
  <div class="wrap">
    <div class="invite__card">
      ${kicker(ctx, hosp.kicker)}
      <h2 class="h2" id="hosp-title">${ctx.esc(hosp.title)}</h2>
      ${ctx.paras(hosp.paras)}
      <div class="actions">${bookBtn(ctx, u.book)}<a class="link-arrow" href="menu.html">${ctx.esc(ctx.content.home.hero.secondary)} ${arrow}</a></div>
    </div>
  </div>
</section>`;
}

/* ---------- CONTATTI ---------- */

function contatti(ctx) {
  const c = ctx.content.contatti, u = ctx.content.ui, d = c.directions;
  const steps = d.steps.map((s, i) => `
      <li class="route__step">
        <span class="route__num" aria-hidden="true">${i + 1}</span>
        <h3 class="route__title">${ctx.esc(s.title)}</h3>
        <p>${ctx.esc(s.text)}</p>
      </li>`).join('');

  return `
<section class="page-head page-head--contatti" aria-labelledby="contatti-title">
  <div class="wrap page-head__intro">
    ${kicker(ctx, c.kicker)}
    <h1 class="page-title" id="contatti-title">${ctx.esc(c.title)}</h1>
    <p class="lede">${ctx.esc(c.lede)}</p>
  </div>
</section>

<section class="visit section section--tight" aria-label="Recapiti e orari">
  <div class="wrap visit__grid">
    <div class="visit__block visit__block--address">
      <h2 class="label">${ctx.esc(c.addressTitle)}</h2>
      <div class="visit__address">${ctx.address()}</div>
      <p class="demo-note">${ctx.esc(u.demoAddress)}</p>
      ${ctx.action('maps', `${ctx.esc(u.maps)} ${arrow}`, 'btn btn--line')}
    </div>
    <div class="visit__block">
      <h2 class="label">${ctx.esc(c.hoursTitle)}</h2>
      ${ctx.hours('hours')}
      <p class="visit__note">${ctx.esc(c.hoursNote)}</p>
    </div>
    <div class="visit__block">
      <h2 class="label">${ctx.esc(c.phoneTitle)}</h2>
      <p class="visit__big">${phoneAction(ctx)}</p>
      <p class="visit__note">${ctx.esc(c.phoneNote)}</p>
      <h2 class="label visit__sub">${ctx.esc(c.emailTitle)}</h2>
      <p class="visit__mail">${emailAction(ctx)}</p>
    </div>
    <div class="visit__block">
      <h2 class="label">${ctx.esc(c.socialTitle)}</h2>
      ${socialList(ctx, 'visit__social')}
    </div>
  </div>
</section>

<section class="route section" id="come-arrivare" aria-labelledby="route-title">
  <div class="wrap route__grid">
    <div class="route__head">
      <h2 class="h2" id="route-title">${ctx.esc(d.title)}</h2>
      <p class="demo-note">${ctx.esc(d.intro)}</p>
      ${fig(ctx, 'hero', { cls: 'route__fig', sizes: '(min-width: 60em) 34vw, 100vw', caption: c.caption })}
    </div>
    <div class="route__body">
      <ol class="route__steps" role="list">${steps}
      </ol>
      <p class="route__note">${ctx.esc(d.note)}</p>
    </div>
  </div>
</section>

<section class="book-band" aria-labelledby="book-title">
  <div class="wrap book-band__grid">
    <h2 class="h2" id="book-title">${ctx.esc(c.booking.title)}</h2>
    <div class="book-band__text">
      ${ctx.paras(c.booking.paras)}
      <div class="actions">${bookBtn(ctx, u.book, 'btn btn--light')}${ctx.action('email', `${ctx.esc(u.writeUs)} ${arrow}`, 'link-arrow')}</div>
    </div>
    <div class="book-band__access">
      <h3 class="label">${ctx.esc(c.access.title)}</h3>
      <p>${ctx.esc(c.access.text)}</p>
    </div>
  </div>
</section>

<section class="section section--tight" aria-label="Nota sui dati">
  <div class="wrap"><p class="fictional">${ctx.esc(c.fictional)}</p></div>
</section>`;
}

/* ---------- Pagine ---------- */

module.exports.render = (ctx, page) => {
  const C = ctx.content;
  const mk = (pageId, title, description, main) =>
    page(ctx, { pageId, title, description, header: header(ctx, pageId), main, footer: footer(ctx, pageId) });
  return {
    'index.html': mk('home', 'Home', C.home.meta, home(ctx)),
    'menu.html': mk('menu', 'Menu', C.menu.meta, menuPage(ctx)),
    'storia.html': mk('storia', 'La nostra storia', C.storia.meta, storia(ctx)),
    'contatti.html': mk('contatti', 'Contatti', C.contatti.meta, contatti(ctx))
  };
};
