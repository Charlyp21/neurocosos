// Constantes de balance. Unidades de concentración: abstractas (0-100).
export const PK = {
  therapeuticMin: 20,
  therapeuticMax: 60,
  toxicLevel: 80,
  lethalLevel: 100,
  ke: 0.03, // 1/s -> vida media ~23 s (acelerada por jugabilidad)
  initialConcentration: 40
};

export const PILL_DOSE = 30;

export const PLAYER = {
  speed: 200,
  jumpVelocity: -420,
  gravity: 600
};

// Tiempo máximo (ms) de un frame que la simulación acepta
export const MAX_DELTA_MS = 50;

// Resolución base 16:9
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
