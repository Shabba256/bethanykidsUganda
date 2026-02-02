// assets/js/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔹 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCZ5L0dUrVt0MK5DDGuWZQlBOMitKYUuag",
  authDomain: "bethany-system.firebaseapp.com",
  projectId: "bethany-system",
  storageBucket: "bethany-system.firebasestorage.app",
  messagingSenderId: "267285501238",
  appId: "1:267285501238:web:b039650181d6c14b3acf97"
};

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🔹 Login function
window.login = async function () {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  try {
    // 1️⃣ Authenticate via Firebase Auth
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    // 2️⃣ Load user document from Firestore
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("User profile not found. Contact admin.");
      return;
    }

    const userData = userSnap.data();

    if (!userData.active) {
      alert("Your account is deactivated. Contact admin.");
      return;
    }

    // 3️⃣ Store minimal user info in localStorage for dashboard
    //    (this is safe, we don't store password or sensitive info)
    localStorage.setItem("user", JSON.stringify({
      uid: uid,
      full_name: userData.full_name,
      email: userData.email,
      departments: userData.departments,
      role: userData.role
    }));

    // 4️⃣ Redirect to dashboard
    window.location.href = "dashboard.html";

  } catch (err) {
    console.error("Login failed:", err);
    alert("Login failed: " + err.message);
  }
};
