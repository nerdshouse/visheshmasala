/**
 * Inline pack-size selector on product cards (grid, carousel, cross-sell).
 * On select change: swaps the card's displayed price to the chosen pack's
 * price and updates the Add to Cart button's target variant. On Add to
 * Cart: posts straight to /cart/add.js (same endpoint product-form.js
 * uses) and, when a cart-drawer is present, asks it to re-render itself
 * and open - same mechanism as the PDP form, just triggered from the
 * card instead of a full page. No PDP navigation either way.
 */
(function () {
  function findPriceEl(wrap) {
    var card = wrap.closest('.card-information') || wrap.closest('.card-wrapper') || wrap.parentElement;
    if (!card) return null;
    return card.querySelector('.price-item--regular') || card.querySelector('.price-item--sale');
  }

  function onSelectChange(event) {
    var select = event.currentTarget;
    var wrap = select.closest('[data-vishesh-pack-select-wrap]');
    if (!wrap) return;

    var option = select.options[select.selectedIndex];
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

  function onAddClick(event) {
    var button = event.currentTarget;
    if (button.hasAttribute('disabled') || button.getAttribute('aria-disabled') === 'true') return;

    var variantId = button.dataset.variantId;
    if (!variantId) return;

    var cart = document.querySelector('cart-drawer') || document.querySelector('cart-notification');

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
          // Variant unavailable / error from Shopify - fall back to a
          // full cart-page navigation so the visitor isn't left with a
          // silently-failed click.
          window.location.href = '/cart';
          return;
        }
        if (cart && typeof cart.renderContents === 'function') {
          cart.renderContents(data);
        } else {
          window.location.href = '/cart';
        }
      })
      .catch(function () {
        window.location.href = '/cart';
      })
      .finally(function () {
        setLoading(button, false);
        button.removeAttribute('aria-disabled');
      });
  }

  function init() {
    document.querySelectorAll('[data-vishesh-pack-select]').forEach(function (select) {
      if (select.dataset.vpsWired) return;
      select.dataset.vpsWired = 'true';
      select.addEventListener('change', onSelectChange);
    });
    document.querySelectorAll('[data-vishesh-pack-add]').forEach(function (button) {
      if (button.dataset.vpsWired) return;
      button.dataset.vpsWired = 'true';
      button.addEventListener('click', onAddClick);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  // Carousels (Swiper) and cart-drawer re-renders both add new cards to
  // the DOM after this script's initial run - re-scan on a couple of
  // predictable triggers rather than requiring every caller to know to
  // call init() itself.
  document.addEventListener('shopify:section:load', init);
  window.addEventListener('load', init);
})();
