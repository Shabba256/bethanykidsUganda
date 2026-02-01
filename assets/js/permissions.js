// permissions.js
async function hasAccess(department) {
  const user = firebase.auth().currentUser;
  if (!user) return false;

  const doc = await firebase.firestore().collection("users").doc(user.uid).get();
  const data = doc.data();

  return data.departments.includes("ALL") || data.departments.includes(department);
}
