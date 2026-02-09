import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// ------------------ Safe User Load ------------------
let user = null;
try { user = JSON.parse(localStorage.getItem("user")); } catch { user = null; }
if (!user) window.location.href = "login.html";

// ------------------ UI References ------------------
const userNameEl = document.getElementById("userName");
const userDeptEl = document.getElementById("userDept");
const userAvatarEl = document.getElementById("userAvatar");
const adminContainer = document.getElementById("adminLinkContainer");
const sectionTitle = document.getElementById("sectionTitle");
const sectionContent = document.getElementById("sectionContent");
const nav = document.getElementById("nav");

// ------------------ Profile ------------------
if(userNameEl) userNameEl.textContent = user.full_name;
if(userDeptEl) userDeptEl.textContent = user.departments && user.departments.length>0 ? user.departments[0] : user.role.replace('_',' ');
if(userAvatarEl){
  const names = user.full_name.split(' ');
  const initials = names.length>1 ? (names[0][0]+names[names.length-1][0]).toUpperCase() : names[0][0].toUpperCase();
  userAvatarEl.textContent = initials;
}

// ------------------ Super Admin ------------------
if(user.role==='super_admin' && adminContainer){
  adminContainer.innerHTML = `
    <button onclick="window.location.href='admin.html'" class="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center">
      <i class="fas fa-shield-halved mr-2"></i> Super Admin
    </button>
  `;
}

// ------------------ Welcome Screen ------------------
function renderWelcomeScreen() {
  sectionTitle.textContent = "Welcome";
  sectionContent.innerHTML = `
    <div class="space-y-12 animate-fade-in pb-20">
      <!-- HERO SECTION -->
      <div class="relative rounded-[40px] overflow-hidden h-[400px] shadow-2xl group">
        <img src="https://bethanykids.org/wp-content/uploads/2021/04/BethanyKids-Uganda-scaled.jpg" 
             class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
             alt="BethanyKids Uganda">
        <div class="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent flex items-center p-12 lg:p-20">
          <div class="max-w-xl space-y-6">
            <div class="inline-flex items-center space-x-2 bg-blue-600 px-4 py-2 rounded-full">
              <span class="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              <span class="text-[10px] font-black text-white uppercase tracking-[0.2em]">Operational Excellence</span>
            </div>
            <h1 class="text-4xl lg:text-5xl font-black text-white leading-tight">
              Healing children in <br><span class="text-blue-400">Uganda.</span>
            </h1>
            <p class="text-slate-300 text-sm leading-relaxed font-medium">
              Welcome to the Bethany IMS, ${user.full_name}. We are committed to transforming the lives of children with surgical conditions and disabilities across Africa. Use this portal to maintain clinical standards and data integrity.
            </p>
            <div class="flex space-x-4 pt-4">
              <button onclick="document.querySelector('.nav-header')?.click()" class="bg-white text-slate-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl">
                Start Data Entry
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CORE VALUES GRID -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
          <div class="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-xl mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <i class="fas fa-heartbeat"></i>
          </div>
          <h3 class="font-black text-slate-900 text-lg uppercase tracking-tight">Clinical Care</h3>
          <p class="text-slate-500 text-xs mt-4 leading-relaxed font-medium">
            Providing life-transforming surgical care for children with disabilities, ensuring every child receives the medical attention they deserve.
          </p>
        </div>

        <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
          <div class="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 text-xl mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <i class="fas fa-hand-holding-medical"></i>
          </div>
          <h3 class="font-black text-slate-900 text-lg uppercase tracking-tight">Rehabilitation</h3>
          <p class="text-slate-500 text-xs mt-4 leading-relaxed font-medium">
            Our holistic approach includes extensive physical therapy and rehabilitation at school-based centers to support long-term recovery.
          </p>
        </div>

        <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
          <div class="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 text-xl mb-6 group-hover:bg-amber-600 group-hover:text-white transition-all">
            <i class="fas fa-dove"></i>
          </div>
          <h3 class="font-black text-slate-900 text-lg uppercase tracking-tight">Spiritual Support</h3>
          <p class="text-slate-500 text-xs mt-4 leading-relaxed font-medium">
            Addressing the spiritual and psychosocial needs of patients and families, reflecting our mission of holistic healing.
          </p>
        </div>
      </div>

      <!-- REGIONAL IMPACT -->
      <div class="bg-slate-900 rounded-[40px] p-12 text-center text-white relative overflow-hidden shadow-2xl">
        <div class="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32"></div>
        <div class="relative z-10">
          <h2 class="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-4">Our Regional Footprint</h2>
          <div class="flex flex-col md:flex-row justify-center items-center gap-12 lg:gap-24 py-6">
            <div>
              <p class="text-5xl font-black mb-2">600+</p>
              <p class="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Surgeries Monthly</p>
            </div>
            <div class="w-px h-12 bg-slate-800 hidden md:block"></div>
            <div>
              <p class="text-5xl font-black mb-2">5</p>
              <p class="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Mobile Clinics</p>
            </div>
            <div class="w-px h-12 bg-slate-800 hidden md:block"></div>
            <div>
              <p class="text-5xl font-black mb-2">Uganda</p>
              <p class="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Kijabe Operations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ------------------ Logout ------------------
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    if(!confirm("End session and log out?")) return;
    localStorage.removeItem("user");
    await signOut(auth);
    window.location.href = "login.html";
  };
}

// ------------------ Load Modules ------------------
async function loadModules() {
  if(!nav) return;
  nav.innerHTML = "";

  try {
    const modSnap = await getDocs(query(collection(db, "modules"), orderBy("order", "asc")));
    const formSnap = await getDocs(query(collection(db, "forms"), where("is_active","==",true)));
    const allForms = formSnap.docs.map(d=>({ id:d.id, ...d.data() }));

    const canAccess = (dept) => user.departments.includes('ALL') || user.departments.includes(dept);

    modSnap.forEach(docSnap => {
      const mod = docSnap.data();
      if(!canAccess(mod.name)) return;

      if(mod.name==='HR'){ renderDirectButton(mod, nav); return; }
      if(mod.name==='Finance') return;

      const modDiv = document.createElement("div");
      modDiv.className="mb-2";

      const header = document.createElement("button");
      header.className="nav-header w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-800 transition-all text-sm font-semibold group";
      header.innerHTML = `
        <div class="flex items-center space-x-3">
          <i class="fas ${mod.icon||'fa-folder'} text-blue-500 opacity-60 group-hover:opacity-100 transition-opacity"></i>
          <span>${mod.name}</span>
        </div>
        <i class="fas fa-chevron-right text-[10px] opacity-20 transition-transform"></i>
      `;

      const submenu = document.createElement("div");
      submenu.className="hidden pl-10 pt-1 space-y-1";

      mod.items.forEach(item => {
        const subItem = document.createElement("button");
        subItem.className="w-full text-left py-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors border-l border-slate-800 pl-4 ml-1 hover:border-blue-600";
        subItem.textContent=item;

        subItem.onclick = async () => {
          sectionTitle.textContent = `${mod.name} / ${item}`;
          sectionContent.innerHTML = `<div class="flex flex-col items-center justify-center py-32 animate-pulse"><i class="fas fa-circle-notch animate-spin text-4xl text-blue-600 mb-4"></i><p class="text-slate-400 text-[10px] font-black uppercase tracking-widest">Accessing Clinical Records...</p></div>`;
          if(item.toLowerCase()==='forms') renderFormsList(mod.name, allForms);
          else if(item.toLowerCase()==='records'){
            const module = await import('./records.js');
            module.loadRecords(sectionContent,user,mod.name);
          } else if(item.toLowerCase()==='reports'){
            const module = await import('./reports.js');
            module.loadReports(sectionContent,mod.name);
          }
        };

        submenu.appendChild(subItem);
      });

      header.onclick = () => {
        const isOpen = !submenu.classList.contains("hidden");
        document.querySelectorAll(".submenu-active").forEach(el=>el.classList.add("hidden"));
        if(!isOpen){
          submenu.classList.remove("hidden");
          submenu.classList.add("submenu-active");
          header.querySelector(".fa-chevron-right").classList.add("rotate-90");
        } else header.querySelector(".fa-chevron-right").classList.remove("rotate-90");
      };

      modDiv.appendChild(header);
      modDiv.appendChild(submenu);
      nav.appendChild(modDiv);
    });

    if(canAccess('Finance')){
      const financeBtn = document.createElement("button");
      financeBtn.className="w-full flex items-center space-x-3 p-3.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white transition-all text-sm font-bold mt-4 shadow-sm";
      financeBtn.innerHTML=`<i class="fas fa-coins text-sm"></i><span>Finance Portal</span>`;
      financeBtn.onclick=()=>window.open('https://finance.example.com','_blank');
      nav.appendChild(financeBtn);
    }

  } catch(err){
    console.error("Module Load Error:", err);
    nav.innerHTML=`<p class="text-red-500 text-[10px] p-4 font-bold">Failed to load modules.</p>`;
  }
}

// ------------------ Helper Functions ------------------
function renderDirectButton(mod, nav){
  const btn = document.createElement("button");
  btn.className="w-full flex items-center space-x-3 p-3.5 rounded-xl hover:bg-slate-800 transition-all text-sm font-semibold mb-2 group";
  btn.innerHTML=`<i class="fas ${mod.icon||'fa-link'} text-blue-400 opacity-60 group-hover:opacity-100"></i><span>${mod.name} Portal</span>`;
  btn.onclick = ()=>{ window.open(mod.url||'https://finance.example.com','_blank'); };
  nav.appendChild(btn);
}

function renderFormsList(deptName, allForms){
  const deptForms = allForms.filter(f=>f.department===deptName);
  if(deptForms.length===0){
    sectionContent.innerHTML=`<div class="bg-white rounded-3xl p-24 text-center border border-dashed border-slate-200 animate-fade-in"><i class="fas fa-folder-open text-slate-100 text-7xl mb-6"></i><h3 class="text-slate-400 font-black uppercase tracking-widest text-xs">No active forms in ${deptName}</h3></div>`;
    return;
  }
  sectionContent.innerHTML=`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in"></div>`;
  const grid = sectionContent.querySelector("div");
  deptForms.forEach(f=>{
    const card=document.createElement("div");
    card.className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group flex flex-col h-full";
    card.innerHTML=`
      <div class="h-44 bg-slate-100 rounded-2xl mb-6 overflow-hidden relative">
        <img src="${f.image_url||'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400'}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
        <div class="absolute top-4 left-4 bg-blue-600 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-md tracking-widest">Clinical</div>
      </div>
      <h3 class="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors">${f.title}</h3>
      <p class="text-xs text-slate-500 mt-3 leading-relaxed flex-grow">${f.description||'Clinical data entry form.'}</p>
      <div class="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between text-blue-600 font-black text-[10px] uppercase tracking-widest">
        <span>Open Record Entry</span>
        <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
      </div>
    `;
    card.onclick=()=>window.location.href=`forms.html?form=${f.id}`;
    grid.appendChild(card);
  });
}

// ------------------ Init ------------------
loadModules();
renderWelcomeScreen();
