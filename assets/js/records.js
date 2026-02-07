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

function renderTable(fields, records) {
  const headers = fields.map(f => `<th>${f.label}</th>`).join("");

  let rows = records.map(r => {
    const tds = fields.map(f => {
      // <-- Option 1 fix: read top-level submission fields
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
      <button id="backToDepartments" class="btn secondary">← Back</button>
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
  XLSX.utils.book_append_sheet(wb, ws, dept);
  XLSX.writeFile(wb, `${dept}_records.xlsx`);
}

function exportPDF(fields, records, dept) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const head = [["Submitted At", "Submitted By", ...fields.map(f => f.label)]];
  const body = records.map(r => {
    return [
      formatDate(r.submitted_at),
      r.submitted_by || "",
      ...fields.map(f => {
        let val = r[f.key] ?? "";
        if (Array.isArray(val)) val = val.join(", ");
        return val;
      })
    ];
  });

  doc.autoTable({
    head,
    body,
    startY: 20,
    theme: "grid",
    styles: { fontSize: 8 }
  });

  doc.save(`${dept}_records.pdf`);
}

// ------------------ Main Entry ------------------
export async function loadRecords(container) {
  container.innerHTML = "<p>Loading departments...</p>";

  try {
    // 1️⃣ Load departments from modules
    const modulesSnap = await getDocs(query(collection(db, "modules"), orderBy("order", "asc")));
    const modules = modulesSnap.docs.map(d => d.data());

    container.innerHTML = renderDepartmentCards(modules);

    // Attach clicks
    document.querySelectorAll(".dept-card").forEach(card => {
      card.onclick = () => loadDepartmentRecords(container, card.dataset.dept);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load departments.</p>";
  }
}

// ------------------ Load Department Records ------------------
async function loadDepartmentRecords(container, department) {
  container.innerHTML = `<p>Loading ${department} records...</p>`;

  try {
    // 2️⃣ Load all submissions for department (ALL versions)
    const submissionsSnap = await getDocs(
      query(collection(db, "submissions"), where("department", "==", department), orderBy("submitted_at", "desc"))
    );

    const records = submissionsSnap.docs.map(d => d.data());

    // 3️⃣ Load latest ACTIVE form for columns
    const formsSnap = await getDocs(
      query(collection(db, "forms"), where("department", "==", department), where("is_active", "==", true))
    );

    if (formsSnap.empty) {
      container.innerHTML = `<p>No active form for ${department}</p>`;
      return;
    }

    const activeForm = formsSnap.docs[0].data();
    const fields = activeForm.fields || [];

    // Map form field names to keys in submissions
    fields.forEach(f => {
      // Example: "name_of_child" already matches Firestore field names
      f.key = f.key || f.label.toLowerCase().replace(/\s+/g, "_");
    });

    container.innerHTML = renderTable(fields, records);

    document.getElementById("exportExcel").onclick = () => exportExcel(fields, records, department);
    document.getElementById("exportPDF").onclick = () => exportPDF(fields, records, department);
    document.getElementById("backToDepartments").onclick = () => loadRecords(container);

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load department records.</p>";
  }
}
