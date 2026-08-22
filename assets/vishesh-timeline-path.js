/**
 * Our Journey: connecting path between the milestone pins.
 *
 * Draws a dashed trail from pin to pin that reveals as the section
 * scrolls past, so the grid reads as a route walked forward through
 * time rather than a list of cards.
 *
 * Deliberately NOT pinned. A pinned/scrub-translate mechanic has now
 * failed twice in this theme (purity-promise, and this very section
 * before Phase 13), so this uses a plain ScrollTrigger scrub tied to
 * the section's normal scroll-past - nothing hijacks or holds scroll,
 * and if ScrollTrigger is missing the path simply renders fully drawn.
 *
 * Geometry is measured from the real rendered pin positions rather
 * than hardcoded per breakpoint, so the same code follows the grid
 * whether it resolves to 3, 2 or 1 column.
 */
(function () {
  function buildPath(stage, svg) {
    var pins = stage.querySelectorAll('.vishesh-timeline__pin');
    if (pins.length < 2) return null;

    var stageRect = stage.getBoundingClientRect();
    var points = [];
    for (var i = 0; i < pins.length; i++) {
      var r = pins[i].getBoundingClientRect();
      points.push({
        x: r.left - stageRect.left + r.width / 2,
        y: r.top - stageRect.top + r.height / 2,
      });
    }

    svg.setAttribute('viewBox', '0 0 ' + stageRect.width + ' ' + stageRect.height);
    svg.setAttribute('width', stageRect.width);
    svg.setAttribute('height', stageRect.height);

    // Round the corner where the trail wraps from the end of one row to
    // the start of the next, so it reads as a route rather than a
    // zig-zag of hard right angles.
    var d = 'M ' + points[0].x + ' ' + points[0].y;
    for (var j = 1; j < points.length; j++) {
      var prev = points[j - 1];
      var cur = points[j];
      var sameRow = Math.abs(cur.y - prev.y) < 4;
      if (sameRow) {
        d += ' L ' + cur.x + ' ' + cur.y;
      } else {
        var midY = (prev.y + cur.y) / 2;
        d += ' C ' + prev.x + ' ' + midY + ', ' + cur.x + ' ' + midY + ', ' + cur.x + ' ' + cur.y;
      }
    }

    var path = svg.querySelector('path');
    if (!path) {
      path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);
    }
    path.setAttribute('d', d);
    return path;
  }

  function init() {
    var stage = document.querySelector('[data-timeline-stage]');
    var svg = stage && stage.querySelector('[data-timeline-path]');
    if (!stage || !svg) return;

    var reduced = window.VM && window.VM.reducedMotion;
    var trigger = null;

    function draw() {
      var path = buildPath(stage, svg);
      if (!path) return;

      var len = path.getTotalLength();
      // Classic dash-offset line draw: one dash as long as the whole
      // path, offset by that same length so nothing shows initially,
      // then the offset is walked to 0 as the section scrolls past.
      path.style.strokeDasharray = len + ' ' + len;
      path.style.strokeDashoffset = reduced ? 0 : len;

      if (reduced || !window.ScrollTrigger || !window.gsap) {
        path.style.strokeDashoffset = 0;
        return;
      }

      if (trigger) trigger.kill();
      trigger = ScrollTrigger.create({
        trigger: stage,
        start: 'top 85%',
        end: 'bottom 60%',
        scrub: 0.6,
        onUpdate: function (self) {
          path.style.strokeDashoffset = len * (1 - self.progress);
        },
      });
    }

    draw();
    // The grid reflows at 990px and 749px, and card heights change with
    // the text wrap, so the measured geometry has to be rebuilt rather
    // than cached from first paint.
    window.addEventListener('resize', draw);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(draw);
    }

    revealCards();
  }

  /**
   * Row-aware card reveal.
   *
   * The generic [data-animate-group] stagger fires every card from one
   * trigger on the whole list, so on a 3-row grid rows 2 and 3 had
   * already played by the time you scrolled to them. Here each card
   * gets its own trigger, with a small delay derived from its column,
   * so each row sweeps left-to-right (which is also chronological -
   * the grid fills in block order) as that row comes into view.
   *
   * Safety: cards are visible by default in CSS and are only hidden
   * here once we know both gsap and ScrollTrigger exist to bring them
   * back. This section shipped broken twice by leaving cards stuck at
   * autoAlpha:0 when an animation never fired - this ordering makes
   * that failure mode impossible.
   */
  function revealCards() {
    var list = document.querySelector('[data-timeline-cards]');
    if (!list || list.dataset.revealed) return;
    var cards = list.children;
    if (!cards.length) return;

    var reduced = window.VM && window.VM.reducedMotion;
    if (reduced || !window.gsap || !window.ScrollTrigger) return;
    list.dataset.revealed = 'true';

    var COLUMN_STEP = 0.09;
    Array.prototype.forEach.call(cards, function (card) {
      var col = Math.round(card.offsetLeft / Math.max(1, card.offsetWidth + 24));
      gsap.fromTo(
        card,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          delay: col * COLUMN_STEP,
          scrollTrigger: { trigger: card, start: 'top 88%', once: true },
        }
      );
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
  document.addEventListener('shopify:section:load', init);
})();
