/**
 * Pure game engine — no React, no DOM, no Canvas.
 * All state lives in a single mutable object; callers drive the tick.
 */
import {
  createSnake, queueDirection, turnRelative, computeNextHead, applyMove, growSnake, resetSnake,
} from './snake.js';
import {
  spawnNormalFood, maybeSpawnBonusFood, filterExpiredFood,
} from './food.js';
import {
  maybeSpawnPowerUp, createActivePowerUps, activatePowerUp,
  tickPowerUps, consumeShield, hasShield, resetPowerUps,
  PU_TYPE,
} from './powerUps.js';
import {
  createScoreState, scoreFood, finalizeScore, computeMoveInterval,
} from './scoring.js';
import {
  checkCollision, checkFoodCollision, checkPowerUpCollision,
} from './collision.js';

/** Create a fresh engine state, optionally seeding the persisted bestScore. */
export function createEngineState(bestScore = 0) {
  const snake      = createSnake();
  const scoreState = createScoreState(bestScore);
  const activePU   = createActivePowerUps();
  const food       = [];
  const puItems    = [];

  scoreState.startTime = performance.now();

  // Spawn initial food
  const firstFood = spawnNormalFood(snake.body, []);
  if (firstFood) food.push(firstFood);

  return {
    snake,
    food,
    puItems,
    activePU,
    scoreState,
    status:       'PLAYING', // 'PLAYING' | 'GAME_OVER'
    lastTickTime: null,
    accumulator:  0,
    events:       [],        // fired this tick: [{type, ...data}]
    collidedWith: null,
    levelJustUp:  false,
    dirtyFlags:   { scoreChanged: false },
  };
}

/**
 * Main update function — call from a rAF loop.
 * Returns false when the game is over.
 */
export function tickEngine(state, nowMs) {
  if (state.status !== 'PLAYING') return false;

  state.events = [];
  state.levelJustUp = false;
  state.dirtyFlags.scoreChanged = false;

  if (state.lastTickTime === null) {
    state.lastTickTime = nowMs;
    return true;
  }

  // Cap catch-up after a stall (e.g. background tab) to at most 2 move intervals,
  // so a slow frame can never make the snake lurch several cells at once.
  const maxDt = computeMoveInterval(state.scoreState, state.activePU) * 2;
  const dt = Math.min(nowMs - state.lastTickTime, maxDt);
  state.lastTickTime = nowMs;
  state.scoreState.elapsed = nowMs - state.scoreState.startTime;

  // Expire bonus food
  const { alive, expired } = filterExpiredFood(state.food, nowMs);
  expired.forEach(f => state.events.push({ type: 'FOOD_EXPIRED', col: f.col, row: f.row }));
  state.food = alive;

  // Tick power-ups
  tickPowerUps(state.activePU, nowMs);

  // Fixed-timestep game logic
  const interval = computeMoveInterval(state.scoreState, state.activePU);
  state.accumulator += dt;

  let stepped = false;
  while (state.accumulator >= interval) {
    state.accumulator -= interval;
    stepped = true;
    _step(state, nowMs);
    if (state.status !== 'PLAYING') break;
  }

  state.interpolation = Math.min(1, state.accumulator / interval);

  return state.status === 'PLAYING';
}

function _step(state, nowMs) {
  const { snake, food, puItems, activePU, scoreState } = state;
  const allBoardItems = [...food, ...puItems];

  const nextHead = computeNextHead(snake);
  const collision = checkCollision(snake, nextHead.col, nextHead.row);

  if (collision) {
    if (collision === 'WALL' || collision === 'SELF') {
      if (hasShield(activePU)) {
        consumeShield(activePU);
        state.events.push({ type: 'SHIELD_CONSUMED', collision });
        // Don't move — just block the step
        return;
      }
      // Game over
      state.status = 'GAME_OVER';
      state.collidedWith = collision;
      finalizeScore(scoreState);
      state.events.push({ type: 'GAME_OVER', collision, col: nextHead.col, row: nextHead.row });
      return;
    }
  }

  // Apply movement
  applyMove(snake, nextHead);

  // Food collision
  const fi = checkFoodCollision(nextHead.col, nextHead.row, food);
  if (fi !== -1) {
    const eaten = food.splice(fi, 1)[0];
    growSnake(snake, 1);

    const { pts, didLevelUp } = scoreFood(scoreState, eaten.type);
    state.dirtyFlags.scoreChanged = true;
    state.events.push({ type: 'EAT', col: nextHead.col, row: nextHead.row, foodType: eaten.type, pts });

    if (didLevelUp) {
      state.levelJustUp = true;
      state.events.push({ type: 'LEVEL_UP', level: scoreState.level });
    }

    // Spawn replacement food
    const newOccupied = [...snake.body, ...food, ...puItems];
    const newFood = spawnNormalFood(newOccupied, []);
    if (newFood) food.push(newFood);

    // Maybe spawn bonus food
    const bonus = maybeSpawnBonusFood([...snake.body], [...food, ...puItems]);
    if (bonus) food.push(bonus);

    // Maybe spawn power-up
    const pu = maybeSpawnPowerUp([...snake.body], [...food, ...puItems]);
    if (pu) puItems.push(pu);
  }

  // Power-up collision
  const pi = checkPowerUpCollision(nextHead.col, nextHead.row, puItems);
  if (pi !== -1) {
    const picked = puItems.splice(pi, 1)[0];
    activatePowerUp(activePU, picked.type, nowMs);
    state.events.push({ type: 'POWERUP_COLLECTED', puType: picked.type, col: nextHead.col, row: nextHead.row });
    state.dirtyFlags.scoreChanged = true;
  }
}

/** Queue a direction change */
export function setDirection(state, dir) {
  if (state.status !== 'PLAYING') return;
  queueDirection(state.snake, dir);
}

/** Queue a relative turn: 'RIGHT' = clockwise, 'LEFT' = counter-clockwise */
export function setTurn(state, turn) {
  if (state.status !== 'PLAYING') return;
  turnRelative(state.snake, turn);
}

/** Full reset for a new game, preserving the running best score and game count. */
export function resetEngine(state, bestScore = 0) {
  const oldBest  = Math.max(state.scoreState.bestScore, bestScore);
  const oldGames = state.scoreState.totalGames;
  const fresh    = createEngineState(oldBest);
  Object.assign(state, fresh);
  state.scoreState.totalGames = oldGames;
}

export function getSnapshot(state) {
  return {
    snake:        state.snake,
    food:         state.food,
    puItems:      state.puItems,
    activePU:     state.activePU,
    score:        state.scoreState.score,
    bestScore:    state.scoreState.bestScore,
    level:        state.scoreState.level,
    foodEaten:    state.scoreState.foodEaten,
    elapsed:      state.scoreState.elapsed,
    totalGames:   state.scoreState.totalGames,
    status:       state.status,
    collidedWith: state.collidedWith,
    events:       state.events,
    interpolation: state.interpolation ?? 0,
    levelJustUp:  state.levelJustUp,
  };
}
