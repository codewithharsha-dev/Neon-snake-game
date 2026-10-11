// ─── Grid ───────────────────────────────────────────────────
// Wide 16:9-style grid so the flat board fills a widescreen display.
// There are no walls — the snake wraps around to the opposite edge.
export const GRID_COLS = 32;
export const GRID_ROWS = 18;

// ─── Flat 2-D render size of one cell (virtual units; the board is scaled to fit) ───
export const CELL = 40;

// ─── Isometric tile dimensions ──────────────────────────────
export const TILE_W   = 44;   // horizontal width of one tile
export const TILE_H   = 22;   // vertical height of one tile (TILE_W / 2)
export const CUBE_H   = 18;   // visual height of 3-D segment block

// ─── Snake initial state ────────────────────────────────────
export const INITIAL_LENGTH = 3;
export const INITIAL_DIR    = 'RIGHT';
export const INITIAL_COL    = Math.floor(GRID_COLS / 2) - 1;
export const INITIAL_ROW    = Math.floor(GRID_ROWS / 2);

// ─── Timing (ms) ────────────────────────────────────────────
export const BASE_MOVE_INTERVAL  = 260;
export const MIN_MOVE_INTERVAL   = 120;
export const SPEED_BOOST_FACTOR  = 0.65;
export const BONUS_FOOD_LIFETIME = 8000;

// ─── Level progression ──────────────────────────────────────
export const FOOD_PER_LEVEL           = 5;
export const SPEED_REDUCTION_PER_LEVEL = 8; // ms

// ─── Scoring ────────────────────────────────────────────────
export const SCORE_NORMAL_FOOD = 10;
export const SCORE_BONUS_FOOD  = 30;

// ─── Power-up durations (ms) ────────────────────────────────
export const POWERUP_SPEED_DURATION  = 7000;
export const POWERUP_SHIELD_DURATION = 0;  // consumed on collision

// ─── Spawn probabilities ─────────────────────────────────────
export const BONUS_FOOD_SPAWN_CHANCE  = 0.25;
export const POWERUP_SPAWN_CHANCE     = 0.20;

// ─── Directions ─────────────────────────────────────────────
export const DIRECTIONS = {
  UP:    { dc:  0, dr: -1 },
  DOWN:  { dc:  0, dr:  1 },
  LEFT:  { dc: -1, dr:  0 },
  RIGHT: { dc:  1, dr:  0 },
};

export const OPPOSITE = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };

// ─── Game states ────────────────────────────────────────────
export const GAME_STATE = {
  MENU:         'MENU',
  CAMERA_SETUP: 'CAMERA_SETUP',
  CALIBRATING:  'CALIBRATING',
  READY:        'READY',
  PLAYING:      'PLAYING',
  PAUSED:       'PAUSED',
  GAME_OVER:    'GAME_OVER',
};

// ─── Hand-tracking status ────────────────────────────────────
export const TRACKING_STATUS = {
  IDLE:              'IDLE',
  LOADING:           'LOADING',
  REQUESTING_CAMERA: 'REQUESTING_CAMERA',
  SEARCHING:         'SEARCHING',
  TRACKING:          'TRACKING',
  UNSTABLE:          'UNSTABLE',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NO_CAMERA:         'NO_CAMERA',
  ERROR:             'ERROR',
};

// ─── Gesture names ───────────────────────────────────────────
export const GESTURE = {
  OPEN_PALM: 'OPEN_PALM',
  THUMBS_UP: 'THUMBS_UP',
  POINTING:  'POINTING',
  NONE:      'NONE',
};

// ─── MediaPipe CDN ────────────────────────────────────────────
export const MEDIAPIPE_WASM_PATH =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';

export const MEDIAPIPE_MODEL_PATH =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// ─── Gesture cooldowns (ms) ──────────────────────────────────
export const GESTURE_COOLDOWN        = 1500;
export const DIRECTION_DEBOUNCE      = 120;
export const GESTURE_STABILITY_FRAMES = 6;

// ─── Finger-count turn controls ──────────────────────────────
export const TURN_STABILITY_FRAMES = 5;    // frames a pose must hold before it counts
export const TURN_REPEAT_MS        = 800;  // repeat the turn while the pose is held
export const TURN_MIN_GAP_MS       = 250;  // minimum gap between any two turns

// ─── Colours ─────────────────────────────────────────────────
export const COLORS = {
  BG:             '#0a0e1a',
  TILE_EVEN:      '#0e1530',
  TILE_ODD:       '#121b3b',
  TILE_EDGE:      '#1b2650',
  SNAKE_HEAD:     '#00f5ff',
  SNAKE_BODY:     '#0099bb',
  SNAKE_TAIL:     '#004455',
  SNAKE_GLOW:     '#00f5ff',
  FOOD_NORMAL:    '#10b981',
  FOOD_BONUS:     '#f59e0b',
  FOOD_GLOW_N:    '#00ff88',
  FOOD_GLOW_B:    '#ffcc00',
  POWERUP_SPEED:  '#6366f1',
  POWERUP_SHIELD: '#f472b6',
  OBSTACLE:       '#374151',
  BORDER:         '#1e3a5f',
  PARTICLE_1:     '#00f5ff',
  PARTICLE_2:     '#7c3aed',
  PARTICLE_3:     '#10b981',
  SHADOW:         'rgba(0,0,0,0.45)',
};
