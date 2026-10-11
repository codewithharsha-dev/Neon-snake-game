import { CELL, COLORS } from '../utils/constants.js';
import { cellCenter } from './boardRenderer.js';
import { bonusFoodFraction } from '../game/food.js';
import { speedBoostFraction } from '../game/powerUps.js';

const now = () => performance.now();

/** Draw food items */
export function drawFood(ctx, foodItems, reducedMotion = false) {
  foodItems.forEach(f => {
    const { x, y } = cellCenter(f.col, f.row);
    const cy = y;

    if (f.type === 'bonus') {
      _drawBonusFood(ctx, x, cy, f, reducedMotion);
    } else {
      _drawNormalFood(ctx, x, cy, f, reducedMotion);
    }
  });
}

function _drawNormalFood(ctx, x, y, food, reducedMotion) {
  const t   = now() * 0.003;
  const bob = reducedMotion ? 0 : Math.sin(t + food.animOffset) * 3;
  const cy  = y + bob;
  const r   = CELL * 0.3;

  ctx.save();
  ctx.shadowBlur  = reducedMotion ? 6 : 14;
  ctx.shadowColor = COLORS.FOOD_GLOW_N;
  ctx.fillStyle   = COLORS.FOOD_NORMAL;
  ctx.beginPath();
  ctx.arc(x, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.shadowBlur  = 0;
  ctx.fillStyle   = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, cy - r * 0.3, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function _drawBonusFood(ctx, x, y, food, reducedMotion) {
  const frac = bonusFoodFraction(food, now());
  const t    = now() * 0.004;
  const bob  = reducedMotion ? 0 : Math.sin(t + food.animOffset) * 4;
  const cy   = y + bob;
  const r    = CELL * 0.4 * (0.8 + 0.2 * Math.sin(t * 3));

  ctx.save();
  ctx.globalAlpha = 0.4 + frac * 0.6;
  ctx.shadowBlur  = reducedMotion ? 8 : 20;
  ctx.shadowColor = COLORS.FOOD_GLOW_B;
  ctx.fillStyle   = COLORS.FOOD_BONUS;

  // Star shape
  _drawStar(ctx, x, cy, r, r * 0.45, 5);
  ctx.fill();

  ctx.shadowBlur  = 0;
  ctx.fillStyle   = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.arc(x - r * 0.25, cy - r * 0.25, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function _drawStar(ctx, cx, cy, outerR, innerR, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** Draw power-up items on the board */
export function drawPowerUpItems(ctx, puItems, reducedMotion = false) {
  puItems.forEach(p => {
    const { x, y } = cellCenter(p.col, p.row);
    const cy  = y;
    const t   = now() * 0.003;
    const bob = reducedMotion ? 0 : Math.sin(t * 1.5 + p.animOffset) * 3;
    const r   = CELL * 0.34;
    const col = p.type === 'SPEED' ? COLORS.POWERUP_SPEED : COLORS.POWERUP_SHIELD;

    ctx.save();
    ctx.shadowBlur  = reducedMotion ? 6 : 16;
    ctx.shadowColor = col;
    ctx.fillStyle   = col;
    // Pentagon
    _drawPolygon(ctx, x, cy + bob, r, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `bold ${Math.floor(r * 1.4)}px sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.type === 'SPEED' ? '⚡' : '🛡', x, cy + bob);
    ctx.restore();
  });
}

function _drawPolygon(ctx, cx, cy, r, sides) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
    i === 0 ? ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
            : ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
}

/** Speed boost trail overlay */
export function drawSpeedBoostTrail(ctx, snake, activePU, reducedMotion = false) {
  if (!activePU.speedBoost || reducedMotion) return;
  const frac = speedBoostFraction(activePU, now());
  if (frac < 0.05) return;

  ctx.save();
  ctx.globalAlpha = frac * 0.5;
  const tailLen = Math.min(6, snake.body.length);
  for (let i = 1; i < tailLen; i++) {
    const { x, y } = cellCenter(snake.body[i].col, snake.body[i].row);
    const alpha = (1 - i / tailLen);
    ctx.fillStyle   = COLORS.POWERUP_SPEED;
    ctx.shadowBlur  = 10;
    ctx.shadowColor = COLORS.POWERUP_SPEED;
    ctx.globalAlpha = frac * 0.3 * alpha;
    ctx.beginPath();
    ctx.arc(x, y, CELL * 0.45 * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Background drifting particles (ambient) */
const bgParticles = Array.from({ length: 30 }, () => ({
  x: Math.random(), y: Math.random(),
  vx: (Math.random() - 0.5) * 0.15,
  vy: -0.1 - Math.random() * 0.2,
  alpha: 0.1 + Math.random() * 0.25,
  size: 0.5 + Math.random() * 1.5,
}));

export function drawBgParticles(ctx, w, h, reducedMotion = false) {
  if (reducedMotion) return;
  ctx.save();
  bgParticles.forEach(p => {
    p.x += p.vx / 60;
    p.y += p.vy / 60;
    if (p.y < 0)  p.y = 1;
    if (p.x < 0)  p.x = 1;
    if (p.x > 1)  p.x = 0;

    ctx.globalAlpha = p.alpha;
    ctx.fillStyle   = '#00f5ff';
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}
