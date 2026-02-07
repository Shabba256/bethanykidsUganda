// assets/js/records.js
import { 
  getFirestore, collection, getDocs, query, orderBy, where 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const db = getFirestore();

// ------------------ Helpers ------------------
function formatDate(ts) {
  if (!ts) return "";
  return ts.toDate ? ts.toDate().toLocaleString() : new Date(ts).toLocaleString();
}

// ------------------ UI Builders ------------------
function renderDepartmentCards(modules) {
  return `
    <div class="dept-cards">
      ${modules.map(m => `
        <div class="dept-card" data-dept="${m.name}">
          <h3>${m.name}</h3>
          <p>View records</p>
        </div>
      `).join("")}
    </div>
  `;
}

function renderFormCards(forms) {
  return `
    <div class="dept-cards">
      ${forms.map(f => `
        <div class="dept-card" data-form-id="${f.id}" data-dept="${f.department}">
          <h3>${f.title}</h3>
          <p>${f.version ? "v" + f.version : ""} • ${f.is_active ? "Active" : "Inactive"}</p>
        </div>
      `).join("")}
    </div>
    <div style="margin-top:16px;">
      <button id="backToDepartments" class="btn secondary">← Back to Departments</button>
    </div>
  `;
}

function renderTable(fields, records, dept) {
  const headers = fields.map(f => `<th>${f.label}</th>`).join("");

  const rows = records.map(r => {
    const tds = fields.map(f => {
      let val = r[f.key] ?? "";
      if (Array.isArray(val)) val = val.join(", ");
      return `<td>${val}</td>`;
    }).join("");

    return `
      <tr>
        <td>${formatDate(r.submitted_at)}</td>
        <td>${r.submitted_by || ""}</td>
        ${tds}
      </tr>
    `;
  }).join("");

  return `
    <div class="records-actions">
      <button id="exportExcel" class="btn">Export Excel</button>
      <button id="exportPDF" class="btn">Export PDF</button>
      <button id="backToForms" class="btn secondary">← Back to Forms</button>
    </div>

    <table class="records-table">
      <thead>
        <tr>
          <th>Submitted At</th>
          <th>Submitted By</th>
          ${headers}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ------------------ Export ------------------
function exportExcel(fields, records, dept) {
  const XLSX = window.XLSX;
  const data = records.map(r => {
    const row = { "Submitted At": formatDate(r.submitted_at), "Submitted By": r.submitted_by || "" };
    fields.forEach(f => {
      let val = r[f.key] ?? "";
      if (Array.isArray(val)) val = val.join(", ");
      row[f.label] = val;
    });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, dept);
  XLSX.writeFile(wb, `${dept}_records.xlsx`);
}

function exportPDF(fields, records, dept) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const head = [["Submitted At", "Submitted By", ...fields.map(f => f.label)]];
  const body = records.map(r => [
    formatDate(r.submitted_at),
    r.submitted_by || "",
    ...fields.map(f => {
      let val = r[f.key] ?? "";
      if (Array.isArray(val)) val = val.join(", ");
      return val;
    })
  ]);

  doc.autoTable({ head, body, startY: 20, theme: "grid", styles: { fontSize: 8 } });
  doc.save(`${dept}_records.pdf`);
}

// ------------------ Main Entry ------------------
export async function loadRecords(container) {
  container.innerHTML = "<p>Loading departments...</p>";
  try {
    const modulesSnap = await getDocs(query(collection(db, "modules"), orderBy("order", "asc")));
    const modules = modulesSnap.docs.map(d => d.data());

    container.innerHTML = renderDepartmentCards(modules);

    document.querySelectorAll(".dept-card").forEach(card => {
      card.onclick = () => loadDepartmentForms(container, card.dataset.dept);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load departments.</p>";
  }
}

// ------------------ Load Department Forms ------------------
async function loadDepartmentForms(container, department) {
  container.innerHTML = `<p>Loading forms for ${department}...</p>`;
  try {
    const formsSnap = await getDocs(query(
      collection(db, "forms"),
      where("department", "==", department),
      orderBy("version", "desc")
    ));
    const forms = formsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (forms.length === 0) {
      container.innerHTML = `<p>No forms found for ${department}</p>
        <button id="backToDepartments" class="btn secondary">← Back to Departments</button>`;
      document.getElementById("backToDepartments").onclick = () => loadRecords(container);
      return;
    }

    container.innerHTML = renderFormCards(forms);

    // Attach clicks
    document.querySelectorAll(".dept-card").forEach(card => {
      card.onclick = () => loadFormRecords(container, card.dataset.formId, card.dataset.dept);
    });

    document.getElementById("backToDepartments").onclick = () => loadRecords(container);
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load forms.</p>";
  }
}

// ------------------ Load Form Records ------------------
async function loadFormRecords(container, formId, department) {
  container.innerHTML = `<p>Loading records for ${department}...</p>`;
  try {
    // Load submissions for this form
    const submissionsSnap = await getDocs(query(
      collection(db, "submissions"),
      where("form_id", "==", formId),
      orderBy("submitted_at", "desc")
    ));
    const records = submissionsSnap.docs.map(d => d.data());

    if (records.length === 0) {
      container.innerHTML = `<p>No records found for this form</p>
        <button id="backToForms" class="btn secondary">← Back to Forms</button>`;
      document.getElementById("backToForms").onclick = () => loadDepartmentForms(container, department);
      return;
    }

    // Load form fields
    const formSnap = await getDocs(query(collection(db, "forms"), where("__name__", "==", formId)));
    let fields = [];
    if (!formSnap.empty) {
      const form = formSnap.docs[0].data();
      fields = form.fields || [];
      fields.forEach(f => f.key = f.key || f.label.toLowerCase().replace(/\s+/g, "_"));
    }

    // Auto-add any extra fields from submissions
    const extraKeys = new Set();
    records.forEach(r => {
      Object.keys(r).forEach(k => {
        if (!["submitted_at", "submitted_by", "form_id", "department"].includes(k) && !fields.some(f => f.key === k)) {
          extraKeys.add(k);
        }
      });
    });
    extraKeys.forEach(k => fields.push({ key: k, label: k.replace(/_/g, " ").toUpperCase() }));

    container.innerHTML = renderTable(fields, records, department);

    document.getElementById("exportExcel").onclick = () => exportExcel(fields, records, department);
    document.getElementById("exportPDF").onclick = () => exportPDF(fields, records, department);
    document.getElementById("backToForms").onclick = () => loadDepartmentForms(container, department);
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load form records.</p>";
  }
}
