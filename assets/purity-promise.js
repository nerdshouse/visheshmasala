/**
 * "Why Choose Vishesh?" pinned reveal, editorial edition (Phase 6).
 * Scrubbed while pinned: badge settles in, heading rises word by word,
 * then the icon row fades/rises in as a restrained stagger - no scatter,
 * no scale-bounce, no absolute positioning anywhere (that was the root
 * cause of the overflow bug this replaces).
 * Mobile / reduced motion: no pin, simple staggered reveal.
 */
(function () {
  function init() {
    var pin = document.querySelector('.purity-pin');
    if (!pin || !window.gsap || pin.dataset.purityDone) return;
    pin.dataset.purityDone = 'true';

    var badge = pin.querySelector('.vishesh-purity__badge svg');
    var words = pin.querySelectorAll('.vishesh-purity__word');
    var script = pin.querySelector('.vishesh-purity__script');
    var items = pin.querySelectorAll('.vishesh-purity__item');
    var reduced = window.VM && window.VM.reducedMotion;
    var desktop = window.matchMedia('(min-width: 750px)').matches;

    if (reduced || !desktop || !window.ScrollTrigger) {
      var everything = [badge, words, script, items];
      gsap.fromTo(
        everything,
        { autoAlpha: 0, y: reduced ? 0 : 16 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: reduced ? 0 : 0.06,
          scrollTrigger: window.ScrollTrigger
            ? { trigger: pin, start: 'top 80%', once: true }
            : undefined,
        }
      );
      return;
    }

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        pin: true,
        start: 'top top',
        // Function form (not a fixed '+=800') so ScrollTrigger re-evaluates
        // this on every refresh/resize instead of caching one number. A
        // fixed magic number that happened to work at typical desktop
        // heights produced a pin whose end fell in the wrong place at
        // short-but-wide viewports (~1568x467), which left the page
        // permanently stuck mid-pin - scroll input stopped moving the
        // page at all past that point. Tying it to viewport height keeps
        // the pin duration proportionate at any height.
        end: function () {
          return '+=' + Math.round(window.innerHeight * 1.2);
        },
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    if (badge) {
      tl.fromTo(badge, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, ease: 'power2.out', duration: 0.5 });
    }
    tl.fromTo(
      words,
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, stagger: 0.08, ease: 'power2.out', duration: 0.6 },
      '-=0.1'
    );
    if (script) {
      tl.fromTo(script, { autoAlpha: 0 }, { autoAlpha: 1, ease: 'power2.out', duration: 0.4 }, '-=0.2');
    }
    tl.fromTo(
      items,
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, stagger: 0.1, ease: 'power2.out', duration: 0.5 },
      '-=0.1'
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
