import '../styles/overlays.css';

export function GestureGuide({ onClose }) {
  return (
    <div className="overlay-screen" role="dialog" aria-label="How to play">
      <div className="overlay-panel glass-panel guide-panel">
        <div className="overlay-title">HOW TO PLAY</div>

        <section className="guide-section">
          <h3 className="guide-heading accent-cyan">☝️ Hand Controls</h3>
          <div className="guide-grid">
            {[['☝️', '1 finger — turn right'], ['✌️', '2 fingers — turn left']].map(([g, l]) => (
              <div key={g} className="guide-item">
                <span className="guide-key">{g}</span>
                <span>{l}</span>
              </div>
            ))}
          </div>
          <div className="guide-row">
            <span className="guide-emoji">🔄</span>
            <span>Turns are relative to the way the snake is heading. Hold the pose to keep turning; lower your hand to reset.</span>
          </div>
          <div className="guide-row">
            <span className="guide-emoji">✋</span>
            <span><strong>Open Palm</strong> — Pause the game</span>
          </div>
          <div className="guide-row">
            <span className="guide-emoji">👍</span>
            <span><strong>Thumbs Up</strong> — Restart (when paused or on Game Over)</span>
          </div>
        </section>

        <section className="guide-section">
          <h3 className="guide-heading" style={{ color: '#38bdf8' }}>🔁 No Walls</h3>
          <div className="guide-row">
            <span className="guide-emoji">↔️</span>
            <span>The edges are open — leave one side of the screen and you come out the opposite side. Only hitting your own body ends the game.</span>
          </div>
        </section>

        <section className="guide-section">
          <h3 className="guide-heading accent-violet">⌨️ Keyboard Fallback</h3>
          <div className="guide-grid">
            {[
              ['↑ / W', 'Move Up'], ['↓ / S', 'Move Down'],
              ['← / A', 'Move Left'], ['→ / D', 'Move Right'],
              ['Space', 'Pause / Resume'], ['', ''],
            ].map(([k, l], i) => k ? (
              <div key={i} className="guide-item">
                <kbd className="kbd">{k}</kbd>
                <span>{l}</span>
              </div>
            ) : null)}
          </div>
        </section>

        <section className="guide-section">
          <h3 className="guide-heading" style={{ color: '#10b981' }}>⚡ Power-Ups</h3>
          <div className="guide-row"><span className="guide-emoji">⚡</span><span><strong>Speed Boost</strong> — Move faster for 7 s</span></div>
          <div className="guide-row"><span className="guide-emoji">🛡</span><span><strong>Shield</strong> — Survive one collision</span></div>
          <div className="guide-row"><span className="guide-emoji">⭐</span><span><strong>Bonus Food</strong> — 30 pts, limited time</span></div>
        </section>

        <button className="btn btn-primary" onClick={onClose}>Got it!</button>
      </div>
    </div>
  );
}
