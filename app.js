const state = { grade: 'all', section: 'all' };
const weeks = Array.from({ length: 5 }, (_, i) => i + 1);
const rows = Array.isArray(window.REPORT_DATA) ? window.REPORT_DATA : [];
const $ = (selector) => document.querySelector(selector);

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  const toggle = $('#themeToggle');
  toggle.setAttribute('aria-pressed', String(isDark));
  toggle.setAttribute('aria-label', isDark ? 'Activar modo claro' : 'Activar modo oscuro');
  toggle.querySelector('.theme-icon').textContent = isDark ? '☀' : '☾';
  toggle.querySelector('.theme-label').textContent = isDark ? 'Modo claro' : 'Modo oscuro';
}

const savedTheme = localStorage.getItem('plan-lector-theme');
const preferredTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(preferredTheme);
$('#themeToggle').addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('plan-lector-theme', nextTheme);
  applyTheme(nextTheme);
});

function selectedRows() {
  return rows.filter((row) => (state.grade === 'all' || String(row.grade) === state.grade) && (state.section === 'all' || row.section === state.section));
}
function formatValue(value, suffix = '') { return value === null || value === undefined ? '—' : `${value}${suffix}`; }
function level(score) {
  if (score >= 18) return 'AD';
  if (score >= 14) return 'A';
  if (score >= 11) return 'B';
  if (score >= 0) return 'C';
  return null;
}

function updateSections() {
  const current = state.section;
  const sections = state.grade === 'all' ? [] : [...new Set(rows.filter((row) => String(row.grade) === state.grade).map((row) => row.section))].sort();
  $('#sectionFilter').innerHTML = '<option value="all">TODAS</option>' + sections.map((section) => `<option value="${section}">${section.split('° ')[1]}</option>`).join('');
  state.section = sections.includes(current) ? current : 'all';
  $('#sectionFilter').value = state.section;
}
$('#sectionFilter').addEventListener('change', (event) => { state.section = event.target.value; render(); });
$('#gradeFilter').innerHTML += [1, 2, 3, 4, 5].map((grade) => `<option value="${grade}">${grade} GRADO</option>`).join('');
$('#gradeFilter').addEventListener('change', (event) => { state.grade = event.target.value; updateSections(); render(); });
updateSections();
render();

function calculate() {
  const data = selectedRows();
  const averages = data.map((row) => row.average).filter((value) => typeof value === 'number');
  const counts = { AD: 0, A: 0, B: 0, C: 0 };
  averages.forEach((score) => { counts[level(score)] += 1; });
  return { data, averages, counts };
}
function renderSummary() {
  const { data, averages, counts } = calculate();
  const total = averages.length;
  $('#selectionMessage').textContent = state.grade === 'all' && state.section !== 'all' ? '⚠ Elige un grado para ver una letra en todo el colegio.' : data.length ? '✔ Selección válida — tablas actualizadas.' : '⚠ Combinación sin alumnos.';
  $('#achievementBody').innerHTML = [
    ['AD — Destacado', '18 a 20', counts.AD, 'Excelente', 'ad'],
    ['A — Esperado', '14 a 17', counts.A, 'Satisfactorio', 'a'],
    ['B — En Proceso', '11 a 13', counts.B, 'En proceso', 'b'],
    ['C — En Inicio', '00 a 10', counts.C, 'Requiere refuerzo', 'c']
  ].map(([name, range, count, interpretation, css]) => `<tr><td><span class="level-pill ${css}">${name.split(' ')[0]}</span>${name.substring(name.indexOf(' ') + 1)}</td><td>${range}</td><td>${count}</td><td>${total ? Math.round(count / total * 100) + '%' : '—'}</td><td>${interpretation}</td></tr>`).join('');
}
function renderWeekly() {
  const data = selectedRows();
  $('#weeklyBody').innerHTML = weeks.map((week) => {
    const scores = data.map((row) => row.scores[week - 1]).filter((value) => typeof value === 'number');
    const counts = { AD: 0, A: 0, B: 0, C: 0 };
    scores.forEach((score) => { counts[level(score)] += 1; });
    const average = scores.length ? (scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(1) : null;
    return `<tr><td><b>SEM ${week}</b></td><td><span class="status ${scores.length ? 'has-data' : ''}">${scores.length ? 'CON DATOS' : 'SIN DATOS'}</span></td><td>${scores.length || '—'}</td><td>${formatValue(average)}</td><td>${counts.AD || '—'}</td><td>${counts.A || '—'}</td><td>${counts.B || '—'}</td><td>${counts.C || '—'}</td><td>${scores.length ? Math.round((counts.AD + counts.A) / scores.length * 100) + '%' : '—'}</td></tr>`;
  }).join('');
}
function render() { renderSummary(); renderWeekly(); }
