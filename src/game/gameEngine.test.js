import { describe, it, expect, beforeEach } from 'vitest';
import {
  createEngineState, tickEngine, setDirection, resetEngine, getSnapshot,
} from './gameEngine.js';
import {
  GRID_COLS, GRID_ROWS, INITIAL_COL, INITIAL_ROW, FOOD_PER_LEVEL,
  BASE_MOVE_INTERVAL,
} from '../utils/constants.js';

// ── Deterministic time ────────────────────────────────────
let _t = 0;
global.performance = { now: () => _t };

beforeEach(() => { _t = 0; });

/**
 * Initialise the engine's lastTickTime and advance `n` full move steps.
 * This correctly mirrors the two-phase tick pattern:
 *   tick(0) → sets lastTickTime
 *   tick(interval) → runs first _step
 */
function initAndStep(state, n = 1, interval = BASE_MOVE_INTERVAL + 5) {
  tickEngine(state, _t);              // init lastTickTime
  for (let i = 0; i < n; i++) {
    _t += interval;
    tickEngine(state, _t);
  }
}

// ── Test suites ───────────────────────────────────────────

describe('createEngineState', () => {
  it('initialises snake at correct position', () => {
    const state = createEngineState();
    const head = state.snake.body[0];
    expect(head.col).toBe(INITIAL_COL);
    expect(head.row).toBe(INITIAL_ROW);
  });

  it('starts with initial snake length', () => {
    const state = createEngineState();
    expect(state.snake.body.length).toBe(3);
  });

  it('starts with at least one food item', () => {
    const state = createEngineState();
    expect(state.food.length).toBeGreaterThanOrEqual(1);
  });

  it('food not inside snake body', () => {
    const state = createEngineState();
    const bodySet = new Set(state.snake.body.map(s => `${s.col},${s.row}`));
    state.food.forEach(f => {
      expect(bodySet.has(`${f.col},${f.row}`)).toBe(false);
    });
  });

  it('initial status is PLAYING', () => {
    const state = createEngineState();
    expect(state.status).toBe('PLAYING');
  });

  it('initial score is 0', () => {
    const state = createEngineState();
    expect(state.scoreState.score).toBe(0);
  });

  it('initial level is 1', () => {
    const state = createEngineState();
    expect(state.scoreState.level).toBe(1);
  });
});

describe('direction queuing', () => {
  it('applies valid UP direction after one step', () => {
    const state = createEngineState(); // starts RIGHT
    setDirection(state, 'UP');
    initAndStep(state, 1);
    expect(state.snake.direction).toBe('UP');
  });

  it('rejects 180-degree reversal (LEFT when moving RIGHT)', () => {
    const state = createEngineState();
    setDirection(state, 'LEFT');
    initAndStep(state, 1);
    expect(state.snake.direction).toBe('RIGHT');
  });

  it('queues at most 2 pending directions', () => {
    const state = createEngineState();
    setDirection(state, 'UP');
    setDirection(state, 'LEFT');
    setDirection(state, 'DOWN');
    expect(state.snake.dirQueue.length).toBeLessThanOrEqual(2);
  });

  it('processes queued direction on second step', () => {
    const state = createEngineState();
    setDirection(state, 'UP');
    setDirection(state, 'LEFT');
    initAndStep(state, 2);
    expect(state.snake.direction).toBe('LEFT');
  });
});

/** Put the snake in a coil so its next RIGHT move hits its own body. */
function armSelfCollision(state) {
  state.snake.body = [
    { col: 5, row: 5 }, { col: 5, row: 6 }, { col: 6, row: 6 },
    { col: 6, row: 5 }, { col: 6, row: 4 },
  ];
  state.snake.direction = 'RIGHT';
  state.snake.dirQueue  = [];
}

describe('edge wrap-around (no walls)', () => {
  it('wraps from the right edge to the left edge', () => {
    const state = createEngineState();
    state.snake.body = [
      { col: GRID_COLS - 1, row: 3 }, { col: GRID_COLS - 2, row: 3 }, { col: GRID_COLS - 3, row: 3 },
    ];
    state.food = [];
    initAndStep(state, 1);
    expect(state.status).toBe('PLAYING');
    expect(state.snake.body[0]).toEqual({ col: 0, row: 3 });
  });

  it('wraps from the left edge to the right edge', () => {
    const state = createEngineState();
    state.snake.body = [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }];
    state.snake.direction = 'LEFT';
    state.food = [];
    initAndStep(state, 1);
    expect(state.status).toBe('PLAYING');
    expect(state.snake.body[0]).toEqual({ col: GRID_COLS - 1, row: 3 });
  });

  it('wraps top -> bottom and bottom -> top', () => {
    const up = createEngineState();
    up.snake.body = [{ col: 4, row: 0 }, { col: 4, row: 1 }, { col: 4, row: 2 }];
    up.snake.direction = 'UP';
    up.food = [];
    initAndStep(up, 1);
    expect(up.status).toBe('PLAYING');
    expect(up.snake.body[0]).toEqual({ col: 4, row: GRID_ROWS - 1 });

    const down = createEngineState();
    down.snake.body = [{ col: 4, row: GRID_ROWS - 1 }, { col: 4, row: GRID_ROWS - 2 }, { col: 4, row: GRID_ROWS - 3 }];
    down.snake.direction = 'DOWN';
    down.food = [];
    initAndStep(down, 1);
    expect(down.status).toBe('PLAYING');
    expect(down.snake.body[0]).toEqual({ col: 4, row: 0 });
  });

  it('survives a full lap around the board without dying', () => {
    const state = createEngineState();
    state.food = [];
    initAndStep(state, GRID_COLS * 2);
    expect(state.status).toBe('PLAYING');
  });
});

describe('self collision', () => {
  it('ends the game when the head hits the body', () => {
    const state = createEngineState();
    armSelfCollision(state);
    initAndStep(state, 1);
    expect(state.status).toBe('GAME_OVER');
    expect(state.collidedWith).toBe('SELF');
  });
});

describe('food collection', () => {
  it('snake grows after eating food', () => {
    const state = createEngineState();
    const initialLen = state.snake.body.length;
    // Place food one step ahead (snake moves RIGHT)
    const head = state.snake.body[0];
    state.food = [{ col: head.col + 1, row: head.row, type: 'normal', animOffset: 0 }];
    // Step 1: eat the food (pendingGrowth set to 1, tail already popped this step)
    // Step 2: next move applies pendingGrowth, tail kept → snake is longer
    initAndStep(state, 2);
    expect(state.snake.body.length).toBeGreaterThan(initialLen);
  });

  it('score increases after eating normal food', () => {
    const state = createEngineState();
    const head = state.snake.body[0];
    state.food = [{ col: head.col + 1, row: head.row, type: 'normal', animOffset: 0 }];
    initAndStep(state, 1);
    expect(state.scoreState.score).toBeGreaterThan(0);
  });

  it('bonus food worth more than normal food', () => {
    // Normal food score
    const s1 = createEngineState();
    const h1 = s1.snake.body[0];
    s1.food = [{ col: h1.col + 1, row: h1.row, type: 'normal', animOffset: 0 }];
    initAndStep(s1, 1);
    const normalScore = s1.scoreState.score;

    // Bonus food score
    _t = 0; // reset time for second test
    const s2 = createEngineState();
    const h2 = s2.snake.body[0];
    s2.food = [{
      col: h2.col + 1, row: h2.row, type: 'bonus', animOffset: 0,
      spawnedAt: _t, lifetime: 20000,
    }];
    initAndStep(s2, 1);
    expect(s2.scoreState.score).toBeGreaterThan(normalScore);
  });

  it('new food spawns after eating', () => {
    const state = createEngineState();
    const head = state.snake.body[0];
    state.food = [{ col: head.col + 1, row: head.row, type: 'normal', animOffset: 0 }];
    initAndStep(state, 1);
    expect(state.food.length).toBeGreaterThanOrEqual(1);
  });

  it('food never spawns inside snake body', () => {
    const state = createEngineState();
    // Eat a few items and check food positions each time
    for (let i = 0; i < 3; i++) {
      if (state.status !== 'PLAYING') break;
      const head = state.snake.body[0];
      state.food = [{ col: head.col + 1, row: head.row, type: 'normal', animOffset: 0 }];
      _t += BASE_MOVE_INTERVAL + 10; tickEngine(state, _t);
      const bodySet = new Set(state.snake.body.map(s => `${s.col},${s.row}`));
      state.food.forEach(f => {
        expect(bodySet.has(`${f.col},${f.row}`)).toBe(false);
      });
    }
  });
});

describe('level progression', () => {
  it('level increases after FOOD_PER_LEVEL normal food items', () => {
    const state = createEngineState();
    tickEngine(state, _t); // init
    for (let i = 0; i < FOOD_PER_LEVEL; i++) {
      if (state.status !== 'PLAYING') break;
      const head = state.snake.body[0];
      state.food = [{ col: head.col + 1, row: head.row, type: 'normal', animOffset: 0 }];
      _t += BASE_MOVE_INTERVAL + 10; tickEngine(state, _t);
    }
    expect(state.scoreState.level).toBeGreaterThan(1);
  });
});

describe('resetEngine', () => {
  it('resets score to 0', () => {
    const state = createEngineState();
    const head = state.snake.body[0];
    state.food = [{ col: head.col + 1, row: head.row, type: 'normal', animOffset: 0 }];
    initAndStep(state, 1);
    expect(state.scoreState.score).toBeGreaterThan(0);

    resetEngine(state);
    expect(state.scoreState.score).toBe(0);
  });

  it('resets status to PLAYING', () => {
    const state = createEngineState();
    armSelfCollision(state);
    initAndStep(state, 1); // trigger game over
    expect(state.status).toBe('GAME_OVER');
    resetEngine(state);
    expect(state.status).toBe('PLAYING');
  });

  it('resets food eaten counter', () => {
    const state = createEngineState();
    const head = state.snake.body[0];
    state.food = [{ col: head.col + 1, row: head.row, type: 'normal', animOffset: 0 }];
    initAndStep(state, 1);
    expect(state.scoreState.foodEaten).toBe(1);
    resetEngine(state);
    expect(state.scoreState.foodEaten).toBe(0);
  });
});

describe('power-up: shield', () => {
  it('shield is consumed on collision', () => {
    const state = createEngineState();
    state.activePU.shield = true;
    armSelfCollision(state);
    initAndStep(state, 1); // would be a self-collision
    expect(state.activePU.shield).toBeFalsy();   // shield absorbed the hit
    expect(state.status).toBe('PLAYING');
  });
});

describe('getSnapshot', () => {
  it('snapshot contains all required fields', () => {
    const state = createEngineState();
    const snap  = getSnapshot(state);
    expect(snap).toHaveProperty('snake');
    expect(snap).toHaveProperty('food');
    expect(snap).toHaveProperty('puItems');
    expect(snap).toHaveProperty('score');
    expect(snap).toHaveProperty('bestScore');
    expect(snap).toHaveProperty('level');
    expect(snap).toHaveProperty('foodEaten');
    expect(snap).toHaveProperty('elapsed');
    expect(snap).toHaveProperty('status');
    expect(snap).toHaveProperty('events');
  });

  it('snapshot score matches engine state', () => {
    const state = createEngineState();
    const head  = state.snake.body[0];
    state.food  = [{ col: head.col + 1, row: head.row, type: 'normal', animOffset: 0 }];
    initAndStep(state, 1);
    const snap = getSnapshot(state);
    expect(snap.score).toBe(state.scoreState.score);
  });
});

describe('state machine', () => {
  it('tickEngine returns false after game over', () => {
    const state = createEngineState();
    armSelfCollision(state);
    initAndStep(state, 1);
    expect(state.status).toBe('GAME_OVER');
    const result = tickEngine(state, _t + 100);
    expect(result).toBe(false);
  });
});
