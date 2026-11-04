import Phaser from 'phaser';
import Pharmacokinetics from '../systems/Pharmacokinetics.js';
import ConditionSystem, { GameState, LoseReason } from '../systems/ConditionSystem.js';
import InputController from '../systems/InputController.js';
import Player from '../entities/Player.js';
import createProceduralTextures from '../utils/proceduralTextures.js';
import { buildLevel, zoneAt, GROUND_TOP } from '../data/level1.js';
import {
  PILL_DOSE, MAX_DELTA_MS, GAME_WIDTH, GAME_HEIGHT, GROUND_HEIGHT, CAMERA
} from '../config/balance.js';

// Medidor de concentración plasmática (esquina superior derecha)
const GAUGE = { x: GAME_WIDTH - 60, y: 20, width: 40, height: 200, maxValue: 100 };
const DEBUG_INTERVAL_MS = 100;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    createProceduralTextures(this);
    const level = buildLevel();
    this.level = level;

    this.pk = new Pharmacokinetics();
    this.conditions = new ConditionSystem(this.pk);
    this.conditions.onEnd((state, reason) => this.onGameEnd(state, reason));
    this.lastGaugeValue = -1;
    this.debugTimer = 0;
    this.currentZoneId = null;

    this.createBackground();
    this.createWorld(level);
    this.createCamera(level);
    this.createHud();

    this.inputController = new InputController(this);
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.drawGauge();
  }

  // --- Construcción ---------------------------------------------------------

  createBackground() {
    const sky = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'bg_sky').setOrigin(0).setScrollFactor(0).setDepth(-30);
    this.layers = [
      { sprite: this.add.tileSprite(0, GAME_HEIGHT - 512, GAME_WIDTH, 512, 'bg_far').setOrigin(0).setScrollFactor(0).setDepth(-20), factor: 0.2 },
      { sprite: this.add.tileSprite(0, GAME_HEIGHT - 512, GAME_WIDTH, 512, 'bg_near').setOrigin(0).setScrollFactor(0).setDepth(-10), factor: 0.5 }
    ];
    this.sky = sky;
  }

  createWorld(level) {
    const W = level.worldWidth;
    this.physics.world.setBounds(0, 0, W, GAME_HEIGHT);

    const platforms = this.physics.add.staticGroup();
    const addSolid = (cx, top, w, h, texture) => {
      const ts = this.add.tileSprite(cx, top + h / 2, w, h, texture);
      this.physics.add.existing(ts, true);
      platforms.add(ts);
    };
    addSolid(W / 2, GROUND_TOP, W, GROUND_HEIGHT, 'ground_tile');
    for (const p of level.platforms) addSolid(p.x, p.y, p.w, p.h, 'platform_tile');

    this.player = new Player(this, level.spawn.x, level.spawn.y);
    this.physics.add.collider(this.player, platforms);

    const pills = this.physics.add.group({ allowGravity: false, immovable: true });
    for (const p of level.pills) pills.create(p.x, p.y, 'pill');
    this.physics.add.overlap(this.player, pills, (_player, pill) => {
      pill.destroy();
      this.pk.administerDose(PILL_DOSE);
    });

    const goal = this.physics.add.staticImage(level.goal.x, level.goal.y, 'goal');
    this.physics.add.overlap(this.player, goal, () => this.conditions.win());
  }

  createCamera(level) {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, level.worldWidth, GAME_HEIGHT);
    cam.startFollow(this.player, true, CAMERA.lerp, CAMERA.lerp);
    cam.setDeadzone(CAMERA.deadzoneW, CAMERA.deadzoneH);
    this.cam = cam;
  }

  /** Objeto de HUD: fijo a la pantalla, por encima del mundo. */
  hud(obj) {
    return obj.setScrollFactor(0).setDepth(50);
  }

  createHud() {
    const style = { fontFamily: 'monospace' };
    this.hud(this.add.text(20, 20, 'Neurocosos – prototipo', { ...style, fontSize: '20px', color: '#00ffcc' }));
    this.zoneText = this.hud(this.add.text(20, 48, '', { ...style, fontSize: '16px', color: '#ffffff' }));
    this.debugText = this.hud(this.add.text(20, 74, '', { ...style, fontSize: '12px', color: '#aaaaaa' }));
    this.hud(this.add.text(20, GAME_HEIGHT - 24, 'Flechas/WASD: mover y saltar · R: reiniciar', { ...style, fontSize: '12px', color: '#777777' }));
    this.gauge = this.hud(this.add.graphics());
  }

  // --- Bucle ----------------------------------------------------------------

  update(time, delta) {
    if (this.conditions.state !== GameState.PLAYING) return;
    const dt = Math.min(delta, MAX_DELTA_MS);

    this.inputController.update();
    this.player.tick(this.inputController, dt);

    this.pk.update(dt);
    this.conditions.update();

    this.updateCamera();
    this.updateParallax();
    this.updateZone();
    this.updateGauge();
    this.updateDebug(delta);
  }

  updateCamera() {
    // Mirada adelantada hacia la dirección del jugador
    const target = -this.player.facing * CAMERA.lookAhead;
    this.cam.followOffset.x += (target - this.cam.followOffset.x) * CAMERA.lookAheadLerp;
  }

  updateParallax() {
    const sx = this.cam.scrollX;
    for (let i = 0; i < this.layers.length; i++) {
      this.layers[i].sprite.tilePositionX = sx * this.layers[i].factor;
    }
  }

  updateZone() {
    const zone = zoneAt(this.player.x);
    if (zone.id !== this.currentZoneId) {
      this.currentZoneId = zone.id;
      this.zoneText.setText(`Zona: ${zone.name}`);
    }
  }

  updateGauge() {
    // Solo redibujar si el valor cambió visiblemente
    const rounded = Math.round(this.pk.concentration * 10);
    if (rounded !== this.lastGaugeValue) {
      this.lastGaugeValue = rounded;
      this.drawGauge();
    }
  }

  updateDebug(delta) {
    this.debugTimer += delta;
    if (this.debugTimer < DEBUG_INTERVAL_MS) return;
    this.debugTimer = 0;
    const pk = this.pk;
    this.debugText.setText(
      `FPS ${Math.round(this.game.loop.actualFps)}  x ${Math.round(this.player.x)}/${this.level.worldWidth}  ${this.player.moveState}\n` +
      `${pk.zone}  C ${pk.concentration.toFixed(1)}\n` +
      `bajo mín ${pk.timeBelowMin.toFixed(1)}/${pk.maxTimeBelowMin}s  sobre máx ${pk.timeAboveMax.toFixed(1)}s`
    );
  }

  // --- Fin de partida -------------------------------------------------------

  onGameEnd(state, reason) {
    this.physics.pause();
    this.player.setVelocity(0, 0);
    this.drawGauge();

    let title = '¡Llegaste a la escuela!';
    let detail = 'Mantuviste tu concentración bajo control.';
    if (state === GameState.LOST) {
      title = 'Game over';
      detail = reason === LoseReason.OVERDOSE
        ? 'Sobredosis: la concentración llegó al nivel máximo de toxicidad.'
        : 'Pasaste demasiado tiempo por debajo del umbral terapéutico.';
    }
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    this.hud(this.add.rectangle(cx, cy, GAME_WIDTH, 140, 0x000000, 0.8)).setDepth(60);
    this.hud(this.add.text(cx, cy - 30, title, { fontSize: '32px', color: '#ffffff', fontFamily: 'monospace' }).setOrigin(0.5)).setDepth(61);
    this.hud(this.add.text(cx, cy + 10, detail, { fontSize: '16px', color: '#cccccc', fontFamily: 'monospace' }).setOrigin(0.5)).setDepth(61);
    this.hud(this.add.text(cx, cy + 40, 'Presiona R para reiniciar', { fontSize: '14px', color: '#888888', fontFamily: 'monospace' }).setOrigin(0.5)).setDepth(61);
  }

  // --- Medidor --------------------------------------------------------------

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
