import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, deleteDoc, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ------------------ Firebase ------------------
const firebaseConfig = {
  apiKey: "AIzaSyCZ5L0dUrVt0MK5DDGuWZQlBOMitKYUuag",
  authDomain: "bethany-system.firebaseapp.com",
  projectId: "bethany-system",
  storageBucket: "bethany-system-firebasestorage.app",
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

// ------------------ UI Elements ------------------
const title = document.getElementById("adminTitle");
const content = document.getElementById("adminContent");
const duplicateSection = document.getElementById("duplicateFormSection");
const manageFormsSection = document.getElementById("manageFormsSection");
const newFormSection = document.getElementById("newFormSection");

const deptSelect = document.getElementById("departmentSelect");
const versionSelect = document.getElementById("versionSelect");
const duplicateBtn = document.getElementById("duplicateBtn");
const duplicateStatus = document.getElementById("duplicateStatus");

const formsTableBody = document.getElementById("formsTableBody");

// Edit modal
const editModal = document.getElementById("editFormModal");
const editTitle = document.getElementById("editTitle");
const editDescription = document.getElementById("editDescription");
const editImage = document.getElementById("editImage");
const fieldsContainer = document.getElementById("fieldsContainer");
const addFieldBtn = document.getElementById("addFieldBtn");
const saveEditBtn = document.getElementById("saveEditBtn");
const editStatus = document.getElementById("editStatus");

// New Form Fields
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

    if(view==="duplicate"){ duplicateSection.style.display="block"; await loadDepartments(); }
    else if(view==="forms"){ manageFormsSection.style.display="block"; await loadManageForms(); }
    else if(view==="newForm"){ newFormSection.style.display="block"; }
    else{ content.innerHTML=`<h3>${view.toUpperCase()}</h3><p>Coming next…</p>`; }
  };
});

// ------------------ Duplicate Form ------------------
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
  Array.from(departmentsSet).forEach(dep=>{
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
  try{ await addDoc(collection(db,"forms"), newForm); duplicateStatus.textContent=`Form duplicated as v${newVersion}`; await loadDepartments(); }
  catch(err){ console.error(err); duplicateStatus.textContent="Error duplicating form"; }
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
        <button onclick="activateForm('${f.id}','${f.department}')">Activate</button>
        <button onclick="editForm('${f.id}')">Edit</button>
        <button onclick="deleteForm('${f.id}')">Delete</button>
      </td>`;
    formsTableBody.appendChild(tr);
  });
}

window.activateForm = async (formId, dept)=>{
  try{
    const snap = await getDocs(collection(db,"forms"));
    const batch=[];
    snap.forEach(docSnap=>{
      const data = docSnap.data();
      if(data.department===dept){ batch.push(updateDoc(doc(db,"forms",docSnap.id),{is_active:docSnap.id===formId})); }
    });
    await Promise.all(batch); await loadManageForms(); alert("Activated!");
  }catch(err){ console.error(err); alert("Error activating"); }
};

window.deleteForm = async (formId)=>{
  if(!confirm("Delete this form?")) return;
  try{ await deleteDoc(doc(db,"forms",formId)); await loadManageForms(); alert("Deleted!"); }
  catch(err){ console.error(err); alert("Error deleting"); }
};

// ------------------ Edit Form with Dynamic Fields, Drag & Drop, Options ------------------
window.editForm = async (formId)=>{
  currentEditId=formId;
  const form = allForms.find(f=>f.id===formId);
  editTitle.value=form.title||"";
  editDescription.value=form.description||"";
  editImage.value=form.image_url||"";
  fieldsContainer.innerHTML="";

  if(form.fields && form.fields.length){
    form.fields.forEach(fld=>{
      addFieldInput(fld.name,fld.type,fld.required||false,fld.options||[]);
    });
  }

  editStatus.textContent="";
  editModal.style.display="block";
};

// Drag & Drop with Sortable.js
import Sortable from "https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/modular/sortable.esm.js";
Sortable.create(fieldsContainer, { animation:150 });

// Add Field Input with options
function addFieldInput(name="", type="text", required=false, options=[]){
  const div = document.createElement("div");
  div.className="fieldRow"; 
  div.style="margin-bottom:5px; display:flex; gap:5px; align-items:center; flex-wrap:wrap;";
  div.innerHTML=`
    <input placeholder="Field Name" value="${name}" class="fieldName" required>
    <select class="fieldType">
      <option value="text">Text</option>
      <option value="number">Number</option>
      <option value="textarea">Textarea</option>
      <option value="dropdown">Dropdown</option>
      <option value="radio">Radio</option>
      <option value="checkbox">Checkbox</option>
    </select>
    <label><input type="checkbox" class="fieldRequired" ${required?"checked":""}>Required</label>
    <button class="removeFieldBtn">Remove</button>
    <textarea class="fieldOptions" placeholder="Options (comma separated)" style="display:none;">${options.join(",")}</textarea>`;
  
  const typeSelect = div.querySelector(".fieldType");
  const optionsInput = div.querySelector(".fieldOptions");
  
  typeSelect.value = type;
  if(["dropdown","radio","checkbox"].includes(type)){ optionsInput.style.display="block"; }

  typeSelect.onchange = ()=> {
    if(["dropdown","radio","checkbox"].includes(typeSelect.value)){ optionsInput.style.display="block"; }
    else{ optionsInput.style.display="none"; optionsInput.value=""; }
  }

  div.querySelector(".removeFieldBtn").onclick=()=>div.remove();
  fieldsContainer.appendChild(div);
}

addFieldBtn.onclick=()=>addFieldInput();

// Save Edited Form with Validation and options
saveEditBtn.onclick=async ()=>{
  if(!currentEditId) return;
  const fields=[];
  let invalid=false;
  fieldsContainer.querySelectorAll(".fieldRow").forEach(r=>{
    const name = r.querySelector(".fieldName").value.trim();
    const type = r.querySelector(".fieldType").value;
    const required = r.querySelector(".fieldRequired").checked;
    const optionsInput = r.querySelector(".fieldOptions");
    let options = [];
    if(["dropdown","radio","checkbox"].includes(type)){
      options = optionsInput.value.split(",").map(o=>o.trim()).filter(o=>o);
      if(options.length===0){ invalid=true; return; } // must have at least one option
    }
    if(!name){ invalid=true; return; }
    fields.push({name,type,required,options});
  });
  if(invalid){ editStatus.textContent="All fields must have a name, and options for choice fields cannot be empty."; return; }
  try{
    await updateDoc(doc(db,"forms",currentEditId),{
      title:editTitle.value,
      description:editDescription.value,
      image_url:editImage.value,
      fields:fields
    });
    editStatus.textContent="Updated!";
    await loadManageForms();
    setTimeout(closeEditModal,1000);
  }catch(err){ console.error(err); editStatus.textContent="Error updating"; }
};

window.closeEditModal=()=>{ editModal.style.display="none"; currentEditId=null; };

// ------------------ New Department / Form ------------------
createFormBtn.onclick=async ()=>{
  const dept=newDepartment.value.trim();
  const titleVal=newFormTitle.value.trim();
  if(!dept||!titleVal){ newFormStatus.textContent="Department and Title required."; return; }
  try{
    const newFormDoc={department:dept, version:1, is_active:false, title:titleVal, description:newFormDescription.value, image_url:newFormImage.value, created_by:user.uid, created_at:Timestamp.now(), fields:[]};
    await addDoc(collection(db,"forms"), newFormDoc);
    newFormStatus.textContent="Draft form created!";
    newDepartment.value=""; newFormTitle.value=""; newFormDescription.value=""; newFormImage.value="";
    await loadDepartments(); await loadManageForms();
  }catch(err){ console.error(err); newFormStatus.textContent="Error creating form"; }
};

// ------------------ Logout ------------------
window.logout=async ()=>{ localStorage.removeItem("user"); await signOut(auth); window.location.href="login.html"; };
