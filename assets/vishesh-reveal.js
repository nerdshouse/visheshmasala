/**
 * Scroll reveal choreography.
 *
 * Deliberately IntersectionObserver + CSS transitions rather than
 * GSAP/ScrollTrigger. The reference this was modelled on (mindori.in)
 * runs no scroll library at all - its motion is short CSS transitions
 * on hover and reveal - and on this theme every scroll-driven JS
 * mechanic has been a source of bugs. Nothing here reads scroll
 * position, pins, or writes layout: elements are observed once and get
 * a class.
 *
 * Safety: the hidden starting state lives in .vm-reveal, and this file
 * is the only thing that adds that class - and only after confirming
 * IntersectionObserver exists to take it off again. If the script
 * never runs, or the browser is too old, content simply renders as
 * normal. Reduced motion opts out before anything is touched.
 */
(function () {
  // Groups of elements to stagger together, by container. Each entry is
  // [container selector, child selector]. Kept to content wrappers, so
  // nothing structural (grids, sliders, sticky stages) is touched.
  var GROUPS = [
    ['.rich-text__blocks', ':scope > *'],
    ['.image-with-text__content', ':scope > *'],
    ['.vishesh-infra__intro', ':scope > *'],
  ];

  // Single elements that get a softer media-style wipe.
  var MEDIA = ['.image-with-text__media'];

  var STAGGER_MS = 90;

  function prepare(el, index, kind) {
    el.classList.add('vm-reveal');
    if (kind) el.classList.add('vm-reveal--' + kind);
    if (index) el.style.transitionDelay = index * STAGGER_MS + 'ms';
  }

  function init() {
    if (window.VM && window.VM.reducedMotion) return;
    if (!('IntersectionObserver' in window)) return;
    if (document.documentElement.dataset.vmRevealReady) return;
    document.documentElement.dataset.vmRevealReady = 'true';

    var targets = [];

    GROUPS.forEach(function (pair) {
      document.querySelectorAll(pair[0]).forEach(function (container) {
        var kids = container.querySelectorAll(pair[1]);
        Array.prototype.forEach.call(kids, function (kid, i) {
          prepare(kid, i, null);
          targets.push(kid);
        });
      });
    });

    MEDIA.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        prepare(el, 0, 'media');
        targets.push(el);
      });
    });

    if (!targets.length) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 }
    );

    targets.forEach(function (el) {
      io.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
