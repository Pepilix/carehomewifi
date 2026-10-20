/* CareHomeWiFi.com — site behaviour. No dependencies.
   Every component works without this file; it only adds interaction. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* ======================================================================
     Navigation
     ====================================================================== */
  var toggle = $('.menu-toggle');
  var menu = $('#mobile-menu');
  if (toggle && menu) {
    var setMenu = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      $('.menu-toggle__label', toggle).textContent = open ? 'Close' : 'Menu';
      menu.hidden = !open;
      document.body.style.overflow = open ? 'hidden' : '';
    };
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 1061px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  // Services dropdown: click or keyboard (hover is handled in CSS)
  $$('.primary-nav__expand').forEach(function (btn) {
    var item = btn.closest('.primary-nav__item');
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    var links = $$('a', panel);
    var set = function (open) { btn.setAttribute('aria-expanded', String(open)); panel.classList.toggle('is-open', open); };

    btn.addEventListener('click', function (e) { e.stopPropagation(); set(btn.getAttribute('aria-expanded') !== 'true'); });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); set(true); links[0].focus(); }
    });
    panel.addEventListener('keydown', function (e) {
      var i = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); links[Math.min(i + 1, links.length - 1)].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); if (i <= 0) btn.focus(); else links[i - 1].focus(); }
    });
    item.addEventListener('focusout', function (e) { if (!item.contains(e.relatedTarget)) set(false); });
    document.addEventListener('click', function (e) { if (!item.contains(e.target)) set(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) { set(false); btn.focus(); }
    });
  });

  /* ======================================================================
     Reveals: gentle fade for blocks, soft settle for photographs
     ====================================================================== */
  $$('.journey__media .photo, .split > figure.photo, .grid-2 > figure.photo').forEach(function (f) {
    if (!f.closest('.page-hero, .home-hero')) f.classList.add('reveal-img');
  });
  var revealables = $$('.reveal, .reveal-img, [data-nx]');
  var onReveal = function (el) {
    el.classList.add('is-visible');
    if (el._onReveal) el._onReveal();
  };
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { onReveal(entry.target); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(onReveal);
  }

  /* ======================================================================
     Network explorer
     ====================================================================== */
  $$('[data-nx]').forEach(function (nx) {
    var stage = $('[data-nx-stage]', nx);
    var svg = $('.nx__links', stage);
    var panel = $('[data-nx-panel]', nx);
    var nodes = $$('.nx__node', nx);
    var layers = $$('.nx__layer', nx);
    var byId = {};
    var edges = [];
    var current = null;

    var live = document.createElement('p');
    live.className = 'visually-hidden';
    live.setAttribute('aria-live', 'polite');
    nx.appendChild(live);

    nodes.forEach(function (n) {
      byId[n.dataset.node] = n;
      n._depth = layers.indexOf(n.closest('.nx__layer'));
    });
    nodes.forEach(function (n) {
      (n.dataset.parents || '').split(' ').filter(Boolean).forEach(function (p) {
        var path = document.createElementNS(SVGNS, 'path');
        path.setAttribute('class', 'nx__link' + (byId[p].hasAttribute('data-dashed') ? ' nx__link--dashed' : ''));
        svg.appendChild(path);
        edges.push({ from: p, to: n.dataset.node, el: path, depth: byId[p]._depth, dashed: byId[p].hasAttribute('data-dashed') });
      });
    });

    var draw = function () {
      var r = stage.getBoundingClientRect();
      svg.setAttribute('viewBox', '0 0 ' + r.width + ' ' + r.height);
      edges.forEach(function (e) {
        var a = byId[e.from].getBoundingClientRect();
        var b = byId[e.to].getBoundingClientRect();
        var x1 = a.left + a.width / 2 - r.left, y1 = a.bottom - r.top;
        var x2 = b.left + b.width / 2 - r.left, y2 = b.top - r.top;
        var my = (y1 + y2) / 2;
        e.el.setAttribute('d', 'M' + x1 + ' ' + y1 + ' C' + x1 + ' ' + my + ', ' + x2 + ' ' + my + ', ' + x2 + ' ' + y2);
        e.len = e.el.getTotalLength();
      });
    };
    draw();
    if ('ResizeObserver' in window) new ResizeObserver(draw).observe(stage);
    else window.addEventListener('resize', draw);

    // Animate a solid line drawing itself, in order from the internet downwards.
    var drawIn = function (list) {
      if (reducedMotion) return;
      list.filter(function (e) { return !e.dashed; }).forEach(function (e) {
        var el = e.el;
        el.classList.remove('is-drawing');
        el.style.strokeDasharray = e.len;
        el.style.strokeDashoffset = e.len;
        el.getBoundingClientRect();
        el.style.transitionDelay = (e.depth * 110) + 'ms';
        el.classList.add('is-drawing');
        el.style.strokeDashoffset = '0';
        clearTimeout(el._t);
        el._t = setTimeout(function () {
          el.classList.remove('is-drawing');
          el.style.strokeDasharray = el.style.strokeDashoffset = el.style.transitionDelay = '';
        }, 700 + e.depth * 110);
      });
    };
    nx._onReveal = function () { drawIn(edges); };

    var routeTo = function (id) {
      var nodeSet = {}, edgeSet = [];
      (function climb(target) {
        edges.forEach(function (e) {
          if (e.to === target && edgeSet.indexOf(e) === -1) { edgeSet.push(e); nodeSet[e.from] = true; climb(e.from); }
        });
      })(id);
      if (!edgeSet.length) edges.forEach(function (e) { if (e.from === id) edgeSet.push(e); });
      return { nodes: nodeSet, edges: edgeSet };
    };

    var showDetail = function (id) {
      $$('.nx__detail', panel).forEach(function (d) { d.classList.remove('is-active'); });
      $(id ? '#nx-detail-' + id : '#nx-detail-intro', panel).classList.add('is-active');
    };

    var select = function (id) {
      if (id === current) id = null; // pressing the selected part again clears it
      current = id;
      nodes.forEach(function (n) { n.setAttribute('aria-pressed', String(n.dataset.node === id)); n.classList.remove('is-path'); });
      edges.forEach(function (e) { e.el.classList.remove('is-on'); });
      nx.classList.toggle('has-selection', !!id);
      showDetail(id);
      if (!id) { live.textContent = 'Selection cleared'; return; }

      var route = routeTo(id);
      Object.keys(route.nodes).forEach(function (k) { byId[k].classList.add('is-path'); });
      route.edges.forEach(function (e) { e.el.classList.add('is-on'); });
      drawIn(route.edges);
      live.textContent = 'Showing ' + $('.nx__name', byId[id]).textContent;

      // On narrow screens the panel sits below the diagram; bring it into view.
      if (window.matchMedia('(max-width: 960px)').matches) {
        var top = panel.getBoundingClientRect().top;
        if (top > window.innerHeight * 0.75) panel.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      }
    };

    nodes.forEach(function (n) {
      n.addEventListener('click', function () { select(n.dataset.node); });
      n.addEventListener('keydown', function (e) { if (e.key === 'Escape' && current) { e.preventDefault(); select(current); } });
    });

    // Arriving from a homepage "technical detail" link: open that part.
    var preset = new URLSearchParams(location.search).get('node');
    if (preset && byId[preset]) select(preset);
  });

  /* ======================================================================
     Delivery timeline (ARIA tabs with automatic activation)
     ====================================================================== */
  $$('[data-tl]').forEach(function (tl) {
    var tabs = $$('[role="tab"]', tl);
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    var fill = $('.tl__fill', tl);
    var activate = function (i, focus) {
      tabs.forEach(function (t, j) {
        var on = j === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        t.classList.toggle('is-done', j < i);
        panels[j].classList.toggle('is-active', on);
      });
      fill.style.setProperty('--progress', (i / (tabs.length - 1) * 100) + '%');
      if (focus) tabs[i].focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { activate(i); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); activate(n, true); }
      });
    });
    activate(0);
  });

  /* ======================================================================
     Project showcase filters
     ====================================================================== */
  $$('[data-showcase]').forEach(function (sc) {
    var bar = $('.showcase__filters', sc);
    if (!bar) return; // filters switched off for this instance
    var chips = $$('.chip', bar);
    var items = $$('.showcase__item', sc);
    var count = $('.showcase__count', sc);
    var empty = $('.showcase__empty', sc);
    bar.hidden = false;
    var apply = function (f) {
      var shown = 0;
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.filter === f)); });
      items.forEach(function (it) {
        var show = f === 'all' || it.dataset.filters.split(' ').indexOf(f) !== -1;
        if (show && it.hidden) {
          it.classList.add('is-entering');
          setTimeout(function () { it.classList.remove('is-entering'); }, 450);
        }
        it.hidden = !show;
        if (show) shown++;
      });
      empty.hidden = shown > 0;
      count.textContent = shown + (shown === 1 ? ' project' : ' projects');
    };
    chips.forEach(function (c) { c.addEventListener('click', function () { apply(c.dataset.filter); }); });
    apply(sc.dataset.initial || 'all');
  });

  /* ======================================================================
     Smooth open/close for FAQ answers
     ====================================================================== */
  if (!reducedMotion && 'animate' in document.documentElement) {
    $$('.faq details').forEach(function (d) {
      var summary = $('summary', d);
      var body = $('summary + *', d);
      if (!body) return;
      summary.addEventListener('click', function (e) {
        e.preventDefault();
        if (d._anim) d._anim.cancel();
        if (d.open) {
          d._anim = body.animate([{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 220, easing: 'ease-out' });
          d._anim.onfinish = function () { d.open = false; d._anim = null; };
        } else {
          d.open = true;
          d._anim = body.animate([{ height: '0px', opacity: 0 }, { height: body.offsetHeight + 'px', opacity: 1 }], { duration: 260, easing: 'ease-out' });
          d._anim.onfinish = function () { d._anim = null; };
        }
      });
    });
  }

  /* ======================================================================
     Enquiry forms
     ====================================================================== */
  var TYPE_LABELS = {
    'new-build': 'New-build project',
    'existing': 'Existing care home — WiFi / network problem',
    'portfolio': 'Care group portfolio (multiple homes)',
    'technology': 'Care technology connectivity',
    'support': 'Ongoing support',
    'other': 'Other'
  };
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  $$('[data-enquiry]').forEach(function (form) {
    var typeSel = form.elements.type;
    var status = $('.enquiry__status', form);
    var summary = $('.enquiry__errors', form);
    var button = $('button[type="submit"]', form);
    var required = $$('[required]', form);

    var param = new URLSearchParams(location.search).get('type');
    if (param && TYPE_LABELS[param]) typeSel.value = param;

    var syncFields = function () {
      $$('[data-show-for]', form).forEach(function (f) {
        f.hidden = f.getAttribute('data-show-for').split(' ').indexOf(typeSel.value) === -1;
      });
    };
    typeSel.addEventListener('change', syncFields);
    syncFields();

    var messageFor = function (input) {
      if (input.value.trim() === '') return input.type === 'email' ? 'Enter your email address' : 'Enter your name';
      if (input.type === 'email' && !EMAIL.test(input.value.trim())) return 'Enter an email address in the format name@example.com';
      return '';
    };
    var check = function (input) {
      var field = input.closest('.field');
      var msg = messageFor(input);
      var old = $('.field__error', field);
      if (old) old.remove();
      field.classList.toggle('is-invalid', !!msg);
      field.classList.toggle('is-valid', !msg);
      input.setAttribute('aria-invalid', String(!!msg));
      if (msg) {
        var el = document.createElement('span');
        el.className = 'field__error';
        el.id = input.id + '-error';
        el.textContent = msg + '.';
        field.appendChild(el);
        input.setAttribute('aria-describedby', el.id);
      } else {
        input.removeAttribute('aria-describedby');
      }
      return msg;
    };
    // Validate a field once the visitor has left it, then live as they correct it.
    required.forEach(function (input) {
      input.addEventListener('blur', function () { if (input.value.trim() !== '' || input._touched) { input._touched = true; check(input); } });
      input.addEventListener('input', function () { if (input._touched) check(input); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.elements._honey.value) return; // spam trap

      var errors = [];
      required.forEach(function (input) {
        input._touched = true;
        var msg = check(input);
        if (msg) errors.push({ id: input.id, msg: msg });
      });
      if (errors.length) {
        summary.innerHTML = '<h3>Please check ' + (errors.length === 1 ? 'one detail' : errors.length + ' details') + '</h3><ul>' +
          errors.map(function (er) { return '<li><a href="#' + er.id + '">' + er.msg + '</a></li>'; }).join('') + '</ul>';
        summary.hidden = false;
        summary.focus();
        $$('a', summary).forEach(function (a) {
          a.addEventListener('click', function (ev) { ev.preventDefault(); document.getElementById(a.getAttribute('href').slice(1)).focus(); });
        });
        return;
      }
      summary.hidden = true;

      var v = function (name) { var el = form.elements[name]; return el && el.value.trim() ? el.value.trim() : '—'; };
      var type = TYPE_LABELS[typeSel.value] || typeSel.value;
      var payload = {
        _subject: 'Care Home WiFi / Networks enquiry — ' + type + (v('organisation') !== '—' ? ' — ' + v('organisation') : ''),
        _template: 'table',
        _replyto: v('email'),
        'Enquiry about': 'Care home WiFi & networks — sent from CareHomeWiFi.com',
        'Enquiry type': type,
        'Name': v('name'),
        'Organisation': v('organisation'),
        'Email': v('email'),
        'Telephone': v('phone'),
        'Location': v('location'),
        'Approx. bedrooms': v('bedrooms'),
        'Development stage': v('stage'),
        'Number of homes': v('homes'),
        'Message': v('message'),
        'Sent from page': location.pathname
      };

      button.disabled = true;
      button.textContent = 'Sending…';
      status.textContent = '';

      fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (json) {
            if (!res.ok || String(json.success) === 'false') throw new Error(json.message || res.status);
          });
        })
        .then(function () {
          form.classList.add('is-sent');
          if (window.gtag) window.gtag('event', 'generate_lead', { enquiry_type: typeSel.value, page_path: location.pathname });
          var done = $('.enquiry__done', form);
          done.hidden = false;
          done.focus();
        })
        .catch(function (err) {
          if (window.console) console.warn('Enquiry not sent:', err && err.message);
          button.disabled = false;
          button.textContent = 'Send enquiry';
          var em = form.dataset.fallbackEmail, ph = form.dataset.fallbackPhone, tel = form.dataset.fallbackTel;
          status.innerHTML = 'Sorry — your enquiry didn’t send. Please call <a href="tel:' + tel + '">' + ph + '</a> or email <a href="mailto:' + em + '">' + em + '</a>.';
        });
    });
  });

  /* ======================================================================
     Analytics consent (UK PECR): Google Analytics loads only after Accept
     ====================================================================== */
  (function () {
    var GA = document.body.getAttribute('data-ga');
    var banner = $('[data-consent]');
    if (!GA || !banner) return;
    var KEY = 'chw-analytics-consent';
    var read = function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
    var save = function (v) { try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ } };

    var loadGA = function () {
      if (window.__chwGA) return;
      window.__chwGA = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', GA);
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA);
      document.head.appendChild(s);
    };
    var clearGACookies = function () {
      document.cookie.split(';').forEach(function (c) {
        var name = c.split('=')[0].trim();
        if (/^_ga/.test(name)) {
          ['', '.' + location.hostname, location.hostname].forEach(function (d) {
            document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
          });
        }
      });
    };
    var show = function () { banner.hidden = false; };
    var hide = function () { banner.hidden = true; };

    $$('[data-consent-choice]', banner).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = btn.getAttribute('data-consent-choice');
        save(v);
        hide();
        if (v === 'granted') loadGA();
        else { clearGACookies(); if (window.__chwGA) location.reload(); }
      });
    });
    $$('[data-consent-open]').forEach(function (b) {
      b.addEventListener('click', function () { show(); $('[data-consent-choice="denied"]', banner).focus(); });
    });

    var choice = read();
    if (choice === 'granted') loadGA();
    else if (choice !== 'denied') show();
  })();

  /* ======================================================================
     Conversion events for phone and email links (sent only when Google
     Analytics has been loaded, i.e. after the visitor accepted cookies)
     ====================================================================== */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"], a[href^="mailto:"]');
    if (!a || typeof window.gtag !== 'function') return;
    var isPhone = a.getAttribute('href').indexOf('tel:') === 0;
    window.gtag('event', isPhone ? 'phone_click' : 'email_click', {
      link_url: a.getAttribute('href'),
      page_path: location.pathname
    });
  });
})();
