import { OscillatorModel, validateParams } from './core/OscillatorModel.js';
import { drawAllCharts } from './ui/Charts.js';
import { renderResults, toggleShowAll, exportCsv } from './ui/ResultsTable.js';

const $ = id => document.getElementById(id);
let currentPoints = [];
const DEFAULTS = { v0: 1, alpha: 1, beta: 9, duration: 4.8, dt: 0.01, method: 'verlet' };
const METHOD_NOTES = {
  verlet: 'Хорошо сохраняет энергию в консервативных системах.',
  eulerCromer: 'Простой метод, часто устойчивее обычного Эйлера для колебаний.',
  richardson: 'Использует оценку ускорения в середине шага для повышения точности.',
  euler: 'Простейший метод; при колебаниях может накапливать заметную ошибку энергии.'
};

function readParams() {
  return { v0: Number($('v0').value), alpha: Number($('alpha').value), beta: Number($('beta').value), duration: Number($('duration').value), dt: Number($('dt').value), method: $('method').value };
}
function updateMetrics(points) {
  const maxX = points.reduce((m, p) => Math.max(m, Math.abs(p.x)), 0);
  const maxV = points.reduce((m, p) => Math.max(m, Math.abs(p.v)), 0);
  const e0 = points[0]?.energy ?? 0;
  const eMaxError = points.reduce((m, p) => Math.max(m, Math.abs(p.energy - e0)), 0);
  const relative = e0 > 1e-14 ? eMaxError / e0 * 100 : eMaxError;
  $('metricX').textContent = maxX.toLocaleString('ru-RU', { maximumFractionDigits: 4 });
  $('metricV').textContent = maxV.toLocaleString('ru-RU', { maximumFractionDigits: 4 });
  $('metricE').textContent = `${relative.toLocaleString('ru-RU', { maximumFractionDigits: 3 })}%`;
  $('metricN').textContent = points.length.toLocaleString('ru-RU');
}
function calculate(event) {
  if (event) event.preventDefault();
  const params = readParams();
  const error = validateParams(params);
  $('formError').hidden = !error;
  $('formError').textContent = error;
  if (error) return;
  try {
    currentPoints = new OscillatorModel(params).simulate();
    drawAllCharts(currentPoints);
    renderResults(currentPoints);
    updateMetrics(currentPoints);
    $('formError').hidden = true;
  } catch (e) {
    $('formError').hidden = false;
    $('formError').textContent = e.message || 'Не удалось выполнить расчёт.';
  }
}
function setParams(params) {
  for (const [key, value] of Object.entries(params)) if ($(key)) $(key).value = value;
  $('methodNote').textContent = METHOD_NOTES[$('method').value];
  calculate();
}

$('paramsForm').addEventListener('submit', calculate);
$('method').addEventListener('change', () => { $('methodNote').textContent = METHOD_NOTES[$('method').value]; });
$('resetButton').addEventListener('click', () => setParams(DEFAULTS));
$('exportButton').addEventListener('click', exportCsv);
$('showAllButton').addEventListener('click', toggleShowAll);
document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.preset === 'book') setParams({ ...DEFAULTS, dt: 0.1, method: 'eulerCromer' });
  if (button.dataset.preset === 'linear') setParams({ ...DEFAULTS, beta: 0, dt: 0.01, method: 'verlet' });
}));
$('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const dark = document.body.classList.contains('dark');
  $('themeIcon').textContent = dark ? '☀' : '☾';
  $('themeToggle').setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
  try { localStorage.setItem('physlab-theme', dark ? 'dark' : 'light'); } catch {}
  requestAnimationFrame(() => drawAllCharts(currentPoints));
});
try {
  if (localStorage.getItem('physlab-theme') === 'dark') { document.body.classList.add('dark'); $('themeIcon').textContent = '☀'; }
} catch {}
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => drawAllCharts(currentPoints), 100); });
calculate();
