/** Core physics model for F/m = -alpha*x - beta*x^3. */
export class OscillatorModel {
  constructor({ v0 = 1, alpha = 1, beta = 9, duration = 4.8, dt = 0.01, method = 'verlet' } = {}) {
    this.params = { v0: Number(v0), alpha: Number(alpha), beta: Number(beta), duration: Number(duration), dt: Number(dt), method };
  }

  acceleration(x) {
    const { alpha, beta } = this.params;
    return -alpha * x - beta * x * x * x;
  }

  energy(x, v) {
    const { alpha, beta } = this.params;
    return 0.5 * v * v + 0.5 * alpha * x * x + 0.25 * beta * x * x * x * x;
  }

  simulate() {
    const { v0, duration, dt, method } = this.params;
    const steps = Math.ceil(duration / dt);
    if (!Number.isFinite(steps) || steps < 1 || steps > 500000) throw new Error('Слишком много шагов. Увеличьте шаг Δt или уменьшите время T.');
    const result = [];
    let x = 0, v = v0, t = 0;
    result.push(this.point(t, x, v));

    for (let i = 0; i < steps; i++) {
      const h = Math.min(dt, duration - t);
      if (h <= 0) break;
      const a = this.acceleration(x);
      if (method === 'euler') {
        x += v * h;
        v += a * h;
      } else if (method === 'eulerCromer') {
        v += a * h;
        x += v * h;
      } else if (method === 'richardson') {
        const halfV = v + 0.5 * a * h;
        const halfX = x + 0.5 * v * h;
        const midA = this.acceleration(halfX);
        x += halfV * h;
        v += midA * h;
      } else if (method === 'verlet') {
        const nextX = x + v * h + 0.5 * a * h * h;
        const nextA = this.acceleration(nextX);
        v += 0.5 * (a + nextA) * h;
        x = nextX;
      } else {
        throw new Error('Неизвестный численный метод.');
      }
      t = Math.min(duration, t + h);
      if (!Number.isFinite(x) || !Number.isFinite(v) || Math.abs(x) > 1e12 || Math.abs(v) > 1e12) {
        throw new Error('Численное решение стало неустойчивым. Попробуйте уменьшить шаг Δt.');
      }
      result.push(this.point(t, x, v));
    }
    return result;
  }

  point(t, x, v) {
    return { t, x, v, a: this.acceleration(x), energy: this.energy(x, v) };
  }
}

export function validateParams(params) {
  const checks = [
    ['v0', 'Начальная скорость', -100, 100],
    ['alpha', 'Линейная жёсткость α', 0.0001, 1000],
    ['beta', 'Нелинейность β', 0, 10000],
    ['duration', 'Время T', 0.1, 100],
    ['dt', 'Шаг Δt', 0.0001, 0.2]
  ];
  for (const [key, label, min, max] of checks) {
    const value = Number(params[key]);
    if (!Number.isFinite(value) || value < min || value > max) return `${label}: укажите число от ${min} до ${max}.`;
  }
  if (Math.ceil(params.duration / params.dt) > 500000) return 'Слишком много шагов расчёта. Увеличьте Δt или уменьшите T.';
  return '';
}
