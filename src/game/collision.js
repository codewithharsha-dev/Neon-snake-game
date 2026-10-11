import { isOutOfBounds, collidesWithSelf } from './snake.js';

/**
 * Check all collision types for a given candidate head position.
 * Returns 'WALL' | 'SELF' | null
 * (The board wraps around, so candidates are always in bounds and 'WALL'
 *  is only kept as a safety net.)
 */
export function checkCollision(snake, candidateCol, candidateRow) {
  if (isOutOfBounds(candidateCol, candidateRow)) return 'WALL';
  if (collidesWithSelf(snake, candidateCol, candidateRow, true)) return 'SELF';
  return null;
}

/**
 * Check whether the head landed on a food item.
 * Returns the index in the foodItems array, or -1.
 */
export function checkFoodCollision(col, row, foodItems) {
  return foodItems.findIndex(f => f.col === col && f.row === row);
}

/**
 * Check whether the head landed on a power-up item.
 * Returns the index in the puItems array, or -1.
 */
export function checkPowerUpCollision(col, row, puItems) {
  return puItems.findIndex(p => p.col === col && p.row === row);
}
