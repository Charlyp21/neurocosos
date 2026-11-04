import idleUrl from '../assets/sprites/male_hero_template-idle.png';
import runUrl from '../assets/sprites/male_hero_template-run.png';
import jumpUrl from '../assets/sprites/male_hero_template-jump.png';
import fallUrl from '../assets/sprites/male_hero_template-fall.png';

// Spritesheets del jugador: frames cuadrados de 128x128 en una sola fila.
export const PLAYER_SHEETS = {
  idle: { key: 'player_idle', url: idleUrl, frame: 128 },
  run: { key: 'player_run', url: runUrl, frame: 128 },
  jump: { key: 'player_jump', url: jumpUrl, frame: 128 },
  fall: { key: 'player_fall', url: fallUrl, frame: 128 }
};

export const PLAYER_ANIMS = [
  { key: 'idle', sheet: 'player_idle', frames: 10, fps: 8, repeat: -1 },
  { key: 'run', sheet: 'player_run', frames: 10, fps: 16, repeat: -1 },
  { key: 'jump', sheet: 'player_jump', frames: 6, fps: 12, repeat: 0 },
  { key: 'fall', sheet: 'player_fall', frames: 4, fps: 10, repeat: -1 }
];

// Dentro del frame de 128x128 el personaje ocupa aprox. x 53-73, y 48-80
// (pies en y = 80). El cuerpo de colisión se ajusta a esa zona.
export const PLAYER_BODY = { width: 18, height: 32, offsetX: 55, offsetY: 48 };
// Escala entera para mantener el pixel art nítido
export const PLAYER_SCALE = 2;
