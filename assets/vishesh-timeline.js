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
      gsap.fromTo(
        items,
        { autoAlpha: 0, y: reduced ? 0 : 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: reduced ? 0 : 0.1,
          scrollTrigger: window.ScrollTrigger
            ? { trigger: section, start: 'top 80%', once: true }
            : undefined,
        }
      );
      return;
    }

    section.classList.add('vishesh-timeline--horizontal');

    var scrollAmount = function () {
      return Math.max(0, track.scrollWidth - track.clientWidth);
    };

    gsap.to(track, {
      x: function () {
        return -scrollAmount();
      },
      ease: 'none',
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
      },
    });

    items.forEach(function (item, i) {
      gsap.from(item, {
        autoAlpha: 0,
        y: 40,
        rotation: i % 2 === 0 ? -3 : 3,
        duration: 0.5,
        ease: 'back.out(1.6)',
        scrollTrigger: {
          trigger: item,
          containerAnimation: gsap.getTweensOf(track)[0],
          start: 'left 85%',
          once: true,
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
