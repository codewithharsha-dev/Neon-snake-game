import { useEffect, useRef, useCallback } from 'react';
import {
  createEngineState, tickEngine, setDirection, setTurn, resetEngine, getSnapshot,
} from '../game/gameEngine.js';
import { renderFrame } from '../rendering/renderer.js';
import {
  playEat, playBonusEat, playPowerUp, playGameOver, playLevelUp, playShield,
} from '../audio/soundManager.js';
import { GAME_STATE } from '../utils/constants.js';

/**
 * Drives the game loop; the canvas / renderer lifecycle is owned by GameCanvas.
 *
 * @param {{ gamePhase, onGameOver, onScoreUpdate, onLevelUp }} opts
 */
export function useGameLoop({ gamePhase, onGameOver, onScoreUpdate, onLevelUp }) {
  const engineRef     = useRef(null);
  const rafRef        = useRef(null);
  const phaseRef      = useRef(gamePhase);
  const cbRef         = useRef({});
  const lastStatsPush = useRef(0);

  // Keep refs current every render — prevents stale closures in the rAF tick
  phaseRef.current = gamePhase;
  cbRef.current    = { onGameOver, onScoreUpdate, onLevelUp };

  // ── Game loop ────────────────────────────────────────────────
  const startLoop = useCallback(() => {
    if (!engineRef.current) engineRef.current = createEngineState();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = (nowMs) => {
      if (phaseRef.current !== GAME_STATE.PLAYING) {
        // Keep rendering while paused / game-over so the board stays visible
        const snap = engineRef.current ? getSnapshot(engineRef.current) : null;
        if (snap) renderFrame(snap);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      tickEngine(engineRef.current, nowMs);
      const snap = getSnapshot(engineRef.current);
      renderFrame(snap);

      // ── Fire events → audio + callbacks ──
      let pushStats = false;
      snap.events.forEach(ev => {
        if (ev.type === 'EAT') {
          ev.foodType === 'bonus' ? playBonusEat() : playEat();
          pushStats = true;
        }
        if (ev.type === 'LEVEL_UP') {
          playLevelUp();
          cbRef.current.onLevelUp?.(snap.level);
          pushStats = true;
        }
        if (ev.type === 'GAME_OVER') {
          playGameOver();
          cbRef.current.onGameOver?.(snap);
        }
        if (ev.type === 'POWERUP_COLLECTED') {
          ev.puType === 'SHIELD' ? playShield() : playPowerUp();
          pushStats = true;
        }
        if (ev.type === 'SHIELD_CONSUMED') {
          playShield();
        }
      });

      // Throttle HUD refresh to ~200 ms; always flush on game events
      if (pushStats || nowMs - lastStatsPush.current > 200) {
        lastStatsPush.current = nowMs;
        cbRef.current.onScoreUpdate?.({
          score:     snap.score,
          bestScore: snap.bestScore,
          level:     snap.level,
          foodEaten: snap.foodEaten,
          elapsed:   snap.elapsed,
          activePU:  snap.activePU,
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  const newGame = useCallback((bestScore = 0) => {
    if (engineRef.current) {
      resetEngine(engineRef.current, bestScore);
    } else {
      engineRef.current = createEngineState(bestScore);
    }
  }, []);

  const queueDir = useCallback((dir) => {
    if (engineRef.current) setDirection(engineRef.current, dir);
  }, []);

  /** Relative turn from hand gestures: 'RIGHT' = clockwise, 'LEFT' = counter-clockwise */
  const queueTurn = useCallback((turn) => {
    if (engineRef.current) setTurn(engineRef.current, turn);
  }, []);

  // ── Keyboard input ──────────────────────────────────────────
  useEffect(() => {
    const keyMap = {
      ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
      w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
      W: 'UP', S: 'DOWN', A: 'LEFT', D: 'RIGHT',
    };
    const onKey = (e) => {
      const dir = keyMap[e.key];
      if (dir && phaseRef.current === GAME_STATE.PLAYING) {
        e.preventDefault();
        queueDir(dir);
      }
    };
    window.addEventListener('keydown', onKey, { passive: false });
    return () => window.removeEventListener('keydown', onKey);
  }, [queueDir]);

  // ── Cleanup on unmount ─────────────────────────────────────
  useEffect(() => () => stopLoop(), []);

  return { startLoop, stopLoop, newGame, queueDir, queueTurn };
}
