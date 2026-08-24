/**
 * Bestsellers centered carousel (thehealthfactory-style technique, brand skin).
 * The active slide sits full-size and its neighbours recede; each card
 * carries its own arch-shaped media well tinted by the slide's data-color,
 * and a soft halo behind the stage picks up whichever colour is centred.
 * Autoplays. Reduced motion: no autoplay, no transition.
 *
 * Phase 19: the scale/opacity choreography moved out of GSAP and into CSS
 * transitions on .vishesh-bestsellers__card. Two reasons - it no longer
 * writes transforms onto the slide element that Swiper also owns, and the
 * card and the wrapper travel now share one easing curve, which is what
 * made the old slide change feel mechanical. This file is left with the
 * two things CSS cannot do: tint the halo, and hold autoplay while a
 * shopper is inside a pack selector.
 */
(function () {
  function init() {
    if (!window.Swiper) return;
    var section = document.querySelector('[data-vishesh-bestsellers]');
    if (!section || section.dataset.ready) return;
    var el = section.querySelector('[data-bestsellers-swiper]');
    if (!el || el.querySelectorAll('.swiper-slide').length === 0) return;
    section.dataset.ready = 'true';

    var reduced = window.VM && window.VM.reducedMotion;
    var glow = section.querySelector('[data-bestsellers-arch]');

    function syncGlow(swiper) {
      if (!glow) return;
      var active = swiper.slides[swiper.activeIndex];
      if (!active) return;
      var color = active.dataset.color;
      // Set the custom property rather than `background` outright: the
      // element's own radial-gradient stays in CSS and only its stop
      // colour tracks the centred slide.
      if (color) glow.style.setProperty('--glow-color', color);
    }

    var swiper = new Swiper(el, {
      loop: true,
      centeredSlides: true,
      // Slightly longer than the old 500ms so the travel reads as settling
      // rather than snapping; matches the card's 0.55s scale transition.
      speed: reduced ? 0 : 620,
      // Phase 19: was a flat 1 slide, which parked the neighbours fully
      // off-screen on phones - the card treatment on them was invisible
      // and nothing signalled the carousel could be swiped. A fractional
      // view brings the next card back to the edge as a peek.
      slidesPerView: 1.25,
      spaceBetween: 14,
      grabCursor: true,
      watchSlidesProgress: true,
      autoplay: reduced
        ? false
        : { delay: 3600, disableOnInteraction: false, pauseOnMouseEnter: true },
      navigation: {
        nextEl: section.querySelector('[data-bestsellers-next]'),
        prevEl: section.querySelector('[data-bestsellers-prev]'),
      },
      breakpoints: {
        // Tablet was falling through to the 1-slide default, which left a
        // ~260px card stranded in a ~736px slide with no peek at all.
        // Two-up with a peek keeps the card sized like the rest of the
        // site and makes it obvious the carousel scrolls.
        750: { slidesPerView: 2, spaceBetween: 32 },
        990: { slidesPerView: 3, spaceBetween: 90 },
        1336: { slidesPerView: 3, spaceBetween: 130 },
      },
      on: {
        init: function () {
          syncGlow(this);
        },
        slideChangeTransitionStart: function () {
          syncGlow(this);
        },
      },
    });

    // pauseOnMouseEnter only covers hover, which never fires on touch -
    // without this, autoplay keeps advancing while a shopper has the
    // native pack-select open or is aiming a tap at the Add to Cart
    // button, and the slide can shift a different product's card under
    // their next tap mid-interaction. Pause for as long as focus stays
    // inside any card's pack selector, on both touch and mouse.
    if (swiper.autoplay) {
      el.addEventListener('focusin', function (e) {
        if (e.target.closest('[data-vishesh-pack-select-wrap]')) swiper.autoplay.stop();
      });
      el.addEventListener('focusout', function () {
        setTimeout(function () {
          var active = document.activeElement;
          if (!active || !active.closest('[data-vishesh-pack-select-wrap]')) {
            swiper.autoplay.start();
          }
        });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
  document.addEventListener('shopify:section:load', init);
})();
