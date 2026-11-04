import { GAME_HEIGHT, WORLD_WIDTH, GROUND_HEIGHT } from '../config/balance.js';

export const GROUND_TOP = GAME_HEIGHT - GROUND_HEIGHT;

/** Zonas del mapa (provisional; luego vendrán de la capa de objetos de Tiled). */
export const ZONES = [
  { id: 'casa', name: 'Casa', from: 0, to: 1800 },
  { id: 'calle', name: 'Calle', from: 1800, to: 4200 },
  { id: 'avenida', name: 'Avenida', from: 4200, to: 6600 },
  { id: 'gente', name: 'Zona concurrida', from: 6600, to: 9000 },
  { id: 'escuela', name: 'Escuela', from: 9000, to: WORLD_WIDTH }
];

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Genera un nivel largo y determinista con el mismo contenido que tendrá el
 * mapa de Tiled: spawn, plataformas, pastillas, meta y zonas.
 * Plataformas: x = centro, y = borde superior. Alturas en escalones de 100 px
 * (alcanzables: el salto llega a ~147 px).
 */
export function buildLevel(seed = 7) {
  const rnd = mulberry32(seed);
  const platforms = [];
  const pills = [];

  const tiers = 3;
  let tier = 0;
  let x = 450;
  let lastGroundPill = 700;

  while (x < WORLD_WIDTH - 600) {
    const w = 128 + Math.floor(rnd() * 3) * 32;
    tier = Math.min(tiers - 1, Math.max(0, tier + Math.floor(rnd() * 3) - 1));
    const y = GROUND_TOP - 100 * (tier + 1);
    platforms.push({ x: x + w / 2, y, w, h: 16 });

    if (rnd() < 0.3) pills.push({ x: x + w / 2, y: y - 24 });

    // Pastillas en el suelo a intervalos regulares
    while (lastGroundPill < x) {
      pills.push({ x: lastGroundPill, y: GROUND_TOP - 24 });
      lastGroundPill += 1300 + Math.floor(rnd() * 400);
    }

    x += w + 60 + Math.floor(rnd() * 90);
  }

  return {
    worldWidth: WORLD_WIDTH,
    spawn: { x: 100, y: GROUND_TOP - 60 },
    goal: { x: WORLD_WIDTH - 80, y: GROUND_TOP - 40 },
    platforms,
    pills,
    zones: ZONES
  };
}

export function zoneAt(x) {
  for (let i = 0; i < ZONES.length; i++) {
    if (x >= ZONES[i].from && x < ZONES[i].to) return ZONES[i];
  }
  return ZONES[ZONES.length - 1];
}
