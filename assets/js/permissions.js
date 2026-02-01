function hasAccess(department) {
  const user = JSON.parse(localStorage.getItem("user"));
  return user.departments.includes(department);
}
