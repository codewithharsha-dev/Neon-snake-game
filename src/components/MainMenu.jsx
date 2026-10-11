import { formatScore } from '../utils/helpers.js';
import '../styles/overlays.css';

export function MainMenu({ bestScore, totalGames, onPlay, onSettings, onHowToPlay }) {
  return (
    <div className="overlay-screen menu-screen">
      <div className="menu-content glass-panel">
        {/* Logo */}
        <div className="menu-logo">
          <div className="logo-snake">🐍</div>
          <h1 className="logo-title">
            <span className="accent-cyan">NEON</span> <span className="accent-violet">SNAKE</span>
          </h1>
          <p className="logo-subtitle">Control the snake with your index finger</p>
        </div>

        {/* Stats */}
        <div className="menu-stats-row">
          <div className="menu-stat">
            <div className="menu-stat-val accent-cyan">{formatScore(bestScore)}</div>
            <div className="menu-stat-lbl">BEST SCORE</div>
          </div>
          <div className="menu-stat-divider" />
          <div className="menu-stat">
            <div className="menu-stat-val">{totalGames}</div>
            <div className="menu-stat-lbl">GAMES PLAYED</div>
          </div>
        </div>

        {/* Camera hint */}
        <div className="camera-hint">
          <span className="camera-hint-icon">📷</span>
          <span>Webcam required for hand control · Keyboard arrow keys always work</span>
        </div>

        {/* Buttons */}
        <div className="menu-buttons">
          <button className="btn btn-primary btn-lg glow-cyan" onClick={onPlay}>
            ☝️ PLAY WITH YOUR HAND
          </button>
          <div className="menu-btn-row">
            <button className="btn btn-ghost-outline" onClick={onHowToPlay}>
              📖 How to Play
            </button>
            <button className="btn btn-ghost-outline" onClick={onSettings}>
              ⚙ Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
