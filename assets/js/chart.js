// chart.js
// Enhanced Chart.js helpers with safe gradients and dashboard style

function destroyIfExists(ctx) {
  if (ctx && ctx._chart) ctx._chart.destroy();
}

// ----------------- Gradient Helper -----------------
function createGradient(ctx, colorStart, colorEnd) {
  if (!ctx || !ctx.canvas) return colorStart;
  const h = ctx.canvas.height || 200; // fallback
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(1, colorEnd);
  return gradient;
}

// ----------------- Bar Chart -----------------
export function renderBarChart(canvasId, labels, data, title = "") {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  destroyIfExists(ctx);

  const gradient = createGradient(ctx, "rgba(13, 110, 253,0.7)", "rgba(13,110,253,0.3)");

  ctx._chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: title,
        data,
        backgroundColor: gradient,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: !!title, text: title }
      },
      interaction: { mode: 'nearest', intersect: true },
      animation: { duration: 800, easing: 'easeOutQuart' },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true }
      }
    }
  });
}

// ----------------- Pie Chart -----------------
export function renderPieChart(canvasId, labels, data, title = "") {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  destroyIfExists(ctx);

  const colors = data.map((_, i) => `hsl(${i*60},70%,60%)`);

  ctx._chart = new Chart(ctx, {
    type: "pie",
    data: { labels, datasets: [{ data, backgroundColor: colors }] },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        title: { display: !!title, text: title }
      },
      animation: { animateScale: true, animateRotate: true }
    }
  });
}

// ----------------- Doughnut Chart -----------------
export function renderDoughnutChart(canvasId, labels, data, title = "") {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  destroyIfExists(ctx);

  const colors = data.map((_, i) => `hsl(${i*72},65%,55%)`);

  ctx._chart = new Chart(ctx, {
    type: "doughnut",
    data: { labels, datasets: [{ data, backgroundColor: colors }] },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        title: { display: !!title, text: title }
      },
      animation: { animateScale: true, animateRotate: true }
    }
  });
}

// ----------------- Line Chart -----------------
export function renderLineChart(canvasId, labels, data, title = "") {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  destroyIfExists(ctx);

  const gradient = createGradient(ctx, "rgba(0, 123, 255,0.5)", "rgba(0,123,255,0.05)");

  ctx._chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: title,
        data,
        fill: true,
        backgroundColor: gradient,
        borderColor: "rgba(0,123,255,1)",
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: !!title, text: title }
      },
      interaction: { mode: 'nearest', intersect: false },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true }
      },
      animation: { duration: 900, easing: 'easeOutQuart' }
    }
  });
}
