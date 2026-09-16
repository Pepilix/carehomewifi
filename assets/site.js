// CareHomeWiFi.com — shared site behaviours
(function () {
  var GA_MEASUREMENT_ID = 'G-WTW1BT43N4';

  function loadAnalytics() {
    if (window.__chwAnalyticsLoaded) return;
    window.__chwAnalyticsLoaded = true;

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);
  }

  // Scroll-to-top button
  var topBtn = document.querySelector('.scroll-top');
  if (topBtn) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 500) {
        topBtn.classList.add('visible');
      } else {
        topBtn.classList.remove('visible');
      }
    }, { passive: true });
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Cookie banner + consent-gated analytics
  var banner = document.querySelector('.cookie-banner');
  if (banner) {
    var consent = null;
    try { consent = localStorage.getItem('chw-cookie-consent'); } catch (e) { /* storage unavailable */ }

    if (consent === 'accepted') {
      loadAnalytics();
    } else if (consent !== 'declined') {
      banner.classList.add('visible');
    }

    var acceptBtn = banner.querySelector('.cookie-accept');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', function () {
        banner.classList.remove('visible');
        try { localStorage.setItem('chw-cookie-consent', 'accepted'); } catch (e) {}
        loadAnalytics();
      });
    }

    var declineBtn = banner.querySelector('.cookie-decline');
    if (declineBtn) {
      declineBtn.addEventListener('click', function () {
        banner.classList.remove('visible');
        try { localStorage.setItem('chw-cookie-consent', 'declined'); } catch (e) {}
      });
    }
  }
})();
