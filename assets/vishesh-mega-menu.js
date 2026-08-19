/**
 * Mega menu category -> quick-links panel swap.
 * Every category link is a real <a href>, so the menu is fully functional
 * with zero JS (clicking just navigates). This only adds the nicer
 * hover/focus preview: swap which right-hand panel is visible without a
 * click. No motion beyond an instant class swap, so no reduced-motion
 * gate is needed here.
 */
(function () {
  function wire(mega) {
    if (mega.dataset.megaWired) return;
    mega.dataset.megaWired = 'true';

    var categoryLinks = mega.querySelectorAll('[data-mega-category]');
    var panels = mega.querySelectorAll('[data-mega-panel]');

    function activate(index) {
      categoryLinks.forEach(function (link) {
        link.classList.toggle('is-active', link.dataset.megaCategory === index);
      });
      panels.forEach(function (panel) {
        panel.classList.toggle('is-active', panel.dataset.megaPanel === index);
      });
    }

    categoryLinks.forEach(function (link) {
      link.addEventListener('mouseenter', function () {
        activate(link.dataset.megaCategory);
      });
      link.addEventListener('focus', function () {
        activate(link.dataset.megaCategory);
      });
    });
  }

  function init() {
    document.querySelectorAll('.vishesh-mega').forEach(wire);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
