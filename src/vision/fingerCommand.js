import {
  TURN_STABILITY_FRAMES, TURN_REPEAT_MS, TURN_MIN_GAP_MS,
} from '../utils/constants.js';

/**
 * Finger-count turn controls.
 *   1 finger  (index only)            -> turn RIGHT (clockwise)
 *   2 fingers (index + middle)        -> turn LEFT  (counter-clockwise)
 * The thumb is ignored. Open palm / fist / thumbs-up are never read as a turn.
 */

const FINGERS = {
  index:  { tip: 8,  pip: 6  },
  middle: { tip: 12, pip: 10 },
  ring:   { tip: 16, pip: 14 },
  pinky:  { tip: 20, pip: 18 },
};

export const POSE = { ONE: 'ONE', TWO: 'TWO', OTHER: 'OTHER' };

// Stateful turn detector
let candidate    = POSE.OTHER;
let candidateRun = 0;
let acceptedPose = null;
let lastFireTs   = 0;

export function resetFingerCommand() {
  candidate    = POSE.OTHER;
  candidateRun = 0;
  acceptedPose = null;
  lastFireTs   = 0;
}

function isExtended(lm, finger) {
  const wrist = lm[0];
  const tip   = lm[finger.tip];
  const pip   = lm[finger.pip];
  const tipDist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
  const pipDist = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);
  return tipDist > pipDist * 1.08;
}

/** Which of the four non-thumb fingers are extended. */
export function extendedFingers(lm) {
  return {
    index:  isExtended(lm, FINGERS.index),
    middle: isExtended(lm, FINGERS.middle),
    ring:   isExtended(lm, FINGERS.ring),
    pinky:  isExtended(lm, FINGERS.pinky),
  };
}

/** Number of extended non-thumb fingers (0–4). */
export function countExtendedFingers(lm) {
  if (!lm || lm.length < 21) return 0;
  return Object.values(extendedFingers(lm)).filter(Boolean).length;
}

/** Classify the hand pose as ONE finger, TWO fingers, or OTHER. */
export function classifyPose(lm) {
  if (!lm || lm.length < 21) return POSE.OTHER;
  const e = extendedFingers(lm);
  if (e.index && !e.middle && !e.ring && !e.pinky) return POSE.ONE;
  if (e.index &&  e.middle && !e.ring && !e.pinky) return POSE.TWO;
  return POSE.OTHER;
}

const POSE_TO_TURN = { [POSE.ONE]: 'RIGHT', [POSE.TWO]: 'LEFT' };

/**
 * Feed one frame of landmarks. Returns 'RIGHT' | 'LEFT' | null.
 *  - A pose must be stable for TURN_STABILITY_FRAMES frames.
 *  - Fires once when a pose is newly accepted, then repeats every
 *    TURN_REPEAT_MS while it is held.
 *  - Never fires twice within TURN_MIN_GAP_MS.
 */
export function detectTurn(lm, now = Date.now()) {
  const pose = classifyPose(lm);

  if (pose === candidate) candidateRun++;
  else { candidate = pose; candidateRun = 1; }

  if (candidate === POSE.OTHER) {
    acceptedPose = null; // hand "reset" — next 1/2-finger pose fires again
    return null;
  }
  if (candidateRun < TURN_STABILITY_FRAMES) return null;
  if (now - lastFireTs < TURN_MIN_GAP_MS) return null;

  if (acceptedPose !== candidate) {
    acceptedPose = candidate;
    lastFireTs   = now;
    return POSE_TO_TURN[candidate];
  }
  if (now - lastFireTs >= TURN_REPEAT_MS) {
    lastFireTs = now;
    return POSE_TO_TURN[candidate];
  }
  return null;
}
