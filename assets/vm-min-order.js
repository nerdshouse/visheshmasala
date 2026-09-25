/**
 * Minimum order value - live state and top-up suggestions.
 *
 * snippets/vm-min-order.liquid renders the message, progress bar and an
 * empty suggestion list into the cart drawer and the cart page, and
 * re-renders with every cart section refresh. This file:
 *
 * 1. Keeps the checkout buttons in step with the freshest rendered total.
 *    The Liquid already renders them disabled below the minimum, but two
 *    Dawn paths refresh the totals without re-rendering the button (the
 *    drawer's onCartUpdate and the cart page's quantity change), and
 *    GoKwik swaps the button for a clone at runtime - so the state is
 *    re-applied whenever any of that markup changes.
 * 2. Fills the suggestion list with up to 3 products that close the gap
 *    with the least overshoot, from the storefront /products.json.
 * 3. Quick-adds a suggestion the same way vishesh-pack-selector.js does
 *    (POST /cart/add.js with the drawer's sections, then renderContents),
 *    so the drawer stays open and the checkout unlocks without a reload.
 *
 * 4. Keeps the cart drawer-only: a visit to /cart opens the drawer over
 *    the page, and whichever of the two is not in use is re-rendered after
 *    a change in the other so neither goes stale.
 *
 * The click/submit guard itself lives inline in the head
 * (snippets/vm-min-order-guard.liquid) so it runs before GoKwik.
 */
(function () {
  var VM = (window.VMMinOrder = window.VMMinOrder || {});
  var seq = 0;
  var adding = false;
  var CATALOG_KEY = 'vmMinOrderCatalog';
  var CATALOG_TTL = 10 * 60 * 1000;
  var catalogPromise = null;

  function blocks() {
    return document.querySelectorAll('[data-vm-min-order]');
  }

  function minValue() {
    if (VM.min > 0) return VM.min;
    var b = document.querySelector('[data-vm-min-order]');
    return b ? parseInt(b.getAttribute('data-min'), 10) || 0 : 0;
  }

  function rupees(paise) {
    var r = paise / 100;
    return '₹' + (r % 1 === 0 ? r.toFixed(0) : r.toFixed(2));
  }

  // Newest block in the DOM = most recent server render of the cart.
  function freshest() {
    var best = null;
    blocks().forEach(function (b) {
      if (!b.hasAttribute('data-vm-seen')) b.setAttribute('data-vm-seen', String(++seq));
      if (!best || +b.getAttribute('data-vm-seen') > +best.getAttribute('data-vm-seen')) best = b;
    });
    return best;
  }

  function checkoutButtons() {
    return document.querySelectorAll(
      '#CartDrawer-Checkout, #checkout, cart-drawer [name="checkout"], #main-cart-footer [name="checkout"]'
    );
  }

  function block(btn) {
    btn.disabled = true;
    btn.setAttribute('aria-disabled', 'true');
    btn.setAttribute('data-vm-blocked', 'true');
  }

  function unblock(btn) {
    // Only undo what this feature did - an empty cart or GoKwik's own
    // "Processing..." state also disable the button and must be left alone.
    if (btn.getAttribute('data-vm-blocked') !== 'true') return;
    if (btn.classList.contains('processing')) return;
    btn.disabled = false;
    btn.removeAttribute('aria-disabled');
    btn.removeAttribute('data-vm-blocked');
  }

  function sync() {
    var b = freshest();
    if (!b) return; // empty cart - Dawn's own disabled state applies
    var total = parseInt(b.getAttribute('data-total'), 10);
    VM.lastTotal = total;
    var below = total < minValue();
    checkoutButtons().forEach(function (btn) {
      if (below) block(btn);
      else unblock(btn);
    });
    // While Dawn is still applying a cart change the rendered total is the
    // old one - keep any "updating" notice the guard showed until it lands.
    if (!below && !document.querySelector('.cart__items--disabled')) {
      document.querySelectorAll('[data-vm-min-order-notice]:not([data-vm-min-order-notice="handoff"])').forEach(function (n) {
        n.remove();
      });
    }
    blocks().forEach(renderSuggestions);
  }
  VM.sync = sync;

  // --- Catalogue ------------------------------------------------------------

  function toPaise(price) {
    return Math.round(parseFloat(price) * 100);
  }

  function loadCatalog() {
    if (catalogPromise) return catalogPromise;
    try {
      var cached = JSON.parse(sessionStorage.getItem(CATALOG_KEY) || 'null');
      if (cached && Date.now() - cached.at < CATALOG_TTL) {
        catalogPromise = Promise.resolve(cached.products);
        return catalogPromise;
      }
    } catch (e) {}
    catalogPromise = fetch('/products.json?limit=250', { headers: { Accept: 'application/json' } })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        var products = (data.products || []).map(function (p, index) {
          var image = p.images && p.images[0] ? p.images[0].src : null;
          return {
            id: String(p.id),
            index: index,
            title: p.title,
            handle: p.handle,
            variants: (p.variants || []).map(function (v) {
              return {
                id: String(v.id),
                title: v.title,
                price: toPaise(v.price),
                available: v.available !== false,
                image: (v.featured_image && v.featured_image.src) || image,
              };
            }),
          };
        });
        try {
          sessionStorage.setItem(CATALOG_KEY, JSON.stringify({ at: Date.now(), products: products }));
        } catch (e) {}
        return products;
      })
      .catch(function () {
        catalogPromise = null;
        return [];
      });
    return catalogPromise;
  }

  // Up to 3 products that take the cart over the minimum with the least
  // overshoot: for each product not already in the cart, its cheapest
  // in-stock variant that covers the gap (or, if none does, its priciest
  // in-stock variant). Products that close the gap rank first, cheapest
  // first; if fewer than 3 can, the rest are the largest partial steps.
  // Ties keep storefront order.
  function pick(products, gap, inCart) {
    var candidates = [];
    products.forEach(function (p) {
      if (inCart[p.id]) return;
      var inStock = p.variants.filter(function (v) {
        return v.available && v.price > 0;
      });
      if (!inStock.length) return;
      var covering = inStock
        .filter(function (v) {
          return v.price >= gap;
        })
        .sort(function (a, b) {
          return a.price - b.price;
        });
      var variant =
        covering[0] ||
        inStock.slice().sort(function (a, b) {
          return b.price - a.price;
        })[0];
      candidates.push({ product: p, variant: variant, covers: variant.price >= gap, single: p.variants.length === 1 });
    });
    candidates.sort(function (a, b) {
      if (a.covers !== b.covers) return a.covers ? -1 : 1;
      var byPrice = a.covers ? a.variant.price - b.variant.price : b.variant.price - a.variant.price;
      return byPrice || a.product.index - b.product.index;
    });
    return candidates.slice(0, 3);
  }

  function imageUrl(src) {
    if (!src) return '';
    return src + (src.indexOf('?') === -1 ? '?' : '&') + 'width=120';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderSuggestions(b) {
    var wrap = b.querySelector('[data-vm-suggest]');
    var list = b.querySelector('[data-vm-suggest-list]');
    if (!wrap || !list) return;
    var gap = parseInt(b.getAttribute('data-gap'), 10);
    var inCartIds = (b.getAttribute('data-cart-products') || '').split(',');
    var key = gap + '|' + inCartIds.join(',');
    if (list.getAttribute('data-vm-for') === key) return;
    list.setAttribute('data-vm-for', key);
    var inCart = {};
    inCartIds.forEach(function (id) {
      if (id) inCart[id] = true;
    });

    loadCatalog().then(function (products) {
      if (!list.isConnected) return;
      var picks = pick(products, gap, inCart);
      if (!picks.length) {
        wrap.hidden = true;
        return;
      }
      list.innerHTML = picks
        .map(function (c) {
          var p = c.product;
          var v = c.variant;
          var meta = (c.single || v.title === 'Default Title' ? '' : escapeHtml(v.title) + ' · ') + rupees(v.price);
          return (
            '<li class="vm-min-order__item">' +
            (v.image
              ? '<img class="vm-min-order__img" src="' +
                escapeHtml(imageUrl(v.image)) +
                '" alt="" width="56" height="56" loading="lazy">'
              : '<span class="vm-min-order__img" aria-hidden="true"></span>') +
            '<span class="vm-min-order__info">' +
            '<a class="vm-min-order__name" href="/products/' +
            encodeURIComponent(p.handle) +
            '">' +
            escapeHtml(p.title) +
            '</a>' +
            '<span class="vm-min-order__meta">' +
            meta +
            '</span>' +
            '</span>' +
            '<button type="button" class="vm-min-order__add" data-vm-add="' +
            escapeHtml(v.id) +
            '" aria-label="Add ' +
            escapeHtml(p.title) +
            ' to cart">Add</button>' +
            '</li>'
          );
        })
        .join('');
      wrap.hidden = false;
    });
  }

  // --- Quick add ------------------------------------------------------------

  function cartPageSections() {
    var ids = [];
    var items = document.getElementById('main-cart-items');
    var footer = document.getElementById('main-cart-footer');
    if (items && items.dataset.id) ids.push(items.dataset.id);
    if (footer && footer.dataset.id) ids.push(footer.dataset.id);
    ids.push('cart-icon-bubble');
    return ids;
  }

  function sectionInner(html, selector) {
    var el = new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
    return el ? el.innerHTML : null;
  }

  // Same replacement cart.js does after a quantity change on the cart page.
  function renderCartPage(data) {
    var sections = data.sections || {};
    [
      ['main-cart-items', '.js-contents'],
      ['main-cart-footer', '.js-contents'],
    ].forEach(function (pair) {
      var host = document.getElementById(pair[0]);
      if (!host || !sections[host.dataset.id]) return;
      var target = host.querySelector(pair[1]);
      var html = sectionInner(sections[host.dataset.id], pair[1]);
      if (target && html !== null) target.innerHTML = html;
      host.classList.remove('is-empty');
    });
    var cartItems = document.querySelector('cart-items');
    if (cartItems) cartItems.classList.remove('is-empty');
    var bubble = document.getElementById('cart-icon-bubble');
    if (bubble && sections['cart-icon-bubble']) {
      var bubbleHtml = sectionInner(sections['cart-icon-bubble'], '.shopify-section');
      if (bubbleHtml !== null) bubble.innerHTML = bubbleHtml;
    }
  }

  function onAddClick(event) {
    var button = event.target.closest && event.target.closest('[data-vm-add]');
    if (!button) return;
    event.preventDefault();
    if (adding || button.disabled) return;
    adding = true;
    // Checkout waits for this add (the guard reads VM.busy).
    VM.busy = true;

    var drawer = button.closest('cart-drawer');
    var label = button.textContent;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Adding…';

    var body = new FormData();
    body.append('id', button.getAttribute('data-vm-add'));
    body.append('quantity', '1');
    var sections =
      drawer && typeof drawer.getSectionsToRender === 'function'
        ? drawer.getSectionsToRender().map(function (s) {
            return s.id;
          })
        : cartPageSections();
    body.append('sections', sections.join(','));
    body.append('sections_url', window.location.pathname);

    var addUrl = (window.routes && window.routes.cart_add_url) || '/cart/add';
    fetch(addUrl, { method: 'POST', headers: { Accept: 'application/json' }, body: body })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (data.status) {
          button.textContent = 'Unavailable';
          return;
        }
        if (drawer && typeof drawer.renderContents === 'function') {
          drawer.renderContents(data);
        } else {
          renderCartPage(data);
        }
        if (document.getElementById('main-cart-items')) refreshOtherCartView();
      })
      .catch(function () {
        button.textContent = 'Try again';
        button.disabled = false;
      })
      .finally(function () {
        adding = false;
        VM.busy = false;
        button.removeAttribute('aria-busy');
        if (button.isConnected && button.textContent === 'Adding…') {
          button.textContent = label;
          button.disabled = false;
        }
      });
  }

  // Swap in a fresh cart-drawer section without opening the drawer
  // (renderContents would open it).
  function renderDrawer(sections, itemCount) {
    var drawer = document.querySelector('cart-drawer');
    var target = document.getElementById('CartDrawer');
    var inner = sections['cart-drawer'] && sectionInner(sections['cart-drawer'], '#CartDrawer');
    if (drawer && target && inner !== null && inner !== undefined) {
      target.innerHTML = inner;
      var overlay = target.querySelector('#CartDrawer-Overlay');
      if (overlay) overlay.addEventListener('click', drawer.close.bind(drawer));
      drawer.classList.toggle('is-empty', itemCount === 0);
    }
    var bubble = document.getElementById('cart-icon-bubble');
    var bubbleHtml = sections['cart-icon-bubble'] && sectionInner(sections['cart-icon-bubble'], '.shopify-section');
    if (bubble && bubbleHtml) bubble.innerHTML = bubbleHtml;
  }

  // --- Back / Forward -------------------------------------------------------

  // A page restored from the back/forward cache still shows the cart as it
  // was when you left. If the cart has changed since, re-render it so the
  // minimum-order state (and everything else in the cart) is current.
  function refreshAfterRestore() {
    fetch('/cart.js', { headers: { Accept: 'application/json' } })
      .then(function (r) {
        return r.json();
      })
      .then(function (cart) {
        if (cart.total_price === VM.lastTotal) return;
        if (document.getElementById('main-cart-items')) {
          window.location.reload();
          return;
        }
        if (!document.querySelector('cart-drawer')) return;
        return fetch('/?sections=cart-drawer,cart-icon-bubble')
          .then(function (r) {
            return r.json();
          })
          .then(function (sections) {
            renderDrawer(sections, cart.item_count);
            sync();
          });
      })
      .catch(function () {});
  }

  // --- Drawer-only cart -----------------------------------------------------

  // Nothing in the theme links to /cart any more, but it still has to work
  // for anyone who types it, a bookmark, or a bot. With items in the cart
  // it opens the drawer over the page, so checkout happens from the drawer
  // like everywhere else. The page underneath stays a working cart.
  function openDrawerOnCartPage() {
    var drawer = document.querySelector('cart-drawer');
    if (!drawer || drawer.classList.contains('is-empty')) return;
    customElements.whenDefined('cart-drawer').then(function () {
      if (!drawer.classList.contains('active')) drawer.open();
    });
  }

  // On /cart both the page and the drawer show the cart, but Dawn only
  // re-renders the one that changed. Refresh the other one - never the
  // one the shopper is using, so focus and scroll aren't yanked around.
  var crossTimer = null;
  function refreshOtherCartView() {
    clearTimeout(crossTimer);
    crossTimer = setTimeout(function () {
      var drawer = document.querySelector('cart-drawer');
      var drawerInUse = drawer && drawer.classList.contains('active');
      var ids = drawerInUse ? cartPageSections() : ['cart-drawer', 'cart-icon-bubble'];
      Promise.all([
        // No Accept: application/json here - on /cart that header makes
        // Shopify answer with the cart object instead of the sections.
        fetch(window.location.pathname + '?sections=' + ids.join(',')).then(function (r) {
          return r.json();
        }),
        fetch('/cart.js', { headers: { Accept: 'application/json' } }).then(function (r) {
          return r.json();
        }),
      ])
        .then(function (res) {
          var sections = res[0];
          var cart = res[1];
          if (drawerInUse) {
            renderCartPage({ sections: sections });
            var empty = cart.item_count === 0;
            var items = document.querySelector('cart-items');
            if (items) items.classList.toggle('is-empty', empty);
            var footer = document.getElementById('main-cart-footer');
            if (footer) footer.classList.toggle('is-empty', empty);
          } else {
            renderDrawer(sections, cart.item_count);
          }
          schedule();
        })
        .catch(function () {});
    }, 300);
  }

  // Dawn declares PUB_SUB_EVENTS with const, so it is a global binding but
  // not a window property - test it with typeof, not window.PUB_SUB_EVENTS.
  function initDrawerOnly() {
    if (!document.getElementById('main-cart-items')) return;
    openDrawerOnCartPage();
    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      subscribe(PUB_SUB_EVENTS.cartUpdate, refreshOtherCartView);
    }
  }

  // --- Wiring ---------------------------------------------------------------

  // Coalesce bursts of DOM changes (Dawn re-render + GoKwik's button
  // swap) into one sync. A timer, not requestAnimationFrame: rAF is paused
  // for background tabs, which would leave the state stale until the tab
  // is shown again.
  var scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () {
      scheduled = false;
      sync();
    }, 30);
  }

  function init() {
    initDrawerOnly();
    if (!(minValue() > 0)) return;
    document.addEventListener('click', onAddClick);
    ['cart-drawer', '#main-cart-footer', '#main-cart-items'].forEach(function (selector) {
      var el = document.querySelector(selector);
      if (el) new MutationObserver(schedule).observe(el, { childList: true, subtree: true });
    });
    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      subscribe(PUB_SUB_EVENTS.cartUpdate, schedule);
    }
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) refreshAfterRestore();
    });
    sync();
    // Back/Forward can also skip the bfcache and re-run a page from the
    // HTTP cache, i.e. with cart markup rendered for an older cart.
    var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (nav && nav.type === 'back_forward') refreshAfterRestore();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
