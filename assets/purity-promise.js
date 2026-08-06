/**
 * "Why Choose Vishesh?" pinned reveal, sticker-cluster edition.
 * Scrubbed while pinned: heading words rise in, the trust badge stamps in,
 * then each promise sticker pops around it with a playful back-out.
 * Mobile / reduced motion: no pin, simple staggered reveal.
 */
(function () {
  function init() {
    var pin = document.querySelector('.purity-pin');
    if (!pin || !window.gsap || pin.dataset.purityDone) return;
    pin.dataset.purityDone = 'true';

    var words = pin.querySelectorAll('.vishesh-purity__word');
    var script = pin.querySelector('.vishesh-purity__script');
    var badge = pin.querySelector('.vishesh-purity__badge');
    var stickers = pin.querySelectorAll('.vishesh-purity__sticker');
    var reduced = window.VM && window.VM.reducedMotion;
    var desktop = window.matchMedia('(min-width: 750px)').matches;

    if (reduced || !desktop || !window.ScrollTrigger) {
      var everything = [words, script, badge, stickers];
      gsap.fromTo(
        everything,
        { autoAlpha: 0, y: reduced ? 0 : 20 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: reduced ? 0 : 0.06,
          scrollTrigger: window.ScrollTrigger
            ? { trigger: pin, start: 'top 75%', once: true }
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
        end: '+=1000',
        scrub: true,
        anticipatePin: 1,
      },
    });

    tl.fromTo(
      words,
      { autoAlpha: 0, y: 36 },
      { autoAlpha: 1, y: 0, stagger: 0.1, ease: 'power2.out', duration: 0.8 }
    );
    if (script) {
      tl.fromTo(
        script,
        { autoAlpha: 0, scale: 0.8, rotation: -6 },
        { autoAlpha: 1, scale: 1, rotation: -2, ease: 'back.out(2)', duration: 0.5 },
        '-=0.3'
      );
    }
    if (badge) {
      tl.fromTo(
        badge,
        { autoAlpha: 0, scale: 0.4, rotation: -30 },
        { autoAlpha: 1, scale: 1, rotation: 0, ease: 'back.out(1.8)', duration: 0.7 }
      );
    }
    tl.fromTo(
      stickers,
      { autoAlpha: 0, scale: 0.5, y: 24 },
      { autoAlpha: 1, scale: 1, y: 0, stagger: 0.18, ease: 'back.out(2.2)', duration: 0.8 }
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
