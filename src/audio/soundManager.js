let ctx = null;
let masterGain = null;
let sfxGain    = null;
let _muted     = false;
let _volume    = 0.7;
let _unlocked  = false;

function _ensureCtx() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return; // audio unsupported — stay silent
  try {
    ctx = new AC();
  } catch {
    ctx = null;
    return;
  }
  masterGain = ctx.createGain();
  masterGain.gain.value = _muted ? 0 : _volume;
  masterGain.connect(ctx.destination);
  sfxGain = ctx.createGain();
  sfxGain.gain.value = 1;
  sfxGain.connect(masterGain);
}

function _tone(freq, type, dur, gain = 0.3, dest = null) {
  _ensureCtx();
  if (!ctx) return;
  const out = dest || sfxGain;
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  osc.connect(g);
  g.connect(out);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + dur + 0.01);
}

function _chord(freqs, type, dur, gain = 0.25) {
  freqs.forEach(f => _tone(f, type, dur, gain));
}

export function unlockAudio() {
  if (_unlocked) return;
  _ensureCtx();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  _unlocked = true;
}

export function setMuted(v) {
  _muted = v;
  if (masterGain && ctx) masterGain.gain.setTargetAtTime(_muted ? 0 : _volume, ctx.currentTime, 0.05);
}

export function setVolume(v) {
  _volume = v;
  if (masterGain && ctx && !_muted) masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
}

export function playEat() {
  _chord([880, 1320], 'sine', 0.1, 0.25);
}

export function playBonusEat() {
  [880, 1100, 1320, 1760].forEach((f, i) =>
    setTimeout(() => _chord([f, f * 1.5], 'sine', 0.12, 0.2), i * 50)
  );
}

export function playPowerUp() {
  [440, 550, 660, 880].forEach((f, i) =>
    setTimeout(() => _tone(f, 'sawtooth', 0.1, 0.2), i * 45)
  );
}

export function playGameOver() {
  [400, 300, 200, 100].forEach((f, i) =>
    setTimeout(() => _tone(f, 'sawtooth', 0.3, 0.3), i * 110)
  );
}

export function playLevelUp() {
  [523, 659, 784, 1047].forEach((f, i) =>
    setTimeout(() => _chord([f, f * 1.25], 'triangle', 0.2, 0.3), i * 80)
  );
}

export function playClick() {
  _tone(800, 'sine', 0.06, 0.2);
}

export function playPause() {
  _chord([440, 330], 'sine', 0.15, 0.2);
}

export function playResume() {
  _chord([330, 440, 550], 'sine', 0.15, 0.2);
}

export function playShield() {
  _chord([660, 880, 1100], 'sine', 0.3, 0.25);
}
