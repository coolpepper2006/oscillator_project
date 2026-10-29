import { OscillatorModel, validateParams } from '../js/core/OscillatorModel.js';

function assert(condition, message) { if (!condition) throw new Error(`FAILED: ${message}`); }
const base = { v0: 1, alpha: 1, beta: 9, duration: 1, dt: 0.01, method: 'verlet' };
const model = new OscillatorModel(base);
const points = model.simulate();
assert(points.length === 101, 'Verlet returns initial point and all steps');
assert(points[0].x === 0 && points[0].v === 1, 'initial conditions are applied');
assert(points.every(p => Number.isFinite(p.x) && Number.isFinite(p.v) && Number.isFinite(p.energy)), 'all result values are finite');
assert(validateParams(base) === '', 'valid parameters pass validation');
assert(validateParams({ ...base, dt: 0 }) !== '', 'zero time step is rejected');
for (const method of ['euler', 'eulerCromer', 'richardson', 'verlet']) {
  const data = new OscillatorModel({ ...base, method }).simulate();
  assert(data.length === points.length, `${method} produces the expected number of points`);
}
const shortFinalStep = new OscillatorModel({ ...base, duration: 0.105, dt: 0.01 }).simulate();
assert(Math.abs(shortFinalStep[shortFinalStep.length - 1].t - 0.105) < 1e-12, 'last time equals duration even for a partial final step');
console.log('All core tests passed.');
