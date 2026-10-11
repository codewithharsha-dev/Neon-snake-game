import { formatScore, formatTime } from '../utils/helpers.js';
import '../styles/overlays.css';

export function GameOverScreen({ snapshot, isNewBest, onPlayAgain, onMenu }) {
  const { score, bestScore, level, foodEaten, elapsed, collidedWith } = snapshot || {};

  return (
    <div className="overlay-screen gameover-overlay" role="dialog" aria-label="Game over">
      <div className="overlay-panel glass-panel gameover-panel">
        <div className="overlay-title accent-red">GAME OVER</div>
        {isNewBest && (
          <div className="new-record-badge">🏆 NEW RECORD!</div>
        )}
        <p className="go-reason">
          {collidedWith === 'WALL' ? 'Hit the wall' : 'Bit your own tail'}
        </p>

        <div className="go-stats-grid">
          <StatCell label="SCORE"    value={formatScore(score || 0)} highlight />
          <StatCell label="BEST"     value={formatScore(bestScore || 0)} />
          <StatCell label="LEVEL"    value={level || 1} />
          <StatCell label="FOOD"     value={foodEaten || 0} />
          <StatCell label="TIME"     value={formatTime(elapsed || 0)} />
          <StatCell label="LENGTH"   value={(snapshot?.snake?.body?.length) || 0} />
        </div>

        <div className="overlay-buttons">
          <button className="btn btn-primary glow-cyan" onClick={onPlayAgain}>▶ Play Again</button>
          <button className="btn btn-ghost-outline" onClick={onMenu}>⌂ Main Menu</button>
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value, highlight }) {
  return (
    <div className={`go-stat ${highlight ? 'go-stat-highlight' : ''}`}>
      <div className="go-stat-val">{value}</div>
      <div className="go-stat-lbl">{label}</div>
    </div>
  );
}
