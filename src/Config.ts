export const GameConfig = {
  // Layout
  SYMBOL_SIZE: 240,
  VISIBLE_ROWS: 3,
  REEL_COUNT: 3,
  REEL_SPACING: 50,
  SCREEN_WIDTH: 1280,
  SCREEN_HEIGHT: 720,

  // Assets
  SYMBOLS: [
    "Bar",
    "Bell",
    "Cherry",
    "Diamond",
    "Lemon",
    "Plum",
    "Seven",
    "Wild",
  ],

  // Physics
  SPIN_SPEED: 25,
  MIN_SPEED: 15,
  DECAY_RATE: 0.96,
  SPIN_DURATION: 2000,
} as const;
