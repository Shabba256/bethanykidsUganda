// assets/js/dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


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

// 🔹 Load user from localStorage
const user = JSON.parse(localStorage.getItem("user"));
if (!user) window.location.href = "login.html";

// Set profile info
document.getElementById("userName").textContent = user.full_name || user.email;
document.getElementById("userDept").textContent = user.departments.includes("ALL")
  ? "All Departments"
  : user.departments.join(", ");

// Sidebar sections
const sections = [
  "Paediatric Surgery",
  "Rehabilitation",
  "Psychosocial & Spiritual Support",
  "HR",
  "Finance"
];

const nav = document.getElementById("nav");
const title = document.getElementById("sectionTitle");
const content = document.getElementById("sectionContent");

function hasAccess(section) {
  return user.departments.includes("ALL") || user.departments.includes(section);
}

// Build sidebar nav
sections.forEach(section => {
  if (!hasAccess(section)) return;

  const li = document.createElement("li");
  li.classList.add("nav-section");

  const header = document.createElement("div");
  header.classList.add("nav-header");
  header.innerHTML = `<span>${section}</span><span class="chevron">▸</span>`;

  const submenu = document.createElement("ul");
  submenu.classList.add("submenu");

  ["Forms", "Records", "Reports"].forEach(item => {
    const subLi = document.createElement("li");
    subLi.textContent = item;
    subLi.onclick = () => {
      title.textContent = `${section} — ${item}`;
      content.innerHTML = `
        <h3>${item}</h3>
        <p>${item} for <strong>${section}</strong> will appear here.</p>
      `;
    };
    submenu.appendChild(subLi);
  });

  header.addEventListener("click", () => {
    header.classList.toggle("active");
    submenu.classList.toggle("open");
  });

  li.appendChild(header);
  li.appendChild(submenu);
  nav.appendChild(li);
});

// 🔹 Logout button
window.logout = async function () {
  localStorage.removeItem("user");
  await signOut(auth);
  window.location.href = "login.html";
};
