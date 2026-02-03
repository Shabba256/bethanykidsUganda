// assets/js/dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore, collection, getDocs, query, orderBy, doc, getDoc
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

// ------------------ Safe User Load ------------------
let user = null;
try {
  user = JSON.parse(localStorage.getItem("user"));
} catch { user = null; }
if (!user) window.location.href = "login.html";

// ------------------ Profile ------------------
document.getElementById("userName").textContent = user.full_name || user.email || "User";
document.getElementById("userDept").textContent = Array.isArray(user.departments)
  ? user.departments.join(", ")
  : "No department";

// ------------------ UI ------------------
const nav = document.getElementById("nav");
const title = document.getElementById("sectionTitle");
const content = document.getElementById("sectionContent");

const FINANCE_URL = "https://finance.example.com";

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
      <img src="${form.image_url}" class="form-header-img" />
      <h2 class="form-title">${form.title}</h2>
      <p class="form-desc">${form.description}</p>
      <form id="dynamicForm">
  `;

  form.fields.forEach(f => {
    html += `<div class="form-group">`;
    html += `<label class="form-label">${f.label}</label>`;

    if (f.type === "select") {
      html += `<select name="${f.key}" class="form-input" ${f.required ? "required" : ""}>
                 <option value="">Select</option>
                 ${f.options?.map(o => `<option value="${o}">${o}</option>`).join("")}
               </select>`;
    } else if (f.type === "date" || f.type === "timestamp") {
      html += `<input type="date" name="${f.key}" class="form-input" ${f.required ? "required" : ""} />`;
    } else {
      html += `<input type="text" name="${f.key}" class="form-input" ${f.required ? "required" : ""} />`;
    }

    html += `</div>`; // close form-group
  });

  html += `
        <button type="submit" class="form-submit">Submit</button>
      </form>
      <div id="formMsg" class="form-msg"></div>
    </div>
  `;

  title.textContent = form.department + " — Form";
  content.innerHTML = html;

  // ------------------ Handle Form Submission ------------------
  const dynamicForm = document.getElementById("dynamicForm");
  const formMsg = document.getElementById("formMsg");

  dynamicForm.addEventListener("submit", async e => {
    e.preventDefault();
    const data = {};
    form.fields.forEach(f => {
      data[f.key] = dynamicForm[f.key].value.trim();
    });

    // Add metadata
    data.submitted_by = user.uid;
    data.department = form.department;
    data.submitted_at = new Date();

    try {
      await db.collection("submissions").add(data);
      dynamicForm.reset();
      formMsg.textContent = "Form submitted successfully!";
      formMsg.className = "form-msg success";
    } catch (err) {
      console.error(err);
      formMsg.textContent = "Submission failed. Try again.";
      formMsg.className = "form-msg error";
    }
  });
}

// ------------------ Load Modules ------------------
async function loadSections() {
  const q = query(collection(db, "modules"), orderBy("order", "asc"));
  const snap = await getDocs(q);

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

    section.items.forEach(item => {
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
}

loadSections();

// ------------------ Logout ------------------
window.logout = async () => {
  localStorage.removeItem("user");
  await signOut(auth);
  window.location.href = "login.html";
};
