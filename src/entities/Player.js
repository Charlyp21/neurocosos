import Phaser from 'phaser';
import { PLAYER } from '../config/balance.js';
import { PLAYER_BODY, PLAYER_SCALE } from '../config/playerSprites.js';

export const PlayerState = Object.freeze({
  IDLE: 'IDLE',
  RUN: 'RUN',
  JUMP: 'JUMP', // ascendiendo
  FALL: 'FALL' // descendiendo
});

const ANIM_BY_STATE = {
  [PlayerState.IDLE]: 'idle',
  [PlayerState.RUN]: 'run',
  [PlayerState.JUMP]: 'jump',
  [PlayerState.FALL]: 'fall'
};

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player_idle', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(PLAYER_SCALE);
    this.body.setSize(PLAYER_BODY.width, PLAYER_BODY.height);
    this.body.setOffset(PLAYER_BODY.offsetX, PLAYER_BODY.offsetY);
    this.setCollideWorldBounds(true);
    this.moveState = PlayerState.IDLE;
    this.facing = 1;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.jumpCut = false;
    this.anims.play('idle');
  }

  /**
   * @param {import('../systems/InputController.js').default} input
   * @param {number} dt milisegundos del frame (ya limitados)
   */
  tick(input, dt) {
    const body = this.body;
    const grounded = body.blocked.down;

    // Coyote time y salto en buffer
    if (grounded) {
      this.coyoteTimer = PLAYER.coyoteMs;
      this.jumpCut = false;
    } else {
      this.coyoteTimer -= dt;
    }
    this.jumpBufferTimer = input.jumpPressed ? PLAYER.jumpBufferMs : this.jumpBufferTimer - dt;

    // Movimiento horizontal
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    this.setVelocityX(dir * PLAYER.speed);
    if (dir !== 0) {
      this.facing = dir;
      this.setFlipX(dir < 0);
    }

    // Salto
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.setVelocityY(PLAYER.jumpVelocity);
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this.jumpCut = false;
    }

    // Altura variable: soltar el botón corta el ascenso
    if (!input.jumpHeld && body.velocity.y < 0 && !this.jumpCut) {
      this.setVelocityY(body.velocity.y * PLAYER.jumpCutFactor);
      this.jumpCut = true;
    }

    // Máquina de estados
    let next;
    if (!grounded) next = body.velocity.y < 0 ? PlayerState.JUMP : PlayerState.FALL;
    else next = dir !== 0 ? PlayerState.RUN : PlayerState.IDLE;

    if (next !== this.moveState) {
      this.moveState = next;
      this.anims.play(ANIM_BY_STATE[next], true);
    }
  }
}
