/**
 * Generic Swiper initializer for Vishesh carousels (animation #3).
 * Any .vishesh-swiper gets: slidesPerView auto, free drag on touch,
 * peek-next spacing, prev/next arrows, active-card scale-up.
 * Under reduced motion: instant slide transitions, no scale effect.
 */
(function () {
  function initAll() {
    if (!window.Swiper) return;
    document.querySelectorAll('.vishesh-swiper:not([data-swiper-ready])').forEach(function (el) {
      el.dataset.swiperReady = 'true';
      var reduced = window.VM && window.VM.reducedMotion;
      var wrapper = el.closest('[data-carousel]') || el.parentElement;
      new Swiper(el, {
        slidesPerView: 'auto',
        spaceBetween: 16,
        freeMode: { enabled: true, momentum: true },
        grabCursor: true,
        speed: reduced ? 0 : 450,
        navigation: {
          nextEl: wrapper.querySelector('.vishesh-swiper-next'),
          prevEl: wrapper.querySelector('.vishesh-swiper-prev'),
        },
        breakpoints: {
          990: { spaceBetween: 24 },
        },
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll, { once: true });
  } else {
    initAll();
  }
  document.addEventListener('shopify:section:load', initAll);
})();
