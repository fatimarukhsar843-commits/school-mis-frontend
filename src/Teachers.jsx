const API_URL = "http://localhost:5000/api/teachers"

export async function getTeachers() {
  const res = await fetch(API_URL)
  return res.json()
}

export async function getTeacherById(id) {
  const res = await fetch(`${API_URL}/${id}`)
  return res.json()
}

// Finds the teacher record linked to a given login email — used by
// the Teacher Dashboard to know "which teacher is this person?"
export async function getTeacherByLoginEmail(email) {
  const all = await getTeachers()
  return all.find((t) => t.loginEmail === email)
}

export async function addTeacher(teacherData) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(teacherData),
  })
  return res.json()
}

export async function updateTeacher(id, updatedData) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedData),
  })
  return res.json()
}

export async function deleteTeacher(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  })
  return res.json()
}