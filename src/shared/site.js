/* Comportamenti condivisi dai tre siti. Nessuna dipendenza esterna.
   - navigazione mobile accessibile          [data-nav-toggle] + [data-mobile-nav]
   - stato dell'header allo scroll           [data-header]  → .is-scrolled
   - finestre "collegamento dimostrativo"    [data-demo="booking|phone|…"]
   - indice delle categorie del menu         [data-menu-nav]  (link #categoria)
   - filtro dei piatti                       [data-menu-filter] + [data-tags]
   - galleria scorrevole con frecce          [data-scroller]
   - comparsa discreta allo scroll           [data-reveal]
   - barra azioni mobile                     [data-actionbar] */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Navigazione mobile ---------- */
  var toggle = doc.querySelector('[data-nav-toggle]');
  var panel = doc.querySelector('[data-mobile-nav]');
  if (toggle && panel) {
    var label = toggle.querySelector('.sr-only');
    var focusables = function () {
      return Array.prototype.filter.call(
        doc.querySelectorAll('[data-header] a, [data-header] button, [data-mobile-nav] a, [data-mobile-nav] button'),
        function (el) { return el.offsetParent !== null || el === toggle; });
    };
    var setOpen = function (open, returnFocus) {
      toggle.setAttribute('aria-expanded', String(open));
      if (label) label.textContent = open ? 'Chiudi il menu' : 'Apri il menu';
      root.classList.toggle('nav-open', open);
      if (open) {
        // nella raccolta demo la barra "Tutte le demo" sta sopra l'header: la si fa scorrere via
        // così header e pannello partono dal bordo superiore dello schermo
        var pb = doc.querySelector('.portal-bar');
        if (pb) { var pr = pb.getBoundingClientRect(); if (pr.bottom > 0) window.scrollBy({ top: pr.bottom, left: 0, behavior: 'instant' }); }
        panel.hidden = false;
        requestAnimationFrame(function () { panel.classList.add('is-open'); });
        var first = panel.querySelector('a, button');
        if (first) first.focus({ preventScroll: true });
      } else {
        panel.classList.remove('is-open');
        panel.hidden = true;
        if (returnFocus) toggle.focus();
      }
    };
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true', true); });
    panel.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a) setOpen(false, false);
    });
    doc.addEventListener('keydown', function (e) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (e.key === 'Escape') { setOpen(false, true); return; }
      if (e.key === 'Tab') { // il focus resta tra header e pannello
        var list = focusables(); if (!list.length) return;
        var i = list.indexOf(doc.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); list[list.length - 1].focus(); }
        else if (!e.shiftKey && i === list.length - 1) { e.preventDefault(); list[0].focus(); }
      }
    });
    // passando a una larghezza in cui il pulsante non è visibile, il pannello si chiude
    window.addEventListener('resize', function () {
      if (toggle.getAttribute('aria-expanded') === 'true' && getComputedStyle(toggle).display === 'none') setOpen(false, false);
    });
  }

  /* ---------- Header allo scroll ---------- */
  var header = doc.querySelector('[data-header]');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 12); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Collegamenti dimostrativi ---------- */
  var dialog = doc.getElementById('demo-dialog');
  var textsEl = doc.getElementById('demo-texts');
  if (dialog && textsEl) {
    var texts = JSON.parse(textsEl.textContent);
    var opener = null;
    doc.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-demo]');
      if (!btn) return;
      e.preventDefault();
      var t = texts[btn.getAttribute('data-demo')] || texts.booking;
      dialog.querySelector('.demo-dialog__title').textContent = t[0];
      dialog.querySelector('.demo-dialog__text').textContent = t[1];
      opener = btn;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else window.alert(t[0] + '\n\n' + t[1]);
    });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); }); // clic sullo sfondo
    dialog.addEventListener('close', function () {
      if (opener && doc.contains(opener) && opener.offsetParent !== null) opener.focus();
      opener = null;
    });
  }

  /* ---------- Indice delle categorie del menu (scrollspy) ---------- */
  var menuNav = doc.querySelector('[data-menu-nav]');
  if (menuNav && 'IntersectionObserver' in window) {
    var links = Array.prototype.slice.call(menuNav.querySelectorAll('a[href^="#"]'));
    var map = new Map();
    links.forEach(function (a) {
      var s = doc.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
      if (s) map.set(s, a);
    });
    var visible = new Set();
    var activate = function (a) {
      links.forEach(function (l) { l.classList.toggle('is-active', l === a); if (l === a) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current'); });
      // porta in vista il link attivo nella barra orizzontale, senza muovere la pagina
      var bar = a.closest('[data-menu-nav-track]') || menuNav;
      if (bar.scrollWidth > bar.clientWidth + 2) {
        var l = a.offsetLeft - (bar.clientWidth - a.offsetWidth) / 2;
        bar.scrollTo({ left: Math.max(0, l), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      }
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) visible.add(en.target); else visible.delete(en.target); });
      var first = null;
      map.forEach(function (a, s) { if (!first && visible.has(s)) first = a; });
      if (first) activate(first);
    }, { rootMargin: '-30% 0px -60% 0px' });
    map.forEach(function (a, s) { io.observe(s); });
  }

  /* ---------- Filtro dei piatti ---------- */
  var filters = doc.querySelectorAll('[data-menu-filter]');
  if (filters.length) {
    var status = doc.querySelector('[data-filter-status]');
    var apply = function () {
      var active = Array.prototype.filter.call(filters, function (b) { return b.getAttribute('aria-pressed') === 'true'; })
        .map(function (b) { return b.getAttribute('data-menu-filter'); });
      var count = 0;
      doc.querySelectorAll('[data-tags]').forEach(function (d) {
        var tags = (d.getAttribute('data-tags') || '').split(' ');
        var show = active.every(function (f) { return tags.indexOf(f) !== -1; });
        d.hidden = !show; if (show) count++;
      });
      doc.querySelectorAll('[data-menu-category]').forEach(function (c) {
        c.hidden = !c.querySelector('[data-tags]:not([hidden])');
        // anche la voce dell'indice delle categorie sparisce se la categoria è vuota
        if (c.id) doc.querySelectorAll('[data-menu-nav] a[href="#' + c.id + '"]').forEach(function (a) {
          var li = a.closest('li') || a; li.hidden = c.hidden;
        });
      });
      if (status) status.textContent = active.length ? count + (count === 1 ? ' piatto corrisponde al filtro.' : ' piatti corrispondono al filtro.') : 'Filtro rimosso: tutti i piatti sono visibili.';
    };
    filters.forEach(function (b) {
      b.addEventListener('click', function () {
        b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
        apply();
      });
    });
  }

  /* ---------- Galleria scorrevole ---------- */
  doc.querySelectorAll('[data-scroller]').forEach(function (sc) {
    var track = sc.querySelector('[data-scroller-track]');
    var prev = sc.querySelector('[data-scroller-prev]');
    var next = sc.querySelector('[data-scroller-next]');
    if (!track) return;
    var step = function (dir) {
      var item = track.firstElementChild;
      var w = item ? item.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : track.clientWidth * 0.8;
      track.scrollBy({ left: dir * w, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    };
    var sync = function () {
      var max = track.scrollWidth - track.clientWidth - 2;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
      sc.classList.toggle('is-static', max <= 0);
    };
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });

  /* ---------- Comparsa allo scroll ---------- */
  var reveals = doc.querySelectorAll('[data-reveal]');
  if (reveals.length) {
    if (!('IntersectionObserver' in window) || reduceMotion.matches) {
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var rio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-visible'); rio.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      reveals.forEach(function (el) { rio.observe(el); });
    }
  }

  /* ---------- Barra azioni mobile ---------- */
  var bar = doc.querySelector('[data-actionbar]');
  if (bar) {
    doc.body.classList.add('has-actionbar');
    // un elemento position:fixed ha sempre offsetParent null: si usa display
    var setH = function () { root.style.setProperty('--actionbar-h', (getComputedStyle(bar).display !== 'none' ? bar.offsetHeight : 0) + 'px'); };
    setH();
    window.addEventListener('resize', setH);
  }
})();
