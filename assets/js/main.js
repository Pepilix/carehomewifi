/* ==========================================================================
   CareHomeWiFi.com — motion & WebGL
   GSAP + ScrollTrigger + Lenis (globals), Three.js (dynamic import)
   ========================================================================== */

const root = document.documentElement;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const reduced = root.classList.contains('reduced') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const { gsap, ScrollTrigger } = window;

root.classList.add('booted');
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

/* --------------------------------------------------------------------------
   Reduced motion / missing libraries: show everything statically
   -------------------------------------------------------------------------- */
if (reduced || !gsap || !ScrollTrigger) {
  root.classList.add('reduced');
  $$('[data-count]').forEach(el => (el.textContent = format(+el.dataset.count, el.dataset.format)));
  initBasics(null);
} else {
  gsap.registerPlugin(ScrollTrigger);
  boot();
}

function format(n, fmt) {
  return fmt === 'comma' ? Math.round(n).toLocaleString('en-GB') : String(Math.round(n));
}

/* ==========================================================================
   BOOT
   ========================================================================== */
async function boot() {
  window.scrollTo(0, 0);

  // ---- smooth scroll
  const lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();

  // ---- text splitting (before any measuring)
  $$('[data-split]').forEach(splitWords);
  $$('[data-scrub-words]').forEach(splitScrub);

  // ---- WebGL (non-blocking; page works without it)
  const glReady = initGL().catch(err => { console.warn('[gl] disabled:', err); return null; });

  // ---- loader
  await runLoader(glReady);

  lenis.start();
  initBasics(lenis);
  initHeroScroll();
  initReveals();
  initCounters();
  initRoles();
  initServices();
  initNetwork();
  initProjects();
  initMarquee(lenis);
  initCursor();
  initMagnetic();

  // arriving via /#section (e.g. a redirected old page): scroll there once the intro has settled
  const hashTarget = location.hash.length > 1 && document.querySelector(location.hash);
  if (hashTarget) setTimeout(() => lenis.scrollTo(hashTarget, { duration: 1.8 }), 900);

  const gl = await glReady;
  if (gl && gl.hero) gl.hero.startSlideshow();

  // Fonts / images can shift layout after boot
  window.addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
}

/* ==========================================================================
   LOADER + INTRO
   ========================================================================== */
function runLoader(glReady) {
  return new Promise(resolve => {
    const loader = $('.loader');
    const num = $('.loader__num');
    const counter = { v: 0 };
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    const heroImg = new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = 'assets/hero-ap-install.jpg'; });
    const timeout = new Promise(r => setTimeout(r, 4000));
    const ready = Promise.race([Promise.all([fonts, heroImg, glReady]), timeout]);

    const tl = gsap.timeline();
    tl.to('.loader__mark .lm-house', { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, 0)
      .to('.loader__mark .lm-arc', { strokeDashoffset: 0, duration: .8, ease: 'power2.out' }, .6)
      .fromTo('.loader__mark .lm-heart', { opacity: 0, scale: .4 }, { opacity: 1, scale: 1, duration: .7, ease: 'back.out(2.4)' }, 1)
      .to(counter, { v: 86, duration: 1.4, ease: 'power2.out', onUpdate: () => (num.textContent = Math.round(counter.v)) }, 0);

    Promise.all([ready, new Promise(r => tl.eventCallback('onComplete', r))]).then(() => {
      const out = gsap.timeline({ onComplete: () => { loader.remove(); } });
      out.to(counter, { v: 100, duration: .45, ease: 'power1.out', onUpdate: () => (num.textContent = Math.round(counter.v)) })
        .to('.loader__inner, .loader__line', { y: -30, opacity: 0, duration: .6, ease: 'power3.in' }, '+=.1')
        .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '-=.15')
        .add(() => { resolve(); intro(); }, '-=.75');
    });
  });
}

function intro() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.fromTo('.hero__media', { scale: 1.18 }, { scale: 1, duration: 2.4, ease: 'expo.out' }, 0)
    .from('.hero__title .wi', { yPercent: 115, duration: 1.5, stagger: .06 }, .15)
    .from('.hero__eyebrow', { opacity: 0, y: 14, duration: 1 }, .3)
    .from('.hero__lede, .hero__ctas > *', { opacity: 0, y: 24, duration: 1.2, stagger: .1 }, .7)
    .from('.hero__meta > *', { opacity: 0, y: 12, duration: 1, stagger: .08 }, .9)
    .from('.nav__row > *', { opacity: 0, y: -16, duration: 1, stagger: .08 }, .5);
}

/* ==========================================================================
   SPLITTING
   ========================================================================== */
function splitWords(el) {
  const walk = node => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = part;
          w.appendChild(wi); frag.appendChild(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) walk(child);
    });
  };
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  walk(el);
  $$('.w', el).forEach(w => w.setAttribute('aria-hidden', 'true'));
}

function splitScrub(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', el.textContent.trim());
  el.innerHTML = words.map(w => `<span class="sw" aria-hidden="true">${w}</span>`).join(' ');
}

/* ==========================================================================
   SCROLL REVEALS
   ========================================================================== */
function initReveals() {
  // headline word rises
  $$('[data-split]:not([data-split="hero"])').forEach(el => {
    gsap.from($$('.wi', el), {
      yPercent: 115, duration: 1.4, ease: 'expo.out', stagger: .045,
      scrollTrigger: { trigger: el, start: 'top 86%' }
    });
  });

  // scrubbed word-by-word ink
  $$('[data-scrub-words]').forEach(el => {
    gsap.to($$('.sw', el), {
      opacity: 1, stagger: .1, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 50%', scrub: .6 }
    });
  });

  // soft fade up
  ScrollTrigger.batch('.fade-up', {
    start: 'top 90%',
    onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: .1 })
  });

  // clip-path image mask reveals, image settles from a slight zoom
  $$('.reveal-clip').forEach(el => {
    const media = $('.frame__media', el);
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%' } });
    tl.to(el, { clipPath: 'inset(0% 0 0 0)', duration: 1.6, ease: 'expo.inOut' });
    if (media) tl.fromTo(media, { scale: 1.3 }, { scale: 1, duration: 2, ease: 'expo.out' }, .1);
  });

  // parallax depth inside frames
  $$('.parallax').forEach(el => {
    gsap.fromTo(el, { yPercent: -5 }, {
      yPercent: 5, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  // list rows draw in
  $$('.svc__row, .faq__item, .principle, .steps li, .symptoms li, .process li').forEach(row => {
    gsap.from(row, {
      opacity: 0, y: 30, duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: row, start: 'top 92%' }
    });
  });

  // stats rule lines
  gsap.from('.stat', { opacity: 0, y: 24, duration: 1.2, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: '.stats', start: 'top 85%' } });

  // footer wordmark rises out of the floor
  const word = $('.footer__word');
  splitWords(word);
  gsap.from($$('.wi', word), {
    yPercent: 100, duration: 1.6, ease: 'expo.out', stagger: .08,
    scrollTrigger: { trigger: word, start: 'top 95%' }
  });
}

/* ==========================================================================
   HERO: scroll-out parallax
   ========================================================================== */
function initHeroScroll() {
  const st = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('.hero__media', { yPercent: 22, ease: 'none', scrollTrigger: st });
  gsap.to('.hero__content', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { ...st, end: '80% top' } });
  gsap.to('.hero__meta', { opacity: 0, ease: 'none', scrollTrigger: { ...st, end: '30% top' } });
}

/* ==========================================================================
   COUNTERS
   ========================================================================== */
function initCounters() {
  $$('[data-count]').forEach(el => {
    const target = +el.dataset.count, obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(obj, {
        v: target, duration: 2.2, ease: 'power3.out',
        onUpdate: () => (el.textContent = format(obj.v, el.dataset.format))
      })
    });
  });
}

/* ==========================================================================
   ROTATING ROLES
   ========================================================================== */
function initRoles() {
  const list = $('.roles__list');
  if (!list) return;
  const items = $$('li', list);
  list.appendChild(items[0].cloneNode(true));
  const tl = gsap.timeline({ repeat: -1, paused: true });
  items.forEach((_, i) => {
    tl.to(list, { y: `${-(i + 1) * 1.1}em`, duration: .9, ease: 'expo.inOut' }, `+=1.4`);
  });
  tl.set(list, { y: 0 });
  ScrollTrigger.create({
    trigger: '.roles', start: 'top bottom', end: 'bottom top',
    onToggle: self => (self.isActive ? tl.play() : tl.pause())
  });
}

/* ==========================================================================
   SERVICES: cursor-following image
   ========================================================================== */
function initServices() {
  if (!finePointer) return;
  const float = $('.svc-float'), inner = $('.svc-float__inner');
  const rows = $$('.svc__row');
  const imgs = rows.map(r => {
    const img = new Image(); img.src = r.dataset.img; img.alt = '';
    img.style.clipPath = 'inset(100% 0 0 0)';
    inner.appendChild(img); return img;
  });
  const xTo = gsap.quickTo(float, 'x', { duration: .7, ease: 'power3' });
  const yTo = gsap.quickTo(float, 'y', { duration: .7, ease: 'power3' });
  const rTo = gsap.quickTo(float, 'rotation', { duration: .9, ease: 'power3' });
  let lastX = 0, z = 1, current = -1;

  $('.svc').addEventListener('mousemove', e => {
    xTo(e.clientX); yTo(e.clientY);
    rTo(gsap.utils.clamp(-8, 8, (e.clientX - lastX) * .35));
    lastX = e.clientX;
  });
  rows.forEach((row, i) => {
    row.addEventListener('mouseenter', () => {
      if (current === i) return;
      current = i;
      const img = imgs[i];
      img.style.zIndex = ++z;
      gsap.fromTo(img, { clipPath: 'inset(100% 0 0 0)', scale: 1.25 }, { clipPath: 'inset(0% 0 0 0)', scale: 1, duration: .9, ease: 'expo.out' });
    });
  });
  $('.svc').addEventListener('mouseenter', e => {
    gsap.set(float, { x: e.clientX, y: e.clientY });
    gsap.to(float, { opacity: 1, scale: 1, duration: .6, ease: 'expo.out' });
  });
  $('.svc').addEventListener('mouseleave', () => {
    current = -1;
    gsap.to(float, { opacity: 0, scale: .6, duration: .5, ease: 'expo.out' });
  });
}

/* ==========================================================================
   NETWORK DIAGRAM: lines draw as you scroll
   ========================================================================== */
function initNetwork() {
  const paths = $$('.netmap .np');
  paths.forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
  gsap.set('.packets', { opacity: 0 });

  const build = () => {
    const tl = gsap.timeline();
    tl.from('.nn--net', { scale: 0, transformOrigin: '50% 50%', duration: .6, ease: 'back.out(2)' })
      .from('.netmap__internet', { opacity: 0, x: -10, duration: .6 }, '<')
      .to('#np-trunk', { strokeDashoffset: 0, duration: .8, ease: 'power2.inOut' })
      .from('.nn--core', { scale: 0, transformOrigin: '50% 50%', duration: .7, ease: 'back.out(1.6)' })
      .to(paths.filter(p => p.id !== 'np-trunk'), { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: .08 })
      .from('.nn--seg circle', { scale: 0, transformOrigin: '50% 50%', duration: .5, ease: 'back.out(3)', stagger: .08 }, '-=1')
      .from('.netmap__labels li', { opacity: 0, y: 18, duration: .8, ease: 'expo.out', stagger: .07 }, '-=.9')
      .to('.packets', { opacity: 1, duration: .6 });
    return tl;
  };

  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    gsap.timeline({
      scrollTrigger: { trigger: '.network', start: 'top top', end: '+=110%', pin: true, scrub: .8, anticipatePin: 1 }
    }).add(build()).to({}, { duration: .6 });
  });
  mm.add('(max-width: 900px)', () => {
    const tl = build().pause();
    ScrollTrigger.create({ trigger: '.netmap', start: 'top 80%', once: true, onEnter: () => tl.play() });
  });

  gsap.from('.network__lede', { opacity: 0, y: 24, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.network', start: 'top 60%' } });
}

/* ==========================================================================
   PROJECTS: pinned horizontal gallery
   ========================================================================== */
function initProjects() {
  const track = $('.projects__track');
  const bar = $('.projects__progress i');
  const mm = gsap.matchMedia();

  mm.add('(min-width: 901px)', () => {
    const dist = () => track.scrollWidth - window.innerWidth;
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.projects', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1,
        invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: self => bar.style.setProperty('--p', self.progress.toFixed(4))
      }
    });
    $$('.proj').forEach(p => {
      const media = $('.frame__media', p);
      const body = $('.proj__body', p);
      if (media) {
        gsap.set(media, { inset: '0 -8%' });
        gsap.fromTo(media, { xPercent: 5 }, {
          xPercent: -5, ease: 'none',
          scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
        });
      }
      if (body) gsap.from(body.children, {
        opacity: 0, x: 60, stagger: .06, duration: 1, ease: 'expo.out',
        scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 75%' }
      });
    });
    gsap.from('.projects__head > *', { opacity: 0, y: 30, stagger: .08, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.projects', start: 'top 70%' } });
  });

  mm.add('(max-width: 900px)', () => {
    $$('.proj__img').forEach(el => {
      gsap.fromTo(el, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
  });
}

/* ==========================================================================
   MARQUEE: speed + direction follow scroll velocity
   ========================================================================== */
function initMarquee(lenis) {
  const track = $('.marquee__track');
  if (!track) return;
  const tween = gsap.to(track, { xPercent: -50, ease: 'none', duration: 34, repeat: -1 });
  let ts = 1, dir = 1;
  gsap.ticker.add(() => {
    if (lenis.direction) dir = lenis.direction;
    const target = dir * (1 + Math.min(Math.abs(lenis.velocity) * .18, 6));
    ts += (target - ts) * .08;
    tween.timeScale(ts);
  });
}

/* ==========================================================================
   CURSOR + MAGNETIC
   ========================================================================== */
function initCursor() {
  if (!finePointer) return;
  const c = $('.cursor'), label = $('.cursor__label');
  const xTo = gsap.quickTo(c, 'x', { duration: .35, ease: 'power3' });
  const yTo = gsap.quickTo(c, 'y', { duration: .35, ease: 'power3' });
  window.addEventListener('mousemove', e => { xTo(e.clientX); yTo(e.clientY); c.classList.add('is-on'); }, { passive: true });
  document.addEventListener('mouseleave', () => c.classList.remove('is-on'));
  document.addEventListener('mouseover', e => {
    const lab = e.target.closest('[data-cursor]');
    const link = e.target.closest('a, button, input, select, textarea, label');
    c.classList.toggle('is-label', !!lab);
    c.classList.toggle('is-link', !lab && !!link);
    if (lab) label.textContent = lab.dataset.cursor;
  });
}

function initMagnetic() {
  if (!finePointer) return;
  $$('[data-magnetic]').forEach(el => {
    const xTo = gsap.quickTo(el, 'x', { duration: .6, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: .6, ease: 'power3' });
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * .28);
      yTo((e.clientY - r.top - r.height / 2) * .38);
    });
    el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
  });
}

/* ==========================================================================
   BASICS: nav, menu, anchors, form — run with or without motion
   ========================================================================== */
function initBasics(lenis) {
  const nav = $('.nav');
  const hero = $('.hero');
  const scrollTo = (target, opts = {}) => {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6, ...opts });
    else (typeof target === 'number' ? window.scrollTo({ top: target }) : target.scrollIntoView());
  };

  // nav solid once past the hero; hide on scroll down
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-solid', y > hero.offsetHeight - 80);
    const menuOpen = document.body.classList.contains('menu-open');
    nav.classList.toggle('is-hidden', !menuOpen && y > lastY && y > window.innerHeight * .7);
    lastY = y;
  };
  if (lenis) lenis.on('scroll', onScroll); else window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // mobile menu
  const toggle = $('.nav__toggle'), menu = $('#menu');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', !open);
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open && gsap && !reduced) gsap.fromTo('.menu__links a', { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: .05, delay: .2 });
  };
  toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  const form = $('.form'), note = $('.form__note');
  const typeSelect = $('select[name="project-type"]', form);

  // in-page anchors; buttons carrying data-type pre-select the enquiry type
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const target = id.length > 1 && $(id);
    if (!target) return;
    e.preventDefault();
    if (a.dataset.type) {
      const opt = [...typeSelect.options].find(o => o.text === a.dataset.type);
      if (opt) typeSelect.value = opt.value;
    }
    setMenu(false);
    scrollTo(target);
  }));
  $('.to-top').addEventListener('click', () => scrollTo(0, { duration: 2.2 }));

  // FAQ open/close changes page height — keep scroll triggers accurate
  $$('.faq__item').forEach(d => d.addEventListener('toggle', () => window.ScrollTrigger && ScrollTrigger.refresh()));

  // enquiry form -> FormSubmit -> Inspire AV commercial team
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form._honey.value) return; // bot filled the hidden field

    let ok = true;
    $$('[required]', form).forEach(input => {
      const valid = input.value.trim() && (input.type !== 'email' || /^\S+@\S+\.\S+$/.test(input.value));
      input.closest('.field').classList.toggle('is-invalid', !valid);
      if (!valid) ok = false;
    });
    if (!ok) { note.textContent = 'Please add your name and a valid email.'; return; }

    const d = Object.fromEntries(new FormData(form));
    const type = d['project-type'];
    const payload = {
      _subject: `Care Home WiFi / Networks enquiry — ${type}${d.carehome ? ` — ${d.carehome}` : ''}`,
      _template: 'table',
      _replyto: d.email,
      'Enquiry about': 'Care home WiFi & networks — sent from CareHomeWiFi.com',
      'Project type': type,
      Name: d.name,
      Company: d.company || '—',
      Email: d.email,
      Telephone: d.phone || '—',
      'Care home': d.carehome || '—',
      Location: d.location || '—',
      'Approx. bedrooms': d.beds || '—',
      Details: d.details || '—'
    };

    const btn = $('button[type="submit"]', form);
    btn.disabled = true;
    note.textContent = 'Sending…';
    try {
      const res = await fetch(form.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || String(json.success) === 'false') throw new Error(json.message || res.status);

      const done = $('.form__done', form);
      $$(':scope > :not(.form__done)', form).forEach(el => (el.hidden = true));
      done.hidden = false;
      if (gsap && !reduced) gsap.from(done.children, { opacity: 0, y: 24, duration: 1, ease: 'expo.out', stagger: .1 });
      window.ScrollTrigger && ScrollTrigger.refresh();
    } catch (err) {
      console.warn('[form]', err);
      btn.disabled = false;
      note.innerHTML = 'Sorry — that didn’t send. Please call <a href="tel:03304303490">0330 430 3490</a> or email <a href="mailto:hello@carehomewifi.com">hello@carehomewifi.com</a>.';
    }
  });
}

/* ==========================================================================
   WEBGL — per-image canvases with a shared shader
   - hover: soft ripple + lens pull toward the cursor
   - hero: images change with an expanding "signal" wave
   ========================================================================== */
const VERT = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const FRAG = /* glsl */`
precision highp float;
uniform sampler2D uTex0;
uniform sampler2D uTex1;
uniform vec2 uRes, uImg0, uImg1, uMouse, uOrigin;
uniform float uProgress, uZoom0, uZoom1, uHover, uTime;
varying vec2 vUv;

vec2 cover(vec2 uv, vec2 res, vec2 img, float zoom) {
  float rs = res.x / res.y, ri = img.x / img.y;
  vec2 s = rs < ri ? vec2(rs / ri, 1.0) : vec2(1.0, ri / rs);
  return (uv - 0.5) * s / zoom + 0.5;
}

void main() {
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  vec2 uv = vUv;

  // hover: ripple rings + gentle lens toward the cursor
  vec2 toM = (uv - uMouse) * asp;
  float dm = length(toM);
  float rip = sin(dm * 36.0 - uTime * 4.0) * exp(-dm * 5.0) * 0.009 * uHover;
  uv += (toM / (dm + 1e-4)) / asp * rip;
  uv -= (uv - uMouse) * 0.04 * uHover * exp(-dm * 2.2);

  // transition: a wave expanding from uOrigin like a wifi signal
  vec2 toO = (vUv - uOrigin) * asp;
  float d = length(toO);
  float maxR = length(max(uOrigin, 1.0 - uOrigin) * asp) + 0.15;
  float r = uProgress * maxR;
  float wave = exp(-pow((d - r) * 8.0, 2.0)) * sin(uProgress * 3.14159);
  vec2 dir = (toO / (d + 1e-4)) / asp;
  float mask = smoothstep(r - 0.07, r, d);

  vec3 c0 = texture2D(uTex0, cover(uv + dir * wave * 0.03, uRes, uImg0, uZoom0)).rgb;
  vec3 c1 = texture2D(uTex1, cover(uv - dir * wave * 0.05, uRes, uImg1, uZoom1)).rgb;
  vec3 col = mix(c1, c0, mask);
  col += vec3(0.91, 0.63, 0.49) * wave * 0.09;

  gl_FragColor = vec4(col, 1.0);
}`;

async function initGL() {
  const els = $$('.gl[data-images]');
  if (!els.length) return null;
  const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');

  const loader = new THREE.TextureLoader();
  const cache = new Map();
  const loadTex = url => {
    if (!cache.has(url)) cache.set(url, new Promise((res, rej) => loader.load(url, t => {
      t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
      res(t);
    }, undefined, rej)));
    return cache.get(url);
  };
  const size = t => new THREE.Vector2(t.image.naturalWidth || t.image.width, t.image.naturalHeight || t.image.height);

  class GLMedia {
    constructor(el) {
      this.el = el;
      this.urls = el.dataset.images.split(',').map(s => s.trim());
      this.isHero = el.dataset.gl === 'hero';
      this.visible = false;
      this.mouse = new THREE.Vector2(.5, .5);
      this.target = new THREE.Vector2(.5, .5);

      this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isHero ? 1.75 : 2));
      this.scene = new THREE.Scene();
      this.camera = new THREE.Camera();
      this.u = {
        uTex0: { value: null }, uTex1: { value: null },
        uRes: { value: new THREE.Vector2(1, 1) }, uImg0: { value: new THREE.Vector2(1, 1) }, uImg1: { value: new THREE.Vector2(1, 1) },
        uMouse: { value: this.mouse }, uOrigin: { value: new THREE.Vector2(.5, .55) },
        uProgress: { value: 0 }, uZoom0: { value: 1 }, uZoom1: { value: 1 }, uHover: { value: 0 }, uTime: { value: 0 }
      };
      this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: VERT, fragmentShader: FRAG })));
      el.appendChild(this.renderer.domElement);

      new ResizeObserver(() => this.resize()).observe(el);
      new IntersectionObserver(([e]) => (this.visible = e.isIntersecting), { rootMargin: '10% 0px' }).observe(el);
      this.resize();
      if (!this.isHero && finePointer) this.bindHover();
    }

    async load() {
      const first = await loadTex(this.urls[0]);
      this.u.uTex0.value = this.u.uTex1.value = first;
      this.u.uImg0.value = this.u.uImg1.value = size(first);
      this.ready = true;
      this.render(0);
      this.el.classList.add('is-gl');
      if (this.isHero) this.textures = await Promise.all(this.urls.map(loadTex));
    }

    resize() {
      const w = this.el.clientWidth, h = this.el.clientHeight;
      if (!w || !h) return;
      this.renderer.setSize(w, h, false);
      this.u.uRes.value.set(w, h);
      if (this.ready) this.render(this.u.uTime.value);
    }

    bindHover() {
      const host = this.el.closest('a, figure') || this.el;
      host.addEventListener('mouseenter', () => {
        gsap.to(this.u.uHover, { value: 1, duration: 1.2, ease: 'expo.out' });
        gsap.to(this.u.uZoom0, { value: 1.06, duration: 1.4, ease: 'expo.out' });
      });
      host.addEventListener('mouseleave', () => {
        gsap.to(this.u.uHover, { value: 0, duration: 1.2, ease: 'expo.out' });
        gsap.to(this.u.uZoom0, { value: 1, duration: 1.4, ease: 'expo.out' });
      });
      host.addEventListener('mousemove', e => {
        const r = this.el.getBoundingClientRect();
        this.target.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
      });
    }

    render(t) {
      this.u.uTime.value = t;
      this.mouse.lerp(this.target, .08);
      this.renderer.render(this.scene, this.camera);
    }

    // ---- hero sequence
    startSlideshow() {
      if (!this.textures || this.textures.length < 2) return;
      const bars = $$('.hero__bars i');
      const idx = $('.hero__idx'), cap = $('.hero__cap');
      const captions = [
        'Ceiling access point, mid-install',
        'Roche Care Homes — Yorkshire',
        'Bradshaw Lodge — residents’ cinema room',
        'Comms cabinet, patched & labelled',
        'Bradshaw Lodge — LNT Care Developments'
      ];
      const origins = [[.5, .6], [.32, .45], [.68, .55], [.5, .7], [.4, .5]];
      const n = this.textures.length, HOLD = 6;
      let i = 0;

      gsap.to(this.u.uZoom0, { value: 1.08, duration: HOLD + 2.4, ease: 'none' });

      const runBar = () => {
        bars.forEach((b, k) => b.style.setProperty('--p', k < i ? 1 : 0));
        gsap.fromTo(bars[i], { '--p': 0 }, { '--p': 1, duration: HOLD, ease: 'none', onComplete: next });
      };
      const next = () => {
        const j = (i + 1) % n;
        const u = this.u;
        u.uTex1.value = this.textures[j];
        u.uImg1.value = size(this.textures[j]);
        u.uOrigin.value.set(...origins[j % origins.length]);
        gsap.killTweensOf(u.uZoom1);
        gsap.fromTo(u.uZoom1, { value: 1.2 }, { value: 1.04, duration: 2.6, ease: 'expo.out' });
        gsap.fromTo(u.uProgress, { value: 0 }, {
          value: 1, duration: 2.2, ease: 'power2.inOut',
          onComplete: () => {
            u.uTex0.value = u.uTex1.value; u.uImg0.value = u.uImg1.value;
            gsap.killTweensOf(u.uZoom0);
            u.uZoom0.value = u.uZoom1.value; u.uProgress.value = 0;
            gsap.to(u.uZoom0, { value: 1.12, duration: HOLD + 2.4, ease: 'none' });
          }
        });
        // caption swap
        gsap.to(cap, {
          yPercent: -100, opacity: 0, duration: .5, ease: 'power3.in',
          onComplete: () => {
            cap.textContent = captions[j];
            idx.textContent = `${String(j + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
            gsap.fromTo(cap, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .8, ease: 'expo.out' });
          }
        });
        i = j;
        runBar();
      };
      runBar();
    }
  }

  const items = [];
  for (const el of els) {
    try { items.push(new GLMedia(el)); } catch (e) { console.warn('[gl] skipped', e); }
  }
  gsap.ticker.add(time => { for (const m of items) if (m.ready && m.visible) m.render(time); });

  // hero first so the loader can wait on it; others in the background
  const hero = items.find(m => m.isHero);
  if (hero) await hero.load();
  items.filter(m => !m.isHero).forEach(m => m.load().catch(() => {}));
  return { hero, items };
}
