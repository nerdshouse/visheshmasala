/**
 * Our Journey - advances the milestones inside the sticky stage.
 *
 * Scope is deliberately tiny: work out which milestone the reader is
 * on from how far they have scrolled through the tall wrapper, and set
 * a class. Layout, sizing and the hold itself are all CSS - this file
 * moves nothing, so it cannot leave content stranded the way the
 * scripted pins in this section's history did.
 *
 * Degradation: the one-at-a-time behaviour lives behind the
 * .vishesh-timeline--live class, which only this file adds. If the
 * script never runs, every milestone stays in normal flow and the
 * section reads as a plain list. Reduced motion opts out the same way.
 */
(function () {
  function init() {
    var section = document.querySelector('[data-timeline]');
    var scroller = section && section.querySelector('[data-timeline-scroll]');
    if (!section || !scroller || section.dataset.timelineReady) return;

    var steps = section.querySelectorAll('[data-timeline-step]');
    var cards = section.querySelectorAll('[data-timeline-card]');
    if (!steps.length || cards.length !== steps.length) return;

    if (window.VM && window.VM.reducedMotion) return;
    section.dataset.timelineReady = 'true';
    section.classList.add('vishesh-timeline--live');

    var current = -1;
    var ticking = false;

    function apply(index) {
      if (index === current) return;
      current = index;
      for (var i = 0; i < cards.length; i++) {
        // `is-past` lets the rail show progress behind the reader
        // without the cards needing separate state.
        steps[i].classList.toggle('is-active', i === index);
        steps[i].classList.toggle('is-past', i < index);
        cards[i].classList.toggle('is-active', i === index);
      }
      scroller.style.setProperty('--progress', cards.length < 2 ? 1 : index / (cards.length - 1));
    }

    function update() {
      ticking = false;
      var rect = scroller.getBoundingClientRect();
      // Cheap bail-out when the section is well outside the viewport, so
      // running this every frame costs almost nothing on the rest of the
      // page.
      if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
      // Distance the wrapper travels while the stage is stuck. Guard
      // the divide: if the wrapper is ever shorter than the viewport
      // there is no travel and everything sits on the first milestone.
      var travel = rect.height - window.innerHeight;
      var progress = travel > 0 ? -rect.top / travel : 0;
      progress = Math.min(Math.max(progress, 0), 0.9999);
      apply(Math.floor(progress * cards.length));
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    update();

    // Driven per frame rather than from scroll events. Lenis animates
    // scroll in its own rAF loop and does not reliably surface a native
    // scroll event for every position it passes through - wiring this to
    // 'scroll' (and even to lenis.on('scroll')) left the milestone stuck
    // on the first card while the measured progress was already 0.25.
    // gsap.ticker is the same loop Lenis is already pumped from in
    // vishesh-motion.js, so reading progress there is always in step with
    // what is on screen. update() bails out cheaply when the section is
    // nowhere near the viewport, so this stays inexpensive.
    if (window.gsap && gsap.ticker && typeof gsap.ticker.add === 'function') {
      gsap.ticker.add(update);
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    window.addEventListener('resize', onScroll);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
  document.addEventListener('shopify:section:load', init);
})();
