// assets/js/records.js
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  renderBarChart,
  renderPieChart,
  renderLineChart,
  renderDoughnutChart
} from "./chart.js";

const db = getFirestore();

let ALL_RECORDS = [];
let ALL_FORMS = [];
let SELECTED_DEPT = '';
let CURRENT_FORM = null;

// ---------------- Helpers ----------------
function formatDate(ts) {
  if (!ts) return '';
  return ts.toDate ? ts.toDate().toLocaleString() : new Date(ts).toLocaleString();
}

function groupBy(arr, key) {
  return arr.reduce((acc, cur) => {
    const k = typeof key === "function" ? key(cur) : (cur[key] || "Unknown");
    acc[k] = acc[k] || [];
    acc[k].push(cur);
    return acc;
  }, {});
}

function monthKey(ts) {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

function getWeek(d) {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
}

// ---------------- Load Data ----------------
async function loadAllData(deptName) {
  const subsQuery = deptName && deptName !== 'ALL'
    ? query(collection(db, "submissions"), where("department", "==", deptName), orderBy("submitted_at", "desc"))
    : query(collection(db, "submissions"), orderBy("submitted_at", "desc"));

  const [subsSnap, formsSnap] = await Promise.all([
    getDocs(subsQuery),
    getDocs(collection(db, "forms"))
  ]);

  ALL_RECORDS = subsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  ALL_FORMS = formsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ---------------- UI Builders ----------------
function renderDepartmentCards(modules) {
  return `
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      ${modules.map(m => `
        <div class="cursor-pointer p-6 bg-white rounded-3xl shadow-sm hover:shadow-md transition-all dept-card" data-dept="${m.name}">
          <h3 class="text-lg font-black text-slate-900">${m.name}</h3>
          <p class="text-slate-400 text-xs mt-1">View records</p>
        </div>
      `).join('')}
    </div>
  `;
}

function renderFormCards(forms) {
  return `
    <div class="mb-6">
      <button id="backToDepartments" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all">← Back to Departments</button>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      ${forms.map(f => `
        <div class="cursor-pointer p-6 bg-white rounded-3xl shadow-sm hover:shadow-md transition-all form-card" data-form="${f.id}" data-dept="${f.department}">
          <h3 class="text-lg font-black text-slate-900">${f.title}</h3>
          <p class="text-slate-400 text-xs mt-1">View ${f.title} records</p>
        </div>
      `).join('')}
    </div>
  `;
}

function createStats(records) {
  const total = records.length;
  const genderCount = { Male: 0, Female: 0 };
  records.forEach(r => {
    const g = r.gender_of_child || r.gender;
    if (g === "Male") genderCount.Male++;
    if (g === "Female") genderCount.Female++;
  });

  return `
    <div class="grid grid-cols-3 gap-4 mb-4">
      <div class="bg-white p-4 rounded-2xl shadow-sm text-center cursor-pointer stats-card" data-filter="all">
        <h3 class="font-black text-slate-900 text-xl">Total</h3>
        <p class="text-slate-400">${total}</p>
      </div>
      <div class="bg-white p-4 rounded-2xl shadow-sm text-center cursor-pointer stats-card" data-filter="Male">
        <h3 class="font-black text-blue-600 text-xl">Male</h3>
        <p class="text-slate-400">${genderCount.Male}</p>
      </div>
      <div class="bg-white p-4 rounded-2xl shadow-sm text-center cursor-pointer stats-card" data-filter="Female">
        <h3 class="font-black text-rose-500 text-xl">Female</h3>
        <p class="text-slate-400">${genderCount.Female}</p>
      </div>
    </div>
  `;
}

function renderTable(fields, records) {
  const headers = fields.map(f => `<th class="px-4 py-2 text-left border-b border-slate-200">${f.label}</th>`).join('');
  const rows = records.map(r => {
    const tds = fields.map(f => `<td class="px-4 py-2 border-b border-slate-100">${r[f.key] || '—'}</td>`).join('');
    return `
      <tr class="hover:bg-slate-50 transition-all">
        <td class="px-4 py-2 border-b border-slate-100">${formatDate(r.submitted_at)}</td>
        <td class="px-4 py-2 border-b border-slate-100">${r.submitted_by || ''}</td>
        ${tds}
      </tr>
    `;
  }).join('');

  return `
    ${createStats(records)}
    <div class="overflow-x-auto bg-white rounded-3xl shadow-sm border border-slate-100">
      <table class="w-full">
        <thead class="bg-slate-50 text-slate-400 uppercase text-xs font-black">
          <tr>
            <th class="px-4 py-2 border-b border-slate-200">Submitted At</th>
            <th class="px-4 py-2 border-b border-slate-200">Submitted By</th>
            ${headers}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="mt-4 flex gap-4">
      <button id="exportExcel" class="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all">Export Excel</button>
      <button id="exportPDF" class="px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all">Export PDF</button>
      <button id="backToForms" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all">← Back to Forms</button>
    </div>
  `;
}

// ---------------- Export ----------------
function exportExcel(fields, records, name) {
  const XLSX = window.XLSX;
  const data = records.map(r => {
    const row = { "Submitted At": formatDate(r.submitted_at), "Submitted By": r.submitted_by || "" };
    fields.forEach(f => row[f.label] = r[f.key] ?? "");
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, name);
  XLSX.writeFile(wb, `${name}_records.xlsx`);
}

function exportPDF(fields, records, name) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const head = [["Submitted At", "Submitted By", ...fields.map(f => f.label)]];
  const body = records.map(r => [formatDate(r.submitted_at), r.submitted_by || "", ...fields.map(f => r[f.key] ?? "")]);
  doc.autoTable({ head, body, startY: 20, theme: "grid", styles: { fontSize: 8 } });
  doc.save(`${name}_records.pdf`);
}

// ---------------- Filters ----------------
function applyGenderFilter(records, fields, container, gender) {
  let filtered = records;
  if (gender && gender !== 'all') {
    filtered = records.filter(r => (r.gender_of_child || r.gender) === gender);
  }
  container.innerHTML = renderTable(fields, filtered);
  document.getElementById("exportExcel").onclick = () => exportExcel(fields, filtered, "Filtered_Records");
  document.getElementById("exportPDF").onclick = () => exportPDF(fields, filtered, "Filtered_Records");
  document.getElementById("backToForms").onclick = () => loadDepartmentForms(container, SELECTED_DEPT);

  document.querySelectorAll(".stats-card").forEach(card => {
    card.onclick = () => applyGenderFilter(records, fields, container, card.dataset.filter);
  });
}

// ---------------- Main Load ----------------
export async function loadRecords(container, user, department) {
  container.innerHTML = `<p class="text-slate-400 text-center py-20">Loading departments...</p>`;
  SELECTED_DEPT = department || 'ALL';
  await loadAllData();

  const modules = [...new Set(ALL_FORMS.map(f => f.department))].map(d => ({ name: d }));
  container.innerHTML = renderDepartmentCards(modules);

  container.querySelectorAll(".dept-card").forEach(card => {
    card.onclick = () => loadDepartmentForms(container, card.dataset.dept);
  });
}

// ---------------- Load Forms ----------------
async function loadDepartmentForms(container, dept) {
  SELECTED_DEPT = dept;
  const forms = ALL_FORMS.filter(f => f.department === dept && f.is_active);
  if (forms.length === 0) {
    container.innerHTML = `<p>No active forms for ${dept}</p>`;
    return;
  }
  container.innerHTML = renderFormCards(forms);
  document.getElementById("backToDepartments").onclick = () => loadRecords(container);

  container.querySelectorAll(".form-card").forEach(card => {
    card.onclick = () => loadFormRecords(container, card.dataset.form);
  });
}

// ---------------- Load Records ----------------
async function loadFormRecords(container, formId) {
  CURRENT_FORM = ALL_FORMS.find(f => f.id === formId);
  const records = ALL_RECORDS.filter(r => r.form_id === formId);

  let fields = CURRENT_FORM?.fields || [];
  fields.forEach(f => f.key = f.key || f.label.toLowerCase().replace(/\s+/g, "_"));

  // Add extra keys dynamically
  const extraKeys = new Set();
  records.forEach(r => Object.keys(r).forEach(k => {
    if (!["submitted_at","submitted_by","department","form_id"].includes(k) && !fields.some(f=>f.key===k)) extraKeys.add(k);
  }));
  extraKeys.forEach(k => fields.push({ key: k, label: k.replace(/_/g," ").toUpperCase() }));

  applyGenderFilter(records, fields, container, "all");
}
