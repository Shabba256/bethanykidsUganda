// assets/js/dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// ------------------ Safe user load ------------------
let user = null;
try {
  user = JSON.parse(localStorage.getItem("user"));
} catch (e) {
  user = null;
}

if (!user) {
  window.location.href = "login.html";
}

// ------------------ Profile Info ------------------
document.getElementById("userName").textContent = user.full_name || user.email || "User";
document.getElementById("userDept").textContent = Array.isArray(user.departments)
  ? (user.departments.includes("ALL") ? "All Departments" : user.departments.join(", "))
  : "No department";

// ------------------ Sidebar ------------------
const nav = document.getElementById("nav");
const title = document.getElementById("sectionTitle");
const content = document.getElementById("sectionContent");

// Finance external URL (placeholder)
const FINANCE_URL = "https://finance.example.com"; 

function hasAccess(section) {
  return user.departments?.includes("ALL") || user.departments?.includes(section);
}

// ------------------ Load Modules Dynamically ------------------
async function loadSections() {
  try {
    // Fetch all dashboard sections from Firestore
    const q = query(collection(db, "modules"), orderBy("order", "asc"));
    const snapshot = await getDocs(q);

    snapshot.forEach(docSnap => {
      const section = docSnap.data();
      if (!hasAccess(section.name)) return;

      // Create list item
      const li = document.createElement("li");
      li.classList.add("nav-section");

      // Header
      const header = document.createElement("div");
      header.classList.add("nav-header");
      header.innerHTML = `<span>${section.name}</span><span class="chevron">▸</span>`;

      // Submenu
      const submenu = document.createElement("ul");
      submenu.classList.add("submenu");

      // Default items from Firestore (array of strings)
      section.items.forEach(item => {
        const subLi = document.createElement("li");
        subLi.textContent = item;
        subLi.onclick = () => {
          title.textContent = `${section.name} — ${item}`;
          content.innerHTML = `
            <h3>${item}</h3>
            <p>${item} for <strong>${section.name}</strong> will appear here.</p>
          `;
        };
        submenu.appendChild(subLi);
      });

      // Accordion toggle
      header.addEventListener("click", () => {
        header.classList.toggle("active");
        submenu.classList.toggle("open");
      });

      li.appendChild(header);
      li.appendChild(submenu);
      nav.appendChild(li);
    });

    // ------------------ Append Finance at the Bottom ------------------
    if (hasAccess("Finance")) {
      const financeLi = document.createElement("li");
      financeLi.classList.add("nav-section");

      const financeBtn = document.createElement("div");
      financeBtn.classList.add("nav-header");
      financeBtn.innerHTML = `<span>Finance</span>`;

      financeBtn.onclick = () => {
        window.open(FINANCE_URL, "_blank", "noopener,noreferrer");
      };

      financeLi.appendChild(financeBtn);
      nav.appendChild(financeLi);
    }

  } catch (err) {
    console.error("Error loading dashboard modules:", err);
    content.innerHTML = "<p>Failed to load dashboard modules. Refresh the page.</p>";
  }
}

// Initialize
loadSections();

// ------------------ Logout ------------------
window.logout = async function () {
  try {
    localStorage.removeItem("user");
    await signOut(auth);
  } catch (e) {
    console.warn("Logout issue:", e);
  } finally {
    window.location.href = "login.html";
  }
};
