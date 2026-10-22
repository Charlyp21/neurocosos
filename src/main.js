import './style.css';
import Phaser from 'phaser';
import Pharmacokinetics from './systems/Pharmacokinetics.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#050505',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 600 },
      debug: false
    }
  },
  scene: {
    preload,
    create,
    update
  }
};

const game = new Phaser.Game(config);

// Medidor de concentración plasmática (esquina superior derecha)
const GAUGE = { x: 740, y: 20, width: 40, height: 200, maxValue: 100 };
let pk;
let gaugeGraphics;
let player;
let cursors;

function valueToY(value) {
  const v = Phaser.Math.Clamp(value, 0, GAUGE.maxValue);
  return GAUGE.y + GAUGE.height * (1 - v / GAUGE.maxValue);
}

function drawGauge() {
  const g = gaugeGraphics;
  g.clear();

  // Fondo
  g.fillStyle(0x222222, 1);
  g.fillRect(GAUGE.x, GAUGE.y, GAUGE.width, GAUGE.height);

  // Ventana terapéutica (verde)
  const yMax = valueToY(pk.therapeuticMax);
  const yMin = valueToY(pk.therapeuticMin);
  g.fillStyle(0x00aa44, 0.5);
  g.fillRect(GAUGE.x, yMax, GAUGE.width, yMin - yMax);

  // Zona de sobredosis (rojo)
  const yTox = valueToY(pk.toxicLevel);
  g.fillStyle(0xcc0000, 0.5);
  g.fillRect(GAUGE.x, GAUGE.y, GAUGE.width, yTox - GAUGE.y);

  // Nivel actual
  const c = pk.concentration;
  let color = 0x888888;
  if (c >= pk.toxicLevel) color = 0xff2222;
  else if (c >= pk.therapeuticMin && c <= pk.therapeuticMax) color = 0x00ff66;
  const yC = valueToY(c);
  g.fillStyle(color, 1);
  g.fillRect(GAUGE.x + 8, yC, GAUGE.width - 16, GAUGE.y + GAUGE.height - yC);

  // Borde
  g.lineStyle(2, 0xffffff, 1);
  g.strokeRect(GAUGE.x, GAUGE.y, GAUGE.width, GAUGE.height);
}

function preload() {}

function create() {
  this.add.text(20, 20, 'Farmacocinética: Test de Ventana Terapéutica', {
    fontSize: '20px',
    color: '#00ffcc',
    fontFamily: 'monospace'
  });

  pk = new Pharmacokinetics();
  gaugeGraphics = this.add.graphics();

  this.add.text(20, 50, 'Flechas: mover/saltar. Recoge pastillas', {
    fontSize: '14px',
    color: '#888888',
    fontFamily: 'monospace'
  });

  // Texturas generadas por código
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

  // Plataformas estáticas
  const platforms = this.physics.add.staticGroup();
  platforms.create(400, 590, 'platform').setScale(8, 1).refreshBody(); // suelo
  platforms.create(200, 450, 'platform');
  platforms.create(450, 350, 'platform');
  platforms.create(650, 250, 'platform');
  platforms.create(150, 250, 'platform');

  // Jugador
  player = this.physics.add.sprite(100, 500, 'player');
  player.setCollideWorldBounds(true);
  this.physics.add.collider(player, platforms);
  cursors = this.input.keyboard.createCursorKeys();

  // Pastillas coleccionables
  const pills = this.physics.add.group({ allowGravity: false, immovable: true });
  [[200, 410], [450, 310], [650, 210], [150, 210], [350, 550], [600, 550]]
    .forEach(([x, y]) => pills.create(x, y, 'pill'));
  this.physics.add.overlap(player, pills, (_player, pill) => {
    pill.destroy();
    pk.administerDose(30);
  });
}

function update(time, delta) {
  if (cursors.left.isDown) player.setVelocityX(-200);
  else if (cursors.right.isDown) player.setVelocityX(200);
  else player.setVelocityX(0);

  if (cursors.up.isDown && player.body.blocked.down) player.setVelocityY(-420);

  pk.update(delta);
  drawGauge();
}
