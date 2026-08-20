/**
 * Smooth open/close for the PDP accordion (Ingredients / FSSAI & Nutrition
 * / How to Use). Native <details> toggles instantly with no way to
 * transition height, so this intercepts the summary click and animates
 * the <details> element's height via the Web Animations API instead -
 * standard pattern, no extra dependency needed since GSAP doesn't
 * animate the CSS `height` property well either.
 * Falls back to native instant toggle under prefers-reduced-motion.
 */
(function () {
  function setup(details) {
    if (details.dataset.accordionWired) return;
    details.dataset.accordionWired = 'true';

    var summary = details.querySelector('summary');
    var content = details.querySelector('.accordion__content');
    if (!summary || !content) return;

    var animation = null;
    var isClosing = false;
    var isOpening = false;
    var isFooterAccordion = details.classList.contains('vishesh-footer-accordion');

    summary.addEventListener('click', function (event) {
      // Footer Shop/About/Help columns collapse on mobile only - on
      // desktop (and tablet, matching the theme's existing 990px mobile
      // nav breakpoint) they stay permanently open, so let the click do
      // nothing there rather than accidentally collapsing a column.
      if (isFooterAccordion && window.matchMedia('(min-width: 990px)').matches) {
        event.preventDefault();
        return;
      }
      var reduced = window.VM && window.VM.reducedMotion;
      if (reduced || typeof details.animate !== 'function') return; // let native toggle happen

      event.preventDefault();
      details.style.overflow = 'hidden';

      if (isClosing || !details.open) {
        open();
      } else if (isOpening || details.open) {
        close();
      }
    });

    function open() {
      details.style.height = details.offsetHeight + 'px';
      details.open = true;
      window.requestAnimationFrame(expand);
    }

    function expand() {
      isClosing = false;
      isOpening = true;
      var startHeight = details.offsetHeight;
      var endHeight = summary.offsetHeight + content.offsetHeight;
      if (animation) animation.cancel();
      animation = details.animate(
        { height: [startHeight + 'px', endHeight + 'px'] },
        { duration: 250, easing: 'ease-out' }
      );
      animation.onfinish = function () {
        onFinish(true);
      };
      animation.oncancel = function () {
        isOpening = false;
      };
    }

    function close() {
      isClosing = true;
      isOpening = false;
      var startHeight = details.offsetHeight;
      var endHeight = summary.offsetHeight;
      if (animation) animation.cancel();
      animation = details.animate(
        { height: [startHeight + 'px', endHeight + 'px'] },
        { duration: 200, easing: 'ease-out' }
      );
      animation.onfinish = function () {
        onFinish(false);
      };
      animation.oncancel = function () {
        isClosing = false;
      };
    }

    function onFinish(open) {
      details.open = open;
      animation = null;
      isClosing = false;
      isOpening = false;
      details.style.height = '';
      details.style.overflow = '';
    }
  }

  function init() {
    document.querySelectorAll('.product .accordion details').forEach(setup);

    var footerDetails = document.querySelectorAll('.vishesh-footer-accordion');
    footerDetails.forEach(setup);
    // Start collapsed on mobile (progressive enhancement - the `open`
    // attribute in the markup is the no-JS/desktop default so content
    // is never hidden without a way to reach it).
    if (window.matchMedia('(max-width: 989px)').matches) {
      footerDetails.forEach(function (details) {
        details.open = false;
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
