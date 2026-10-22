import Phaser from 'phaser';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
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

function preload() {}

function create() {
  this.add.text(20, 20, 'Farmacocinética: Test de Ventana Terapéutica', {
    fontSize: '18px',
    fill: '#ffffff'
  });
}

function update(time, delta) {}
