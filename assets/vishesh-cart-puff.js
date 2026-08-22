/**
 * Golden masala-dust puff at the cart icon on a successful add.
 *
 * Additive: this does not touch the existing add-to-cart button
 * checkmark micro-interaction, it just marks the same moment at the
 * other end of the journey - the cart icon the item just flew into.
 *
 * Listens to Dawn's own cart-update pubsub rather than patching any
 * add-to-cart path, so it covers every route into the cart (PDP form,
 * the on-card pack selector, quick add) without each one needing to
 * know about it.
 *
 * The puff is a few spans animated by CSS and removed on animationend,
 * so nothing accumulates in the DOM. Reduced motion opts out entirely.
 */
(function () {
  var PARTICLES = 7;

  function puff() {
    var icon = document.querySelector('#cart-icon-bubble');
    if (!icon) return;

    // One puff at a time - rapid adds should not stack layers of
    // particles on top of each other.
    var existing = icon.querySelector('.vishesh-puff');
    if (existing) existing.remove();

    var wrap = document.createElement('span');
    wrap.className = 'vishesh-puff';
    wrap.setAttribute('aria-hidden', 'true');

    for (var i = 0; i < PARTICLES; i++) {
      var dot = document.createElement('span');
      dot.className = 'vishesh-puff__dot';
      // Spread the particles around the icon. Fixed angles rather than
      // random, so the burst reads the same every time.
      dot.style.setProperty('--angle', (360 / PARTICLES) * i + 'deg');
      dot.style.setProperty('--delay', i * 18 + 'ms');
      wrap.appendChild(dot);
    }

    wrap.addEventListener(
      'animationend',
      function () {
        wrap.remove();
      },
      { once: true }
    );

    icon.appendChild(wrap);
    // Safety net: if animationend never fires (element hidden, tab
    // backgrounded mid-animation), clear it on a timer so it cannot
    // linger.
    setTimeout(function () {
      if (wrap.isConnected) wrap.remove();
    }, 1600);
  }

  function init() {
    if (window.VM && window.VM.reducedMotion) return;
    if (typeof subscribe !== 'function' || typeof PUB_SUB_EVENTS === 'undefined') return;
    subscribe(PUB_SUB_EVENTS.cartUpdate, function (event) {
      // Dawn publishes cart-update for removals and quantity edits too;
      // only celebrate additions.
      if (event && event.source === 'cart-items') return;
      puff();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
