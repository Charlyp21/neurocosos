import { PK } from '../config/balance.js';

// Reexportados por compatibilidad
export const THERAPEUTIC_MIN = PK.therapeuticMin;
export const THERAPEUTIC_MAX = PK.therapeuticMax;
export const TOXIC_LEVEL = PK.toxicLevel;
export const LETHAL_LEVEL = PK.lethalLevel;

/** Zonas de concentración. */
export const Zone = Object.freeze({
  SUB: 'SUB', // bajo la ventana terapéutica
  THERAPEUTIC: 'THERAPEUTIC',
  HIGH: 'HIGH', // sobre la ventana, aún no tóxico
  TOXIC: 'TOXIC',
  LETHAL: 'LETHAL'
});

/**
 * Modelo farmacocinético (lógica pura, sin dependencias de Phaser).
 * Eventos: 'zoneChange' (newZone, oldZone), 'dose' (amount).
 */
export default class Pharmacokinetics {
  /**
   * @param {object} [options]
   * @param {number} [options.ke] Constante de eliminación (1/s).
   * @param {number} [options.concentration] Concentración inicial (unidades abstractas 0-100).
   */
  constructor({ ke = PK.ke, concentration = PK.initialConcentration } = {}) {
    this.therapeuticMin = PK.therapeuticMin;
    this.therapeuticMax = PK.therapeuticMax;
    this.toxicLevel = PK.toxicLevel;
    this.lethalLevel = PK.lethalLevel;
    this.maxTimeBelowMin = PK.maxTimeBelowMin;
    this.timeRecoveryRate = PK.timeRecoveryRate;
    this.ke = ke;

    this.concentration = this._clamp(concentration);
    this.timeBelowMin = 0; // segundos acumulados
    this.timeAboveMax = 0; // segundos acumulados
    this.zone = this.getZone();
    this._listeners = {};
  }

  on(event, fn) {
    (this._listeners[event] ||= []).push(fn);
    return this;
  }

  off(event, fn) {
    const list = this._listeners[event];
    if (list) this._listeners[event] = list.filter((f) => f !== fn);
    return this;
  }

  _emit(event, ...args) {
    const list = this._listeners[event];
    if (list) for (let i = 0; i < list.length; i++) list[i](...args);
  }

  _clamp(value) {
    return Math.min(Math.max(value, 0), this.lethalLevel);
  }

  /** Zona correspondiente a la concentración actual. */
  getZone() {
    const c = this.concentration;
    if (c >= this.lethalLevel) return Zone.LETHAL;
    if (c >= this.toxicLevel) return Zone.TOXIC;
    if (c > this.therapeuticMax) return Zone.HIGH;
    if (c >= this.therapeuticMin) return Zone.THERAPEUTIC;
    return Zone.SUB;
  }

  /**
   * Eliminación de primer orden: C(t + dt) = C(t) * exp(-ke * dt)
   * y actualización de acumuladores de tiempo.
   * @param {number} delta Tiempo transcurrido en milisegundos (como en Phaser).
   */
  update(delta) {
    const dt = delta / 1000;
    this.concentration *= Math.exp(-this.ke * dt);
    this._updateAccumulators(dt);
    this._refreshZone();
  }

  /**
   * Añade una dosis (bolo instantáneo) a la concentración.
   * @param {number} amount
   */
  administerDose(amount) {
    this.concentration = this._clamp(this.concentration + amount);
    this._emit('dose', amount);
    this._refreshZone();
  }

  _updateAccumulators(dt) {
    const zone = this.getZone();
    const recovery = dt * this.timeRecoveryRate;

    if (zone === Zone.SUB) this.timeBelowMin += dt;
    else this.timeBelowMin = Math.max(0, this.timeBelowMin - recovery);

    if (zone === Zone.HIGH || zone === Zone.TOXIC || zone === Zone.LETHAL) {
      this.timeAboveMax += dt;
    } else {
      this.timeAboveMax = Math.max(0, this.timeAboveMax - recovery);
    }
  }

  _refreshZone() {
    const zone = this.getZone();
    if (zone !== this.zone) {
      const old = this.zone;
      this.zone = zone;
      this._emit('zoneChange', zone, old);
    }
  }
}
