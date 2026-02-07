// assets/js/chart.js
// Simple Chart.js helpers (no Firebase logic here)

function destroyIfExists(ctx) {
  if (ctx && ctx._chart) ctx._chart.destroy();
}

export function renderBarChart(canvasId, labels, data, title = "") {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  destroyIfExists(ctx);

  ctx._chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: title,
        data
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: !!title, text: title }
      }
    }
  });
}

export function renderPieChart(canvasId, labels, data, title = "") {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  destroyIfExists(ctx);

  ctx._chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{ data }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: !!title, text: title }
      }
    }
  });
}

export function renderDoughnutChart(canvasId, labels, data, title = "") {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  destroyIfExists(ctx);

  ctx._chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: !!title, text: title }
      }
    }
  });
}

export function renderLineChart(canvasId, labels, data, title = "") {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  destroyIfExists(ctx);

  ctx._chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: title,
        data,
        tension: 0.3,
        fill: false
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: !!title, text: title }
      }
    }
  });
}
