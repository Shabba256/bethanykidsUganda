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
  const oneJan = new Date(d.getFullYear(),0,1);
  return Math.ceil((((d - oneJan)/86400000) + oneJan.getDay() + 1)/7);
}

// ---------------- Load Data ----------------
async function loadAllData() {
  const snap = await getDocs(query(collection(db, "submissions"), orderBy("submitted_at","desc")));
  ALL_RECORDS = snap.docs.map(d => d.data());
}

// ---------------- Overview ----------------
function renderOverview(container) {
  const total = ALL_RECORDS.length;
  const gender = { Male:0,Female:0 };
  const byDept = groupBy(ALL_RECORDS,"department");
  const byMonth = groupBy(ALL_RECORDS,r => r.submitted_at.toDate().toISOString().slice(0,7));
  
  ALL_RECORDS.forEach(r => {
    const g = r.gender_of_child||r.gender;
    if(g==="Male") gender.Male++;
    if(g==="Female") gender.Female++;
  });

  container.innerHTML = `
    <h2>📊 Executive Overview</h2>
    <div class="stats-cards">
      <div class="card"><h3>Total Records</h3><p>${total}</p></div>
      <div class="card"><h3>Departments</h3><p>${Object.keys(byDept).length}</p></div>
      <div class="card"><h3>Male</h3><p>${gender.Male}</p></div>
      <div class="card"><h3>Female</h3><p>${gender.Female}</p></div>
    </div>
    <canvas id="overviewLine"></canvas>
  `;
  renderLineChart("overviewLine", Object.keys(byMonth), Object.values(byMonth).map(v=>v.length), "Submissions Over Time");
}

// ---------------- Department Reports ----------------
function renderDepartmentReportForm(container) {
  const depts = [...new Set(ALL_RECORDS.map(r=>r.department).filter(Boolean))];
  let selectedDept = depts[0] || "";

  const getFormsForDept = () => {
    const forms = ALL_RECORDS.filter(r=>r.department===selectedDept).map(r=>r.form_title||r.form_id);
    return ["All Forms", ...[...new Set(forms)]];
  };

  container.innerHTML = `
    <h2>📄 Department Summary Reports</h2>
    <div class="report-form">
      <label>Department</label>
      <select id="repDept">${depts.map(d=>`<option value="${d}">${d}</option>`).join("")}</select>
      <label>Form</label>
      <select id="repForm"></select>
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
    <canvas id="reportChart"></canvas>
  `;

  const repDept = document.getElementById("repDept");
  const repForm = document.getElementById("repForm");

  const populateForms = () => {
    repForm.innerHTML = getFormsForDept().map(f=>`<option value="${f}">${f}</option>`).join("");
  };

  populateForms();

  repDept.onchange = () => {
    selectedDept = repDept.value;
    populateForms();
  };

  document.getElementById("genReportBtn").onclick = () => generateDepartmentReport(selectedDept);
  document.getElementById("pdfReportBtn").onclick = downloadReportPDF;
}

// ---------------- Generate Report ----------------
function generateDepartmentReport(department) {
  const repDept = document.getElementById("repDept").value;
  const repForm = document.getElementById("repForm").value;
  const period = document.getElementById("repPeriod").value;
  const date = new Date(document.getElementById("repDate").value);

  let filtered = ALL_RECORDS.filter(r=>r.department===repDept);
  if(repForm!=="All Forms") filtered = filtered.filter(r=>r.form_title===repForm||r.form_id===repForm);

  filtered = filtered.filter(r=>{
    const d = r.submitted_at.toDate();
    if(period==="daily") return d.toDateString()===date.toDateString();
    if(period==="weekly") return getWeek(d)===getWeek(date);
    if(period==="monthly") return d.getMonth()===date.getMonth() && d.getFullYear()===date.getFullYear();
    if(period==="annual") return d.getFullYear()===date.getFullYear();
  });

  const byForm = groupBy(filtered,r=>r.form_title||r.form_id||"Unknown");
  const summary = {};
  Object.keys(byForm).forEach(f=>{
    summary[f] = { totalSubmissions: byForm[f].length };
  });

  CURRENT_REPORT = { department: repDept, period, totalSubmissions: filtered.length, forms: summary };

  let output = `DEPARTMENT: ${repDept}\nPERIOD: ${period.toUpperCase()}\nTOTAL SUBMISSIONS: ${filtered.length}\n\n`;
  Object.keys(summary).forEach(f=>{
    output += `📝 ${f}\n   Total Submissions: ${summary[f].totalSubmissions}\n\n`;
  });

  document.getElementById("reportPreview").textContent = output;

  // Render chart for filtered data
  renderBarChart("reportChart", Object.keys(summary), Object.values(summary).map(s=>s.totalSubmissions), "Form Submissions");

  document.getElementById("pdfReportBtn").disabled = false;
}

// ---------------- PDF Export ----------------
function downloadReportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text(`Department Report: ${CURRENT_REPORT.department}`,10,10);
  doc.text(`Period: ${CURRENT_REPORT.period}`,10,20);
  doc.text(`Total Submissions: ${CURRENT_REPORT.totalSubmissions}`,10,30);
  let y=40;
  Object.keys(CURRENT_REPORT.forms).forEach(f=>{
    doc.text(`Form: ${f}`,10,y); y+=6;
    doc.text(`Total Submissions: ${CURRENT_REPORT.forms[f].totalSubmissions}`,14,y); y+=10;
  });
  doc.save(`${CURRENT_REPORT.department}_report.pdf`);
}

// ---------------- Entry ----------------
export async function loadReports(container) {
  container.innerHTML = "<p>Loading reports...</p>";
  await loadAllData();

  container.innerHTML = `
    <div class="records-actions">
      <button id="r_overview" class="btn">📊 Overview</button>
      <button id="r_reports" class="btn">📄 Dept Reports</button>
      <button id="r_charts" class="btn">📈 Charts</button>
    </div>
    <div id="recordsView"></div>
  `;

  const view = document.getElementById("recordsView");
  document.getElementById("r_overview").onclick = ()=>renderOverview(view);
  document.getElementById("r_reports").onclick = ()=>renderDepartmentReportForm(view);
  document.getElementById("r_charts").onclick = ()=>renderDepartmentReportForm(view); // chart view uses same form selection logic
  renderOverview(view);
}
