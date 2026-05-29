/* =========================================================
   Dutch Mike — Portfolio
   Animations: scroll reveals, hero signature, nav state,
   work-page filtering.
   ========================================================= */

(function () {
  'use strict';

  // ---------- Nav: solidify on scroll + swap to float pill ----------
  const nav = document.querySelector('.nav');
  const navFloat = document.getElementById('navFloat');
  if (nav) {
    const COLLAPSE_AT = 80;
    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 8);
      const collapsed = y > COLLAPSE_AT;
      nav.classList.toggle('is-hidden', collapsed);
      if (navFloat) {
        navFloat.classList.toggle('is-visible', collapsed);
        navFloat.setAttribute('aria-hidden', String(!collapsed));
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ---------- Overlay menu open/close ----------
  const overlay = document.getElementById('navOverlay');
  const menuBtn = document.getElementById('navMenuBtn');
  const closeBtn = document.getElementById('navMenuClose');
  if (overlay && menuBtn) {
    const openMenu = () => {
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      menuBtn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('has-nav-overlay-open');
    };
    const closeMenu = () => {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      menuBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('has-nav-overlay-open');
    };
    menuBtn.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeMenu();
    });
    overlay.querySelectorAll('[data-nav-close]').forEach((el) => {
      el.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeMenu();
    });
  }

  // ---------- Mark active nav link ----------
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links a').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href) return;
    const last = href.split('/').pop();
    if (last === path) a.classList.add('is-active');
    if (path.startsWith('') && href.includes('work.html') && path.startsWith('inbound-sentinel')) a.classList.add('is-active');
  });

  // ---------- Scroll reveals ----------
  const revealEls = document.querySelectorAll('.reveal, .stagger');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  // ---------- Hero signature animation ----------
  // A typing "prompt → generation" loop that quietly signals
  // "this person builds with AI."
  const sig = document.querySelector('[data-signature]');
  if (sig) {
    const body = sig.querySelector('.sig__body');
    const lines = [
      [
        { label: 'prompt  ', text: 'design an agent that qualifies inbound leads 24/7' },
        { label: 'tools   ', text: '[crm.search, calendar.book, slack.notify]' },
        { label: 'status  ', text: 'deployed — handling 312 conversations / week' }
      ],
      [
        { label: 'prompt  ', text: 'turn a discovery call transcript into a proposal' },
        { label: 'tools   ', text: '[transcript.parse, rag.retrieve, docs.draft]' },
        { label: 'status  ', text: 'shipped — proposal time 4h → 9min' }
      ],
      [
        { label: 'prompt  ', text: 'build a RAG layer over 8 years of internal docs' },
        { label: 'tools   ', text: '[chunk, embed, rerank, cite]' },
        { label: 'status  ', text: 'live — 94% answer accuracy on eval set' }
      ]
    ];

    let scene = 0;

    function renderScene(idx) {
      body.innerHTML = '';
      const set = lines[idx];
      let lineEls = set.map(() => {
        const span = document.createElement('span');
        span.className = 'sig__line';
        body.appendChild(span);
        return span;
      });

      let cursor;
      let i = 0;

      function typeLine() {
        if (i >= set.length) {
          // hold, then advance
          setTimeout(() => {
            scene = (scene + 1) % lines.length;
            renderScene(scene);
          }, 3000);
          return;
        }
        const { label, text } = set[i];
        const el = lineEls[i];
        el.innerHTML = '<span class="label">' + label + '</span>';
        // cursor
        if (cursor) cursor.remove();
        cursor = document.createElement('span');
        cursor.className = 'sig__cursor';
        el.appendChild(cursor);

        let j = 0;
        const speed = 18 + Math.random() * 14;

        function tick() {
          if (j <= text.length) {
            cursor.before(document.createTextNode(text.charAt(j - 1) || ''));
            j++;
            setTimeout(tick, speed);
          } else {
            // line done
            cursor.remove();
            cursor = null;
            i++;
            setTimeout(typeLine, 220);
          }
        }
        // start typing
        setTimeout(tick, 80);
      }

      typeLine();
    }

    renderScene(0);
  }

  // ---------- Work-row hover thumbnail ----------
  const rows = document.querySelectorAll('[data-work-row]');
  if (rows.length) {
    const thumb = document.createElement('div');
    thumb.className = 'work-row__thumb';
    document.body.appendChild(thumb);

    let activeRow = null;
    let mouseX = 0, mouseY = 0;
    let raf = 0;

    function tick() {
      raf = 0;
      if (!activeRow) return;
      thumb.style.left = mouseX + 'px';
      thumb.style.top = mouseY + 'px';
    }

    rows.forEach((row) => {
      row.addEventListener('mouseenter', () => {
        thumb.innerHTML = row.getAttribute('data-thumb') || '';
        thumb.classList.add('is-visible');
        activeRow = row;
      });
      row.addEventListener('mouseleave', () => {
        thumb.classList.remove('is-visible');
        activeRow = null;
      });
      row.addEventListener('mousemove', (e) => {
        mouseX = e.clientX + 80;
        mouseY = e.clientY;
        if (!raf) raf = requestAnimationFrame(tick);
      });
    });
  }

  // ---------- Work-card Explore pill follows cursor ----------
  const workCards = document.querySelectorAll('.work-card');
  workCards.forEach((card) => {
    let raf = 0, px = 0, py = 0;
    const apply = () => {
      raf = 0;
      card.style.setProperty('--cx', px + 'px');
      card.style.setProperty('--cy', py + 'px');
    };
    card.addEventListener('mouseenter', (e) => {
      const r = card.getBoundingClientRect();
      px = e.clientX - r.left;
      py = e.clientY - r.top;
      card.style.setProperty('--cx', px + 'px');
      card.style.setProperty('--cy', py + 'px');
    });
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      px = e.clientX - r.left;
      py = e.clientY - r.top;
      if (!raf) raf = requestAnimationFrame(apply);
    });
  });

  // ---------- Work filters (work-page chips OR legacy buttons) ----------
  const chipBtns = document.querySelectorAll('.filter-bar .chip, .work-filters button');
  if (chipBtns.length) {
    chipBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter || 'all';
        chipBtns.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        // Feature cards (work page grid)
        document.querySelectorAll('.feature-card[data-tag]').forEach((card) => {
          const tag = card.dataset.tag;
          if (filter === 'all' || tag === filter) card.classList.remove('is-hidden');
          else card.classList.add('is-hidden');
        });

        // Legacy work-rows (if present)
        document.querySelectorAll('.work-row[data-category]').forEach((row) => {
          const cat = row.dataset.category;
          row.style.display = (filter === 'all' || cat === filter) ? '' : 'none';
        });
      });
    });
  }

  // ---------- Year stamp in footer ----------
  const y = document.querySelectorAll('[data-year]');
  y.forEach((el) => (el.textContent = String(new Date().getFullYear())));

  // ---------- Lightbox (galleries, mockup grids, hero/still images) ----------
  const triggers = document.querySelectorAll(
    '.gallery__item, .mockup-zoom, .mockup, .mockup-hero, .cs-hero, .case-still img'
  );
  if (triggers.length) {
    // Group items by their parent gallery / mockup-grid for prev/next navigation.
    // Standalone items (.mockup-hero, .cs-hero, .case-still img) are their own single-item "gallery".
    const galleries = new Map();
    triggers.forEach((el) => {
      const group = el.closest('.gallery, .mockup-grid') || el;
      if (!galleries.has(group)) galleries.set(group, []);
      galleries.get(group).push(el);
    });

    // Build the lightbox DOM once.
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-hidden', 'true');
    lb.innerHTML = `
      <button class="lightbox__close" aria-label="Close">×</button>
      <button class="lightbox__nav lightbox__nav--prev" aria-label="Previous">‹</button>
      <button class="lightbox__nav lightbox__nav--next" aria-label="Next">›</button>
      <div class="lightbox__stage">
        <img class="lightbox__img" alt="" />
      </div>
      <div class="lightbox__caption" aria-hidden="true"></div>
    `;
    document.body.appendChild(lb);
    const stage = lb.querySelector('.lightbox__stage');
    const img = lb.querySelector('.lightbox__img');
    const cap = lb.querySelector('.lightbox__caption');

    // Drop stale redact overlays from the previous open.
    function clearStageRedacts() {
      stage.querySelectorAll('.redact').forEach((n) => n.remove());
    }
    // Copy any .redact overlays from the source element into the lightbox stage
    // so the PII stays redacted in the enlarged view.
    function syncStageRedacts(el) {
      clearStageRedacts();
      const sources = el.querySelectorAll('.redact');
      sources.forEach((src) => {
        const clone = src.cloneNode(false);
        stage.appendChild(clone);
      });
    }
    const btnClose = lb.querySelector('.lightbox__close');
    const btnPrev = lb.querySelector('.lightbox__nav--prev');
    const btnNext = lb.querySelector('.lightbox__nav--next');

    let currentItems = [];
    let currentIdx = 0;

    function srcOf(el) {
      if (el.tagName === 'IMG') return el.getAttribute('src');
      return el.getAttribute('href')
        || el.getAttribute('data-src')
        || el.querySelector('img')?.getAttribute('src');
    }
    function altOf(el) {
      if (el.tagName === 'IMG') {
        return el.getAttribute('data-caption') || el.getAttribute('alt') || '';
      }
      return el.getAttribute('data-caption')
        || el.querySelector('figcaption')?.textContent?.trim()
        || el.querySelector('img')?.getAttribute('alt')
        || '';
    }
    function show(idx) {
      currentIdx = (idx + currentItems.length) % currentItems.length;
      const el = currentItems[currentIdx];
      img.setAttribute('src', srcOf(el));
      img.setAttribute('alt', altOf(el));
      syncStageRedacts(el);
      cap.textContent = currentItems.length > 1
        ? `${currentIdx + 1} / ${currentItems.length}`
        : '';
      const showNav = currentItems.length > 1;
      btnPrev.style.display = showNav ? '' : 'none';
      btnNext.style.display = showNav ? '' : 'none';
    }
    function open(items, idx) {
      currentItems = items;
      show(idx);
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    triggers.forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const group = el.closest('.gallery, .mockup-grid') || el;
        const items = galleries.get(group);
        const idx = items.indexOf(el);
        open(items, idx);
      });
    });

    btnClose.addEventListener('click', close);
    btnPrev.addEventListener('click', (e) => { e.stopPropagation(); show(currentIdx - 1); });
    btnNext.addEventListener('click', (e) => { e.stopPropagation(); show(currentIdx + 1); });
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(currentIdx - 1);
      else if (e.key === 'ArrowRight') show(currentIdx + 1);
    });
  }
})();

/* =========================================================
   Page loader / inter-page transition
   ========================================================= */
(function pageLoader() {
  'use strict';
  const loader = document.getElementById('loader');
  if (!loader) return;

  const html = document.documentElement;
  html.classList.add('is-loading');

  let opened = false;
  const open = () => {
    if (opened) return;
    opened = true;
    loader.classList.add('is-out');
    html.classList.remove('is-loading');
  };

  // Curtain only ever slides UP. Each page paints with the curtain covering
  // (default state) and slides it up shortly after the document is ready.
  // Nav clicks are NOT intercepted — the browser handles the link normally;
  // the next page's own curtain takes over on arrival.
  const minDelay = 250;

  if (document.readyState === 'complete') {
    setTimeout(open, minDelay);
  } else {
    window.addEventListener('load', () => setTimeout(open, minDelay), { once: true });
  }
  // Safety fallback so we never lock the page if `load` never fires.
  setTimeout(open, 2800);

  // bfcache restore: snap curtain back to covering (no transition), then
  // slide up like a normal load. Without this, returning via Back would
  // show the page instantly without the wipe.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    opened = false;
    loader.style.transition = 'none';
    loader.classList.remove('is-out');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      loader.style.transition = '';
      setTimeout(open, 200);
    }));
  });
})();
