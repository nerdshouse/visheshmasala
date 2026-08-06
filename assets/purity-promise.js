/**
 * Pinned purity-promise reveal (animation #2 in CLAUDE.md).
 * Pins the section for 800px of scroll; heading reveals word-by-word and
 * the promise circles scale in sequentially, all scrubbed to scroll.
 * Reduced motion: no pin, simple fade-in of everything at once.
 */
(function () {
  function init() {
    var pin = document.querySelector('.purity-pin');
    if (!pin || !window.gsap || pin.dataset.purityDone) return;
    pin.dataset.purityDone = 'true';

    var words = pin.querySelectorAll('.vishesh-purity__word');
    var icons = pin.querySelectorAll('.vishesh-purity__icon-item');

    if ((window.VM && window.VM.reducedMotion) || !window.ScrollTrigger) {
      gsap.fromTo(
        [words, icons],
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 0.5,
          ease: 'none',
          scrollTrigger: window.ScrollTrigger ? { trigger: pin, start: 'top 75%', once: true } : undefined,
        }
      );
      return;
    }

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        pin: true,
        start: 'top top',
        end: '+=800',
        scrub: true,
        anticipatePin: 1,
      },
    });

    tl.fromTo(
      words,
      { autoAlpha: 0, y: 32 },
      { autoAlpha: 1, y: 0, stagger: 0.12, ease: 'power2.out', duration: 1 }
    ).fromTo(
      icons,
      { autoAlpha: 0, scale: 0.8 },
      { autoAlpha: 1, scale: 1, stagger: 0.15, ease: 'back.out(2)', duration: 1 },
      '-=0.3'
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
