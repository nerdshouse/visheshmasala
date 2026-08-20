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

    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
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
      } else {
        (function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        })(0);
      }
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
    document.querySelectorAll('[data-animate-group]').forEach(function (group) {
      var items = group.children;
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
          el.classList.add('is-active');
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
