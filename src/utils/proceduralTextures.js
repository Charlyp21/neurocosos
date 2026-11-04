import { GAME_HEIGHT } from '../config/balance.js';

/**
 * Texturas provisionales generadas por código.
 * Se sustituirán por los assets finales (ver ASSETS.md) usando las mismas claves.
 */
export default function createProceduralTextures(scene) {
  const tex = scene.textures;
  const g = scene.add.graphics();
  const make = (key, w, h, draw) => {
    if (tex.exists(key)) return;
    g.clear();
    draw(g);
    g.generateTexture(key, w, h);
  };

  make('ground_tile', 32, 32, (g) => {
    g.fillStyle(0x4a3b2a, 1).fillRect(0, 0, 32, 32);
    g.fillStyle(0x3f8f3f, 1).fillRect(0, 0, 32, 6);
    g.fillStyle(0x3a2d1f, 1).fillRect(6, 14, 4, 4).fillRect(20, 22, 4, 4);
  });

  make('platform_tile', 32, 16, (g) => {
    g.fillStyle(0x666666, 1).fillRect(0, 0, 32, 16);
    g.fillStyle(0x888888, 1).fillRect(0, 0, 32, 4);
  });

  make('pill', 16, 16, (g) => {
    g.fillStyle(0xffffff, 1).fillCircle(8, 8, 8);
    g.fillStyle(0xff66aa, 1).fillCircle(8, 8, 5);
  });

  make('goal', 32, 80, (g) => {
    g.fillStyle(0xffdd00, 1).fillRect(0, 0, 32, 80);
    g.fillStyle(0x553300, 1).fillRect(8, 24, 16, 56);
  });

  // Fondos con parallax (512x512, tileables en horizontal)
  make('bg_sky', 64, GAME_HEIGHT, (g) => {
    const bands = 12;
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1);
      const r = Math.round(10 + 30 * t);
      const gr = Math.round(15 + 40 * t);
      const b = Math.round(40 + 60 * t);
      g.fillStyle((r << 16) | (gr << 8) | b, 1)
        .fillRect(0, (GAME_HEIGHT / bands) * i, 64, GAME_HEIGHT / bands + 1);
    }
  });

  const skyline = (key, color, minH, maxH, minW, maxW, seed) => {
    make(key, 512, 512, (g) => {
      let a = seed;
      const rnd = () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296);
      g.fillStyle(color, 1);
      let x = 0;
      while (x < 512) {
        const w = Math.min(512 - x, minW + Math.floor(rnd() * (maxW - minW)));
        const h = minH + Math.floor(rnd() * (maxH - minH));
        g.fillRect(x, 512 - h, w, h);
        x += w + Math.floor(rnd() * 8);
      }
    });
  };
  skyline('bg_far', 0x1a2238, 120, 300, 48, 96, 11);
  skyline('bg_near', 0x252f4a, 60, 180, 32, 80, 23);

  g.destroy();
}
