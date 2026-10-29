const COLORS = { blue: '#3979f6', violet: '#8b6df0', mint: '#29b99b', amber: '#edaa3c' };
const css = (name, fallback) => getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;

export function drawChart(canvas, points, key, color, xKey = 't', xLabel = 't, с', yLabel = '') {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const ratio = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);
  const w = rect.width, h = rect.height;
  const pad = { left: 43, right: 12, top: 12, bottom: 30 };
  const plotW = w - pad.left - pad.right, plotH = h - pad.top - pad.bottom;
  const ink = css('--muted', '#718096'), grid = css('--line', '#e5ebf3');
  ctx.clearRect(0, 0, w, h);
  if (!points.length) return;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    const xv = p[xKey], yv = p[key];
    if (xv < minX) minX = xv; if (xv > maxX) maxX = xv;
    if (yv < minY) minY = yv; if (yv > maxY) maxY = yv;
  }
  if (Math.abs(maxX - minX) < 1e-12) { minX -= 1; maxX += 1; }
  if (Math.abs(maxY - minY) < 1e-12) { minY -= 1; maxY += 1; }
  const yPad = (maxY - minY) * .12; minY -= yPad; maxY += yPad;
  const sx = x => pad.left + (x - minX) / (maxX - minX) * plotW;
  const sy = y => pad.top + plotH - (y - minY) / (maxY - minY) * plotH;
  ctx.font = '10px DM Sans, Arial, sans-serif'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + plotH * i / 4;
    ctx.strokeStyle = grid; ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    const value = maxY - (maxY - minY) * i / 4;
    ctx.fillStyle = ink; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(formatTick(value), pad.left - 7, y);
  }
  for (let i = 0; i <= 4; i++) {
    const x = pad.left + plotW * i / 4;
    ctx.strokeStyle = grid; ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + plotH); ctx.stroke();
    const value = minX + (maxX - minX) * i / 4;
    ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(formatTick(value), x, pad.top + plotH + 7);
  }
  if (minY < 0 && maxY > 0) { ctx.strokeStyle = ink + '77'; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(pad.left, sy(0)); ctx.lineTo(w - pad.right, sy(0)); ctx.stroke(); ctx.setLineDash([]); }
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath();
  const stride = Math.max(1, Math.floor(points.length / 4500));
  for (let i = 0; i < points.length; i += stride) { const p = points[i]; const px = sx(p[xKey]), py = sy(p[key]); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
  const last = points[points.length - 1]; ctx.lineTo(sx(last[xKey]), sy(last[key])); ctx.stroke();
  ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(xLabel, pad.left + plotW / 2, h - 3);
  if (yLabel) { ctx.save(); ctx.translate(10, pad.top + plotH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(yLabel, 0, 0); ctx.restore(); }
}

export function drawAllCharts(points) {
  drawChart(document.getElementById('positionChart'), points, 'x', COLORS.blue, 't', 'Время, t', 'x');
  drawChart(document.getElementById('velocityChart'), points, 'v', COLORS.violet, 't', 'Время, t', 'v');
  drawChart(document.getElementById('phaseChart'), points, 'v', COLORS.mint, 'x', 'Координата, x', 'v');
  drawChart(document.getElementById('energyChart'), points, 'energy', COLORS.amber, 't', 'Время, t', 'E');
}

function formatTick(n) { const abs = Math.abs(n); return abs >= 1000 || (abs > 0 && abs < .01) ? n.toExponential(1) : Number(n.toFixed(2)).toString(); }
export { COLORS };
