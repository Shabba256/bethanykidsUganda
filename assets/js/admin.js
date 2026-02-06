import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore, collection, getDocs, doc, getDoc, addDoc, deleteDoc, updateDoc, Timestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ------------------ Firebase ------------------
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
try { user = JSON.parse(localStorage.getItem("user")); } catch { user = null; }
if(!user) window.location.href="login.html";

// ------------------ Super Admin Check ------------------
async function verifyAdmin() {
  const snap = await getDoc(doc(db, "admins", user.uid));
  if(!snap.exists() || snap.data().role!=="super_admin") {
    alert("Access denied. Super Admin only.");
    window.location.href="dashboard.html";
  }
}
verifyAdmin();

// ------------------ UI ------------------
const title = document.getElementById("adminTitle");
const duplicateSection = document.getElementById("duplicateFormSection");
const manageFormsSection = document.getElementById("manageFormsSection");
const newFormSection = document.getElementById("newFormSection");

const deptSelect = document.getElementById("departmentSelect");
const versionSelect = document.getElementById("versionSelect");
const duplicateBtn = document.getElementById("duplicateBtn");
const duplicateStatus = document.getElementById("duplicateStatus");

const formsTableBody = document.getElementById("formsTableBody");

const editModal = document.getElementById("editFormModal");
const editTitle = document.getElementById("editTitle");
const editDescription = document.getElementById("editDescription");
const editImage = document.getElementById("editImage");
const fieldsContainer = document.getElementById("fieldsContainer");
const addFieldBtn = document.getElementById("addFieldBtn");
const saveEditBtn = document.getElementById("saveEditBtn");
const editStatus = document.getElementById("editStatus");

const newDepartment = document.getElementById("newDepartment");
const newFormTitle = document.getElementById("newFormTitle");
const newFormDescription = document.getElementById("newFormDescription");
const newFormImage = document.getElementById("newFormImage");
const createFormBtn = document.getElementById("createFormBtn");
const newFormStatus = document.getElementById("newFormStatus");

let allForms = [];
let currentEditId = null;

// ------------------ Navigation ------------------
document.querySelectorAll(".admin-nav li").forEach(li => {
  li.onclick = async () => {
    const view = li.dataset.view;
    title.textContent = view.toUpperCase();
    duplicateSection.style.display = "none";
    manageFormsSection.style.display = "none";
    newFormSection.style.display = "none";
    editModal.style.display = "none";

    if(view==="duplicate"){ 
      duplicateSection.style.display="block"; 
      await loadDepartments(); 
    }
    else if(view==="forms"){ 
      manageFormsSection.style.display="block"; 
      await loadManageForms(); 
    }
    else if(view==="newForm"){ 
      newFormSection.style.display="block"; 
    }
  };
});

// ------------------ Load Departments & Versions ------------------
async function loadDepartments(){
  const snap = await getDocs(collection(db,"forms"));
  allForms = [];
  const departmentsSet = new Set();
  snap.forEach(docSnap=>{
    const data = docSnap.data();
    allForms.push({...data, id:docSnap.id});
    departmentsSet.add(data.department);
  });
  deptSelect.innerHTML="<option value=''>--Select--</option>";
  [...departmentsSet].forEach(dep=>{
    const opt=document.createElement("option");
    opt.value=dep; opt.textContent=dep; deptSelect.appendChild(opt);
  });
  versionSelect.innerHTML="<option value=''>--Select Department First--</option>";
}

deptSelect.onchange = () => {
  const dept = deptSelect.value;
  const versions = allForms.filter(f=>f.department===dept);
  versionSelect.innerHTML="<option value=''>--Select Version--</option>";
  versions.forEach(f=>{
    const opt=document.createElement("option");
    opt.value=f.id;
    opt.textContent=`v${f.version} ${f.is_active?"(Active)":"(Inactive)"}`;
    versionSelect.appendChild(opt);
  });
};

duplicateBtn.onclick = async () => {
  const selectedId = versionSelect.value;
  if(!selectedId){ duplicateStatus.textContent="Select department & version."; return; }
  const formToDuplicate = allForms.find(f=>f.id===selectedId);
  const newVersion = formToDuplicate.version +1;
  const newForm = {...formToDuplicate, version:newVersion, is_active:false, created_by:user.uid, created_at:Timestamp.now()};
  delete newForm.id;
  await addDoc(collection(db,"forms"), newForm);
  duplicateStatus.textContent=`Form duplicated as v${newVersion}`;
  await loadDepartments();
};

// ------------------ Manage Forms ------------------
async function loadManageForms(){
  const snap = await getDocs(collection(db,"forms"));
  allForms=[]; formsTableBody.innerHTML="";
  snap.forEach(docSnap=>{
    const f={...docSnap.data(), id:docSnap.id};
    allForms.push(f);
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${f.department}</td><td>v${f.version}</td><td>${f.is_active?"✅ Active":"❌ Inactive"}</td>
      <td>
        <button onclick="editForm('${f.id}')">Edit</button>
        <button onclick="deleteForm('${f.id}')">Delete</button>
      </td>`;
    formsTableBody.appendChild(tr);
  });
}

window.deleteForm = async (formId)=>{
  if(!confirm("Delete this form?")) return;
  await deleteDoc(doc(db,"forms",formId));
  await loadManageForms();
};

// ------------------ Edit Form ------------------
window.editForm = async (formId)=>{
  currentEditId=formId;
  const form = allForms.find(f=>f.id===formId);
  editTitle.value=form.title||"";
  editDescription.value=form.description||"";
  editImage.value=form.image_url||"";
  fieldsContainer.innerHTML="";

  (form.fields||[]).forEach(f=>{
    addFieldInput(f.label,f.type,f.required,f.options||[]);
  });

  editModal.style.display="block";
};

// ------------------ Add Field Input (Text, Dropdown, Radio, Checkbox) ------------------
function addFieldInput(label="", type="text", required=false, options=[]){
  const div = document.createElement("div");
  div.className="fieldRow";
  div.innerHTML=`
    <input placeholder="Label" value="${label}" class="fieldName" required>

    <select class="fieldType">
      <option value="text">Text</option>
      <option value="number">Number</option>
      <option value="textarea">Textarea</option>
      <option value="date">Date</option>
      <option value="select">Dropdown</option>
      <option value="radio">Radio</option>
      <option value="checkbox">Checkbox</option>
    </select>

    <label><input type="checkbox" class="fieldRequired" ${required?"checked":""}>Required</label>

    <textarea class="fieldOptions" placeholder="Options (comma separated)" style="display:${["select","radio","checkbox"].includes(type)?"block":"none"};">${options.join(",")}</textarea>

    <button class="removeFieldBtn">Remove</button>
  `;

  const typeSelect = div.querySelector(".fieldType");
  const optionsInput = div.querySelector(".fieldOptions");
  typeSelect.value = type;

  typeSelect.onchange = ()=> {
    if(["select","radio","checkbox"].includes(typeSelect.value)){
      optionsInput.style.display = "block";
    } else {
      optionsInput.style.display = "none";
      optionsInput.value = "";
    }
  };

  div.querySelector(".removeFieldBtn").onclick=()=>div.remove();
  fieldsContainer.appendChild(div);
}

addFieldBtn.onclick=()=>addFieldInput();

// ------------------ Save Form ------------------
saveEditBtn.onclick = async ()=>{
  const fields=[];
  let invalid=false;

  fieldsContainer.querySelectorAll(".fieldRow").forEach(r=>{
    const label = r.querySelector(".fieldName").value.trim();
    const type = r.querySelector(".fieldType").value;
    const required = r.querySelector(".fieldRequired").checked;
    const options = r.querySelector(".fieldOptions").value
      .split(",").map(o=>o.trim()).filter(Boolean);

    if(!label) invalid=true;
    if(["select","radio","checkbox"].includes(type) && options.length===0) invalid=true;

    fields.push({
      label,
      key: label.toLowerCase().replace(/\s+/g,"_"),
      type,
      required,
      options
    });
  });

  if(invalid){
    editStatus.textContent="Fix field names/options.";
    return;
  }

  await updateDoc(doc(db,"forms",currentEditId),{
    title:editTitle.value,
    description:editDescription.value,
    image_url:editImage.value,
    fields
  });

  editStatus.textContent="Saved!";
  setTimeout(()=>editModal.style.display="none",800);
  await loadManageForms();
};

// ------------------ New Form ------------------
createFormBtn.onclick=async ()=>{
  const dept=newDepartment.value.trim();
  const titleVal=newFormTitle.value.trim();
  if(!dept||!titleVal){ newFormStatus.textContent="Department and Title required."; return; }

  await addDoc(collection(db,"forms"),{
    department:dept,
    version:1,
    is_active:false,
    title:titleVal,
    description:newFormDescription.value,
    image_url:newFormImage.value,
    created_by:user.uid,
    created_at:Timestamp.now(),
    fields:[]
  });

  newFormStatus.textContent="Draft form created!";
  newDepartment.value=""; newFormTitle.value=""; newFormDescription.value=""; newFormImage.value="";
  await loadManageForms();
};

// ------------------ Logout ------------------
window.logout=async ()=>{
  localStorage.removeItem("user");
  await signOut(auth);
  window.location.href="login.html";
};
