import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// ------------------ UI Elements ------------------
const formContainer = document.getElementById("formContainer");
const formTitle = document.getElementById("formTitle");
const formDesc = document.getElementById("formDesc");
const formImage = document.getElementById("formImage");
const formMsg = document.getElementById("formMsg");

// ------------------ Helpers ------------------
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// ------------------ Load Form ------------------
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

  // ------------------ Render Form Fields ------------------
  const formEl = document.createElement("form");
  formEl.id = "dynamicForm";

  form.fields.forEach(f => {
    const wrapper = document.createElement("div");
    wrapper.className = "form-group";

    const labelEl = document.createElement("label");
    labelEl.className = "form-label";
    labelEl.textContent = f.label;
    wrapper.appendChild(labelEl);

    // Render based on type
    if (f.type === "text" || f.type === "number" || f.type === "date") {
      const input = document.createElement("input");
      input.type = f.type;
      input.name = f.key;
      input.required = f.required || false;
      input.className = "form-input";
      wrapper.appendChild(input);
    }
    else if (f.type === "textarea") {
      const textarea = document.createElement("textarea");
      textarea.name = f.key;
      textarea.required = f.required || false;
      textarea.className = "form-input";
      wrapper.appendChild(textarea);
    }
    else if (f.type === "select") {
      const select = document.createElement("select");
      select.name = f.key;
      select.required = f.required || false;
      select.className = "form-input";
      f.options.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        select.appendChild(option);
      });
      wrapper.appendChild(select);
    }
    else if (f.type === "radio") {
      f.options.forEach(opt => {
        const radioWrapper = document.createElement("div");
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = f.key;
        radio.value = opt;
        radio.required = f.required || false;

        const radioLabel = document.createElement("label");
        radioLabel.textContent = opt;

        radioWrapper.appendChild(radio);
        radioWrapper.appendChild(radioLabel);
        wrapper.appendChild(radioWrapper);
      });
    }
    else if (f.type === "checkbox") {
      f.options.forEach(opt => {
        const checkboxWrapper = document.createElement("div");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = f.key;
        checkbox.value = opt;

        const checkboxLabel = document.createElement("label");
        checkboxLabel.textContent = opt;

        checkboxWrapper.appendChild(checkbox);
        checkboxWrapper.appendChild(checkboxLabel);
        wrapper.appendChild(checkboxWrapper);
      });
    }

    formEl.appendChild(wrapper);
  });

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "form-submit";
  submitBtn.textContent = "Submit";
  formEl.appendChild(submitBtn);

  formContainer.innerHTML = "";
  formContainer.appendChild(formEl);

  // ------------------ Handle Submission ------------------
  formEl.addEventListener("submit", async e => {
    e.preventDefault();
    formMsg.textContent = "";
    formMsg.className = "form-msg";

    const data = {};

    form.fields.forEach(f => {
      if (f.type === "checkbox") {
        const checkedBoxes = Array.from(e.target[f.key])
          .filter(c => c.checked)
          .map(c => c.value);
        data[f.key] = checkedBoxes;
      }
      else if (f.type === "radio") {
        const selected = e.target[f.key].value;
        data[f.key] = selected;
      }
      else {
        data[f.key] = e.target[f.key].value.trim();
      }
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
