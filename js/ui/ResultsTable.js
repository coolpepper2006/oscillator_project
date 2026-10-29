let showAll = false;
let latestPoints = [];
const fmt = n => Number(n).toLocaleString('ru-RU', { maximumFractionDigits: 6 });

export function renderResults(points) {
  latestPoints = points;
  const body = document.getElementById('resultsBody');
  const total = points.length;
  const indices = getIndices(total, showAll ? total : 21);
  body.replaceChildren();
  if (!total) {
    const row = document.createElement('tr'); const cell = document.createElement('td'); cell.colSpan = 6; cell.className = 'empty-state'; cell.textContent = 'Нет данных.'; row.append(cell); body.append(row); return;
  }
  for (const index of indices) {
    const p = points[index]; const tr = document.createElement('tr');
    [index + 1, fmt(p.t), fmt(p.x), fmt(p.v), fmt(p.a), fmt(p.energy)].forEach(value => { const td = document.createElement('td'); td.textContent = value; tr.append(td); });
    body.append(tr);
  }
  document.getElementById('tableMeta').textContent = `${total.toLocaleString('ru-RU')} точек`;
  document.getElementById('tableRange').textContent = showAll ? `Показаны все ${total.toLocaleString('ru-RU')} точки` : `Показано ${indices.length} точек из ${total.toLocaleString('ru-RU')}`;
  document.getElementById('showAllButton').textContent = showAll ? 'Свернуть таблицу ↑' : 'Показать все точки ↓';
  document.getElementById('showAllButton').disabled = total <= 21;
}

function getIndices(total, count) {
  if (total <= count || count === total) return Array.from({ length: total }, (_, i) => i);
  const selected = new Set([0, total - 1]);
  for (let i = 1; i < count - 1; i++) selected.add(Math.round(i * (total - 1) / (count - 1)));
  return [...selected].sort((a, b) => a - b);
}

export function toggleShowAll() { showAll = !showAll; renderResults(latestPoints); }
export function exportCsv() {
  if (!latestPoints.length) return;
  const rows = [['index', 'time_s', 'position_x', 'velocity_v', 'acceleration_a', 'energy_per_mass'], ...latestPoints.map((p, i) => [i + 1, p.t, p.x, p.v, p.a, p.energy])];
  const csv = '\uFEFF' + rows.map(row => row.map(v => String(v).replaceAll('"', '""')).map(v => `"${v}"`).join(';')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'oscillator-results.csv'; a.click(); URL.revokeObjectURL(url);
}
