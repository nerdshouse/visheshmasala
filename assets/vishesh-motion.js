/**
 * Vishesh Masala global motion setup.
 *
 * Exposes window.VM:
 *   VM.reducedMotion  — true when prefers-reduced-motion: reduce is set
 *   VM.lenis          — Lenis instance (undefined under reduced motion)
 *
 * Section-scoped modules (hero.js, carousels, …) must check VM.reducedMotion
 * and fall back to a simple opacity fade instead of stagger/scatter effects.
 */
(function () {
  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  window.VM = window.VM || {};
  window.VM.reducedMotion = reduceQuery.matches;
  document.documentElement.classList.toggle('vm-reduced-motion', reduceQuery.matches);

  function init() {
    if (!window.gsap) return;

    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);

    // Fade <main> in on load (150ms) to soften between-page navigation flash.
    // Opacity is set from JS (not CSS) so content stays visible if JS fails.
    var main = document.querySelector('main');
    if (main) {
      if (window.VM.reducedMotion) {
        main.style.opacity = 1;
      } else {
        gsap.fromTo(main, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, ease: 'none' });
      }
    }

    // Lenis smooth scrolling — desktop and touch, disabled under reduced motion.
    if (!window.VM.reducedMotion && window.Lenis) {
      var lenis = new Lenis();
      window.VM.lenis = lenis;

      if (window.ScrollTrigger) {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (time) {
          lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
      } else {
        (function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        })(0);
      }
    }

    // Global section-entry animation: any [data-animate="fade-up"] element
    // fades in + rises 24px when scrolled into view, once.
    var animated = document.querySelectorAll('[data-animate="fade-up"]');
    animated.forEach(function (el) {
      if (window.VM.reducedMotion || !window.ScrollTrigger) {
        gsap.fromTo(
          el,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: 0.4,
            ease: 'none',
            scrollTrigger: window.ScrollTrigger ? { trigger: el, start: 'top 85%', once: true } : undefined,
          }
        );
      } else {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          }
        );
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
