/**
 * Our Journey timeline.
 * Desktop: the section pins and the milestone cards scrub horizontally
 * through the years as you scroll (brochure map-pin style).
 * Mobile / reduced motion: vertical list with a staggered fade-up.
 */
(function () {
  function init() {
    var section = document.querySelector('[data-timeline]');
    if (!section || !window.gsap || section.dataset.timelineDone) return;
    section.dataset.timelineDone = 'true';

    var track = section.querySelector('[data-timeline-track]');
    var items = section.querySelectorAll('.vishesh-timeline__item');
    if (!track || !items.length) return;

    var reduced = window.VM && window.VM.reducedMotion;
    var desktop = window.matchMedia('(min-width: 990px)').matches;

    if (reduced || !desktop || !window.ScrollTrigger) {
      // Each milestone gets its own trigger (not one shared trigger on
      // the whole section) so it reveals as IT crosses into view while
      // scrolling, not all together the moment the section starts -
      // on a tall vertical list that one-shared-trigger version played
      // its ~1.5s stagger the instant the top of the list appeared, so
      // every card below the fold was already fully visible long before
      // the user actually scrolled down to it - reads as "no animation"
      // for most of the list even though it technically had one.
      items.forEach(function (item, i) {
        gsap.fromTo(
          item,
          { autoAlpha: 0, y: reduced ? 0 : 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            ease: 'power3.out',
            scrollTrigger: window.ScrollTrigger
              ? { trigger: item, start: 'top 85%', once: true }
              : undefined,
          }
        );
      });
      return;
    }

    section.classList.add('vishesh-timeline--horizontal');

    var scrollAmount = function () {
      return Math.max(0, track.scrollWidth - track.clientWidth);
    };

    // Bug fix: each card used to get its own ScrollTrigger nested inside
    // the horizontal-scrub one via `containerAnimation: gsap.getTweensOf
    // (track)[0]`. That lookup is timing-fragile - when it silently
    // failed to resolve, cards stayed at their gsap.from() starting
    // state (autoAlpha: 0) forever, which reads as "the section is
    // empty" even though every card is correctly in the DOM. Replaced
    // with a single onUpdate on the main tween that checks each card's
    // own screen position directly - no nested-trigger lookup, so
    // nothing to silently fail.
    items.forEach(function (item) {
      gsap.set(item, { autoAlpha: 0, y: 40 });
    });

    var revealed = [];

    gsap.to(track, {
      x: function () {
        return -scrollAmount();
      },
      ease: 'none',
      onUpdate: function () {
        var sectionRect = section.getBoundingClientRect();
        items.forEach(function (item, i) {
          if (revealed[i]) return;
          var itemRect = item.getBoundingClientRect();
          if (itemRect.left < sectionRect.right * 0.85) {
            revealed[i] = true;
            gsap.to(item, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'back.out(1.6)' });
          }
        });
      },
      scrollTrigger: {
        trigger: section,
        pin: true,
        start: 'top top',
        end: function () {
          return '+=' + (scrollAmount() + 400);
        },
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefresh: function () {
          // Whatever is on screen right after layout settles (e.g. the
          // first card or two before any scrolling has happened) should
          // already be visible, not waiting for a scrub event.
          var sectionRect = section.getBoundingClientRect();
          items.forEach(function (item, i) {
            if (revealed[i]) return;
            var itemRect = item.getBoundingClientRect();
            if (itemRect.left < sectionRect.right * 0.85) {
              revealed[i] = true;
              gsap.set(item, { autoAlpha: 1, y: 0 });
            }
          });
        },
      },
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
