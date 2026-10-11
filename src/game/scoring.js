import {
  SCORE_NORMAL_FOOD, SCORE_BONUS_FOOD,
  FOOD_PER_LEVEL, BASE_MOVE_INTERVAL,
  SPEED_REDUCTION_PER_LEVEL, MIN_MOVE_INTERVAL,
  SPEED_BOOST_FACTOR,
} from '../utils/constants.js';
import { isSpeedBoosted } from './powerUps.js';

export function createScoreState(bestScore = 0) {
  return {
    score:      0,
    bestScore,
    foodEaten:  0,
    level:      1,
    totalGames: 0,
    startTime:  0,
    elapsed:    0,
  };
}

export function scoreFood(state, foodType) {
  const pts = foodType === 'bonus' ? SCORE_BONUS_FOOD : SCORE_NORMAL_FOOD;
  state.score += pts;
  if (foodType !== 'bonus') {
    state.foodEaten++;
    // Level up every N normal food items
    const newLevel = Math.floor(state.foodEaten / FOOD_PER_LEVEL) + 1;
    const didLevelUp = newLevel > state.level;
    state.level = newLevel;
    return { pts, didLevelUp };
  }
  return { pts, didLevelUp: false };
}

export function finalizeScore(state) {
  if (state.score > state.bestScore) state.bestScore = state.score;
  state.totalGames++;
}

export function computeMoveInterval(state, activePowerUps) {
  const base = Math.max(
    MIN_MOVE_INTERVAL,
    BASE_MOVE_INTERVAL - (state.level - 1) * SPEED_REDUCTION_PER_LEVEL,
  );
  if (isSpeedBoosted(activePowerUps)) return Math.round(base * SPEED_BOOST_FACTOR);
  return base;
}
