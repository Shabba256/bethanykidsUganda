// assets/js/dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ------------------ Firebase Setup ------------------
const firebaseConfig = {
  apiKey: "AIzaSyCZ5L0dUrVt0MK5DDGuWZQlBOMitKYUuag",
  authDomain: "bethany-system.firebaseapp.com",
  projectId: "bethany-system",
  storageBucket: "bethany-system.firebasestorage.app",
  messagingSenderId: "267285501238",
  appId: "1:267285501238:web:b039650181d6c14b3acf97"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ------------------ Load User ------------------
let user = null;
try { user = JSON.parse(localStorage.getItem("user")); } catch { user = null; }
if (!user) window.location.href = "login.html";

// ------------------ Profile Info ------------------
document.getElementById("userName").textContent = user.full_name || user.email || "User";
document.getElementById("userDept").textContent = Array.isArray(user.departments)
  ? user.departments.join(", ")
  : "No department";

// ------------------ UI Elements ------------------
const nav = document.getElementById("nav");
const title = document.getElementById("sectionTitle");
const content = document.getElementById("sectionContent");
const FINANCE_URL = "https://finance.example.com";

// ------------------ Permission Check ------------------
function hasAccess(section) {
  return user.departments?.includes("ALL") || user.departments?.includes(section);
}

// ------------------ Render Form ------------------
async function renderForm(formId) {
  const snap = await getDoc(doc(db, "forms", formId));
  if (!snap.exists()) {
    content.innerHTML = "<p>Form not found.</p>";
    return;
  }

  const form = snap.data();

  let html = `
    <div class="form-card">
      <img src="${form.image_url}" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px" />
      <h2>${form.title}</h2>
      <p>${form.description}</p>
      <form id="dynamicForm">
  `;

  form.fields.forEach(f => {
    if (f.type === "select") {
      html += `<label>${f.label}</label>
        <select name="${f.key}" ${f.required ? "required" : ""}>
          <option value="">Select</option>
          ${f.options?.map(o => `<option value="${o}">${o}</option>`).join("")}
        </select>`;
    } else if (f.type === "date") {
      html += `<label>${f.label}</label>
        <input type="date" name="${f.key}" ${f.required ? "required" : ""} />`;
    } else {
      html += `<label>${f.label}</label>
        <input type="text" name="${f.key}" ${f.required ? "required" : ""} />`;
    }
  });

  html += `<button type="submit">Submit</button></form>
           <div id="formMsg" style="margin-top:10px;color:green;"></div>
           </div>`;

  title.textContent = form.department + " — Form";
  content.innerHTML = html;

  // Handle submission
  const formEl = document.getElementById("dynamicForm");
  formEl.addEventListener("submit", async e => {
    e.preventDefault();
    const data = {};
    form.fields.forEach(f => {
      let val = formEl[f.key].value;
      if (f.type === "date" && val) val = Timestamp.fromDate(new Date(val));
      data[f.key] = val;
    });

    data.department = form.department;
    data.user_uid = user.uid;
    data.submitted_at = Timestamp.now();

    try {
      await getFirestore().collection("submissions").add(data);
      formEl.reset();
      document.getElementById("formMsg").textContent = "Submitted successfully!";
    } catch (err) {
      console.error(err);
      document.getElementById("formMsg").textContent = "Error submitting form.";
    }
  });
}

// ------------------ Load Modules ------------------
async function loadSections() {
  try {
    const modulesQuery = query(collection(db, "modules"), orderBy("order", "asc"));
    const snap = await getDocs(modulesQuery);

    snap.forEach(docSnap => {
      const section = docSnap.data();
      if (!hasAccess(section.name) || section.name === "Finance") return;

      const li = document.createElement("li");
      li.className = "nav-section";

      const header = document.createElement("div");
      header.className = "nav-header";
      header.innerHTML = `<span>${section.name}</span><span class="chevron">▸</span>`;

      const submenu = document.createElement("ul");
      submenu.className = "submenu";

      section.items?.forEach(item => {
        const sub = document.createElement("li");
        sub.textContent = item;

        sub.onclick = () => {
          if (item.toLowerCase() === "forms" && section.name.toLowerCase().includes("paediatric")) {
            renderForm("paediatric_surgery");
          } else {
            title.textContent = `${section.name} — ${item}`;
            content.innerHTML = `<p>${item} for ${section.name} coming next.</p>`;
          }
        };

        submenu.appendChild(sub);
      });

      header.onclick = () => {
        submenu.classList.toggle("open");
        header.classList.toggle("active");
      };

      li.appendChild(header);
      li.appendChild(submenu);
      nav.appendChild(li);
    });

    // Finance at bottom
    if (hasAccess("Finance")) {
      const li = document.createElement("li");
      li.className = "nav-section";
      const btn = document.createElement("div");
      btn.className = "nav-header";
      btn.textContent = "Finance";
      btn.onclick = () => window.open(FINANCE_URL, "_blank");
      li.appendChild(btn);
      nav.appendChild(li);
    }
  } catch (err) {
    console.error("Error loading modules:", err);
    content.innerHTML = "<p>Failed to load dashboard modules. Refresh page.</p>";
  }
}

loadSections();

// ------------------ Logout ------------------
window.logout = async () => {
  localStorage.removeItem("user");
  await signOut(auth);
  window.location.href = "login.html";
};
