import Phaser from 'phaser';
import Pharmacokinetics from '../systems/Pharmacokinetics.js';
import { PILL_DOSE, PLAYER, MAX_DELTA_MS, GAME_WIDTH, GAME_HEIGHT } from '../config/balance.js';

// Medidor de concentración plasmática (esquina superior derecha)
const GAUGE = { x: GAME_WIDTH - 60, y: 20, width: 40, height: 200, maxValue: 100 };

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.pk = new Pharmacokinetics();
    this.lastGaugeValue = -1;

    this.add.text(20, 20, 'Farmacocinética: Test de Ventana Terapéutica', {
      fontSize: '20px',
      color: '#00ffcc',
      fontFamily: 'monospace'
    });
    this.add.text(20, 50, 'Flechas: mover/saltar. Recoge pastillas', {
      fontSize: '14px',
      color: '#888888',
      fontFamily: 'monospace'
    });

    this.createTextures();

    // Plataformas estáticas
    const platforms = this.physics.add.staticGroup();
    platforms.create(GAME_WIDTH / 2, GAME_HEIGHT - 10, 'platform').setScale(10, 1).refreshBody(); // suelo
    platforms.create(200, 410, 'platform');
    platforms.create(450, 320, 'platform');
    platforms.create(700, 230, 'platform');
    platforms.create(150, 220, 'platform');

    // Jugador
    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, platforms);
    this.cursors = this.input.keyboard.createCursorKeys();

    // Pastillas coleccionables
    const pills = this.physics.add.group({ allowGravity: false, immovable: true });
    [[200, 370], [450, 280], [700, 190], [150, 180], [350, 500], [650, 500]]
      .forEach(([x, y]) => pills.create(x, y, 'pill'));
    this.physics.add.overlap(this.player, pills, (_player, pill) => {
      pill.destroy();
      this.pk.administerDose(PILL_DOSE);
    });

    this.gauge = this.add.graphics();
    this.drawGauge();
  }

  createTextures() {
    const tex = this.add.graphics();
    tex.fillStyle(0x3399ff, 1);
    tex.fillRect(0, 0, 32, 48);
    tex.generateTexture('player', 32, 48);
    tex.clear();
    tex.fillStyle(0x555555, 1);
    tex.fillRect(0, 0, 100, 20);
    tex.generateTexture('platform', 100, 20);
    tex.clear();
    tex.fillStyle(0xffffff, 1);
    tex.fillCircle(8, 8, 8);
    tex.fillStyle(0xff66aa, 1);
    tex.fillCircle(8, 8, 5);
    tex.generateTexture('pill', 16, 16);
    tex.destroy();
  }

  update(time, delta) {
    const dt = Math.min(delta, MAX_DELTA_MS);
    const { player, cursors } = this;

    if (cursors.left.isDown) player.setVelocityX(-PLAYER.speed);
    else if (cursors.right.isDown) player.setVelocityX(PLAYER.speed);
    else player.setVelocityX(0);

    if (cursors.up.isDown && player.body.blocked.down) {
      player.setVelocityY(PLAYER.jumpVelocity);
    }

    this.pk.update(dt);

    // Solo redibujar si el valor cambió visiblemente
    const rounded = Math.round(this.pk.concentration * 10);
    if (rounded !== this.lastGaugeValue) {
      this.lastGaugeValue = rounded;
      this.drawGauge();
    }
  }

  valueToY(value) {
    const v = Phaser.Math.Clamp(value, 0, GAUGE.maxValue);
    return GAUGE.y + GAUGE.height * (1 - v / GAUGE.maxValue);
  }

  drawGauge() {
    const g = this.gauge;
    const pk = this.pk;
    g.clear();

    g.fillStyle(0x222222, 1);
    g.fillRect(GAUGE.x, GAUGE.y, GAUGE.width, GAUGE.height);

    // Ventana terapéutica (verde)
    const yMax = this.valueToY(pk.therapeuticMax);
    const yMin = this.valueToY(pk.therapeuticMin);
    g.fillStyle(0x00aa44, 0.5);
    g.fillRect(GAUGE.x, yMax, GAUGE.width, yMin - yMax);

    // Zona de sobredosis (rojo)
    const yTox = this.valueToY(pk.toxicLevel);
    g.fillStyle(0xcc0000, 0.5);
    g.fillRect(GAUGE.x, GAUGE.y, GAUGE.width, yTox - GAUGE.y);

    // Nivel actual
    const c = pk.concentration;
    let color = 0x888888;
    if (c >= pk.toxicLevel) color = 0xff2222;
    else if (c >= pk.therapeuticMin && c <= pk.therapeuticMax) color = 0x00ff66;
    const yC = this.valueToY(c);
    g.fillStyle(color, 1);
    g.fillRect(GAUGE.x + 8, yC, GAUGE.width - 16, GAUGE.y + GAUGE.height - yC);

    g.lineStyle(2, 0xffffff, 1);
    g.strokeRect(GAUGE.x, GAUGE.y, GAUGE.width, GAUGE.height);
  }
}
