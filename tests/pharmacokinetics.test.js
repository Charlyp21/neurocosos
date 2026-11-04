import { test } from 'node:test';
import assert from 'node:assert/strict';
import Pharmacokinetics, { Zone } from '../src/systems/Pharmacokinetics.js';
import ConditionSystem, { GameState, LoseReason } from '../src/systems/ConditionSystem.js';
import { PK, PILL_DOSE } from '../src/config/balance.js';

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('decaimiento de primer orden coincide con la fórmula', () => {
  const pk = new Pharmacokinetics({ ke: 0.1, concentration: 50 });
  pk.update(2000);
  near(pk.concentration, 50 * Math.exp(-0.2));
});

test('es independiente del tamaño del paso (determinista)', () => {
  const a = new Pharmacokinetics({ ke: 0.05, concentration: 70 });
  const b = new Pharmacokinetics({ ke: 0.05, concentration: 70 });
  a.update(10000);
  for (let i = 0; i < 1000; i++) b.update(10);
  near(a.concentration, b.concentration, 1e-9);
});

test('la vida media coincide con ln2/ke', () => {
  const pk = new Pharmacokinetics({ concentration: 80 });
  pk.update((Math.LN2 / pk.ke) * 1000);
  near(pk.concentration, 40, 1e-6);
});

test('administerDose suma y satura en lethalLevel', () => {
  const pk = new Pharmacokinetics({ concentration: 10 });
  pk.administerDose(20);
  near(pk.concentration, 30);
  pk.administerDose(1000);
  assert.equal(pk.concentration, PK.lethalLevel);
  assert.equal(pk.zone, Zone.LETHAL);
});

test('zonas en los límites', () => {
  const z = (c) => new Pharmacokinetics({ concentration: c }).getZone();
  assert.equal(z(PK.therapeuticMin - 0.1), Zone.SUB);
  assert.equal(z(PK.therapeuticMin), Zone.THERAPEUTIC);
  assert.equal(z(PK.therapeuticMax), Zone.THERAPEUTIC);
  assert.equal(z(PK.therapeuticMax + 0.1), Zone.HIGH);
  assert.equal(z(PK.toxicLevel), Zone.TOXIC);
  assert.equal(z(PK.lethalLevel), Zone.LETHAL);
});

test('zoneChange se emite solo al cambiar de zona', () => {
  const pk = new Pharmacokinetics({ concentration: 30 });
  const events = [];
  pk.on('zoneChange', (n, o) => events.push([o, n]));
  pk.update(16);
  pk.update(16);
  assert.equal(events.length, 0);
  pk.administerDose(PK.therapeuticMax); // 30 + 60 = 90 -> TOXIC
  assert.deepEqual(events, [[Zone.THERAPEUTIC, Zone.TOXIC]]);
});

test('timeBelowMin acumula en SUB y se recupera en rango', () => {
  const pk = new Pharmacokinetics({ concentration: 5, ke: 0 });
  pk.update(4000);
  near(pk.timeBelowMin, 4);
  pk.administerDose(30);
  pk.update(1000);
  near(pk.timeBelowMin, 4 - PK.timeRecoveryRate);
  pk.update(10000);
  assert.equal(pk.timeBelowMin, 0);
});

test('timeAboveMax acumula sobre la ventana', () => {
  const pk = new Pharmacokinetics({ concentration: 70, ke: 0 });
  pk.update(3000);
  near(pk.timeAboveMax, 3);
});

test('derrota por subdosificación tras maxTimeBelowMin', () => {
  const pk = new Pharmacokinetics({ concentration: 5, ke: 0 });
  const cs = new ConditionSystem(pk);
  let result;
  cs.onEnd((s, r) => (result = [s, r]));
  for (let i = 0; i < 25 * 60; i++) { pk.update(1000 / 60); cs.update(); }
  assert.deepEqual(result, [GameState.LOST, LoseReason.UNDERMEDICATED]);
});

test('derrota por sobredosis letal y no se reevalúa', () => {
  const pk = new Pharmacokinetics({ concentration: 50 });
  const cs = new ConditionSystem(pk);
  let calls = 0;
  cs.onEnd(() => calls++);
  pk.administerDose(100);
  cs.update();
  assert.equal(cs.state, GameState.LOST);
  assert.equal(cs.reason, LoseReason.OVERDOSE);
  cs.win();
  cs.update();
  assert.equal(cs.state, GameState.LOST);
  assert.equal(calls, 1);
});

test('victoria al llegar a la meta', () => {
  const cs = new ConditionSystem(new Pharmacokinetics());
  cs.win();
  assert.equal(cs.state, GameState.WON);
});

test('balance: una pastilla en el mínimo no es letal, dos seguidas desde el mínimo tampoco', () => {
  const pk = new Pharmacokinetics({ concentration: PK.therapeuticMin });
  pk.administerDose(PILL_DOSE);
  pk.administerDose(PILL_DOSE);
  assert.notEqual(pk.zone, Zone.LETHAL);
});

test('balance: tiempo de ventana a partir de una pastilla en el mínimo (~10-20 s)', () => {
  const pk = new Pharmacokinetics({ concentration: PK.therapeuticMin });
  pk.administerDose(PILL_DOSE);
  let t = 0;
  while (pk.concentration >= PK.therapeuticMin) { pk.update(100); t += 0.1; }
  assert.ok(t > 10 && t < 20, `t=${t}`);
});

test('la sobredosis letal se detecta aunque update() decaiga en el mismo frame', () => {
  const pk = new Pharmacokinetics({ concentration: 90 });
  const cs = new ConditionSystem(pk);
  pk.administerDose(PILL_DOSE); // satura a 100
  pk.update(16); // decae a <100 antes de cs.update()
  cs.update();
  assert.equal(cs.state, GameState.LOST);
  assert.equal(cs.reason, LoseReason.OVERDOSE);
});
