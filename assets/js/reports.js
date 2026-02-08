import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { renderBarChart, renderPieChart, renderLineChart, renderDoughnutChart } from "./chart.js";

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

// ---------------- Load Data ----------------
async function loadAllData() {
  const snap = await getDocs(query(collection(db, "submissions"), orderBy("submitted_at", "desc")));
  ALL_RECORDS = snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

// ---------------- Overview ----------------
function renderOverview(container) {
  const total = ALL_RECORDS.length;
  const gender = { Male: 0, Female: 0 };
  const byDept = groupBy(ALL_RECORDS, "department");
  const byMonth = groupBy(ALL_RECORDS, r => r.submitted_at.toDate().toISOString().slice(0, 7));

  ALL_RECORDS.forEach(r => {
    const g = r.gender_of_child || r.gender;
    if (g === "Male") gender.Male++;
    if (g === "Female") gender.Female++;
  });

  container.innerHTML = `
    <h2 class="text-2xl font-bold mb-6">📊 Executive Overview</h2>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
      <div class="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
        <h3 class="text-sm font-bold text-gray-400 uppercase mb-2">Total Records</h3>
        <p class="text-3xl font-extrabold text-gray-900">${total}</p>
      </div>
      <div class="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
        <h3 class="text-sm font-bold text-gray-400 uppercase mb-2">Departments</h3>
        <p class="text-3xl font-extrabold text-gray-900">${Object.keys(byDept).length}</p>
      </div>
      <div class="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
        <h3 class="text-sm font-bold text-gray-400 uppercase mb-2">Male</h3>
        <p class="text-3xl font-extrabold text-gray-900">${gender.Male}</p>
      </div>
      <div class="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
        <h3 class="text-sm font-bold text-gray-400 uppercase mb-2">Female</h3>
        <p class="text-3xl font-extrabold text-gray-900">${gender.Female}</p>
      </div>
    </div>
    <div class="bg-white p-6 rounded-2xl shadow mb-10">
      <canvas id="overviewLine" class="w-full h-80"></canvas>
    </div>
  `;

  renderLineChart(
    "overviewLine",
    Object.keys(byMonth),
    Object.values(byMonth).map(v => v.length),
    "Submissions Over Time"
  );
}

// ---------------- Department Reports ----------------
function renderDepartmentReportForm(container) {
  const depts = [...new Set(ALL_RECORDS.map(r => r.department).filter(Boolean))];
  let selectedDept = depts[0] || "";

  const getFormsForDept = () => {
    const forms = ALL_RECORDS.filter(r => r.department === selectedDept).map(r => r.form_title || r.form_id);
    return ["All Forms", ...[...new Set(forms)]];
  };

  container.innerHTML = `
    <h2 class="text-2xl font-bold mb-6">📄 Department Summary Reports</h2>
    <div class="bg-white p-6 rounded-2xl shadow grid gap-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block font-bold text-gray-500 uppercase text-xs mb-1">Department</label>
          <select id="repDept" class="w-full border border-gray-300 rounded-lg p-2">
            ${depts.map(d => `<option value="${d}">${d}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="block font-bold text-gray-500 uppercase text-xs mb-1">Form</label>
          <select id="repForm" class="w-full border border-gray-300 rounded-lg p-2"></select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block font-bold text-gray-500 uppercase text-xs mb-1">Period</label>
          <select id="repPeriod" class="w-full border border-gray-300 rounded-lg p-2">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
        <div>
          <label class="block font-bold text-gray-500 uppercase text-xs mb-1">Date</label>
          <input type="date" id="repDate" class="w-full border border-gray-300 rounded-lg p-2"/>
        </div>
        <div class="flex items-end space-x-4">
          <button id="genReportBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition">Generate Report</button>
          <button id="pdfReportBtn" disabled class="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-bold transition">Download PDF</button>
        </div>
      </div>
    </div>

    <pre id="reportPreview" class="bg-gray-50 p-6 rounded-2xl shadow mb-6 max-h-80 overflow-y-auto"></pre>
    <div class="bg-white p-6 rounded-2xl shadow">
      <canvas id="reportChart" class="w-full h-80"></canvas>
    </div>
  `;

  const repDept = document.getElementById("repDept");
  const repForm = document.getElementById("repForm");

  const populateForms = () => {
    repForm.innerHTML = getFormsForDept().map(f => `<option value="${f}">${f}</option>`).join("");
  };

  populateForms();
  repDept.onchange = () => { selectedDept = repDept.value; populateForms(); };
  document.getElementById("genReportBtn").onclick = () => generateDepartmentReport(selectedDept);
  document.getElementById("pdfReportBtn").onclick = downloadReportPDF;
}

// ---------------- Generate Report ----------------
function generateDepartmentReport(department) {
  const repDept = document.getElementById("repDept").value;
  const repForm = document.getElementById("repForm").value;
  const period = document.getElementById("repPeriod").value;
  const date = new Date(document.getElementById("repDate").value);

  let filtered = ALL_RECORDS.filter(r => r.department === repDept);
  if (repForm !== "All Forms") filtered = filtered.filter(r => r.form_title === repForm || r.form_id === repForm);

  filtered = filtered.filter(r => {
    const d = r.submitted_at.toDate();
    if (period === "daily") return d.toDateString() === date.toDateString();
    if (period === "weekly") return getWeek(d) === getWeek(date);
    if (period === "monthly") return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    if (period === "annual") return d.getFullYear() === date.getFullYear();
  });

  const byForm = groupBy(filtered, r => r.form_title || r.form_id || "Unknown");
  const summary = {};
  Object.keys(byForm).forEach(f => { summary[f] = { totalSubmissions: byForm[f].length }; });

  CURRENT_REPORT = { department: repDept, period, totalSubmissions: filtered.length, forms: summary };

  let output = `DEPARTMENT: ${repDept}\nPERIOD: ${period.toUpperCase()}\nTOTAL SUBMISSIONS: ${filtered.length}\n\n`;
  Object.keys(summary).forEach(f => {
    output += `📝 ${f}\n   Total Submissions: ${summary[f].totalSubmissions}\n\n`;
  });

  document.getElementById("reportPreview").textContent = output;
  renderBarChart("reportChart", Object.keys(summary), Object.values(summary).map(s => s.totalSubmissions), "Form Submissions");

  document.getElementById("pdfReportBtn").disabled = false;
}

// ---------------- PDF Export ----------------
function downloadReportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text(`Department Report: ${CURRENT_REPORT.department}`, 10, 10);
  doc.text(`Period: ${CURRENT_REPORT.period}`, 10, 20);
  doc.text(`Total Submissions: ${CURRENT_REPORT.totalSubmissions}`, 10, 30);
  let y = 40;
  Object.keys(CURRENT_REPORT.forms).forEach(f => {
    doc.text(`Form: ${f}`, 10, y); y += 6;
    doc.text(`Total Submissions: ${CURRENT_REPORT.forms[f].totalSubmissions}`, 14, y); y += 10;
  });
  doc.save(`${CURRENT_REPORT.department}_report.pdf`);
}

// ---------------- Entry ----------------
export async function loadReports(container) {
  container.innerHTML = "<p class='text-gray-500'>Loading reports...</p>";
  await loadAllData();

  container.innerHTML = `
    <div class="flex flex-wrap gap-4 mb-6">
      <button id="r_overview" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition">📊 Overview</button>
      <button id="r_reports" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition">📄 Dept Reports</button>
      <button id="r_charts" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition">📈 Charts</button>
    </div>
    <div id="recordsView"></div>
  `;

  const view = document.getElementById("recordsView");
  document.getElementById("r_overview").onclick = () => renderOverview(view);
  document.getElementById("r_reports").onclick = () => renderDepartmentReportForm(view);
  document.getElementById("r_charts").onclick = () => renderDepartmentReportForm(view); // charts reuse same form logic
  renderOverview(view);
}
