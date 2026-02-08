// chart.js — Fully Tailwind + Dashboard Ready

const DEFAULT_COLORS = [
  '#2563eb', // blue-600
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#f97316'  // orange-500
];

// Destroy previous chart instance if exists
function destroyIfExists(ctx) {
  if (ctx && ctx._chart) ctx._chart.destroy();
}

// Create vertical gradient for line/bar charts
function createGradient(ctx, colorStart, colorEnd) {
  if (!ctx || !ctx.canvas) return colorStart;
  const h = ctx.canvas.height || 200;
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(1, colorEnd);
  return gradient;
}

// ----------------- Line Chart -----------------
export function renderLineChart(canvasId, labels, data, label = "", color = '#2563eb') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyIfExists(canvas);

  const ctx = canvas.getContext('2d');
  const gradient = createGradient(ctx, `${color}80`, `${color}05`);

  canvas._chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data,
        borderColor: color,
        backgroundColor: gradient,
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#fff',
        pointBorderColor: color,
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { 
          backgroundColor: '#0f172a',
          padding: 10,
          cornerRadius: 10,
          displayColors: false
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 10 }, color: '#94a3b8' } },
        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { weight: 'bold', size: 10 }, color: '#94a3b8' } }
      },
      interaction: { mode: 'nearest', intersect: false },
      animation: { duration: 900, easing: 'easeOutQuart' }
    }
  });
}

// ----------------- Bar Chart -----------------
export function renderBarChart(canvasId, labels, data, label = "", color = '#2563eb') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyIfExists(canvas);

  const ctx = canvas.getContext('2d');
  const gradient = createGradient(ctx, `${color}80`, `${color}10`);

  canvas._chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: gradient,
        borderRadius: 8,
        barThickness: 'flex',
        maxBarThickness: 30
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 10 }, color: '#94a3b8' } },
        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { weight: 'bold', size: 10 }, color: '#94a3b8' } }
      },
      animation: { duration: 800, easing: 'easeOutQuart' }
    }
  });
}

// ----------------- Pie Chart -----------------
export function renderPieChart(canvasId, labels, data, label = "") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyIfExists(canvas);

  const ctx = canvas.getContext('2d');
  canvas._chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: DEFAULT_COLORS,
        borderWidth: 0,
        hoverOffset: 20
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: 10, weight: 'bold' } } },
        tooltip: { padding: 8 }
      },
      animation: { animateRotate: true, animateScale: true }
    }
  });
}

// ----------------- Doughnut Chart -----------------
export function renderDoughnutChart(canvasId, labels, data, label = "") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyIfExists(canvas);

  const ctx = canvas.getContext('2d');
  canvas._chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: DEFAULT_COLORS,
        borderWidth: 0,
        hoverOffset: 20,
        cutout: '70%'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: 10, weight: 'bold' } } },
        tooltip: { padding: 8 }
      },
      animation: { animateRotate: true, animateScale: true }
    }
  });
}
