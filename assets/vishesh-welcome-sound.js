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
  var MUTE_KEY = 'vishesh-welcome-sound-muted';

  // Supplied by theme.liquid from the welcome_sound_url setting, so the
  // clip can be swapped in Content > Files without touching this file.
  // Empty leaves this null and the generated chime below takes over,
  // exactly as it did before a real clip existed.
  var tag = document.querySelector('script[data-welcome-sound]');
  var CLIP_SRC = (tag && tag.getAttribute('data-clip-src')) || null;

  // Checked directly via matchMedia rather than window.VM.reducedMotion -
  // script load order between this file and vishesh-motion.js isn't
  // guaranteed, so this can't depend on that flag already being set.
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // A visitor who has stopped the sound once is never asked again.
  // localStorage rather than sessionStorage precisely because it has to
  // outlive the session the refusal happened in - a "no" that expires
  // when the tab closes isn't a no.
  try {
    if (localStorage.getItem(MUTE_KEY) === 'true') return;
  } catch (e) {
    // Storage unavailable - there is no stored refusal to honour.
  }

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

  // ---- Stop control ----
  // The supplied clip runs about eight seconds. WCAG 1.4.2 requires that
  // anything playing automatically for more than three seconds can be
  // stopped, so this is not optional decoration. It is built in JS rather
  // than in Liquid so it only ever enters the DOM on the page views where
  // sound actually starts.
  var stopBtn = null;

  function hideStop() {
    if (stopBtn) stopBtn.hidden = true;
  }

  function showStop() {
    if (stopBtn) {
      stopBtn.hidden = false;
      return;
    }
    stopBtn = document.createElement('button');
    stopBtn.type = 'button';
    stopBtn.className = 'vishesh-welcome-stop';
    stopBtn.setAttribute('aria-label', 'Stop welcome sound');
    stopBtn.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M4 9.5h3.4L12 5.6v12.8L7.4 14.5H4Z" fill="currentColor"/>' +
      '<path d="M16.5 9.5 21 14M21 9.5 16.5 14" stroke="currentColor" stroke-width="1.9" ' +
      'stroke-linecap="round" fill="none"/></svg><span>Stop sound</span>';
    stopBtn.addEventListener('click', function () {
      if (audioEl) {
        audioEl.pause();
        audioEl.currentTime = 0;
      }
      hideStop();
      // Stopping it is a standing preference, not just this one playback.
      try {
        localStorage.setItem(MUTE_KEY, 'true');
      } catch (e) {
        // Storage unavailable - it still stops for this page view.
      }
    });
    document.body.appendChild(stopBtn);
  }

  // One shared element across both attempts below. The on-load attempt
  // is expected to fail for most visitors, and building a second Audio
  // in the gesture handler would download the clip a second time.
  var audioEl = null;

  function ensureAudio() {
    if (audioEl) return audioEl;
    audioEl = new Audio(CLIP_SRC);
    audioEl.volume = 0.6;
    audioEl.addEventListener('playing', showStop);
    audioEl.addEventListener('ended', hideStop);
    audioEl.addEventListener('pause', hideStop);
    return audioEl;
  }

  function attemptPlay() {
    if (played) return;

    if (CLIP_SRC) {
      var promise = ensureAudio().play();
      // Older browsers return undefined rather than a promise.
      if (!promise || !promise.then) {
        markPlayed();
        return;
      }
      promise.then(markPlayed).catch(function () {
        // Either autoplay was blocked (expected on load - the gesture
        // fallback will call this again) or the file itself failed. The
        // chime is tried either way; when the cause was blocking it is
        // blocked too and reports false, so nothing is wrongly marked.
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
