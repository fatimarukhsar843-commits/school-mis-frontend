const API_URL = "http://localhost:5000/api/students"

export async function getStudents() {
  const res = await fetch(API_URL)
  return res.json()
}

export async function getStudentsByClass(className) {
  const all = await getStudents()
  return all.filter((s) => s.className === className)
}

export async function getStudentById(id) {
  const res = await fetch(`${API_URL}/${id}`)
  return res.json()
}

export async function getStudentsByParentEmail(email) {
  const all = await getStudents()
  return all.filter((s) => s.parentEmail === email)
}

export async function addStudent(student) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(student),
  })
  return res.json()
}

export async function updateStudent(id, updates) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })
  return res.json()
}

export async function deleteStudent(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  })
  return res.json()
}