import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const db = getFirestore();

let ALL_RECORDS = [];
let ALL_FORMS = [];
let ALL_MODULES = [];

// ---------------- Helpers ----------------
function groupBy(arr, key) {
  return arr.reduce((acc, cur) => {
    const k = cur[key] || "Unknown";
    acc[k] = acc[k] || [];
    acc[k].push(cur);
    return acc;
  }, {});
}

function monthKey(ts) {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,"0")}`;
}

function ageGroup(age) {
  const a = parseInt(age || 0);
  if (a <= 2) return "0–2";
  if (a <= 5) return "3–5";
  if (a <= 12) return "6–12";
  return "13+";
}

// ---------------- Load All Data ----------------
async function loadAllData() {
  const [subsSnap, formsSnap, modulesSnap] = await Promise.all([
    getDocs(query(collection(db, "submissions"), orderBy("submitted_at", "desc"))),
    getDocs(collection(db, "forms")),
    getDocs(collection(db, "modules"))
  ]);

  ALL_RECORDS = subsSnap.docs.map(d => d.data());
  ALL_FORMS = formsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  ALL_MODULES = modulesSnap.docs.map(d => d.data());
}

// ---------------- UI ----------------
function renderOverview(container) {
  const total = ALL_RECORDS.length;

  const gender = { Male: 0, Female: 0 };
  const byDept = groupBy(ALL_RECORDS, "department");
  const byMonth = groupBy(ALL_RECORDS, r => monthKey(r.submitted_at));
  const ages = {};

  ALL_RECORDS.forEach(r => {
    const g = r.gender_of_child || r.gender;
    if (g === "Male") gender.Male++;
    if (g === "Female") gender.Female++;

    const ag = ageGroup(r.age_of_child || r.age);
    ages[ag] = (ages[ag] || 0) + 1;
  });

  container.innerHTML = `
    <h2>📊 Executive Overview</h2>

    <div class="stats-cards">
      <div class="card"><h3>Total Records</h3><p>${total}</p></div>
      <div class="card"><h3>Departments</h3><p>${Object.keys(byDept).length}</p></div>
      <div class="card"><h3>Male</h3><p>${gender.Male}</p></div>
      <div class="card"><h3>Female</h3><p>${gender.Female}</p></div>
    </div>

    <canvas id="trendChart"></canvas>
    <canvas id="deptChart"></canvas>
    <canvas id="genderChart"></canvas>
    <canvas id="ageChart"></canvas>
  `;

  new Chart(document.getElementById("trendChart"), {
    type: "line",
    data: {
      labels: Object.keys(byMonth),
      datasets: [{
        label: "Submissions Over Time",
        data: Object.values(byMonth).map(v => v.length),
        fill: true
      }]
    }
  });

  new Chart(document.getElementById("deptChart"), {
    type: "bar",
    data: {
      labels: Object.keys(byDept),
      datasets: [{ label: "By Department", data: Object.values(byDept).map(v => v.length) }]
    }
  });

  new Chart(document.getElementById("genderChart"), {
    type: "doughnut",
    data: {
      labels: ["Male", "Female"],
      datasets: [{ data: [gender.Male, gender.Female] }]
    }
  });

  new Chart(document.getElementById("ageChart"), {
    type: "bar",
    data: {
      labels: Object.keys(ages),
      datasets: [{ label: "Age Groups", data: Object.values(ages) }]
    }
  });
}

// ---------------- Department Performance ----------------
function renderDepartments(container) {
  const byDept = groupBy(ALL_RECORDS, "department");

  container.innerHTML = `
    <h2>🏥 Department Performance</h2>
    <canvas id="deptPerfChart"></canvas>
  `;

  new Chart(document.getElementById("deptPerfChart"), {
    type: "bar",
    data: {
      labels: Object.keys(byDept),
      datasets: [{ label: "Total Records", data: Object.values(byDept).map(v => v.length) }]
    }
  });
}

// ---------------- Forms ----------------
function renderForms(container) {
  const byForm = groupBy(ALL_RECORDS, "form_id");

  container.innerHTML = `
    <h2>📝 Form Usage</h2>
    <canvas id="formChart"></canvas>
  `;

  new Chart(document.getElementById("formChart"), {
    type: "bar",
    data: {
      labels: Object.keys(byForm),
      datasets: [{ label: "Submissions Per Form", data: Object.values(byForm).map(v => v.length) }]
    }
  });
}

// ---------------- Trends ----------------
function renderTrends(container) {
  const byMonth = groupBy(ALL_RECORDS, r => monthKey(r.submitted_at));

  container.innerHTML = `
    <h2>📈 Trends Over Time</h2>
    <canvas id="trendLine"></canvas>
  `;

  new Chart(document.getElementById("trendLine"), {
    type: "line",
    data: {
      labels: Object.keys(byMonth),
      datasets: [{ label: "Growth Trend", data: Object.values(byMonth).map(v => v.length) }]
    }
  });
}

// ---------------- Demographics ----------------
function renderDemographics(container) {
  const gender = { Male: 0, Female: 0 };

  ALL_RECORDS.forEach(r => {
    const g = r.gender_of_child || r.gender;
    if (g === "Male") gender.Male++;
    if (g === "Female") gender.Female++;
  });

  container.innerHTML = `
    <h2>👥 Demographics</h2>
    <canvas id="demoChart"></canvas>
  `;

  new Chart(document.getElementById("demoChart"), {
    type: "pie",
    data: {
      labels: ["Male", "Female"],
      datasets: [{ data: [gender.Male, gender.Female] }]
    }
  });
}

// ---------------- Public Entry ----------------
export async function loadReports(container) {
  container.innerHTML = "<p>Loading reports...</p>";
  await loadAllData();

  container.innerHTML = `
    <div class="records-actions">
      <button id="r_overview" class="btn">Overview</button>
      <button id="r_dept" class="btn">Departments</button>
      <button id="r_forms" class="btn">Forms</button>
      <button id="r_trends" class="btn">Trends</button>
      <button id="r_demo" class="btn">Demographics</button>
    </div>
    <div id="reportsView"></div>
  `;

  const view = document.getElementById("reportsView");

  document.getElementById("r_overview").onclick = () => renderOverview(view);
  document.getElementById("r_dept").onclick = () => renderDepartments(view);
  document.getElementById("r_forms").onclick = () => renderForms(view);
  document.getElementById("r_trends").onclick = () => renderTrends(view);
  document.getElementById("r_demo").onclick = () => renderDemographics(view);

  renderOverview(view);
}
