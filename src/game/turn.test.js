import { describe, it, expect } from 'vitest';
import { createSnake, turnRelative, computeNextHead } from './snake.js';
import { createScoreState, computeMoveInterval } from './scoring.js';
import { createActivePowerUps } from './powerUps.js';
import {
  BASE_MOVE_INTERVAL, MIN_MOVE_INTERVAL, SPEED_REDUCTION_PER_LEVEL,
} from '../utils/constants.js';

const withHeading = (dir) => { const s = createSnake(); s.direction = dir; s.nextDirection = dir; return s; };

describe('turnRelative', () => {
  it('RIGHT turns clockwise from every heading', () => {
    const exp = { UP: 'RIGHT', RIGHT: 'DOWN', DOWN: 'LEFT', LEFT: 'UP' };
    for (const [from, to] of Object.entries(exp)) {
      const s = withHeading(from);
      turnRelative(s, 'RIGHT');
      expect(s.dirQueue).toEqual([to]);
    }
  });

  it('LEFT turns counter-clockwise from every heading', () => {
    const exp = { UP: 'LEFT', LEFT: 'DOWN', DOWN: 'RIGHT', RIGHT: 'UP' };
    for (const [from, to] of Object.entries(exp)) {
      const s = withHeading(from);
      turnRelative(s, 'LEFT');
      expect(s.dirQueue).toEqual([to]);
    }
  });

  it('chains two turns using the last queued direction (U-turn)', () => {
    const s = withHeading('RIGHT');
    turnRelative(s, 'RIGHT'); // -> DOWN
    turnRelative(s, 'RIGHT'); // -> LEFT
    expect(s.dirQueue).toEqual(['DOWN', 'LEFT']);
  });

  it('ignores unknown turn values', () => {
    const s = withHeading('RIGHT');
    turnRelative(s, 'BANANA');
    expect(s.dirQueue).toEqual([]);
  });

  it('snake actually changes heading on the next step', () => {
    const s = withHeading('RIGHT');
    const head = { ...s.body[0] };
    turnRelative(s, 'RIGHT');
    const next = computeNextHead(s);
    expect(s.direction).toBe('DOWN');
    expect(next).toEqual({ col: head.col, row: head.row + 1 });
  });
});

describe('move interval (slower pacing)', () => {
  it('starts at the base interval', () => {
    expect(computeMoveInterval(createScoreState(), createActivePowerUps())).toBe(BASE_MOVE_INTERVAL);
    expect(BASE_MOVE_INTERVAL).toBe(260);
  });
  it('speeds up per level but never below the minimum', () => {
    const st = createScoreState();
    st.level = 3;
    expect(computeMoveInterval(st, createActivePowerUps()))
      .toBe(BASE_MOVE_INTERVAL - 2 * SPEED_REDUCTION_PER_LEVEL);
    st.level = 999;
    expect(computeMoveInterval(st, createActivePowerUps())).toBe(MIN_MOVE_INTERVAL);
  });
});
