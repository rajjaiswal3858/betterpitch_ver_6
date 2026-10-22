// BetterPitch design layer (see polish.css and DESIGN.md). Injected into every
// HTML page by server.js. It only adds classes, CSS variables, transforms and
// decorative overlays to existing elements; it never adds, removes or moves
// sections, and never changes what a link or button does. Like content.js and
// hero.js it starts after React hydrates, and it re-runs when the page changes
// (client-side navigation, streamed or lazily rendered content).
// GSAP (gsap.js, ScrollTrigger.js) drives the pointer-following motion and the
// scroll-linked parallax; CSS transitions drive the one-shot reveals.
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const scroller = () => document.getElementById('page-scroller');
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  if (gsap && ST) gsap.registerPlugin(ST);

  // The first headline (and the line under it) waits hidden until intro() can
  // split it into words. A <style> of our own rather than a class on <html> or
  // <body>: React resets those two when it re-renders after a hydration
  // mismatch, which would leave the headline hidden. Removed after 4.5 s regardless.
  const hold = document.createElement('style');
  if (!reduced) {
    hold.textContent = 'main h1:not(#bp-hero h1),main h1:not(#bp-hero h1)+p{opacity:0!important}';
    document.head.appendChild(hold);
    setTimeout(() => hold.remove(), 4500);
  }

  // ---- buttons, links and cards ----
  const rgb = c => (c.match(/\d+(\.\d+)?/g) || []).map(Number);
  function classify() {
    // card-sized surfaces (not the big section panels, which hold a heading)
    document.querySelectorAll('main .rounded-2xl.bg-white').forEach(el => {
      if (el.dataset.bpCard || el.closest('#bp-hero')) return;
      el.dataset.bpCard = '1';
      if (el.querySelector('h1, h2') || el.offsetHeight >= innerHeight) return;
      el.classList.add('bp-card');
      const cs = getComputedStyle(el);
      // glow border + spotlight use ::before/::after: only where the site doesn't use them
      if (!/(^|\s)(before|after):/.test(el.getAttribute('class') || '')) {
        if (cs.position === 'static') el.classList.add('bp-rel');
        el.classList.add('bp-fx');
        el.addEventListener('pointermove', spot);
      }
      if (finePointer && !reduced && gsap && cs.transform === 'none' && !el.closest('[class*="embla"]')
        && el.offsetWidth < 680 && el.offsetHeight < 680) tilt(el);
    });
    document.querySelectorAll('main button, main a, nav button, nav a, footer a').forEach(el => {
      if (el.dataset.bpDone || el.closest('#bp-hero, #artisan-chat')) return;
      el.dataset.bpDone = '1';
      const c = el.getAttribute('class') || '';
      const text = el.textContent.trim();
      if (!text) return; // icon-only buttons keep the site's own states
      if (/\bpy-3\.5\b/.test(c) && /\brounded-xl\b/.test(c)) {
        // the site's Button component: solid brand, white or outlined
        const [r, g, b, a = 1] = rgb(getComputedStyle(el).backgroundColor);
        const solid = a > .5 && b > 180 && b > g + 40; // violet brand fill
        const light = !solid && a > .5 && r + g + b < 120; // white button, now the card surface
        el.classList.add('bp-btn', solid ? 'bp-solid' : light ? 'bp-light' : 'bp-ghost');
        el.addEventListener('pointerenter', aim);
        el.addEventListener('pointerleave', aim);
        magnetic(el, .28);
      } else if (/\bpx-3\b/.test(c) && /\bpy-1\.5\b/.test(c)) {
        el.classList.add('bp-pill'); // small "Case study" buttons
        magnetic(el, .2);
      } else if ((el.closest('nav') && /\bp-0\b/.test(c) && /rounded-none/.test(c)) || (el.closest('footer') && !el.querySelector('img, svg') && text.length < 40)) {
        el.classList.add('bp-draw');
      }
    });
    // the hero's own buttons and play orb are magnetic too
    document.querySelectorAll('#bp-hero .bph-btn, #bp-hero .bph-orb').forEach(el => magnetic(el, el.classList.contains('bph-orb') ? .18 : .22));
    const nav = document.querySelector('#page-scroller nav');
    if (nav) nav.classList.add('bp-nav-glass');
  }
  // the fill starts where the pointer crossed the edge, and drains back out there
  function aim(e) {
    const r = this.getBoundingClientRect();
    this.style.setProperty('--bp-x', (e.clientX - r.left) + 'px');
    this.style.setProperty('--bp-y', (e.clientY - r.top) + 'px');
  }
  function spot(e) {
    const r = this.getBoundingClientRect();
    this.style.setProperty('--bp-px', (e.clientX - r.left) + 'px');
    this.style.setProperty('--bp-py', (e.clientY - r.top) + 'px');
  }

  // ---- magnetic buttons: drift toward the pointer, spring back on leave ----
  // Uses the CSS `translate` property (via --bp-tx/--bp-ty) so it never fights
  // the site's own transforms; the element's layout box does not move.
  function magnetic(el, pull) {
    if (el.dataset.bpMag || !finePointer || reduced || !gsap) return;
    el.dataset.bpMag = '1';
    const isHero = el.closest('#bp-hero');
    if (isHero) el.style.translate = 'var(--bp-tx,0) var(--bp-ty,0)';
    const to = { duration: .5, ease: 'power3.out', overwrite: 'auto' };
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { ...to, '--bp-tx': ((e.clientX - r.left - r.width / 2) * pull).toFixed(1) + 'px', '--bp-ty': ((e.clientY - r.top - r.height / 2) * pull).toFixed(1) + 'px' });
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { duration: .8, ease: 'elastic.out(1, .45)', overwrite: 'auto', '--bp-tx': '0px', '--bp-ty': '0px' }));
  }

  // ---- 3D tilt for cards ----
  function tilt(el) {
    if (el.dataset.bpTilt) return;
    el.dataset.bpTilt = '1';
    el.classList.add('bp-tilt');
    gsap.set(el, { transformPerspective: 900 });
    const rx = gsap.quickTo(el, 'rotationX', { duration: .6, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: .6, ease: 'power3.out' });
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      rx(-py * 7);
      ry(px * 7);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  }

  // ---- old purple baked into images shifts toward electric blue ----
  // Each image is sampled once on a tiny canvas (all images are same-origin in
  // the replica). Mostly-purple artwork gets .bp-tint (a hue shift in
  // polish.css); anything with skin tones is left alone so faces keep their colour.
  const probe = document.createElement('canvas');
  probe.width = probe.height = 32;
  const pctx = probe.getContext('2d', { willReadFrequently: true });
  function purpleShare(img) {
    pctx.clearRect(0, 0, 32, 32);
    pctx.drawImage(img, 0, 0, 32, 32);
    const d = pctx.getImageData(0, 0, 32, 32).data;
    let n = 0, purple = 0, skin = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128) continue;
      n++;
      const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), c = mx - mn, l = (mx + mn) / 2;
      if (!c) continue;
      const s = c / (1 - Math.abs(2 * l - 1));
      const h = (mx === r ? ((g - b) / c) % 6 : mx === g ? (b - r) / c + 2 : (r - g) / c + 4) * 60;
      const hue = (h + 360) % 360;
      if (s > .25 && l > .12 && l < .92 && hue >= 250 && hue <= 310) purple++;
      else if (s > .2 && hue >= 8 && hue <= 40 && l > .25 && l < .85) skin++;
    }
    return n ? { purple: purple / n, skin: skin / n } : null;
  }
  function tintImages() {
    document.querySelectorAll('main img, footer img').forEach(img => {
      if (img.dataset.bpHue || img.closest('#bp-hero')) return;
      const check = () => {
        if (img.dataset.bpHue) return;
        if (!img.naturalWidth) return;
        let share = null;
        try { share = purpleShare(img); } catch (e) { /* cross-origin: leave it */ }
        img.dataset.bpHue = share && share.purple > .15 && share.skin < .04 ? 'tint' : 'keep';
        if (img.dataset.bpHue === 'tint') img.classList.add('bp-tint');
      };
      // a lazy image's file can change as it loads (srcset): judge the one finally shown
      if (img.complete && img.naturalWidth) check(); else img.addEventListener('load', check, { once: true });
    });
  }

  // ---- word-by-word heading reveal ----
  // Text nodes are swapped for one span per word for the length of the reveal,
  // then the original nodes (the ones React holds) are put back untouched.
  function splitWords(h) {
    if (h.dataset.bpSplit) return null;
    h.dataset.bpSplit = '1';
    const swaps = [], units = [];
    const tw = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
    const texts = [];
    let n;
    while ((n = tw.nextNode())) texts.push(n);
    const solid = new Set(); // gradient words animate as one piece so their sweep stays intact
    for (const t of texts) {
      const g = t.parentElement.closest('.animated-gradient-text');
      if (g && h.contains(g)) { if (!solid.has(g)) { solid.add(g); units.push(g); g.classList.add('bp-wu'); } continue; }
      if (!t.nodeValue.trim()) continue;
      const frag = document.createDocumentFragment(), added = [];
      t.nodeValue.split(/(\s+)/).forEach(part => {
        if (!part) return;
        let node;
        if (/^\s+$/.test(part)) node = document.createTextNode(part);
        else { node = document.createElement('span'); node.className = 'bp-w'; node.textContent = part; units.push(node); }
        added.push(node);
        frag.appendChild(node);
      });
      t.parentNode.insertBefore(frag, t);
      t.remove();
      swaps.push({ t, added });
    }
    units.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    units.forEach((u, i) => u.style.setProperty('--bp-wd', Math.min(i * 45, 900) + 'ms'));
    return () => {
      for (const { t, added } of swaps) {
        const first = added[0];
        if (first && first.parentNode) first.parentNode.insertBefore(t, first);
        added.forEach(x => x.remove());
      }
      solid.forEach(g => { g.classList.remove('bp-wu'); g.style.removeProperty('--bp-wd'); });
    };
  }
  function playWords(h, delay) {
    const restore = h._bpRestore || splitWords(h);
    h._bpRestore = null;
    if (!restore) return;
    h.offsetWidth; // commit the hidden state before revealing
    setTimeout(() => {
      h.classList.add('bp-in');
      const n = h.querySelectorAll('.bp-w, .bp-wu').length;
      setTimeout(() => { restore(); h.classList.remove('bp-in'); }, Math.min(n * 45, 900) + 1100);
    }, delay || 0);
  }

  // ---- scroll reveals ----
  let io = null;
  const pending = new Set();
  function reveal(el) {
    if (!pending.delete(el)) return;
    if (io) io.unobserve(el);
    if (el.dataset.bpWords) return playWords(el);
    el.classList.add('bp-in');
    // hand the element back to the site's own transitions once it has settled
    const done = () => {
      el.removeEventListener('transitionend', end);
      el.classList.remove('bp-rv', 'bp-in');
      el.style.removeProperty('--bp-d');
    };
    const end = e => { if (e.target === el && e.propertyName === 'translate') done(); };
    el.addEventListener('transitionend', end);
    setTimeout(done, 2500);
  }
  // A fast scroll or an anchor jump can carry an element from below the
  // viewport to above it between two frames, which the observer never reports
  // as intersecting: anything pending that is already above the line reveals.
  let sweepQueued = false;
  function sweep() {
    if (sweepQueued || !pending.size) return;
    sweepQueued = true;
    requestAnimationFrame(() => {
      sweepQueued = false;
      const line = (scroller() || document.documentElement).clientHeight * .9;
      pending.forEach(el => { if (!el.isConnected) pending.delete(el); else if (el.getBoundingClientRect().top < line) reveal(el); });
    });
  }
  function reveals() {
    if (reduced) return;
    const root = scroller();
    if (!io) {
      io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) reveal(en.target); }), { root, rootMargin: '0px 0px -10% 0px' });
      if (root) root.addEventListener('scroll', sweep, { passive: true });
    }
    const viewH = (root || document.documentElement).clientHeight;
    const below = el => el.getBoundingClientRect().top > viewH * .92;
    const skip = el => el.closest('#bp-hero, #artisan-chat, nav, [class*="embla"]');
    const mark = (el, cls, delay) => {
      if (el.dataset.bpRv || skip(el)) return;
      el.dataset.bpRv = '1';
      if (!below(el)) return; // never hide what is already on screen
      el.classList.add(cls);
      if (delay) el.style.setProperty('--bp-d', delay + 'ms');
      pending.add(el);
      io.observe(el);
    };
    // section headings: words rise one after another; the line under them follows
    document.querySelectorAll('main h1:not(#bp-hero h1), main h2, footer h2').forEach(h => {
      if (!h.dataset.bpRv && !skip(h)) {
        h.dataset.bpRv = '1';
        if (below(h)) {
          // hide the words now (split), reveal when scrolled into view
          h.dataset.bpWords = '1';
          pending.add(h);
          io.observe(h);
        }
      }
      const p = h.nextElementSibling;
      if (p && p.tagName === 'P') mark(p, 'bp-rv', 220);
    });
    // groups of cards follow one another
    const groups = new Set();
    document.querySelectorAll('main .rounded-2xl').forEach(card => groups.add(card.parentElement));
    groups.forEach(g => {
      const cards = [...g.children].filter(c => /\brounded-2xl\b/.test(c.getAttribute('class') || '') && c.offsetHeight < viewH * 1.2);
      if (cards.length < 2) return;
      cards.forEach((c, i) => mark(c, 'bp-rv', Math.min(i, 5) * 80));
    });
  }
  // headings below the fold are split right away so their words start hidden
  function prehide() {
    document.querySelectorAll('main [data-bp-words], footer [data-bp-words]').forEach(h => {
      if (h.dataset.bpSplit) return;
      const restore = splitWords(h);
      h._bpRestore = restore;
    });
  }

  // ---- first headline on the page: words rise as the page appears ----
  function intro() {
    if (reduced) return;
    const h1 = document.querySelector('main h1:not(#bp-hero h1)');
    const root = scroller();
    const viewH = (root || document.documentElement).clientHeight;
    if (!h1 || h1.dataset.bpSplit || h1.getBoundingClientRect().top > viewH) return hold.remove();
    h1.dataset.bpRv = '1';
    playWords(h1, 60);
    hold.remove(); // the words are split and hidden now, in the same frame
    const p = h1.parentElement && [...h1.parentElement.children].find(x => x !== h1 && x.tagName === 'P' && x.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_PRECEDING);
    if (p && !p.dataset.bpRv) {
      p.dataset.bpRv = '1';
      p.classList.add('bp-rv');
      p.style.setProperty('--bp-d', '420ms');
      requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add('bp-in')));
      setTimeout(() => { p.classList.remove('bp-rv', 'bp-in'); p.style.removeProperty('--bp-d'); }, 2400);
    }
  }

  // ---- parallax and floating decoration (GSAP + ScrollTrigger) ----
  function parallax() {
    if (reduced || !gsap || !ST) return;
    const root = scroller();
    if (!root) return;
    // the sites's decorative line art (pointer-events-none, absolutely placed) drifts slower than the page
    document.querySelectorAll('main .pointer-events-none.absolute img, main img[src*="deco.svg"], main img[src*="bg-lines"]').forEach(img => {
      if (img.dataset.bpPx || img.closest('#bp-hero')) return;
      img.dataset.bpPx = '1';
      const sec = img.closest('section') || img.parentElement;
      gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: sec, scroller: root, start: 'top bottom', end: 'bottom top', scrub: .6 } });
    });
    // the big product screenshots rise a touch slower than the text around them
    document.querySelectorAll('main img[src*="hero-graphic"]').forEach(img => {
      if (img.dataset.bpPx) return;
      img.dataset.bpPx = '1';
      gsap.fromTo(img, { y: 40, scale: .97 }, { y: -20, scale: 1, ease: 'none', scrollTrigger: { trigger: img, scroller: root, start: 'top bottom', end: 'bottom top', scrub: .8 } });
    });
    // the hero's tile grid and aurora drift as it scrolls away
    const hero = document.querySelector('#bp-hero .bph-box');
    if (hero && !hero.dataset.bpPx) {
      hero.dataset.bpPx = '1';
      gsap.to(hero.querySelector('.bph-tiles'), { y: 120, ease: 'none', scrollTrigger: { trigger: hero, scroller: root, start: 'top top', end: 'bottom top', scrub: .5 } });
      gsap.to(hero.querySelector('.bph-motes'), { y: -80, ease: 'none', scrollTrigger: { trigger: hero, scroller: root, start: 'top top', end: 'bottom top', scrub: .5 } });
    }
    ST.refresh();
  }

  // ---- ambient light and pointer glow ----
  // Built once; re-attached on refresh if React clears <body> after a hydration mismatch.
  let amb = null, cursor = null;
  function ambient() {
    if (!amb) {
      amb = document.createElement('div');
      amb.className = 'bp-ambient';
      amb.setAttribute('aria-hidden', 'true');
      amb.innerHTML = '<i></i><i></i><i></i>';
      if (!reduced && gsap) {
        // slow floating drift, each orb on its own loop
        amb.querySelectorAll('i').forEach((o, i) => gsap.to(o, { x: ['6vw', '-5vw', '4vw'][i], y: ['5vh', '-6vh', '-4vh'][i], scale: [1.12, .92, 1.1][i], duration: 14 + i * 4, ease: 'sine.inOut', repeat: -1, yoyo: true }));
      }
      if (!reduced && gsap && finePointer) {
        cursor = document.createElement('div');
        cursor.className = 'bp-cursor';
        cursor.setAttribute('aria-hidden', 'true');
        const x = gsap.quickTo(cursor, 'x', { duration: .7, ease: 'power3.out' }), y = gsap.quickTo(cursor, 'y', { duration: .7, ease: 'power3.out' });
        addEventListener('pointermove', e => { cursor.classList.add('on'); x(e.clientX); y(e.clientY); }, { passive: true });
        document.addEventListener('pointerleave', () => cursor.classList.remove('on'));
      }
    }
    if (!amb.isConnected) document.body.appendChild(amb);
    if (cursor && !cursor.isConnected) document.body.appendChild(cursor);
  }

  // ---- smooth scroll (fine pointers only, never under reduced motion) ----
  let lenis = null;
  function smooth() {
    const wrapper = scroller();
    if (lenis || reduced || !finePointer || !window.Lenis || !wrapper) return;
    lenis = new window.Lenis({
      wrapper, content: wrapper, autoRaf: true, lerp: .12, anchors: true,
      __experimental__naiveDimensions: true, // the page grows as content streams in
      // menus, dropdowns and the chat panel keep their own native scrolling
      prevent: n => n !== wrapper && n.nodeType === 1 && (n.hasAttribute('data-lenis-prevent')
        || n.id === 'artisan-chat' || (/(auto|scroll)/.test(getComputedStyle(n).overflowY) && n.scrollHeight > n.clientHeight)),
    });
    if (ST) lenis.on('scroll', ST.update);
  }

  // ---- skip link (keyboard): first tab stop, jumps past the header to the content ----
  function skipLink() {
    if (document.querySelector('.bp-skip')) return;
    const a = document.createElement('a');
    a.className = 'bp-skip';
    a.href = '#main';
    a.textContent = 'Skip to content';
    a.onclick = e => {
      e.preventDefault();
      const main = document.querySelector('main');
      if (!main) return;
      main.tabIndex = -1;
      main.focus({ preventScroll: true });
      if (lenis) lenis.scrollTo(main, { offset: 0 }); else main.scrollIntoView();
    };
    document.body.prepend(a);
  }

  // ---- page changes: the old page dims away on an in-site link, the new one rises in ----
  let outTimer = 0;
  function exitOnNavigate() {
    if (reduced) return;
    // (no defaultPrevented check: Next's <Link> prevents the default to navigate client-side)
    document.addEventListener('click', e => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download') || a.closest('#artisan-chat')) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || u.pathname === location.pathname) return;
      const main = document.querySelector('main');
      if (!main) return;
      // purely visual: navigation proceeds as normal, and the page un-dims if it doesn't happen
      main.classList.add('bp-page-out');
      clearTimeout(outTimer);
      outTimer = setTimeout(() => main.classList.remove('bp-page-out'), 1600);
    });
  }
  let lastPath = location.pathname;
  function routeChanged() {
    if (location.pathname === lastPath) return;
    lastPath = location.pathname;
    clearTimeout(outTimer);
    document.querySelectorAll('main.bp-page-out').forEach(m => m.classList.remove('bp-page-out'));
    const main = document.querySelector('main');
    if (main && !reduced) {
      main.classList.remove('bp-page-in');
      void main.offsetWidth;
      main.classList.add('bp-page-in');
      main.addEventListener('animationend', () => main.classList.remove('bp-page-in'), { once: true });
      intro();
    }
    if (ST) setTimeout(() => ST.refresh(), 400);
  }

  // If React re-renders the whole document (a recoverable hydration error does
  // this), the old scroll container is detached: re-attach to the new one and
  // show anything that was waiting for a reveal on the old one.
  let bound = null;
  function rebind() {
    if (bound === scroller()) return;
    bound = scroller();
    if (lenis) { lenis.destroy(); lenis = null; }
    if (io) { io.disconnect(); io = null; }
    pending.clear();
    if (ST) ST.getAll().forEach(t => t.kill());
    document.querySelectorAll('[data-bp-px]').forEach(el => delete el.dataset.bpPx);
    document.querySelectorAll('.bp-rv').forEach(el => el.classList.remove('bp-rv'));
    document.querySelectorAll('[data-bp-words]').forEach(h => { if (h._bpRestore) h._bpRestore(); delete h.dataset.bpWords; });
    smooth();
  }

  let t = 0;
  function refresh() {
    clearTimeout(t);
    t = setTimeout(() => { skipLink(); ambient(); rebind(); routeChanged(); classify(); tintImages(); reveals(); prehide(); sweep(); parallax(); }, 120);
  }

  let started = false;
  function start() {
    if (started) return;
    started = true;
    skipLink();
    bound = scroller();
    classify();
    tintImages();
    intro();
    reveals();
    prehide();
    smooth();
    ambient();
    parallax();
    exitOnNavigate();
    new MutationObserver(muts => {
      // ignore our own word spans going in and out
      if (muts.every(m => [...m.addedNodes, ...m.removedNodes].every(n => n.nodeType === 3 || (n.nodeType === 1 && /\bbp-(w|cursor|ambient)\b/.test(n.className))))) return;
      refresh();
    }).observe(document.body, { childList: true, subtree: true });
    addEventListener('popstate', refresh);
  }
  // same timing as content.js: after load plus a beat for hydration
  addEventListener('load', () => setTimeout(start, 320));
  setTimeout(start, 4000);
})();
