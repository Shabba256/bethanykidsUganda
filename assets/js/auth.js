// assets/js/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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

window.login = async function () {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please enter email and password.");
    return;
  }

  try {
    // Sign in with Firebase Auth
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    // Fetch user document from Firestore
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) {
      alert("User profile not found. Contact admin.");
      return;
    }

    const userData = userDoc.data();

    if (!userData.active) {
      alert("Your account is deactivated. Contact admin.");
      return;
    }

    // Store user info locally for dashboard
    localStorage.setItem("user", JSON.stringify(userData));

    // Redirect to dashboard
    window.location.href = "dashboard.html";

  } catch (err) {
    alert("Login failed: " + err.message);
  }
};
