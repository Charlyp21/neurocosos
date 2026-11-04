import Phaser from 'phaser';
import GameScene from '../scenes/GameScene.js';
import { PLAYER, GAME_WIDTH, GAME_HEIGHT } from './balance.js';

export default {
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#050505',
  pixelArt: true,
  roundPixels: true,
  powerPreference: 'high-performance',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: PLAYER.gravity },
      debug: false
    }
  },
  scene: [GameScene]
};
