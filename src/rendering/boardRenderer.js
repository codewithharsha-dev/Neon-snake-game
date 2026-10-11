import { GRID_COLS, GRID_ROWS, CELL, COLORS } from '../utils/constants.js';

/**
 * Flat top-down board. There are NO walls: the snake wraps around, so the
 * play-field is drawn edge-to-edge with no border.
 */

/** Centre of a grid cell in board units */
export function cellCenter(col, row) {
  return { x: (col + 0.5) * CELL, y: (row + 0.5) * CELL };
}

/** Board size in board units */
export function boardScreenSize() {
  return { width: GRID_COLS * CELL, height: GRID_ROWS * CELL };
}

/** Draw the checkerboard floor with a very faint grid */
export function drawBoard(ctx) {
  const { width, height } = boardScreenSize();

  ctx.fillStyle = COLORS.TILE_EVEN;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = COLORS.TILE_ODD;
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if ((col + row) % 2 === 1) ctx.fillRect(col * CELL, row * CELL, CELL, CELL);
    }
  }

  // Faint grid lines (interior only — no outer border)
  ctx.strokeStyle = COLORS.TILE_EDGE;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  for (let c = 1; c < GRID_COLS; c++) { ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, height); }
  for (let r = 1; r < GRID_ROWS; r++) { ctx.moveTo(0, r * CELL); ctx.lineTo(width, r * CELL); }
  ctx.stroke();
  ctx.globalAlpha = 1;
}
