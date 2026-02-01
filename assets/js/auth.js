// auth.js

// 🔥 Firebase config (paste yours from Firebase Console > Project Settings)
const firebaseConfig = {
  apiKey: "AIzaSyCZ5L0dUrVt0MK5DDGuWZQlBOMitKYUuag",
  authDomain: "bethany-system.firebaseapp.com",
  projectId: "bethany-system",
  storageBucket: "bethany-system.firebasestorage.app",
  messagingSenderId: "267285501238",
  appId: "1:267285501238:web:b039650181d6c14b3acf97"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  try {
    // 1️⃣ Firebase Auth login
    const cred = await auth.signInWithEmailAndPassword(email, password);
    const uid = cred.user.uid;

    // 2️⃣ Fetch user profile from Firestore
    const doc = await db.collection("users").doc(uid).get();

    if (!doc.exists) {
      alert("User profile not found in database");
      return;
    }

    const user = doc.data();

    if (!user.active) {
      alert("Your account has been deactivated. Contact admin.");
      await auth.signOut();
      return;
    }

    // 3️⃣ Save user session
    sessionStorage.setItem("user", JSON.stringify({
      uid,
      ...user
    }));

    // 4️⃣ Redirect to dashboard
    window.location.href = "dashboard.html";

  } catch (err) {
    alert(err.message);
  }
}
