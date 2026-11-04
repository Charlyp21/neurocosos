import { Zone } from './Pharmacokinetics.js';

export const GameState = Object.freeze({
  PLAYING: 'PLAYING',
  WON: 'WON',
  LOST: 'LOST'
});

export const LoseReason = Object.freeze({
  OVERDOSE: 'OVERDOSE', // concentración letal
  UNDERMEDICATED: 'UNDERMEDICATED' // demasiado tiempo bajo el mínimo
});

/**
 * Reglas de victoria/derrota (lógica pura).
 * Evento: 'end' (state, reason).
 */
export default class ConditionSystem {
  /** @param {import('./Pharmacokinetics.js').default} pk */
  constructor(pk) {
    this.pk = pk;
    this.state = GameState.PLAYING;
    this.reason = null;
    this._listeners = [];
    // La zona letal se detecta al instante: la eliminación del mismo frame
    // podría bajar la concentración de nuevo antes de evaluar update().
    pk.on('zoneChange', (zone) => {
      if (zone === Zone.LETHAL) this._end(GameState.LOST, LoseReason.OVERDOSE);
    });
  }

  onEnd(fn) {
    this._listeners.push(fn);
    return this;
  }

  /** Evalúa derrota. Llamar después de pk.update(). */
  update() {
    if (this.state !== GameState.PLAYING) return;
    const { pk } = this;
    if (pk.zone === Zone.LETHAL) this._end(GameState.LOST, LoseReason.OVERDOSE);
    else if (pk.timeBelowMin >= pk.maxTimeBelowMin) {
      this._end(GameState.LOST, LoseReason.UNDERMEDICATED);
    }
  }

  /** El jugador llegó a la meta. */
  win() {
    if (this.state === GameState.PLAYING) this._end(GameState.WON, null);
  }

  _end(state, reason) {
    if (this.state !== GameState.PLAYING) return;
    this.state = state;
    this.reason = reason;
    for (const fn of this._listeners) fn(state, reason);
  }
}
