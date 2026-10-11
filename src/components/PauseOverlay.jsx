import '../styles/overlays.css';

export function PauseOverlay({ onResume, onRestart, onSettings, onMenu }) {
  return (
    <div className="overlay-screen pause-overlay" role="dialog" aria-label="Game paused">
      <div className="overlay-panel glass-panel">
        <div className="overlay-title">⏸ PAUSED</div>
        <p className="overlay-hint">Open palm gesture · or Space key</p>
        <div className="overlay-buttons">
          <button className="btn btn-primary" onClick={onResume}>▶ Resume</button>
          <button className="btn btn-secondary" onClick={onRestart}>↺ Restart</button>
          <button className="btn btn-ghost-outline" onClick={onSettings}>⚙ Settings</button>
          <button className="btn btn-ghost-outline" onClick={onMenu}>⌂ Main Menu</button>
        </div>
      </div>
    </div>
  );
}
