import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  renderBarChart,
  renderPieChart,
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

// ---------------- Load All Data ----------------
async function loadAllData() {
  const snap = await getDocs(query(collection(db, "submissions"), orderBy("submitted_at", "desc")));
  ALL_RECORDS = snap.docs.map(d => d.data());
}

// ---------------- Department Report UI ----------------
function renderDepartmentReportForm(container) {
  const depts = [...new Set(ALL_RECORDS.map(r => r.department).filter(Boolean))];

  container.innerHTML = `
    <h2>📄 Department Summary Reports</h2>

    <div class="report-form">
      <label>Department</label>
      <select id="repDept">
        ${depts.map(d => `<option value="${d}">${d}</option>`).join("")}
      </select>

      <label>Period</label>
      <select id="repPeriod">
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="annual">Annual</option>
      </select>

      <label>Select Date</label>
      <input type="date" id="repDate"/>

      <div class="report-actions">
        <button class="btn" id="genReportBtn">Generate Report</button>
        <button class="btn" id="pdfReportBtn" disabled>Download PDF</button>
      </div>
    </div>

    <pre id="reportPreview" class="report-preview"></pre>
  `;

  document.getElementById("genReportBtn").onclick = generateDepartmentReport;
  document.getElementById("pdfReportBtn").onclick = downloadReportPDF;
}

// ---------------- Generate Report ----------------
function generateDepartmentReport() {
  const dept = repDept.value;
  const period = repPeriod.value;
  const date = new Date(repDate.value);

  const filtered = ALL_RECORDS.filter(r => {
    if (r.department !== dept) return false;
    const d = r.submitted_at.toDate();

    if (period === "daily") return d.toDateString() === date.toDateString();
    if (period === "weekly") return getWeek(d) === getWeek(date);
    if (period === "monthly") return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    if (period === "annual") return d.getFullYear() === date.getFullYear();
  });

  const byForm = groupBy(filtered, r => r.form_title || r.form_id || "Unknown Form");
  const summary = {};

  Object.keys(byForm).forEach(form => {
    summary[form] = {
      totalSubmissions: byForm[form].length
    };
  });

  CURRENT_REPORT = {
    department: dept,
    period,
    totalSubmissions: filtered.length,
    forms: summary
  };

  let output = `DEPARTMENT: ${dept}\nPERIOD: ${period.toUpperCase()}\nTOTAL SUBMISSIONS: ${filtered.length}\n\n`;

  Object.keys(summary).forEach(f => {
    output += `📝 ${f}\n   Total Submissions: ${summary[f].totalSubmissions}\n\n`;
  });

  reportPreview.textContent = output;
  pdfReportBtn.disabled = false;
}

// ---------------- PDF Export ----------------
function downloadReportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;
  doc.text(`Department Report: ${CURRENT_REPORT.department}`, 10, y);
  y += 10;

  doc.text(`Period: ${CURRENT_REPORT.period}`, 10, y);
  y += 10;

  doc.text(`Total Submissions: ${CURRENT_REPORT.totalSubmissions}`, 10, y);
  y += 10;

  Object.keys(CURRENT_REPORT.forms).forEach(form => {
    y += 10;
    doc.text(`Form: ${form}`, 10, y);
    y += 7;
    doc.text(`Total Submissions: ${CURRENT_REPORT.forms[form].totalSubmissions}`, 14, y);
  });

  doc.save(`${CURRENT_REPORT.department}_report.pdf`);
}

// ---------------- Entry ----------------
export async function loadReports(container) {
  container.innerHTML = "<p>Loading reports...</p>";
  await loadAllData();

  container.innerHTML = `
    <div class="records-actions">
      <button id="r_reports" class="btn">📄 Dept Reports</button>
    </div>
    <div id="recordsView"></div>
  `;

  const view = document.getElementById("recordsView");
  document.getElementById("r_reports").onclick = () => renderDepartmentReportForm(view);

  renderDepartmentReportForm(view);
}
