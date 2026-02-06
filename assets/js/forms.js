import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore, doc, getDoc, collection, addDoc, Timestamp 
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

// ------------------ UI ------------------
const formContainer = document.getElementById("formContainer");
const formTitle = document.getElementById("formTitle");
const formDesc = document.getElementById("formDesc");
const formImage = document.getElementById("formImage");
const formMsg = document.getElementById("formMsg");

// ------------------ Helpers ------------------
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// ------------------ Load Form by document ID ------------------
async function loadForm() {
  const formId = getQueryParam("form");

  if (!formId) {
    formContainer.innerHTML = "<p>No form selected.</p>";
    return;
  }

  const snap = await getDoc(doc(db, "forms", formId));

  if (!snap.exists()) {
    formContainer.innerHTML = "<p>Form not found.</p>";
    return;
  }

  const form = snap.data();

  if (!form.is_active) {
    formContainer.innerHTML = "<p>This form is inactive.</p>";
    return;
  }

  formTitle.textContent = form.title;
  formDesc.textContent = form.description || "";
  formImage.src = form.image_url || "";

  let html = `<form id="dynamicForm">`;

  form.fields.forEach(f => {
    html += `<div class="form-group">
      <label class="form-label">${f.label}</label>
      <input type="${f.type || "text"}" name="${f.key}" class="form-input" ${f.required ? "required" : ""}/>
    </div>`;
  });

  html += `<button type="submit" class="form-submit">Submit</button></form>`;
  formContainer.innerHTML = html;

  document.getElementById("dynamicForm").addEventListener("submit", async e => {
    e.preventDefault();
    formMsg.textContent = "";
    formMsg.className = "form-msg";

    const data = {};
    form.fields.forEach(f => {
      data[f.key] = e.target[f.key].value.trim();
    });

    data.form_id = formId;
    data.department = form.department;
    data.submitted_by = user.uid;
    data.submitted_at = Timestamp.fromDate(new Date());

    try {
      await addDoc(collection(db, "submissions"), data);
      e.target.reset();
      formMsg.textContent = "Form submitted successfully!";
      formMsg.className = "form-msg success";
    } catch (err) {
      console.error(err);
      formMsg.textContent = "Submission failed. Try again.";
      formMsg.className = "form-msg error";
    }
  });
}

// ------------------ Init ------------------
loadForm();

// ------------------ Logout ------------------
window.logout = async () => {
  localStorage.removeItem("user");
  await signOut(auth);
  window.location.href = "login.html";
};