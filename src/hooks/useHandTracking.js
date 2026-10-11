import { useEffect, useRef, useState, useCallback } from 'react';
import { TRACKING_STATUS } from '../utils/constants.js';
import {
  getHandLandmarker, destroyHandLandmarker, detectForVideo, drawLandmarks,
} from '../vision/handLandmarker.js';
import {
  detectTurn, countExtendedFingers, resetFingerCommand,
} from '../vision/fingerCommand.js';
import { detectGesture, resetGestureRecognizer } from '../vision/gestureRecognizer.js';

/**
 * @param {{ onTurn: (turn: 'RIGHT'|'LEFT') => void, onGesture: fn, showLandmarks: boolean }} opts
 *   1 finger = turn right, 2 fingers = turn left.
 */
export function useHandTracking({ onTurn, onGesture, showLandmarks = false }) {
  const videoRef      = useRef(null);
  const overlayRef    = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef        = useRef(null);
  const streamRef     = useRef(null);
  const activeRef     = useRef(false);
  const lastTs        = useRef(0);
  const missedRef     = useRef(0);

  // Always-current refs — prevent stale closures inside the rAF loop
  const onTurnRef        = useRef(onTurn);
  const onGestureRef     = useRef(onGesture);
  const showLandmarksRef = useRef(showLandmarks);
  const turnTimerRef     = useRef(null);
  onTurnRef.current        = onTurn;
  onGestureRef.current     = onGesture;
  showLandmarksRef.current = showLandmarks;

  const [status,         setStatus]      = useState(TRACKING_STATUS.IDLE);
  const [currentGesture, setGesture]     = useState(null);
  const [fingerCount,    setFingerCount] = useState(0);
  const [lastTurn,       setLastTurn]    = useState(null);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus(TRACKING_STATUS.IDLE);
    setFingerCount(0);
    setLastTurn(null);
    resetFingerCommand();
    resetGestureRecognizer();
  }, []);

  const start = useCallback(async () => {
    stop(); // teardown any prior session

    setStatus(TRACKING_STATUS.LOADING);
    try {
      landmarkerRef.current = await getHandLandmarker();
    } catch (e) {
      console.error('MediaPipe load failed:', e);
      setStatus(TRACKING_STATUS.ERROR);
      return;
    }

    setStatus(TRACKING_STATUS.REQUESTING_CAMERA);
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
    } catch (e) {
      setStatus(
        e.name === 'NotAllowedError' ? TRACKING_STATUS.PERMISSION_DENIED
        : e.name === 'NotFoundError'  ? TRACKING_STATUS.NO_CAMERA
        : TRACKING_STATUS.ERROR,
      );
      return;
    }
    streamRef.current = stream;

    // The <video> element is rendered by WebcamPanel inside the game layout,
    // which may not have mounted yet. Poll up to 3 s via rAF.
    let video = videoRef.current;
    if (!video) {
      const deadline = Date.now() + 3000;
      await new Promise(resolve => {
        const poll = () => {
          video = videoRef.current;
          if (video || Date.now() > deadline) { resolve(); return; }
          requestAnimationFrame(poll);
        };
        requestAnimationFrame(poll);
      });
    }
    // Guard: component may have unmounted or stop() was called during the wait
    if (!video || !streamRef.current) { stop(); return; }

    video.srcObject   = stream;
    video.muted       = true;
    video.playsInline = true;

    await new Promise((res, rej) => {
      video.onloadeddata = res;
      video.onerror      = rej;
    });
    await video.play();

    setStatus(TRACKING_STATUS.SEARCHING);
    activeRef.current = true;
    missedRef.current = 0;
    _runLoop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function _runLoop() {
    if (!activeRef.current) return;

    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(_runLoop);
      return;
    }

    const nowMs = performance.now();
    // Throttle inference to ~30 fps
    if (nowMs - lastTs.current < 32) {
      rafRef.current = requestAnimationFrame(_runLoop);
      return;
    }
    lastTs.current = nowMs;

    const result = detectForVideo(landmarkerRef.current, video, nowMs);

    if (result && result.landmarks && result.landmarks.length > 0) {
      const lm = result.landmarks[0];
      missedRef.current = 0;
      setStatus(TRACKING_STATUS.TRACKING);

      // Gestures (open palm / thumbs-up) — checked first, regardless of pose
      const gest = detectGesture(lm);
      if (gest) {
        setGesture(gest);
        onGestureRef.current?.(gest);
      }

      // Finger-count steering: 1 finger = turn right, 2 fingers = turn left
      setFingerCount(countExtendedFingers(lm));
      const turn = detectTurn(lm);
      if (turn) {
        setLastTurn(turn);
        onTurnRef.current?.(turn);
        clearTimeout(turnTimerRef.current);
        turnTimerRef.current = setTimeout(() => setLastTurn(null), 700);
      }

      // Landmark overlay
      if (showLandmarksRef.current && overlayRef.current) {
        const oc   = overlayRef.current;
        const octx = oc.getContext('2d');
        octx.clearRect(0, 0, oc.width, oc.height);
        drawLandmarks(octx, result.landmarks, oc.width, oc.height);
      }
    } else {
      missedRef.current++;
      if (missedRef.current > 15) setStatus(TRACKING_STATUS.SEARCHING);
      else if (missedRef.current > 5)  setStatus(TRACKING_STATUS.UNSTABLE);
      if (missedRef.current > 5) { setFingerCount(0); resetFingerCommand(); }

      if (showLandmarksRef.current && overlayRef.current) {
        const oc   = overlayRef.current;
        const octx = oc.getContext('2d');
        octx.clearRect(0, 0, oc.width, oc.height);
      }
    }

    rafRef.current = requestAnimationFrame(_runLoop);
  }

  useEffect(() => () => {
    clearTimeout(turnTimerRef.current);
    stop();
    destroyHandLandmarker();
  }, []);

  return {
    videoRef,
    overlayRef,
    status,
    currentGesture,
    fingerCount,
    lastTurn,
    start,
    stop,
  };
}
