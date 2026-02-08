import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
const db = getFirestore(app);
const auth = getAuth(app);

const user = JSON.parse(localStorage.getItem("user"));
if (!user) window.location.href = "login.html";

const formContainer = document.getElementById("formContainer");
const formTitle = document.getElementById("formTitle");
const formDesc = document.getElementById("formDesc");
const formImage = document.getElementById("formImage");
const formMsg = document.getElementById("formMsg");
const homeBtn = document.getElementById("homeBtn");

async function initForm() {
  const formId = new URLSearchParams(window.location.search).get("form");
  if (!formId) {
    formContainer.innerHTML = `<div class="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No form selected.</div>`;
    return;
  }

  try {
    const snap = await getDoc(doc(db, "forms", formId));
    if (!snap.exists()) throw new Error("Form not found.");

    const form = snap.data();
    formTitle.textContent = form.title;
    formDesc.textContent = form.description || "Secure clinical entry";
    formImage.src = form.image_url || "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200";

    renderFields(form.fields, formId, form.department);
  } catch (err) {
    console.error(err);
    formContainer.innerHTML = `<div class="p-10 text-center text-red-500 font-bold">Failed to load form. Contact IT.</div>`;
  }
}

function renderFields(fields, formId, department) {
  const formEl = document.createElement("form");
  formEl.className = "space-y-8";

  fields.forEach(f => {
    const group = document.createElement("div");
    group.className = "flex flex-col space-y-2";

    const label = document.createElement("label");
    label.className = "text-sm font-black text-slate-700 uppercase tracking-widest";
    label.innerHTML = `${f.label} ${f.required ? '<span class="text-red-500 text-xs">*</span>' : ''}`;
    group.appendChild(label);

    if (f.type === "checkbox" || f.type === "radio") {
      if (!f.options || f.options.length === 0) return;
      f.options.forEach(opt => {
        const wrapper = document.createElement("div");
        wrapper.className = "flex items-center space-x-2";

        const input = document.createElement("input");
        input.type = f.type;
        input.name = f.key;
        input.value = opt;
        if (f.required) input.required = true;

        const optLabel = document.createElement("label");
        optLabel.className = "ml-2 text-slate-700";
        optLabel.textContent = opt;

        wrapper.appendChild(input);
        wrapper.appendChild(optLabel);
        group.appendChild(wrapper);
      });
    } else if (f.type === "select") {
      const select = document.createElement("select");
      select.name = f.key;
      select.required = f.required || false;
      select.className = "w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all";

      f.options.forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        select.appendChild(o);
      });
      group.appendChild(select);
    } else if (f.type === "textarea") {
      const ta = document.createElement("textarea");
      ta.name = f.key;
      ta.required = f.required || false;
      ta.className = "w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all h-32";
      group.appendChild(ta);
    } else {
      const input = document.createElement("input");
      input.type = f.type || "text";
      input.name = f.key;
      input.required = f.required || false;
      input.className = "w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all";
      group.appendChild(input);
    }

    formEl.appendChild(group);
  });

  const btn = document.createElement("button");
  btn.type = "submit";
  btn.className = "w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all uppercase tracking-widest text-sm";
  btn.innerHTML = `<i class="fas fa-paper-plane mr-3"></i> Save Clinical Record`;
  formEl.appendChild(btn);

  formEl.onsubmit = async e => {
    e.preventDefault();
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-circle-notch animate-spin mr-3"></i> Syncing...`;

    const data = { form_id: formId, department, submitted_by: user.uid, submitted_at: Timestamp.now() };

    fields.forEach(f => {
      if (f.type === "checkbox") {
        const els = formEl.querySelectorAll(`input[name="${f.key}"]:checked`);
        data[f.key] = Array.from(els).map(el => el.value);
      } else if (f.type === "radio") {
        const el = formEl.querySelector(`input[name="${f.key}"]:checked`);
        data[f.key] = el ? el.value : null;
      } else {
        data[f.key] = formEl[f.key].value;
      }
    });

    try {
      await addDoc(collection(db, "submissions"), data);
      formMsg.className = "mt-8 p-4 rounded-xl text-center font-bold bg-green-50 text-green-700 block animate-fade-in";
      formMsg.textContent = "Clinical record successfully synced.";
      setTimeout(() => window.location.href = "dashboard.html", 1500);
    } catch (err) {
      console.error(err);
      formMsg.className = "mt-8 p-4 rounded-xl text-center font-bold bg-red-50 text-red-700 block animate-fade-in";
      formMsg.textContent = "Sync failed. Check network or permissions.";
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-paper-plane mr-3"></i> Save Clinical Record`;
    }
  };

  formContainer.innerHTML = "";
  formContainer.appendChild(formEl);
}

initForm();

homeBtn.onclick = () => window.location.href = "dashboard.html";
window.logout = async () => {
  localStorage.removeItem("user");
  await signOut(auth);
  window.location.href = "login.html";
};
