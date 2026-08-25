/**
 * Our Journey: the spine as a drawn path.
 *
 * Builds an SVG path that threads through every milestone node, bulging
 * to alternate sides between them so the line reads as a route rather
 * than a rule, then traces it with stroke-dashoffset as the section
 * scrolls past. Nodes light up as the line reaches them.
 *
 * The geometry is measured from the live DOM rather than hard-coded,
 * because the milestone cards are different heights and the layout
 * switches from two-sided to single-column at 990px. It is rebuilt on
 * resize and once fonts have settled, since both move the nodes.
 *
 * Progressive enhancement, deliberately: the markup ships with a plain
 * CSS track and fully-coloured nodes, and this script only takes over
 * once it has successfully measured and built a path (it adds
 * .vishesh-journey--drawn). If it never runs, the section is still a
 * finished timeline - this section has twice shipped milestones
 * stranded invisible behind a script that did not run, and it should
 * not be possible a third time.
 *
 * Driven from a rAF loop gated by an IntersectionObserver rather than
 * scroll events: Lenis drives scrolling here and does not reliably emit
 * native scroll, and the loop costs nothing while the section is off
 * screen. Reduced motion draws the path complete and never loops.
 */
(function () {
  // The trail runs down a 6.4rem gutter between the year and the copy, so
  // the bow has to stay inside it - well under half the gutter, or the
  // curve reads as crossing into the text.
  var AMP_WIDE = 22; // px the line bows out between nodes, two-column layout
  var AMP_NARROW = 9; // ditto for the stacked layout under 990px
  var WIDE_FROM = 990;

  function init() {
    var section = document.querySelector('[data-journey]');
    if (!section) return;
    // shopify:section:load fires on every theme-editor edit, and this also
    // runs on DOMContentLoaded - without a guard each pass would stack
    // another rAF loop and another observer on the same section.
    if (section.dataset.journeyReady) return;
    var list = section.querySelector('[data-journey-list]');
    var svg = section.querySelector('[data-journey-path]');
    if (!list || !svg) return;

    var track = svg.querySelector('[data-journey-track]');
    var line = svg.querySelector('[data-journey-line]');
    var nodes = Array.prototype.slice.call(section.querySelectorAll('[data-journey-node]'));
    if (!track || !line || nodes.length < 2) return;

    var reduced = window.VM && window.VM.reducedMotion;
    var length = 0;
    var points = [];
    var running = false;
    var frame = null;

    function build() {
      var listBox = list.getBoundingClientRect();
      if (!listBox.height) return false;

      points = nodes.map(function (node) {
        var box = node.getBoundingClientRect();
        return {
          x: box.left - listBox.left + box.width / 2,
          y: box.top - listBox.top + box.height / 2,
        };
      });

      var amp = window.innerWidth >= WIDE_FROM ? AMP_WIDE : AMP_NARROW;
      var d = 'M ' + points[0].x.toFixed(1) + ' ' + points[0].y.toFixed(1);

      for (var i = 1; i < points.length; i++) {
        var from = points[i - 1];
        var to = points[i];
        // Alternate which side the bow falls on so consecutive segments
        // read as one continuous S rather than a row of identical arcs.
        var bow = i % 2 === 1 ? amp : -amp;
        var lead = (to.y - from.y) * 0.35;
        d +=
          ' C ' +
          (from.x + bow).toFixed(1) + ' ' + (from.y + lead).toFixed(1) + ', ' +
          (to.x + bow).toFixed(1) + ' ' + (to.y - lead).toFixed(1) + ', ' +
          to.x.toFixed(1) + ' ' + to.y.toFixed(1);
      }

      svg.setAttribute('viewBox', '0 0 ' + listBox.width + ' ' + listBox.height);
      svg.setAttribute('width', listBox.width);
      svg.setAttribute('height', listBox.height);
      track.setAttribute('d', d);
      line.setAttribute('d', d);

      length = line.getTotalLength();
      if (!length) return false;
      line.style.strokeDasharray = length;
      line.style.strokeDashoffset = reduced ? 0 : length;

      section.classList.add('vishesh-journey--drawn');
      return true;
    }

    function progress() {
      var box = list.getBoundingClientRect();
      var vh = window.innerHeight;
      // Starts drawing as the list enters the lower part of the screen,
      // finishes a little before its end leaves the upper part, so the
      // last milestone is reached while it is still comfortably in view.
      var start = vh * 0.82;
      var end = vh * 0.4;
      var total = box.height + (start - end);
      if (total <= 0) return 1;
      var p = (start - box.top) / total;
      return p < 0 ? 0 : p > 1 ? 1 : p;
    }

    function paint() {
      var p = progress();
      line.style.strokeDashoffset = length * (1 - p);

      // A node counts as reached once the drawn head passes its centre.
      var head = p * (points.length - 1);
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].classList.toggle('is-reached', i <= head + 0.15);
      }
    }

    function loop() {
      paint();
      frame = window.requestAnimationFrame(loop);
    }

    function start() {
      if (running || reduced) return;
      running = true;
      loop();
    }

    function stop() {
      if (!running) return;
      running = false;
      if (frame) window.cancelAnimationFrame(frame);
      frame = null;
    }

    if (!build()) return;
    section.dataset.journeyReady = 'true';

    if (reduced) {
      // Path shown complete, every node lit, nothing animating.
      nodes.forEach(function (node) {
        node.classList.add('is-reached');
      });
      return;
    }

    paint();

    if (typeof IntersectionObserver === 'function') {
      new IntersectionObserver(
        function (entries) {
          entries[0].isIntersecting ? start() : stop();
        },
        { rootMargin: '120px 0px' }
      ).observe(section);
    } else {
      start();
    }

    var rebuild = function () {
      var wasRunning = running;
      stop();
      build();
      paint();
      if (wasRunning) start();
    };

    if (typeof ResizeObserver === 'function') {
      var pending = null;
      new ResizeObserver(function () {
        if (pending) window.cancelAnimationFrame(pending);
        pending = window.requestAnimationFrame(rebuild);
      }).observe(list);
    } else {
      window.addEventListener('resize', rebuild);
    }

    // Font swap re-flows the cards, which moves every node.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
  document.addEventListener('shopify:section:load', init);
})();
