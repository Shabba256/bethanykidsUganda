import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore, collection, getDocs, query, orderBy, where 
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
try { user = JSON.parse(localStorage.getItem("user")); } catch { user = null; }
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

// ------------------ Permission Check ------------------
function hasAccess(section) {
  return user.departments?.includes("ALL") || user.departments?.includes(section);
}

// ------------------ Load Modules + Forms ------------------
async function loadSections() {
  try {
    const modulesQuery = query(collection(db, "modules"), orderBy("order", "asc"));
    const modulesSnap = await getDocs(modulesQuery);

    const formsQuery = query(collection(db, "forms"), where("is_active", "==", true));
    const formsSnap = await getDocs(formsQuery);

    const allForms = formsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    modulesSnap.forEach(docSnap => {
      const section = docSnap.data();
      if (!hasAccess(section.name) || section.name === "Finance") return;

      const li = document.createElement("li");
      li.className = "nav-section";

      const header = document.createElement("div");
      header.className = "nav-header";
      header.innerHTML = `<span>${section.name}</span><span class="chevron">▸</span>`;

      const submenu = document.createElement("ul");
      submenu.className = "submenu";

      // ----------- FORMS (data-driven, no guessing) -----------
// ----------- Build submenu from Firestore modules.items -----------
section.items.forEach(item => {
  const sub = document.createElement("li");
  sub.textContent = item;

  sub.onclick = async () => {
    const lower = item.toLowerCase();

    if (lower === "forms") {
      title.textContent = `${section.name} — Forms`;
      content.innerHTML = "";

      const formsForDept = allForms.filter(f => f.department === section.name);

      if (formsForDept.length === 0) {
        content.innerHTML = "<p>No active forms for this department.</p>";
        return;
      }

      formsForDept.forEach(f => {
        const btn = document.createElement("button");
        btn.className = "form-link-btn";
        btn.textContent = f.title;
        btn.onclick = () => {
          window.location.href = `forms.html?form=${f.id}`;
        };
        content.appendChild(btn);
      });
    }

    else if (lower === "records") {
      title.textContent = `${section.name} — Records`;
      content.innerHTML = `<p>Loading records...</p>`;
      try {
        const module = await import('./records.js');
        module.loadRecords(content, user);
      } catch (err) {
        console.error(err);
        content.innerHTML = "<p>Failed to load records.</p>";
      }
    }

    else {
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

    // ------------------ Finance ------------------
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
    console.error("Error loading dashboard modules:", err);
    content.innerHTML = "<p>Failed to load dashboard modules.</p>";
  }
}

// ------------------ Init ------------------
loadSections();

// ------------------ Logout ------------------
window.logout = async () => {
  localStorage.removeItem("user");
  await signOut(auth);
  window.location.href = "login.html";
};