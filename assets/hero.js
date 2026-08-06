/**
 * Hero kinetic headline (animation #1 in CLAUDE.md).
 * Splits the h1 into letters and animates each from a randomized y offset
 * and rotation on page load. Under reduced motion: simple opacity fade.
 * Also floats the decorative spice shapes when no hero image is set.
 */
(function () {
  function init() {
    var headline = document.querySelector('[data-kinetic-headline]');
    if (!headline || !window.gsap || headline.dataset.kineticDone) return;
    headline.dataset.kineticDone = 'true';

    if (window.VM && window.VM.reducedMotion) {
      gsap.fromTo(headline, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'none' });
      floatSpices(true);
      return;
    }

    var chars;
    if (window.SplitText) {
      chars = new SplitText(headline, { type: 'chars', charsClass: 'vishesh-hero__char' }).chars;
    } else {
      // Manual span-wrap fallback, word-by-word so wrapping stays intact
      var words = headline.textContent.split(' ');
      headline.textContent = '';
      chars = [];
      words.forEach(function (word, wi) {
        var wordSpan = document.createElement('span');
        wordSpan.style.display = 'inline-block';
        wordSpan.style.whiteSpace = 'nowrap';
        word.split('').forEach(function (ch) {
          var s = document.createElement('span');
          s.className = 'vishesh-hero__char';
          s.style.display = 'inline-block';
          s.textContent = ch;
          wordSpan.appendChild(s);
          chars.push(s);
        });
        headline.appendChild(wordSpan);
        if (wi < words.length - 1) headline.appendChild(document.createTextNode(' '));
      });
    }

    // Scroll parallax: spice shapes drift at different speeds as the hero scrolls away
    if (window.ScrollTrigger) {
      var hero = document.querySelector('.vishesh-hero');
      var spices = document.querySelectorAll('[data-hero-float]');
      if (hero && spices.length) {
        spices.forEach(function (el, i) {
          gsap.to(el, {
            yPercent: (i % 2 === 0 ? -1 : 1) * (30 + i * 15),
            ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
          });
        });
      }
    }

    gsap.set(headline, { autoAlpha: 1 });
    gsap.from(chars, {
      y: function () {
        return gsap.utils.random(30, 80);
      },
      rotation: function () {
        return gsap.utils.random(-15, 15);
      },
      autoAlpha: 0,
      ease: 'power3.out',
      duration: 0.9,
      stagger: 0.02,
    });

    floatSpices(false);
  }

  function floatSpices(reduced) {
    var spices = document.querySelectorAll('[data-hero-float]');
    if (!spices.length || !window.gsap) return;
    if (reduced) {
      gsap.set(spices, { autoAlpha: 1 });
      return;
    }
    spices.forEach(function (el, i) {
      gsap.fromTo(
        el,
        { autoAlpha: 0, scale: 0.6 },
        { autoAlpha: 1, scale: 1, duration: 0.8, delay: 0.3 + i * 0.12, ease: 'back.out(1.7)' }
      );
      gsap.to(el, {
        y: gsap.utils.random(-18, 18),
        x: gsap.utils.random(-10, 10),
        rotation: gsap.utils.random(-10, 10),
        duration: gsap.utils.random(2.5, 4),
        delay: 1.1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
