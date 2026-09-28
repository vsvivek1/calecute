(function () {
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('lss-recallio.lang'); } catch (e) {}
  if (!saved) saved = /^ml/i.test(navigator.language || '') ? 'ml' : 'en';

  function apply(lang) {
    root.classList.toggle('ml', lang === 'ml');
    root.setAttribute('lang', lang);
    var buttons = document.querySelectorAll('.lang button');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', String(buttons[i].dataset.lang === lang));
    }
    try { localStorage.setItem('lss-recallio.lang', lang); } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    var buttons = document.querySelectorAll('.lang button');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (e) { apply(e.currentTarget.dataset.lang); });
    }
    apply(saved);
  });
})();
