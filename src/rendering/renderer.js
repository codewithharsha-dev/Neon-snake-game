import { COLORS, CELL } from '../utils/constants.js';
import { boardScreenSize, drawBoard } from './boardRenderer.js';
import { drawSnake } from './snakeRenderer.js';
import {
  drawFood, drawPowerUpItems, drawSpeedBoostTrail,
} from './effectsRenderer.js';
import {
  updateParticles, drawParticles, emitBurst, emitLevelUp, emitCollision, clearParticles,
} from './particles.js';

let canvas, ctx, logicalW, logicalH, originX, originY, _boardScale;
let _reducedMotion = false;
let lastRenderTime = 0;
let _initialized   = false;

export function initRenderer(canvasEl, reducedMotion = false) {
  canvas         = canvasEl;
  ctx            = canvas.getContext('2d', { alpha: false });
  _reducedMotion = reducedMotion;
  _initialized   = true;
  resizeRenderer();
  clearParticles();
}

export function setReducedMotion(v) { _reducedMotion = v; }

export function resizeRenderer() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  logicalW       = rect.width  || 700;
  logicalH       = rect.height || 550;
  canvas.width   = logicalW * dpr;
  canvas.height  = logicalH * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  _computeOrigin();
}

function _computeOrigin() {
  const { width: boardW, height: boardH } = boardScreenSize();
  // Fit the whole board inside the canvas (square cells, centred)
  _boardScale = Math.min(logicalW / boardW, logicalH / boardH);
  originX = (logicalW - boardW * _boardScale) / 2;
  originY = (logicalH - boardH * _boardScale) / 2;
}

export function renderFrame(snapshot) {
  if (!_initialized || !ctx) return;

  const now = performance.now();
  const dt  = now - (lastRenderTime || now);
  lastRenderTime = now;

  const { snake, food, puItems, activePU, events, status } = snapshot;

  // Process events → particles (must account for board scale)
  if (events) {
    events.forEach(ev => {
      const toScreen = ({ col, row }) => {
        return {
          sx: originX + (col + 0.5) * CELL * _boardScale,
          sy: originY + (row + 0.5) * CELL * _boardScale,
        };
      };
      if (ev.type === 'EAT') {
        const { sx, sy } = toScreen(ev);
        emitBurst(sx, sy, ev.foodType === 'bonus' ? 20 : 10);
      } else if (ev.type === 'LEVEL_UP') {
        emitLevelUp(logicalW / 2, logicalH / 2);
      } else if (ev.type === 'GAME_OVER') {
        if (ev.col !== undefined) {
          const { sx, sy } = toScreen(ev);
          emitCollision(sx, sy);
        }
      } else if (ev.type === 'POWERUP_COLLECTED') {
        const { sx, sy } = toScreen(ev);
        emitBurst(sx, sy, 15, ['#6366f1', '#a78bfa', '#f472b6']);
      }
    });
  }

  updateParticles(dt);

  // Clear
  ctx.fillStyle = COLORS.BG;
  ctx.fillRect(0, 0, logicalW, logicalH);

  // Board + game objects — drawn at board scale
  ctx.save();
  ctx.translate(originX, originY);
  ctx.scale(_boardScale, _boardScale);

  drawBoard(ctx, 0, 0);

  if (snake && activePU) {
    drawSpeedBoostTrail(ctx, snake, activePU, _reducedMotion);
  }

  if (food)    drawFood(ctx, food, _reducedMotion);
  if (puItems) drawPowerUpItems(ctx, puItems, _reducedMotion);
  if (snake)   drawSnake(ctx, snake, activePU || {}, _reducedMotion);

  ctx.restore();

  // Screen-space particles
  drawParticles(ctx);

  // Game-over vignette
  if (status === 'GAME_OVER') {
    _drawVignette(ctx, logicalW, logicalH, 'rgba(239,68,68,0.15)');
  }
}

function _drawVignette(ctx, w, h, color) {
  const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.8);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

export function cleanupRenderer() {
  clearParticles();
  _initialized = false;
  canvas = null;
  ctx    = null;
}
