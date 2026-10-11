import { describe, it, expect, beforeEach } from 'vitest';
import {
  classifyPose, countExtendedFingers, detectTurn, resetFingerCommand, POSE,
} from './fingerCommand.js';
import { TURN_STABILITY_FRAMES, TURN_REPEAT_MS } from '../utils/constants.js';

// Build 21 synthetic landmarks. Wrist at origin; PIPs 0.2 away, extended tips 0.4, curled tips 0.1.
function hand({ index = false, middle = false, ring = false, pinky = false }) {
  const lm = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
  const set = (pip, tip, ext, x) => {
    lm[pip] = { x, y: -0.2, z: 0 };
    lm[tip] = { x, y: ext ? -0.4 : -0.1, z: 0 };
  };
  set(6, 8, index, -0.1);
  set(10, 12, middle, -0.03);
  set(14, 16, ring, 0.03);
  set(18, 20, pinky, 0.1);
  return lm;
}

describe('classifyPose', () => {
  it('1 finger (index only) -> ONE', () => {
    expect(classifyPose(hand({ index: true }))).toBe(POSE.ONE);
    expect(countExtendedFingers(hand({ index: true }))).toBe(1);
  });
  it('2 fingers (index + middle) -> TWO', () => {
    expect(classifyPose(hand({ index: true, middle: true }))).toBe(POSE.TWO);
  });
  it('open palm and fist are OTHER', () => {
    expect(classifyPose(hand({ index: true, middle: true, ring: true, pinky: true }))).toBe(POSE.OTHER);
    expect(classifyPose(hand({}))).toBe(POSE.OTHER);
  });
  it('3 fingers and middle-only are OTHER', () => {
    expect(classifyPose(hand({ index: true, middle: true, ring: true }))).toBe(POSE.OTHER);
    expect(classifyPose(hand({ middle: true }))).toBe(POSE.OTHER);
  });
  it('handles missing landmarks safely', () => {
    expect(classifyPose(null)).toBe(POSE.OTHER);
    expect(classifyPose([])).toBe(POSE.OTHER);
  });
});

describe('detectTurn', () => {
  beforeEach(() => resetFingerCommand());
  const feed = (lm, n, t0 = 1000, dt = 33) => {
    const out = [];
    for (let i = 0; i < n; i++) out.push(detectTurn(lm, t0 + i * dt));
    return out;
  };

  it('needs the pose to be stable before firing', () => {
    const r = feed(hand({ index: true }), TURN_STABILITY_FRAMES - 1);
    expect(r.every(x => x === null)).toBe(true);
  });

  it('1 finger fires RIGHT exactly once while held (before repeat time)', () => {
    const r = feed(hand({ index: true }), 20); // ~660 ms < repeat
    expect(r.filter(Boolean)).toEqual(['RIGHT']);
  });

  it('2 fingers fire LEFT', () => {
    const r = feed(hand({ index: true, middle: true }), 10);
    expect(r.filter(Boolean)).toEqual(['LEFT']);
  });

  it('repeats while held after TURN_REPEAT_MS', () => {
    const lm = hand({ index: true });
    const first = feed(lm, TURN_STABILITY_FRAMES, 1000);
    expect(first.filter(Boolean)).toEqual(['RIGHT']);
    const later = detectTurn(lm, 1000 + TURN_REPEAT_MS + 400);
    expect(later).toBe('RIGHT');
  });

  it('fist in between resets so the same pose fires again', () => {
    const one = hand({ index: true });
    feed(one, 8, 1000);
    feed(hand({}), 3, 1300);
    const r = feed(one, 8, 2000);
    expect(r.filter(Boolean)).toEqual(['RIGHT']);
  });

  it('open palm never produces a turn', () => {
    const r = feed(hand({ index: true, middle: true, ring: true, pinky: true }), 30);
    expect(r.every(x => x === null)).toBe(true);
  });
});
