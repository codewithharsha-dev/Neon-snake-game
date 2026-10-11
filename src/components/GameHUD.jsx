import { formatScore, formatTime } from '../utils/helpers.js';
import { speedBoostFraction, hasShield } from '../game/powerUps.js';
import '../styles/game.css';

export function GameHUD({
  score,
  bestScore,
  level,
  foodEaten,
  elapsed,
  activePU,
  soundEnabled,
  onToggleSound,
  onPause,
  onToggleFullscreen,
}) {
  const speedFrac  = activePU ? speedBoostFraction(activePU, performance.now()) : 0;
  const shielded   = activePU ? hasShield(activePU) : false;

  return (
    <div className="hud-bar">
      {/* Left: Score */}
      <div className="hud-section">
        <div className="hud-metric">
          <span className="hud-label">SCORE</span>
          <span className="hud-value accent-cyan">{formatScore(score)}</span>
        </div>
        <div className="hud-metric">
          <span className="hud-label">BEST</span>
          <span className="hud-value">{formatScore(bestScore)}</span>
        </div>
      </div>

      {/* Center: Level + power-ups */}
      <div className="hud-section hud-center">
        <div className="hud-metric">
          <span className="hud-label">LEVEL</span>
          <span className="hud-value accent-violet">{level}</span>
        </div>
        <div className="hud-metric">
          <span className="hud-label">TIME</span>
          <span className="hud-value">{formatTime(elapsed)}</span>
        </div>
        {/* Power-up indicators */}
        {speedFrac > 0 && (
          <div className="pu-pill pu-speed" style={{ '--frac': speedFrac }}>
            ⚡ SPEED <span className="pu-timer">{(speedFrac * 100).toFixed(0)}%</span>
          </div>
        )}
        {shielded && (
          <div className="pu-pill pu-shield">
            🛡 SHIELD
          </div>
        )}
      </div>

      {/* Right: Controls */}
      <div className="hud-section hud-right">
        <div className="hud-metric">
          <span className="hud-label">FOOD</span>
          <span className="hud-value">{foodEaten}</span>
        </div>
        <div className="hud-controls">
          <button
            className="hud-btn"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          {onToggleFullscreen && (
            <button
              className="hud-btn"
              onClick={onToggleFullscreen}
              aria-label="Toggle fullscreen"
              title="Fullscreen (F)"
            >
              ⛶
            </button>
          )}
          <button
            className="hud-btn hud-btn-pause"
            onClick={onPause}
            aria-label="Pause game"
            title="Pause (Space)"
          >
            ⏸
          </button>
        </div>
      </div>
    </div>
  );
}
