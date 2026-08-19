/**
 * PDP interactions:
 * 1. Sticky mobile add-to-cart bar - shows when the buy buttons leave the
 *    viewport, proxies clicks to the real product-form submit button.
 * 2. Add-to-cart success morph (animation #7) - on Cart AJAX success the
 *    submit button label morphs to a checkmark for 1.5s, then reverts.
 */
(function () {
  function masalaMotion() {
    if (!window.gsap) return;
    var reduced = window.VM && window.VM.reducedMotion;

    // Gallery + info-panel entrance on load, same fade-in family as the
    // global <main> fade in vishesh-motion.js: gallery first, then the
    // price/CTA column follows with a slight stagger.
    var mediaWrapper = document.querySelector('.product__media-wrapper');
    var infoWrapper = document.querySelector('.product__info-wrapper');
    if ((mediaWrapper || infoWrapper) && !document.body.dataset.pdpEntranceDone) {
      document.body.dataset.pdpEntranceDone = 'true';
      if (reduced) {
        gsap.set([mediaWrapper, infoWrapper], { autoAlpha: 1 });
      } else {
        gsap.fromTo(
          [mediaWrapper, infoWrapper].filter(Boolean),
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.12, delay: 0.1 }
        );
      }
    }

    // Kinetic product title - same letter-scatter as the hero headline
    var title = document.querySelector('.product__title h1, .product__title > *:first-child');
    if (title && !title.dataset.kineticDone) {
      title.dataset.kineticDone = 'true';
      if (reduced) {
        gsap.fromTo(title, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'none' });
      } else if (window.SplitText) {
        var chars = new SplitText(title, { type: 'chars' }).chars;
        gsap.from(chars, {
          y: function () {
            return gsap.utils.random(20, 50);
          },
          rotation: function () {
            return gsap.utils.random(-12, 12);
          },
          autoAlpha: 0,
          ease: 'power3.out',
          duration: 0.7,
          stagger: 0.018,
        });
      }
    }

    // Gentle float on the product gallery + sparkles around it
    var gallery = document.querySelector('.product__media-wrapper');
    if (gallery && !gallery.dataset.masalaDone) {
      gallery.dataset.masalaDone = 'true';
      gallery.style.position = 'relative';
      ['1', '2', '3'].forEach(function (n) {
        var s = document.createElement('span');
        s.className = 'vishesh-sparkle vishesh-sparkle--' + n;
        s.setAttribute('aria-hidden', 'true');
        s.textContent = '✦';
        gallery.appendChild(s);
      });
      if (!reduced) {
        var media = gallery.querySelector('.product__media-list .product__media-item, .product__media-list li');
        if (media) {
          gsap.to(media, {
            y: -10,
            rotation: 0.6,
            duration: 2.8,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        }
      }
    }
  }

  function init() {
    masalaMotion();
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
