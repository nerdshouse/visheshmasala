/**
 * Mega menu category -> quick-links panel swap.
 * Every category link is a real <a href>, so the menu is fully functional
 * with zero JS (clicking just navigates). This only adds the nicer
 * hover/focus preview: swap which right-hand panel is visible without a
 * click. No motion beyond an instant class swap, so no reduced-motion
 * gate is needed here.
 *
 * It also resolves the quick-link badge images. Those ship as
 * loading="lazy", and a lazy image that has never had a layout box does
 * not get fetched: the panels are display:none until activated, and the
 * whole menu lives inside a closed <details>, so the browser had nothing
 * to intersect and left every badge at naturalWidth 0 - a row of empty
 * cream circles. Revealing the panel later does not retry the fetch, so
 * they stayed blank for the life of the page.
 *
 * Promoting them to eager at page load would fix the picture but cost
 * four image requests on every mobile load, where .header__inline-menu is
 * display:none below 990px and this menu is never shown at all. So the
 * promotion happens when the menu is actually opened, per panel, once.
 */
(function () {
  // A lazy image inside a never-laid-out container never loads. Once the
  // panel is genuinely on screen, switching the attribute is what makes
  // the browser go and fetch it.
  function resolveBadges(panel) {
    if (!panel || panel.dataset.megaBadgesResolved) return;
    panel.dataset.megaBadgesResolved = 'true';
    panel.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
      img.setAttribute('loading', 'eager');
    });
  }

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
        var isActive = panel.dataset.megaPanel === index;
        panel.classList.toggle('is-active', isActive);
        if (isActive) resolveBadges(panel);
      });
    }

    // The first panel is marked is-active in the Liquid, so it is showing
    // the moment the menu opens without any category being hovered yet.
    mega.addEventListener('toggle', function () {
      if (mega.open) resolveBadges(mega.querySelector('[data-mega-panel].is-active'));
    });

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
