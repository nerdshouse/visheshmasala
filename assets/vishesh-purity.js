/**
 * "Why Choose Vishesh?" - hold the section briefly and play the promise
 * reveal against scroll, then release.
 *
 * History worth knowing before editing this file: a pinned version of
 * this section was removed twice before, and the live theme was still
 * carrying one whose pin-spacer was 5121px tall with 1000px of padding
 * - roughly 5,500px of dead scroll every visitor had to drag through,
 * and a suspect in a long-running scroll-freeze report. This
 * reimplementation is deliberately constrained:
 *
 *   - PIN_DISTANCE is short and fixed, so the dead-scroll cost is
 *     bounded and small rather than open-ended.
 *   - It refuses to pin on short viewports (MIN_VIEWPORT_HEIGHT). A
 *     pin taller than the space available is what produced the
 *     unrecoverable scroll-lock in the earlier attempts.
 *   - It refuses to pin on small screens, where the section is taller
 *     than the viewport anyway and pinning has nothing to add.
 *   - Reduced motion skips the pin entirely.
 *
 * In every skipped case the promises still reveal, just as a plain
 * staggered fade on scroll-into-view. This module owns that fallback
 * too, rather than leaving it to the sitewide [data-animate-group]
 * handler, so exactly one thing animates these elements and the two
 * can't fight over the same inline styles.
 *
 * The tween targets .vishesh-purity__sticker-inner, never the <li>:
 * the <li> carries the CSS transform that places it on the orbit, and
 * a tween writing its own transform there would snap every pill to the
 * centre of the circle.
 */
(function () {
  var PIN_DISTANCE = 620;
  var MIN_VIEWPORT_HEIGHT = 700;
  var MIN_VIEWPORT_WIDTH = 750;

  function init() {
    var section = document.querySelector('[data-purity]');
    if (!section || section.dataset.purityReady) return;

    var items = section.querySelectorAll('.vishesh-purity__sticker-inner');
    if (!items.length) return;
    section.dataset.purityReady = 'true';

    var reduced = window.VM && window.VM.reducedMotion;

    // No GSAP at all: leave the markup exactly as rendered. The pills
    // are visible by default in CSS, so this degrades to a static
    // section rather than a blank one.
    if (!window.gsap) return;

    if (reduced || !window.ScrollTrigger) {
      gsap.fromTo(
        items,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 0.4,
          ease: 'none',
          stagger: 0.06,
          scrollTrigger: window.ScrollTrigger ? { trigger: section, start: 'top 80%', once: true } : undefined,
        }
      );
      return;
    }

    var trigger = null;

    function plainReveal() {
      return gsap.fromTo(
        items,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: section, start: 'top 80%', once: true },
        }
      );
    }

    function pinnedReveal() {
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=' + PIN_DISTANCE,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      tl.fromTo(
        items,
        { autoAlpha: 0, y: 28, scale: 0.9 },
        { autoAlpha: 1, y: 0, scale: 1, ease: 'power2.out', stagger: 0.5, duration: 1 }
      );
      // A little tail so the last pill is fully settled - and readable -
      // before the pin releases, rather than completing exactly as the
      // section starts moving again.
      tl.to({}, { duration: 0.6 });
      return tl.scrollTrigger;
    }

    function shouldPin() {
      return (
        window.innerWidth >= MIN_VIEWPORT_WIDTH &&
        window.innerHeight >= MIN_VIEWPORT_HEIGHT &&
        // A pin only makes sense if the section actually fits the
        // viewport; pinning something taller than the screen hides its
        // own content behind the fold while scroll is held.
        section.offsetHeight <= window.innerHeight
      );
    }

    function build() {
      if (trigger) {
        trigger.kill(true);
        trigger = null;
      }
      gsap.set(items, { clearProps: 'all' });
      trigger = shouldPin() ? pinnedReveal() : plainReveal().scrollTrigger;
    }

    build();

    // Rebuild across breakpoint changes so a pin created on a desktop
    // width doesn't linger after a resize into the range where it was
    // ruled out.
    var resizeTimer = null;
    var lastPinned = shouldPin();
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var next = shouldPin();
        if (next !== lastPinned) {
          lastPinned = next;
          build();
        }
      }, 200);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
  document.addEventListener('shopify:section:load', init);
})();
