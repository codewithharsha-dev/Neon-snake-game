import { GESTURE, GESTURE_COOLDOWN, GESTURE_STABILITY_FRAMES } from '../utils/constants.js';

// Landmark indices
const FINGERS = {
  thumb:  { mcp: 2,  tip: 4,  pip: 3 },
  index:  { mcp: 5,  tip: 8,  pip: 6  },
  middle: { mcp: 9,  tip: 12, pip: 10 },
  ring:   { mcp: 13, tip: 16, pip: 14 },
  pinky:  { mcp: 17, tip: 20, pip: 18 },
};

// Temporal stability buffer
const stabilityBuf = [];
let _lastGesture   = GESTURE.NONE;
let _lastGestureTs = 0;
let _cooldownActive = false;

export function resetGestureRecognizer() {
  stabilityBuf.length = 0;
  _lastGesture    = GESTURE.NONE;
  _lastGestureTs  = 0;
  _cooldownActive = false;
}

/**
 * Detect gesture from landmarks.
 * Returns a GESTURE constant or null when nothing new fires.
 */
export function detectGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;

  const raw = _classifyGesture(landmarks);
  stabilityBuf.push(raw);
  if (stabilityBuf.length > GESTURE_STABILITY_FRAMES) stabilityBuf.shift();

  // A gesture is stable if all frames agree
  const stable = stabilityBuf.length === GESTURE_STABILITY_FRAMES
    && stabilityBuf.every(g => g === raw && g !== GESTURE.NONE);

  if (!stable) return null;

  const now = Date.now();

  // Cooldown: don't re-fire while same gesture held
  if (raw === _lastGesture) {
    if (!_cooldownActive && now - _lastGestureTs > GESTURE_COOLDOWN) {
      // Allow re-fire only after cooldown elapsed and hand reset
    } else {
      return null;
    }
  }

  _lastGesture    = raw;
  _lastGestureTs  = now;
  _cooldownActive = true;
  // Release cooldown after a second
  setTimeout(() => { _cooldownActive = false; }, GESTURE_COOLDOWN);

  return raw;
}

function _classifyGesture(lm) {
  const ext = {
    thumb:  _isThumbUp(lm),
    index:  _isCurled(lm, FINGERS.index)  === false,
    middle: _isCurled(lm, FINGERS.middle) === false,
    ring:   _isCurled(lm, FINGERS.ring)   === false,
    pinky:  _isCurled(lm, FINGERS.pinky)  === false,
  };

  // Open palm: index + middle + ring + pinky extended
  if (ext.index && ext.middle && ext.ring && ext.pinky) return GESTURE.OPEN_PALM;

  // Thumbs-up: thumb extended upward, others curled
  if (ext.thumb && !ext.index && !ext.middle && !ext.ring && !ext.pinky) return GESTURE.THUMBS_UP;

  return GESTURE.NONE;
}

function _isCurled(lm, finger) {
  const tip   = lm[finger.tip];
  const pip   = lm[finger.pip];
  const wrist = lm[0];
  const tipDist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
  const pipDist = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);
  return tipDist < pipDist * 0.95;
}

function _isThumbUp(lm) {
  const tip = lm[4];
  const mcp = lm[2];
  // Tip significantly above MCP in image coordinates (y decreases upward)
  return tip.y < mcp.y - 0.08;
}

/** Human-readable label for display */
export function gestureLabel(g) {
  const map = {
    [GESTURE.OPEN_PALM]: '✋ Open Palm — Pause',
    [GESTURE.THUMBS_UP]: '👍 Thumbs Up — Restart',
    [GESTURE.POINTING]:  '☝️ Pointing',
    [GESTURE.NONE]:      '',
  };
  return map[g] || '';
}
