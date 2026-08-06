/**
 * PDP interactions:
 * 1. Sticky mobile add-to-cart bar — shows when the buy buttons leave the
 *    viewport, proxies clicks to the real product-form submit button.
 * 2. Add-to-cart success morph (animation #7) — on Cart AJAX success the
 *    submit button label morphs to a checkmark for 1.5s, then reverts.
 */
(function () {
  function init() {
    var stickyBar = document.querySelector('[data-sticky-atc]');
    var buyButtons = document.querySelector('.product-form__buttons');
    var realSubmit = document.querySelector('.product-form__submit');

    if (stickyBar && buyButtons && realSubmit && 'IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          var visible = entries[0].isIntersecting;
          stickyBar.classList.toggle('is-visible', !visible);
          stickyBar.setAttribute('aria-hidden', visible ? 'true' : 'false');
        },
        { rootMargin: '-80px 0px 0px 0px' }
      );
      observer.observe(buyButtons);

      stickyBar.querySelector('[data-sticky-atc-button]').addEventListener('click', function () {
        realSubmit.click();
      });
    }

    // ATC morph: subscribe to Dawn's pubsub cart-update event.
    if (typeof subscribe === 'function' && window.PUB_SUB_EVENTS && PUB_SUB_EVENTS.cartUpdate) {
      subscribe(PUB_SUB_EVENTS.cartUpdate, function (event) {
        if (!event || event.source !== 'product-form') return;
        document
          .querySelectorAll('.product-form__submit, [data-sticky-atc-button]')
          .forEach(function (btn) {
            if (btn.dataset.morphing) return;
            btn.dataset.morphing = 'true';
            btn.classList.add('button--atc-success');
            setTimeout(function () {
              btn.classList.remove('button--atc-success');
              delete btn.dataset.morphing;
            }, 1500);
          });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
