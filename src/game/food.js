import {
  BONUS_FOOD_SPAWN_CHANCE, BONUS_FOOD_LIFETIME,
} from '../utils/constants.js';
import { randomFreeCell, occupiedSet } from '../utils/helpers.js';

/**
 * Spawn a normal food item in a free cell.
 * @param {Object[]} snakeBody
 * @param {Object[]} existing  – existing food / power-up items already on the board
 * @returns {{ col, row, type:'normal', animOffset:number } | null}
 */
export function spawnNormalFood(snakeBody, existing = []) {
  const occupied = occupiedSet([...snakeBody, ...existing]);
  const cell = randomFreeCell(occupied);
  if (!cell) return null;
  return { ...cell, type: 'normal', animOffset: Math.random() * Math.PI * 2 };
}

/**
 * Potentially spawn a bonus food item (probability-based).
 */
export function maybeSpawnBonusFood(snakeBody, existing = []) {
  if (Math.random() > BONUS_FOOD_SPAWN_CHANCE) return null;
  const occupied = occupiedSet([...snakeBody, ...existing]);
  const cell = randomFreeCell(occupied);
  if (!cell) return null;
  return {
    ...cell,
    type:       'bonus',
    animOffset: Math.random() * Math.PI * 2,
    spawnedAt:  performance.now(),
    lifetime:   BONUS_FOOD_LIFETIME,
  };
}

/**
 * Remove expired bonus food items.
 * @returns {{ alive: Object[], expired: Object[] }}
 */
export function filterExpiredFood(foodItems, now) {
  const alive   = [];
  const expired = [];
  for (const f of foodItems) {
    if (f.type === 'bonus') {
      const age = now - f.spawnedAt;
      if (age >= f.lifetime) { expired.push(f); continue; }
    }
    alive.push(f);
  }
  return { alive, expired };
}

/** Bonus food fraction remaining (0→1) */
export function bonusFoodFraction(food, now) {
  if (food.type !== 'bonus') return 1;
  return Math.max(0, 1 - (now - food.spawnedAt) / food.lifetime);
}
