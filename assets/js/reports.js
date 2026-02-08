import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  renderBarChart,
  renderLineChart,
  renderDoughnutChart
} from "./chart.js";

const db = getFirestore();

let ALL_RECORDS = [];
let CURRENT_REPORT = null;

// ---------------- Helpers ----------------
function groupBy(arr, key) {
  return arr.reduce((acc, cur) => {
    const k = typeof key === "function" ? key(cur) : (cur[key] || "Unknown");
    acc[k] = acc[k] || [];
    acc[k].push(cur);
    return acc;
  }, {});
}

function getWeek(d) {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
}

function filterByPeriod(records, dept, period, date) {
  return records.filter(r => {
    if (r.department !== dept) return false;
    const d = r.submitted_at?.toDate ? r.submitted_at.toDate() : new Date(r.submitted_at);

    if (period === "daily") return d.toDateString() === date.toDateString();
    if (period === "weekly") return getWeek(d) === getWeek(date) && d.getFullYear() === date.getFullYear();
    if (period === "monthly") return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    if (period === "annual") return d.getFullYear() === date.getFullYear();
  });
}

// ---------------- Load Data ----------------
async function loadAllData() {
  const snap = await getDocs(query(collection(db, "submissions"), orderBy("submitted_at", "desc")));
  ALL_RECORDS = snap.docs.map(d => d.data());
}

// ---------------- Overview (ADDED ONLY) ----------------
function renderOverview(container) {
  const total = ALL_RECORDS.length;
  const byDept = groupBy(ALL_RECORDS, "department");

  container.innerHTML = `
    <h2>📊 Executive Overview</h2>

    <div class="stats-cards">
      <div class="card">
        <h3>Total Submissions</h3>
        <p>${total}</p>
      </div>
      <div class="card">
        <h3>Departments</h3>
        <p>${Object.keys(byDept).length}</p>
      </div>
    </div>

    <canvas id="overviewDeptChart"></canvas>
  `;

  renderBarChart(
    "overviewDeptChart",
    Object.keys(byDept),
    Object.values(byDept).map(v => v.length),
    "Submissions by Department"
  );
}

// ---------------- Dept Report Form ----------------
function renderDepartmentReportForm(container) {
  const depts = [...new Set(ALL_RECORDS.map(r => r.department).filter(Boolean))];

  container.innerHTML = `
    <h2>📄 Department Summary Reports</h2>

    <div class="report-form">
      <label>Department</label>
      <select id="repDept">${depts.map(d => `<option>${d}</option>`).join("")}</select>

      <label>Period</label>
      <select id="repPeriod">
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="annual">Annual</option>
      </select>

      <label>Date</label>
      <input type="date" id="repDate"/>

      <div class="report-actions">
        <button class="btn" id="genReportBtn">Generate Report</button>
        <button class="btn" id="pdfReportBtn" disabled>Download PDF</button>
      </div>
    </div>

    <pre id="reportPreview" class="report-preview"></pre>
  `;

  genReportBtn.onclick = generateDepartmentReport;
  pdfReportBtn.onclick = downloadReportPDF;
}

function generateDepartmentReport() {
  const dept = repDept.value;
  const period = repPeriod.value;
  const date = new Date(repDate.value);

  const filtered = filterByPeriod(ALL_RECORDS, dept, period, date);
  const byForm = groupBy(filtered, r => r.form_title || r.form_id || "Unknown Form");

  CURRENT_REPORT = { dept, period, total: filtered.length, byForm };

  let out = `DEPARTMENT: ${dept}\nPERIOD: ${period.toUpperCase()}\nTOTAL: ${filtered.length}\n\n`;

  Object.keys(byForm).forEach(f => {
    out += `📝 ${f}\n   Total Submissions: ${byForm[f].length}\n\n`;
  });

  reportPreview.textContent = out;
  pdfReportBtn.disabled = false;
}

// ---------------- Charts ----------------
function renderChartsSection(container) {
  const depts = [...new Set(ALL_RECORDS.map(r => r.department).filter(Boolean))];

  container.innerHTML = `
    <h2>📊 Department Charts</h2>

    <div class="report-form">
      <label>Department</label>
      <select id="chartDept">${depts.map(d => `<option>${d}</option>`).join("")}</select>

      <label>Period</label>
      <select id="chartPeriod">
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="annual">Annual</option>
      </select>

      <label>Date</label>
      <input type="date" id="chartDate"/>

      <button class="btn" id="genChartsBtn">Generate Charts</button>
    </div>

    <div class="charts-grid">
      <canvas id="chartByForm"></canvas>
      <canvas id="chartTrend"></canvas>
      <canvas id="chartShare"></canvas>
    </div>
  `;

  genChartsBtn.onclick = generateCharts;
}

function generateCharts() {
  const dept = chartDept.value;
  const period = chartPeriod.value;
  const date = new Date(chartDate.value);

  const filtered = filterByPeriod(ALL_RECORDS, dept, period, date);
  const byForm = groupBy(filtered, r => r.form_title || r.form_id || "Unknown Form");

  const labels = Object.keys(byForm);
  const values = Object.values(byForm).map(v => v.length);

  renderBarChart("chartByForm", labels, values, "Submissions by Form");
  renderDoughnutChart("chartShare", labels, values, "Form Share");

  const byDay = groupBy(filtered, r => {
    const d = r.submitted_at.toDate();
    return d.toISOString().split("T")[0];
  });

  renderLineChart("chartTrend", Object.keys(byDay), Object.values(byDay).map(v => v.length), "Trend");
}

// ---------------- PDF ----------------
function downloadReportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;
  doc.text(`Department: ${CURRENT_REPORT.dept}`, 10, y);
  y += 10;
  doc.text(`Period: ${CURRENT_REPORT.period}`, 10, y);
  y += 10;
  doc.text(`Total Submissions: ${CURRENT_REPORT.total}`, 10, y);

  Object.keys(CURRENT_REPORT.byForm).forEach(f => {
    y += 10;
    doc.text(`${f}: ${CURRENT_REPORT.byForm[f].length}`, 10, y);
  });

  doc.save(`${CURRENT_REPORT.dept}_${CURRENT_REPORT.period}_report.pdf`);
}

// ---------------- Public Entry ----------------
export async function loadReports(container) {
  container.innerHTML = "<p>Loading reports...</p>";
  await loadAllData();

  container.innerHTML = `
    <div class="records-actions">
      <button id="r_overview" class="btn">📊 Overview</button>
      <button id="r_forms" class="btn">📄 Dept Reports</button>
      <button id="r_charts" class="btn">📈 Charts</button>
    </div>
    <div id="recordsView"></div>
  `;

  const view = document.getElementById("recordsView");

  r_overview.onclick = () => renderOverview(view);
  r_forms.onclick = () => renderDepartmentReportForm(view);
  r_charts.onclick = () => renderChartsSection(view);

  renderOverview(view);
}
