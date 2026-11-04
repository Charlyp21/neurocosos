import { GAME_WIDTH, GAME_HEIGHT } from '../config/balance.js';

const BTN = 88;
const MARGIN = 24;
const BUTTONS = {
  left: { x: MARGIN, y: GAME_HEIGHT - BTN - MARGIN, w: BTN, h: BTN, label: '◀' },
  right: { x: MARGIN * 2 + BTN, y: GAME_HEIGHT - BTN - MARGIN, w: BTN, h: BTN, label: '▶' },
  jump: { x: GAME_WIDTH - BTN - MARGIN, y: GAME_HEIGHT - BTN - MARGIN, w: BTN, h: BTN, label: '▲' }
};

/**
 * Unifica teclado (flechas / WASD / espacio) y botones táctiles virtuales.
 * Expone left, right, jumpHeld, jumpPressed (flanco de subida).
 */
export default class InputController {
  constructor(scene) {
    this.scene = scene;
    this.keys = scene.input.keyboard.addKeys({
      left: 'LEFT', right: 'RIGHT', up: 'UP',
      a: 'A', d: 'D', w: 'W', space: 'SPACE'
    });

    this.left = false;
    this.right = false;
    this.jumpHeld = false;
    this.jumpPressed = false;
    this._prevJump = false;

    this.touchEnabled = !!scene.sys.game.device.input.touch;
    if (this.touchEnabled) {
      scene.input.addPointer(2); // multitáctil: mover + saltar a la vez
      for (const b of Object.values(BUTTONS)) {
        scene.add.rectangle(b.x + b.w / 2, b.y + b.h / 2, b.w, b.h, 0xffffff, 0.15)
          .setStrokeStyle(2, 0xffffff, 0.4).setScrollFactor(0).setDepth(100);
        scene.add.text(b.x + b.w / 2, b.y + b.h / 2, b.label, { fontSize: '36px', color: '#ffffff' })
          .setOrigin(0.5).setScrollFactor(0).setDepth(101).setAlpha(0.6);
      }
    }
  }

  update() {
    const k = this.keys;
    let left = k.left.isDown || k.a.isDown;
    let right = k.right.isDown || k.d.isDown;
    let jump = k.up.isDown || k.w.isDown || k.space.isDown;

    if (this.touchEnabled) {
      const pointers = this.scene.input.manager.pointers;
      for (let i = 0; i < pointers.length; i++) {
        const p = pointers[i];
        if (!p.isDown) continue;
        if (this._hit(BUTTONS.left, p)) left = true;
        if (this._hit(BUTTONS.right, p)) right = true;
        if (this._hit(BUTTONS.jump, p)) jump = true;
      }
    }

    this.left = left;
    this.right = right;
    this.jumpHeld = jump;
    this.jumpPressed = jump && !this._prevJump;
    this._prevJump = jump;
  }

  _hit(b, p) {
    return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
  }
}
