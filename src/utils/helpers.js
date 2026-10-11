import { GRID_COLS, GRID_ROWS } from './constants.js';

/** Clamp value between min and max */
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Linear interpolation */
export const lerp = (a, b, t) => a + (b - a) * t;

/** Format milliseconds as M:SS */
export function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Format large numbers with commas */
export function formatScore(n) {
  return n.toLocaleString();
}

/** Pick a random integer in [lo, hi) */
export const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo));

/** Pick random element from array */
export const pick = (arr) => arr[randInt(0, arr.length)];

/** Deep clone a plain object (no functions) */
export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

/** Hex colour → {r,g,b} */
export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

/** Interpolate between two hex colours by factor t (0-1) */
export function lerpColor(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(lerp(a.r, b.r, t));
  const g = Math.round(lerp(a.g, b.g, t));
  const bl = Math.round(lerp(a.b, b.b, t));
  return `rgb(${r},${g},${bl})`;
}

/** Is (col, row) inside the grid? */
export const inBounds = (col, row) =>
  col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS;

/** Set of occupied cells from an array of {col,row} segments */
export function occupiedSet(segments) {
  return new Set(segments.map(s => `${s.col},${s.row}`));
}

/** Find a random free cell not in the occupied set */
export function randomFreeCell(occupied) {
  const free = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (!occupied.has(`${c},${r}`)) free.push({ col: c, row: r });
    }
  }
  if (free.length === 0) return null;
  return pick(free);
}

/** Merge localStorage value with defaults, handling corrupt JSON */
export function safeLoadStorage(key, defaults) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw);
    // Validate: must be a plain object
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { ...defaults };
    }
    return { ...defaults, ...parsed };
  } catch {
    return { ...defaults };
  }
}

export function safeSaveStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/** Moving-average smoother for numeric values */
export class MovingAverage {
  constructor(windowSize = 5) {
    this.buf = [];
    this.win = windowSize;
  }
  push(v) {
    this.buf.push(v);
    if (this.buf.length > this.win) this.buf.shift();
  }
  get value() {
    return this.buf.reduce((a, b) => a + b, 0) / (this.buf.length || 1);
  }
  reset() { this.buf = []; }
}

/** 2-D vector helpers */
export const vec2 = {
  sub:  (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
  mag:  (v)    => Math.sqrt(v.x * v.x + v.y * v.y),
  norm: (v)    => { const m = vec2.mag(v); return m > 0 ? { x: v.x / m, y: v.y / m } : { x: 0, y: 0 }; },
  dot:  (a, b) => a.x * b.x + a.y * b.y,
};
