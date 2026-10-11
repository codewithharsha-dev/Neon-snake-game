import { useState, useRef, useEffect, useCallback } from 'react';

import { GAME_STATE, GESTURE } from './utils/constants.js';
import { usePersistentSettings } from './hooks/usePersistentSettings.js';
import { useHandTracking } from './hooks/useHandTracking.js';
import { useGameLoop } from './hooks/useGameLoop.js';
import { unlockAudio, playPause, playResume, playClick } from './audio/soundManager.js';

import { GameCanvas }     from './components/GameCanvas.jsx';
import { WebcamPanel }    from './components/WebcamPanel.jsx';
import { GameHUD }        from './components/GameHUD.jsx';
import { MainMenu }       from './components/MainMenu.jsx';
import { PauseOverlay }   from './components/PauseOverlay.jsx';
import { GameOverScreen } from './components/GameOverScreen.jsx';
import { GestureGuide }   from './components/GestureGuide.jsx';
import { SettingsPanel }  from './components/SettingsPanel.jsx';

import './styles/global.css';
import './styles/game.css';
import './styles/overlays.css';

export default function App() {
  const { settings, scores, updateSetting, updateScore, resetScores } = usePersistentSettings();

  const [phase, setPhase]         = useState(GAME_STATE.MENU);
  const [gameStats, setGameStats] = useState({
    score: 0, bestScore: 0, level: 1, foodEaten: 0, elapsed: 0, activePU: {},
  });
  const [lastSnap, setLastSnap]   = useState(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showSettings, setSettings] = useState(false);
  const [levelBanner, setLevelBanner] = useState(null);

  const canvasRef  = useRef(null);
  const phaseRef   = useRef(phase);
  phaseRef.current = phase;

  // Stable refs so callbacks defined before gameLoop can still call the latest version
  const queueTurnRef = useRef(null);
  const actionsRef   = useRef({});

  // ── Hand tracking ──────────────────────────────────────────
  // 1 finger = turn right (clockwise), 2 fingers = turn left (counter-clockwise)
  const handleTurn = useCallback((turn) => {
    if (phaseRef.current === GAME_STATE.PLAYING) {
      queueTurnRef.current?.(turn);
    }
  }, []);

  const handleGesture = useCallback((gesture) => {
    const p = phaseRef.current;
    if (gesture === GESTURE.OPEN_PALM) {
      if (p === GAME_STATE.PLAYING) { playPause();  setPhase(GAME_STATE.PAUSED); }
      else if (p === GAME_STATE.PAUSED) { playResume(); setPhase(GAME_STATE.PLAYING); }
    }
    if (gesture === GESTURE.THUMBS_UP) {
      // Restart from either paused or game-over
      if (p === GAME_STATE.GAME_OVER || p === GAME_STATE.PAUSED) {
        actionsRef.current.restartGame?.();
      }
    }
  }, []);

  const handTracking = useHandTracking({
    onTurn:        handleTurn,
    onGesture:     handleGesture,
    showLandmarks: settings.showLandmarks,
  });

  // ── Game loop ──────────────────────────────────────────────
  const gameLoop = useGameLoop({
    gamePhase: phase,
    onScoreUpdate: ({ score, bestScore, level, foodEaten, elapsed, activePU }) => {
      setGameStats(prev => ({
        ...prev, score, bestScore, level, foodEaten, elapsed,
        activePU: activePU || {},
      }));
    },
    onLevelUp: (level) => {
      setLevelBanner(level);
      setTimeout(() => setLevelBanner(null), 1400);
    },
    onGameOver: (snap) => {
      setLastSnap(snap);
      setIsNewBest(snap.score > scores.bestScore);
      updateScore(snap.score);
      setPhase(GAME_STATE.GAME_OVER);
    },
  });

  // Wire the stable queueTurn ref now that gameLoop is defined
  queueTurnRef.current = gameLoop.queueTurn;

  // ── Actions ───────────────────────────────────────────────
  const _startNewGame = () => {
    unlockAudio();
    gameLoop.newGame(scores.bestScore);
    setGameStats({ score: 0, bestScore: scores.bestScore, level: 1, foodEaten: 0, elapsed: 0, activePU: {} });
    setLastSnap(null);
    setPhase(GAME_STATE.PLAYING);
    gameLoop.startLoop();
  };

  const _restartGame = () => {
    unlockAudio();
    gameLoop.newGame(scores.bestScore);
    setGameStats({ score: 0, bestScore: scores.bestScore, level: 1, foodEaten: 0, elapsed: 0, activePU: {} });
    setPhase(GAME_STATE.PLAYING);
    gameLoop.startLoop();
  };

  const _goToMenu = () => {
    gameLoop.stopLoop();
    setPhase(GAME_STATE.MENU);
  };

  const _openCameraSetup = () => {
    playClick();
    handTracking.start();
    _startNewGame();
  };

  // Keep actionsRef current every render so handleGesture always calls the latest version
  actionsRef.current = { startNewGame: _startNewGame, restartGame: _restartGame };

  // ── Fullscreen ────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    try {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    } catch { /* fullscreen not available */ }
  }, []);

  // ── Keyboard: space = pause, F = fullscreen ───────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        toggleFullscreen();
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (phaseRef.current === GAME_STATE.PLAYING)      { playPause();  setPhase(GAME_STATE.PAUSED); }
        else if (phaseRef.current === GAME_STATE.PAUSED)  { playResume(); setPhase(GAME_STATE.PLAYING); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleFullscreen]);

  // ── Phase transitions ─────────────────────────────────────
  useEffect(() => {
    if (phase === GAME_STATE.PLAYING) gameLoop.startLoop();
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const isInGame = phase === GAME_STATE.PLAYING
    || phase === GAME_STATE.PAUSED
    || phase === GAME_STATE.GAME_OVER;

  return (
    <div className="app-shell">

      {/* ── Main Menu ── */}
      {phase === GAME_STATE.MENU && (
        <MainMenu
          bestScore={scores.bestScore}
          totalGames={scores.totalGames}
          onPlay={_openCameraSetup}
          onSettings={() => setSettings(true)}
          onHowToPlay={() => setShowGuide(true)}
        />
      )}

      {/* ── In-game layout ── */}
      {isInGame && (
        <div className="game-layout">
          <GameHUD
            score={gameStats.score}
            bestScore={gameStats.bestScore}
            level={gameStats.level}
            foodEaten={gameStats.foodEaten}
            elapsed={gameStats.elapsed}
            activePU={gameStats.activePU}
            soundEnabled={settings.soundEnabled}
            onToggleSound={() => updateSetting('soundEnabled', !settings.soundEnabled)}
            onPause={() => { playPause(); setPhase(GAME_STATE.PAUSED); }}
            onToggleFullscreen={toggleFullscreen}
          />

          <div className="game-main-row">
            <GameCanvas
              canvasRef={canvasRef}
              reducedMotion={settings.reducedMotion}
            />

            <div className="webcam-sidebar">
              <WebcamPanel
                {...handTracking}
                showLandmarks={settings.showLandmarks}
                mirrorPreview={settings.mirrorPreview}
                onStart={handTracking.start}
                onStop={handTracking.stop}
                compact
              />

              <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5, padding: '4px 0' }}>
                <div>☝️ 1 finger → Turn right</div>
                <div>✌️ 2 fingers → Turn left</div>
                <div>⌨ Arrow keys / WASD</div>
                <div>Space → Pause</div>
                <div>F → Fullscreen</div>
                <div>✋ Open palm → Pause</div>
                <div>👍 Thumbs up → Restart</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Level-up banner ── */}
      {levelBanner && (
        <div className="level-up-flash" key={levelBanner} style={{ zIndex: 90 }}>
          <div className="level-up-text">LEVEL {levelBanner}</div>
        </div>
      )}

      {/* ── Overlays ── */}
      {phase === GAME_STATE.PAUSED && (
        <PauseOverlay
          onResume={() => { playResume(); setPhase(GAME_STATE.PLAYING); }}
          onRestart={_restartGame}
          onSettings={() => setSettings(true)}
          onMenu={_goToMenu}
        />
      )}

      {phase === GAME_STATE.GAME_OVER && (
        <GameOverScreen
          snapshot={lastSnap}
          isNewBest={isNewBest}
          onPlayAgain={_restartGame}
          onMenu={_goToMenu}
        />
      )}

      {showGuide && (
        <GestureGuide onClose={() => setShowGuide(false)} />
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onUpdate={updateSetting}
          onResetScores={() => { resetScores(); setSettings(false); }}
          onClose={() => setSettings(false)}
        />
      )}
    </div>
  );
}
