import {
  POWERUP_SPAWN_CHANCE, POWERUP_SPEED_DURATION,
} from '../utils/constants.js';
import { randomFreeCell, occupiedSet } from '../utils/helpers.js';

export const PU_TYPE = {
  SPEED:  'SPEED',
  SHIELD: 'SHIELD',
};

const PU_TYPES = [PU_TYPE.SPEED, PU_TYPE.SHIELD];

/**
 * Possibly spawn a power-up on the board.
 */
export function maybeSpawnPowerUp(snakeBody, existing = []) {
  if (Math.random() > POWERUP_SPAWN_CHANCE) return null;
  const occupied = occupiedSet([...snakeBody, ...existing]);
  const cell = randomFreeCell(occupied);
  if (!cell) return null;
  const type = PU_TYPES[Math.floor(Math.random() * PU_TYPES.length)];
  return { ...cell, type, animOffset: Math.random() * Math.PI * 2 };
}

/**
 * Active power-up state (effects applied to game).
 */
export function createActivePowerUps() {
  return {
    speedBoost: null,  // { startedAt, duration }
    shield:     false, // boolean — consumed on collision
  };
}

export function activatePowerUp(active, type, now) {
  if (type === PU_TYPE.SPEED) {
    active.speedBoost = { startedAt: now, duration: POWERUP_SPEED_DURATION };
  } else if (type === PU_TYPE.SHIELD) {
    active.shield = true;
  }
}

export function tickPowerUps(active, now) {
  if (active.speedBoost) {
    const elapsed = now - active.speedBoost.startedAt;
    if (elapsed >= active.speedBoost.duration) {
      active.speedBoost = null;
    }
  }
}

export function speedBoostFraction(active, now) {
  if (!active.speedBoost) return 0;
  return Math.max(0, 1 - (now - active.speedBoost.startedAt) / active.speedBoost.duration);
}

export function isSpeedBoosted(active) {
  return active.speedBoost !== null;
}

export function hasShield(active) {
  return active.shield === true;
}

export function consumeShield(active) {
  active.shield = false;
}

export function resetPowerUps(active) {
  active.speedBoost = null;
  active.shield = false;
}
