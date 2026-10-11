import {
  GRID_COLS, GRID_ROWS, INITIAL_LENGTH, INITIAL_DIR,
  INITIAL_COL, INITIAL_ROW, DIRECTIONS, OPPOSITE,
} from '../utils/constants.js';

/**
 * Creates the initial snake state.
 * @returns {{ body: {col,row}[], direction: string, nextDirection: string, pendingGrowth: number }}
 */
export function createSnake() {
  const body = [];
  for (let i = 0; i < INITIAL_LENGTH; i++) {
    body.push({ col: INITIAL_COL - i, row: INITIAL_ROW });
  }
  return {
    body,
    direction:     INITIAL_DIR,
    nextDirection: INITIAL_DIR,
    pendingGrowth: 0,
    dirQueue:      [],
  };
}

/**
 * Queue a direction change, validating against the current and previously-queued direction.
 */
export function queueDirection(snake, newDir) {
  const effectiveCurrent =
    snake.dirQueue.length > 0
      ? snake.dirQueue[snake.dirQueue.length - 1]
      : snake.direction;

  if (newDir === effectiveCurrent) return;
  if (newDir === OPPOSITE[effectiveCurrent]) return;

  // Allow at most 1 queued direction ahead
  if (snake.dirQueue.length < 2) {
    snake.dirQueue.push(newDir);
  } else {
    snake.dirQueue[1] = newDir; // replace pending
  }
}

const CLOCKWISE = ['UP', 'RIGHT', 'DOWN', 'LEFT'];

/**
 * Turn relative to the snake's current heading.
 * 'RIGHT' = clockwise, 'LEFT' = counter-clockwise.
 * Uses the last queued direction so chained turns compose correctly.
 */
export function turnRelative(snake, turn) {
  const current =
    snake.dirQueue.length > 0
      ? snake.dirQueue[snake.dirQueue.length - 1]
      : snake.direction;
  const i = CLOCKWISE.indexOf(current);
  if (i === -1) return;
  const step = turn === 'RIGHT' ? 1 : turn === 'LEFT' ? -1 : 0;
  if (step === 0) return;
  queueDirection(snake, CLOCKWISE[(i + step + 4) % 4]);
}

/**
 * Advance the snake by one grid step.
 * Returns the new head position (used for collision checks BEFORE applying move).
 */
export function computeNextHead(snake) {
  if (snake.dirQueue.length > 0) {
    const candidate = snake.dirQueue[0];
    if (candidate !== OPPOSITE[snake.direction]) {
      snake.direction = candidate;
    }
    snake.dirQueue.shift();
  }

  const head  = snake.body[0];
  const delta = DIRECTIONS[snake.direction];
  // No walls: leaving one edge re-enters from the opposite edge.
  return {
    col: (head.col + delta.dc + GRID_COLS) % GRID_COLS,
    row: (head.row + delta.dr + GRID_ROWS) % GRID_ROWS,
  };
}

/**
 * Apply a valid move: add new head, optionally grow, return removed tail (for effects).
 */
export function applyMove(snake, newHead) {
  snake.body.unshift(newHead);
  let removedTail = null;

  if (snake.pendingGrowth > 0) {
    snake.pendingGrowth--;
  } else {
    removedTail = snake.body.pop();
  }

  return removedTail;
}

/** Mark the snake to grow by n segments on future ticks */
export function growSnake(snake, n = 1) {
  snake.pendingGrowth += n;
}

/** Reset snake to initial state */
export function resetSnake() {
  return createSnake();
}

/** Is (col, row) inside the grid? */
export function isOutOfBounds(col, row) {
  return col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS;
}

/** Does (col, row) collide with the snake body (excluding the very tail if not growing)?
 *  Pass skipTail=true when checking the next tick before growth is applied. */
export function collidesWithSelf(snake, col, row, skipTail = true) {
  const limit = skipTail && snake.pendingGrowth === 0
    ? snake.body.length - 1
    : snake.body.length;
  for (let i = 0; i < limit; i++) {
    if (snake.body[i].col === col && snake.body[i].row === row) return true;
  }
  return false;
}

/** Get the head position */
export const getHead = (snake) => snake.body[0];
