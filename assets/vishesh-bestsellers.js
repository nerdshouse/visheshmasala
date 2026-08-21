/**
 * Bestsellers centered carousel (thehealthfactory-style technique, brand skin).
 * Active slide sits full-size on a rounded arch whose color follows the
 * slide's data-color; neighbours scale down and drop back. Autoplays.
 * Reduced motion: no autoplay, no scale choreography.
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
    var arch = section.querySelector('[data-bestsellers-arch]');

    function updateScale(swiper) {
      swiper.slides.forEach(function (slide) {
        var isActive = slide.classList.contains('swiper-slide-active');
        if (window.gsap && !reduced) {
          gsap.to(slide, { scale: isActive ? 1 : 0.82, y: isActive ? 0 : 36, duration: 0.35, ease: 'power2.out' });
        }
        if (isActive) {
          var color = slide.dataset.color;
          if (arch && color) arch.style.background = color;
          var tag = slide.querySelector('.vishesh-bestsellers__tag');
          // The title's own background chip is a fixed color set in CSS
          // (.vishesh-bestsellers__title) - it doesn't need to track the
          // rotating accent the way the arch and tag do, and coloring it
          // to match the arch (as this used to do) made it unreadable
          // whenever the rotating accent landed on a lighter swatch.
          if (tag && color) tag.style.background = color;
        }
      });
    }

    var swiper = new Swiper(el, {
      loop: true,
      centeredSlides: true,
      speed: reduced ? 0 : 500,
      slidesPerView: 1,
      spaceBetween: 8,
      grabCursor: true,
      autoplay: reduced
        ? false
        : { delay: 3200, disableOnInteraction: false, pauseOnMouseEnter: true },
      navigation: {
        nextEl: section.querySelector('[data-bestsellers-next]'),
        prevEl: section.querySelector('[data-bestsellers-prev]'),
      },
      breakpoints: {
        990: { slidesPerView: 3, spaceBetween: 90 },
        1336: { slidesPerView: 3, spaceBetween: 130 },
      },
      on: {
        init: function () {
          updateScale(this);
        },
        slideChangeTransitionStart: function () {
          updateScale(this);
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
