const user = JSON.parse(localStorage.getItem("user"));

document.getElementById("userName").textContent =
  user.full_name || user.email;

document.getElementById("userDept").textContent =
  user.departments.includes("ALL")
    ? "All Departments"
    : user.departments.join(", ");

const sections = [
  "Paediatric Surgery",
  "Rehabilitation",
  "Psychosocial & Spiritual Support",
  "HR",
  "Finance"
];

const nav = document.getElementById("nav");
const title = document.getElementById("sectionTitle");
const content = document.getElementById("sectionContent");

function hasAccess(section) {
  return user.departments.includes("ALL") || user.departments.includes(section);
}

sections.forEach(section => {
  if (!hasAccess(section)) return;

  const li = document.createElement("li");
  li.classList.add("nav-section");

  const header = document.createElement("div");
  header.classList.add("nav-header");
  header.innerHTML = `<span>${section}</span><span class="chevron">▸</span>`;

  const submenu = document.createElement("ul");
  submenu.classList.add("submenu");

  ["Forms", "Records", "Reports"].forEach(item => {
    const subLi = document.createElement("li");
    subLi.textContent = item;
    subLi.onclick = () => {
      title.textContent = `${section} — ${item}`;
      content.innerHTML = `
        <h3>${item}</h3>
        <p>${item} for <strong>${section}</strong> will appear here.</p>
      `;
    };
    submenu.appendChild(subLi);
  });

  // Accordion toggle
  header.addEventListener("click", () => {
    header.classList.toggle("active");
    submenu.classList.toggle("open");
  });

  li.appendChild(header);
  li.appendChild(submenu);
  nav.appendChild(li);
});
