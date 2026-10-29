const API = "http://localhost:5000/api/users"

async function request(url, options) {
  const res = await fetch(url, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || "Something went wrong")
  return data
}

function json(method, body) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }
}

export function getUsers(role) {
  return request(`${API}?role=${role}`)
}

export function createUser(user) {
  return request(API, json("POST", user))
}

export function updateUser(id, updates) {
  return request(`${API}/${id}`, json("PUT", updates))
}

export function deleteUser(id) {
  return request(`${API}/${id}`, { method: "DELETE" })
}

// Create a teacher/parent login, or reset its password if it already exists
export function setLogin(login) {
  return request(`${API}/set-login`, json("POST", login))
}

export function deleteLoginByEmail(email, role) {
  return request(`${API}/by-email?email=${encodeURIComponent(email)}&role=${role}`, {
    method: "DELETE",
  })
}

export function parentSignup(data) {
  return request(`${API}/parent-signup`, json("POST", data))
}