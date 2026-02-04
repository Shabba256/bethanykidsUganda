// assets/js/records.js

import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const db = getFirestore();

// ------------------ DOM Elements ------------------
const content = document.getElementById("sectionContent");
content.innerHTML = "<p>Loading records...</p>";

// ------------------ Helper Functions ------------------
function formatDate(ts) {
  if (!ts) return "";
  return ts.toDate ? ts.toDate().toLocaleString() : new Date(ts).toLocaleString();
}

function createStats(records) {
  const total = records.length;
  const byDept = {};
  const genderCount = { Male: 0, Female: 0 };

  records.forEach(r => {
    const dept = r.department || "Unknown";
    byDept[dept] = (byDept[dept] || 0) + 1;

    if (r.gender) {
      if (r.gender === "Male") genderCount.Male++;
      else if (r.gender === "Female") genderCount.Female++;
    }
  });

  let statsHTML = `<div class="stats-cards">`;
  statsHTML += `<div class="card"><h3>Total Submissions</h3><p>${total}</p></div>`;
  for (const [dept, count] of Object.entries(byDept)) {
    statsHTML += `<div class="card"><h3>${dept}</h3><p>${count}</p></div>`;
  }
  statsHTML += `<div class="card"><h3>Gender - Male</h3><p>${genderCount.Male}</p></div>`;
  statsHTML += `<div class="card"><h3>Gender - Female</h3><p>${genderCount.Female}</p></div>`;
  statsHTML += `</div>`;

  return statsHTML;
}

function createTable(records) {
  let html = `
    <div class="records-actions">
      <button id="exportExcel" class="btn">Export Excel</button>
      <button id="exportPDF" class="btn">Export PDF</button>
    </div>
    <table class="records-table">
      <thead>
        <tr>
          <th>Submitted At</th>
          <th>Department</th>
          <th>Email</th>
          <th>Child Name</th>
          <th>ID</th>
          <th>DOB</th>
          <th>Age</th>
          <th>Gender</th>
          <th>Address</th>
          <th>Contact</th>
          <th>Submitted By</th>
          <th>Visit Date</th>
        </tr>
      </thead>
      <tbody>
  `;

  records.forEach(r => {
    html += `<tr>
      <td>${formatDate(r.submitted_at)}</td>
      <td>${r.department || ""}</td>
      <td>${r.email || ""}</td>
      <td>${r.child_name || ""}</td>
      <td>${r.child_id || ""}</td>
      <td>${formatDate(r.dob)}</td>
      <td>${r.age || ""}</td>
      <td>${r.gender || ""}</td>
      <td>${r.address || ""}</td>
      <td>${r.contact || ""}</td>
      <td>${r.submitted_by || ""}</td>
      <td>${formatDate(r.visit_date)}</td>
    </tr>`;
  });

  html += `</tbody></table>`;
  return html;
}

// ------------------ Export Functions ------------------
function exportExcel(records) {
  const XLSX = window.XLSX;
  const data = records.map(r => ({
    "Submitted At": formatDate(r.submitted_at),
    "Department": r.department || "",
    "Email": r.email || "",
    "Child Name": r.child_name || "",
    "ID": r.child_id || "",
    "DOB": formatDate(r.dob),
    "Age": r.age || "",
    "Gender": r.gender || "",
    "Address": r.address || "",
    "Contact": r.contact || "",
    "Submitted By": r.submitted_by || "",
    "Visit Date": formatDate(r.visit_date)
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Records");
  XLSX.writeFile(wb, "records.xlsx");
}

function exportPDF(records) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const rows = records.map(r => [
    formatDate(r.submitted_at),
    r.department || "",
    r.email || "",
    r.child_name || "",
    r.child_id || "",
    formatDate(r.dob),
    r.age || "",
    r.gender || "",
    r.address || "",
    r.contact || "",
    r.submitted_by || "",
    formatDate(r.visit_date)
  ]);
  doc.autoTable({
    head: [["Submitted At","Department","Email","Child Name","ID","DOB","Age","Gender","Address","Contact","Submitted By","Visit Date"]],
    body: rows,
    startY: 20,
    theme: 'grid',
    styles: { fontSize: 8 }
  });
  doc.save("records.pdf");
}

// ------------------ Load Records ------------------
export async function loadRecords() {
  content.innerHTML = "<p>Loading records...</p>";

  try {
    const q = query(collection(db, "submissions"), orderBy("submitted_at", "desc"));
    const snap = await getDocs(q);
    const records = snap.docs.map(d => d.data());

    content.innerHTML = createStats(records) + createTable(records);

    document.getElementById("exportExcel").onclick = () => exportExcel(records);
    document.getElementById("exportPDF").onclick = () => exportPDF(records);

  } catch (err) {
    console.error("Error loading records:", err);
    content.innerHTML = "<p>Failed to load records.</p>";
  }
}
