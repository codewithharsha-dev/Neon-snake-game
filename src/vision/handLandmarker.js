import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { MEDIAPIPE_WASM_PATH, MEDIAPIPE_MODEL_PATH } from '../utils/constants.js';

let landmarker = null;
let loadPromise = null;

/**
 * Lazily create the HandLandmarker (singleton).
 * Returns the same promise if called concurrently.
 */
export async function getHandLandmarker() {
  if (landmarker) return landmarker;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);
    const make = (delegate) => HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MEDIAPIPE_MODEL_PATH,
        delegate,
      },
      runningMode:       'VIDEO',
      numHands:          1,
      minHandDetectionConfidence: 0.6,
      minHandPresenceConfidence:  0.6,
      minTrackingConfidence:      0.5,
    });
    try {
      landmarker = await make('GPU');
    } catch (e) {
      console.warn('GPU delegate failed, falling back to CPU:', e);
      landmarker = await make('CPU');
    }
    return landmarker;
  })().catch((e) => {
    loadPromise = null; // allow a retry after a failed download
    throw e;
  });

  return loadPromise;
}

export function destroyHandLandmarker() {
  if (landmarker) {
    try { landmarker.close(); } catch {}
    landmarker  = null;
    loadPromise = null;
  }
}

/** Detect for a single video frame. Returns mediapipe result or null. */
export function detectForVideo(landmarkerInstance, videoEl, timestampMs) {
  if (!landmarkerInstance || !videoEl) return null;
  try {
    return landmarkerInstance.detectForVideo(videoEl, timestampMs);
  } catch (e) {
    console.warn('Hand detection error:', e);
    return null;
  }
}

/** Draw landmarks on an overlay canvas */
export function drawLandmarks(overlayCtx, landmarks, canvasW, canvasH) {
  if (!landmarks || landmarks.length === 0) return;

  const lm = landmarks[0];
  const CONNECTIONS = HandLandmarker.HAND_CONNECTIONS;

  // Connections
  overlayCtx.clearRect(0, 0, canvasW, canvasH);
  overlayCtx.strokeStyle = 'rgba(0,245,255,0.5)';
  overlayCtx.lineWidth   = 1.5;

  CONNECTIONS.forEach(({ start, end }) => {
    const a = lm[start], b = lm[end];
    if (!a || !b) return;
    overlayCtx.beginPath();
    overlayCtx.moveTo((1 - a.x) * canvasW, a.y * canvasH); // mirror X
    overlayCtx.lineTo((1 - b.x) * canvasW, b.y * canvasH);
    overlayCtx.stroke();
  });

  // Key points
  lm.forEach((pt, i) => {
    const isIndex = i >= 5 && i <= 8;
    overlayCtx.fillStyle   = isIndex ? '#00ff88' : 'rgba(255,255,255,0.4)';
    overlayCtx.shadowBlur  = isIndex ? 8 : 0;
    overlayCtx.shadowColor = '#00ff88';
    overlayCtx.beginPath();
    overlayCtx.arc((1 - pt.x) * canvasW, pt.y * canvasH, isIndex ? 4 : 2, 0, Math.PI * 2);
    overlayCtx.fill();
  });
  overlayCtx.shadowBlur = 0;
}
