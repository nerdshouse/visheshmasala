/**
 * Inline pack-size selector on product cards (grid, carousel, cross-sell).
 * On select change: swaps the card's displayed price to the chosen pack's
 * price and updates the Add to Cart button's target variant. On Add to
 * Cart: posts straight to /cart/add.js (same endpoint product-form.js
 * uses) and, when a cart-drawer is present, asks it to re-render itself
 * and open - same mechanism as the PDP form, just triggered from the
 * card instead of a full page. No PDP navigation either way.
 *
 * Both listeners are delegated from document, so cards inserted after load
 * (PDP "You May Also Like" recommendations, Swiper slides, cart-drawer and
 * section re-renders) work without being wired one by one, and a re-render
 * can never stack a second listener on a button.
 */
(function () {
  // One set of listeners per page, even if this file is loaded twice.
  if (window.VisheshPackSelector) return;
  window.VisheshPackSelector = true;

  function findPriceEl(wrap) {
    var card = wrap.closest('.card-information') || wrap.closest('.card-wrapper') || wrap.parentElement;
    if (!card) return null;
    return card.querySelector('.price-item--regular') || card.querySelector('.price-item--sale');
  }

  // Point the card's price and Add to Cart button at the selected pack.
  function applySelection(select) {
    var wrap = select.closest('[data-vishesh-pack-select-wrap]');
    if (!wrap) return;

    var option = select.options[select.selectedIndex];
    if (!option) return;
    var button = wrap.querySelector('[data-vishesh-pack-add]');
    if (button) button.dataset.variantId = option.value;

    var priceEl = findPriceEl(wrap);
    if (priceEl && option.dataset.priceHtml) {
      priceEl.textContent = option.dataset.priceHtml;
    }
  }

  function setLoading(button, loading) {
    button.classList.toggle('loading', loading);
    var spinner = button.querySelector('.loading__spinner');
    if (spinner) spinner.classList.toggle('hidden', !loading);
  }

  function showError(button, text) {
    var wrap = button.closest('[data-vishesh-pack-select-wrap]') || button.parentElement;
    var p = wrap.querySelector('[data-vishesh-pack-error]');
    if (!p) {
      p = document.createElement('p');
      p.className = 'vishesh-pack__error';
      p.setAttribute('data-vishesh-pack-error', '');
      p.setAttribute('role', 'alert');
      wrap.appendChild(p);
    }
    p.textContent = text || 'Could not add to cart. Please try again.';
  }

  // The select is the source of truth for the pack: after Back/Forward the
  // browser can restore its value without firing change, leaving the
  // button's data-variant-id on the default pack.
  function selectedVariantId(button) {
    var wrap = button.closest('[data-vishesh-pack-select-wrap]');
    var select = wrap && wrap.querySelector('[data-vishesh-pack-select]');
    if (select && select.value) return select.value;
    return button.dataset.variantId;
  }

  function addToCart(button) {
    // aria-disabled is set while an add is in flight - repeat taps are ignored.
    if (button.hasAttribute('disabled') || button.getAttribute('aria-disabled') === 'true') return;

    var variantId = selectedVariantId(button);
    if (!variantId) return;

    var cart = document.querySelector('cart-drawer') || document.querySelector('cart-notification');

    var oldError = (button.closest('[data-vishesh-pack-select-wrap]') || button.parentElement).querySelector('[data-vishesh-pack-error]');
    if (oldError) oldError.remove();

    setLoading(button, true);
    button.setAttribute('aria-disabled', 'true');

    var body = new FormData();
    body.append('id', variantId);
    body.append('quantity', '1');
    if (cart && typeof cart.getSectionsToRender === 'function') {
      body.append('sections', cart.getSectionsToRender().map(function (s) { return s.id; }));
      body.append('sections_url', window.location.pathname);
    }

    var addUrl = (window.routes && window.routes.cart_add_url) || '/cart/add.js';
    fetch(addUrl, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: body,
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.status) {
          // Sold out / quantity limit etc. Say so on the card - checkout is
          // drawer-only, so never fall back to the /cart page.
          showError(button, data.description || data.message);
          return;
        }
        if (cart && typeof cart.renderContents === 'function') {
          cart.renderContents(data);
        } else {
          // Only reachable if the theme's cart type is switched away from
          // the drawer, when the cart page is the only cart there is.
          window.location.href = '/cart';
        }
      })
      .catch(function () {
        showError(button);
      })
      .finally(function () {
        setLoading(button, false);
        button.removeAttribute('aria-disabled');
      });
  }

  document.addEventListener('change', function (event) {
    var select = event.target.closest && event.target.closest('[data-vishesh-pack-select]');
    if (select) applySelection(select);
  });

  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('[data-vishesh-pack-add]');
    if (button) addToCart(button);
  });

  // Bring price and button in step with any pack the browser restored.
  // Cards still on their rendered pack are left alone.
  function syncAll() {
    document.querySelectorAll('[data-vishesh-pack-select]').forEach(function (select) {
      var wrap = select.closest('[data-vishesh-pack-select-wrap]');
      var button = wrap && wrap.querySelector('[data-vishesh-pack-add]');
      if (button && select.value && select.value !== button.dataset.variantId) applySelection(select);
    });
  }
  window.addEventListener('pageshow', syncAll);
})();
