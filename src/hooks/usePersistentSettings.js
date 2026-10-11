import { useState, useCallback } from 'react';
import { safeLoadStorage, safeSaveStorage } from '../utils/helpers.js';
import { setMuted, setVolume } from '../audio/soundManager.js';

const STORAGE_KEY  = 'neonSnake3d_settings';
const SCORES_KEY   = 'neonSnake3d_scores';

const SETTINGS_DEFAULTS = {
  soundEnabled:    true,
  volume:          0.7,
  showLandmarks:   true,
  reducedMotion:   false,
  mirrorPreview:   true,
};

const SCORES_DEFAULTS = {
  bestScore:  0,
  totalGames: 0,
};

export function usePersistentSettings() {
  const [settings, _setSettings] = useState(() => safeLoadStorage(STORAGE_KEY, SETTINGS_DEFAULTS));
  const [scores,   _setScores]   = useState(() => safeLoadStorage(SCORES_KEY,  SCORES_DEFAULTS));

  const updateSetting = useCallback((key, value) => {
    _setSettings(prev => {
      const next = { ...prev, [key]: value };
      safeSaveStorage(STORAGE_KEY, next);

      // Side effects
      if (key === 'soundEnabled') setMuted(!value);
      if (key === 'volume') setVolume(value);

      return next;
    });
  }, []);

  const updateScore = useCallback((newScore) => {
    _setScores(prev => {
      const next = {
        bestScore:  Math.max(prev.bestScore,  newScore),
        totalGames: prev.totalGames + 1,
      };
      safeSaveStorage(SCORES_KEY, next);
      return next;
    });
  }, []);

  const resetScores = useCallback(() => {
    const fresh = { ...SCORES_DEFAULTS };
    _setScores(fresh);
    safeSaveStorage(SCORES_KEY, fresh);
  }, []);

  return { settings, scores, updateSetting, updateScore, resetScores };
}
