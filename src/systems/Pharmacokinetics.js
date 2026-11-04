import { PK } from '../config/balance.js';

// Reexportados por compatibilidad
export const THERAPEUTIC_MIN = PK.therapeuticMin;
export const THERAPEUTIC_MAX = PK.therapeuticMax;
export const TOXIC_LEVEL = PK.toxicLevel;

export default class Pharmacokinetics {
  /**
   * @param {object} [options]
   * @param {number} [options.ke=0.03] Constante de eliminación (1/s).
   * @param {number} [options.concentration=40] Concentración inicial.
   */
  constructor({ ke = PK.ke, concentration = PK.initialConcentration } = {}) {
    this.therapeuticMin = THERAPEUTIC_MIN;
    this.therapeuticMax = THERAPEUTIC_MAX;
    this.toxicLevel = TOXIC_LEVEL;
    this.ke = ke;
    this.concentration = concentration;
  }

  /**
   * Eliminación de primer orden: C(t + dt) = C(t) * exp(-ke * dt)
   * @param {number} delta Tiempo transcurrido en milisegundos (como en Phaser).
   */
  update(delta) {
    const dt = delta / 1000;
    this.concentration *= Math.exp(-this.ke * dt);
  }

  /**
   * Añade una dosis (bolo instantáneo) a la concentración.
   * @param {number} amount
   */
  administerDose(amount) {
    this.concentration += amount;
  }
}

