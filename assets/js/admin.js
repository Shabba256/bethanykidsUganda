// assets/js/admin.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// ------------------ Auth Guard ------------------
let user = null;
try {
  user = JSON.parse(localStorage.getItem("user"));
} catch { user = null; }

if (!user) window.location.href = "login.html";

// ------------------ Super Admin Check ------------------
async function verifyAdmin() {
  const snap = await getDoc(doc(db, "admins", user.uid));
  if (!snap.exists() || snap.data().role !== "super_admin") {
    alert("Access denied. Super Admin only.");
    window.location.href = "dashboard.html";
  }
}

verifyAdmin();

// ------------------ UI Switching ------------------
const title = document.getElementById("adminTitle");
const content = document.getElementById("adminContent");

document.querySelectorAll(".admin-nav li").forEach(li => {
  li.onclick = () => {
    const view = li.dataset.view;

    title.textContent = view.toUpperCase();

    content.innerHTML = `
      <h3>${view.replace("_", " ").toUpperCase()}</h3>
      <p>Coming next…</p>
    `;
  };
});

// ------------------ Logout ------------------
window.logout = async () => {
  localStorage.removeItem("user");
  await signOut(auth);
  window.location.href = "login.html";
};
