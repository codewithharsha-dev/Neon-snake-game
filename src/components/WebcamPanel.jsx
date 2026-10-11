import { TRACKING_STATUS } from '../utils/constants.js';
import '../styles/game.css';

const STATUS_LABELS = {
  [TRACKING_STATUS.IDLE]:              { text: 'Camera off',        color: '#64748b' },
  [TRACKING_STATUS.LOADING]:           { text: 'Loading model…',    color: '#6366f1' },
  [TRACKING_STATUS.REQUESTING_CAMERA]: { text: 'Allow camera…',     color: '#f59e0b' },
  [TRACKING_STATUS.SEARCHING]:         { text: '🔍 Searching hand', color: '#f59e0b' },
  [TRACKING_STATUS.TRACKING]:          { text: '✅ Hand detected',  color: '#10b981' },
  [TRACKING_STATUS.UNSTABLE]:          { text: '⚠ Tracking lost',  color: '#f97316' },
  [TRACKING_STATUS.PERMISSION_DENIED]: { text: '❌ Camera denied',  color: '#ef4444' },
  [TRACKING_STATUS.NO_CAMERA]:         { text: '❌ No camera',      color: '#ef4444' },
  [TRACKING_STATUS.ERROR]:             { text: '❌ Camera error',   color: '#ef4444' },
};

export function WebcamPanel({
  videoRef,
  overlayRef,
  status,
  currentGesture,
  fingerCount = 0,
  lastTurn = null,
  showLandmarks,
  mirrorPreview = true,
  onStart,
  onStop,
  compact = false,
}) {
  const info = STATUS_LABELS[status] || STATUS_LABELS[TRACKING_STATUS.IDLE];
  const isActive = status === TRACKING_STATUS.TRACKING || status === TRACKING_STATUS.UNSTABLE;
  const isError  = [TRACKING_STATUS.PERMISSION_DENIED, TRACKING_STATUS.NO_CAMERA, TRACKING_STATUS.ERROR].includes(status);

  return (
    <div className={`webcam-panel ${compact ? 'webcam-compact' : ''}`}>
      <div className="webcam-video-wrap">
        <video
          ref={videoRef}
          className={`webcam-video ${mirrorPreview ? 'mirrored' : ''}`}
          muted
          playsInline
          aria-label="Webcam preview"
        />
        <canvas
          ref={overlayRef}
          className="webcam-overlay"
          width="320"
          height="240"
        />

        {/* Last accepted turn command */}
        {isActive && lastTurn && (
          <div className="dir-arrow" aria-label={`Turn ${lastTurn}`}>
            {lastTurn === 'RIGHT' ? '↻' : '↺'}
          </div>
        )}

        {/* Status badge */}
        <div className="webcam-status-badge" style={{ color: info.color }}>
          {info.text}
        </div>
      </div>

      {/* Gesture / pointing display */}
      {currentGesture && currentGesture !== 'NONE' ? (
        <div className="gesture-indicator">
          {currentGesture === 'OPEN_PALM' && '✋ Pause'}
          {currentGesture === 'THUMBS_UP' && '👍 Restart'}
        </div>
      ) : lastTurn ? (
        <div className="gesture-indicator" style={{ borderColor: 'rgba(0,245,255,0.25)', background: 'rgba(0,245,255,0.06)' }}>
          {lastTurn === 'RIGHT' ? '☝️ 1 finger → Turn right' : '✌️ 2 fingers → Turn left'}
        </div>
      ) : null}

      {/* Live finger count (calibration helper) */}
      {isActive && (
        <div className="vec-vis-wrap">
          <span className="vec-vis-label">
            Fingers detected: <strong style={{ color: 'var(--cyan)' }}>{fingerCount}</strong>
          </span>
        </div>
      )}

      {/* Controls */}
      {!compact && (
        <div className="webcam-controls">
          {status === TRACKING_STATUS.IDLE || isError ? (
            <button className="btn btn-cyan" onClick={onStart} disabled={status === TRACKING_STATUS.LOADING}>
              {status === TRACKING_STATUS.LOADING ? 'Loading…' : '📷 Enable Camera'}
            </button>
          ) : (
            <button className="btn btn-ghost-sm" onClick={onStop}>
              Stop Camera
            </button>
          )}
          {isError && (
            <p className="webcam-error-hint">
              {status === TRACKING_STATUS.PERMISSION_DENIED
                ? 'Open browser settings → allow camera for this page.'
                : 'Check your camera connection and refresh.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
