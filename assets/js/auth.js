// assets/js/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔹 Firebase config (UNCHANGED)
const firebaseConfig = {
  apiKey: "AIzaSyCZ5L0dUrVt0MK5DDGuWZQlBOMitKYUuag",
  authDomain: "bethany-system.firebaseapp.com",
  projectId: "bethany-system",
  storageBucket: "bethany-system.firebasestorage.app",
  messagingSenderId: "267285501238",
  appId: "1:267285501238:web:b039650181d6c14b3acf97"
};

// 🔹 Initialize Firebase (UNCHANGED)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🔹 UI elements (from new UI – safe if present)
const loginBtn = document.getElementById("loginBtn");
const errorDiv = document.getElementById("loginError");
const errorMsg = document.getElementById("errorMsg");

// 🔹 Unified login function (your original logic + new UI feedback)
window.login = async function () {
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!email || !password) {
    showError("Please enter both email and password.");
    return;
  }

  setLoading(true);

  try {
    // 1️⃣ Authenticate via Firebase Auth (UNCHANGED LOGIC)
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    // 2️⃣ Load user document from Firestore (UNCHANGED LOGIC)
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      showError("User profile not found. Contact admin.");
      setLoading(false);
      return;
    }

    const userData = userSnap.data();

    if (!userData.active) {
      showError("Your account is deactivated. Contact admin.");
      setLoading(false);
      return;
    }

    // 3️⃣ Store minimal user info in localStorage (UNCHANGED LOGIC)
    localStorage.setItem("user", JSON.stringify({
      uid: uid,
      full_name: userData.full_name,
      email: userData.email,
      departments: userData.departments,
      role: userData.role
    }));

    // 4️⃣ Redirect to dashboard (UNCHANGED LOGIC)
    window.location.href = "dashboard.html";

  } catch (err) {
    console.error("Login failed:", err);
    showError("Login failed: " + err.message);
    setLoading(false);
  }
};

// 🔹 Optional button wiring (keeps both methods working)
if (loginBtn) {
  loginBtn.onclick = () => window.login();
}

// 🔹 UI helpers (from new UI – no logic changes)
function showError(msg) {
  if (errorDiv && errorMsg) {
    errorDiv.classList.remove("hidden");
    errorMsg.textContent = msg;
  } else {
    alert(msg); // fallback for old UI
  }
}

function setLoading(isLoading) {
  if (!loginBtn) return;

  if (isLoading) {
    loginBtn.disabled = true;
    loginBtn.innerHTML = `<i class="fas fa-circle-notch animate-spin"></i> <span>Verifying...</span>`;
  } else {
    loginBtn.disabled = false;
    loginBtn.innerHTML = `<span>Secure Sign In</span> <i class="fas fa-chevron-right text-xs"></i>`;
  }
}
