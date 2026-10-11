import { COLORS } from '../utils/constants.js';

const PALETTE = [COLORS.PARTICLE_1, COLORS.PARTICLE_2, COLORS.PARTICLE_3, '#f59e0b', '#10b981'];
const MAX_PARTICLES = 200;

/** @type {Particle[]} */
let pool = [];

export function clearParticles() { pool = []; }

export function emitBurst(x, y, count = 12, palette = PALETTE) {
  for (let i = 0; i < count && pool.length < MAX_PARTICLES; i++) {
    const speed = 1.5 + Math.random() * 3;
    const angle = Math.random() * Math.PI * 2;
    pool.push({
      x, y,
      vx:    Math.cos(angle) * speed,
      vy:    Math.sin(angle) * speed,
      size:  2 + Math.random() * 3,
      color: palette[Math.floor(Math.random() * palette.length)],
      life:  1,
      decay: 0.03 + Math.random() * 0.04,
      grav:  0.06,
    });
  }
}

export function emitLevelUp(x, y) {
  emitBurst(x, y, 28, PALETTE);
}

export function emitCollision(x, y) {
  emitBurst(x, y, 20, ['#ef4444', '#f97316', '#fbbf24']);
}

export function updateParticles(dt) {
  const step = dt / 16.67;
  pool = pool.filter(p => {
    p.x    += p.vx * step;
    p.y    += p.vy * step;
    p.vy   += p.grav * step;
    p.vx   *= 0.98;
    p.life -= p.decay * step;
    return p.life > 0;
  });
}

export function drawParticles(ctx) {
  ctx.save();
  pool.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle   = p.color;
    ctx.shadowBlur  = 6;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.shadowBlur  = 0;
  ctx.restore();
}
