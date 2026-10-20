/* CareHomeWiFi.com — site behaviour. No dependencies. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- mobile menu ---------- */
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

  /* ---------- services dropdown (click / keyboard; hover handled in CSS) ---------- */
  $$('.primary-nav__expand').forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('is-open', open);
    });
    document.addEventListener('click', function (e) {
      if (!panel.contains(e.target)) { btn.setAttribute('aria-expanded', 'false'); panel.classList.remove('is-open'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) {
        btn.setAttribute('aria-expanded', 'false'); panel.classList.remove('is-open'); btn.focus();
      }
    });
  });

  /* ---------- gentle reveal on scroll ---------- */
  var revealables = $$('.reveal, .netdiagram');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- enquiry forms ---------- */
  var TYPE_LABELS = {
    'new-build': 'New-build project',
    'existing': 'Existing care home — WiFi / network problem',
    'portfolio': 'Care group portfolio (multiple homes)',
    'technology': 'Care technology connectivity',
    'support': 'Ongoing support',
    'other': 'Other'
  };

  $$('[data-enquiry]').forEach(function (form) {
    var typeSel = form.elements.type;
    var status = $('.enquiry__status', form);
    var button = $('button[type="submit"]', form);

    // ?type= in the URL preselects the enquiry type
    var param = new URLSearchParams(location.search).get('type');
    if (param && TYPE_LABELS[param]) typeSel.value = param;

    // show fields relevant to the chosen type
    var syncFields = function () {
      $$('[data-show-for]', form).forEach(function (f) {
        f.hidden = f.getAttribute('data-show-for').split(' ').indexOf(typeSel.value) === -1;
      });
    };
    typeSel.addEventListener('change', syncFields);
    syncFields();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.elements._honey.value) return; // spam trap

      // validate required fields
      var firstInvalid = null;
      $$('[required]', form).forEach(function (input) {
        var field = input.closest('.field');
        var old = $('.field__error', field);
        if (old) old.remove();
        var ok = input.value.trim() !== '' && (input.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()));
        field.classList.toggle('is-invalid', !ok);
        input.setAttribute('aria-invalid', String(!ok));
        if (!ok) {
          var msg = document.createElement('span');
          msg.className = 'field__error';
          msg.id = input.id + '-error';
          msg.textContent = input.type === 'email' ? 'Please enter a valid email address.' : 'Please enter your name.';
          field.appendChild(msg);
          input.setAttribute('aria-describedby', msg.id);
          firstInvalid = firstInvalid || input;
        }
      });
      if (firstInvalid) { firstInvalid.focus(); return; }

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
          var done = $('.enquiry__done', form);
          done.hidden = false;
          done.focus();
        })
        .catch(function () {
          button.disabled = false;
          button.textContent = 'Send enquiry';
          status.innerHTML = 'Sorry — your enquiry didn’t send. Please call <a href="tel:+443304303490">0330 430 3490</a> or email <a href="mailto:hello@carehomewifi.com">hello@carehomewifi.com</a>.';
        });
    });
  });
})();
