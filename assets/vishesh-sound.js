/**
 * Product page sound button - click to play only, never autoplay.
 *
 * STUB MODE: real recorded/licensed clips have not been supplied yet, so
 * this plays a short two-note oscillator tone per category via the Web
 * Audio API instead. Flip STUB to false once files exist under
 * assets/sounds/ (see the mapping in snippets/vishesh-sound-button.liquid) -
 * no other code needs to change, playRealClip() already reads
 * data-sound-src off the button.
 *
 * Do not ship this stub as final audio - swap in real clips before launch.
 */
(function () {
  var STUB = true;

  // Placeholder tone recipes (Hz per note) - one rough mood per category,
  // not a substitute for the real recorded clips.
  var STUB_TONES = {
    'asafoetida-hing': [196, 147],
    'authentic-blended-spice': [440, 660],
    'easy-to-cook': [523, 784],
    herbs: [330, 494],
    'essential-products': [220, 165],
    'horeca-products': [392, 523, 659],
    'upwas-products': [261, 392],
    default: [349, 523],
  };

  var audioCtx = null;
  var currentAudio = null;
  var currentButton = null;

  function setPressed(btn, pressed) {
    btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    btn.setAttribute('aria-label', pressed ? btn.dataset.labelStop : btn.dataset.labelPlay);
    btn.classList.toggle('vishesh-sound-btn--playing', pressed);
  }

  function stopCurrent() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    if (currentButton) setPressed(currentButton, false);
    currentAudio = null;
    currentButton = null;
  }

  function playStubTone(btn) {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx || new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    var freqs = STUB_TONES[btn.dataset.soundKey] || STUB_TONES.default;
    var now = audioCtx.currentTime;
    var noteLength = 0.18;

    setPressed(btn, true);
    currentButton = btn;
    currentAudio = null;

    freqs.forEach(function (freq, i) {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      var start = now + i * noteLength;
      var end = start + noteLength - 0.02;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.start(start);
      osc.stop(end + 0.02);
    });

    var totalMs = (freqs.length * noteLength + 0.1) * 1000;
    setTimeout(function () {
      if (currentButton === btn) {
        setPressed(btn, false);
        currentButton = null;
      }
    }, totalMs);
  }

  function playRealClip(btn) {
    // Lazily construct the Audio element on first click only - no request
    // fires for visitors who never press the button.
    if (!btn._audioEl) {
      btn._audioEl = new Audio(btn.dataset.soundSrc);
      btn._audioEl.preload = 'none';
      btn._audioEl.addEventListener('pause', function () {
        if (currentAudio === btn._audioEl) setPressed(btn, false);
      });
      btn._audioEl.addEventListener('ended', function () {
        if (currentAudio === btn._audioEl) {
          setPressed(btn, false);
          currentAudio = null;
          currentButton = null;
        }
      });
    }

    currentAudio = btn._audioEl;
    currentButton = btn;
    currentAudio.currentTime = 0;
    setPressed(btn, true);
    currentAudio.play().catch(function () {
      // File missing or blocked - fall back to the stub tone so the
      // button never silently does nothing.
      playStubTone(btn);
    });
  }

  function handleClick(event) {
    var btn = event.currentTarget;
    var wasPlayingThis = currentButton === btn && btn.getAttribute('aria-pressed') === 'true';

    stopCurrent();
    if (wasPlayingThis) return; // clicking the active button just stops it

    if (!STUB && btn.dataset.soundSrc) {
      playRealClip(btn);
    } else {
      playStubTone(btn);
    }
  }

  function init() {
    document.querySelectorAll('.vishesh-sound-btn').forEach(function (btn) {
      if (btn.dataset.soundReady) return;
      btn.dataset.soundReady = 'true';
      btn.addEventListener('click', handleClick);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
