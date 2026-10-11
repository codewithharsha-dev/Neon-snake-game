import '../styles/overlays.css';

export function SettingsPanel({ settings, onUpdate, onResetScores, onClose }) {
  return (
    <div className="overlay-screen" role="dialog" aria-label="Settings">
      <div className="overlay-panel glass-panel settings-panel">
        <div className="overlay-title">⚙ SETTINGS</div>

        <div className="settings-list">
          <SettingRow label="Sound">
            <ToggleBtn
              active={settings.soundEnabled}
              onChange={v => onUpdate('soundEnabled', v)}
            />
          </SettingRow>

          <SettingRow label="Volume">
            <input
              type="range" min="0" max="1" step="0.05"
              value={settings.volume}
              className="range-slider"
              onChange={e => onUpdate('volume', parseFloat(e.target.value))}
              aria-label="Volume"
            />
            <span className="range-val">{Math.round(settings.volume * 100)}%</span>
          </SettingRow>

          <SettingRow label="Show Hand Landmarks">
            <ToggleBtn
              active={settings.showLandmarks}
              onChange={v => onUpdate('showLandmarks', v)}
            />
          </SettingRow>

          <SettingRow label="Mirror Camera Preview">
            <ToggleBtn
              active={settings.mirrorPreview}
              onChange={v => onUpdate('mirrorPreview', v)}
            />
          </SettingRow>

          <SettingRow label="Reduced Motion">
            <ToggleBtn
              active={settings.reducedMotion}
              onChange={v => onUpdate('reducedMotion', v)}
            />
          </SettingRow>
        </div>

        <div className="settings-footer">
          <button className="btn btn-danger-sm" onClick={onResetScores}>
            Reset Scores
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, children }) {
  return (
    <div className="setting-row">
      <span className="setting-label">{label}</span>
      <div className="setting-control">{children}</div>
    </div>
  );
}

function ToggleBtn({ active, onChange }) {
  return (
    <button
      className={`toggle-btn ${active ? 'toggle-on' : ''}`}
      onClick={() => onChange(!active)}
      aria-pressed={active}
    >
      {active ? 'ON' : 'OFF'}
    </button>
  );
}
