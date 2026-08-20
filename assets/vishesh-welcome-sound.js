/**
 * Welcome sound - once per browser session.
 *
 * Technical note (see Phase 8 brief): true unprompted "sound plays the
 * instant the page opens" is not achievable in any current browser.
 * Chrome, Safari, and Firefox all block audio-with-sound from playing
 * before the visitor has interacted with the page in some way - this is
 * platform policy, not a bug in this code. What this file actually does,
 * in order:
 *
 * 1. On load, attempts to play immediately via the Web Audio API. This
 *    succeeds for a minority of visitors - browsers that have decided,
 *    from the visitor's own history with this site/browser profile, that
 *    autoplay is likely welcome (Chrome's MEI heuristic and similar). It
 *    will silently do nothing for a first-time visitor, which is expected
 *    and not an error.
 * 2. Regardless of whether step 1 worked, a one-time listener on the
 *    visitor's very first interaction (click, tap, scroll, keydown) plays
 *    the sound if it hasn't already played - a real user gesture always
 *    satisfies autoplay policy, so this is the fallback that actually
 *    reaches every visitor, just not at the exact instant of page load.
 *
 * Same generated-tone stub approach as assets/vishesh-sound.js (no real
 * recorded/licensed brand clip has been supplied yet) - swap in a real
 * short clip by setting CLIP_SRC once one exists; no other logic changes.
 *
 * Plays once per browser session (sessionStorage), not on every page
 * navigation - repeating on every single page load in a multi-page
 * storefront would stop feeling like a welcome and start feeling like
 * a nag.
 */
(function () {
  var SESSION_KEY = 'vishesh-welcome-sound-played';
  var CLIP_SRC = null; // set to an assets/sounds/ filename once a real clip exists

  // Checked directly via matchMedia rather than window.VM.reducedMotion -
  // script load order between this file and vishesh-motion.js isn't
  // guaranteed, so this can't depend on that flag already being set.
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var played = false;
  try {
    played = sessionStorage.getItem(SESSION_KEY) === 'true';
  } catch (e) {
    // Storage unavailable (private browsing lockdown, etc.) - fall back to
    // an in-memory flag so this at least behaves correctly for the rest
    // of this page view rather than throwing.
  }
  if (played) return;

  var audioCtx = null;

  function markPlayed() {
    played = true;
    try {
      sessionStorage.setItem(SESSION_KEY, 'true');
    } catch (e) {
      // ignore - in-memory `played` flag above still prevents a repeat
      // within this same page view
    }
  }

  // Returns true only if audio actually started (AudioContext reached
  // "running"), false if the browser silently blocked it (stays
  // "suspended" - no error is thrown, it just never produces sound).
  // Getting this distinction right matters: the on-load attempt must NOT
  // be treated as "done" when the browser blocked it, or the first-
  // gesture fallback below would never get a chance to actually play
  // anything for exactly the visitors who need it (first-time visitors,
  // which is the majority case this whole feature exists to reach).
  function playGeneratedChime() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    audioCtx = audioCtx || new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (audioCtx.state !== 'running') return false;

    // Two-note rising chime, ~0.9s total - short and simple, distinct
    // from the product-sound-button stub tones so the two don't sound
    // like the same effect.
    var freqs = [392, 587];
    var now = audioCtx.currentTime;
    var noteLength = 0.42;

    freqs.forEach(function (freq, i) {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      var start = now + i * (noteLength * 0.55);
      var end = start + noteLength;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.16, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.start(start);
      osc.stop(end + 0.02);
    });
    return true;
  }

  function attemptPlay() {
    if (played) return;

    if (CLIP_SRC) {
      var audio = new Audio(CLIP_SRC);
      audio.volume = 0.6;
      audio
        .play()
        .then(markPlayed)
        .catch(function () {
          if (playGeneratedChime()) markPlayed();
        });
      return;
    }

    if (playGeneratedChime()) markPlayed();
  }

  // Step 1: try immediately on load. Silently does nothing in browsers
  // that block it outright (no thrown error surfaces to the visitor).
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attemptPlay, { once: true });
  } else {
    attemptPlay();
  }

  // Step 2: the reliable fallback - first real user gesture anywhere on
  // the page. Only one of these fires (whichever happens first), and the
  // listeners remove themselves either way once a gesture has occurred,
  // regardless of whether step 1 already played the sound.
  //
  // Deliberately NOT listening for 'wheel' here (Phase 9 fix). This was
  // originally in the list ("first click, tap, or scroll" per the
  // brief), but it's the one event type this file and the quick-add/
  // cart-drawer scroll-lock fix (vishesh-motion.js) both listen for on
  // document, and after it went in, scroll started freezing sitewide
  // after exactly one gesture - matching "a stray once: true on a
  // scroll-related listener... interfering with the general scroll
  // pipeline" closely enough that it's not worth the risk of keeping.
  // click/tap/key already cover the vast majority of first interactions;
  // a visitor who only ever scrolls (no click/tap/key) simply doesn't
  // get the welcome sound this session, which is a fully acceptable
  // trade next to freezing the page for everyone.
  var gestureEvents = ['pointerdown', 'touchstart', 'keydown'];
  function onFirstGesture() {
    gestureEvents.forEach(function (type) {
      document.removeEventListener(type, onFirstGesture);
    });
    attemptPlay();
  }
  gestureEvents.forEach(function (type) {
    document.addEventListener(type, onFirstGesture, { once: true, passive: true });
  });
})();
