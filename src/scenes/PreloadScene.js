import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/balance.js';
import { PLAYER_SHEETS, PLAYER_ANIMS } from '../config/playerSprites.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // Barra de carga simple
    const w = 300;
    const x = (GAME_WIDTH - w) / 2;
    const y = GAME_HEIGHT / 2;
    const bg = this.add.rectangle(x, y, w, 12, 0x333333).setOrigin(0, 0.5);
    const bar = this.add.rectangle(x, y, 0, 12, 0x00ffcc).setOrigin(0, 0.5);
    this.add.text(GAME_WIDTH / 2, y - 30, 'Cargando...', { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
    this.load.on('progress', (p) => { bar.width = w * p; });
    this.load.once('complete', () => { bg.destroy(); bar.destroy(); });

    for (const s of Object.values(PLAYER_SHEETS)) {
      this.load.spritesheet(s.key, s.url, { frameWidth: s.frame, frameHeight: s.frame });
    }
  }

  create() {
    for (const a of PLAYER_ANIMS) {
      this.anims.create({
        key: a.key,
        frames: this.anims.generateFrameNumbers(a.sheet, { start: 0, end: a.frames - 1 }),
        frameRate: a.fps,
        repeat: a.repeat
      });
    }
    this.scene.start('GameScene');
  }
}
