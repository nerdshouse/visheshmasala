/**
 * Vishesh Masala global motion setup.
 *
 * Exposes window.VM:
 *   VM.reducedMotion  - true when prefers-reduced-motion: reduce is set
 *   VM.lenis          - Lenis instance (undefined under reduced motion)
 *
 * Section-scoped modules (hero.js, carousels, …) must check VM.reducedMotion
 * and fall back to a simple opacity fade instead of stagger/scatter effects.
 */
(function () {
  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  window.VM = window.VM || {};
  window.VM.reducedMotion = reduceQuery.matches;
  document.documentElement.classList.toggle('vm-reduced-motion', reduceQuery.matches);

  function init() {
    if (!window.gsap) return;

    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      // Mobile browsers fire resize every time the address bar slides in
      // or out, which happens constantly while scrolling. Without this,
      // any pinned section gets torn down and rebuilt mid-gesture -
      // exactly the kind of churn that made earlier pins on this theme
      // jump and stick. Tells ScrollTrigger to ignore those particular
      // resizes; real orientation changes still refresh.
      if (typeof ScrollTrigger.config === 'function') {
        ScrollTrigger.config({ ignoreMobileResize: true });
      }
    }
    if (window.SplitText) gsap.registerPlugin(SplitText);

    // Fade <main> in on load (150ms) to soften between-page navigation flash.
    // Opacity is set from JS (not CSS) so content stays visible if JS fails.
    var main = document.querySelector('main');
    if (main) {
      if (window.VM.reducedMotion) {
        main.style.opacity = 1;
      } else {
        gsap.fromTo(main, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, ease: 'none' });
      }
    }

    // Lenis smooth scrolling - desktop and touch, disabled under reduced motion.
    if (!window.VM.reducedMotion && window.Lenis) {
      var lenis = new Lenis();
      window.VM.lenis = lenis;

      if (window.ScrollTrigger) {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (time) {
          lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);

        // Keep Lenis's internal scroll limit in sync with ScrollTrigger's
        // pin spacers. Without this, Lenis can cache a max-scroll value
        // from before a pinned section's spacer settles, then clamp all
        // further scroll input at that stale limit - the page reads as
        // permanently stuck even though a direct scrollTo() still moves
        // it, because Lenis's own render loop overwrites the position
        // back to its (wrong) cached limit on the very next frame.
        ScrollTrigger.addEventListener('refresh', function () {
          lenis.resize();
        });
        window.addEventListener('load', function () {
          ScrollTrigger.refresh();
        });
        // The 'load' refresh above isn't the end of the story on a slow
        // connection: theme.liquid's Google Fonts link uses
        // `display=swap`, so text first renders in a fallback font and
        // swaps to the real one whenever it finishes downloading - which
        // can land after 'load', not before it. If the real font's
        // metrics differ from the fallback's, that swap reflows the page
        // (taller/shorter), and Lenis's cached scroll limit - resized at
        // the 'load' refresh - goes stale again. Same class of bug the
        // refresh listener above exists to fix, just a second trigger
        // for it: caught live testing on a throttled connection where
        // "Slow network detected... fallback font" logged right before a
        // scroll gesture stopped advancing normally.
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(function () {
            ScrollTrigger.refresh();
          });
        }
      } else {
        (function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        })(0);
      }

      // Modals/drawers (cart drawer, quick-add) lock background scroll by
      // toggling "overflow-hidden" on <body>, but Lenis intercepts wheel/
      // touch input itself and drives scroll via window.scrollTo() in its
      // own rAF loop - a JS call that plain `overflow: hidden` can't stop,
      // so the page behind the modal scrolled instead of the modal's own
      // content. Two things tried before this one, in order:
      // 1) lenis.stop() whenever body.overflow-hidden appears - undone,
      //    because lenis.css applies `overflow: clip` to <html> while
      //    stopped (.lenis.lenis-stopped), and clip on the root suppressed
      //    scroll input for the modal's own internal scroll area too, not
      //    just the background - net result was nothing scrolled at all.
      // 2) data-lenis-prevent on the modal/drawer's own scrollable content
      //    (kept on the markup - see card-product.liquid, cart-drawer.liquid -
      //    it's still correct per Lenis's docs) - but live-tested with a
      //    real scroll gesture over the open quick-add modal, the page
      //    behind it still scrolled while the modal's own content didn't,
      //    so whatever internal condition Lenis expects for that attribute
      //    to take effect wasn't being met here.
      // Fix: stop Lenis's own wheel/touch listener (attached on window)
      // from ever seeing the event, with a bubble-phase listener on
      // document that calls stopPropagation() once the event has already
      // passed through a data-lenis-prevent element on its way up. Bubble
      // phase (not capture) matters here - the browser resolves the
      // target's own native default action (the modal's native scroll)
      // at dispatch time regardless of what happens later in bubbling, so
      // stopping propagation on the way up to window only blocks Lenis
      // from receiving the event - it doesn't touch the target's own
      // scroll behavior.
      //
      // Phase 9 change: this used to be permanently attached from page
      // load, running on every single wheel/touchmove event site-wide
      // for the entire session regardless of whether a modal was ever
      // opened. After it shipped, scroll started freezing sitewide after
      // exactly one gesture. Root cause wasn't pinned down with full
      // certainty (see the commit this change ships in for the full
      // account), but a permanent site-wide listener on the same event
      // type Lenis itself depends on every frame is a real, unnecessary
      // risk regardless - it's only ever needed while a modal/drawer is
      // actually open, so it's now installed and removed along with the
      // same body.overflow-hidden toggle every modal/drawer already uses
      // to lock background scroll, instead of running unconditionally
      // for the page's entire lifetime.
      function preventLenisOnModalContent(event) {
        if (event.target.closest && event.target.closest('[data-lenis-prevent]')) {
          event.stopPropagation();
        }
      }
      // Dawn locks background scroll with three different classes, not one:
      // `overflow-hidden` (cart drawer, quick-add modal) and the responsive
      // `overflow-hidden-mobile` / `overflow-hidden-tablet` (the header menu
      // drawer, which picks one from its data-breakpoint). This check used
      // to be classList.contains('overflow-hidden'), an exact match - so it
      // fired for the cart drawer but never for the mobile menu, and a swipe
      // over the open menu scrolled the page behind it instead.
      function backgroundScrollLocked() {
        return Array.prototype.some.call(document.body.classList, function (name) {
          return name.indexOf('overflow-hidden') === 0;
        });
      }

      var modalScrollLockObserver = new MutationObserver(function () {
        if (backgroundScrollLocked()) {
          document.addEventListener('wheel', preventLenisOnModalContent);
          document.addEventListener('touchmove', preventLenisOnModalContent);
        } else {
          document.removeEventListener('wheel', preventLenisOnModalContent);
          document.removeEventListener('touchmove', preventLenisOnModalContent);
        }
      });
      modalScrollLockObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    // Spinning trust badges - slow continuous rotation
    if (!window.VM.reducedMotion) {
      document.querySelectorAll('[data-vishesh-badge] svg').forEach(function (badge) {
        gsap.to(badge, { rotation: 360, duration: 18, repeat: -1, ease: 'none', transformOrigin: '50% 50%' });
      });
    }

    // Number counters: <span data-counter="50" data-counter-suffix="+">0</span>
    // tweens 0 → target when scrolled into view.
    document.querySelectorAll('[data-counter]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-counter'));
      var suffix = el.getAttribute('data-counter-suffix') || '';
      if (isNaN(target)) return;
      if (window.VM.reducedMotion || !window.ScrollTrigger) {
        el.textContent = target + suffix;
        return;
      }
      var state = { val: 0 };
      el.textContent = '0' + suffix;
      gsap.to(state, {
        val: target,
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        onUpdate: function () {
          el.textContent = Math.round(state.val) + suffix;
        },
      });
    });

    // Staggered group reveal: children of [data-animate-group] rise in sequence.
    // A group can instead mark specific descendants with
    // [data-animate-group-item] - needed when the direct children carry a
    // CSS transform of their own (e.g. radial placement), since the tween
    // writes its own inline transform and would otherwise clobber it.
    document.querySelectorAll('[data-animate-group]').forEach(function (group) {
      var tagged = group.querySelectorAll('[data-animate-group-item]');
      var items = tagged.length ? tagged : group.children;
      if (!items.length) return;
      if (window.VM.reducedMotion || !window.ScrollTrigger) {
        gsap.fromTo(items, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'none' });
        return;
      }
      gsap.fromTo(
        items,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: group, start: 'top 85%', once: true },
        }
      );
    });

    // Global section-entry animation: any [data-animate="fade-up"] element
    // fades in + rises 24px when scrolled into view, once.
    var animated = document.querySelectorAll('[data-animate="fade-up"]');
    animated.forEach(function (el) {
      if (window.VM.reducedMotion || !window.ScrollTrigger) {
        gsap.fromTo(
          el,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: 0.4,
            ease: 'none',
            scrollTrigger: window.ScrollTrigger ? { trigger: el, start: 'top 85%', once: true } : undefined,
          }
        );
      } else {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          }
        );
      }
    });

    // Scroll-triggered phrase highlight.
    // Shopify's rich-text setting sanitizes stored HTML and strips custom
    // class/data-* attributes, so highlight spans can't live in the saved
    // content - instead we wrap plain text phrases into
    // <span class="vishesh-highlight" data-highlight> here, client-side,
    // right after render, then observe them with ScrollTrigger below.
    // Wraps only the first occurrence of each phrase per .rte block.
    function wrapTextPhrase(root, phrase) {
      if (!root || !phrase) return false;
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      var node;
      while ((node = walker.nextNode())) {
        var idx = node.nodeValue.indexOf(phrase);
        if (idx === -1) continue;
        var range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + phrase.length);
        var span = document.createElement('span');
        span.className = 'vishesh-highlight';
        span.setAttribute('data-highlight', '');
        range.surroundContents(span);
        return true;
      }
      return false;
    }

    var HIGHLIGHT_PHRASES = [
      '50+ years of experience',
      'VISHESH MASALA',
      "simplicity, honesty and the company's dynamic workforce",
      'uncompromised quality and exceptional taste',
      'Late Shri Jagdishchandra Ishwarlal Wankawala',
      '1,15,155 sq.ft.',
      '24x7 availability of electricity and water',
    ];

    document.querySelectorAll('.rte').forEach(function (rte) {
      HIGHLIGHT_PHRASES.forEach(function (phrase) {
        wrapTextPhrase(rte, phrase);
      });
    });

    // Any <span class="vishesh-highlight" data-highlight> inside rich text
    // lights up (mustard sweep + bold) once as the reader scrolls to it -
    // used on Our Story to call out key phrases (50+ years of experience,
    // founder's name, facility size, ...).
    // Highlights that cross the trigger line at nearly the same moment
    // (a paragraph with two or three highlighted phrases) used to all
    // light up together, reading as one simultaneous flash rather than
    // someone highlighting phrase by phrase. Queue them instead: each
    // activation claims the next slot in a shared timeline, so
    // near-simultaneous entries sweep in sequence, while a highlight
    // reached much later (after the queue has drained) still fires
    // immediately with no artificial wait.
    var HIGHLIGHT_STAGGER_MS = 200;
    var highlightQueueFreeAt = 0;

    document.querySelectorAll('[data-highlight]').forEach(function (el) {
      if (window.VM.reducedMotion || !window.ScrollTrigger) {
        el.classList.add('is-active');
        return;
      }
      ScrollTrigger.create({
        trigger: el,
        start: 'top 78%',
        once: true,
        onEnter: function () {
          var now = Date.now();
          var startAt = Math.max(now, highlightQueueFreeAt);
          highlightQueueFreeAt = startAt + HIGHLIGHT_STAGGER_MS;
          var wait = startAt - now;
          if (wait <= 0) {
            el.classList.add('is-active');
          } else {
            setTimeout(function () {
              el.classList.add('is-active');
            }, wait);
          }
        },
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
