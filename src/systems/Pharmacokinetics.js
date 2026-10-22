// Límites de la ventana terapéutica (unidades arbitrarias de concentración)
export const THERAPEUTIC_MIN = 20;
export const THERAPEUTIC_MAX = 60;
export const TOXIC_LEVEL = 80;

export default class Pharmacokinetics {
  /**
   * @param {object} [options]
   * @param {number} [options.ke=0.1] Constante de eliminación (1/s).
   * @param {number} [options.concentration=0] Concentración inicial.
   */
  constructor({ ke = 0.1, concentration = 0 } = {}) {
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

