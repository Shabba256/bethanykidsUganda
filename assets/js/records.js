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
    <div class="records-back">
      <button id="backToDepartments">← Back to Departments</button>
    </div>

    <div class="form-cards">
      ${forms.map(f => `
        <div class="form-card" data-form="${f.id}" data-dept="${f.department}">
          <h3>${f.title}</h3>
          <p>View ${f.title} records</p>
        </div>
      `).join("")}
    </div>
  `;
}

function renderTable(fields, records) {
  const headers = fields.map(f => `<th>${f.label}</th>`).join("");

  let rows = records.map(r => {
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
function exportExcel(fields, records, name) {
  const XLSX = window.XLSX;

  const data = records.map(r => {
    const row = {
      "Submitted At": formatDate(r.submitted_at),
      "Submitted By": r.submitted_by || ""
    };

    fields.forEach(f => {
      let val = r[f.key] ?? "";
      if (Array.isArray(val)) val = val.join(", ");
      row[f.label] = val;
    });

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
  const body = records.map(r => [
    formatDate(r.submitted_at),
    r.submitted_by || "",
    ...fields.map(f => {
      let val = r[f.key] ?? "";
      if (Array.isArray(val)) val = val.join(", ");
      return val;
    })
  ]);

  doc.autoTable({
    head,
    body,
    startY: 20,
    theme: "grid",
    styles: { fontSize: 8 }
  });

  doc.save(`${name}_records.pdf`);
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

// ------------------ Load Forms for Department ------------------
async function loadDepartmentForms(container, department) {
  container.innerHTML = `<p>Loading ${department} forms...</p>`;

  try {
    const formsSnap = await getDocs(
      query(collection(db, "forms"), where("department", "==", department), where("is_active", "==", true))
    );

    if (formsSnap.empty) {
      container.innerHTML = `<p>No active forms for ${department}</p>`;
      return;
    }

    const forms = formsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    container.innerHTML = renderFormCards(forms);

    document.getElementById("backToDepartments").onclick = () => loadRecords(container);

    document.querySelectorAll(".form-card").forEach(card => {
      card.onclick = () => loadFormRecords(container, card.dataset.dept, card.dataset.form);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = `<p>Failed to load forms for ${department}</p>`;
  }
}

// ------------------ Load Records for Form ------------------
async function loadFormRecords(container, department, formId) {
  container.innerHTML = `<p>Loading records...</p>`;

  try {
    const submissionsSnap = await getDocs(
      query(collection(db, "submissions"), where("department", "==", department), where("form_id", "==", formId), orderBy("submitted_at", "desc"))
    );

    const records = submissionsSnap.docs.map(d => d.data());

    if (records.length === 0) {
      container.innerHTML = `<p>No records found for this form.</p>`;
      return;
    }

    // Get form fields
    const formsSnap = await getDocs(
      query(collection(db, "forms"), where("id", "==", formId))
    );

    let fields = [];
    if (!formsSnap.empty) {
      const form = formsSnap.docs[0].data();
      fields = form.fields || [];
      fields.forEach(f => {
        f.key = f.key || f.label.toLowerCase().replace(/\s+/g, "_");
      });
    }

    // Auto-add any extra fields from submissions
    const extraKeys = new Set();
    records.forEach(r => {
      Object.keys(r).forEach(k => {
        if (!["submitted_at", "submitted_by", "department", "form_id"].includes(k) && !fields.some(f => f.key === k)) {
          extraKeys.add(k);
        }
      });
    });
    extraKeys.forEach(k => fields.push({ key: k, label: k.replace(/_/g, " ").toUpperCase() }));

    container.innerHTML = renderTable(fields, records);

    document.getElementById("exportExcel").onclick = () => exportExcel(fields, records, formId);
    document.getElementById("exportPDF").onclick = () => exportPDF(fields, records, formId);
    document.getElementById("backToForms").onclick = () => loadDepartmentForms(container, department);

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load records for this form.</p>";
  }
}
