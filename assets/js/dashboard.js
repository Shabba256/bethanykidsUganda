// dashboard.js

// 🔥 Same Firebase config as auth.js
const firebaseConfig = {
  apiKey: "AIzaSyCZ5L0dUrVt0MK5DDGuWZQlBOMitKYUuag",
  authDomain: "bethany-system.firebaseapp.com",
  projectId: "bethany-system",
  storageBucket: "bethany-system.firebasestorage.app",
  messagingSenderId: "267285501238",
  appId: "1:267285501238:web:b039650181d6c14b3acf97"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

const nav = document.getElementById("nav");
const title = document.getElementById("sectionTitle");
const content = document.getElementById("sectionContent");
const userNameEl = document.getElementById("userName");
const userDeptEl = document.getElementById("userDept");

const ALL_SECTIONS = [
  "Paediatric Surgery",
  "Rehabilitation",
  "Psychosocial & Spiritual Support",
  "HR",
  "Finance"
];

// Protect page + load user
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const doc = await db.collection("users").doc(user.uid).get();

  if (!doc.exists) {
    alert("User profile missing");
    await auth.signOut();
    window.location.href = "login.html";
    return;
  }

  const profile = doc.data();

  if (!profile.active) {
    alert("Account deactivated. Contact admin.");
    await auth.signOut();
    window.location.href = "login.html";
    return;
  }

  userNameEl.textContent = profile.full_name || profile.email;

  const departments = profile.departments || [];
  userDeptEl.textContent = departments.includes("ALL")
    ? "All Departments"
    : departments.join(", ");

  buildSidebar(departments);
});

function hasAccess(departments, section) {
  return departments.includes("ALL") || departments.includes(section);
}

function buildSidebar(departments) {
  nav.innerHTML = "";

  ALL_SECTIONS.forEach(section => {
    if (!hasAccess(departments, section)) return;

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
}

// Logout
async function logout() {
  await auth.signOut();
  window.location.href = "login.html";
}

window.logout = logout;
