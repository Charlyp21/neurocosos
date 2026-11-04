// Constantes de balance. Unidades de concentración: abstractas (0-100).
export const PK = {
  therapeuticMin: 20,
  therapeuticMax: 60,
  toxicLevel: 80,
  lethalLevel: 100,
  ke: 0.06, // 1/s -> vida media ~11.5 s (acelerada por jugabilidad)
  initialConcentration: 40,
  // Segundos acumulados bajo el mínimo terapéutico que provocan derrota
  maxTimeBelowMin: 20,
  // Con C en rango, el acumulador baja a esta velocidad (x tiempo real)
  timeRecoveryRate: 1.5
};

export const PILL_DOSE = 25;

export const PLAYER = {
  speed: 200,
  jumpVelocity: -420,
  gravity: 600,
  coyoteMs: 100, // margen para saltar tras dejar una plataforma
  jumpBufferMs: 120, // salto "adelantado" antes de aterrizar
  jumpCutFactor: 0.5 // al soltar el salto en ascenso, se multiplica la velocidad vertical
};

// Tiempo máximo (ms) de un frame que la simulación acepta
export const MAX_DELTA_MS = 50;

// Resolución base 16:9
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

// Cámara
export const CAMERA = {
  lerp: 0.1,
  lookAhead: 60, // px hacia donde mira el jugador
  lookAheadLerp: 0.05,
  deadzoneW: 80,
  deadzoneH: 60
};

// Nivel
export const WORLD_WIDTH = 12000;
export const GROUND_HEIGHT = 32;
