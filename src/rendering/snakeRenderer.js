import { CELL, GRID_COLS, GRID_ROWS, COLORS } from '../utils/constants.js';
import { cellCenter } from './boardRenderer.js';
import { lerpColor } from '../utils/helpers.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Two cells are "linked" if they touch without going across the wrap seam */
function adjacent(a, b) {
  const dc = Math.abs(a.col - b.col);
  const dr = Math.abs(a.row - b.row);
  return (dc === 1 && dr === 0) || (dc === 0 && dr === 1);
}

/** Draw the snake as smooth rounded segments */
export function drawSnake(ctx, snake, activePU = {}, reducedMotion = false) {
  const body = snake.body;
  if (!body || body.length === 0) return;

  const n    = body.length;
  const size = CELL * 0.84;
  const half = size / 2;
  const rad  = size * 0.3;

  // Tail -> head so the head ends up on top
  for (let i = n - 1; i >= 0; i--) {
    const seg  = body[i];
    const { x, y } = cellCenter(seg.col, seg.row);
    const t    = n > 1 ? i / (n - 1) : 0;           // 0 = head, 1 = tail
    const fill = i === 0 ? COLORS.SNAKE_HEAD : lerpColor('#00a8c4', '#0b4f68', t);

    ctx.save();
    ctx.fillStyle   = fill;
    ctx.shadowColor = COLORS.SNAKE_GLOW;
    ctx.shadowBlur  = reducedMotion ? 0 : (i === 0 ? 14 : 6);

    // Bridge to the next segment toward the tail (fills the gap between cells)
    const next = body[i + 1];
    if (next && adjacent(seg, next)) {
      const nc = cellCenter(next.col, next.row);
      const bx = Math.min(x, nc.x) - half;
      const by = Math.min(y, nc.y) - half;
      // Slightly narrower than a segment so each joint stays visible
      const inset = size * 0.1;
      ctx.fillRect(bx + inset, by + inset, Math.abs(x - nc.x) + size - 2 * inset, Math.abs(y - nc.y) + size - 2 * inset);
    }

    roundRect(ctx, x - half, y - half, size, size, rad);
    ctx.fill();
    ctx.restore();
  }

  _drawHead(ctx, body[0], snake.direction);

  if (activePU.shield) _drawShieldHalo(ctx, body[0]);
}

function _drawHead(ctx, head, direction) {
  const { x, y } = cellCenter(head.col, head.row);
  const fwd  = { UP: [0, -1], DOWN: [0, 1], LEFT: [-1, 0], RIGHT: [1, 0] }[direction] || [1, 0];
  const side = [-fwd[1], fwd[0]];
  const eyeR = CELL * 0.1;

  ctx.save();
  [-1, 1].forEach(s => {
    const ex = x + fwd[0] * CELL * 0.14 + side[0] * s * CELL * 0.17;
    const ey = y + fwd[1] * CELL * 0.14 + side[1] * s * CELL * 0.17;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(ex, ey, eyeR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0a0e1a';
    ctx.beginPath();
    ctx.arc(ex + fwd[0] * eyeR * 0.4, ey + fwd[1] * eyeR * 0.4, eyeR * 0.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function _drawShieldHalo(ctx, head) {
  const { x, y } = cellCenter(head.col, head.row);
  const pulse = 0.6 + 0.4 * Math.sin(performance.now() * 0.005);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = COLORS.POWERUP_SHIELD;
  ctx.lineWidth   = 3;
  ctx.shadowBlur  = 14;
  ctx.shadowColor = COLORS.POWERUP_SHIELD;
  ctx.beginPath();
  ctx.arc(x, y, CELL * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
