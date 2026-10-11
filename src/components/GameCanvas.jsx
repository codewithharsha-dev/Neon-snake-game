import { useRef, useEffect } from 'react';
import { initRenderer, resizeRenderer, cleanupRenderer, setReducedMotion } from '../rendering/renderer.js';
import '../styles/game.css';

export function GameCanvas({ canvasRef, reducedMotion = false }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    initRenderer(canvas, reducedMotion);

    const ro = new ResizeObserver(() => resizeRenderer());
    ro.observe(wrapRef.current || canvas);

    return () => {
      ro.disconnect();
      cleanupRenderer();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync reducedMotion without tearing down the renderer
  useEffect(() => {
    setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  return (
    <div className="game-canvas-wrap" ref={wrapRef}>
      <canvas ref={canvasRef} className="game-canvas" />
    </div>
  );
}
