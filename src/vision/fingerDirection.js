import { MovingAverage } from '../utils/helpers.js';
import { DIRECTION_DEBOUNCE } from '../utils/constants.js';

// Landmark indices (MediaPipe 21-point model)
const LM = {
  WRIST:       0,
  INDEX_MCP:   5,
  INDEX_PIP:   6,
  INDEX_DIP:   7,
  INDEX_TIP:   8,
};

// Smoothers for the direction vector
const smX = new MovingAverage(6);
const smY = new MovingAverage(6);

// Hysteresis: require the angle to pass a threshold to switch direction
let _lastDir = null;
let _lastDirTime = 0;

// Configurable thresholds
let config = {
  minMagnitude:    0.04,  // minimum normalised vector length to register pointing
  hysteresisAngle: 10,    // degrees of dead-zone between direction sectors (was 20)
  mirrorX:         true,  // webcam is typically mirrored
};

export function configureFingerDirection(cfg) {
  Object.assign(config, cfg);
}

export function resetFingerDirection() {
  smX.reset();
  smY.reset();
  _lastDir = null;
  _lastDirTime = 0;
}

/**
 * Estimate the direction the index finger is pointing.
 * @param {Object[]} landmarks  – 21 normalised {x,y,z} MediaPipe landmarks
 * @returns {'UP'|'DOWN'|'LEFT'|'RIGHT'|null}
 */
export function estimateFingerDirection(landmarks) {
  if (!landmarks || landmarks.length < 9) return null;

  const pip = landmarks[LM.INDEX_PIP];
  const tip = landmarks[LM.INDEX_TIP];

  let dx = tip.x - pip.x;
  let dy = tip.y - pip.y;

  // Mirror X for typical front-facing webcam
  if (config.mirrorX) dx = -dx;

  smX.push(dx);
  smY.push(dy);

  const sdx = smX.value;
  const sdy = smY.value;

  const mag = Math.sqrt(sdx * sdx + sdy * sdy);
  if (mag < config.minMagnitude) return null;

  // Raw angle in degrees
  const angleDeg = Math.atan2(sdy, sdx) * (180 / Math.PI);

  // Classify into quadrants with hysteresis
  const newDir = _angleToDir(angleDeg);
  if (!newDir) return _lastDir;

  const now = Date.now();
  if (newDir === _lastDir) {
    _lastDirTime = now;
    return _lastDir;
  }

  // Hysteresis: require cooldown between direction changes
  if (now - _lastDirTime < DIRECTION_DEBOUNCE) return _lastDir;

  _lastDir     = newDir;
  _lastDirTime = now;
  return newDir;
}

function _angleToDir(deg) {
  const h = config.hysteresisAngle;
  // RIGHT: angle near 0°
  if (deg >= -(45 - h) && deg < (45 - h)) return 'RIGHT';
  // DOWN: angle near 90° (y increases downward)
  if (deg >= (45 + h) && deg < (135 - h)) return 'DOWN';
  // UP: angle near -90°
  if (deg >= -(135 - h) && deg < -(45 + h)) return 'UP';
  // LEFT: angle near ±180°
  if (deg >= (135 + h) || deg < -(135 + h)) return 'LEFT';
  // Dead-zone between sectors → keep previous
  return null;
}

/**
 * Is the index finger clearly extended (pointing)?
 */
export function isIndexExtended(landmarks) {
  if (!landmarks || landmarks.length < 9) return false;
  const mcp = landmarks[LM.INDEX_MCP];
  const pip = landmarks[LM.INDEX_PIP];
  const tip = landmarks[LM.INDEX_TIP];
  const wrist = landmarks[LM.WRIST];
  const tipDist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
  const mcpDist = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);
  return tipDist > mcpDist * 1.15;
}

/** Raw (smoothed) vector used for calibration display */
export function getSmoothedVector() {
  return { x: smX.value, y: smY.value };
}

/**
 * Returns true when the hand is in a pointing pose:
 * index finger clearly extended AND middle / ring / pinky curled.
 * This gates direction steering so an open palm or fist never steers the snake.
 */
export function isPointingPose(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;
  if (!isIndexExtended(landmarks)) return false;

  const wrist = landmarks[0];
  // tip/pip indices for middle, ring, pinky
  const CURLED = [
    { tip: 12, pip: 10 },
    { tip: 16, pip: 14 },
    { tip: 20, pip: 18 },
  ];
  return CURLED.every(({ tip, pip }) => {
    const tipPt = landmarks[tip];
    const pipPt = landmarks[pip];
    const tipDist = Math.hypot(tipPt.x - wrist.x, tipPt.y - wrist.y);
    const pipDist = Math.hypot(pipPt.x - wrist.x, pipPt.y - wrist.y);
    return tipDist < pipDist * 0.95;
  });
}
